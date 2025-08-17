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
  Table,
  PieChart,
  LineChart,
  Target,
  Calendar,
} from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import { reportsService } from "../services/reportsService";

const Canvas = ({
  collections,
  selectedCollections,
  selectedFields,
  dataModel,
  visualization,
  onDataModelChange,
  onVisualizationChange,
  onReportData,
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

  const visualizationTypes = [
    {
      type: "bar",
      label: "Bar Chart",
      icon: BarChart3,
      color: "text-blue-600",
    },
    {
      type: "line",
      label: "Line Chart",
      icon: LineChart,
      color: "text-green-600",
    },
    {
      type: "pie",
      label: "Pie Chart",
      icon: PieChart,
      color: "text-purple-600",
    },
  ];

  const generateReport = useCallback(async () => {
    if (selectedCollections.length === 0) {
      toast.error("Please select at least one collection");
      return;
    }

    if (selectedFields.length === 0) {
      toast.error("Please select at least one field");
      return;
    }

    if (
      visualization.type !== "table" &&
      (!visualization.xAxis || !visualization.yAxis)
    ) {
      toast.error(
        "Please select both X-Axis and Y-Axis fields for chart visualization"
      );
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

      const reportConfig = {
        dataModel: {
          collections: dataModel.collections || [],
          fields: dataModel.fields || [],
          joins: dataModel.joins || [],
          aggregations: aggregations || [],
        },
        visualization: {
          type: visualization.type,
          xAxis: visualization.xAxis || "",
          yAxis: visualization.yAxis || "",
        },
        filters: cleanedFilters,
      };

      const result = await reportsService.generateReport(reportConfig);

      if (result.success) {
        onReportData(result.data);
        toast.success(
          `Report generated successfully with ${result.metadata.totalRecords} records`
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
                      onClick={() =>
                        onVisualizationChange({
                          ...visualization,
                          type: type.type,
                          xAxis:
                            type.type === "table" ? "" : visualization.xAxis,
                          yAxis:
                            type.type === "table" ? "" : visualization.yAxis,
                        })
                      }
                      className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-4 rounded-lg border-2 transition-all text-xs sm:text-sm ${
                        isSelected
                          ? "border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
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
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 sm:mb-2">
                    X-Axis Field
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
                      Select field...
                    </option>
                    {selectedFields.map((field) => (
                      <option key={field.id} value={field.name}>
                        {field.displayName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 sm:mb-2">
                    Y-Axis Field
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
                      Select field...
                    </option>
                    {selectedFields
                      .filter((field) => field.type === "number")
                      .map((field) => (
                        <option key={field.id} value={field.name}>
                          {field.displayName}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Canvas;
