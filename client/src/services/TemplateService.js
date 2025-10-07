/**
 * TemplateService - Manufacturing Report Templates and Quick-Start Scenarios
 * 
 * Provides pre-configured templates for common manufacturing reporting needs,
 * including field selections, chart types, and best practice configurations.
 */

class TemplateService {
  /**
   * Get all available manufacturing report templates
   */
  static getAvailableTemplates() {
    return [
      {
        id: 'production-performance',
        name: 'Production Performance Dashboard',
        description: 'Track production output, efficiency, and targets across time periods',
        category: 'Production',
        icon: 'BarChart3',
        difficulty: 'Easy',
        estimatedTime: '2 minutes',
        tags: ['production', 'performance', 'kpis'],
        preview: {
          chartType: 'bar',
          fieldsCount: 4,
          tablesUsed: ['Production']
        },
        template: {
          fields: [
            { name: 'date', table: 'Production', type: 'date', role: 'x-axis' },
            { name: 'shift', table: 'Production', type: 'string', role: 'category' },
            { name: 'produced_quantity', table: 'Production', type: 'number', role: 'y-axis' },
            { name: 'target_quantity', table: 'Production', type: 'number', role: 'y-axis' }
          ],
          collections: ['Production'],
          visualization: {
            type: 'bar',
            title: 'Production Performance by Shift',
            settings: {
              grouped: true,
              showTrend: true,
              colorScheme: 'manufacturing'
            }
          },
          filters: {
            dateRange: 'last_30_days',
            presetFilters: [
              { field: 'shift', operator: 'in', values: ['Day', 'Night'] }
            ]
          },
          aggregations: [
            { field: 'produced_quantity', method: 'sum', alias: 'Total Produced' },
            { field: 'target_quantity', method: 'sum', alias: 'Total Target' }
          ]
        }
      },
      
      {
        id: 'quality-defect-analysis',
        name: 'Quality & Defect Analysis',
        description: 'Monitor defect rates, quality trends, and identify problem areas',
        category: 'Quality',
        icon: 'Target',
        difficulty: 'Medium',
        estimatedTime: '3 minutes',
        tags: ['quality', 'defects', 'analysis'],
        preview: {
          chartType: 'line',
          fieldsCount: 5,
          tablesUsed: ['Production', 'Defects']
        },
        template: {
          fields: [
            { name: 'date', table: 'Production', type: 'date', role: 'x-axis' },
            { name: 'produced_quantity', table: 'Production', type: 'number', role: 'metric' },
            { name: 'defect_count', table: 'Defects', type: 'number', role: 'y-axis' },
            { name: 'defect_type', table: 'Defects', type: 'string', role: 'category' },
            { name: 'severity', table: 'Defects', type: 'string', role: 'filter' }
          ],
          collections: ['Production', 'Defects'],
          visualization: {
            type: 'line',
            title: 'Defect Rate Trend Analysis',
            settings: {
              showDataPoints: true,
              trendline: true,
              yAxisFormat: 'percentage'
            }
          },
          filters: {
            dateRange: 'last_90_days',
            presetFilters: [
              { field: 'severity', operator: 'not_equals', values: ['Cosmetic'] }
            ]
          },
          aggregations: [
            { 
              field: 'defect_rate', 
              method: 'calculated', 
              formula: '(defect_count / produced_quantity) * 100',
              alias: 'Defect Rate %' 
            }
          ]
        }
      },

      {
        id: 'sales-production-correlation',
        name: 'Sales vs Production Alignment',
        description: 'Compare sales demand with production output to optimize capacity',
        category: 'Operations',
        icon: 'TrendingUp',
        difficulty: 'Advanced',
        estimatedTime: '5 minutes',
        tags: ['sales', 'production', 'capacity', 'planning'],
        preview: {
          chartType: 'bar',
          fieldsCount: 6,
          tablesUsed: ['Production', 'Sales']
        },
        template: {
          fields: [
            { name: 'date', table: 'Production', type: 'date', role: 'x-axis' },
            { name: 'product_type', table: 'Production', type: 'string', role: 'category' },
            { name: 'produced_quantity', table: 'Production', type: 'number', role: 'y-axis' },
            { name: 'sale_date', table: 'Sales', type: 'date', role: 'join-key' },
            { name: 'quantity_sold', table: 'Sales', type: 'number', role: 'y-axis' },
            { name: 'revenue', table: 'Sales', type: 'number', role: 'metric' }
          ],
          collections: ['Production', 'Sales'],
          visualization: {
            type: 'bar',
            title: 'Production vs Sales Volume',
            settings: {
              grouped: true,
              showComparison: true,
              dualAxis: false
            }
          },
          filters: {
            dateRange: 'last_60_days',
            presetFilters: []
          },
          aggregations: [
            { field: 'produced_quantity', method: 'sum', alias: 'Total Produced' },
            { field: 'quantity_sold', method: 'sum', alias: 'Total Sold' },
            { 
              field: 'inventory_variance', 
              method: 'calculated', 
              formula: 'produced_quantity - quantity_sold',
              alias: 'Inventory Change' 
            }
          ]
        }
      },

      {
        id: 'shift-efficiency-comparison',
        name: 'Shift Efficiency Comparison',
        description: 'Compare performance metrics across different work shifts',
        category: 'Production',
        icon: 'Clock',
        difficulty: 'Easy',
        estimatedTime: '2 minutes',
        tags: ['shifts', 'efficiency', 'comparison'],
        preview: {
          chartType: 'pie',
          fieldsCount: 3,
          tablesUsed: ['Production']
        },
        template: {
          fields: [
            { name: 'shift', table: 'Production', type: 'string', role: 'category' },
            { name: 'produced_quantity', table: 'Production', type: 'number', role: 'value' },
            { name: 'efficiency_score', table: 'Production', type: 'number', role: 'metric' }
          ],
          collections: ['Production'],
          visualization: {
            type: 'pie',
            title: 'Production Distribution by Shift',
            settings: {
              showPercentages: true,
              showLegend: true,
              colorScheme: 'shifts'
            }
          },
          filters: {
            dateRange: 'last_7_days',
            presetFilters: []
          },
          aggregations: [
            { field: 'produced_quantity', method: 'sum', alias: 'Total Output' },
            { field: 'efficiency_score', method: 'avg', alias: 'Avg Efficiency' }
          ]
        }
      },

      {
        id: 'monthly-performance-table',
        name: 'Monthly Performance Report',
        description: 'Comprehensive monthly performance table with key metrics',
        category: 'Reporting',
        icon: 'Table',
        difficulty: 'Medium',
        estimatedTime: '4 minutes',
        tags: ['monthly', 'performance', 'table', 'comprehensive'],
        preview: {
          chartType: 'table',
          fieldsCount: 8,
          tablesUsed: ['Production', 'Defects', 'Sales']
        },
        template: {
          fields: [
            { name: 'date', table: 'Production', type: 'date', role: 'grouping' },
            { name: 'product_type', table: 'Production', type: 'string', role: 'grouping' },
            { name: 'produced_quantity', table: 'Production', type: 'number', role: 'metric' },
            { name: 'target_quantity', table: 'Production', type: 'number', role: 'metric' },
            { name: 'defect_count', table: 'Defects', type: 'number', role: 'metric' },
            { name: 'quantity_sold', table: 'Sales', type: 'number', role: 'metric' },
            { name: 'revenue', table: 'Sales', type: 'number', role: 'metric' },
            { name: 'efficiency_score', table: 'Production', type: 'number', role: 'metric' }
          ],
          collections: ['Production', 'Defects', 'Sales'],
          visualization: {
            type: 'table',
            title: 'Monthly Manufacturing Performance Report',
            settings: {
              showTotals: true,
              highlightExtremes: true,
              formatNumbers: true,
              sortable: true
            }
          },
          filters: {
            dateRange: 'current_month',
            presetFilters: []
          },
          aggregations: [
            { field: 'produced_quantity', method: 'sum', alias: 'Total Produced' },
            { field: 'target_quantity', method: 'sum', alias: 'Total Target' },
            { field: 'defect_count', method: 'sum', alias: 'Total Defects' },
            { field: 'quantity_sold', method: 'sum', alias: 'Total Sold' },
            { field: 'revenue', method: 'sum', alias: 'Total Revenue' },
            { field: 'efficiency_score', method: 'avg', alias: 'Avg Efficiency' },
            { 
              field: 'target_achievement', 
              method: 'calculated', 
              formula: '(produced_quantity / target_quantity) * 100',
              alias: 'Target Achievement %' 
            },
            { 
              field: 'defect_rate', 
              method: 'calculated', 
              formula: '(defect_count / produced_quantity) * 100',
              alias: 'Defect Rate %' 
            }
          ]
        }
      }
    ];
  }

  /**
   * Get templates by category
   */
  static getTemplatesByCategory(category) {
    return this.getAvailableTemplates().filter(template => 
      template.category.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Get templates by difficulty level
   */
  static getTemplatesByDifficulty(difficulty) {
    return this.getAvailableTemplates().filter(template => 
      template.difficulty.toLowerCase() === difficulty.toLowerCase()
    );
  }

  /**
   * Search templates by name, description, or tags
   */
  static searchTemplates(query) {
    const searchTerm = query.toLowerCase();
    return this.getAvailableTemplates().filter(template => 
      template.name.toLowerCase().includes(searchTerm) ||
      template.description.toLowerCase().includes(searchTerm) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get template by ID
   */
  static getTemplateById(templateId) {
    return this.getAvailableTemplates().find(template => template.id === templateId);
  }

  /**
   * Get recommended templates based on current field selection
   */
  static getRecommendedTemplates(selectedFields, selectedCollections) {
    const templates = this.getAvailableTemplates();
    const recommendations = [];

    templates.forEach(template => {
      let score = 0;
      let matchingFields = 0;
      let matchingTables = 0;

      // Check field compatibility
      template.template.fields.forEach(templateField => {
        const hasMatchingField = selectedFields.some(field => 
          field.name === templateField.name && field.table === templateField.table
        );
        if (hasMatchingField) {
          matchingFields++;
          score += 10;
        }
      });

      // Check table compatibility
      template.template.collections.forEach(collection => {
        if (selectedCollections.includes(collection)) {
          matchingTables++;
          score += 5;
        }
      });

      // Calculate compatibility percentage
      const fieldCompatibility = (matchingFields / template.template.fields.length) * 100;
      const tableCompatibility = (matchingTables / template.template.collections.length) * 100;
      
      if (fieldCompatibility > 0 || tableCompatibility > 0) {
        recommendations.push({
          ...template,
          compatibility: {
            overall: Math.round((fieldCompatibility + tableCompatibility) / 2),
            fields: fieldCompatibility,
            tables: tableCompatibility,
            matchingFields,
            matchingTables
          },
          score
        });
      }
    });

    // Sort by compatibility score
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Return top 5 recommendations
  }

  /**
   * Apply template configuration to current report builder state
   */
  static applyTemplate(templateId, currentState = {}) {
    const template = this.getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template with ID '${templateId}' not found`);
    }

    const appliedConfig = {
      // Apply template fields
      selectedFields: template.template.fields.map(field => ({
        ...field,
        id: `${field.table}-${field.name}`,
        displayName: this.formatFieldName(field.name),
        selected: true
      })),

      // Apply template collections
      selectedCollections: [...template.template.collections],

      // Apply visualization settings
      visualization: {
        ...currentState.visualization,
        ...template.template.visualization
      },

      // Apply filters
      filters: {
        ...currentState.filters,
        ...template.template.filters
      },

      // Apply aggregations
      aggregations: template.template.aggregations || [],

      // Template metadata
      templateInfo: {
        id: template.id,
        name: template.name,
        appliedAt: new Date().toISOString(),
        category: template.category
      }
    };

    return {
      config: appliedConfig,
      instructions: this.getApplicationInstructions(template),
      nextSteps: this.getNextSteps(template)
    };
  }

  /**
   * Get instructions for applying template
   */
  static getApplicationInstructions(template) {
    return [
      `Applied "${template.name}" template`,
      `Selected ${template.template.fields.length} fields from ${template.template.collections.length} table(s)`,
      `Set visualization type to: ${template.template.visualization.type}`,
      template.template.filters.dateRange && `Applied date filter: ${template.template.filters.dateRange}`,
      template.template.aggregations.length > 0 && `Configured ${template.template.aggregations.length} aggregation(s)`
    ].filter(Boolean);
  }

  /**
   * Get suggested next steps after applying template
   */
  static getNextSteps(template) {
    const steps = [
      'Review the selected fields and adjust if needed',
      'Generate the report to see initial results'
    ];

    if (template.difficulty === 'Advanced') {
      steps.push('Fine-tune the aggregations and filters for your specific needs');
    }

    if (template.template.collections.length > 1) {
      steps.push('Verify the table relationships are correct');
    }

    if (template.template.filters.presetFilters?.length > 0) {
      steps.push('Adjust the preset filters to match your data range');
    }

    return steps;
  }

  /**
   * Format field name for display
   */
  static formatFieldName(fieldName) {
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get template categories
   */
  static getCategories() {
    const templates = this.getAvailableTemplates();
    const categories = [...new Set(templates.map(t => t.category))];
    return categories.map(category => ({
      name: category,
      count: templates.filter(t => t.category === category).length,
      templates: templates.filter(t => t.category === category)
    }));
  }

  /**
   * Validate template configuration
   */
  static validateTemplate(templateConfig) {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (!templateConfig.fields || templateConfig.fields.length === 0) {
      errors.push('Template must have at least one field');
    }

    if (!templateConfig.collections || templateConfig.collections.length === 0) {
      errors.push('Template must specify at least one table/collection');
    }

    if (!templateConfig.visualization || !templateConfig.visualization.type) {
      errors.push('Template must specify a visualization type');
    }

    // Check field-table consistency
    templateConfig.fields?.forEach((field, index) => {
      if (!templateConfig.collections.includes(field.table)) {
        warnings.push(`Field ${field.name} references table ${field.table} which is not in collections`);
      }
    });

    // Check visualization compatibility
    if (templateConfig.visualization?.type && templateConfig.fields) {
      // Add specific validation rules based on chart type
      if (templateConfig.visualization.type === 'pie' && templateConfig.fields.length > 5) {
        warnings.push('Pie charts work best with 5 or fewer categories');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Export template as JSON
   */
  static exportTemplate(templateId) {
    const template = this.getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template with ID '${templateId}' not found`);
    }

    return {
      ...template,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  }
}

export default TemplateService;