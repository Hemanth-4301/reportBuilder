import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import toast from "react-hot-toast";
import {
  Plus,
  Trash2,
  Settings,
  Play,
  Sparkles,
  Filter,
  BarChart3,
  Table as TableIcon,
  PieChart,
  LineChart,
  Target,
  Calendar,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
} from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import { reportsService } from "../services/reportsService";
import FieldValidationService from "../services/FieldValidationService";
import RecommendationEngine from "../services/RecommendationEngine";
import HelpSystem from "./HelpSystem";
import TemplateModal from "./TemplateModal";
import analyticsService from "../services/analyticsService";

const Canvas = ({
  collections,
  selectedCollections,
  selectedFields,
  dataModel,
  visualization,
  onDataModelChange,
  onVisualizationChange,
  onReportData,
  onReportMeta, // optional callback for metadata (record counts, performance)
}) => {
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: { start: "", end: "" },
    factory: "",
    region: "",
    productId: "",
  });
  const [aggregations, setAggregations] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [validationWarnings, setValidationWarnings] = useState([]);
  const [chartRecommendations, setChartRecommendations] = useState([]);
  const [performanceAnalysis, setPerformanceAnalysis] = useState(null);
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [showHelpSystem, setShowHelpSystem] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Get available chart types based on current selection
  const availableChartTypes = FieldValidationService.getAvailableChartTypes(
    selectedFields, 
    selectedCollections
  );

  const visualizationTypes = [
    {
      type: "bar",
      label: "Bar Chart",
      icon: BarChart3,
      color: "text-blue-600",
      enabled: availableChartTypes.bar?.enabled || false,
      reason: availableChartTypes.bar?.reason || "",
      description: "Compare values across categories",
      minFields: 2,
      maxFields: 10,
      bestFor: ["comparisons", "rankings", "trends"]
    },
    {
      type: "line",
      label: "Line Chart",
      icon: LineChart,
      color: "text-green-600",
      enabled: availableChartTypes.line?.enabled || false,
      reason: availableChartTypes.line?.reason || "",
      description: "Show trends over time",
      minFields: 2,
      maxFields: 8,
      bestFor: ["time-series", "trends", "progress"]
    },
    {
      type: "pie",
      label: "Pie Chart",
      icon: PieChart,
      color: "text-purple-600",
      enabled: availableChartTypes.pie?.enabled || false,
      reason: availableChartTypes.pie?.reason || "",
      description: "Show proportions of a whole",
      minFields: 2,
      maxFields: 2,
      bestFor: ["proportions", "distribution", "percentages"]
    },
    {
      type: "multi-bar",
      label: "Multi-Series Bar",
      icon: BarChart3,
      color: "text-indigo-600",
      enabled: selectedFields.length >= 3,
      reason: selectedFields.length < 3 ? "Requires at least 3 fields" : "",
      description: "Compare multiple metrics across categories",
      minFields: 3,
      maxFields: 15,
      bestFor: ["multi-metric", "cross-table", "detailed-comparison"]
    },
    {
      type: "grouped-table",
      label: "Grouped Table",
      icon: TableIcon,
      color: "text-slate-600",
      enabled: selectedFields.length >= 2,
      reason: selectedFields.length < 2 ? "Requires at least 2 fields" : "",
      description: "Organized data with grouping",
      minFields: 2,
      maxFields: 20,
      bestFor: ["detailed-data", "cross-table", "all-fields"]
    },
    {
      type: "comparison-chart",
      label: "Cross-Table Compare",
      icon: BarChart3,
      color: "text-orange-600",
      enabled: selectedCollections.length >= 2 && selectedFields.length >= 2,
      reason: selectedCollections.length < 2 ? "Requires multiple tables" : selectedFields.length < 2 ? "Requires at least 2 fields" : "",
      description: "Compare data across different tables",
      minFields: 2,
      maxFields: 12,
      bestFor: ["cross-table", "table-comparison", "relationship-analysis"]
    },
    {
      type: "table",
      label: "Simple Table",
      icon: TableIcon,
      color: "text-gray-600",
      enabled: availableChartTypes.table?.enabled || false,
      reason: availableChartTypes.table?.reason || "",
      description: "Raw data in tabular format",
      minFields: 1,
      maxFields: 50,
      bestFor: ["raw-data", "detailed-view", "export"]
    },
  ];

  const generateReport = useCallback(async () => {
    // Comprehensive validation before generating report
    const validation = FieldValidationService.validateFieldsForChart(
      selectedFields, 
      visualization.type, 
      selectedCollections
    );

    if (!validation.isValid) {
      const errorMessage = validation.errors.join('. ');
      toast.error(errorMessage);
      setValidationErrors(validation.errors);
      return;
    }

    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        toast.error(warning, { duration: 6000 });
      });
    }

    if (selectedCollections.length === 0) {
      toast.error("Please select at least one collection");
      return;
    }

    if (selectedFields.length === 0) {
      toast.error("Please select at least one field");
      return;
    }

    setLoading(true);
    try {
      const cleanedFilters = {
        dateRange: {
          start: filters.dateRange.start || undefined,
          end: filters.dateRange.end || undefined,
        },
        factory: filters.factory || undefined,
        region: filters.region || undefined,
        productId: filters.productId || undefined,
      };

      // If axes are not provided for chart visualizations, pick sensible defaults
      let resolvedVisualization = { ...visualization };
      if (visualization.type !== "table") {
        // Determine categorical (string/object) and numeric fields from selectedFields
        const categorical = selectedFields.filter(f => f.type === 'string' || f.type === 'object');
        const numeric = selectedFields.filter(f => f.type === 'number');

        if (!visualization.xAxis || visualization.xAxis === "") {
          // Prefer a categorical field for xAxis, fallback to first field name
          resolvedVisualization.xAxis = (categorical[0] && categorical[0].name) || (selectedFields[0] && selectedFields[0].name) || "";
        }

        if (!visualization.yAxis || visualization.yAxis === "") {
          // Prefer a numeric field for yAxis, fallback to count of first categorical field
          resolvedVisualization.yAxis = (numeric[0] && numeric[0].name) || (categorical[0] && categorical[0].name) || (selectedFields[0] && selectedFields[0].name) || "";
        }
      }

      const reportConfig = {
        dataModel: {
          collections: dataModel.collections || [],
          fields: dataModel.fields || [],
          joins: dataModel.joins || [],
          aggregations: aggregations || [],
        },
        visualization: {
          type: resolvedVisualization.type,
          xAxis: resolvedVisualization.xAxis || "",
          yAxis: resolvedVisualization.yAxis || "",
          categoryField: resolvedVisualization.categoryField,
          valueFields: resolvedVisualization.valueFields,
          seriesField: resolvedVisualization.seriesField,
          groupBy: resolvedVisualization.groupBy,
        },
        filters: cleanedFilters,
      };

      // Track report generation attempt
      analyticsService.trackReportGeneration(reportConfig);

      const result = await reportsService.generateReport(reportConfig);

      if (result.success) {
        // Backend returns { type, data: { labels, datasets }, totalRecords }
        // PreviewPane expects the chart/table payload directly (labels/datasets or rows/columns).
        // Prefer the inner `data` object when present, otherwise pass the whole object.
        const payload = result.data && result.data.data ? result.data.data : result.data;
        onReportData(payload);
        // Provide metadata to the parent if supported (non-breaking)
        if (typeof onReportMeta === 'function') {
          onReportMeta(result.metadata || result.data?.metadata || {});
        }
        const count = result.metadata?.totalRecords ?? result.metadata?.recordCount ?? 0;
        toast.success(
          `Report generated successfully with ${count} records`
        );
      } else {
        toast.error(result.error || "Failed to generate report");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to generate report";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [
    selectedCollections,
    selectedFields,
    dataModel,
    visualization,
    filters,
    aggregations,
    onReportData,
  ]);

  const handleAISuggestion = async () => {
    if (selectedCollections.length === 0 || selectedFields.length === 0) {
      toast.error("Please select collections and fields first");
      return;
    }
    setShowAIModal(true);
  };

  const applyAISuggestion = async (suggestion) => {
    onVisualizationChange(suggestion);
    setShowAIModal(false);
    toast.success("AI suggestion applied!");
  };

  // Template application handler
  const handleApplyTemplate = (templateResult) => {
    const { config, instructions, nextSteps } = templateResult;
    
    // Track template usage
    analyticsService.trackTemplateUsage(config.templateInfo.id, {
      name: config.templateInfo.name,
      category: config.templateInfo.category,
      template: {
        fields: config.selectedFields,
        collections: config.selectedCollections
      }
    });
    
    // Apply template configuration
    onFieldsChange(config.selectedCollections, config.selectedFields);
    onVisualizationChange(config.visualization);
    setFilters(config.filters);
    setAggregations(config.aggregations);
    
    // Show success message with instructions
    toast.success(
      <div>
        <p className="font-medium">Template Applied Successfully!</p>
        <div className="mt-1 text-sm">
          {instructions.slice(0, 2).map((instruction, index) => (
            <div key={index}>• {instruction}</div>
          ))}
        </div>
      </div>,
      { duration: 4000 }
    );
    
    console.log('Template applied:', config.templateInfo);
    console.log('Next steps:', nextSteps);
  };

  const addAggregation = () => {
    const newAggregation = {
      id: Date.now(),
      type: "sum",
      field: selectedFields[0]?.name || "",
      groupBy: selectedFields[0]?.name || "",
    };
    setAggregations([...aggregations, newAggregation]);
  };

  const removeAggregation = (id) => {
    setAggregations(aggregations.filter((agg) => agg.id !== id));
  };

  const updateAggregation = (id, updates) => {
    setAggregations(
      aggregations.map((agg) => (agg.id === id ? { ...agg, ...updates } : agg))
    );
  };

  // Real-time validation and intelligence effect
  React.useEffect(() => {
    if (selectedFields.length > 0) {
      const validation = FieldValidationService.validateFieldsForChart(
        selectedFields, 
        visualization.type, 
        selectedCollections
      );
      
      setValidationErrors(validation.errors || []);
      setValidationWarnings(validation.warnings || []);
      
      // Track validation events
      if (validation.errors?.length > 0) {
        validation.errors.forEach(error => {
          analyticsService.trackValidationError('field_validation', {
            error,
            fieldCount: selectedFields.length,
            tableCount: selectedCollections.length,
            chartType: visualization.type
          });
        });
      }
      
      if (validation.warnings?.length > 0) {
        validation.warnings.forEach(warning => {
          analyticsService.trackValidationWarning('field_validation', {
            warning,
            fieldCount: selectedFields.length,
            tableCount: selectedCollections.length,
            chartType: visualization.type
          });
        });
      }
      
      // Get enhanced chart recommendations with intelligence
      const recommendations = RecommendationEngine.getSmartChartRecommendations(
        selectedFields,
        selectedCollections
      );
      setChartRecommendations(recommendations.slice(0, 3));
      
      // Get performance analysis
      const performance = RecommendationEngine.analyzePerformance(
        selectedFields,
        selectedCollections
      );
      setPerformanceAnalysis(performance);
      
      // Get smart suggestions
      const analysis = RecommendationEngine.analyzeFieldSelection(
        selectedFields,
        selectedCollections,
        visualization.type
      );
      setSmartSuggestions(analysis.suggestions || []);
    } else {
      setValidationErrors([]);
      setValidationWarnings([]);
      setChartRecommendations([]);
      setPerformanceAnalysis(null);
      setSmartSuggestions([]);
    }
  }, [selectedFields, selectedCollections, visualization.type]);

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (
      source.droppableId === "selected-fields" &&
      destination.droppableId === "selected-fields"
    ) {
      const reorderedFields = Array.from(selectedFields);
      const [removed] = reorderedFields.splice(source.index, 1);
      reorderedFields.splice(destination.index, 0, removed);

      onDataModelChange({
        ...dataModel,
        fields: reorderedFields.map((field) => field.name),
      });
    }
  };

  return (
    <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">
              Report Canvas
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Configure your data model and visualization settings
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all text-xs sm:text-sm"
              title="Use pre-built report templates"
            >
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Templates</span>
            </button>
            <button
              onClick={() => setShowHelpSystem(true)}
              className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all text-xs sm:text-sm"
              title="Get help and tutorials"
            >
              <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Help</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border transition-all text-xs sm:text-sm ${
                showFilters
                  ? "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700 text-primary-700 dark:text-primary-300"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            <button
              onClick={generateReport}
              disabled={loading || selectedCollections.length === 0}
              className="flex items-center space-x-1 sm:space-x-2 px-4 sm:px-6 py-1.5 sm:py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 text-xs sm:text-sm"
            >
              {loading ? (
                <LoadingSpinner size="small" />
              ) : (
                <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
              <span>Generate</span>
            </button>
          </div>
        </div>
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="card p-3 sm:p-4 mb-4 sm:mb-6 overflow-hidden"
            >
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center space-x-2">
                <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
                <span>Data Filters</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 sm:mb-2">
                    Date Range Start
                  </label>
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        dateRange: {
                          ...filters.dateRange,
                          start: e.target.value,
                        },
                      })
                    }
                    className="input-field w-full text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 sm:mb-2">
                    Date Range End
                  </label>
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        dateRange: {
                          ...filters.dateRange,
                          end: e.target.value,
                        },
                      })
                    }
                    className="input-field w-full text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 sm:mb-2">
                    Factory
                  </label>
                  <input
                    type="text"
                    value={filters.factory}
                    onChange={(e) =>
                      setFilters({ ...filters, factory: e.target.value })
                    }
                    placeholder="e.g., Factory-A"
                    className="input-field w-full text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 sm:mb-2">
                    Product ID
                  </label>
                  <input
                    type="text"
                    value={filters.productId}
                    onChange={(e) =>
                      setFilters({ ...filters, productId: e.target.value })
                    }
                    placeholder="e.g., PROD-001"
                    className="input-field w-full text-xs sm:text-sm"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-4 sm:space-y-6">
            <div className="card p-3 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center space-x-2">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
                <span>Selected Collections</span>
              </h3>
              {selectedCollections.length > 0 ? (
                <div className="space-y-2">
                  {selectedCollections.map((collection) => (
                    <div
                      key={collection.name}
                      className="flex items-center justify-between p-2 sm:p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800"
                    >
                      <div>
                        <h4 className="font-medium text-primary-900 dark:text-primary-100 text-sm sm:text-base">
                          {collection.displayName}
                        </h4>
                        <p className="text-xs text-primary-600 dark:text-primary-400">
                          {collection.count} records
                        </p>
                      </div>
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-primary-500 rounded-full"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-slate-500 dark:text-slate-400">
                  <p className="text-sm sm:text-base">
                    No collections selected
                  </p>
                  <p className="text-xs sm:text-sm mt-1">
                    Select collections from the sidebar
                  </p>
                </div>
              )}
            </div>
            <div className="card p-3 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                Selected Fields
              </h3>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="selected-fields">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 min-h-20 p-2 sm:p-3 border-2 border-dashed rounded-lg transition-all ${
                        snapshot.isDraggingOver
                          ? "border-primary-400 bg-primary-50 dark:bg-primary-900/20"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {selectedFields.length > 0 ? (
                        selectedFields.map((field, index) => (
                          <Draggable
                            key={field.id}
                            draggableId={field.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-2 sm:p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border transition-all ${
                                  snapshot.isDragging
                                    ? "shadow-lg scale-105 border-primary-400"
                                    : "border-slate-200 dark:border-slate-600 hover:border-primary-300"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                                      {field.displayName}
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {field.collection}.{field.name} •{" "}
                                      {field.type}
                                    </p>
                                  </div>
                                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      ) : (
                        <div className="text-center py-4 sm:py-6 text-slate-500 dark:text-slate-400">
                          <p className="text-sm sm:text-base">
                            No fields selected
                          </p>
                          <p className="text-xs sm:text-sm mt-1">
                            Drag fields from collections
                          </p>
                        </div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
            <div className="card p-3 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold">
                  Aggregations
                </h3>
                <button
                  onClick={addAggregation}
                  disabled={selectedFields.length === 0}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors disabled:opacity-50 text-xs sm:text-sm"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Add</span>
                </button>
              </div>
              {aggregations.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {aggregations.map((agg) => (
                    <div
                      key={agg.id}
                      className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 flex-wrap gap-2"
                    >
                      <select
                        value={agg.type}
                        onChange={(e) =>
                          updateAggregation(agg.id, { type: e.target.value })
                        }
                        className="input-field flex-1 min-w-[100px] text-xs sm:text-sm"
                      >
                        <option value="sum">Sum</option>
                        <option value="count">Count</option>
                        <option value="average">Average</option>
                      </select>
                      <select
                        value={agg.field}
                        onChange={(e) =>
                          updateAggregation(agg.id, { field: e.target.value })
                        }
                        className="input-field flex-1 min-w-[100px] text-xs sm:text-sm"
                      >
                        {selectedFields.map((field) => (
                          <option key={field.id} value={field.name}>
                            {field.displayName}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeAggregation(agg.id)}
                        className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 sm:py-6 text-slate-500 dark:text-slate-400">
                  <p className="text-sm sm:text-base">
                    No aggregations configured
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="card p-3 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
              Visualization Settings
            </h3>
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 sm:mb-3">
                Chart Type
              </label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {visualizationTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = visualization.type === type.type;

                  return (
                    <button
                      key={type.type}
                      onClick={() => {
                        if (type.enabled) {
                          onVisualizationChange({
                            ...visualization,
                            type: type.type,
                            xAxis:
                              type.type === "table" ? "" : visualization.xAxis,
                            yAxis:
                              type.type === "table" ? "" : visualization.yAxis,
                          });
                        }
                      }}
                      disabled={!type.enabled}
                      title={type.enabled ? type.label : `${type.label}: ${type.reason}`}
                      className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-4 rounded-lg border-2 transition-all text-xs sm:text-sm ${
                        isSelected
                          ? "border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                          : !type.enabled
                          ? "border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50"
                          : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-primary-300 hover:bg-primary-25 dark:hover:bg-primary-900/10"
                      }`}
                    >
                      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${type.color}`} />
                      <span className="font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {visualization.type !== "table" && (
              <div className="space-y-3 sm:space-y-4">
                {/* Field Categorization Helper */}
                {selectedFields.length > 2 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Field Analysis ({selectedFields.length} fields selected)
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-medium text-blue-800 dark:text-blue-200">Categorical:</span>
                        <div className="mt-1 space-y-1">
                          {selectedFields.filter(f => f.type === 'string' || f.type === 'object').map(field => (
                            <div key={field.id} className="text-blue-700 dark:text-blue-300">
                              • {field.displayName}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800 dark:text-blue-200">Numeric:</span>
                        <div className="mt-1 space-y-1">
                          {selectedFields.filter(f => f.type === 'number').map(field => (
                            <div key={field.id} className="text-blue-700 dark:text-blue-300">
                              • {field.displayName}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 sm:mb-2">
                    X-Axis Field (Categories/Labels)
                  </label>
                  <select
                    value={visualization.xAxis}
                    onChange={(e) =>
                      onVisualizationChange({
                        ...visualization,
                        xAxis: e.target.value,
                      })
                    }
                    className="input-field w-full text-xs sm:text-sm"
                    required
                  >
                    <option value="" disabled>
                      Select field for X-axis...
                    </option>
                    <optgroup label="Recommended (Categorical)">
                      {selectedFields
                        .filter(field => field.type === 'string' || field.type === 'object')
                        .map((field) => (
                          <option key={field.id} value={field.name}>
                            {field.displayName} ({field.type})
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Other Fields">
                      {selectedFields
                        .filter(field => field.type === 'number')
                        .map((field) => (
                          <option key={field.id} value={field.name}>
                            {field.displayName} ({field.type})
                          </option>
                        ))}
                    </optgroup>
                  </select>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Usually categorical fields like Product ID, Factory, or Date
                  </p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 sm:mb-2">
                    Y-Axis Field (Values/Measurements)
                  </label>
                  <select
                    value={visualization.yAxis}
                    onChange={(e) =>
                      onVisualizationChange({
                        ...visualization,
                        yAxis: e.target.value,
                      })
                    }
                    className="input-field w-full text-xs sm:text-sm"
                    required
                  >
                    <option value="" disabled>
                      Select field for Y-axis...
                    </option>
                    <optgroup label="Recommended (Numeric)">
                      {selectedFields
                        .filter((field) => field.type === "number")
                        .map((field) => (
                          <option key={field.id} value={field.name}>
                            {field.displayName} ({field.type})
                          </option>
                        ))}
                    </optgroup>
                    {selectedFields.filter(field => field.type === 'string' || field.type === 'object').length > 0 && (
                      <optgroup label="Other Fields (Count will be used)">
                        {selectedFields
                          .filter(field => field.type === 'string' || field.type === 'object')
                          .map((field) => (
                            <option key={field.id} value={field.name}>
                              Count of {field.displayName}
                            </option>
                          ))}
                      </optgroup>
                    )}
                  </select>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Usually numeric fields like Quantity, Amount, or Defect Count
                  </p>
                </div>

                {/* Multi-Dimensional Configuration */}
                {(visualization.type === 'multi-bar' || visualization.type === 'comparison-chart' || visualization.type === 'grouped-table') && (
                  <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Multi-Dimensional Configuration
                    </h4>
                    
                    {/* Category Field */}
                    <div>
                      <label className="block text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                        Category Field (Groups data by)
                      </label>
                      <select
                        value={visualization.categoryField || ''}
                        onChange={(e) =>
                          onVisualizationChange({
                            ...visualization,
                            categoryField: e.target.value,
                          })
                        }
                        className="input-field w-full text-xs"
                      >
                        <option value="">Select category field...</option>
                        {selectedFields
                          .filter(field => field.type === 'string' || field.type === 'object')
                          .map((field) => (
                            <option key={field.id} value={field.name}>
                              {field.displayName} ({field.collection})
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Value Fields (Multiple) */}
                    <div>
                      <label className="block text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                        Value Fields (Select multiple for comparison)
                      </label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {selectedFields
                          .filter(field => field.type === 'number')
                          .map((field) => (
                            <label key={field.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={(visualization.valueFields || []).includes(field.name)}
                                onChange={(e) => {
                                  const currentValues = visualization.valueFields || [];
                                  const newValues = e.target.checked
                                    ? [...currentValues, field.name]
                                    : currentValues.filter(v => v !== field.name);
                                  onVisualizationChange({
                                    ...visualization,
                                    valueFields: newValues,
                                  });
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs text-blue-700 dark:text-blue-300">
                                {field.displayName} ({field.collection})
                              </span>
                            </label>
                          ))}
                      </div>
                    </div>

                    {/* Series Field (for Cross-table comparison) */}
                    {visualization.type === 'comparison-chart' && (
                      <div>
                        <label className="block text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                          Series Field (Color/Group different series)
                        </label>
                        <select
                          value={visualization.seriesField || ''}
                          onChange={(e) =>
                            onVisualizationChange({
                              ...visualization,
                              seriesField: e.target.value,
                            })
                          }
                          className="input-field w-full text-xs"
                        >
                          <option value="">No series grouping</option>
                          {selectedFields
                            .filter(field => 
                              field.type === 'string' || field.type === 'object' &&
                              field.name !== visualization.categoryField
                            )
                            .map((field) => (
                              <option key={field.id} value={field.name}>
                                {field.displayName} ({field.collection})
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Traditional Axis Configuration (for simple charts) */}
                {!['multi-bar', 'comparison-chart', 'grouped-table'].includes(visualization.type) && (
                  <>
                    {/* Group By for traditional charts */}
                    {selectedFields.length > 2 && (
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 sm:mb-2">
                          Group By (Optional)
                        </label>
                        <select
                          value={visualization.groupBy || ''}
                          onChange={(e) =>
                            onVisualizationChange({
                              ...visualization,
                              groupBy: e.target.value,
                            })
                          }
                          className="input-field w-full text-xs sm:text-sm"
                        >
                          <option value="">
                            No grouping
                          </option>
                          {selectedFields
                            .filter(field => 
                              field.name !== visualization.xAxis && 
                              field.name !== visualization.yAxis &&
                              (field.type === 'string' || field.type === 'object')
                            )
                            .map((field) => (
                              <option key={field.id} value={field.name}>
                                Group by {field.displayName}
                              </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Group data by an additional field for deeper insights
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Multi-Field Usage Examples */}
                {selectedFields.length > 2 && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                      💡 Smart Recommendations for {selectedFields.length} Fields
                    </h4>
                    <div className="space-y-2 text-xs text-green-700 dark:text-green-300">
                      {/* Cross-table comparison suggestion */}
                      {selectedCollections.length > 1 && (
                        <div className="flex items-start space-x-2">
                          <span className="text-green-500 mt-0.5">•</span>
                          <div>
                            <span className="font-medium">Cross-Table Compare:</span> Compare metrics from {selectedCollections.join(' vs ')} tables
                          </div>
                        </div>
                      )}
                      
                      {/* Multi-series suggestion */}
                      {selectedFields.filter(f => f.type === 'number').length > 1 && (
                        <div className="flex items-start space-x-2">
                          <span className="text-green-500 mt-0.5">•</span>
                          <div>
                            <span className="font-medium">Multi-Series Bar:</span> Compare multiple metrics ({selectedFields.filter(f => f.type === 'number').map(f => f.displayName).join(', ')}) side by side
                          </div>
                        </div>
                      )}
                      
                      {/* Grouped table suggestion */}
                      <div className="flex items-start space-x-2">
                        <span className="text-green-500 mt-0.5">•</span>
                        <div>
                          <span className="font-medium">Grouped Table:</span> Organize data by categories for detailed analysis
                        </div>
                      </div>
                      
                      {/* Field utilization */}
                      <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-700">
                        <span className="font-medium">Available Fields:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {selectedFields.map(field => (
                            <span key={field.id} className={`px-2 py-0.5 rounded text-xs ${
                              field.type === 'number' 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                            }`}>
                              {field.displayName} ({field.collection})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Intelligence & Validation Feedback Section */}
          {(performanceAnalysis || smartSuggestions.length > 0 || validationErrors.length > 0 || validationWarnings.length > 0 || chartRecommendations.length > 0) && (
            <div className="mt-4 sm:mt-6 space-y-3">
              {/* Performance Analysis */}
              {performanceAnalysis && (
                <div className="p-3 sm:p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-indigo-600" />
                      <span className="font-medium text-indigo-900 dark:text-indigo-100 text-sm">
                        Performance Analysis
                      </span>
                    </div>
                    <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                      performanceAnalysis.score >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                      performanceAnalysis.score >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {performanceAnalysis.score}/100
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm text-indigo-700 dark:text-indigo-300 space-y-1">
                    <div className="flex justify-between">
                      <span>Complexity:</span>
                      <span className="font-medium">{performanceAnalysis.complexity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Est. Query Time:</span>
                      <span className="font-medium">{performanceAnalysis.estimatedQueryTime}</span>
                    </div>
                    {performanceAnalysis.optimizationTips && performanceAnalysis.optimizationTips.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-indigo-200 dark:border-indigo-700">
                        <p className="font-medium mb-1">Optimization Tips:</p>
                        <ul className="space-y-1">
                          {performanceAnalysis.optimizationTips.slice(0, 2).map((tip, index) => (
                            <li key={index} className="text-xs">• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Smart Suggestions */}
              {smartSuggestions.length > 0 && (
                <div className="p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-purple-900 dark:text-purple-100 text-sm">
                      Smart Suggestions
                    </span>
                  </div>
                  <ul className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 space-y-1">
                    {smartSuggestions.slice(0, 3).map((suggestion, index) => (
                      <li key={index}>• {typeof suggestion === 'string' ? suggestion : suggestion.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Errors */}
              {validationErrors.length > 0 && (
                <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-900 dark:text-red-100 text-sm">
                      Validation Issues
                    </span>
                  </div>
                  <ul className="text-xs sm:text-sm text-red-700 dark:text-red-300 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {typeof error === 'string' ? error : error.message || 'Validation error'}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {validationWarnings.length > 0 && (
                <div className="p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-900 dark:text-yellow-100 text-sm">
                      Recommendations
                    </span>
                  </div>
                  <ul className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    {validationWarnings.map((warning, index) => (
                      <li key={index}>• {typeof warning === 'string' ? warning : warning.message || 'Validation warning'}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Chart Recommendations */}
              {chartRecommendations.length > 0 && validationErrors.length === 0 && (
                <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                      Suggested Charts
                    </span>
                  </div>
                  <div className="space-y-2">
                    {chartRecommendations.map((rec, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                          <span className="font-medium">{rec.name}</span>
                          <span className="text-blue-600 dark:text-blue-400 ml-2">
                            ({rec.score}% match)
                          </span>
                        </div>
                        <button
                          onClick={() => onVisualizationChange({
                            ...visualization,
                            type: rec.type,
                          })}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                        >
                          Use
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Template Modal */}
      {showTemplateModal && (
        <TemplateModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          onApplyTemplate={handleApplyTemplate}
          currentState={{
            selectedFields,
            selectedCollections,
            visualization,
            filters
          }}
        />
      )}

      {/* Help System Modal */}
      {showHelpSystem && (
        <HelpSystem
          isOpen={showHelpSystem}
          onClose={() => setShowHelpSystem(false)}
          context={{
            selectedFields,
            selectedCollections,
            visualization,
            validationErrors,
            smartSuggestions
          }}
        />
      )}
    </div>
  );
};

export default Canvas;
