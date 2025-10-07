const express = require("express");
const { Sequelize } = require("sequelize");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// SQLite Configuration - No external database required!
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false, // Set to console.log to see SQL queries
});

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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database: "SQLite",
    environment: process.env.NODE_ENV || "development",
  });
});

// Initialize models
const initModels = require("./models/init-models");
const models = initModels(sequelize);

// Routes
app.use("/api/database", require("./routes/database")(models));
app.use("/api/reports", require("./routes/reports")(models));
app.use("/api/analytics", require("./routes/analytics"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.path,
  });
});

// Database sync and server start
const startServer = async () => {
  try {
    console.log("🔄 Connecting to SQLite database...");
    await sequelize.authenticate();
    console.log("✅ SQLite connection successful!");

    console.log("🔄 Synchronizing database...");
    await sequelize.sync({ force: false }); // Set to true to reset tables
    console.log("✅ Database synchronized");

    // Seed sample data if tables are empty
    await seedSampleData(models);

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📊 Database: SQLite (${path.join(__dirname, 'database.sqlite')})`);
    });
  } catch (error) {
    console.error("❌ Server startup error:", error);
    process.exit(1);
  }
};

// Seed sample data
async function seedSampleData(models) {
  try {
    const { Production, Defects, Sales } = models;

    // Check if data already exists
    const productionCount = await Production.count();
    if (productionCount > 0) {
      console.log("📊 Sample data already exists");
      return;
    }

    console.log("🌱 Seeding sample data...");

    // Sample Production data
    await Production.bulkCreate([
      {
        date: '2024-01-15',
        shift: 'Day',
        productId: 'PROD-001',
        product_type: 'Widget A',
        produced_quantity: 850,
        target_quantity: 900,
        efficiency_score: 94.44,
        factory: 'Factory North',
        machine_id: 'M-001',
        operator_id: 'OP-101'
      },
      {
        date: '2024-01-15',
        shift: 'Night',
        productId: 'PROD-001',
        product_type: 'Widget A',
        produced_quantity: 780,
        target_quantity: 900,
        efficiency_score: 86.67,
        factory: 'Factory North',
        machine_id: 'M-001',
        operator_id: 'OP-102'
      },
      {
        date: '2024-01-16',
        shift: 'Day',
        productId: 'PROD-002',
        product_type: 'Widget B',
        produced_quantity: 920,
        target_quantity: 1000,
        efficiency_score: 92.00,
        factory: 'Factory South',
        machine_id: 'M-002',
        operator_id: 'OP-103'
      },
      {
        date: '2024-01-17',
        shift: 'Day',
        productId: 'PROD-003',
        product_type: 'Gadget X',
        produced_quantity: 650,
        target_quantity: 700,
        efficiency_score: 92.86,
        factory: 'Factory East',
        machine_id: 'M-003',
        operator_id: 'OP-105'
      },
      {
        date: '2024-01-18',
        shift: 'Day',
        productId: 'PROD-001',
        product_type: 'Widget A',
        produced_quantity: 910,
        target_quantity: 900,
        efficiency_score: 101.11,
        factory: 'Factory North',
        machine_id: 'M-001',
        operator_id: 'OP-101'
      }
    ]);

    // Sample Defects data
    await Defects.bulkCreate([
      {
        date: '2024-01-15',
        productId: 'PROD-001',
        defect_type: 'Surface Scratch',
        defect_count: 12,
        severity: 'Minor',
        factory: 'Factory North',
        machine_id: 'M-001',
        description: 'Minor surface scratches during handling'
      },
      {
        date: '2024-01-15',
        productId: 'PROD-001',
        defect_type: 'Dimensional Error',
        defect_count: 3,
        severity: 'Major',
        factory: 'Factory North',
        machine_id: 'M-001',
        description: 'Parts not meeting dimensional specifications'
      },
      {
        date: '2024-01-16',
        productId: 'PROD-002',
        defect_type: 'Color Variation',
        defect_count: 8,
        severity: 'Minor',
        factory: 'Factory South',
        machine_id: 'M-002',
        description: 'Slight color variation from standard'
      },
      {
        date: '2024-01-17',
        productId: 'PROD-003',
        defect_type: 'Functional Failure',
        defect_count: 2,
        severity: 'Critical',
        factory: 'Factory East',
        machine_id: 'M-003',
        description: 'Product fails functional testing'
      }
    ]);

    // Sample Sales data
    await Sales.bulkCreate([
      {
        sale_date: '2024-01-15',
        productId: 'PROD-001',
        product_type: 'Widget A',
        quantity_sold: 800,
        revenue: 24000.00,
        customer_id: 'CUST-001',
        region: 'North',
        sales_rep: 'John Smith'
      },
      {
        sale_date: '2024-01-15',
        productId: 'PROD-002',
        product_type: 'Widget B',
        quantity_sold: 750,
        revenue: 37500.00,
        customer_id: 'CUST-002',
        region: 'South',
        sales_rep: 'Jane Doe'
      },
      {
        sale_date: '2024-01-16',
        productId: 'PROD-001',
        product_type: 'Widget A',
        quantity_sold: 850,
        revenue: 25500.00,
        customer_id: 'CUST-003',
        region: 'East',
        sales_rep: 'Mike Johnson'
      },
      {
        sale_date: '2024-01-17',
        productId: 'PROD-003',
        product_type: 'Gadget X',
        quantity_sold: 600,
        revenue: 42000.00,
        customer_id: 'CUST-004',
        region: 'West',
        sales_rep: 'Sarah Wilson'
      }
    ]);

    console.log("✅ Sample data seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding sample data:", error);
  }
}

startServer();