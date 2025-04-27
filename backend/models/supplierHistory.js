const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SupplierHistory = sequelize.define('SupplierHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    paymentStatus: {
      type: DataTypes.ENUM('Paid', 'Unpaid', 'Partial'),
      defaultValue: 'Unpaid',
    },
  });

  SupplierHistory.associate = (models) => {
    SupplierHistory.belongsTo(models.Supplier, { foreignKey: 'supplierId' });
    SupplierHistory.belongsTo(models.Product, { foreignKey: 'productId', as: 'products'});
  };

  return SupplierHistory;
};