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
      paymentMethod: {
        type: DataTypes.ENUM("cash", "card", "upi", "qr"),
        allowNull: false,
      },
      purchaseDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      saleType:{
        type: DataTypes.ENUM("wholeSale", "retail"),
        allowNull : false,
        defaultValue: "retail"
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Customers",
          key: "id",
        },
      },
    },
    {
      freezeTableName: true,
    }
  );

  Sale.associate = (models) => {
    Sale.hasMany(models.SaleItem, { foreignKey: "saleId" });
    Sale.belongsTo(models.User, { foreignKey: "userId" });
    Sale.belongsTo(models.Customer, { foreignKey: "customerId" });
    Sale.hasOne(models.Payment, { foreignKey: "saleId" });
  };

  return Sale;
};
