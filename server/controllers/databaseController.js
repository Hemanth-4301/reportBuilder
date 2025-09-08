const { DataTypes } = require("sequelize");

const collections = {
  production: "Production",
  defects: "Defects",
  sales: "Sales",
};

const getCollections = (models) => async (req, res) => {
  try {
    const collectionList = [];

    for (const [name, modelName] of Object.entries(collections)) {
      const model = models[modelName];
      const count = await model.count();
      const sampleRecord = await model.findOne();

      const fields = sampleRecord
        ? Object.keys(sampleRecord.dataValues)
            .filter((key) => !["id", "createdAt", "updatedAt"].includes(key))
            .map((field) => {
              let type;
              if (model.rawAttributes[field].type instanceof DataTypes.STRING) {
                type = "string";
              } else if (
                model.rawAttributes[field].type instanceof DataTypes.INTEGER ||
                model.rawAttributes[field].type instanceof DataTypes.DECIMAL
              ) {
                type = "number";
              } else if (
                model.rawAttributes[field].type instanceof DataTypes.DATE
              ) {
                type = "object";
              } else {
                type = "string";
              }

              return {
                name: field,
                type,
                displayName:
                  field.charAt(0).toUpperCase() +
                  field.slice(1).replace(/([A-Z])/g, " $1"),
              };
            })
        : [];

      collectionList.push({
        name,
        displayName: name.charAt(0).toUpperCase() + name.slice(1),
        count,
        fields,
      });
    }

    res.json({
      success: true,
      collections: collectionList,
      totalCollections: collectionList.length,
    });
  } catch (error) {
    console.error("Error fetching collections:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch collections",
    });
  }
};

const getCollectionData = (models) => async (req, res) => {
  try {
    const { collectionName, limit = 100 } = req.params;

    if (!collections[collectionName]) {
      return res.status(404).json({
        success: false,
        error: "Collection not found",
      });
    }

    const model = models[collections[collectionName]];
    const data = await model.findAll({
      limit: parseInt(limit),
      raw: true,
    });

    res.json({
      success: true,
      data,
      totalRecords: data.length,
    });
  } catch (error) {
    console.error(
      `Error fetching data for ${req.params.collectionName}:`,
      error
    );
    res.status(500).json({
      success: false,
      error: "Failed to fetch collection data",
    });
  }
};

const testConnection = (models) => async (req, res) => {
  try {
    // Verify connection by checking if we can query each model
    for (const modelName of Object.values(collections)) {
      await models[modelName].count();
    }

    res.json({
      success: true,
      message: "Successfully connected to MySQL database",
    });
  } catch (error) {
    console.error("Database connection test failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to connect to MySQL database",
    });
  }
};

module.exports = {
  getCollections,
  getCollectionData,
  testConnection,
};
