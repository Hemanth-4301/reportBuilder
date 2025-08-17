const express = require('express');
const { generateReport } = require('../controllers/reportsController');

const router = express.Router();

router.post('/generate-report', generateReport);

module.exports = router;