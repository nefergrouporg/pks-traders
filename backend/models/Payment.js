const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Payment = sequelize.define('Payment', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed'),
        defaultValue: 'pending',
      },
      transactionId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      paymentMethod: {
        type: DataTypes.ENUM('cash', 'card', 'upi', 'debt'),
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      saleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      upiTransactionId: {  // Add UPI-specific field
        type: DataTypes.STRING,
        allowNull: true,
      },
      cardApprovalCode: {  // Add card-specific field
        type: DataTypes.STRING,
        allowNull: true,
      }
    });
  
    Payment.associate = (models) => {
      Payment.belongsTo(models.User, { foreignKey: 'userId' });
      Payment.belongsTo(models.Sale, { foreignKey: 'saleId', as: 'sale' });
    };
  
    return Payment;
  };