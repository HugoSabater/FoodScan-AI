const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Scan model — one record per scan event.
 *
 * Added fields for analysis caching (phase 2):
 *   - profile_hash      : MD5-style hash of (diet+allergies) used as cache key
 *   - analysis_result   : JSON blob storing the full AI response
 *   - analysis_source   : 'ai' | 'cache' | 'fallback'
 *
 * Sequelize sync({ alter: true }) will ADD these columns automatically on startup
 * without dropping existing data.
 */
const Scan = sequelize.define(
  'Scan',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    scanned_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    product_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: 'products',
        key: 'code',
      },
    },

    // ── Analysis cache ──────────────────────────────────────────────
    // Storing the analysis alongside the scan record avoids a separate
    // "analyses" table and makes the cache lookup O(1) with a Sequelize query.

    /** Deterministic hash of the user profile at scan time (diet + sorted allergies) */
    profile_hash: {
      type: DataTypes.STRING(64),
      allowNull: true, // nullable so existing rows without it don't break
    },

    /** Full AI analysis JSON: { is_suitable, analysis_reason, custom_health_score, ai_model, analyzed_at } */
    analysis_result: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    /** Where the analysis came from — useful for TFG metrics */
    analysis_source: {
      type: DataTypes.ENUM('ai', 'cache', 'fallback'),
      allowNull: true,
    },
  },
  {
    tableName: 'scans',
    timestamps: true,
    underscored: true,
  }
);

module.exports = Scan;
