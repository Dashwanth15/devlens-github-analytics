/**
 * models/CareerPrediction.js - Mongoose Schema for Career Predictions
 * Replaces the MySQL `career_predictions` table.
 */

const mongoose = require("mongoose");

const CareerPredictionSchema = new mongoose.Schema(
  {
    profile_id:       { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true, unique: true },
    current_level:    { type: String },
    predicted_level:  { type: String },
    growth_score:     { type: Number, default: 0 },
    growth_potential: { type: String },
    timeline_months:  { type: Number },
    factor_breakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    recommendations:  { type: [String], default: [] },
    predicted_at:     { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CareerPrediction", CareerPredictionSchema);
