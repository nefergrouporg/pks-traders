const { DataTypes, INTEGER } = require('sequelize');

module.exports = (sequelize) => {
  const SalaryPayment = sequelize.define('SalaryPayment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    month: {
      type: DataTypes.STRING, 
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('advance', 'incentive'),
      allowNull: false,
      defaultValue: 'advance',
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    notes: {  
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  SalaryPayment.associate = (models) => {
    SalaryPayment.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return SalaryPayment;
};
