/**
 * Analytics Service - Usage Tracking and Performance Monitoring
 * 
 * Tracks report generation patterns, query performance, and user behavior
 * to provide insights and optimization recommendations.
 */

class AnalyticsService {
  constructor() {
    this.metrics = new Map();
    this.queryCache = new Map();
    this.performanceThresholds = {
      slow: 2000,    // 2 seconds
      medium: 1000,  // 1 second
      fast: 500      // 0.5 seconds
    };
  }

  /**
   * Track report generation request
   */
  trackReportGeneration(requestData) {
    const timestamp = new Date().toISOString();
    const sessionId = this.generateSessionId();
    
    const event = {
      type: 'report_generation',
      timestamp,
      sessionId,
      data: {
        fields: requestData.fields || [],
        collections: requestData.collections || [],
        visualizationType: requestData.visualization?.type,
        aggregations: requestData.aggregations || [],
        filters: requestData.filters || {},
        fieldCount: requestData.fields?.length || 0,
        tableCount: requestData.collections?.length || 0,
        hasFilters: Object.keys(requestData.filters || {}).length > 0,
        hasAggregations: (requestData.aggregations || []).length > 0
      }
    };

    this.recordEvent(event);
    return sessionId;
  }

  /**
   * Track query performance
   */
  trackQueryPerformance(sessionId, queryData, executionTime, resultCount = 0) {
    const performanceLevel = this.classifyPerformance(executionTime);
    
    const event = {
      type: 'query_performance',
      timestamp: new Date().toISOString(),
      sessionId,
      data: {
        executionTime,
        resultCount,
        performanceLevel,
        query: {
          type: queryData.type || 'unknown',
          tables: queryData.tables || [],
          joins: queryData.joins || [],
          conditions: queryData.conditions || [],
          groupBy: queryData.groupBy || [],
          orderBy: queryData.orderBy || []
        },
        complexity: this.calculateQueryComplexity(queryData)
      }
    };

    this.recordEvent(event);
    this.updatePerformanceCache(queryData, executionTime);
  }

  /**
   * Update performance cache for query optimization
   */
  updatePerformanceCache(queryData, executionTime) {
    const cacheKey = this.generateQueryCacheKey(queryData);
    
    if (!this.queryCache.has(cacheKey)) {
      this.queryCache.set(cacheKey, {
        executions: [],
        avgTime: 0,
        bestTime: executionTime,
        worstTime: executionTime
      });
    }
    
    const cacheEntry = this.queryCache.get(cacheKey);
    cacheEntry.executions.push({
      time: executionTime,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 executions
    if (cacheEntry.executions.length > 100) {
      cacheEntry.executions = cacheEntry.executions.slice(-100);
    }
    
    // Update performance metrics
    const times = cacheEntry.executions.map(e => e.time);
    cacheEntry.avgTime = Math.round(times.reduce((sum, time) => sum + time, 0) / times.length);
    cacheEntry.bestTime = Math.min(...times);
    cacheEntry.worstTime = Math.max(...times);
    
    this.queryCache.set(cacheKey, cacheEntry);
  }

  /**
   * Generate cache key for query performance tracking
   */
  generateQueryCacheKey(queryData) {
    const keyParts = [
      queryData.type || 'unknown',
      (queryData.tables || []).sort().join('-'),
      (queryData.conditions || []).sort().join('-'),
      (queryData.groupBy || []).join('-')
    ];
    
    return keyParts.join('_');
  }

  /**
   * Track user interactions (field selections, chart changes, etc.)
   */
  trackUserInteraction(interactionType, data = {}) {
    const event = {
      type: 'user_interaction',
      timestamp: new Date().toISOString(),
      sessionId: this.getCurrentSessionId(),
      data: {
        interaction: interactionType,
        ...data
      }
    };

    this.recordEvent(event);
  }

  /**
   * Track template usage
   */
  trackTemplateUsage(templateId, templateData) {
    const event = {
      type: 'template_usage',
      timestamp: new Date().toISOString(),
      sessionId: this.getCurrentSessionId(),
      data: {
        templateId,
        templateName: templateData.name,
        templateCategory: templateData.category,
        templateDifficulty: templateData.difficulty,
        fieldsCount: templateData.template?.fields?.length || 0,
        tablesCount: templateData.template?.collections?.length || 0
      }
    };

    this.recordEvent(event);
  }

  /**
   * Track validation and recommendation events
   */
  trackValidationEvent(eventType, validationData) {
    const event = {
      type: 'validation_event',
      timestamp: new Date().toISOString(),
      sessionId: this.getCurrentSessionId(),
      data: {
        eventType, // 'error', 'warning', 'recommendation'
        ...validationData
      }
    };

    this.recordEvent(event);
  }

  /**
   * Get analytics summary for admin dashboard
   */
  getAnalyticsSummary(timeRange = '24h') {
    const events = this.getEventsInTimeRange(timeRange);
    
    return {
      overview: {
        totalReports: this.countEventsByType(events, 'report_generation'),
        totalSessions: new Set(events.map(e => e.sessionId)).size,
        avgExecutionTime: this.calculateAverageExecutionTime(events),
        performanceDistribution: this.getPerformanceDistribution(events)
      },
      popularVisualizationTypes: this.getPopularVisualizationTypes(events),
      commonFieldCombinations: this.getCommonFieldCombinations(events),
      performanceInsights: this.getPerformanceInsights(events),
      templateUsage: this.getTemplateUsageStats(events),
      validationIssues: this.getValidationIssuesStats(events),
      timeRange
    };
  }

  /**
   * Get performance recommendations based on analytics
   */
  getPerformanceRecommendations() {
    const recentEvents = this.getEventsInTimeRange('7d');
    const slowQueries = recentEvents.filter(e => 
      e.type === 'query_performance' && 
      e.data.performanceLevel === 'slow'
    );

    const recommendations = [];

    // Identify slow query patterns
    const slowQueryPatterns = this.analyzeSlowQueryPatterns(slowQueries);
    slowQueryPatterns.forEach(pattern => {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Optimize Slow Query Pattern',
        description: `Queries with ${pattern.characteristic} are consistently slow`,
        suggestion: pattern.recommendation,
        affectedQueries: pattern.count
      });
    });

    // Identify popular combinations that could be cached
    const popularCombinations = this.getCommonFieldCombinations(recentEvents);
    popularCombinations.slice(0, 3).forEach(combo => {
      recommendations.push({
        type: 'caching',
        priority: 'medium',
        title: 'Consider Caching Popular Combination',
        description: `Field combination used ${combo.count} times`,
        suggestion: `Cache results for fields: ${combo.fields.join(', ')}`,
        usage: combo.count
      });
    });

    return recommendations;
  }

  /**
   * Record an analytics event
   */
  recordEvent(event) {
    // In production, this would send to analytics service
    console.log('[Analytics]', event);
    
    // Store in memory for demo (in production, use database)
    const key = `${event.timestamp}_${event.type}`;
    this.metrics.set(key, event);

    // Cleanup old events (keep last 1000)
    if (this.metrics.size > 1000) {
      const firstKey = this.metrics.keys().next().value;
      this.metrics.delete(firstKey);
    }
  }

  /**
   * Calculate query complexity score
   */
  calculateQueryComplexity(queryData) {
    let complexity = 0;
    
    // Base complexity for each table
    complexity += (queryData.tables?.length || 0) * 10;
    
    // Additional complexity for joins
    complexity += (queryData.joins?.length || 0) * 20;
    
    // Complexity for conditions
    complexity += (queryData.conditions?.length || 0) * 5;
    
    // Complexity for grouping and sorting
    complexity += (queryData.groupBy?.length || 0) * 15;
    complexity += (queryData.orderBy?.length || 0) * 5;
    
    return {
      score: complexity,
      level: complexity < 50 ? 'low' : complexity < 100 ? 'medium' : 'high'
    };
  }

  /**
   * Classify query performance
   */
  classifyPerformance(executionTime) {
    if (executionTime > this.performanceThresholds.slow) return 'slow';
    if (executionTime > this.performanceThresholds.medium) return 'medium';
    return 'fast';
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current session ID (simplified for demo)
   */
  getCurrentSessionId() {
    if (!this.currentSessionId) {
      this.currentSessionId = this.generateSessionId();
    }
    return this.currentSessionId;
  }

  /**
   * Get events within time range
   */
  getEventsInTimeRange(timeRange) {
    const now = new Date();
    let startTime;

    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    return Array.from(this.metrics.values()).filter(event => 
      new Date(event.timestamp) >= startTime
    );
  }

  /**
   * Count events by type
   */
  countEventsByType(events, type) {
    return events.filter(event => event.type === type).length;
  }

  /**
   * Calculate average execution time
   */
  calculateAverageExecutionTime(events) {
    const performanceEvents = events.filter(e => e.type === 'query_performance');
    if (performanceEvents.length === 0) return 0;

    const totalTime = performanceEvents.reduce((sum, event) => 
      sum + event.data.executionTime, 0
    );
    return Math.round(totalTime / performanceEvents.length);
  }

  /**
   * Get performance distribution
   */
  getPerformanceDistribution(events) {
    const performanceEvents = events.filter(e => e.type === 'query_performance');
    const distribution = { fast: 0, medium: 0, slow: 0 };

    performanceEvents.forEach(event => {
      distribution[event.data.performanceLevel]++;
    });

    return distribution;
  }

  /**
   * Get popular visualization types
   */
  getPopularVisualizationTypes(events) {
    const reportEvents = events.filter(e => e.type === 'report_generation');
    const types = {};

    reportEvents.forEach(event => {
      const type = event.data.visualizationType || 'unknown';
      types[type] = (types[type] || 0) + 1;
    });

    return Object.entries(types)
      .sort(([,a], [,b]) => b - a)
      .map(([type, count]) => ({ type, count }));
  }

  /**
   * Get common field combinations
   */
  getCommonFieldCombinations(events) {
    const reportEvents = events.filter(e => e.type === 'report_generation');
    const combinations = {};

    reportEvents.forEach(event => {
      if (event.data.fields && event.data.fields.length > 0) {
        const key = event.data.fields.sort().join(',');
        combinations[key] = (combinations[key] || 0) + 1;
      }
    });

    return Object.entries(combinations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([fields, count]) => ({ fields: fields.split(','), count }));
  }

  /**
   * Get performance insights
   */
  getPerformanceInsights(events) {
    const performanceEvents = events.filter(e => e.type === 'query_performance');
    
    // Group by complexity level
    const complexityPerformance = {};
    performanceEvents.forEach(event => {
      const level = event.data.complexity.level;
      if (!complexityPerformance[level]) {
        complexityPerformance[level] = { total: 0, count: 0 };
      }
      complexityPerformance[level].total += event.data.executionTime;
      complexityPerformance[level].count += 1;
    });

    // Calculate averages
    Object.keys(complexityPerformance).forEach(level => {
      const data = complexityPerformance[level];
      data.average = Math.round(data.total / data.count);
    });

    return {
      byComplexity: complexityPerformance,
      totalQueries: performanceEvents.length,
      averageTime: this.calculateAverageExecutionTime(events)
    };
  }

  /**
   * Get template usage statistics
   */
  getTemplateUsageStats(events) {
    const templateEvents = events.filter(e => e.type === 'template_usage');
    const stats = {};

    templateEvents.forEach(event => {
      const templateId = event.data.templateId;
      if (!stats[templateId]) {
        stats[templateId] = {
          name: event.data.templateName,
          category: event.data.templateCategory,
          count: 0
        };
      }
      stats[templateId].count++;
    });

    return Object.entries(stats)
      .sort(([,a], [,b]) => b.count - a.count)
      .map(([id, data]) => ({ id, ...data }));
  }

  /**
   * Get validation issues statistics
   */
  getValidationIssuesStats(events) {
    const validationEvents = events.filter(e => e.type === 'validation_event');
    const stats = { errors: 0, warnings: 0, recommendations: 0 };

    validationEvents.forEach(event => {
      const type = event.data.eventType;
      if (stats.hasOwnProperty(type)) {
        stats[type]++;
      }
    });

    return stats;
  }

  /**
   * Analyze slow query patterns
   */
  analyzeSlowQueryPatterns(slowQueries) {
    const patterns = [];
    
    // Pattern: Multiple table joins
    const multiTableQueries = slowQueries.filter(q => 
      q.data.query.tables.length > 2
    );
    if (multiTableQueries.length > 0) {
      patterns.push({
        characteristic: 'multiple table joins',
        count: multiTableQueries.length,
        recommendation: 'Consider using indexed fields for joins and limiting result sets'
      });
    }

    // Pattern: Large result sets
    const largeResultQueries = slowQueries.filter(q => 
      q.data.resultCount > 10000
    );
    if (largeResultQueries.length > 0) {
      patterns.push({
        characteristic: 'large result sets',
        count: largeResultQueries.length,
        recommendation: 'Implement pagination or add more specific filters'
      });
    }

    // Pattern: Complex aggregations
    const complexAggregations = slowQueries.filter(q => 
      q.data.complexity.level === 'high'
    );
    if (complexAggregations.length > 0) {
      patterns.push({
        characteristic: 'complex aggregations',
        count: complexAggregations.length,
        recommendation: 'Pre-calculate common aggregations or use materialized views'
      });
    }

    return patterns;
  }

  /**
   * Export analytics data for external analysis
   */
  exportAnalyticsData(timeRange = '7d', format = 'json') {
    const events = this.getEventsInTimeRange(timeRange);
    const summary = this.getAnalyticsSummary(timeRange);
    
    const exportData = {
      metadata: {
        exportTime: new Date().toISOString(),
        timeRange,
        totalEvents: events.length,
        format
      },
      summary,
      events: events.map(event => ({
        ...event,
        // Remove sensitive information if needed
        sessionId: `session_${event.sessionId.split('_')[1]}`
      }))
    };

    if (format === 'csv') {
      return this.convertToCSV(exportData.events);
    }

    return exportData;
  }

  /**
   * Convert events to CSV format
   */
  convertToCSV(events) {
    if (events.length === 0) return '';

    const headers = ['timestamp', 'type', 'sessionId'];
    const rows = events.map(event => [
      event.timestamp,
      event.type,
      event.sessionId
    ]);

    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

module.exports = analyticsService;