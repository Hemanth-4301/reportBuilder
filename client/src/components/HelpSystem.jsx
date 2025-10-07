/**
 * Help System Component
 * Provides contextual help, tooltips, tutorials, and best practices guidance
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  X,
  ChevronRight,
  ChevronLeft,
  Play,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  Target,
  Zap,
  TrendingUp
} from 'lucide-react';

// Help content database
const HELP_CONTENT = {
  fieldSelection: {
    title: 'Field Selection Guide',
    icon: Target,
    sections: [
      {
        title: 'Understanding Field Types',
        content: [
          {
            type: 'tip',
            title: 'Identifier Fields',
            description: 'Use for grouping and filtering (productId, factory, region)',
            examples: ['Group sales by region', 'Filter by specific product']
          },
          {
            type: 'tip',
            title: 'Measurement Fields',
            description: 'Numeric values for calculations (quantity, amount, defectCount)',
            examples: ['Sum total production', 'Average sales amount']
          },
          {
            type: 'tip',
            title: 'Time Fields',
            description: 'Dates for trend analysis (date, createdAt, updatedAt)',
            examples: ['Production trends over time', 'Monthly sales growth']
          }
        ]
      },
      {
        title: 'Best Practices',
        content: [
          {
            type: 'best_practice',
            title: 'Start Simple',
            description: 'Begin with 2-3 key fields, then add more as needed',
            benefit: 'Easier to understand and faster performance'
          },
          {
            type: 'best_practice',
            title: 'Mix Field Types',
            description: 'Combine categories, measurements, and time fields',
            benefit: 'Enables rich analysis and meaningful visualizations'
          }
        ]
      }
    ]
  },
  chartTypes: {
    title: 'Chart Type Selection',
    icon: TrendingUp,
    sections: [
      {
        title: 'When to Use Each Chart',
        content: [
          {
            type: 'chart_guide',
            chartType: 'Bar Chart',
            description: 'Compare quantities across categories',
            bestFor: ['Sales by region', 'Production by factory', 'Defects by type'],
            requirements: 'Category field + Numeric field',
            limitations: 'Works best with less than 20 categories'
          },
          {
            type: 'chart_guide',
            chartType: 'Line Chart',
            description: 'Show trends and changes over time',
            bestFor: ['Production trends', 'Sales growth', 'Quality improvements'],
            requirements: 'Date/Time field + Numeric field',
            limitations: 'Best with sequential data (dates, months, etc.)'
          },
          {
            type: 'chart_guide',
            chartType: 'Pie Chart',
            description: 'Show parts of a whole',
            bestFor: ['Market share', 'Resource allocation', 'Cost breakdown'],
            requirements: 'Category field + Numeric field',
            limitations: 'Maximum 10 categories for readability'
          },
          {
            type: 'chart_guide',
            chartType: 'Table',
            description: 'Detailed data inspection',
            bestFor: ['Raw data review', 'Detailed analysis', 'Data validation'],
            requirements: 'Any field combination',
            limitations: 'Large datasets may be slow to load'
          }
        ]
      }
    ]
  },
  multiTableJoins: {
    title: 'Multi-Table Analysis',
    icon: Zap,
    sections: [
      {
        title: 'Understanding Table Relationships',
        content: [
          {
            type: 'relationship',
            tables: ['Production', 'Defects'],
            commonFields: ['productId', 'factory', 'date'],
            description: 'Analyze production quality by combining output and defect data',
            examples: ['Defect rate by factory', 'Quality trends over time']
          },
          {
            type: 'relationship',
            tables: ['Production', 'Sales'],
            commonFields: ['productId', 'date'],
            description: 'Connect manufacturing output with sales performance',
            examples: ['Production vs Sales analysis', 'Inventory optimization']
          },
          {
            type: 'relationship',
            tables: ['Sales', 'Defects'],
            commonFields: ['productId', 'date'],
            description: 'Understand how quality issues affect sales',
            examples: ['Quality impact on sales', 'Customer satisfaction analysis']
          }
        ]
      },
      {
        title: 'Multi-Table Best Practices',
        content: [
          {
            type: 'best_practice',
            title: 'Include Common Fields',
            description: 'Always select fields that exist in multiple tables',
            benefit: 'Ensures meaningful data relationships'
          },
          {
            type: 'warning',
            title: 'Performance Consideration',
            description: 'Multiple table joins can be slower',
            suggestion: 'Use date filters to reduce data volume'
          }
        ]
      }
    ]
  },
  performance: {
    title: 'Performance Optimization',
    icon: Zap,
    sections: [
      {
        title: 'Query Performance Tips',
        content: [
          {
            type: 'performance_tip',
            title: 'Use Date Filters',
            description: 'Limit data to specific time periods',
            impact: 'Can improve performance by 70-90%',
            example: 'Filter to last 3 months instead of all time'
          },
          {
            type: 'performance_tip',
            title: 'Limit Field Selection',
            description: 'Select only fields you need for analysis',
            impact: 'Reduces query complexity and load time',
            example: 'Choose 5-7 key fields instead of all available'
          },
          {
            type: 'performance_tip',
            title: 'Use Aggregations Wisely',
            description: 'Group data to reduce result size',
            impact: 'Faster processing and clearer insights',
            example: 'Sum production by month rather than daily'
          }
        ]
      }
    ]
  }
};

// Interactive tutorials
const TUTORIALS = {
  firstReport: {
    title: 'Create Your First Report',
    steps: [
      {
        target: 'sidebar',
        title: 'Select a Data Source',
        content: 'Start by clicking on a table in the sidebar. Try the "Production" table.',
        action: 'Click on Production table'
      },
      {
        target: 'fields',
        title: 'Choose Fields',
        content: 'Select 2-3 fields that interest you. Try "factory", "quantity", and "date".',
        action: 'Click on field names to select them'
      },
      {
        target: 'visualization',
        title: 'Pick a Chart Type',
        content: 'Choose how to visualize your data. Bar charts work well for comparing quantities.',
        action: 'Click on Bar Chart'
      },
      {
        target: 'axes',
        title: 'Configure Chart Axes',
        content: 'Set factory as X-axis and quantity as Y-axis for a meaningful comparison.',
        action: 'Select axes in the dropdown menus'
      },
      {
        target: 'generate',
        title: 'Generate Report',
        content: 'Click the Generate button to create your report!',
        action: 'Click Generate Report'
      }
    ]
  },
  multiTable: {
    title: 'Multi-Table Analysis',
    steps: [
      {
        target: 'sidebar',
        title: 'Select Multiple Tables',
        content: 'Select both Production and Defects tables to analyze quality.',
        action: 'Click on both Production and Defects'
      },
      {
        target: 'common-fields',
        title: 'Include Common Fields',
        content: 'Select fields like "productId" and "date" that exist in both tables.',
        action: 'Select productId, date, quantity, defectCount'
      },
      {
        target: 'visualization',
        title: 'Choose Appropriate Chart',
        content: 'Line charts work well for comparing trends between production and defects.',
        action: 'Select Line Chart'
      }
    ]
  }
};

const HelpSystem = ({ 
  isOpen, 
  onClose, 
  context = 'general',
  selectedFields = [],
  selectedCollections = [],
  currentStep = null 
}) => {
  const [activeSection, setActiveSection] = useState(null);
  const [activeTutorial, setActiveTutorial] = useState(null);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showQuickTips, setShowQuickTips] = useState(true);

  // Auto-select relevant help based on context
  useEffect(() => {
    if (isOpen && !activeSection) {
      if (selectedCollections.length > 1) {
        setActiveSection('multiTableJoins');
      } else if (selectedFields.length > 0) {
        setActiveSection('chartTypes');
      } else {
        setActiveSection('fieldSelection');
      }
    }
  }, [isOpen, selectedCollections, selectedFields]);

  const getContextualTips = () => {
    const tips = [];
    
    if (selectedFields.length === 0) {
      tips.push({
        type: 'getting_started',
        icon: Target,
        title: 'Get Started',
        message: 'Select fields from the sidebar to begin building your report',
        action: 'Browse available tables and fields'
      });
    }
    
    if (selectedFields.length === 1) {
      tips.push({
        type: 'suggestion',
        icon: Lightbulb,
        title: 'Add More Fields',
        message: 'Most visualizations work better with 2 or more fields',
        action: 'Add a complementary field for comparison or grouping'
      });
    }
    
    if (selectedCollections.length > 1 && !hasCommonFields()) {
      tips.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Missing Common Fields',
        message: 'Include fields like productId or date for meaningful table joins',
        action: 'Select shared fields between tables'
      });
    }
    
    return tips;
  };

  const hasCommonFields = () => {
    const commonFields = ['productId', 'date', 'factory'];
    const fieldNames = selectedFields.map(f => f.name.toLowerCase());
    return commonFields.some(field => fieldNames.includes(field.toLowerCase()));
  };

  const startTutorial = (tutorialKey) => {
    setActiveTutorial(tutorialKey);
    setTutorialStep(0);
  };

  const nextTutorialStep = () => {
    const tutorial = TUTORIALS[activeTutorial];
    if (tutorialStep < tutorial.steps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setActiveTutorial(null);
      setTutorialStep(0);
    }
  };

  const renderHelpContent = (section) => {
    const content = HELP_CONTENT[section];
    if (!content) return null;

    const Icon = content.icon;

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3 mb-4">
          <Icon className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {content.title}
          </h2>
        </div>

        {content.sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="space-y-4">
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">
              {section.title}
            </h3>
            
            <div className="space-y-3">
              {section.content.map((item, itemIndex) => (
                <div key={itemIndex} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                  {item.type === 'tip' && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {item.description}
                      </p>
                      {item.examples && (
                        <div className="text-xs text-slate-500 dark:text-slate-500">
                          <span className="font-medium">Examples:</span> {item.examples.join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  {item.type === 'chart_guide' && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">
                          {item.chartType}
                        </h4>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {item.description}
                      </p>
                      <div className="space-y-1 text-xs">
                        <div><span className="font-medium">Best for:</span> {item.bestFor.join(', ')}</div>
                        <div><span className="font-medium">Requirements:</span> {item.requirements}</div>
                        <div className="text-yellow-600"><span className="font-medium">Note:</span> {item.limitations}</div>
                      </div>
                    </div>
                  )}

                  {item.type === 'best_practice' && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                        {item.description}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        <span className="font-medium">Benefit:</span> {item.benefit}
                      </p>
                    </div>
                  )}

                  {item.type === 'performance_tip' && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {item.description}
                      </p>
                      <div className="space-y-1 text-xs">
                        <div className="text-blue-600"><span className="font-medium">Impact:</span> {item.impact}</div>
                        <div><span className="font-medium">Example:</span> {item.example}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderQuickTips = () => {
    const tips = getContextualTips();
    if (tips.length === 0) return null;

    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center space-x-2">
          <Lightbulb className="h-4 w-4" />
          <span>Quick Tips</span>
        </h3>
        <div className="space-y-2">
          {tips.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <div key={index} className="flex items-start space-x-2">
                <Icon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                    {tip.title}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    {tip.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <HelpCircle className="h-6 w-6 text-primary-600" />
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Help & Guidance
            </h1>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="flex h-full">
          {/* Sidebar Navigation */}
          <div className="w-64 border-r border-slate-200 dark:border-slate-700 p-4 overflow-y-auto">
            <div className="space-y-2 mb-6">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Help Topics
              </h3>
              {Object.entries(HELP_CONTENT).map(([key, content]) => {
                const Icon = content.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveSection(key)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                      activeSection === key
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{content.title}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Tutorials
              </h3>
              {Object.entries(TUTORIALS).map(([key, tutorial]) => (
                <button
                  key={key}
                  onClick={() => startTutorial(key)}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <Play className="h-4 w-4" />
                  <span className="text-sm">{tutorial.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {showQuickTips && renderQuickTips()}
            
            {activeSection && renderHelpContent(activeSection)}
            
            {activeTutorial && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-green-900 dark:text-green-100">
                    {TUTORIALS[activeTutorial].title}
                  </h3>
                  <span className="text-sm text-green-600 dark:text-green-400">
                    Step {tutorialStep + 1} of {TUTORIALS[activeTutorial].steps.length}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                      {TUTORIALS[activeTutorial].steps[tutorialStep].title}
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                      {TUTORIALS[activeTutorial].steps[tutorialStep].content}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                      {TUTORIALS[activeTutorial].steps[tutorialStep].action}
                    </p>
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      onClick={() => setActiveTutorial(null)}
                      className="px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800 rounded-lg transition-colors"
                    >
                      Exit Tutorial
                    </button>
                    <button
                      onClick={nextTutorialStep}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center space-x-2"
                    >
                      <span>
                        {tutorialStep < TUTORIALS[activeTutorial].steps.length - 1 
                          ? 'Next Step' 
                          : 'Complete'
                        }
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HelpSystem;