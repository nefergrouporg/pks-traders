const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.INTEGER, 
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lastPurchaseDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastPurchaseAmount: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    debtAmount: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
      allowNull: false,
    },
    isBlocked:{
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isDeleted : {
      type: DataTypes.BOOLEAN,
      defaultValue:false
    }
  });

  Customer.associate = (models) => {
    Customer.hasMany(models.Sale, { foreignKey: 'customerId', as: 'Sales' });
  };

  return Customer;
};
