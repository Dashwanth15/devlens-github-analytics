const resumeService = require("../services/resume.service");
const careerService = require("../services/career.service");
const jobService = require("../services/job.service");
const rankingService = require("../services/ranking.service");

async function main() {
  console.log("🚀 STARTING INTEGRATION & FUNCTIONAL TESTS FOR 4 NEW Platform FEATURES\n");
  
  const testUser = "tj"; // 'tj' is a well-known dev profile with lots of JS/Go repositories

  // 1. Test Feature 1: Resume Verification
  console.log("=== Feature 1: Resume Verification ===");
  const resumeText = `
  TJ
  JavaScript and Node.js Developer
  
  Experience:
  - 8+ years of software development.
  
  Skills:
  - JavaScript, Node.js, Express, Go, Python, React
  - Redis, MongoDB, Git, Docker, AWS
  
  Projects:
  - Built Express.js framework for Node.js
  - Developed Koa.js web framework
  - Created Commander.js command-line interface helper
  `;
  
  try {
    const report = await resumeService.analyzeResumeText(testUser, resumeText);
    console.log("✅ Resume Verification Succeeded!");
    console.log(`Verification Score: ${report.verification_score}%`);
    console.log(`Skill Confidence Score: ${report.skill_confidence_score}%`);
    console.log("Verified Skills:", report.verification_report.filter(r => r.status === "verified").map(r => r.skill));
    console.log("Not Found Skills:", report.verification_report.filter(r => r.status === "not_found").map(r => r.skill));
  } catch (error) {
    console.error("❌ Resume Verification Failed:", error);
  }
  
  console.log("\n--------------------------------------------------\n");

  // 2. Test Feature 2: Career Growth Prediction
  console.log("=== Feature 2: Career Growth Prediction ===");
  try {
    const prediction = await careerService.predictCareerGrowth(testUser);
    console.log("✅ Career Growth Prediction Succeeded!");
    console.log(`Current Level: ${prediction.current_level}`);
    console.log(`Predicted Level: ${prediction.predicted_level}`);
    console.log(`Growth Score: ${prediction.growth_score}/100`);
    console.log(`Timeline to promotion: ${prediction.timeline_months} months`);
    console.log("Recommendations:", prediction.recommendations);
  } catch (error) {
    console.error("❌ Career Prediction Failed:", error);
  }
  
  console.log("\n--------------------------------------------------\n");

  // 3. Test Feature 3: Job Match Engine
  console.log("=== Feature 3: Job Match Engine ===");
  const jobDescription = `
  Senior Software Engineer - Web Platforms
  We are looking for a senior Node.js and Express developer with strong background in JavaScript and Redis.
  Experience with Docker and AWS cloud deployments is preferred.
  Domain: SaaS / Web Frameworks
  `;
  try {
    const match = await jobService.matchJob(testUser, jobDescription, "Senior Node.js Developer");
    console.log("✅ Job Match Engine Succeeded!");
    console.log(`Match Score: ${match.match_score}%`);
    console.log(`Hiring Readiness: ${match.hiring_readiness}`);
    console.log("Strengths:", match.strengths);
    console.log("Gaps:", match.gaps);
  } catch (error) {
    console.error("❌ Job Match Engine Failed:", error);
  }

  console.log("\n--------------------------------------------------\n");

  // 4. Test Feature 4: Candidate Ranking (Recruiter Command Center)
  console.log("=== Feature 4: Candidate Ranking (Recruiter Command Center) ===");
  try {
    // 4.1 Create a Campaign
    const campaign = await rankingService.createCampaign(
      "Backend Core Team Campaign",
      "Core Library Developer",
      "Expert in building HTTP libraries, frameworks, routing, and open source development. Required skills: JavaScript, Go, Express, Git."
    );
    console.log(`✅ Campaign created: "${campaign.title}" (ID: ${campaign.id})`);

    // 4.2 Add Candidates
    await rankingService.addCandidate(campaign.id, "tj");
    await rankingService.addCandidate(campaign.id, "torvalds");
    console.log("✅ Candidates 'tj' and 'torvalds' added to campaign");

    // 4.3 Trigger Ranking
    const rankedCampaign = await rankingService.rankCampaign(campaign.id);
    console.log("✅ Ranking Succeeded!");
    console.log("Leaderboard:");
    rankedCampaign.candidates.forEach(cand => {
      console.log(`Rank #${cand.rank_position}: ${cand.username} - Composite Score: ${cand.composite_score}% (Match: ${cand.job_match_score}%, Tech: ${cand.tech_fit_score}%, Quality: ${cand.repo_quality_score}%, OS: ${cand.open_source_score}%, Activity: ${cand.activity_score}%, Growth: ${cand.growth_score}%)`);
    });
  } catch (error) {
    console.error("❌ Candidate Ranking Failed:", error);
  }

  console.log("\n🎉 TEST RUN COMPLETE!");
  process.exit(0);
}

main();
