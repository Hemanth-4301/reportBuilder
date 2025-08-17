const mongoose = require('mongoose');

const DefectsSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    index: true
  },
  defectCount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Cosmetic', 'Functional', 'Critical', 'Minor']
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  factory: {
    type: String,
    required: true
  },
  inspector: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'defects'
});

module.exports = mongoose.model('Defects', DefectsSchema);