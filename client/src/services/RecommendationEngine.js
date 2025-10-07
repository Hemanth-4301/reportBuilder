/**
 * Recommendation Engine
 * Provides intelligent suggestions for field combinations, chart types, and report optimization
 */

import FieldValidationService from './FieldValidationService';

// Common report patterns and their success rates
const REPORT_PATTERNS = {
  timeSeriesAnalysis: {
    name: 'Time Series Analysis',
    description: 'Track changes over time',
    requiredFieldTypes: ['object', 'number'], // date, numeric
    optionalFieldTypes: ['string'], // category for grouping
    recommendedCharts: ['line', 'bar'],
    examples: ['Production trends over months', 'Sales growth analysis', 'Defect rates over time'],
    successRate: 95
  },
  categoryComparison: {
    name: 'Category Comparison',
    description: 'Compare values across categories',
    requiredFieldTypes: ['string', 'number'], // category, numeric
    optionalFieldTypes: ['object'], // date for filtering
    recommendedCharts: ['bar', 'pie'],
    examples: ['Sales by region', 'Production by factory', 'Defects by type'],
    successRate: 90
  },
  distributionAnalysis: {
    name: 'Distribution Analysis',
    description: 'Show how values are distributed',
    requiredFieldTypes: ['string', 'number'], // category, values
    optionalFieldTypes: [],
    recommendedCharts: ['pie', 'bar'],
    examples: ['Market share analysis', 'Resource allocation', 'Cost breakdown'],
    successRate: 85
  },
  correlationAnalysis: {
    name: 'Correlation Analysis',
    description: 'Find relationships between variables',
    requiredFieldTypes: ['number', 'number'], // two numeric fields
    optionalFieldTypes: ['string'], // grouping category
    recommendedCharts: ['line', 'bar'],
    examples: ['Production vs Quality', 'Sales vs Marketing spend', 'Defects vs Production volume'],
    successRate: 80
  },
  detailedInspection: {
    name: 'Detailed Data Inspection',
    description: 'Examine raw data in detail',
    requiredFieldTypes: [], // any fields
    optionalFieldTypes: ['string', 'number', 'object'],
    recommendedCharts: ['table'],
    examples: ['Full production records', 'Complete sales data', 'Detailed defect logs'],
    successRate: 100
  }
};

// Industry-specific templates
const MANUFACTURING_TEMPLATES = {
  productionDashboard: {
    name: 'Production Dashboard',
    description: 'Monitor production metrics across factories',
    suggestedFields: ['factory', 'productId', 'quantity', 'date', 'shift'],
    suggestedCharts: ['bar', 'line'],
    filters: ['dateRange', 'factory'],
    aggregations: [{ type: 'sum', field: 'quantity', groupBy: 'factory' }]
  },
  qualityControl: {
    name: 'Quality Control Report',
    description: 'Track defects and quality metrics',
    suggestedFields: ['type', 'severity', 'defectCount', 'date', 'factory'],
    suggestedCharts: ['pie', 'bar'],
    filters: ['dateRange', 'factory', 'severity'],
    aggregations: [{ type: 'sum', field: 'defectCount', groupBy: 'type' }]
  },
  salesPerformance: {
    name: 'Sales Performance',
    description: 'Analyze sales across regions and channels',
    suggestedFields: ['region', 'channel', 'amount', 'date', 'salesRep'],
    suggestedCharts: ['bar', 'line'],
    filters: ['dateRange', 'region'],
    aggregations: [{ type: 'sum', field: 'amount', groupBy: 'region' }]
  },
  operationalEfficiency: {
    name: 'Operational Efficiency',
    description: 'Compare production vs defects across time',
    suggestedFields: ['date', 'quantity', 'defectCount', 'factory'],
    suggestedCharts: ['line'],
    filters: ['dateRange', 'factory'],
    aggregations: [
      { type: 'sum', field: 'quantity', groupBy: 'date' },
      { type: 'sum', field: 'defectCount', groupBy: 'date' }
    ]
  }
};

// Performance optimization rules
const PERFORMANCE_RULES = {
  queryComplexity: {
    lowComplexity: { maxTables: 1, maxFields: 5, maxRecords: 1000 },
    mediumComplexity: { maxTables: 2, maxFields: 10, maxRecords: 5000 },
    highComplexity: { maxTables: 3, maxFields: 15, maxRecords: 10000 }
  },
  optimizationSuggestions: {
    tooManyFields: 'Consider reducing the number of fields for better performance',
    tooManyTables: 'Multiple table joins can be slow - consider using fewer tables',
    largeDataset: 'Large datasets may take longer to process - consider adding filters',
    complexAggregations: 'Complex aggregations can impact performance - simplify if possible'
  }
};

class RecommendationEngine {
  /**
   * Analyze current field selection and suggest improvements
   */
  static analyzeFieldSelection(selectedFields, selectedCollections, currentVisualization) {
    const analysis = {
      patterns: [],
      suggestions: [],
      warnings: [],
      templates: [],
      performance: this.analyzePerformance(selectedFields, selectedCollections)
    };

    // Identify matching patterns
    analysis.patterns = this.identifyPatterns(selectedFields);
    
    // Generate field-based suggestions
    analysis.suggestions = this.generateFieldSuggestions(selectedFields, selectedCollections);
    
    // Check for potential issues
    analysis.warnings = this.generateWarnings(selectedFields, selectedCollections);
    
    // Suggest relevant templates
    analysis.templates = this.suggestTemplates(selectedFields, selectedCollections);
    
    return analysis;
  }

  /**
   * Identify report patterns based on selected fields
   */
  static identifyPatterns(selectedFields) {
    const fieldTypes = selectedFields.map(field => field.type);
    const fieldNames = selectedFields.map(field => field.name.toLowerCase());
    
    const matchingPatterns = [];

    Object.entries(REPORT_PATTERNS).forEach(([key, pattern]) => {
      let score = 0;
      
      // Check required field types
      const hasRequiredTypes = pattern.requiredFieldTypes.every(type => 
        fieldTypes.includes(type)
      );
      
      if (hasRequiredTypes) {
        score += 50;
        
        // Bonus for optimal field count
        const optimalFieldCount = pattern.requiredFieldTypes.length + 
          (pattern.optionalFieldTypes.length / 2);
        const fieldCountDiff = Math.abs(selectedFields.length - optimalFieldCount);
        score += Math.max(0, 30 - (fieldCountDiff * 5));
        
        // Bonus for common field names
        const commonTimeFields = ['date', 'createdat', 'updatedat', 'time'];
        const commonCategoryFields = ['factory', 'region', 'type', 'channel'];
        const commonMeasureFields = ['quantity', 'amount', 'count', 'defectcount'];
        
        if (pattern.name.includes('Time') && 
            fieldNames.some(name => commonTimeFields.includes(name))) {
          score += 20;
        }
        
        if (pattern.name.includes('Category') && 
            fieldNames.some(name => commonCategoryFields.includes(name))) {
          score += 15;
        }
        
        if (fieldNames.some(name => commonMeasureFields.includes(name))) {
          score += 10;
        }
        
        matchingPatterns.push({
          ...pattern,
          key,
          score: Math.min(score, 100),
          confidence: score > 70 ? 'high' : score > 50 ? 'medium' : 'low'
        });
      }
    });

    return matchingPatterns.sort((a, b) => b.score - a.score);
  }

  /**
   * Generate suggestions for improving field selection
   */
  static generateFieldSuggestions(selectedFields, selectedCollections) {
    const suggestions = [];
    const fieldTypes = selectedFields.map(field => field.type);
    const fieldNames = selectedFields.map(field => field.name);

    // Suggest adding time dimension
    if (!fieldTypes.includes('object') && selectedFields.length > 0) {
      suggestions.push({
        type: 'add_field',
        priority: 'high',
        message: 'Add a date field to enable time-based analysis',
        action: 'Select a date field like "date", "createdAt", or "updatedAt"',
        benefit: 'Enables trend analysis and time series charts'
      });
    }

    // Suggest adding measurement fields
    if (!fieldTypes.includes('number') && fieldTypes.includes('string')) {
      suggestions.push({
        type: 'add_field',
        priority: 'high',
        message: 'Add numeric fields for meaningful visualizations',
        action: 'Select measurement fields like "quantity", "amount", or "defectCount"',
        benefit: 'Enables quantitative analysis and charts'
      });
    }

    // Suggest adding categorical fields
    if (fieldTypes.every(type => type === 'number') && selectedFields.length > 1) {
      suggestions.push({
        type: 'add_field',
        priority: 'medium',
        message: 'Add categorical fields for better data grouping',
        action: 'Select category fields like "factory", "region", or "type"',
        benefit: 'Enables comparison across different categories'
      });
    }

    // Suggest reducing complexity
    if (selectedFields.length > 10) {
      suggestions.push({
        type: 'reduce_complexity',
        priority: 'medium',
        message: 'Consider reducing the number of fields for better performance',
        action: 'Focus on key fields for your analysis',
        benefit: 'Faster query execution and clearer visualizations'
      });
    }

    // Multi-table suggestions
    if (selectedCollections.length > 1) {
      const hasCommonFields = this.checkCommonFields(selectedFields, selectedCollections);
      if (!hasCommonFields) {
        suggestions.push({
          type: 'improve_joins',
          priority: 'high',
          message: 'Add common fields to improve table relationships',
          action: 'Include fields like "productId", "date", or "factory" for better joins',
          benefit: 'More accurate and meaningful combined data'
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate warnings for potential issues
   */
  static generateWarnings(selectedFields, selectedCollections) {
    const warnings = [];
    
    // Performance warnings
    const performance = this.analyzePerformance(selectedFields, selectedCollections);
    if (performance.complexity === 'high') {
      warnings.push({
        type: 'performance',
        severity: 'medium',
        message: 'High complexity query may be slow',
        details: performance.issues.join(', '),
        suggestion: 'Consider simplifying your selection'
      });
    }

    // Data quality warnings
    if (selectedFields.length === 1) {
      warnings.push({
        type: 'data_quality',
        severity: 'low',
        message: 'Single field selected - limited analysis options',
        details: 'Most visualizations require at least 2 fields',
        suggestion: 'Add more fields for meaningful insights'
      });
    }

    // Visualization warnings
    const fieldTypes = selectedFields.map(field => field.type);
    if (fieldTypes.every(type => type === 'string') && selectedFields.length > 5) {
      warnings.push({
        type: 'visualization',
        severity: 'medium',
        message: 'Too many text fields may result in cluttered visualizations',
        details: 'Charts work best with a mix of categorical and numeric data',
        suggestion: 'Focus on key categories and add numeric measurements'
      });
    }

    return warnings;
  }

  /**
   * Suggest relevant templates based on current selection
   */
  static suggestTemplates(selectedFields, selectedCollections) {
    const fieldNames = selectedFields.map(field => field.name.toLowerCase());
    const suggestions = [];

    Object.entries(MANUFACTURING_TEMPLATES).forEach(([key, template]) => {
      let relevanceScore = 0;
      let matchingFields = 0;

      // Calculate relevance based on field overlap
      template.suggestedFields.forEach(suggestedField => {
        if (fieldNames.includes(suggestedField.toLowerCase())) {
          matchingFields++;
          relevanceScore += 20;
        }
      });

      // Bonus for collection compatibility
      if (selectedCollections.length > 0) {
        const collectionNames = selectedCollections.map(col => col.name || col);
        const templateCollections = this.getTemplateCollections(template);
        const commonCollections = collectionNames.filter(name => 
          templateCollections.includes(name)
        );
        relevanceScore += commonCollections.length * 15;
      }

      if (relevanceScore > 30) {
        suggestions.push({
          ...template,
          key,
          relevanceScore,
          matchingFields,
          totalFields: template.suggestedFields.length,
          missingFields: template.suggestedFields.filter(field => 
            !fieldNames.includes(field.toLowerCase())
          )
        });
      }
    });

    return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Analyze query performance and complexity
   */
  static analyzePerformance(selectedFields, selectedCollections) {
    const analysis = {
      complexity: 'low',
      estimatedTime: 'fast',
      issues: [],
      suggestions: []
    };

    const fieldCount = selectedFields.length;
    const tableCount = selectedCollections.length;
    const estimatedRecords = tableCount * 1000; // Rough estimate

    // Determine complexity level
    if (tableCount > 2 || fieldCount > 10 || estimatedRecords > 5000) {
      analysis.complexity = 'high';
      analysis.estimatedTime = 'slow';
    } else if (tableCount === 2 || fieldCount > 5 || estimatedRecords > 1000) {
      analysis.complexity = 'medium';
      analysis.estimatedTime = 'moderate';
    }

    // Identify specific issues
    if (tableCount > 2) {
      analysis.issues.push('Multiple table joins');
      analysis.suggestions.push('Consider reducing the number of tables');
    }

    if (fieldCount > 10) {
      analysis.issues.push('Many fields selected');
      analysis.suggestions.push('Focus on essential fields only');
    }

    if (estimatedRecords > 10000) {
      analysis.issues.push('Large dataset');
      analysis.suggestions.push('Add date or category filters to reduce data volume');
    }

    return analysis;
  }

  /**
   * Get smart chart recommendations with reasoning
   */
  static getSmartChartRecommendations(selectedFields, selectedCollections, currentPattern = null) {
    const recommendations = [];
    
    // Get basic recommendations from validation service
    const basicRecs = FieldValidationService.getRecommendedChartTypes(
      selectedFields, 
      selectedCollections
    );

    // Enhance with pattern-based intelligence
    const patterns = this.identifyPatterns(selectedFields);
    
    basicRecs.forEach(rec => {
      const enhanced = { ...rec };
      
      // Add pattern-based reasoning
      const supportingPatterns = patterns.filter(pattern => 
        pattern.recommendedCharts.includes(rec.type)
      );
      
      if (supportingPatterns.length > 0) {
        enhanced.score += 10;
        enhanced.reasoning = supportingPatterns[0].description;
        enhanced.useCases = supportingPatterns[0].examples;
      }
      
      // Add performance considerations
      const performance = this.analyzePerformance(selectedFields, selectedCollections);
      if (performance.complexity === 'high' && rec.type === 'table') {
        enhanced.score += 15;
        enhanced.performanceNote = 'Table view is more efficient for complex queries';
      }
      
      recommendations.push(enhanced);
    });

    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Generate field addition suggestions
   */
  static suggestAdditionalFields(selectedFields, selectedCollections, targetPattern = null) {
    const suggestions = [];
    
    // Get available fields from collections
    const availableFields = this.getAvailableFields(selectedCollections);
    const selectedFieldNames = selectedFields.map(field => field.name);
    
    // Pattern-based suggestions
    if (targetPattern) {
      const pattern = REPORT_PATTERNS[targetPattern];
      if (pattern) {
        // Suggest fields that would complete the pattern
        pattern.requiredFieldTypes.forEach(type => {
          const hasType = selectedFields.some(field => field.type === type);
          if (!hasType) {
            const matchingFields = availableFields.filter(field => 
              field.type === type && !selectedFieldNames.includes(field.name)
            );
            
            if (matchingFields.length > 0) {
              suggestions.push({
                type: 'complete_pattern',
                priority: 'high',
                fieldType: type,
                suggestedFields: matchingFields.slice(0, 3),
                reason: `Required for ${pattern.name} pattern`,
                benefit: pattern.description
              });
            }
          }
        });
      }
    }

    // General enhancement suggestions
    const fieldTypes = selectedFields.map(field => field.type);
    
    // Suggest time fields for trend analysis
    if (!fieldTypes.includes('object')) {
      const timeFields = availableFields.filter(field => 
        field.type === 'object' && 
        ['date', 'createdat', 'updatedat'].includes(field.name.toLowerCase()) &&
        !selectedFieldNames.includes(field.name)
      );
      
      if (timeFields.length > 0) {
        suggestions.push({
          type: 'enable_trends',
          priority: 'medium',
          fieldType: 'object',
          suggestedFields: timeFields.slice(0, 2),
          reason: 'Enable time-based analysis',
          benefit: 'Discover trends and patterns over time'
        });
      }
    }

    return suggestions;
  }

  /**
   * Helper methods
   */
  static checkCommonFields(selectedFields, selectedCollections) {
    const commonFields = ['productId', 'date', 'factory', 'id'];
    const selectedFieldNames = selectedFields.map(field => field.name.toLowerCase());
    return commonFields.some(field => selectedFieldNames.includes(field.toLowerCase()));
  }

  static getTemplateCollections(template) {
    const collectionMap = {
      factory: 'production',
      productId: 'production',
      quantity: 'production',
      shift: 'production',
      type: 'defects',
      severity: 'defects',
      defectCount: 'defects',
      inspector: 'defects',
      region: 'sales',
      channel: 'sales',
      amount: 'sales',
      salesRep: 'sales'
    };

    const collections = new Set();
    template.suggestedFields.forEach(field => {
      const collection = collectionMap[field];
      if (collection) collections.add(collection);
    });

    return Array.from(collections);
  }

  static getAvailableFields(selectedCollections) {
    // This would typically come from the backend
    // For now, return a mock structure
    const mockFields = {
      production: [
        { name: 'productId', type: 'string', displayName: 'Product ID' },
        { name: 'quantity', type: 'number', displayName: 'Quantity' },
        { name: 'date', type: 'object', displayName: 'Date' },
        { name: 'factory', type: 'string', displayName: 'Factory' },
        { name: 'shift', type: 'string', displayName: 'Shift' }
      ],
      defects: [
        { name: 'defectCount', type: 'number', displayName: 'Defect Count' },
        { name: 'type', type: 'string', displayName: 'Type' },
        { name: 'severity', type: 'string', displayName: 'Severity' }
      ],
      sales: [  
        { name: 'amount', type: 'number', displayName: 'Amount' },
        { name: 'region', type: 'string', displayName: 'Region' },
        { name: 'channel', type: 'string', displayName: 'Channel' }
      ]
    };

    const allFields = [];
    selectedCollections.forEach(collection => {
      const collectionName = collection.name || collection;
      if (mockFields[collectionName]) {
        allFields.push(...mockFields[collectionName]);
      }
    });

    return allFields;
  }
}

export default RecommendationEngine;