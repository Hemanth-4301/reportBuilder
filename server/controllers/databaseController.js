const Production = require('../models/Production');
const Defects = require('../models/Defects');
const Sales = require('../models/Sales');

const collections = {
  production: Production,
  defects: Defects,
  sales: Sales
};

const getCollections = async (req, res) => {
  try {
    const collectionList = [];
    
    for (const [name, model] of Object.entries(collections)) {
      const count = await model.countDocuments();
      const sampleDoc = await model.findOne().lean();
      
      const fields = sampleDoc ? Object.keys(sampleDoc).filter(key => !['_id', '__v', 'createdAt', 'updatedAt'].includes(key)) : [];
      
      collectionList.push({
        name,
        displayName: name.charAt(0).toUpperCase() + name.slice(1),
        count,
        fields: fields.map(field => ({
          name: field,
          type: typeof sampleDoc[field],
          displayName: field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')
        }))
      });
    }
    
    res.json({
      success: true,
      collections: collectionList,
      totalCollections: collectionList.length
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch collections'
    });
  }
};

const getCollectionData = async (req, res) => {
  try {
    const { collectionName, limit = 100 } = req.params;
    
    if (!collections[collectionName]) {
      return res.status(404).json({
        success: false,
        error: 'Collection not found'
      });
    }
    
    const data = await collections[collectionName]
      .find()
      .limit(parseInt(limit))
      .lean();
    
    res.json({
      success: true,
      data,
      collection: collectionName,
      count: data.length
    });
  } catch (error) {
    console.error('Error fetching collection data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch collection data'
    });
  }
};

const testConnection = async (req, res) => {
  try {
    // Test each collection
    const results = {};
    
    for (const [name, model] of Object.entries(collections)) {
      const count = await model.countDocuments();
      results[name] = {
        connected: true,
        count
      };
    }
    
    res.json({
      success: true,
      connection: 'MongoDB connected successfully',
      collections: results
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Database connection failed'
    });
  }
};

module.exports = {
  getCollections,
  getCollectionData,
  testConnection
};