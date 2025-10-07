const { Op } = require("sequelize");
const analyticsService = require('../utils/analyticsService');

const collections = {
  production: "Production",
  defects: "Defects",
  sales: "Sales",
};

// Field-to-table mapping to validate field selections
const FIELD_TABLE_MAP = {
  // Production table fields
  productId: ['production', 'defects', 'sales'], // Common field across tables
  quantity: ['production'],
  date: ['production', 'defects', 'sales'], // Common field across tables
  factory: ['production', 'defects'], // Common field in production and defects
  shift: ['production'],
  line: ['production'],
  id: ['production', 'defects', 'sales'], // ID field in all tables
  createdAt: ['production', 'defects', 'sales'], // Timestamp fields in all tables
  updatedAt: ['production', 'defects', 'sales'],
  
  // Defects table fields
  defectCount: ['defects'],
  type: ['defects'], // defect type
  severity: ['defects'],
  inspector: ['defects'],
  
  // Sales table fields
  region: ['sales'],
  amount: ['sales'],
  customerId: ['sales'],
  salesRep: ['sales'],
  channel: ['sales']
};

// Table relationship mapping for intelligent joins
const TABLE_RELATIONSHIPS = {
  production: {
    canJoinWith: ['defects', 'sales'],
    commonFields: {
      defects: ['productId', 'factory', 'date'],
      sales: ['productId', 'date']
    }
  },
  defects: {
    canJoinWith: ['production', 'sales'],
    commonFields: {
      production: ['productId', 'factory', 'date'],
      sales: ['productId', 'date']
    }
  },
  sales: {
    canJoinWith: ['production', 'defects'],
    commonFields: {
      production: ['productId', 'date'],
      defects: ['productId', 'date']
    }
  }
};

// Helper function to validate field selections against available tables
const validateFieldSelections = (selectedCollections, selectedFields) => {
  const errors = [];
  const warnings = [];
  const fieldTableMap = new Map(); // Track which fields belong to which tables
  
  // Validate each field
  selectedFields.forEach(field => {
    const availableTables = FIELD_TABLE_MAP[field];
    
    if (!availableTables) {
      errors.push(`Unknown field: ${field}`);
      return;
    }
    
    // Check if field is available in any of the selected collections
    const compatibleTables = availableTables.filter(table => 
      selectedCollections.includes(table)
    );
    
    if (compatibleTables.length === 0) {
      errors.push(`Field '${field}' is not available in any of the selected tables: ${selectedCollections.join(', ')}`);
      return;
    }
    
    // Map field to its compatible tables
    fieldTableMap.set(field, compatibleTables);
    
    if (compatibleTables.length > 1) {
      warnings.push(`Field '${field}' exists in multiple selected tables: ${compatibleTables.join(', ')}. Will use from primary table.`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fieldTableMap
  };
};

// Helper function to validate table joins
const validateTableJoins = (selectedCollections, selectedFields) => {
  const errors = [];
  const warnings = [];
  
  if (selectedCollections.length < 2) {
    return { isValid: true, errors, warnings };
  }

  // Check if all tables can be joined
  for (let i = 0; i < selectedCollections.length; i++) {
    const table1 = selectedCollections[i];
    const table1Relationships = TABLE_RELATIONSHIPS[table1];
    
    if (!table1Relationships) {
      errors.push(`Unknown table: ${table1}`);
      continue;
    }

    for (let j = i + 1; j < selectedCollections.length; j++) {
      const table2 = selectedCollections[j];
      
      if (!table1Relationships.canJoinWith.includes(table2)) {
        errors.push(`Cannot join ${table1} with ${table2} - no relationship defined`);
      }
    }
  }
  
  return { isValid: errors.length === 0, errors, warnings };
};

const generateReport = (models) => async (req, res, next) => {
  const startTime = Date.now();
  let sessionId;
  
  try {
    const { dataModel, visualization, filters } = req.body;

    // Track report generation request
    sessionId = analyticsService.trackReportGeneration({
      fields: dataModel?.fields,
      collections: dataModel?.collections,
      visualization,
      aggregations: dataModel?.aggregations,
      filters
    });

    if (!dataModel || !visualization) {
      return res.status(400).json({
        success: false,
        error: "Data model and visualization settings are required",
      });
    }

    const {
      collections: selectedCollections,
      fields,
      aggregations,
    } = dataModel;

    if (!selectedCollections.length || !fields.length) {
      return res.status(400).json({
        success: false,
        error: "At least one collection and one field must be selected",
      });
    }

    // Validate field selections first
    const fieldValidation = validateFieldSelections(selectedCollections, fields);
    if (!fieldValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: `Field validation failed: ${fieldValidation.errors.join(', ')}`,
        details: {
          errors: fieldValidation.errors,
          warnings: fieldValidation.warnings,
          suggestion: "Please check your field selections and try again"
        }
      });
    }

    // Validate multi-table joins
    if (selectedCollections.length > 1) {
      const joinValidation = validateTableJoins(selectedCollections, fields);
      if (!joinValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: `Join validation failed: ${joinValidation.errors.join(', ')}`,
          details: joinValidation.errors
        });
      }
    }

    // Build the Sequelize query
    let queryOptions = {
      attributes: fields,
      where: {},
      raw: true,
    };

    // Apply filters
    if (filters) {
      if (filters.dateRange?.start && filters.dateRange?.end) {
        queryOptions.where.date = {
          [Op.between]: [
            new Date(filters.dateRange.start),
            new Date(filters.dateRange.end),
          ],
        };
      }
      if (filters.factory) {
        queryOptions.where.factory = { [Op.eq]: filters.factory };
      }
      if (filters.region) {
        queryOptions.where.region = { [Op.eq]: filters.region };
      }
      if (filters.productId) {
        queryOptions.where.productId = { [Op.eq]: filters.productId };
      }
    }

    // Apply aggregations
    if (aggregations?.length) {
      queryOptions.attributes = [];
      aggregations.forEach((agg) => {
        let sequelizeAgg;
        switch (agg.type) {
          case "sum":
            sequelizeAgg = [
              [
                models.sequelize.fn("SUM", models.sequelize.col(agg.field)),
                agg.field,
              ],
            ];
            break;
          case "count":
            sequelizeAgg = [
              [
                models.sequelize.fn("COUNT", models.sequelize.col(agg.field)),
                agg.field,
              ],
            ];
            break;
          case "average":
            sequelizeAgg = [
              [
                models.sequelize.fn("AVG", models.sequelize.col(agg.field)),
                agg.field,
              ],
            ];
            break;
          default:
            throw new Error(`Unsupported aggregation type: ${agg.type}`);
        }
        queryOptions.attributes.push(...sequelizeAgg);
        if (agg.groupBy) {
          queryOptions.group = [agg.groupBy];
        }
      });
    }

    // Handle single table vs multi-table queries
    let data;
    const queryStartTime = Date.now();
    
    if (selectedCollections.length === 1) {
      // Single table query - straightforward
      const model = models[collections[selectedCollections[0]]];
      
      // Filter fields to only include those available in this table
      const tableFields = fields.filter(field => {
        const availableTables = FIELD_TABLE_MAP[field] || [];
        return availableTables.includes(selectedCollections[0]);
      });
      
      queryOptions.attributes = tableFields.length > 0 ? tableFields : fields;
      data = await model.findAll(queryOptions);
      
      // Track single table query performance
      const queryEndTime = Date.now();
      analyticsService.trackQueryPerformance(sessionId, {
        type: 'single_table',
        tables: selectedCollections,
        conditions: Object.keys(queryOptions.where || {}),
        groupBy: queryOptions.group || [],
        orderBy: queryOptions.order || []
      }, queryEndTime - queryStartTime, data?.length || 0);
    } else {
      // Multi-table query - use union approach for cross-table field access
      console.log("Multi-table query detected, using union approach for cross-table fields");
      
      const allResults = [];
      
      // Query each table separately for fields that belong to it
      for (const tableName of selectedCollections) {
        const model = models[collections[tableName]];
        
        // Get fields that belong to this table
        const tableFields = fields.filter(field => {
          const availableTables = FIELD_TABLE_MAP[field] || [];
          return availableTables.includes(tableName);
        });
        
        if (tableFields.length === 0) {
          console.log(`No relevant fields for table ${tableName}, skipping`);
          continue;
        }
        
        // Build query options for this table
        const tableQueryOptions = {
          attributes: tableFields,
          where: { ...queryOptions.where },
          raw: true
        };
        
        // Apply table-specific filters
        if (filters) {
          // Only apply filters that are relevant to this table
          const filteredWhere = {};
          
          if (filters.dateRange?.start && filters.dateRange?.end && FIELD_TABLE_MAP.date?.includes(tableName)) {
            filteredWhere.date = {
              [Op.between]: [
                new Date(filters.dateRange.start),
                new Date(filters.dateRange.end),
              ],
            };
          }
          if (filters.factory && FIELD_TABLE_MAP.factory?.includes(tableName)) {
            filteredWhere.factory = { [Op.eq]: filters.factory };
          }
          if (filters.region && FIELD_TABLE_MAP.region?.includes(tableName)) {
            filteredWhere.region = { [Op.eq]: filters.region };
          }
          if (filters.productId && FIELD_TABLE_MAP.productId?.includes(tableName)) {
            filteredWhere.productId = { [Op.eq]: filters.productId };
          }
          
          tableQueryOptions.where = filteredWhere;
        }
        
        try {
          const tableData = await model.findAll(tableQueryOptions);
          
          // Add table identifier to each row
          const enrichedData = tableData.map(row => ({
            ...row,
            _sourceTable: tableName
          }));
          
          allResults.push(...enrichedData);
          console.log(`Retrieved ${tableData.length} records from ${tableName} table`);
        } catch (tableError) {
          console.error(`Error querying ${tableName} table:`, tableError.message);
          // Continue with other tables instead of failing completely
        }
      }
      
      data = allResults;
      
      // Track multi-table query performance
      const queryEndTime = Date.now();
      analyticsService.trackQueryPerformance(sessionId, {
        type: 'multi_table_union',
        tables: selectedCollections,
        conditions: Object.keys(queryOptions.where || {}),
        groupBy: queryOptions.group || [],
        orderBy: queryOptions.order || []
      }, queryEndTime - queryStartTime, data?.length || 0);
    }

    // Format data for visualization based on visualization type
    const totalExecutionTime = Date.now() - startTime;

    // Prepare outgoing data in a shape PreviewPane expects.
    // For grouped-table, build an envelope with { type: 'grouped-table', groupBy, columns, groups }
    let outgoingData = null;

    try {
      if (visualization && visualization.type === 'grouped-table') {
        // Determine groupBy field preference
        const groupBy = visualization.groupBy || visualization.xAxis || (fields && fields[0]);

        // Normalize rows
        const rows = Array.isArray(data) ? data : (data && data.data) || [];

        // Build columns from first row keys (exclude internal _sourceTable if present at consumer's choice)
        const columns = rows.length ? Object.keys(rows[0]).filter(k => k !== '_sourceTable') : (fields || []);

        // Group rows by groupBy value
        const groups = {};
        rows.forEach((row) => {
          const key = row && row[groupBy] !== undefined && row[groupBy] !== null ? String(row[groupBy]) : 'Unspecified';
          groups[key] = groups[key] || [];
          groups[key].push(row);
        });

        const payload = {
          type: 'grouped-table',
          groupBy,
          columns,
          groups
        };

        // Wrap as data.data so Canvas.jsx will extract the inner payload and pass to PreviewPane
        outgoingData = { data: payload };
      } else {
        // Default: return raw data as before. Preserve existing behavior so other visualizations are unaffected.
        outgoingData = Array.isArray(data) ? data : (data || []);
      }
    } catch (formatError) {
      console.error('Error formatting grouped-table payload:', formatError.message);
      outgoingData = Array.isArray(data) ? data : (data || []);
    }

    // Return successful response
    res.json({
      success: true,
      data: outgoingData,
      metadata: {
        totalRecords: Array.isArray(data) ? data.length : (data && data.length) || 0,
        collections: selectedCollections,
        fields: fields,
        visualizationType: visualization.type,
        executionTime: totalExecutionTime,
        sessionId: sessionId
      }
    });
  } catch (error) {
    console.error("Report generation error:", error);
    
    // Provide more specific error messages
    let errorMessage = "Failed to generate report";
    if (error.name === 'SequelizeValidationError') {
      errorMessage = "Data validation error: " + error.errors.map(e => e.message).join(', ');
    } else if (error.name === 'SequelizeDatabaseError') {
      errorMessage = "Database query error: Please check your field selections and try again";
    } else if (error.message.includes('column') || error.message.includes('field')) {
      errorMessage = "Selected field not found in database. Please verify your field selections.";
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = { generateReport };