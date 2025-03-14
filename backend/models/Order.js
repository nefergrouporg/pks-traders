const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Order = sequelize.define('Order', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      orderDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      totalAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
        defaultValue: 'pending',
      },
      supplierId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    });
  
    Order.associate = (models) => {
      Order.belongsTo(models.Supplier, { foreignKey: 'supplierId' });
      Order.hasMany(models.Inventory, { foreignKey: 'orderId' });
    };
  
    return Order;
  };