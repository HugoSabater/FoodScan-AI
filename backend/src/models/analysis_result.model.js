const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AnalysisResult = sequelize.define(
  'AnalysisResult',
  {
    product_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    diet: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    allergies: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'none',
      comment: 'Alphabetically sorted, comma-joined list of allergies',
    },
    health_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    is_suitable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: 'analysis_results',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['product_code', 'diet', 'allergies'],
      },
    ],
  }
);

module.exports = AnalysisResult;
