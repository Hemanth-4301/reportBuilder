import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  Table,
  ChevronDown,
  ChevronRight,
  X,
  Search,
  Hash,
  Calendar,
  Type,
} from "lucide-react";

const Sidebar = ({
  collections,
  selectedCollections,
  selectedFields,
  onCollectionSelect,
  onFieldSelect,
  onClose,
}) => {
  const [expandedCollections, setExpandedCollections] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  const toggleCollection = (collectionName) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collectionName)) {
      newExpanded.delete(collectionName);
    } else {
      newExpanded.add(collectionName);
    }
    setExpandedCollections(newExpanded);
  };

  const getFieldIcon = (fieldType) => {
    switch (fieldType) {
      case "number":
        return <Hash className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />;
      case "object":
        return (
          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
        );
      case "string":
      default:
        return <Type className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500" />;
    }
  };

  const isCollectionSelected = (collection) =>
    selectedCollections.some((sel) => sel.name === collection.name);

  const isFieldSelected = (field, collectionName) => {
    const fieldId = `${collectionName}.${field.name}`;
    return selectedFields.some((sel) => sel.id === fieldId);
  };

  const filteredCollections = collections.filter(
    (collection) =>
      collection.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.fields.some((field) =>
        field.displayName.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="fixed lg:static inset-y-0 left-0 w-64 sm:w-72 lg:w-80 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col z-50 lg:z-0 overflow-y-auto scrollbar-thin"
    >
      <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
              Data Sources
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search collections & fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-4">
        <div className="space-y-2">
          {filteredCollections.map((collection) => {
            const isExpanded = expandedCollections.has(collection.name);
            const isSelected = isCollectionSelected(collection);

            return (
              <motion.div
                key={collection.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
              >
                <div
                  className={`flex items-center justify-between p-2 sm:p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800"
                      : "bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                  onClick={() => onCollectionSelect(collection)}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                    <div
                      className={`p-1.5 sm:p-2 rounded-md ${
                        isSelected
                          ? "bg-primary-100 dark:bg-primary-800/50"
                          : "bg-white dark:bg-slate-700"
                      }`}
                    >
                      <Table
                        className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                          isSelected
                            ? "text-primary-600 dark:text-primary-400"
                            : "text-slate-500"
                        }`}
                      />
                    </div>
                    <div>
                      <h3
                        className={`font-medium text-sm sm:text-base ${
                          isSelected
                            ? "text-primary-900 dark:text-primary-100"
                            : "text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        {collection.displayName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {collection.count} records • {collection.fields.length}{" "}
                        fields
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    {isSelected && (
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCollection(collection.name);
                      }}
                      className="p-1 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-200 dark:border-slate-700"
                    >
                      <div className="p-2 space-y-1">
                        {collection.fields.map((field) => {
                          const fieldSelected = isFieldSelected(
                            field,
                            collection.name
                          );

                          return (
                            <motion.button
                              key={field.name}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() =>
                                onFieldSelect(field, collection.name)
                              }
                              className={`w-full flex items-center space-x-2 sm:space-x-3 p-2 rounded-md text-left transition-all text-xs sm:text-sm ${
                                fieldSelected
                                  ? "bg-primary-100 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100"
                                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {getFieldIcon(field.type)}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {field.displayName}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                  {field.type}
                                </div>
                              </div>
                              {fieldSelected && (
                                <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"></div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
        {filteredCollections.length === 0 && searchTerm && (
          <div className="text-center py-6 sm:py-8">
            <Database className="h-10 w-10 sm:h-12 sm:w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
              No collections found for "{searchTerm}"
            </p>
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
          <p>
            Selected: {selectedCollections.length} collections,{" "}
            {selectedFields.length} fields
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
