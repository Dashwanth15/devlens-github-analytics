/**
 * models/Profile.js - Mongoose Schema for GitHub Profiles
 * Replaces the MySQL `profiles` + `repositories` tables.
 * Repositories are embedded as a sub-document array.
 */

const mongoose = require("mongoose");

const RepositorySchema = new mongoose.Schema(
  {
    id:                { type: Number },
    repo_id:           { type: Number },
    name:              { type: String },
    repo_name:         { type: String }, // alias for backward compatibility
    full_name:         { type: String },
    description:       { type: String },
    html_url:          { type: String },
    repo_url:          { type: String }, // alias for backward compatibility
    language:          { type: String },
    languages:         { type: mongoose.Schema.Types.Mixed, default: [] },
    stars:             { type: Number, default: 0 },
    forks:             { type: Number, default: 0 },
    watchers:          { type: Number, default: 0 },
    open_issues:       { type: Number, default: 0 },
    size:              { type: Number, default: 0 },
    is_fork:           { type: Boolean, default: false },
    topics:            { type: [String], default: [] },
    default_branch:    { type: String, default: "main" },
    file_extensions:   { type: [String], default: [] },
    manifests:         { type: mongoose.Schema.Types.Mixed, default: {} },
    detected_skills:   { type: [String], default: [] },
    intelligence:      { type: mongoose.Schema.Types.Mixed, default: null },
    created_at:        { type: Date },
    pushed_at:         { type: Date },
  },
  { _id: false }
);

const ProfileSchema = new mongoose.Schema(
  {
    username:            { type: String, required: true, unique: true, lowercase: true, trim: true },
    usernameNormalized:  { type: String, lowercase: true, trim: true, index: true },
    name:                { type: String },
    bio:                 { type: String },
    avatar_url:          { type: String },
    profile_url:         { type: String },
    company:             { type: String },
    location:            { type: String },
    email:               { type: String },
    blog:                { type: String },
    followers:           { type: Number, default: 0 },
    following:           { type: Number, default: 0 },
    public_repos:        { type: Number, default: 0 },
    total_stars:         { type: Number, default: 0 },
    total_forks:         { type: Number, default: 0 },
    account_age_days:    { type: Number, default: 0 },
    most_used_language:  { type: String },
    languages_used:      { type: mongoose.Schema.Types.Mixed, default: {} },
    popularity_score:    { type: Number, default: 0 },
    activity_score:      { type: Number, default: 0 },
    diversity_score:     { type: Number, default: 0 },
    overall_score:       { type: Number, default: 0 },
    top_topics:          { type: [String], default: [] },
    insights:            { type: [String], default: [] },
    lastAnalyzedAt:      { type: Date, default: Date.now, index: true },
    analyzed_at:         { type: Date, default: Date.now },
    repositories:        { type: [RepositorySchema], default: [] },
  },
  { timestamps: true }
);

ProfileSchema.index({ lastAnalyzedAt: -1 });
ProfileSchema.index({ analyzed_at: -1 });

ProfileSchema.pre("save", function (next) {
  if (this.username) {
    this.usernameNormalized = this.username.toLowerCase();
  }
  if (!this.lastAnalyzedAt) {
    this.lastAnalyzedAt = this.analyzed_at || new Date();
  }
  next();
});

module.exports = mongoose.model("Profile", ProfileSchema);
