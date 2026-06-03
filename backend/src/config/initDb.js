/**
 * initDb.js - Database Schema Initialization Script
 *
 * WHY THIS EXISTS:
 * Run once to create all tables: `npm run db:init`
 * This is your "migration" for this project level.
 * Reviewers can run this to set up the DB from scratch.
 *
 * Strategy:
 * 1. Connect WITHOUT specifying a database (so no "unknown db" error)
 * 2. CREATE DATABASE IF NOT EXISTS
 * 3. USE the database
 * 4. CREATE TABLES IF NOT EXISTS
 *
 * Safe to run multiple times without errors.
 */

const mysql = require("mysql2/promise");
const env = require("./env");

const init = async (retries = 5, delay = 2000) => {
  let connection;
  const connectionConfig = {
    host: env.db.host,
    user: env.db.user,
    password: env.db.password,
    port: env.db.port,
  };

  if (env.db.ssl) {
    connectionConfig.ssl = {
      rejectUnauthorized: false,
    };
  }

  for (let i = 1; i <= retries; i++) {
    try {
      // Connect WITHOUT database name first (to prevent unknown database errors)
      connection = await mysql.createConnection(connectionConfig);
      break;
    } catch (error) {
      console.error(`⚠️ Database connection attempt ${i}/${retries} failed: ${error.message}`);
      if (i === retries) {
        console.error("❌ Database connection failed permanently during initialization. Exiting...");
        process.exit(1);
      }
      console.log(`Waiting ${delay / 1000}s before next attempt...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 1.5; // Exponential backoff
    }
  }

  try {
    console.log("🔧 Initializing database...\n");

    // ── STEP 1: Create database if it doesn't exist ──────────────
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.db.name}\` 
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    console.log(`✅ Database '${env.db.name}' ready`);

    // ── STEP 2: Switch to the database ───────────────────────────
    await connection.query(`USE \`${env.db.name}\`;`);

    // ── STEP 3: Create profiles table ────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id                   INT AUTO_INCREMENT PRIMARY KEY,
        username             VARCHAR(100)    NOT NULL UNIQUE,
        name                 VARCHAR(255),
        bio                  TEXT,
        avatar_url           VARCHAR(500),
        profile_url          VARCHAR(500),
        company              VARCHAR(255),
        location             VARCHAR(255),
        email                VARCHAR(255),
        blog                 VARCHAR(500),
        followers            INT             DEFAULT 0,
        following            INT             DEFAULT 0,
        public_repos         INT             DEFAULT 0,
        public_gists         INT             DEFAULT 0,
        total_stars          INT             DEFAULT 0,
        total_forks          INT             DEFAULT 0,
        most_used_language   VARCHAR(100),
        popularity_score     DECIMAL(10, 2)  DEFAULT 0.00,
        account_age_days     INT             DEFAULT 0,
        github_created_at    DATETIME,
        analyzed_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_username   (username),
        INDEX idx_popularity (popularity_score DESC),
        INDEX idx_analyzed   (analyzed_at DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✅ Table 'profiles' created (or already exists)");

    // ── STEP 4: Create repositories table ────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS repositories (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        profile_id   INT          NOT NULL,
        repo_name    VARCHAR(255) NOT NULL,
        description  TEXT,
        language     VARCHAR(100),
        stars        INT          DEFAULT 0,
        forks        INT          DEFAULT 0,
        watchers     INT          DEFAULT 0,
        is_fork      BOOLEAN      DEFAULT FALSE,
        repo_url     VARCHAR(500),
        created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY  (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
        INDEX idx_profile_id (profile_id),
        INDEX idx_stars      (stars DESC),
        UNIQUE KEY unique_repo (profile_id, repo_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✅ Table 'repositories' created (or already exists)");

    // ── STEP 5: Create resume_analyses table ─────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS resume_analyses (
        id                      INT AUTO_INCREMENT PRIMARY KEY,
        profile_id              INT NOT NULL,
        resume_filename         VARCHAR(255),
        resume_text             LONGTEXT,
        extracted_skills        JSON,
        extracted_technologies  JSON,
        extracted_projects      JSON,
        experience_years        DECIMAL(4,1),
        verification_score      DECIMAL(5,2)  DEFAULT 0,
        skill_confidence_score  DECIMAL(5,2)  DEFAULT 0,
        verification_report     JSON,
        missing_evidence        JSON,
        analyzed_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
        INDEX idx_ra_profile    (profile_id),
        INDEX idx_ra_analyzed   (analyzed_at DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✅ Table 'resume_analyses' created (or already exists)");

    // ── STEP 6: Create career_predictions table ───────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS career_predictions (
        id                    INT AUTO_INCREMENT PRIMARY KEY,
        profile_id            INT NOT NULL,
        current_level         ENUM('beginner','junior','intermediate','advanced','expert') NOT NULL,
        predicted_level       ENUM('beginner','junior','intermediate','advanced','expert') NOT NULL,
        growth_score          DECIMAL(5,2)  DEFAULT 0,
        growth_potential      ENUM('low','moderate','high','exceptional') NOT NULL,
        timeline_months       INT,
        factor_breakdown      JSON,
        recommendations       JSON,
        predicted_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
        INDEX idx_cp_profile  (profile_id),
        INDEX idx_cp_level    (current_level),
        UNIQUE KEY unique_career_profile (profile_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✅ Table 'career_predictions' created (or already exists)");

    // ── STEP 7: Create job_analyses table ────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS job_analyses (
        id                      INT AUTO_INCREMENT PRIMARY KEY,
        profile_id              INT NOT NULL,
        job_title               VARCHAR(255),
        job_description         TEXT NOT NULL,
        required_skills         JSON,
        nice_to_have_skills     JSON,
        experience_level        VARCHAR(50),
        match_score             DECIMAL(5,2)  DEFAULT 0,
        skill_match_breakdown   JSON,
        strengths               JSON,
        gaps                    JSON,
        hiring_readiness        ENUM('not_ready','developing','ready','exceptional'),
        recommendations         JSON,
        source_hash             VARCHAR(64),
        analyzed_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
        INDEX idx_ja_profile    (profile_id),
        INDEX idx_ja_score      (match_score DESC),
        INDEX idx_ja_hash       (source_hash)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✅ Table 'job_analyses' created (or already exists)");

    // ── STEP 8: Create ranking_campaigns table ────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ranking_campaigns (
        id                INT AUTO_INCREMENT PRIMARY KEY,
        title             VARCHAR(255) NOT NULL,
        role_name         VARCHAR(255),
        job_description   TEXT NOT NULL,
        required_skills   JSON,
        status            ENUM('draft','analyzing','complete') DEFAULT 'draft',
        created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_rc_status  (status),
        INDEX idx_rc_created (created_at DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✅ Table 'ranking_campaigns' created (or already exists)");

    // ── STEP 9: Create campaign_candidates table ──────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS campaign_candidates (
        id                    INT AUTO_INCREMENT PRIMARY KEY,
        campaign_id           INT NOT NULL,
        profile_id            INT NOT NULL,
        username              VARCHAR(100) NOT NULL,
        job_match_score       DECIMAL(5,2)  DEFAULT 0,
        tech_fit_score        DECIMAL(5,2)  DEFAULT 0,
        repo_quality_score    DECIMAL(5,2)  DEFAULT 0,
        open_source_score     DECIMAL(5,2)  DEFAULT 0,
        activity_score        DECIMAL(5,2)  DEFAULT 0,
        growth_score          DECIMAL(5,2)  DEFAULT 0,
        composite_score       DECIMAL(5,2)  DEFAULT 0,
        rank_position         INT,
        score_breakdown       JSON,
        analysis_status       ENUM('pending','analyzing','complete','error') DEFAULT 'pending',
        added_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        analyzed_at           TIMESTAMP NULL,
        FOREIGN KEY (campaign_id) REFERENCES ranking_campaigns(id) ON DELETE CASCADE,
        FOREIGN KEY (profile_id)  REFERENCES profiles(id) ON DELETE CASCADE,
        INDEX idx_cc_campaign     (campaign_id),
        INDEX idx_cc_composite    (composite_score DESC),
        UNIQUE KEY unique_candidate (campaign_id, profile_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✅ Table 'campaign_candidates' created (or already exists)");

    console.log("\n🎉 Database initialized successfully!");
    console.log("📋 Tables ready: profiles, repositories, resume_analyses, career_predictions, job_analyses, ranking_campaigns, campaign_candidates");
    console.log("🚀 You can now run: npm run dev\n");
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    throw error;
  } finally {
    await connection.end();
  }
};

init().catch((err) => {
  console.error(err);
  process.exit(1);
});
