const express = require('express');
const router = express.Router();
const analyticsService = require('../utils/analyticsService');

/**
 * Get analytics summary
 * GET /api/analytics/summary?timeRange=24h
 */
router.get('/summary', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    const summary = analyticsService.getAnalyticsSummary(timeRange);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics summary'
    });
  }
});

/**
 * Get performance recommendations
 * GET /api/analytics/recommendations
 */
router.get('/recommendations', async (req, res) => {
  try {
    const recommendations = analyticsService.getPerformanceRecommendations();
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error fetching performance recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance recommendations'
    });
  }
});

/**
 * Export analytics data
 * GET /api/analytics/export?timeRange=7d&format=json
 */
router.get('/export', async (req, res) => {
  try {
    const { timeRange = '7d', format = 'json' } = req.query;
    const exportData = analyticsService.exportAnalyticsData(timeRange, format);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${timeRange}.csv`);
      res.send(exportData);
    } else {
      res.json({
        success: true,
        data: exportData
      });
    }
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics data'
    });
  }
});

/**
 * Track custom user interaction
 * POST /api/analytics/track
 */
router.post('/track', async (req, res) => {
  try {
    const { type, data = {} } = req.body;
    
    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Interaction type is required'
      });
    }
    
    analyticsService.trackUserInteraction(type, data);
    
    res.json({
      success: true,
      message: 'Interaction tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking user interaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track user interaction'
    });
  }
});

/**
 * Track template usage
 * POST /api/analytics/template-usage
 */
router.post('/template-usage', async (req, res) => {
  try {
    const { templateId, templateData } = req.body;
    
    if (!templateId || !templateData) {
      return res.status(400).json({
        success: false,
        error: 'Template ID and data are required'
      });
    }
    
    analyticsService.trackTemplateUsage(templateId, templateData);
    
    res.json({
      success: true,
      message: 'Template usage tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking template usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track template usage'
    });
  }
});

/**
 * Track validation events
 * POST /api/analytics/validation
 */
router.post('/validation', async (req, res) => {
  try {
    const { eventType, validationData } = req.body;
    
    if (!eventType) {
      return res.status(400).json({
        success: false,
        error: 'Event type is required'
      });
    }
    
    analyticsService.trackValidationEvent(eventType, validationData);
    
    res.json({
      success: true,
      message: 'Validation event tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking validation event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track validation event'
    });
  }
});

/**
 * Get real-time metrics (last hour)
 * GET /api/analytics/realtime
 */
router.get('/realtime', async (req, res) => {
  try {
    const realtimeData = analyticsService.getAnalyticsSummary('1h');
    
    // Add some real-time specific metrics
    const enhancedData = {
      ...realtimeData,
      isRealtime: true,
      refreshRate: 30, // seconds
      lastUpdate: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: enhancedData
    });
  } catch (error) {
    console.error('Error fetching real-time analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch real-time analytics'
    });
  }
});

module.exports = router;