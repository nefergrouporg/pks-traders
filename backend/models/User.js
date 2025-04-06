const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    age:{
      type:DataTypes.INTEGER,
      allowNull: true
    },
    gender:{
      type:DataTypes.STRING,
      allowNull: true
    },
    aadharNumber:{
      type: DataTypes.STRING,
      allowNull: true
    },
    address:{
      type:DataTypes.STRING,
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('admin', 'staff', 'manager'),
      defaultValue: 'staff',
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    salary: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    salaryCredited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    branchId: {
      type: DataTypes.INTEGER,
      allowNull: true, // or false if every user must belong to a branch
      references: {
        model: 'branches', // This is the table name
        key: 'id'
      }
    }
  });

  User.associate = (models) => {
    User.belongsTo(models.Branch, { foreignKey: 'branchId' });
    User.hasMany(models.Sale, { foreignKey: 'userId' });
    User.hasMany(models.Payment, { foreignKey: 'userId' });
  };

  return User;
};