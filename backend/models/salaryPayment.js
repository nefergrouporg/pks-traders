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
    status: {
      type: DataTypes.ENUM('paid', 'unpaid'),
      defaultValue: 'unpaid'
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    incentive: {
      type: DataTypes.INTEGER,
      allowNull : true,
      default: 0
    },
    cutOff :{
      type: DataTypes.INTEGER,
      allowNull: true,
      default: 0
    },
    paid:{
      type: DataTypes.INTEGER,
      allowNull :true,
    }
  });

  SalaryPayment.associate = (models) => {
    SalaryPayment.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return SalaryPayment;
};
