import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Download,
  Image as ImageIcon,
  FileSpreadsheet,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";
import { exportService } from "../services/exportService";
import FieldValidationService from "../services/FieldValidationService";
import RecommendationEngine from "../services/RecommendationEngine";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const PreviewPane = ({ reportData, visualization, dataModel }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [validationSuggestions, setValidationSuggestions] = useState([]);
  const [performanceAnalysis, setPerformanceAnalysis] = useState(null);
  const [smartSuggestions, setSmartSuggestions] = useState([]);

  // Debugging: Log reportData and visualization type
  useEffect(() => {
    console.log("Report Data:", reportData);
    console.log("Visualization Type:", visualization.type);
  }, [reportData, visualization]);

  // Get validation suggestions and intelligence analysis when there's no data
  useEffect(() => {
    if (!reportData && dataModel?.fields?.length > 0) {
      const selectedFields = dataModel.fields.map(fieldName => ({
        name: fieldName,
        type: 'string' // Default type, could be enhanced
      }));
      
      // Get validation suggestions
      const suggestions = FieldValidationService.getFieldSelectionSuggestions(
        selectedFields,
        dataModel.collections || [],
        visualization.type
      );
      setValidationSuggestions(suggestions);
      
      // Get performance analysis
      const performance = RecommendationEngine.analyzePerformance(
        selectedFields,
        dataModel.collections || []
      );
      setPerformanceAnalysis(performance);
      
      // Get smart suggestions
      const analysis = RecommendationEngine.analyzeFieldSelection(
        selectedFields,
        dataModel.collections || [],
        visualization.type
      );
      setSmartSuggestions(analysis.suggestions || []);
    } else {
      setValidationSuggestions([]);
      setPerformanceAnalysis(null);
      setSmartSuggestions([]);
    }
  }, [reportData, dataModel, visualization.type]);

  // Detect dark mode to adjust chart colors for visibility
  const isDarkMode = typeof window !== 'undefined' && (
    document.documentElement.classList.contains('dark') || document.body.classList.contains('dark')
  );
  const adaptiveTextColor = isDarkMode ? '#e6eef8' : '#1f2937';
  const containerBackground = (() => {
    if (visualization?.type === 'table' || visualization?.type === 'grouped-table') {
      return isDarkMode ? '#0b1220' : '#ffffff';
    }
    return isDarkMode ? '#071026' : '#e5e7eb';
  })();

  // Color palettes tuned for dark & light backgrounds (high contrast)
  const lightPalette = [
    'rgba(54, 162, 235, 0.85)', // blue
    'rgba(255, 99, 132, 0.85)', // red
    'rgba(255, 159, 64, 0.85)', // orange
    'rgba(75, 192, 192, 0.85)', // teal
    'rgba(153, 102, 255, 0.85)', // purple
    'rgba(201, 203, 207, 0.85)' // gray
  ];

  const darkPalette = [
    '#60a5fa', // sky-400
    '#fb7185', // rose-400
    '#fb923c', // orange-400
    '#34d399', // green-400
    '#a78bfa', // violet-400
    '#94a3b8'  // slate-400
  ];

  const lightBorder = [
    'rgba(54, 162, 235, 1)',
    'rgba(255, 99, 132, 1)',
    'rgba(255, 159, 64, 1)',
    'rgba(75, 192, 192, 1)',
    'rgba(153, 102, 255, 1)',
    'rgba(201, 203, 207, 1)'
  ];

  const darkBorder = [
    '#1e40af',
    '#7f1d1d',
    '#9a3412',
    '#065f46',
    '#5b21b6',
    '#334155'
  ];

  const handleExport = async (format) => {
    if (!reportData) {
      toast.error("No data to export");
      return;
    }

    setExporting(true);
    try {
      switch (format) {
        case "pdf":
          await exportService.exportToPDF(reportData, visualization, dataModel);
          toast.success("PDF exported successfully!");
          break;
        case "excel":
          await exportService.exportToExcel(
            reportData,
            `manufacturing_report_${Date.now()}`
          );
          toast.success("Excel exported successfully!");
          break;
        case "image":
          // Debug: Log table DOM state before export
          const table = document.querySelector("#chart-container table");
          console.log(
            "Table DOM before PNG export:",
            table?.outerHTML || "No table found"
          );
          await exportService.exportToImage("chart-container");
          toast.success("Image exported successfully!");
          break;
        default:
          toast.error("Unsupported export format");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setExporting(false);
    }
  };

  const renderChart = () => {
    // Route table visualizations to the table renderer; renderTable will
    // normalize payload shapes (array-of-objects or envelope { data: [...] })
    if (visualization.type === "table" || visualization.type === "grouped-table") {
      return renderTable();
    }

    // Check for chart data
    if (!reportData || !reportData.labels || !reportData.datasets) {
      return (
        <div className="flex items-center justify-center h-64 md:h-80 lg:h-96 text-slate-500 dark:text-slate-400">
          <div className="text-center max-w-md mx-auto p-4">
            <RefreshCw className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm md:text-base font-medium mb-2">No data to display</p>
            <p className="text-xs md:text-sm mb-4">
              Generate a report to see visualization
            </p>
            
            {/* Intelligence and Suggestions */}
            <div className="space-y-3">
              {/* Performance Analysis */}
              {performanceAnalysis && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                      Performance Preview
                    </h4>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      performanceAnalysis.score >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                      performanceAnalysis.score >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {performanceAnalysis.score}/100
                    </span>
                  </div>
                  <div className="text-xs text-indigo-700 dark:text-indigo-300">
                    <p>Est. Query Time: <span className="font-medium">{performanceAnalysis.estimatedQueryTime}</span></p>
                  </div>
                </div>
              )}

              {/* Smart Suggestions */}
              {smartSuggestions.length > 0 && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 text-left">
                  <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                    Smart Suggestions:
                  </h4>
                  <ul className="space-y-1">
                    {smartSuggestions.slice(0, 2).map((suggestion, index) => (
                      <li key={index} className="text-xs text-purple-700 dark:text-purple-300 flex items-start space-x-1">
                        <span className="text-purple-500 mt-0.5">•</span>
                        <span>{typeof suggestion === 'string' ? suggestion : suggestion.message || 'Smart suggestion available'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Validation Suggestions */}
              {validationSuggestions.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-left">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Getting Started:
                  </h4>
                  <ul className="space-y-1">
                    {validationSuggestions.slice(0, 2).map((suggestion, index) => (
                      <li key={index} className="text-xs text-blue-700 dark:text-blue-300 flex items-start space-x-1">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{suggestion.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            usePointStyle: true,
            color: adaptiveTextColor,
            font: {
              size: window.innerWidth < 640 ? 10 : 12,
            },
          },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "white",
          bodyColor: "white",
          borderColor: "rgba(255, 255, 255, 0.1)",
          borderWidth: 1,
        },
      },
      scales:
        ["bar", "line", "multi-bar", "comparison-chart"].includes(visualization.type)
          ? {
              x: {
                grid: {
                  color: "rgba(0, 0, 0, 0.1)",
                },
                ticks: {
                  font: {
                    size: window.innerWidth < 640 ? 9 : 11,
                  },
                  color: adaptiveTextColor,
                  maxRotation: 45,
                },
              },
              y: {
                grid: {
                  color: "rgba(0, 0, 0, 0.1)",
                },
                ticks: {
                  font: {
                    size: window.innerWidth < 640 ? 9 : 11,
                  },
                  color: adaptiveTextColor,
                },
                beginAtZero: true,
              },
            }
          : undefined,
      backgroundColor: "#e5e7eb", // Set gray background for charts
    };

    // Prepare a safe chart data object that guarantees visible colors/contrast in dark mode
    const prepareChartData = (rd) => {
      if (!rd) return rd;
      let clone;
      try {
        clone = JSON.parse(JSON.stringify(rd));
      } catch (e) {
        clone = { ...rd };
      }
      if (clone.datasets && Array.isArray(clone.datasets)) {
        clone.datasets = clone.datasets.map((ds, i) => {
          const idx = i % (isDarkMode ? darkPalette.length : lightPalette.length);
          const bg = ds.backgroundColor || (isDarkMode ? darkPalette[idx] : lightPalette[idx]);
          const border = ds.borderColor || (isDarkMode ? darkBorder[idx] : lightBorder[idx]);
          return {
            ...ds,
            backgroundColor: bg,
            borderColor: border,
            borderWidth: ds.borderWidth ?? 1,
          };
        });
      }
      return clone;
    };

    const chartPayload = reportData?.data ? reportData.data : reportData;
    const chartData = prepareChartData(chartPayload);

    switch (visualization.type) {
      case "bar":
        return <Bar data={chartData} options={chartOptions} />;
      case "line":
        return <Line data={chartData} options={chartOptions} />;
      case "pie":
        return <Pie data={chartData} options={chartOptions} />;
      case "multi-bar":
      case "comparison-chart":
        // Enhanced options for multi-dimensional charts
        const multiChartOptions = {
          ...chartOptions,
          plugins: {
            ...chartOptions.plugins,
            legend: {
              ...chartOptions.plugins.legend,
              display: true,
              position: "top",
              labels: {
                ...chartOptions.plugins.legend.labels,
                boxWidth: 12,
                padding: 8,
              },
            },
            tooltip: {
              ...chartOptions.plugins.tooltip,
              mode: 'index',
              intersect: false,
              callbacks: {
                title: function(context) {
                  return `Category: ${context[0].label}`;
                },
                label: function(context) {
                  return `${context.dataset.label}: ${context.parsed.y}`;
                }
              }
            },
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          }
        };
        return <Bar data={reportData} options={multiChartOptions} />;
      default:
        return (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <div className="max-w-md mx-auto p-4">
              <p className="text-sm md:text-base font-medium mb-2">Invalid visualization type</p>
              <p className="text-xs md:text-sm mb-4">
                The selected chart type '{visualization.type}' is not supported
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Try selecting a different chart type: Bar Chart, Line Chart, Pie Chart, Multi-Series Bar, Cross-Table Compare, or Table
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  const renderTable = () => {
    // Normalize report payload into a consistent table shape: { rows: [...], columns: [...] }
    const rd = (() => {
      if (!reportData) return null;
      // backend may return an envelope: { data: [...] , fields: [...] }
      if (Array.isArray(reportData)) {
        const rows = reportData;
        const columns = rows.length ? Object.keys(rows[0]) : [];
        return { rows, columns, type: 'table' };
      }
      if (Array.isArray(reportData.data)) {
        const rows = reportData.data;
        const columns = reportData.fields && reportData.fields.length ? reportData.fields : (rows.length ? Object.keys(rows[0]) : []);
        return { rows, columns, type: reportData.type || 'table', groups: reportData.groups };
      }
      // Already normalized shape
      if (reportData.rows || reportData.groups) return reportData;
      return null;
    })();

    // Handle grouped table rendering
    if (rd && rd.type === 'grouped-table' && rd.groups) {
      return (
        <div className="overflow-x-auto max-h-[60vh] sm:max-h-[70vh] lg:max-h-96 scrollbar-thin">
          <div className="space-y-6">
            {Object.entries(rd.groups).map(([groupName, groupRows]) => (
              <div key={groupName} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">
                    {rd.groupBy}: {groupName} ({groupRows.length} records)
                  </h4>
                </div>
                <table className="w-full text-xs sm:text-sm border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      {rd.columns.map((column, index) => (
                        <th
                          key={index}
                          className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600 whitespace-nowrap"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {groupRows.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {rd.columns.map((column, colIndex) => (
                          <td
                            key={colIndex}
                            className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-100 whitespace-nowrap"
                          >
                            {row[column] !== undefined ? String(row[column]) : "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Handle regular table rendering
    if (!rd || (!rd.rows || !rd.columns)) {
      return (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <div className="max-w-md mx-auto p-4">
            <p className="text-sm md:text-base font-medium mb-2">No table data available</p>
            <p className="text-xs md:text-sm mb-4">
              Generate a report to populate the table with data
            </p>
            
            <div className="space-y-3">
              {/* Performance Analysis for Tables */}
              {performanceAnalysis && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 text-left">
                  <h4 className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-2">
                    Table Performance
                  </h4>
                  <div className="text-xs text-indigo-700 dark:text-indigo-300">
                    <p>Query complexity: <span className="font-medium">{performanceAnalysis.complexity}</span></p>
                  </div>
                </div>
              )}

              {validationSuggestions.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-left">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Tips for better tables:
                  </h4>
                  <ul className="space-y-1">
                    {validationSuggestions.slice(0, 2).map((suggestion, index) => (
                      <li key={index} className="text-xs text-blue-700 dark:text-blue-300 flex items-start space-x-1">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{suggestion.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className="overflow-x-auto max-h-[60vh] sm:max-h-[70vh] lg:max-h-96 scrollbar-thin"
        style={{ minHeight: "200px", position: "relative" }}
      >
        <table
          className="w-full text-xs sm:text-sm border-collapse table-auto bg-white dark:bg-slate-900"
          style={{ visibility: "visible", opacity: 1 }}
        >
          <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
            <tr>
              {rd.columns.map((column, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600 whitespace-nowrap"
                  style={{ backgroundColor: "inherit" }}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rd.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                {rd.columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-100 whitespace-nowrap"
                    style={{ color: "inherit" }}
                  >
                    {row[column] !== undefined ? String(row[column]) : "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <motion.div
      layout
      className={`${
        isExpanded ? "fixed inset-2 sm:inset-4 z-50 overflow-y-auto" : "h-full"
      } bg-white dark:bg-slate-900 rounded-lg shadow-lg flex flex-col w-full`}
    >
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="p-1.5 sm:p-2 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg">
            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
              Report Preview
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
              {visualization.type.charAt(0).toUpperCase() +
                visualization.type.slice(1)}{" "}
              • {dataModel.collections?.join(", ") || "No data"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title={showPreview ? "Hide preview" : "Show preview"}
          >
            {showPreview ? (
              <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            ) : (
              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? (
              <Minimize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
          </button>
        </div>
      </div>
      <AnimatePresence mode="wait">
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="flex-1 p-3 sm:p-4">
              <div
                id="chart-container"
                className="h-[40vh] sm:h-[50vh] lg:h-[60vh] w-full"
                style={{
                  position: "relative",
                  overflow: "visible",
                  backgroundColor: containerBackground,
                  color: adaptiveTextColor
                }}
              >
                {renderChart()}
              </div>
            </div>
            {reportData && (
              <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {(() => {
                      // Count rows from normalized payload if available
                      try {
                        const norm = Array.isArray(reportData)
                          ? { rows: reportData }
                          : reportData.data && Array.isArray(reportData.data)
                          ? { rows: reportData.data }
                          : reportData.rows
                          ? { rows: reportData.rows }
                          : null;
                        return norm && norm.rows ? `${norm.rows.length} records` : "Chart visualization";
                      } catch (e) {
                        return "Chart visualization";
                      }
                    })()}
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap gap-2">
                    <button
                      onClick={() => handleExport("pdf")}
                      disabled={exporting}
                      className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 text-xs sm:text-sm"
                    >
                      <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">PDF</span>
                    </button>
                    <button
                      onClick={() => handleExport("excel")}
                      disabled={exporting}
                      className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors disabled:opacity-50 text-xs sm:text-sm"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Excel</span>
                    </button>
                    <button
                      onClick={() => handleExport("image")}
                      disabled={exporting}
                      className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50 text-xs sm:text-sm"
                    >
                      <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">PNG</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PreviewPane;
