const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProjectConfig = sequelize.define('ProjectConfig', {
    upiId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  });

  return ProjectConfig;
};