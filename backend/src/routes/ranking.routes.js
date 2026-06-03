/**
 * ranking.routes.js
 * POST   /api/ranking/campaigns                          → Create campaign
 * GET    /api/ranking/campaigns                          → List all campaigns
 * GET    /api/ranking/campaigns/:id                      → Get campaign + rankings
 * DELETE /api/ranking/campaigns/:id                      → Delete campaign
 * POST   /api/ranking/campaigns/:id/candidates           → Add candidate
 * DELETE /api/ranking/campaigns/:id/candidates/:username → Remove candidate
 * POST   /api/ranking/campaigns/:id/rank                 → Trigger ranking
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers/ranking.controller");
const validateUsername = require("../middleware/validateUsername");

router.post("/campaigns",                                    controller.createCampaign);
router.get("/campaigns",                                     controller.getAllCampaigns);
router.get("/campaigns/:id",                                 controller.getCampaign);
router.delete("/campaigns/:id",                              controller.deleteCampaign);
router.post("/campaigns/:id/candidates",                     validateUsername, controller.addCandidate);
router.delete("/campaigns/:id/candidates/:username",         validateUsername, controller.removeCandidate);
router.post("/campaigns/:id/rank",                           controller.rankCampaign);

module.exports = router;
