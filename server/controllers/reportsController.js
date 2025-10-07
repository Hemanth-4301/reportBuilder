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

    // Validate field selections against available tables
    const errors = [];
    fields.forEach(field => {
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
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Field validation failed: ${errors.join(', ')}`,
        details: {
          errors: errors,
          suggestion: "Please check your field selections and try again"
        }
      });
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

    // Format data for visualization
    let reportData;

    // Determine x and y fields (use visualization hints if provided)
    const xField = (visualization && visualization.xAxis) || fields[0];
    // visualization.yAxis may be a single field or an array; prefer explicit config
    let yField = null;
    if (visualization && visualization.yAxis) {
      yField = Array.isArray(visualization.yAxis) ? visualization.yAxis[0] : visualization.yAxis;
    } else if (fields.length > 1) {
      yField = fields[1];
    } else {
      // Try to infer a numeric field from the data
      for (const f of fields) {
        if (data.some(r => typeof r[f] === 'number')) {
          yField = f;
          break;
        }
      }
      // Fallback to first field if nothing numeric found (will result in zeros)
      if (!yField) yField = fields[0];
    }

  // Diagnostic container
  const debugInfo = {};

  // Table visualization just returns rows and fields
    if (visualization.type === 'table') {
      reportData = {
        type: 'table',
        data: data,
        fields: fields,
        totalRecords: data.length
      };
    } else if (visualization.type === 'grouped-table') {
      // Build grouped-table envelope that PreviewPane expects (Canvas will extract data.data)
      const groupBy = visualization.groupBy || visualization.xAxis || (fields && fields[0]);
      // If previous logic formatted data as chart envelope (labels/datasets), try to recover raw rows
      let rows = [];
      if (Array.isArray(data)) {
        rows = data;
      } else if (data && Array.isArray(data.data)) {
        // data.data could be chart envelope; if so, there's no raw rows. Prefer the originally queried rows
        rows = data.data;
      } else if (Array.isArray(data)) {
        rows = data;
      } else {
        rows = Array.isArray(data) ? data : [];
      }
      const columns = rows.length ? Object.keys(rows[0]).filter(k => k !== '_sourceTable') : (fields || []);
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

      reportData = {
        type: 'grouped-table',
        data: payload,
        totalRecords: rows.length
      };
    } else if (visualization.type === 'multi-bar' && selectedCollections.length > 1) {
      // Multi-bar across tables: build common labels (unique x values) and align datasets
      const groupedByTable = {};
      const labels = [];
      const seen = new Set();

      // Group rows and build unique labels in encounter order
      data.forEach(row => {
        const table = row._sourceTable || 'unknown';
        if (!groupedByTable[table]) groupedByTable[table] = [];
        groupedByTable[table].push(row);

        const lab = row[xField] !== undefined && row[xField] !== null ? String(row[xField]) : 'N/A';
        if (!seen.has(lab)) {
          seen.add(lab);
          labels.push(lab);
        }
      });

      // Keep a reasonable max length
      const finalLabels = labels.slice(0, 50);

      const datasets = Object.keys(groupedByTable).map((tableName, index) => {
        const tableData = groupedByTable[tableName];

        // Determine the best Y field for this table (prefer explicit visualization.valueFields)
        const tableYField = (visualization && visualization.valueFields && visualization.valueFields.find(f => FIELD_TABLE_MAP[f] && FIELD_TABLE_MAP[f].includes(tableName)))
          || fields.find(f => FIELD_TABLE_MAP[f] && FIELD_TABLE_MAP[f].includes(tableName) && tableData.some(r => r[f] !== undefined && r[f] !== null))
          || fields.find(f => FIELD_TABLE_MAP[f] && FIELD_TABLE_MAP[f].includes(tableName));

        // Attach debug info for diagnostics (returned to caller)
        debugInfo[tableName] = {
          chosenYField: tableYField,
          sampleRow: tableData.length > 0 ? tableData[0] : null
        };

        const values = finalLabels.map(label => {
          const match = tableData.find(r => String(r[xField]) === label);
          if (!match) return 0;
          const val = tableYField ? match[tableYField] : undefined;
          return typeof val === 'number' ? val : (parseFloat(val) || 0);
        });

        return {
          label: tableName.charAt(0).toUpperCase() + tableName.slice(1),
          data: values,
          backgroundColor: `hsla(${index * 80}, 70%, 50%, 0.8)`,
          borderColor: `hsla(${index * 80}, 70%, 40%, 1)`,
          borderWidth: 1
        };
      });

      reportData = {
        type: 'multi-bar',
        data: {
          labels,
          datasets
        },
        totalRecords: data.length,
        tableCount: selectedCollections.length
      };
    } else {
      // Standard single chart (bar/line/pie etc.) - single dataset representing yField
      const labels = data.map(row => String(row[xField] || 'N/A')).slice(0, 50);
      const values = data.map(row => {
        const v = row[yField];
        return typeof v === 'number' ? v : (parseFloat(v) || 0);
      }).slice(0, 50);

      reportData = {
        type: visualization.type,
        data: {
          labels,
          datasets: [{
            label: yField || fields[0],
            data: values,
            backgroundColor: visualization.type === 'pie' ?
              values.map((_, i) => `hsla(${i * 36}, 70%, 50%, 0.8)`) :
              'rgba(54, 162, 235, 0.6)',
            borderColor: visualization.type === 'pie' ?
              values.map((_, i) => `hsla(${i * 36}, 70%, 40%, 1)`) :
              'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        totalRecords: data.length
      };
    }

    const totalExecutionTime = Date.now() - startTime;

    res.json({
      success: true,
      data: reportData,
      metadata: {
        executionTime: totalExecutionTime,
        recordCount: data.length,
        totalRecords: reportData?.totalRecords ?? data.length,
        collections: selectedCollections,
        joinType: selectedCollections.length > 1 ? 'multi-table' : 'single-table',
        fields: fields,
        visualization: visualization.type,
        executionTime: totalExecutionTime,
        debugInfo
      },
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
