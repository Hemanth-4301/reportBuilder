const express = require("express");
const { Sequelize } = require("sequelize");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Setting up Sequelize for MySQL
const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || "manufacturing_reports",
  process.env.MYSQL_USER || "root",
  process.env.MYSQL_PASSWORD || "",
  {
    host: process.env.MYSQL_HOST || "localhost",
    dialect: "mysql",
    logging: false,
  }
);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://yourdomain.com"]
        : ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);
app.set("trust proxy", 1);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Initialize Sequelize models
const initModels = require("./models/init-models");
const models = initModels(sequelize);

// Sync database
sequelize
  .sync({ force: false })
  .then(() => console.log("✅ Connected to MySQL"))
  .catch((err) => console.error("❌ MySQL connection error:", err));

// Routes
app.use("/api/database", require("./routes/database")(models));
app.use("/api/reports", require("./routes/reports")(models));

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      mysql: "Connected",
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      mysql: "Disconnected",
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Something went wrong!"
        : err.message,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});
