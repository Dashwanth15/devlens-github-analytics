/**
 * career.repository.js - MongoDB Query Layer for Career Predictions
 * Migrated from MySQL → MongoDB (Mongoose)
 */

const CareerPrediction = require("../models/CareerPrediction");

/**
 * Upsert a career prediction for a profile (one prediction per profile)
 */
const upsertCareerPrediction = async (data) => {
  const filter  = { profile_id: data.profile_id };
  const update  = {
    $set: {
      current_level:    data.current_level,
      predicted_level:  data.predicted_level,
      growth_score:     data.growth_score,
      growth_potential: data.growth_potential,
      timeline_months:  data.timeline_months,
      factor_breakdown: data.factor_breakdown || {},
      recommendations:  data.recommendations  || [],
      predicted_at:     new Date(),
    },
  };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };

  const doc = await CareerPrediction.findOneAndUpdate(filter, update, options);
  return doc.toObject();
};

/**
 * Get career prediction for a profile
 */
const findByProfileId = async (profileId) => {
  return CareerPrediction.findOne({ profile_id: profileId }).lean();
};

module.exports = {
  upsertCareerPrediction,
  findByProfileId,
};
