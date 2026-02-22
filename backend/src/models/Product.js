const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define(
  'Product',
  {
    barcode: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      field: 'code',
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [1, 255],
      },
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    ingredients_text: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Full ingredients list as text',
    },
    nutri_score: {
      type: DataTypes.CHAR(1),
      allowNull: true,
      validate: {
        isIn: [['a', 'b', 'c', 'd', 'e', 'A', 'B', 'C', 'D', 'E']],
      },
      set(value) {
        // Normalize to lowercase
        this.setDataValue('nutri_score', value ? value.toLowerCase() : null);
      },
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      // Note: isUrl validator removed — it rejected many valid OFF CDN URLs
    },
  },
  {
    tableName: 'products',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['code'], // 'code' is the actual DB column name (barcode is the JS alias)
      },
    ],
  }
);

module.exports = Product;
