// models/SaleItem.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SaleItem = sequelize.define('SaleItem', {
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    productId: { // Ensure this field exists
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    saleId: { // Ensure this field exists
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  SaleItem.associate = (models) => {
    SaleItem.belongsTo(models.Sale, { foreignKey: 'saleId' });
    SaleItem.belongsTo(models.Product, { foreignKey: 'productId' });
  };

  return SaleItem;
};