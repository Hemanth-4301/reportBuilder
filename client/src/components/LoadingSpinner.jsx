import React from 'react'
import { motion } from 'framer-motion'

const LoadingSpinner = ({ size = 'medium', color = 'primary' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  }

  const colorClasses = {
    primary: 'border-primary-600',
    white: 'border-white',
    slate: 'border-slate-600'
  }

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`
        ${sizeClasses[size]} 
        ${colorClasses[color]} 
        border-2 border-t-transparent rounded-full
      `}
    />
  )
}

export default LoadingSpinner