const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Inventory = sequelize.define('Inventory', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      dateAdded: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    });
  
    Inventory.associate = (models) => {
      Inventory.belongsTo(models.Product, { foreignKey: 'productId' });
      Inventory.belongsTo(models.Order, { foreignKey: 'orderId' });
    };
  
    return Inventory;
  };