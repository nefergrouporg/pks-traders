const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Product = sequelize.define('Product', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      barcode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      stock: {
        type: DataTypes.FLOAT,  // Change INTEGER to FLOAT for kg support
        allowNull: false,
        defaultValue: 0,
      },
      unitType: {
        type: DataTypes.ENUM('pcs', 'kg'), 
        allowNull: false,
        defaultValue: 'pcs',
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      batchNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lowStockThreshold: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
      },
      active:{
        type: DataTypes.BOOLEAN,
        defaultValue:true
      }
    });
  
    Product.associate = (models) => {
      Product.hasMany(models.Inventory, { foreignKey: 'productId' });
      Product.hasMany(models.Sale, { foreignKey: 'productId' });
    };
  
    return Product;
  };