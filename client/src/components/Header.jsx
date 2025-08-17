import React from "react";
import { motion } from "framer-motion";
import {
  Factory,
  Sun,
  Moon,
  Menu,
  BarChart3,
  Database,
  Sparkles,
} from "lucide-react";

const Header = ({ darkMode, toggleDarkMode, sidebarOpen, toggleSidebar }) => {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm z-40 sticky top-0"
    >
      <div className="px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
        <div className="flex items-center justify-between h-12 sm:h-16">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={toggleSidebar}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors lg:hidden"
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg">
                <Factory className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold gradient-text hidden sm:block">
                  Reports Builder
                </h1>
      
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-4 sm:space-x-6">
            <div className="flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm text-green-700 dark:text-green-300 font-medium">
                MongoDB Connected
              </span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 text-slate-600 dark:text-slate-400">
              <div className="flex items-center space-x-1">
                <Database className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">3 Collections</span>
              </div>
              <div className="flex items-center space-x-1">
                <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Real-time</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            <button
              onClick={toggleDarkMode}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
              ) : (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
              )}
            </button>
            <button
              onClick={toggleSidebar}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden max-lg:block"
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
