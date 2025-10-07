/**
 * Frontend Analytics Service
 * 
 * Sends usage analytics to the backend for tracking user behavior,
 * performance metrics, and system usage patterns.
 */

class FrontendAnalyticsService {
  constructor() {
    this.baseUrl = '/api/analytics';
    this.sessionId = this.generateSessionId();
    this.isEnabled = true; // Could be controlled by user preferences
  }

  /**
   * Track user interactions
   */
  async trackInteraction(type, data = {}) {
    if (!this.isEnabled) return;

    try {
      await fetch(`${this.baseUrl}/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data: {
            ...data,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.pathname
          }
        })
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }

  /**
   * Track template usage
   */
  async trackTemplateUsage(templateId, templateData) {
    if (!this.isEnabled) return;

    try {
      await fetch(`${this.baseUrl}/template-usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId,
          templateData
        })
      });
    } catch (error) {
      console.warn('Template usage tracking failed:', error);
    }
  }

  /**
   * Track validation events
   */
  async trackValidationEvent(eventType, validationData) {
    if (!this.isEnabled) return;

    try {
      await fetch(`${this.baseUrl}/validation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType,
          validationData
        })
      });
    } catch (error) {
      console.warn('Validation event tracking failed:', error);
    }
  }

  /**
   * Track specific user actions
   */
  trackFieldSelection(fieldData) {
    this.trackInteraction('field_selection', {
      fieldName: fieldData.name,
      fieldType: fieldData.type,
      table: fieldData.table,
      totalFieldsSelected: fieldData.totalFields
    });
  }

  trackChartTypeChange(fromType, toType, reason = 'user_selection') {
    this.trackInteraction('chart_type_change', {
      fromType,
      toType,
      reason
    });
  }

  trackReportGeneration(reportConfig) {
    this.trackInteraction('report_generation', {
      fieldsCount: reportConfig.fields?.length || 0,
      tablesCount: reportConfig.collections?.length || 0,
      visualizationType: reportConfig.visualization?.type,
      hasFilters: Object.keys(reportConfig.filters || {}).length > 0,
      hasAggregations: (reportConfig.aggregations || []).length > 0
    });
  }

  trackValidationError(errorType, errorDetails) {
    this.trackValidationEvent('error', {
      errorType,
      errorDetails,
      context: 'field_validation'
    });
  }

  trackValidationWarning(warningType, warningDetails) {
    this.trackValidationEvent('warning', {
      warningType,
      warningDetails,
      context: 'field_validation'
    });
  }

  trackRecommendationAccepted(recommendationType, recommendationData) {
    this.trackInteraction('recommendation_accepted', {
      type: recommendationType,
      data: recommendationData
    });
  }

  trackHelpSystemUsage(helpType, helpContext) {
    this.trackInteraction('help_system_usage', {
      helpType,
      helpContext
    });
  }

  trackExportAction(exportType, dataSize) {
    this.trackInteraction('export_action', {
      exportType,
      dataSize,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track performance metrics from the frontend
   */
  trackPerformanceMetric(metricName, value, context = {}) {
    this.trackInteraction('performance_metric', {
      metricName,
      value,
      context
    });
  }

  /**
   * Track page load times
   */
  trackPageLoad() {
    if (typeof window.performance !== 'undefined') {
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
      this.trackPerformanceMetric('page_load_time', loadTime, {
        page: window.location.pathname
      });
    }
  }

  /**
   * Track component render times
   */
  trackComponentRender(componentName, renderTime) {
    this.trackPerformanceMetric('component_render_time', renderTime, {
      component: componentName
    });
  }

  /**
   * Get analytics summary (for admin users)
   */
  async getAnalyticsSummary(timeRange = '24h') {
    try {
      const response = await fetch(`${this.baseUrl}/summary?timeRange=${timeRange}`);
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to fetch analytics summary:', error);
      return null;
    }
  }

  /**
   * Get performance recommendations
   */
  async getPerformanceRecommendations() {
    try {
      const response = await fetch(`${this.baseUrl}/recommendations`);
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to fetch performance recommendations:', error);
      return null;
    }
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics() {
    try {
      const response = await fetch(`${this.baseUrl}/realtime`);
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to fetch real-time metrics:', error);
      return null;
    }
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `frontend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Enable/disable analytics tracking
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  /**
   * Batch tracking for multiple events
   */
  async trackBatch(events) {
    if (!this.isEnabled || !events.length) return;

    // For now, send events individually
    // In production, you might want to implement true batch sending
    for (const event of events) {
      await this.trackInteraction(event.type, event.data);
    }
  }

  /**
   * Track error events
   */
  trackError(error, context = {}) {
    this.trackInteraction('error', {
      message: error.message,
      stack: error.stack,
      context
    });
  }
}

// Create singleton instance
const frontendAnalytics = new FrontendAnalyticsService();

// Track page load on initialization
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    frontendAnalytics.trackPageLoad();
  });
}

export default frontendAnalytics;