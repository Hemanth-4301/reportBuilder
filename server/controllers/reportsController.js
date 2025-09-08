const { Op } = require("sequelize");

const collections = {
  production: "Production",
  defects: "Defects",
  sales: "Sales",
};

const generateReport = (models) => async (req, res, next) => {
  try {
    const { dataModel, visualization, filters } = req.body;

    if (!dataModel || !visualization) {
      return res.status(400).json({
        success: false,
        error: "Data model and visualization settings are required",
      });
    }

    const {
      collections: selectedCollections,
      fields,
      aggregations,
    } = dataModel;

    if (!selectedCollections.length || !fields.length) {
      return res.status(400).json({
        success: false,
        error: "At least one collection and one field must be selected",
      });
    }

    // Build the Sequelize query
    let queryOptions = {
      attributes: fields,
      where: {},
      raw: true,
    };

    // Apply filters
    if (filters) {
      if (filters.dateRange?.start && filters.dateRange?.end) {
        queryOptions.where.date = {
          [Op.between]: [
            new Date(filters.dateRange.start),
            new Date(filters.dateRange.end),
          ],
        };
      }
      if (filters.factory) {
        queryOptions.where.factory = { [Op.eq]: filters.factory };
      }
      if (filters.region) {
        queryOptions.where.region = { [Op.eq]: filters.region };
      }
      if (filters.productId) {
        queryOptions.where.productId = { [Op.eq]: filters.productId };
      }
    }

    // Apply aggregations
    if (aggregations?.length) {
      queryOptions.attributes = [];
      aggregations.forEach((agg) => {
        let sequelizeAgg;
        switch (agg.type) {
          case "sum":
            sequelizeAgg = [
              [
                models.sequelize.fn("SUM", models.sequelize.col(agg.field)),
                agg.field,
              ],
            ];
            break;
          case "count":
            sequelizeAgg = [
              [
                models.sequelize.fn("COUNT", models.sequelize.col(agg.field)),
                agg.field,
              ],
            ];
            break;
          case "average":
            sequelizeAgg = [
              [
                models.sequelize.fn("AVG", models.sequelize.col(agg.field)),
                agg.field,
              ],
            ];
            break;
          default:
            throw new Error(`Unsupported aggregation type: ${agg.type}`);
        }
        queryOptions.attributes.push(...sequelizeAgg);
        if (agg.groupBy) {
          queryOptions.group = [agg.groupBy];
        }
      });
    }

    // Handle joins if multiple collections are selected
    let data;
    if (selectedCollections.length === 1) {
      const model = models[collections[selectedCollections[0]]];
      data = await model.findAll(queryOptions);
    } else {
      // Example join logic (adjust based on your schema relationships)
      const primaryModel = models[collections[selectedCollections[0]]];
      queryOptions.include = selectedCollections.slice(1).map((col) => ({
        model: models[collections[col]],
        required: false, // LEFT JOIN
      }));
      data = await primaryModel.findAll(queryOptions);
    }

    // Format data for visualization
    let reportData;
    if (visualization.type === "table") {
      reportData = {
        columns: fields,
        rows: data,
      };
    } else {
      const labels = data.map((row) => row[visualization.xAxis] || "Unknown");
      const datasets = [
        {
          label: visualization.yAxis,
          data: data.map((row) => row[visualization.yAxis] || 0),
          backgroundColor: ["#3b82f6", "#10b981", "#8b5cf6", "#f43f5e"],
          borderColor: ["#2563eb", "#059669", "#7c3aed", "#e11d48"],
          borderWidth: 1,
        },
      ];

      reportData = {
        labels,
        datasets,
      };
    }

    res.json({
      success: true,
      data: reportData,
      metadata: {
        totalRecords: data.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Report generation error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate report",
    });
  }
};

module.exports = { generateReport };
