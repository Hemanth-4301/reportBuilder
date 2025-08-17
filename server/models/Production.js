const mongoose = require('mongoose');

const ProductionSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    index: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  factory: {
    type: String,
    required: true,
    index: true
  },
  shift: {
    type: String,
    enum: ['Morning', 'Afternoon', 'Night'],
    default: 'Morning'
  },
  line: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'production'
});

module.exports = mongoose.model('Production', ProductionSchema);