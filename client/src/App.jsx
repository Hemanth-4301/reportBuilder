import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

// Components
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Canvas from './components/Canvas'
import PreviewPane from './components/PreviewPane'
import LoadingSpinner from './components/LoadingSpinner'

// Services
import { databaseService } from './services/databaseService'

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
             (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
    return false
  })
  
  const [collections, setCollections] = useState([])
  const [selectedCollections, setSelectedCollections] = useState([])
  const [selectedFields, setSelectedFields] = useState([])
  const [dataModel, setDataModel] = useState({
    collections: [],
    fields: [],
    joins: [],
    aggregations: [],
    filters: {}
  })
  const [reportData, setReportData] = useState(null)
  const [reportMeta, setReportMeta] = useState(null)
  const [visualization, setVisualization] = useState({
    type: 'table',
    xAxis: '',
    yAxis: '',
    groupBy: '',
    categoryField: '',
    valueFields: [],
    seriesField: ''
  })
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', darkMode.toString())
  }, [darkMode])

  // Load collections on mount
  useEffect(() => {
    const loadCollections = async () => {
      setLoading(true)
      try {
        const result = await databaseService.getCollections()
        if (result.success) {
          setCollections(result.collections)
        }
      } catch (error) {
        console.error('Failed to load tables:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCollections()
  }, [])

  // Update data model when selections change
  useEffect(() => {
    setDataModel(prev => ({
      ...prev,
      collections: selectedCollections.map(col => col.name),
      fields: selectedFields.map(field => field.name)
    }))
  }, [selectedCollections, selectedFields])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleCollectionSelect = (collection) => {
    setSelectedCollections(prev => {
      const exists = prev.find(col => col.name === collection.name)
      if (exists) {
        return prev.filter(col => col.name !== collection.name)
      }
      return [...prev, collection]
    })
  }

  const handleFieldSelect = (field, collectionName) => {
    console.log('handleFieldSelect called:', field, collectionName);
    const fieldWithCollection = {
      ...field,
      collection: collectionName,
      id: `${collectionName}.${field.name}`
    }
    
    console.log('Field with collection:', fieldWithCollection);
    
    setSelectedFields(prev => {
      const exists = prev.find(f => f.id === fieldWithCollection.id)
      console.log('Field exists:', exists);
      if (exists) {
        console.log('Removing field');
        return prev.filter(f => f.id !== fieldWithCollection.id)
      }
      console.log('Adding field');
      return [...prev, fieldWithCollection]
    })
  }

  const handleDataModelChange = (newDataModel) => {
    setDataModel(newDataModel)
  }

  const handleVisualizationChange = (newVisualization) => {
    setVisualization(newVisualization)
  }

  const handleReportData = (data) => {
    setReportData(data)
  }

  const handleReportMeta = (meta) => {
    setReportMeta(meta)
  }

  if (loading && collections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Toast notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'dark:bg-slate-800 dark:text-white',
          style: {
            background: darkMode ? '#1e293b' : '#ffffff',
            color: darkMode ? '#f1f5f9' : '#0f172a',
            border: darkMode ? '1px solid #374151' : '1px solid #e2e8f0'
          }
        }}
      />

      {/* Header */}
      <Header 
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      {/* Main Content */}
      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed lg:relative z-30 h-full"
            >
              <Sidebar
                collections={collections}
                selectedCollections={selectedCollections}
                selectedFields={selectedFields}
                onCollectionSelect={handleCollectionSelect}
                onFieldSelect={handleFieldSelect}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Backdrop for mobile */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-20 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* Canvas */}
          <motion.div
            layout
            className="flex-1 min-h-0"
          >
            <Canvas
              collections={collections}
              selectedCollections={selectedCollections}
              selectedFields={selectedFields}
              dataModel={dataModel}
              visualization={visualization}
              onDataModelChange={handleDataModelChange}
              onVisualizationChange={handleVisualizationChange}
              onReportData={handleReportData}
              onReportMeta={handleReportMeta}
            />
          </motion.div>

          {/* Preview Pane */}
          <motion.div
            layout
            className="w-full lg:w-1/3 min-h-0 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700"
          >
            <PreviewPane
              reportData={reportData}
              visualization={visualization}
              dataModel={dataModel}
              metadata={reportMeta}
            />
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default App