const express = require("express");
const { generateReport } = require("../controllers/reportsController");

module.exports = (models) => {
  const router = express.Router();

  router.post("/generate-report", async (req, res, next) => {
    try {
      await generateReport(models)(req, res, next);
    } catch (error) {
      next(error); // Pass errors to Express error handling middleware
    }
  });

  return router;
};
