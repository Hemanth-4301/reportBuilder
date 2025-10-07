import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Papa from "papaparse";

export const exportService = {
  async exportToPDF(data, visualization, dataModel) {
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;

      // Add title
      pdf.setFontSize(20);
      pdf.setTextColor(59, 130, 246); // Primary blue
      pdf.text("Manufacturing Report", margin, 30);

      // Add metadata
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, 40);
      pdf.text(`Visualization: ${visualization.type}`, margin, 48);
      pdf.text(
        `Collections: ${dataModel.collections?.join(", ") || "N/A"}`,
        margin,
        56
      );

      // Handle table or chart export
      if (data.rows && data.columns) {
        // Table export
        let yPos = 70;
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text("Data Table", margin, yPos);

        // Table headers
        yPos += 10;
        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        const colWidth = maxWidth / Math.min(data.columns.length, 5);
        data.columns.slice(0, 5).forEach((col, index) => {
          const truncated =
            col.length > 15 ? col.substring(0, 12) + "..." : col;
          pdf.text(truncated, margin + index * colWidth, yPos);
        });

        // Table rows
        yPos += 8;
        pdf.setTextColor(0, 0, 0);
        data.rows.slice(0, 20).forEach((row, rowIndex) => {
          data.columns.slice(0, 5).forEach((col, colIndex) => {
            const value = String(row[col] || "");
            const truncated =
              value.length > 15 ? value.substring(0, 12) + "..." : value;
            pdf.text(truncated, margin + colIndex * colWidth, yPos);
          });
          yPos += 6;
          if (yPos > pageHeight - margin) {
            pdf.addPage();
            yPos = margin;
          }
        });

        if (data.rows.length > 20) {
          pdf.text(
            `... and ${data.rows.length - 20} more rows`,
            margin,
            yPos + 10
          );
        }
      } else if (
        data.labels &&
        data.datasets &&
        visualization.type !== "table"
      ) {
        // Chart export
        const chartElement = document.getElementById("chart-container");
        if (chartElement) {
          try {
            const canvas = await html2canvas(chartElement, {
              backgroundColor: "#e5e7eb",
              scale: 2,
              useCORS: true,
              allowTaint: true,
              logging: true,
            });
            const imgData = canvas.toDataURL("image/png");
            const imgWidth = maxWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, "PNG", margin, 70, imgWidth, imgHeight);
          } catch (err) {
            // Fallback: try to find a canvas element (Chart.js) and use its data
            console.warn('html2canvas failed, falling back to canvas.toDataURL', err);
            const innerCanvas = chartElement.querySelector('canvas');
            if (innerCanvas) {
              const imgData = innerCanvas.toDataURL('image/png');
              // approximate dimensions
              const imgWidth = maxWidth;
              const imgHeight = (innerCanvas.height * imgWidth) / innerCanvas.width || imgWidth * 0.6;
              pdf.addImage(imgData, 'PNG', margin, 70, imgWidth, imgHeight);
            } else {
              console.warn('No canvas found inside chart-container for fallback export');
            }
          }
        }
      }

      // Save the PDF
      const fileName = `manufacturing_report_${Date.now()}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("PDF export error:", error);
      throw new Error("Failed to export PDF");
    }
  },

  async exportToExcel(data, filename = "manufacturing_report") {
    try {
      let csvData = [];

      if (data.rows && data.columns) {
        // Table data
        csvData = data.rows.map((row) => {
          const csvRow = {};
          data.columns.forEach((col) => {
            csvRow[col] = row[col] !== undefined ? row[col] : "";
          });
          return csvRow;
        });
      } else if (data.labels && data.datasets) {
        // Chart data
        csvData = data.labels.map((label, index) => {
          const row = { label };
          data.datasets.forEach((dataset, datasetIndex) => {
            row[dataset.label || `Dataset ${datasetIndex + 1}`] =
              dataset.data[index] || "";
          });
          return row;
        });
      }

      if (csvData.length === 0) {
        throw new Error("No data to export");
      }

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

      // Create download link
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Excel export error:", error);
      throw new Error("Failed to export Excel");
    }
  },

  async exportToImage(elementId, filename = "report") {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error("Element not found");
      }

      // Create a temporary clone of the table or chart content
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.top = "-9999px";
      tempContainer.style.left = "-9999px";
      tempContainer.style.backgroundColor = element.querySelector("table")
        ? "#ffffff"
        : "#e5e7eb"; // Gray for charts, white for tables
      tempContainer.style.padding = "10px";
      tempContainer.style.width = element.offsetWidth + "px";
      tempContainer.style.maxHeight = element.offsetHeight + "px";
      tempContainer.style.overflow = "auto";
      tempContainer.style.zIndex = "-1";

      // Clone the table or chart content
      const table = element.querySelector("table");
      if (table) {
        const clonedTable = table.cloneNode(true);
        // Apply styles to ensure text visibility
        clonedTable.style.opacity = "1";
        clonedTable.style.visibility = "visible";
        clonedTable.style.backgroundColor = "#ffffff";
        clonedTable.querySelectorAll("th, td").forEach((cell) => {
          cell.style.color = cell.classList.contains("text-slate-900")
            ? "#000000"
            : "#ffffff";
          cell.style.backgroundColor = cell.classList.contains("bg-slate-50")
            ? "#f8fafc"
            : "inherit";
        });
        tempContainer.appendChild(clonedTable);
      } else {
        // For charts, clone the entire element
        tempContainer.innerHTML = element.innerHTML;
        tempContainer.style.backgroundColor = "#e5e7eb"; // Ensure gray background for charts
      }

      document.body.appendChild(tempContainer);

      // Add a delay to ensure rendering
      await new Promise((resolve) => setTimeout(resolve, 200));

      const canvas = await html2canvas(tempContainer, {
        backgroundColor: table ? "#ffffff" : "#e5e7eb", // Match visualization type
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true, // Enable logging for debugging
      });

      // Remove temporary container
      document.body.removeChild(tempContainer);

      // Convert to blob and download
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${filename}_${Date.now()}.png`;
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
        },
        "image/png",
        1.0
      );
    } catch (error) {
      console.warn('html2canvas/exportToImage failed, attempting direct canvas grab', error);
      try {
        const element = document.getElementById(elementId);
        const innerCanvas = element && element.querySelector && element.querySelector('canvas');
        if (innerCanvas) {
          const dataUrl = innerCanvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `${filename}_${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return;
        }
      } catch (e) {
        console.error('Direct canvas grab also failed', e);
      }
      console.error('Image export error:', error);
      throw new Error('Failed to export image');
    }
  },
};
