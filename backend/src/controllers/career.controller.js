/**
 * career.controller.js - Career Growth Prediction HTTP Handlers
 */

const careerService = require("../services/career.service");
const careerRepository = require("../repositories/career.repository");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Enrich cached DB row to match the fresh prediction shape
// (DB row lacks 'username' and 'level_thresholds'; Career.jsx reads these)
const enrichCachedResult = (cached, username) => ({
  username,
  current_level:   cached.current_level,
  predicted_level: cached.predicted_level,
  growth_score:    cached.growth_score,
  growth_potential: cached.growth_potential,
  timeline_months: cached.timeline_months,
  factor_breakdown: cached.factor_breakdown,
  recommendations: cached.recommendations,
  level_thresholds: {
    beginner:     0,
    junior:       22,
    intermediate: 42,
    advanced:     62,
    expert:       80,
  },
  _cached_at: cached.predicted_at,
});

// GET /api/career/:username  — returns cached or computes fresh
const getCareerPrediction = asyncHandler(async (req, res) => {
  const { username } = req.params;

  // Check DB first for cached prediction
  const cached = await careerRepository.findByUsername(username);
  if (cached) {
    return res.status(200).json({
      success: true,
      message: "Career prediction retrieved.",
      cached: true,
      data: enrichCachedResult(cached, username),
    });
  }

  // Compute fresh
  const result = await careerService.predictCareerGrowth(username);
  return res.status(200).json({
    success: true,
    message: `Career growth prediction computed for '${username}'.`,
    cached: false,
    data: result,
  });
});

// POST /api/career/:username/refresh  — force recompute
const refreshCareerPrediction = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const result = await careerService.predictCareerGrowth(username);
  return res.status(200).json({
    success: true,
    message: `Career growth prediction refreshed for '${username}'.`,
    cached: false,
    data: result,
  });
});

module.exports = { getCareerPrediction, refreshCareerPrediction };
