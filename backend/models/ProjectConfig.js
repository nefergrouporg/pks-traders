const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProjectConfig = sequelize.define(
    'ProjectConfig',
    {
      upiId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'project_configs',
      timestamps: false, // Optional: Set to true if you want createdAt/updatedAt fields
    }
  );
  return ProjectConfig;
};
