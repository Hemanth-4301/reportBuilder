const mongoose = require('mongoose');

const SalesSchema = new mongoose.Schema({
  region: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  productId: {
    type: String,
    required: true
  },
  customerId: {
    type: String,
    required: true
  },
  salesRep: {
    type: String,
    required: true
  },
  channel: {
    type: String,
    enum: ['Direct', 'Retail', 'Online', 'Distributor'],
    default: 'Direct'
  }
}, {
  timestamps: true,
  collection: 'sales'
});

module.exports = mongoose.model('Sales', SalesSchema);