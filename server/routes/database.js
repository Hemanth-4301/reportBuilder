const express = require('express');
const { getCollections, getCollectionData, testConnection } = require('../controllers/databaseController');

const router = express.Router();

router.post('/connect-db', testConnection);
router.get('/collections', getCollections);
router.get('/collections/:collectionName/:limit?', getCollectionData);

module.exports = router;