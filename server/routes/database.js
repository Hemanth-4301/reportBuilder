const express = require("express");
const {
  getCollections,
  getCollectionData,
  testConnection,
} = require("../controllers/databaseController");

module.exports = (models) => {
  const router = express.Router();

  router.post("/connect-db", testConnection(models));
  router.get("/collections", getCollections(models));
  router.get("/collections/:collectionName/:limit?", getCollectionData(models));

  return router;
};
