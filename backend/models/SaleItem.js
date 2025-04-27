// models/SaleItem.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const SaleItem = sequelize.define(
    "SaleItem",
    {
      quantity: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      productId: {
        // Ensure this field exists
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      saleId: {
        // Ensure this field exists
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: true, // Ensure this is enabled if you need createdAt/updatedAt
      underscored: true, // Add this for consistent snake_case naming
    }
  );

  SaleItem.associate = (models) => {
    SaleItem.belongsTo(models.Sale, { foreignKey: "saleId", as: "sale" });
    SaleItem.belongsTo(models.Product, {
      foreignKey: "productId",
      as: "product",
    });
  };

  return SaleItem;
};
