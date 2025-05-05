const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Supplier = sequelize.define('Supplier', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      contactPerson: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      isDeleted : {
        type: DataTypes.BOOLEAN,
        defaultValue:false
      }
    });
  
    Supplier.associate = (models) => {
      Supplier.hasMany(models.Product, { foreignKey: 'supplierId', as: 'products' });
      Supplier.hasMany(models.Order, { foreignKey: 'supplierId' });
    };
  
    return Supplier;
  };