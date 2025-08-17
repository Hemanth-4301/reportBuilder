import React, { useState } from "react";
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
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import { exportService } from "../services/exportService";

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
        case "csv":
          await exportService.exportToCSV(
            reportData,
            `manufacturing_report_${Date.now()}`
          );
          toast.success("CSV exported successfully!");
          break;
        case "image":
          await exportService.exportToImage("chart-container");
          toast.success("Chart image exported successfully!");
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
    if (!reportData || !reportData.labels) {
      return (
        <div className="flex items-center justify-center h-64 md:h-80 lg:h-96 text-slate-500 dark:text-slate-400">
          <div className="text-center">
            <RefreshCw className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm md:text-base">No data to display</p>
            <p className="text-xs md:text-sm mt-1">
              Generate a report to see visualization
            </p>
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
        visualization.type === "bar" || visualization.type === "line"
          ? {
              x: {
                grid: {
                  color: "rgba(148, 163, 184, 0.1)",
                },
                ticks: {
                  font: {
                    size: window.innerWidth < 640 ? 9 : 11,
                  },
                },
              },
              y: {
                grid: {
                  color: "rgba(148, 163, 184, 0.1)",
                },
                ticks: {
                  font: {
                    size: window.innerWidth < 640 ? 9 : 11,
                  },
                },
              },
            }
          : undefined,
    };

    switch (visualization.type) {
      case "bar":
        return <Bar data={reportData} options={chartOptions} />;
      case "line":
        return <Line data={reportData} options={chartOptions} />;
      case "pie":
        return <Pie data={reportData} options={chartOptions} />;
      case "doughnut":
        return <Doughnut data={reportData} options={chartOptions} />;
      case "table":
        return renderTable();
      default:
        return renderTable();
    }
  };

  const renderTable = () => {
    if (!reportData || !reportData.rows) {
      return (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <p className="text-sm md:text-base">No table data available</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto max-h-[60vh] sm:max-h-[70vh] lg:max-h-96 scrollbar-thin">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
            <tr>
              {reportData.columns?.map((column, index) => (
                <th
                  key={index}
                  className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600 whitespace-nowrap"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reportData.rows?.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                {reportData.columns?.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-2 sm:px-4 py-2 sm:py-3 border-b border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-100 whitespace-nowrap"
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
              {visualization.type} •{" "}
              {dataModel.collections?.join(", ") || "No data"}
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
              >
                {renderChart()}
              </div>
            </div>
            {reportData && (
              <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {reportData.rows
                      ? `${reportData.rows.length} records`
                      : "Chart visualization"}
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
                      onClick={() => handleExport("csv")}
                      disabled={exporting}
                      className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors disabled:opacity-50 text-xs sm:text-sm"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">CSV</span>
                    </button>
                    {visualization.type !== "table" && (
                      <button
                        onClick={() => handleExport("image")}
                        disabled={exporting}
                        className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50 text-xs sm:text-sm"
                      >
                        <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">PNG</span>
                      </button>
                    )}
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
