import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import Papa from 'papaparse'

export const exportService = {
  async exportToPDF(data, visualization, dataModel) {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      
      // Add title
      pdf.setFontSize(20)
      pdf.setTextColor(59, 130, 246) // Primary blue
      pdf.text('Manufacturing Report', 20, 30)
      
      // Add metadata
      pdf.setFontSize(12)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 40)
      pdf.text(`Visualization: ${visualization.type}`, 20, 48)
      pdf.text(`Collections: ${dataModel.collections?.join(', ') || 'N/A'}`, 20, 56)
      
      // Capture chart if it exists
      const chartElement = document.getElementById('chart-container')
      if (chartElement && visualization.type !== 'table') {
        const canvas = await html2canvas(chartElement, {
          backgroundColor: '#ffffff',
          scale: 2
        })
        
        const imgData = canvas.toDataURL('image/png')
        const imgWidth = pageWidth - 40
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        
        pdf.addImage(imgData, 'PNG', 20, 70, imgWidth, imgHeight)
      }
      
      // Add table data if available
      if (data.rows && data.columns) {
        const startY = visualization.type !== 'table' ? 200 : 70
        
        pdf.setFontSize(14)
        pdf.setTextColor(0, 0, 0)
        pdf.text('Data Table', 20, startY)
        
        // Table headers
        let yPos = startY + 15
        pdf.setFontSize(10)
        pdf.setTextColor(60, 60, 60)
        
        const colWidth = (pageWidth - 40) / Math.min(data.columns.length, 5)
        data.columns.slice(0, 5).forEach((col, index) => {
          pdf.text(col, 20 + (index * colWidth), yPos)
        })
        
        // Table rows
        yPos += 8
        pdf.setTextColor(0, 0, 0)
        
        data.rows.slice(0, 20).forEach((row, rowIndex) => {
          data.columns.slice(0, 5).forEach((col, colIndex) => {
            const value = String(row[col] || '')
            const truncated = value.length > 15 ? value.substring(0, 12) + '...' : value
            pdf.text(truncated, 20 + (colIndex * colWidth), yPos)
          })
          yPos += 6
          
          if (yPos > pageHeight - 20) {
            pdf.addPage()
            yPos = 30
          }
        })
        
        if (data.rows.length > 20) {
          pdf.text(`... and ${data.rows.length - 20} more rows`, 20, yPos + 10)
        }
      }
      
      // Save the PDF
      const fileName = `manufacturing_report_${Date.now()}.pdf`
      pdf.save(fileName)
      
    } catch (error) {
      console.error('PDF export error:', error)
      throw new Error('Failed to export PDF')
    }
  },

  async exportToCSV(data, filename = 'manufacturing_report') {
    try {
      let csvData = []
      
      if (data.rows && data.columns) {
        // Table data
        csvData = data.rows.map(row => {
          const csvRow = {}
          data.columns.forEach(col => {
            csvRow[col] = row[col] !== undefined ? row[col] : ''
          })
          return csvRow
        })
      } else if (data.labels && data.datasets) {
        // Chart data
        csvData = data.labels.map((label, index) => {
          const row = { label }
          data.datasets.forEach((dataset, datasetIndex) => {
            row[dataset.label || `Dataset ${datasetIndex + 1}`] = dataset.data[index] || ''
          })
          return row
        })
      }
      
      if (csvData.length === 0) {
        throw new Error('No data to export')
      }
      
      const csv = Papa.unparse(csvData)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      
      // Create download link
      const link = document.createElement('a')
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `${filename}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      
    } catch (error) {
      console.error('CSV export error:', error)
      throw new Error('Failed to export CSV')
    }
  },

  async exportToImage(elementId, filename = 'chart') {
    try {
      const element = document.getElementById(elementId)
      if (!element) {
        throw new Error('Chart element not found')
      }
      
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true
      })
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${filename}_${Date.now()}.png`
          link.style.visibility = 'hidden'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
      }, 'image/png', 1.0)
      
    } catch (error) {
      console.error('Image export error:', error)
      throw new Error('Failed to export image')
    }
  }
}