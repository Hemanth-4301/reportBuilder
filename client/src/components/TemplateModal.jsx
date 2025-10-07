import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Search, 
  Filter, 
  Star, 
  Clock, 
  BarChart3, 
  Target, 
  TrendingUp, 
  Table, 
  Play,
  CheckCircle,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import TemplateService from '../services/TemplateService';

const TemplateModal = ({ isOpen, onClose, onApplyTemplate, currentState = {} }) => {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [categories, setCategories] = useState([]);

  // Icon mapping for templates
  const iconMap = {
    BarChart3,
    Target,
    TrendingUp,
    Table,
    Clock: Clock
  };

  useEffect(() => {
    if (isOpen) {
      const allTemplates = TemplateService.getAvailableTemplates();
      const templateCategories = TemplateService.getCategories();
      
      setTemplates(allTemplates);
      setFilteredTemplates(allTemplates);
      setCategories(templateCategories);

      // Get recommended templates if there's current state
      if (currentState.selectedFields?.length > 0) {
        const recommended = TemplateService.getRecommendedTemplates(
          currentState.selectedFields || [],
          currentState.selectedCollections || []
        );
        
        // Add recommended flag to templates
        const templatesWithRecommendations = allTemplates.map(template => ({
          ...template,
          isRecommended: recommended.some(rec => rec.id === template.id),
          compatibility: recommended.find(rec => rec.id === template.id)?.compatibility
        }));
        
        setTemplates(templatesWithRecommendations);
        setFilteredTemplates(templatesWithRecommendations);
      }
    }
  }, [isOpen, currentState]);

  useEffect(() => {
    let filtered = [...templates];

    // Apply search filter
    if (searchQuery) {
      filtered = TemplateService.searchTemplates(searchQuery);
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => 
        template.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Apply difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(template => 
        template.difficulty.toLowerCase() === selectedDifficulty.toLowerCase()
      );
    }

    // Sort by recommendation score
    filtered.sort((a, b) => {
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      return 0;
    });

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory, selectedDifficulty]);

  const handleApplyTemplate = async (templateId) => {
    try {
      const result = TemplateService.applyTemplate(templateId, currentState);
      onApplyTemplate(result);
      onClose();
    } catch (error) {
      console.error('Error applying template:', error);
    }
  };

  const handlePreviewTemplate = (template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'advanced': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  const getIcon = (iconName) => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent className="h-5 w-5" /> : <BarChart3 className="h-5 w-5" />;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Report Templates
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Choose from pre-built manufacturing report templates
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Filters Sidebar */}
              <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                  />
                </div>

                {/* Category Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category.name} value={category.name.toLowerCase()}>
                        {category.name} ({category.count})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                  >
                    <option value="all">All Levels</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                {/* Stats */}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Showing {filteredTemplates.length} of {templates.length} templates
                </div>
              </div>

              {/* Templates Grid */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                        template.isRecommended 
                          ? 'border-blue-300 bg-blue-50/50 dark:border-blue-600 dark:bg-blue-900/10' 
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                      }`}
                      onClick={() => handlePreviewTemplate(template)}
                    >
                      {/* Template Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            {getIcon(template.icon)}
                          </div>
                          {template.isRecommended && (
                            <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                              <Star className="h-3 w-3 fill-current" />
                              <span className="text-xs font-medium">Recommended</span>
                            </div>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(template.difficulty)}`}>
                          {template.difficulty}
                        </span>
                      </div>

                      {/* Template Info */}
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {template.description}
                      </p>

                      {/* Template Stats */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>{template.preview.fieldsCount} fields</span>
                          <span>{template.preview.tablesUsed.join(', ')}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{template.estimatedTime}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <BarChart3 className="h-3 w-3" />
                            <span className="capitalize">{template.preview.chartType}</span>
                          </div>
                        </div>
                      </div>

                      {/* Compatibility Score */}
                      {template.compatibility && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Compatibility</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {template.compatibility.overall}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                            <div 
                              className="bg-blue-600 h-1 rounded-full transition-all"
                              style={{ width: `${template.compatibility.overall}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.tags.slice(0, 3).map((tag, index) => (
                          <span 
                            key={index}
                            className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyTemplate(template.id);
                          }}
                          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center space-x-1"
                        >
                          <Play className="h-3 w-3" />
                          <span>Use Template</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {filteredTemplates.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No templates found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Try adjusting your search criteria or filters
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Template Preview Modal */}
        {showPreview && selectedTemplate && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/70"
              onClick={() => setShowPreview(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedTemplate.name}
                  </h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedTemplate.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Template Details
                      </h4>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div>Difficulty: <span className="font-medium">{selectedTemplate.difficulty}</span></div>
                        <div>Time: <span className="font-medium">{selectedTemplate.estimatedTime}</span></div>
                        <div>Fields: <span className="font-medium">{selectedTemplate.preview.fieldsCount}</span></div>
                        <div>Chart Type: <span className="font-medium capitalize">{selectedTemplate.preview.chartType}</span></div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Data Sources
                      </h4>
                      <div className="space-y-1">
                        {selectedTemplate.preview.tablesUsed.map((table, index) => (
                          <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                            • {table}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Fields Included
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedTemplate.template.fields.map((field, index) => (
                        <div key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>{field.table}.{field.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        handleApplyTemplate(selectedTemplate.id);
                        setShowPreview(false);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Apply Template
                    </button>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};

export default TemplateModal;