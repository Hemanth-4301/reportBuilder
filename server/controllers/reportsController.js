const Production = require("../models/Production");
const Defects = require("../models/Defects");
const Sales = require("../models/Sales");
const Joi = require("joi");

const collections = {
  production: Production,
  defects: Defects,
  sales: Sales,
};

const generateReport = async (req, res) => {
  try {
    const { dataModel, visualization, filters } = req.body;

    // Validate request
    const schema = Joi.object({
      dataModel: Joi.object({
        collections: Joi.array().items(Joi.string()).required(),
        fields: Joi.array().items(Joi.string()).required(),
        joins: Joi.array().optional(),
        aggregations: Joi.array().optional(),
      }).required(),
      visualization: Joi.object({
        type: Joi.string()
          .valid("table", "bar", "line", "pie", "doughnut")
          .required(),
        xAxis: Joi.string().when("type", {
          is: Joi.string().valid("bar", "line", "pie", "doughnut"),
          then: Joi.string().required(),
          otherwise: Joi.string().optional(),
        }),
        yAxis: Joi.string().when("type", {
          is: Joi.string().valid("bar", "line", "pie", "doughnut"),
          then: Joi.string().required(),
          otherwise: Joi.string().optional(),
        }),
      }).required(),
      filters: Joi.object({
        dateRange: Joi.object({
          start: Joi.string().allow("").optional(),
          end: Joi.string().allow("").optional(),
        }).optional(),
        factory: Joi.string().allow("").optional(),
        region: Joi.string().allow("").optional(),
        productId: Joi.string().allow("").optional(),
      }).optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    let result;

    if (dataModel.collections.length === 1) {
      result = await querySingleCollection(dataModel, filters || {});
    } else {
      result = await queryMultipleCollections(dataModel, filters || {});
    }

    if (dataModel.aggregations && dataModel.aggregations.length > 0) {
      result = await applyAggregations(result, dataModel.aggregations);
    }

    const formattedData = formatDataForVisualization(result, visualization);

    res.json({
      success: true,
      data: formattedData,
      metadata: {
        totalRecords: result.length,
        collections: dataModel.collections,
        visualization: visualization.type,
      },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate report",
    });
  }
};

const querySingleCollection = async (dataModel, filters) => {
  const collectionName = dataModel.collections[0];
  const Model = collections[collectionName];

  if (!Model) {
    throw new Error(`Collection ${collectionName} not found`);
  }

  let query = Model.find();

  if (filters.dateRange?.start || filters.dateRange?.end) {
    const dateFilter = {};
    if (filters.dateRange.start)
      dateFilter.$gte = new Date(filters.dateRange.start);
    if (filters.dateRange.end)
      dateFilter.$lte = new Date(filters.dateRange.end);
    if (Object.keys(dateFilter).length > 0) {
      query = query.where("date").setOptions({ dateFilter });
    }
  }

  if (filters.factory) {
    query = query.where("factory").equals(filters.factory);
  }

  if (filters.region) {
    query = query.where("region").equals(filters.region);
  }

  if (filters.productId) {
    query = query.where("productId").equals(filters.productId);
  }

  if (dataModel.fields && dataModel.fields.length > 0) {
    const selectFields = dataModel.fields.join(" ");
    query = query.select(selectFields);
  }

  return await query.lean();
};

const queryMultipleCollections = async (dataModel, filters) => {
  const primaryCollection = dataModel.collections[0];
  const Model = collections[primaryCollection];

  if (!Model) {
    throw new Error(`Primary collection ${primaryCollection} not found`);
  }

  const pipeline = [];

  const matchStage = {};
  if (filters.dateRange?.start || filters.dateRange?.end) {
    matchStage.date = {};
    if (filters.dateRange.start)
      matchStage.date.$gte = new Date(filters.dateRange.start);
    if (filters.dateRange.end)
      matchStage.date.$lte = new Date(filters.dateRange.end);
  }
  if (filters.factory) matchStage.factory = filters.factory;
  if (filters.region) matchStage.region = filters.region;
  if (filters.productId) matchStage.productId = filters.productId;

  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }

  for (let i = 1; i < dataModel.collections.length; i++) {
    const joinCollection = dataModel.collections[i];
    pipeline.push({
      $lookup: {
        from: joinCollection,
        localField: "productId",
        foreignField: "productId",
        as: joinCollection,
      },
    });
  }

  if (dataModel.fields && dataModel.fields.length > 0) {
    const projectStage = {};
    dataModel.fields.forEach((field) => {
      projectStage[field] = 1;
    });
    pipeline.push({ $project: projectStage });
  }

  return await Model.aggregate(pipeline);
};

const applyAggregations = async (data, aggregations) => {
  let result = [...data];

  for (const agg of aggregations) {
    switch (agg.type) {
      case "sum":
        if (agg.field && agg.groupBy) {
          result = groupAndSum(result, agg.groupBy, agg.field);
        }
        break;
      case "count":
        if (agg.groupBy) {
          result = groupAndCount(result, agg.groupBy);
        }
        break;
      case "average":
        if (agg.field && agg.groupBy) {
          result = groupAndAverage(result, agg.groupBy, agg.field);
        }
        break;
    }
  }

  return result;
};

const groupAndSum = (data, groupBy, sumField) => {
  const grouped = data.reduce((acc, item) => {
    const key = item[groupBy];
    if (!acc[key]) {
      acc[key] = { [groupBy]: key, [sumField]: 0, count: 0 };
    }
    acc[key][sumField] += item[sumField] || 0;
    acc[key].count += 1;
    return acc;
  }, {});

  return Object.values(grouped);
};

const groupAndCount = (data, groupBy) => {
  const grouped = data.reduce((acc, item) => {
    const key = item[groupBy];
    if (!acc[key]) {
      acc[key] = { [groupBy]: key, count: 0 };
    }
    acc[key].count += 1;
    return acc;
  }, {});

  return Object.values(grouped);
};

const groupAndAverage = (data, groupBy, avgField) => {
  const grouped = groupAndSum(data, groupBy, avgField);
  return grouped.map((item) => ({
    ...item,
    [avgField]: item.count > 0 ? item[avgField] / item.count : 0,
  }));
};

const formatDataForVisualization = (data, visualization) => {
  if (!data || data.length === 0) {
    return { labels: [], datasets: [] };
  }

  switch (visualization.type) {
    case "table":
      return {
        columns: Object.keys(data[0]),
        rows: data,
      };

    case "bar":
    case "line":
      return {
        labels: data.map((item) => item[visualization.xAxis] || item._id),
        datasets: [
          {
            label: visualization.yAxis || "Value",
            data: data.map((item) => item[visualization.yAxis] || 0),
            backgroundColor:
              visualization.type === "bar"
                ? "rgba(59, 130, 246, 0.8)"
                : "rgba(59, 130, 246, 0.2)",
            borderColor: "rgba(59, 130, 246, 1)",
            borderWidth: 2,
          },
        ],
      };

    case "pie":
    case "doughnut":
      const colors = [
        "rgba(59, 130, 246, 0.8)",
        "rgba(16, 185, 129, 0.8)",
        "rgba(245, 101, 101, 0.8)",
        "rgba(251, 191, 36, 0.8)",
        "rgba(139, 92, 246, 0.8)",
      ];

      return {
        labels: data.map((item) => item[visualization.xAxis] || item._id),
        datasets: [
          {
            data: data.map((item) => item[visualization.yAxis] || 0),
            backgroundColor: colors.slice(0, data.length),
            borderWidth: 1,
          },
        ],
      };

    default:
      return data;
  }
};

module.exports = {
  generateReport,
};
