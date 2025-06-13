// models/Sale.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Sale = sequelize.define(
    "Sale",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      totalAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      purchaseDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      saleType: {
        type: DataTypes.ENUM("wholeSale", "retail", "hotel"),
        allowNull: false,
        defaultValue: "retail",
      },
      recievedAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Customers",
          key: "id",
        },
      },
      branchId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      freezeTableName: true,
    }
  );

  Sale.associate = (models) => {
    Sale.belongsTo(models.Branch, { foreignKey: "branchId", as: "branch" });
    Sale.hasMany(models.SaleItem, { foreignKey: "saleId", as: "items" });
    Sale.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    Sale.belongsTo(models.Customer, {
      foreignKey: "customerId",
      as: "customer",
    });
    Sale.hasMany(models.Payment, { foreignKey: "saleId", as: "payments" });
    
  };

  return Sale;
};
