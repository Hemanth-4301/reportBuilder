/**
 * Field Validation Service
 * Handles field compatibility validation, chart type rules, and user guidance
 */

// Chart type compatibility rules
const CHART_COMPATIBILITY = {
  bar: {
    name: 'Bar Chart',
    requirements: {
      xAxis: ['string', 'object'], // Categories or dates
      yAxis: ['number'], // Numeric values only
      minFields: 2,
      maxFields: 10,
      maxCategories: 50
    },
    description: 'Best for comparing quantities across categories',
    examples: ['Production by Factory', 'Sales by Region', 'Defects by Type']
  },

  'multi-bar': {
    name: 'Multi-Series Bar',
    requirements: {
      xAxis: ['string', 'object'],
      yAxis: ['number'],
      minFields: 3,
      maxFields: 15,
      maxCategories: 100
    },
    description: 'Compare multiple metrics across categories',
    examples: ['Quantity and Defects by Product', 'Multiple KPIs by Region']
  },

  'comparison-chart': {
    name: 'Cross-Table Compare',
    requirements: {
      xAxis: ['string', 'object'],
      yAxis: ['number'],
      minFields: 2,
      maxFields: 12,
      maxCategories: 200
    },
    description: 'Compare values across different tables or series',
    examples: ['Production vs Defects by Product', 'Sales vs Returns by Region']
  },

  'grouped-table': {
    name: 'Grouped Table',
    requirements: {
      xAxis: ['string', 'object'],
      yAxis: ['string', 'number', 'object'],
      minFields: 2,
      maxFields: 50,
      maxCategories: 1000
    },
    description: 'Organize tabular data by groupings',
    examples: ['Production grouped by Factory', 'Defects grouped by Type']
  },

  line: {
    name: 'Line Chart',
    requirements: {
      xAxis: ['object', 'string'], // Preferably dates, but sequential strings work
      yAxis: ['number'],
      minFields: 2,
      maxFields: 5,
      maxCategories: 100,
      preferSequential: true
    },
    description: 'Ideal for showing trends over time or sequential data',
    examples: ['Production Trends', 'Sales Over Time', 'Defect Rates by Month']
  },

  pie: {
    name: 'Pie Chart',
    requirements: {
      xAxis: ['string'], // Categories only
      yAxis: ['number'], // Values to sum/aggregate
      minFields: 2,
      maxFields: 2, // Exactly 2 fields
      maxCategories: 10 // Too many slices become unreadable
    },
    description: 'Perfect for showing parts of a whole with limited categories',
    examples: ['Production Share by Factory', 'Sales by Channel', 'Defect Distribution']
  },

  table: {
    name: 'Table',
    requirements: {
      xAxis: ['string', 'number', 'object'], // Any field type
      yAxis: ['string', 'number', 'object'], // Any field type
      minFields: 1,
      maxFields: 20,
      maxCategories: 1000
    },
    description: 'Flexible view for detailed data inspection',
    examples: ['Detailed Production Records', 'Full Sales Data', 'Complete Defect Log']
  }
};

// Table relationship mapping
const TABLE_RELATIONSHIPS = {
  production: {
    canJoinWith: ['defects', 'sales'],
    commonFields: {
      defects: ['productId', 'factory', 'date'],
      sales: ['productId', 'date']
    },
    primaryKey: 'id',
    foreignKeys: {
      productId: 'products.id',
      factory: 'factories.name'
    }
  },
  defects: {
    canJoinWith: ['production', 'sales'],
    commonFields: {
      production: ['productId', 'factory', 'date'],
      sales: ['productId', 'date']
    },
    primaryKey: 'id',
    foreignKeys: {
      productId: 'products.id',
      factory: 'factories.name'
    }
  },
  sales: {
    canJoinWith: ['production', 'defects'],
    commonFields: {
      production: ['productId', 'date'],
      defects: ['productId', 'date']
    },
    primaryKey: 'id',
    foreignKeys: {
      productId: 'products.id',
      customerId: 'customers.id'
    }
  }
};

// Field type classifications for better UX
const FIELD_CATEGORIES = {
  identifiers: ['id', 'productId', 'customerId', 'factory', 'region'],
  measurements: ['quantity', 'amount', 'defectCount'],
  timestamps: ['date', 'createdAt', 'updatedAt'],
  categories: ['type', 'severity', 'shift', 'channel', 'salesRep', 'inspector']
};

class FieldValidationService {
  /**
   * Validate if selected fields can generate a specific chart type
   */
  static validateFieldsForChart(selectedFields, chartType, selectedCollections = []) {
    const rules = CHART_COMPATIBILITY[chartType];
    if (!rules) {
      return {
        isValid: false,
        errors: [`Unknown chart type: ${chartType}`],
        suggestions: []
      };
    }

    const errors = [];
    const warnings = [];
    const suggestions = [];

    // Check minimum field requirement
    if (selectedFields.length < rules.requirements.minFields) {
      errors.push(`${rules.name} requires at least ${rules.requirements.minFields} fields`);
      suggestions.push(`Add ${rules.requirements.minFields - selectedFields.length} more field(s)`);
    }

    // Check maximum field requirement
    if (selectedFields.length > rules.requirements.maxFields) {
      warnings.push(`${rules.name} works best with ${rules.requirements.maxFields} or fewer fields`);
      suggestions.push(`Consider removing ${selectedFields.length - rules.requirements.maxFields} field(s) for better readability`);
    }

    // For non-table charts, validate axis requirements
    if (chartType !== 'table' && selectedFields.length >= 2) {
      const xAxisFields = selectedFields.filter(field => 
        rules.requirements.xAxis.includes(field.type)
      );
      const yAxisFields = selectedFields.filter(field => 
        rules.requirements.yAxis.includes(field.type)
      );

      if (xAxisFields.length === 0) {
        errors.push(`${rules.name} needs at least one ${rules.requirements.xAxis.join(' or ')} field for X-axis`);
        suggestions.push(`Select a ${rules.requirements.xAxis.join(' or ')} field for categories/labels`);
      }

      if (yAxisFields.length === 0) {
        errors.push(`${rules.name} needs at least one ${rules.requirements.yAxis.join(' or ')} field for Y-axis`);
        suggestions.push(`Select a ${rules.requirements.yAxis.join(' or ')} field for values`);
      }
    }

    // Multi-table validation
    if (selectedCollections.length > 1) {
      const joinValidation = this.validateTableJoins(selectedCollections, selectedFields);
      if (!joinValidation.isValid) {
        errors.push(...joinValidation.errors);
        suggestions.push(...joinValidation.suggestions);
      } else if (joinValidation.warnings.length > 0) {
        warnings.push(...joinValidation.warnings);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      chartInfo: rules
    };
  }

  /**
   * Validate table joins and relationships
   */
  static validateTableJoins(selectedCollections, selectedFields) {
    const errors = [];
    const warnings = [];
    const suggestions = [];

    if (selectedCollections.length < 2) {
      return { isValid: true, errors, warnings, suggestions };
    }

    // Check if all tables can be joined
    const tableNames = selectedCollections.map(col => col.name || col);
    for (let i = 0; i < tableNames.length; i++) {
      const table1 = tableNames[i];
      const table1Relationships = TABLE_RELATIONSHIPS[table1];
      
      if (!table1Relationships) {
        errors.push(`Unknown table: ${table1}`);
        continue;
      }

      for (let j = i + 1; j < tableNames.length; j++) {
        const table2 = tableNames[j];
        
        if (!table1Relationships.canJoinWith.includes(table2)) {
          errors.push(`Cannot join ${table1} with ${table2} - no common fields found`);
          suggestions.push(`Try using individual tables or find tables with shared fields like productId or date`);
        } else {
          // Check if we have fields that can actually be used for joining
          const commonFields = table1Relationships.commonFields[table2] || [];
          const availableJoinFields = selectedFields.filter(field => 
            commonFields.includes(field.name) && 
            (field.collection === table1 || field.collection === table2)
          );

          if (availableJoinFields.length === 0) {
            warnings.push(`Joining ${table1} and ${table2} may produce unexpected results without common fields`);
            suggestions.push(`Consider including fields like: ${commonFields.slice(0, 3).join(', ')}`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Get recommended chart types for selected fields
   */
  static getRecommendedChartTypes(selectedFields, selectedCollections = []) {
    const recommendations = [];

    Object.entries(CHART_COMPATIBILITY).forEach(([chartType, rules]) => {
      const validation = this.validateFieldsForChart(selectedFields, chartType, selectedCollections);
      
      if (validation.isValid) {
        recommendations.push({
          type: chartType,
          name: rules.name,
          score: this.calculateChartScore(selectedFields, chartType),
          description: rules.description,
          examples: rules.examples,
          warnings: validation.warnings
        });
      }
    });

    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate compatibility score for chart type
   */
  static calculateChartScore(selectedFields, chartType) {
    const rules = CHART_COMPATIBILITY[chartType];
    let score = 0;

    // Base score for valid combinations
    score += 50;

    // Bonus for optimal field count
    const fieldCount = selectedFields.length;
    const optimalCount = Math.floor((rules.requirements.minFields + rules.requirements.maxFields) / 2);
    const fieldCountScore = Math.max(0, 30 - Math.abs(fieldCount - optimalCount) * 5);
    score += fieldCountScore;

    // Bonus for appropriate field types
    if (chartType !== 'table') {
      const xAxisFields = selectedFields.filter(field => 
        rules.requirements.xAxis.includes(field.type)
      ).length;
      const yAxisFields = selectedFields.filter(field => 
        rules.requirements.yAxis.includes(field.type)
      ).length;

      score += Math.min(xAxisFields * 10, 20);
      score += Math.min(yAxisFields * 15, 30);
    }

    // Bonus for field categories that work well together
    const hasIdentifier = selectedFields.some(field => 
      FIELD_CATEGORIES.identifiers.includes(field.name)
    );
    const hasMeasurement = selectedFields.some(field => 
      FIELD_CATEGORIES.measurements.includes(field.name)
    );
    const hasTimestamp = selectedFields.some(field => 
      FIELD_CATEGORIES.timestamps.includes(field.name)
    );

    if (chartType === 'line' && hasTimestamp) score += 20;
    if ((chartType === 'bar' || chartType === 'pie') && hasIdentifier && hasMeasurement) score += 15;

    return Math.min(score, 100);
  }

  /**
   * Get field compatibility warnings
   */
  static getFieldCompatibilityWarnings(selectedFields) {
    const warnings = [];

    // Check for too many string fields
    const stringFields = selectedFields.filter(field => field.type === 'string').length;
    if (stringFields > 5) {
      warnings.push('Many text fields selected - consider focusing on key categories for better visualization');
    }

    // Check for only numeric fields
    const numericFields = selectedFields.filter(field => field.type === 'number').length;
    if (numericFields === selectedFields.length && selectedFields.length > 1) {
      warnings.push('Only numeric fields selected - add categorical fields for meaningful grouping');
    }

    // Check for mixed collections without common fields
    const collections = [...new Set(selectedFields.map(field => field.collection))];
    if (collections.length > 1) {
      const hasCommonField = this.hasCommonJoinFields(selectedFields, collections);
      if (!hasCommonField) {
        warnings.push('Fields from multiple tables without clear relationships - results may be unexpected');
      }
    }

    return warnings;
  }

  /**
   * Check if selected fields include common join fields
   */
  static hasCommonJoinFields(selectedFields, collections) {
    if (collections.length < 2) return true;

    for (let i = 0; i < collections.length - 1; i++) {
      const table1 = collections[i];
      const table2 = collections[i + 1];
      
      const relationship = TABLE_RELATIONSHIPS[table1];
      if (!relationship) continue;

      const commonFields = relationship.commonFields[table2] || [];
      const hasCommon = selectedFields.some(field => 
        commonFields.includes(field.name)
      );

      if (hasCommon) return true;
    }

    return false;
  }

  /**
   * Get suggestions for improving field selection
   */
  static getFieldSelectionSuggestions(selectedFields, selectedCollections, targetChartType = null) {
    const suggestions = [];

    if (selectedFields.length === 0) {
      suggestions.push({
        type: 'info',
        message: 'Select fields from the sidebar to start building your report',
        action: 'Add fields from available tables'
      });
      return suggestions;
    }

    // Suggestions based on current selection
    const fieldTypes = selectedFields.map(field => field.type);
    const collections = [...new Set(selectedFields.map(field => field.collection))];

    // Suggest adding measurement fields if only categories are selected
    if (!fieldTypes.includes('number') && fieldTypes.includes('string')) {
      suggestions.push({
        type: 'suggestion',
        message: 'Add numeric fields like quantity, amount, or defectCount for meaningful charts',
        action: 'Select measurement fields'
      });
    }

    // Suggest adding categorical fields if only numbers are selected
    if (fieldTypes.every(type => type === 'number') && selectedFields.length > 1) {
      suggestions.push({
        type: 'suggestion',
        message: 'Add categorical fields like factory, region, or type for grouping data',
        action: 'Select category fields'
      });
    }

    // Multi-table suggestions
    if (collections.length > 1) {
      const joinValidation = this.validateTableJoins(selectedCollections, selectedFields);
      if (joinValidation.warnings.length > 0) {
        suggestions.push({
          type: 'warning',
          message: 'Consider adding common fields for better table relationships',
          action: 'Add productId, date, or factory fields'
        });
      }
    }

    // Chart-specific suggestions
    if (targetChartType) {
      const validation = this.validateFieldsForChart(selectedFields, targetChartType, selectedCollections);
      validation.suggestions.forEach(suggestion => {
        suggestions.push({
          type: 'info',
          message: suggestion,
          action: 'Adjust field selection'
        });
      });
    }

    return suggestions;
  }

  /**
   * Get available chart types for current selection
   */
  static getAvailableChartTypes(selectedFields, selectedCollections = []) {
    const available = {};

    Object.keys(CHART_COMPATIBILITY).forEach(chartType => {
      const validation = this.validateFieldsForChart(selectedFields, chartType, selectedCollections);
      available[chartType] = {
        enabled: validation.isValid,
        reason: validation.errors.join(', ') || 'Compatible',
        warnings: validation.warnings,
        info: validation.chartInfo
      };
    });

    return available;
  }
}

export default FieldValidationService;