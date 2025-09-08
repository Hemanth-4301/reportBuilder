const { Sequelize, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Production = sequelize.define(
    "Production",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      productId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      factory: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      shift: {
        type: DataTypes.ENUM("Morning", "Afternoon", "Night"),
        defaultValue: "Morning",
      },
      line: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
      },
    },
    {
      tableName: "production",
      timestamps: true,
    }
  );

  const Defects = sequelize.define(
    "Defects",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      productId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      defectCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("Cosmetic", "Functional", "Critical", "Minor"),
        allowNull: false,
      },
      severity: {
        type: DataTypes.ENUM("Low", "Medium", "High", "Critical"),
        defaultValue: "Medium",
      },
      factory: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      inspector: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
      },
    },
    {
      tableName: "defects",
      timestamps: true,
    }
  );

  const Sales = sequelize.define(
    "Sales",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      region: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      productId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      customerId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      salesRep: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      channel: {
        type: DataTypes.ENUM("Direct", "Retail", "Online", "Distributor"),
        defaultValue: "Direct",
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
      },
    },
    {
      tableName: "sales",
      timestamps: true,
    }
  );

  return { Production, Defects, Sales };
};