const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");
dotenv.config();

// Initialize Sequelize
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

// Initialize models
const initModels = require("../models/init-models");
const models = initModels(sequelize);

// Sample data generators
const factories = ["Factory-A", "Factory-B", "Factory-C"];
const shifts = ["Morning", "Afternoon", "Night"];
const lines = ["Line-1", "Line-2", "Line-3"];
const defectTypes = ["Cosmetic", "Functional", "Critical", "Minor"];
const severities = ["Low", "Medium", "High", "Critical"];
const regions = ["North", "South", "East", "West"];
const channels = ["Direct", "Retail", "Online", "Distributor"];
const salesReps = ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown"];
const inspectors = ["Inspector-1", "Inspector-2", "Inspector-3"];

const generateRandomDate = (start, end) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
};

const generateProductId = (index) =>
  `PROD-${String(index + 1).padStart(3, "0")}`;
const generateCustomerId = (index) =>
  `CUST-${String(index + 1).padStart(3, "0")}`;

// Seed data arrays
const productionData = Array.from({ length: 20 }, (_, index) => ({
  productId: generateProductId(index % 5), // Cycle through 5 product IDs
  quantity: Math.floor(Math.random() * 1000) + 100, // Random quantity between 100 and 1099
  date: generateRandomDate(new Date("2024-01-01"), new Date("2025-12-31")),
  factory: factories[Math.floor(Math.random() * factories.length)],
  shift: shifts[Math.floor(Math.random() * shifts.length)],
  line: lines[Math.floor(Math.random() * lines.length)],
}));

const defectsData = Array.from({ length: 20 }, (_, index) => ({
  productId: generateProductId(index % 5),
  defectCount: Math.floor(Math.random() * 50) + 1, // Random defect count between 1 and 50
  date: generateRandomDate(new Date("2024-01-01"), new Date("2025-12-31")),
  type: defectTypes[Math.floor(Math.random() * defectTypes.length)],
  severity: severities[Math.floor(Math.random() * severities.length)],
  factory: factories[Math.floor(Math.random() * factories.length)],
  inspector: inspectors[Math.floor(Math.random() * inspectors.length)],
}));

const salesData = Array.from({ length: 20 }, (_, index) => ({
  region: regions[Math.floor(Math.random() * regions.length)],
  amount: parseFloat((Math.random() * 10000 + 500).toFixed(2)), // Random amount between 500 and 10500
  date: generateRandomDate(new Date("2024-01-01"), new Date("2025-12-31")),
  productId: generateProductId(index % 5),
  customerId: generateCustomerId(index % 5),
  salesRep: salesReps[Math.floor(Math.random() * salesReps.length)],
  channel: channels[Math.floor(Math.random() * channels.length)],
}));

// Seed function
const seedDatabase = async () => {
  try {
    // Sync database (force: true to drop and recreate tables)
    console.log("Syncing database...");
    await sequelize.sync({ force: true });

    // Seed Production table
    console.log("Seeding Production table...");
    await models.Production.bulkCreate(productionData);
    console.log(`Inserted ${productionData.length} production records`);

    // Seed Defects table
    console.log("Seeding Defects table...");
    await models.Defects.bulkCreate(defectsData);
    console.log(`Inserted ${defectsData.length} defects records`);

    // Seed Sales table
    console.log("Seeding Sales table...");
    await models.Sales.bulkCreate(salesData);
    console.log(`Inserted ${salesData.length} sales records`);

    console.log("✅ Database seeding completed successfully");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    await sequelize.close();
  }
};

// Run the seed function
seedDatabase();
