/**
 * profile.repository.js - MongoDB Query Layer (Repository Pattern)
 * Strictly enforces rolling "Latest 20 Developers" queue.
 */

const Profile = require("../models/Profile");

const MAX_PROFILES_LIMIT = 20;

/**
 * Prune profiles database so strictly only the newest `maxProfiles` remain.
 * Uses atomic bulk deletion based on lastAnalyzedAt DESC.
 * @param {number} maxProfiles
 * @returns {Promise<number>} Number of profiles deleted
 */
const enforceProfileLimit = async (maxProfiles = MAX_PROFILES_LIMIT) => {
  try {
    const total = await Profile.countDocuments();
    if (total <= maxProfiles) return 0;

    // Find the IDs of the newest maxProfiles profiles
    const newestProfiles = await Profile.find({}, { _id: 1 })
      .sort({ lastAnalyzedAt: -1, analyzed_at: -1, _id: -1 })
      .limit(maxProfiles)
      .lean();

    const keepIds = newestProfiles.map((p) => p._id);

    // Delete any profiles older than the 20th
    const deleteResult = await Profile.deleteMany({ _id: { $nin: keepIds } });
    if (deleteResult.deletedCount > 0) {
      console.log(
        `[ProfileQueue] Pruned ${deleteResult.deletedCount} older developer profile(s). Queue maintained at exactly ${maxProfiles}.`
      );
    }
    return deleteResult.deletedCount;
  } catch (err) {
    console.error("[ProfileQueue] Error enforcing profile limit:", err.message);
    return 0;
  }
};

/**
 * Initialize queue on server startup:
 * 1. Backfills lastAnalyzedAt & usernameNormalized for legacy records
 * 2. Prunes any historical surplus so at most 20 remain
 */
const initializeProfileQueue = async () => {
  try {
    // Backfill missing lastAnalyzedAt
    await Profile.updateMany(
      { lastAnalyzedAt: { $exists: false } },
      [{ $set: { lastAnalyzedAt: { $ifNull: ["$analyzed_at", "$createdAt", new Date()] } } }]
    );

    // Backfill missing usernameNormalized
    await Profile.updateMany(
      { usernameNormalized: { $exists: false } },
      [{ $set: { usernameNormalized: { $toLower: "$username" } } }]
    );

    const pruned = await enforceProfileLimit(MAX_PROFILES_LIMIT);
    const count = await Profile.countDocuments();
    console.log(`[ProfileQueue] Initialized: ${count} of ${MAX_PROFILES_LIMIT} developer profiles active.`);
    return { count, pruned };
  } catch (err) {
    console.error("[ProfileQueue] Initialization error:", err.message);
  }
};

/**
 * Find profile by username (case-insensitive)
 */
const findByUsername = async (username) => {
  if (!username) return null;
  const clean = username.toLowerCase().trim();
  const profile = await Profile.findOne({
    $or: [{ username: clean }, { usernameNormalized: clean }],
  }).lean();

  if (profile) {
    profile.id = profile._id ? profile._id.toString() : null;
  }
  return profile;
};

/**
 * Find all profiles with pagination (Strictly max 20, ordered newest first)
 */
const findAll = async (page = 1, limit = MAX_PROFILES_LIMIT) => {
  // Proactive self-healing: if database has > 20 records, prune first
  const countCheck = await Profile.countDocuments();
  if (countCheck > MAX_PROFILES_LIMIT) {
    await enforceProfileLimit(MAX_PROFILES_LIMIT);
  }

  const cappedLimit = Math.min(MAX_PROFILES_LIMIT, Math.max(1, limit));
  const skip = (page - 1) * cappedLimit;

  const [data, total] = await Promise.all([
    Profile.find(
      {},
      {
        username: 1,
        usernameNormalized: 1,
        name: 1,
        avatar_url: 1,
        profile_url: 1,
        location: 1,
        followers: 1,
        following: 1,
        public_repos: 1,
        total_stars: 1,
        most_used_language: 1,
        popularity_score: 1,
        overall_score: 1,
        account_age_days: 1,
        lastAnalyzedAt: 1,
        analyzed_at: 1,
      }
    )
      .sort({ lastAnalyzedAt: -1, analyzed_at: -1, _id: -1 })
      .skip(skip)
      .limit(cappedLimit)
      .lean(),
    Profile.countDocuments(),
  ]);

  const effectiveTotal = Math.min(MAX_PROFILES_LIMIT, total);
  return {
    data,
    profiles: data,
    total: effectiveTotal,
    page,
    limit: cappedLimit,
    totalPages: Math.max(1, Math.ceil(effectiveTotal / cappedLimit)),
  };
};

const findByUsernameWithRepos = async (username) => {
  if (!username) return null;
  const clean = username.toLowerCase().trim();
  const profile = await Profile.findOne({
    $or: [{ username: clean }, { usernameNormalized: clean }],
  }).lean();

  if (profile) {
    profile.id = profile._id ? profile._id.toString() : null;
  }
  return profile;
};

/**
 * Upsert profile:
 * - Case-insensitive match on username
 * - Updates lastAnalyzedAt & analyzed_at to NOW (moves to top of queue)
 * - Updates scores and profile information
 * - Immediately enforces the 20-profile limit queue
 */
const upsertProfile = async (profileData) => {
  const cleanUser = (profileData.username || "").toLowerCase().trim();
  const now = new Date();

  const filter = { username: cleanUser };
  const update = {
    $set: {
      ...profileData,
      username: cleanUser,
      usernameNormalized: cleanUser,
      lastAnalyzedAt: now,
      analyzed_at: now,
    },
  };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };

  const doc = await Profile.findOneAndUpdate(filter, update, options).lean();
  if (doc) {
    doc.id = doc._id ? doc._id.toString() : null;
  }

  // Enforce the 20-profile queue limit immediately after saving
  await enforceProfileLimit(MAX_PROFILES_LIMIT);

  return doc;
};

/** Used by resume.service.js to sync repos after analysis */
const upsertRepositories = async (profileId, repos) => {
  const pid = profileId?._id || profileId?.id || profileId;
  if (!pid) return null;

  const mappedRepos = (repos || []).map((r) => {
    const canonicalName = r.name || r.repo_name || "";
    const canonicalUrl = r.html_url || r.repo_url || null;
    return {
      id:             r.id || r.repo_id || null,
      repo_id:        r.id || r.repo_id || null,
      name:           canonicalName,
      repo_name:      canonicalName,
      full_name:      r.full_name || canonicalName,
      description:    r.description || null,
      html_url:       canonicalUrl,
      repo_url:       canonicalUrl,
      language:       r.language || null,
      languages:      r.languages || [],
      stars:          r.stars ?? r.stargazers_count ?? 0,
      forks:          r.forks ?? r.forks_count ?? 0,
      watchers:       r.watchers ?? r.watchers_count ?? 0,
      open_issues:    r.open_issues ?? r.open_issues_count ?? 0,
      size:           r.size || 0,
      is_fork:        r.is_fork ?? r.fork ?? false,
      topics:         Array.isArray(r.topics) ? r.topics : [],
      default_branch: r.default_branch || "main",
      created_at:     r.created_at ? new Date(r.created_at) : null,
      pushed_at:      r.pushed_at  ? new Date(r.pushed_at)  : null,
    };
  });
  return Profile.findByIdAndUpdate(
    pid,
    { $set: { repositories: mappedRepos } },
    { new: true }
  ).lean();
};

/** Get repos from an embedded profile */
const getRepositoriesByProfileId = async (profileId) => {
  const pid = profileId?._id || profileId?.id || profileId;
  if (!pid) return [];
  const profile = await Profile.findById(pid, { repositories: 1 }).lean();
  return profile ? (profile.repositories || []) : [];
};

const getRepositoriesByUsername = async (username) => {
  if (!username) return [];
  const clean = username.toLowerCase().trim();
  const profile = await Profile.findOne(
    { $or: [{ username: clean }, { usernameNormalized: clean }] },
    { repositories: 1 }
  ).lean();
  return profile ? (profile.repositories || []) : [];
};

const deleteByUsername = async (username) => {
  if (!username) return false;
  const clean = username.toLowerCase().trim();
  const result = await Profile.deleteOne({
    $or: [{ username: clean }, { usernameNormalized: clean }],
  });
  return result.deletedCount > 0;
};

const searchProfiles = async (query, limit = 10) => {
  const capped = Math.min(MAX_PROFILES_LIMIT, limit);
  return Profile.find(
    {
      $or: [
        { username: { $regex: query, $options: "i" } },
        { usernameNormalized: { $regex: query, $options: "i" } },
        { name:     { $regex: query, $options: "i" } },
      ],
    },
    {
      username: 1, name: 1, avatar_url: 1, location: 1,
      followers: 1, public_repos: 1, most_used_language: 1, overall_score: 1,
      lastAnalyzedAt: 1, analyzed_at: 1,
    }
  )
    .sort({ lastAnalyzedAt: -1, analyzed_at: -1 })
    .limit(capped)
    .lean();
};

const getTopProfiles = async (limit = MAX_PROFILES_LIMIT) => {
  const capped = Math.min(MAX_PROFILES_LIMIT, limit);
  return Profile.find(
    {},
    {
      username: 1, name: 1, avatar_url: 1, location: 1,
      followers: 1, public_repos: 1, most_used_language: 1,
      overall_score: 1, popularity_score: 1, lastAnalyzedAt: 1, analyzed_at: 1,
    }
  ).sort({ overall_score: -1 }).limit(capped).lean();
};

module.exports = {
  MAX_PROFILES_LIMIT,
  enforceProfileLimit,
  initializeProfileQueue,
  findByUsername,
  findAll,
  findByUsernameWithRepos,
  upsertProfile,
  upsertRepositories,
  getRepositoriesByProfileId,
  getRepositoriesByUsername,
  deleteByUsername,
  searchProfiles,
  getTopProfiles,
};
