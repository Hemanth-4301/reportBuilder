const mongoose = require("mongoose");
const Production = require("../models/Production");
const Defects = require("../models/Defects");
const Sales = require("../models/Sales");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://127.0.0.1:27017/manufacturing_reports",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
      }
    );
    console.log("✅ Connected to MongoDB for seeding");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const generateProductionData = () => {
  const products = ["PROD-001", "PROD-002", "PROD-003", "PROD-004", "PROD-005"];
  const factories = ["Factory-A", "Factory-B", "Factory-C"];
  const shifts = ["Morning", "Afternoon", "Night"];
  const lines = ["Line-1", "Line-2", "Line-3", "Line-4"];

  const data = [];
  for (let i = 0; i < 20; i++) {
    // Adjusted to 20 as per your request
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90));
    data.push({
      productId: products[Math.floor(Math.random() * products.length)],
      quantity: Math.floor(Math.random() * 1000) + 100,
      date,
      factory: factories[Math.floor(Math.random() * factories.length)],
      shift: shifts[Math.floor(Math.random() * shifts.length)],
      line: lines[Math.floor(Math.random() * lines.length)],
    });
  }
  return data;
};

const generateDefectsData = () => {
  const products = ["PROD-001", "PROD-002", "PROD-003", "PROD-004", "PROD-005"];
  const factories = ["Factory-A", "Factory-B", "Factory-C"];
  const types = ["Cosmetic", "Functional", "Critical", "Minor"];
  const severities = ["Low", "Medium", "High", "Critical"];
  const inspectors = ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown"];

  const data = [];
  for (let i = 0; i < 20; i++) {
    // Adjusted to 20 as per your request
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90));
    data.push({
      productId: products[Math.floor(Math.random() * products.length)],
      defectCount: Math.floor(Math.random() * 50) + 1,
      date,
      type: types[Math.floor(Math.random() * types.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      factory: factories[Math.floor(Math.random() * factories.length)],
      inspector: inspectors[Math.floor(Math.random() * inspectors.length)],
    });
  }
  return data;
};

const generateSalesData = () => {
  const regions = [
    "North America",
    "Europe",
    "Asia Pacific",
    "South America",
    "Middle East",
  ];
  const products = ["PROD-001", "PROD-002", "PROD-003", "PROD-004", "PROD-005"];
  const customers = [
    "CUST-001",
    "CUST-002",
    "CUST-003",
    "CUST-004",
    "CUST-005",
  ];
  const salesReps = [
    "Mike Wilson",
    "Sarah Davis",
    "Tom Anderson",
    "Lisa Garcia",
  ];
  const channels = ["Direct", "Retail", "Online", "Distributor"];

  const data = [];
  for (let i = 0; i < 20; i++) {
    // Adjusted to 20 as per your request
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90));
    data.push({
      region: regions[Math.floor(Math.random() * regions.length)],
      amount: Math.floor(Math.random() * 100000) + 10000,
      date,
      productId: products[Math.floor(Math.random() * products.length)],
      customerId: customers[Math.floor(Math.random() * customers.length)],
      salesRep: salesReps[Math.floor(Math.random() * salesReps.length)],
      channel: channels[Math.floor(Math.random() * channels.length)],
    });
  }
  return data;
};

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log("🧹 Clearing existing data...");
    await Production.deleteMany({});
    await Defects.deleteMany({});
    await Sales.deleteMany({});

    // Generate and insert new data with detailed logging
    console.log("📊 Generating production data...");
    const productionData = generateProductionData();
    const productionResult = await Production.insertMany(productionData, {
      ordered: false,
    });
    console.log(`✅ Inserted ${productionResult.length} production records`);

    console.log("📊 Generating defects data...");
    const defectsData = generateDefectsData();
    const defectsResult = await Defects.insertMany(defectsData, {
      ordered: false,
    });
    console.log(`✅ Inserted ${defectsResult.length} defects records`);

    console.log("📊 Generating sales data...");
    const salesData = generateSalesData();
    const salesResult = await Sales.insertMany(salesData, { ordered: false });
    console.log(`✅ Inserted ${salesResult.length} sales records`);

    console.log("🎉 Database seeded successfully!");

    // Display summary
    const prodCount = await Production.countDocuments();
    const defectsCount = await Defects.countDocuments();
    const salesCount = await Sales.countDocuments();

    console.log("\n📈 Database Summary:");
    console.log(`Production records: ${prodCount}`);
    console.log(`Defects records: ${defectsCount}`);
    console.log(`Sales records: ${salesCount}`);
    console.log(`Total records: ${prodCount + defectsCount + salesCount}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    if (error.writeErrors) {
      console.error("Detailed insertion errors:", error.writeErrors);
    }
    process.exit(1);
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
