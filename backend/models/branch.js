const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Branch = sequelize.define("Branch", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isBlocked:{
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isDeleted : {
      type: DataTypes.BOOLEAN,
      defaultValue:false
    }
  }, {
    tableName: 'branches',
    timestamps: true
  });

  Branch.associate = (models) => {
    Branch.hasMany(models.User, { foreignKey: 'branchId' });
  };

  return Branch;
};