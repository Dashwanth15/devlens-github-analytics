/**
 * resumeReport.service.js - Professional PDF Resume Verification Report Generator
 *
 * Produces an executive, multi-page SaaS verification report using PDFKit:
 * - Page 1: Executive Summary, Overall Score, Metric Pills, Key Technical Strengths
 * - Page 2: Skill Verification Summary Table (3 Tiers: Verified, Not Found, Outside Scope)
 * - Page 3+: Deep Evidence Breakdown & Specific Proof per Skill
 * - Repository Evidence Index
 * - Methodology & Official Disclaimer
 * - Headers, Footers, and Dynamic Pagination on all pages
 *
 * ZERO EXTERNAL CALLS: Renders strictly from the provided completed verification result.
 */

const PDFDocument = require("pdfkit");

// Color Palette (SaaS Developer Analytics Theme)
const COLORS = {
  primary:       "#4338CA", // Deep Indigo
  primaryLight:  "#EEF2FF",
  accent:        "#6366F1",
  textDark:      "#0F172A", // Slate 900
  textBody:      "#334155", // Slate 700
  textMuted:     "#64748B", // Slate 500
  cardBg:        "#F8FAFC", // Slate 50
  cardBorder:    "#E2E8F0", // Slate 200
  cardBorderSub: "#F1F5F9",
  verified:      "#059669", // Emerald 600
  verifiedBg:    "#ECFDF5",
  verifiedBorder:"#A7F3D0",
  partial:       "#D97706", // Amber 600
  partialBg:     "#FFFBEB",
  notFound:      "#DC2626", // Red 600
  notFoundBg:    "#FEF2F2",
  notFoundBorder:"#FECACA",
  scope:         "#4F46E5", // Indigo 600
  scopeBg:       "#EEF2FF",
  scopeBorder:   "#C7D2FE",
  divider:       "#CBD5E1",
};

/**
 * Generate PDF buffer from verification result
 * @param {Object} result - Completed verification result object
 * @returns {Promise<Buffer>}
 */
const generateResumeReportPdf = (result) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 45, right: 45 },
        bufferPages: true,
        autoFirstPage: true,
      });

      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const username = result.username || "Developer";
      const candidateName = result.candidate_name || result.username || "Candidate";
      const profileUrl = `https://github.com/${username}`;
      const score = Math.round(result.verification_score ?? 0);
      const experienceYears = result.experience_years ? `${result.experience_years}y` : "N/A";
      const analysisDate = new Date().toLocaleDateString("en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      const report = result.verification_report || [];
      const verifiedItems = report.filter((r) => r.status === "verified");
      const partialItems = report.filter((r) => r.status === "partially_verified" || r.status === "limited");
      const notFoundItems = report.filter((r) => r.status === "not_found");
      const outsideScopeItems = report.filter((r) => r.status === "not_github_verifiable");
      const totalVerifiable = verifiedItems.length + partialItems.length + notFoundItems.length;

      const contentWidth = 505.28; // 595.28 - 90 margins
      const leftMargin = 45;

      // ────────────────────────────────────────────────────────────────────────
      // PAGE 1: EXECUTIVE SUMMARY
      // ────────────────────────────────────────────────────────────────────────

      // Brand Header Top Bar
      doc.rect(leftMargin, 48, contentWidth, 4).fill(COLORS.primary);

      doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.primary).text("DEVLENS", leftMargin, 62);
      doc.fontSize(8).font("Helvetica").fillColor(COLORS.textMuted).text("DEVELOPER INTELLIGENCE PLATFORM", leftMargin, 74);

      doc.fontSize(18).font("Helvetica-Bold").fillColor(COLORS.textDark).text("RESUME VERIFICATION REPORT", leftMargin, 95);
      doc.fontSize(9).font("Helvetica").fillColor(COLORS.textMuted).text("Cross-referenced technical assessment against public GitHub repository evidence.", leftMargin, 118);

      // Candidate Metadata Card
      const metaY = 138;
      doc.roundedRect(leftMargin, metaY, contentWidth, 68, 6)
        .fillAndStroke(COLORS.cardBg, COLORS.cardBorder);

      doc.fontSize(8).font("Helvetica-Bold").fillColor(COLORS.textMuted).text("CANDIDATE", leftMargin + 16, metaY + 14);
      doc.fontSize(12).font("Helvetica-Bold").fillColor(COLORS.textDark).text(candidateName, leftMargin + 16, metaY + 26);
      doc.fontSize(8).font("Helvetica").fillColor(COLORS.textMuted).text("Evaluated from resume PDF", leftMargin + 16, metaY + 42);

      doc.fontSize(8).font("Helvetica-Bold").fillColor(COLORS.textMuted).text("GITHUB PROFILE", leftMargin + 180, metaY + 14);
      doc.fontSize(11).font("Helvetica-Bold").fillColor(COLORS.accent).text(username, leftMargin + 180, metaY + 26);
      doc.fontSize(8).font("Helvetica").fillColor(COLORS.textMuted).text(profileUrl, leftMargin + 180, metaY + 42);

      doc.fontSize(8).font("Helvetica-Bold").fillColor(COLORS.textMuted).text("ANALYSIS DATE", leftMargin + 360, metaY + 14);
      doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.textDark).text(analysisDate, leftMargin + 360, metaY + 26);
      doc.fontSize(8).font("Helvetica").fillColor(COLORS.verified).text("✓ Verified Analysis", leftMargin + 360, metaY + 42);

      // Hero Score & Metric Cards
      const heroY = 220;
      const scoreCardWidth = 145;
      const metricsAreaWidth = contentWidth - scoreCardWidth - 14;

      // Score Card
      doc.roundedRect(leftMargin, heroY, scoreCardWidth, 120, 8)
        .fillAndStroke("#F0FDF4", COLORS.verifiedBorder);

      doc.fontSize(8).font("Helvetica-Bold").fillColor(COLORS.verified)
        .text("GITHUB EVIDENCE SCORE", leftMargin + 12, heroY + 16);

      doc.fontSize(42).font("Helvetica-Bold").fillColor(COLORS.textDark)
        .text(`${score}%`, leftMargin + 12, heroY + 32);

      doc.fontSize(9).font("Helvetica-Bold").fillColor(COLORS.verified)
        .text("VERIFIED", leftMargin + 12, heroY + 80);

      doc.fontSize(7.5).font("Helvetica").fillColor(COLORS.textMuted)
        .text(`Over ${totalVerifiable} verifiable skills`, leftMargin + 12, heroY + 95);

      // Metric Pills (4 Grid Boxes)
      const gridX = leftMargin + scoreCardWidth + 14;
      const colWidth = (metricsAreaWidth - 10) / 2;
      const rowHeight = 55;

      const pills = [
        { label: "GitHub Evidence Found", count: verifiedItems.length + partialItems.length, color: COLORS.verified, bg: COLORS.verifiedBg, border: COLORS.verifiedBorder },
        { label: "Evidence Not Found", count: notFoundItems.length, color: COLORS.notFound, bg: COLORS.notFoundBg, border: COLORS.notFoundBorder },
        { label: "Outside GitHub Scope", count: outsideScopeItems.length, color: COLORS.scope, bg: COLORS.scopeBg, border: COLORS.scopeBorder },
        { label: "Professional Experience", count: experienceYears, color: COLORS.textDark, bg: COLORS.cardBg, border: COLORS.cardBorder },
      ];

      pills.forEach((p, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const px = gridX + col * (colWidth + 10);
        const py = heroY + row * (rowHeight + 10);

        doc.roundedRect(px, py, colWidth, rowHeight, 6)
          .fillAndStroke(p.bg, p.border);

        doc.fontSize(18).font("Helvetica-Bold").fillColor(p.color)
          .text(String(p.count), px + 12, py + 10);

        doc.fontSize(8).font("Helvetica-Bold").fillColor(COLORS.textMuted)
          .text(p.label, px + 12, py + 34, { width: colWidth - 20 });
      });

      // Scoring Note Banner
      const noteY = heroY + 130;
      doc.roundedRect(leftMargin, noteY, contentWidth, 26, 4)
        .fillAndStroke("#F8FAFC", COLORS.cardBorder);
      doc.fontSize(7.5).font("Helvetica-Oblique").fillColor(COLORS.textMuted)
        .text(
          `* Score is calculated strictly over ${totalVerifiable} GitHub-verifiable skills. ${outsideScopeItems.length} skills outside GitHub scope are excluded from scoring.`,
          leftMargin + 10, noteY + 8, { width: contentWidth - 20 }
        );

      // Key Technical Strengths
      const strengthsY = noteY + 38;
      doc.fontSize(12).font("Helvetica-Bold").fillColor(COLORS.textDark)
        .text("Key Technical Strengths", leftMargin, strengthsY);

      doc.fontSize(8).font("Helvetica").fillColor(COLORS.textMuted)
        .text("Strongest repository-verified technologies confirmed through code manifests and source files.", leftMargin, strengthsY + 16);

      // Render verified technologies as modern badges/tags
      const verifiedTechNames = verifiedItems.map((item) => item.skill);
      let tagX = leftMargin;
      let tagY = strengthsY + 32;

      verifiedTechNames.slice(0, 12).forEach((tech) => {
        const textWidth = doc.widthOfString(`✓ ${tech}`);
        const badgeW = textWidth + 16;
        if (tagX + badgeW > leftMargin + contentWidth) {
          tagX = leftMargin;
          tagY += 22;
        }

        doc.roundedRect(tagX, tagY, badgeW, 18, 4)
          .fillAndStroke(COLORS.verifiedBg, COLORS.verifiedBorder);
        doc.fontSize(8).font("Helvetica-Bold").fillColor(COLORS.verified)
          .text(`✓ ${tech}`, tagX + 8, tagY + 4);

        tagX += badgeW + 6;
      });

      // Synthesis bullet highlights (if present)
      let sy = tagY + 26;
      const strengthsList = (result.strengths && result.strengths.length > 0)
        ? result.strengths.slice(0, 3)
        : [];

      strengthsList.forEach((str) => {
        if (sy < 540) {
          doc.circle(leftMargin + 6, sy + 5, 2.5).fill(COLORS.verified);
          doc.fontSize(8).font("Helvetica").fillColor(COLORS.textBody)
            .text(str, leftMargin + 16, sy, { width: contentWidth - 20, lineGap: 1.5 });
          sy += 16;
        }
      });

      // Progressive Engine Performance Card
      if (result.diagnostics) {
        const diagY = 560;
        doc.roundedRect(leftMargin, diagY, contentWidth, 80, 6)
          .fillAndStroke(COLORS.primaryLight, COLORS.scopeBorder);

        doc.fontSize(9).font("Helvetica-Bold").fillColor(COLORS.primary)
          .text("⚡ Progressive Repository Evidence Engine", leftMargin + 14, diagY + 12);

        doc.fontSize(8).font("Helvetica").fillColor(COLORS.textBody)
          .text(
            `Deep progressive scan inspected ${result.diagnostics.repositoriesInspected} repositories, analyzing Linguist languages, recursive Git Trees, package manifests, and project documentation. ` +
            `${result.diagnostics.skillsVerifiedEarly} skills were verified early under the DevLens "Once Verified, Always Verified" protocol in ${result.diagnostics.totalAnalysisMs}ms.`,
            leftMargin + 14, diagY + 28, { width: contentWidth - 28, lineGap: 2 }
          );

        doc.fontSize(7.5).font("Helvetica-Bold").fillColor(COLORS.primary)
          .text(`Repositories Fetched: ${result.diagnostics.repositoriesFetched}  |  Inspected: ${result.diagnostics.repositoriesInspected}  |  Git Trees: ${result.diagnostics.gitTreeCalls}  |  Manifests: ${result.diagnostics.manifestFetches}  |  Duration: ${(result.diagnostics.totalAnalysisMs / 1000).toFixed(1)}s`, leftMargin + 14, diagY + 60);
      }

      // Executive Summary Footer Note
      doc.fontSize(7.5).font("Helvetica").fillColor(COLORS.textMuted)
        .text("Prepared automatically by DevLens Developer Intelligence Platform. Full skill-by-skill proof continues on Page 2.", leftMargin, 740, { align: "center", width: contentWidth });

      // ────────────────────────────────────────────────────────────────────────
      // PAGE 2: SKILL VERIFICATION SUMMARY TABLE
      // ────────────────────────────────────────────────────────────────────────
      doc.addPage();

      doc.rect(leftMargin, 48, contentWidth, 3).fill(COLORS.primary);
      doc.fontSize(14).font("Helvetica-Bold").fillColor(COLORS.textDark)
        .text("Skill Verification Summary", leftMargin, 60);
      doc.fontSize(8.5).font("Helvetica").fillColor(COLORS.textMuted)
        .text("All claimed skills classified across DevLens 3-Tier Verification Taxonomy.", leftMargin, 78);

      // Table Header
      const tableTop = 100;
      doc.rect(leftMargin, tableTop, contentWidth, 22).fill(COLORS.textDark);

      doc.fontSize(8).font("Helvetica-Bold").fillColor("#FFFFFF");
      doc.text("SKILL", leftMargin + 10, tableTop + 7, { width: 110 });
      doc.text("CATEGORY", leftMargin + 125, tableTop + 7, { width: 95 });
      doc.text("STATUS", leftMargin + 225, tableTop + 7, { width: 110 });
      doc.text("CONFIDENCE", leftMargin + 340, tableTop + 7, { width: 60, align: "right" });
      doc.text("EVIDENCE", leftMargin + 415, tableTop + 7, { width: 85 });

      let currentY = tableTop + 22;
      const rowHeightTable = 20;

      // Group skills: Verified first, then Not Found, then Outside Scope
      const sortedTableSkills = [
        ...verifiedItems,
        ...partialItems,
        ...notFoundItems,
        ...outsideScopeItems,
      ];

      sortedTableSkills.forEach((item, index) => {
        // Page break if table reaches bottom margin
        if (currentY > 740) {
          doc.addPage();
          doc.rect(leftMargin, 48, contentWidth, 3).fill(COLORS.primary);
          doc.fontSize(12).font("Helvetica-Bold").fillColor(COLORS.textDark)
            .text("Skill Verification Summary (Continued)", leftMargin, 60);

          currentY = 85;
          doc.rect(leftMargin, currentY, contentWidth, 20).fill(COLORS.textDark);
          doc.fontSize(8).font("Helvetica-Bold").fillColor("#FFFFFF");
          doc.text("SKILL", leftMargin + 10, currentY + 6, { width: 110 });
          doc.text("CATEGORY", leftMargin + 125, currentY + 6, { width: 95 });
          doc.text("STATUS", leftMargin + 225, currentY + 6, { width: 110 });
          doc.text("CONFIDENCE", leftMargin + 340, currentY + 6, { width: 60, align: "right" });
          doc.text("EVIDENCE", leftMargin + 415, currentY + 6, { width: 85 });
          currentY += 20;
        }

        const isEven = index % 2 === 0;
        if (isEven) {
          doc.rect(leftMargin, currentY, contentWidth, rowHeightTable).fill(COLORS.cardBg);
        }

        // Skill Name
        doc.fontSize(8).font("Helvetica-Bold").fillColor(COLORS.textDark)
          .text(item.skill, leftMargin + 10, currentY + 5, { width: 110, lineBreak: false });

        // Category
        doc.fontSize(7.5).font("Helvetica").fillColor(COLORS.textMuted)
          .text(item.category || "General", leftMargin + 125, currentY + 5, { width: 95, lineBreak: false });

        // Status Badge Text (Exact 3 Categories)
        let statusText = "GitHub Evidence Found";
        let statusColor = COLORS.verified;
        if (item.status === "not_found") {
          statusText = "Evidence Not Found";
          statusColor = COLORS.notFound;
        } else if (item.status === "not_github_verifiable") {
          statusText = "Outside GitHub Scope";
          statusColor = COLORS.scope;
        } else if (item.status === "partially_verified") {
          statusText = "GitHub Evidence Found";
          statusColor = COLORS.partial;
        }

        doc.fontSize(7.5).font("Helvetica-Bold").fillColor(statusColor)
          .text(statusText, leftMargin + 225, currentY + 5, { width: 110, lineBreak: false });

        // Confidence
        const confText = (item.status === "not_github_verifiable")
          ? "Excluded"
          : (item.confidence !== null && item.confidence !== undefined ? `${item.confidence}%` : "0%");
        doc.fontSize(8).font("Helvetica-Bold").fillColor(statusColor)
          .text(confText, leftMargin + 340, currentY + 5, { width: 60, align: "right" });

        // Evidence Summary snippet
        let evSnippet = "—";
        if (item.evidence && item.evidence.length > 0) {
          evSnippet = item.evidence[0].split("[")[0].replace("GitHub Linguist:", "Linguist:").trim();
        } else if (item.status === "not_found") {
          evSnippet = "No public GitHub evidence";
        } else if (item.status === "not_github_verifiable") {
          evSnippet = "Excluded from scoring";
        }
        doc.fontSize(7).font("Helvetica").fillColor(COLORS.textBody)
          .text(evSnippet, leftMargin + 415, currentY + 5, { width: 85, lineBreak: false });

        // Row border
        doc.rect(leftMargin, currentY + rowHeightTable, contentWidth, 0.5).fill(COLORS.cardBorder);
        currentY += rowHeightTable;
      });

      // ────────────────────────────────────────────────────────────────────────
      // PAGE 3: DETAILED REPOSITORY EVIDENCE BREAKDOWN
      // ────────────────────────────────────────────────────────────────────────
      doc.addPage();

      doc.rect(leftMargin, 48, contentWidth, 3).fill(COLORS.verified);
      doc.fontSize(14).font("Helvetica-Bold").fillColor(COLORS.textDark)
        .text("Detailed Evidence Breakdown", leftMargin, 60);
      doc.fontSize(8.5).font("Helvetica").fillColor(COLORS.textMuted)
        .text("Verified skills supported by public GitHub repository code assets.", leftMargin, 78);

      currentY = 100;

      // Group 1: Verified Skills with Full Evidence Cards
      [...verifiedItems, ...partialItems].forEach((item) => {
        // Collect supporting repositories
        const repos = (item.supporting_repos && item.supporting_repos.length > 0)
          ? item.supporting_repos
          : (item.evidence_items && item.evidence_items.length > 0
              ? [...new Set(item.evidence_items.map((e) => e.repository).filter(Boolean))]
              : (item.repo_matches || []));

        // Format evidence lines
        const evidenceLines = (item.evidence_items && item.evidence_items.length > 0)
          ? item.evidence_items.slice(0, 4).map((e) => `• ${e.detail} [${e.source || e.type}]`)
          : (item.evidence && item.evidence.length > 0
              ? item.evidence.slice(0, 4).map((line) => line.startsWith("•") ? line : `• ${line}`)
              : ["• Meaningful public repository evidence supports this resume claim."]);

        const reposHeight = repos.length > 0 ? 24 : 0;
        const cardHeight = 36 + (evidenceLines.length * 13) + reposHeight;

        if (currentY + cardHeight > 730) {
          doc.addPage();
          doc.rect(leftMargin, 48, contentWidth, 3).fill(COLORS.verified);
          doc.fontSize(12).font("Helvetica-Bold").fillColor(COLORS.textDark)
            .text("Detailed Evidence Breakdown (Continued)", leftMargin, 60);
          currentY = 85;
        }

        doc.roundedRect(leftMargin, currentY, contentWidth, cardHeight, 6)
          .fillAndStroke(COLORS.cardBg, COLORS.cardBorder);

        // Header of card
        doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.textDark)
          .text(item.skill.toUpperCase(), leftMargin + 12, currentY + 10);

        doc.fontSize(7.5).font("Helvetica").fillColor(COLORS.textMuted)
          .text(`[${item.category || "Skill"}]`, leftMargin + 140, currentY + 11);

        doc.fontSize(8.5).font("Helvetica-Bold").fillColor(COLORS.verified)
          .text(`Confidence: ${item.confidence}%  ·  ✓ GitHub Evidence Found`, leftMargin + 250, currentY + 10, { width: 240, align: "right" });

        // Evidence header & lines
        let evY = currentY + 28;
        doc.fontSize(7.5).font("Helvetica-Bold").fillColor(COLORS.textDark)
          .text("Evidence:", leftMargin + 12, evY);
        evY += 12;

        evidenceLines.forEach((line) => {
          doc.fontSize(7.5).font("Helvetica").fillColor(COLORS.textBody)
            .text(line, leftMargin + 16, evY, { width: contentWidth - 32, lineBreak: false });
          evY += 13;
        });

        // Repositories line
        if (repos.length > 0) {
          doc.fontSize(7.5).font("Helvetica-Bold").fillColor(COLORS.textDark)
            .text("Repositories: ", leftMargin + 12, evY, { continued: true });
          doc.font("Helvetica").fillColor(COLORS.accent)
            .text(repos.map((r) => `• ${r}`).join("   "), { width: contentWidth - 32 });
        }

        currentY += cardHeight + 10;
      });

      // ────────────────────────────────────────────────────────────────────────
      // EVIDENCE NOT FOUND SECTION
      // ────────────────────────────────────────────────────────────────────────
      if (notFoundItems.length > 0) {
        if (currentY > 620) {
          doc.addPage();
          currentY = 60;
        } else {
          currentY += 10;
        }

        doc.fontSize(12).font("Helvetica-Bold").fillColor(COLORS.notFound)
          .text("GITHUB EVIDENCE NOT FOUND", leftMargin, currentY);
        doc.fontSize(8).font("Helvetica").fillColor(COLORS.textMuted)
          .text("This skill can be evaluated using GitHub evidence, but sufficient public evidence was not found.", leftMargin, currentY + 15);

        currentY += 34;

        notFoundItems.forEach((item) => {
          if (currentY > 730) {
            doc.addPage();
            currentY = 60;
          }

          doc.roundedRect(leftMargin, currentY, contentWidth, 42, 4)
            .fillAndStroke(COLORS.notFoundBg, COLORS.notFoundBorder);

          doc.fontSize(9.5).font("Helvetica-Bold").fillColor(COLORS.notFound)
            .text(item.skill, leftMargin + 12, currentY + 8);

          doc.fontSize(8).font("Helvetica-Bold").fillColor(COLORS.notFound)
            .text("Confidence: 0%  ·  Evidence Not Found", leftMargin + 280, currentY + 8, { width: 210, align: "right" });

          doc.fontSize(7.5).font("Helvetica").fillColor(COLORS.textMuted)
            .text(`Reason: ${item.reasoning || "No sufficient public GitHub evidence was found across inspected repositories."}`, leftMargin + 12, currentY + 23, { width: contentWidth - 24 });

          currentY += 50;
        });
      }

      // ────────────────────────────────────────────────────────────────────────
      // OUTSIDE GITHUB SCOPE SECTION
      // ────────────────────────────────────────────────────────────────────────
      if (outsideScopeItems.length > 0) {
        if (currentY > 600) {
          doc.addPage();
          currentY = 60;
        } else {
          currentY += 10;
        }

        doc.fontSize(12).font("Helvetica-Bold").fillColor(COLORS.scope)
          .text("OUTSIDE GITHUB VERIFICATION SCOPE", leftMargin, currentY);
        doc.fontSize(8).font("Helvetica").fillColor(COLORS.textMuted)
          .text("This skill is not reliably evaluated by public GitHub repository evidence and is excluded from scoring.", leftMargin, currentY + 15);

        currentY += 34;

        outsideScopeItems.forEach((item) => {
          if (currentY > 730) {
            doc.addPage();
            currentY = 60;
          }

          doc.roundedRect(leftMargin, currentY, contentWidth, 40, 4)
            .fillAndStroke(COLORS.scopeBg, COLORS.scopeBorder);

          doc.fontSize(9).font("Helvetica-Bold").fillColor(COLORS.scope)
            .text(item.skill, leftMargin + 12, currentY + 8);

          doc.fontSize(7.5).font("Helvetica").fillColor(COLORS.textMuted)
            .text(`[${item.category || "General"}]`, leftMargin + 120, currentY + 9);

          doc.fontSize(7.5).font("Helvetica-Bold").fillColor(COLORS.scope)
            .text("Status: Excluded  ·  Confidence: Excluded", leftMargin + 250, currentY + 8, { width: 240, align: "right" });

          doc.fontSize(7).font("Helvetica").fillColor(COLORS.textBody)
            .text(`Reason: ${item.reasoning || "Not evaluated because this competency cannot be reliably certified through public code alone."}`, leftMargin + 12, currentY + 23, { width: contentWidth - 24 });

          currentY += 48;
        });
      }

      // ────────────────────────────────────────────────────────────────────────
      // REPOSITORY SUMMARY
      // ────────────────────────────────────────────────────────────────────────
      doc.addPage();

      doc.rect(leftMargin, 48, contentWidth, 3).fill(COLORS.primary);
      doc.fontSize(14).font("Helvetica-Bold").fillColor(COLORS.textDark)
        .text("Inspected Repository Evidence Index", leftMargin, 60);
      doc.fontSize(8.5).font("Helvetica").fillColor(COLORS.textMuted)
        .text("Detailed public repositories inspected during the progressive multi-layer evidence scan.", leftMargin, 78);

      currentY = 100;
      const inspectedRepos = result.repositories_analyzed || [];

      inspectedRepos.slice(0, 10).forEach((repo) => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 60;
        }

        doc.roundedRect(leftMargin, currentY, contentWidth, 52, 5)
          .fillAndStroke(COLORS.cardBg, COLORS.cardBorder);

        doc.fontSize(9.5).font("Helvetica-Bold").fillColor(COLORS.primary)
          .text(repo.name || repo.repo_name, leftMargin + 10, currentY + 8);

        const repoUrl = repo.html_url || repo.url || `https://github.com/${username}/${repo.name || repo.repo_name}`;
        doc.fontSize(7).font("Helvetica").fillColor(COLORS.textMuted)
          .text(repoUrl, leftMargin + 10, currentY + 20, { width: 280, lineBreak: false });

        doc.fontSize(7.5).font("Helvetica-Bold").fillColor(COLORS.textDark)
          .text(`Primary: ${repo.primary_language || "N/A"}${repo.stars ? `  ★ ${repo.stars}` : ""}`, leftMargin + 320, currentY + 8, { width: 170, align: "right" });

        const techList = Array.isArray(repo.detected_technologies) && repo.detected_technologies.length > 0
          ? repo.detected_technologies.join(", ")
          : "None";
        doc.fontSize(7.5).font("Helvetica-Bold").fillColor(COLORS.textDark)
          .text("Technologies Detected: ", leftMargin + 10, currentY + 34, { continued: true });
        doc.font("Helvetica").fillColor(COLORS.textBody)
          .text(techList, { width: contentWidth - 20, lineBreak: false });

        currentY += 60;
      });

      // ────────────────────────────────────────────────────────────────────────
      // METHODOLOGY & DISCLAIMER (Final Section)
      // ────────────────────────────────────────────────────────────────────────
      if (currentY > 550) {
        doc.addPage();
        currentY = 60;
      } else {
        currentY += 15;
      }

      // Methodology Box
      doc.roundedRect(leftMargin, currentY, contentWidth, 100, 6)
        .fillAndStroke("#F8FAFC", COLORS.cardBorder);

      doc.fontSize(9.5).font("Helvetica-Bold").fillColor(COLORS.textDark)
        .text("Analysis Methodology", leftMargin + 12, currentY + 10);

      doc.fontSize(7.5).font("Helvetica").fillColor(COLORS.textBody)
        .text(
          "DevLens evaluates resume claims against public GitHub evidence using a progressive 9-layer inspection hierarchy:\n" +
          "1. GitHub Linguist language detection  |  2. Repository file trees  |  3. File extensions (.jsx, .tsx, .py, .java...)\n" +
          "4. Package manifests (package.json, requirements.txt)  |  5. Dependencies & libraries  |  6. Configuration files\n" +
          "7. Repository topics  |  8. README/project documentation  |  9. Progressive evidence scanning\n\n" +
          "\"GitHub-verifiable skills are progressively analyzed across relevant public repositories. Once sufficient evidence is found for a skill, additional searching for that skill stops.\"",
          leftMargin + 12, currentY + 24, { width: contentWidth - 24, lineGap: 2.5 }
        );

      currentY += 112;

      // Official Disclaimer Box
      doc.roundedRect(leftMargin, currentY, contentWidth, 55, 6)
        .fillAndStroke(COLORS.notFoundBg, COLORS.notFoundBorder);

      doc.fontSize(8.5).font("Helvetica-Bold").fillColor(COLORS.notFound)
        .text("Important Disclaimer", leftMargin + 12, currentY + 10);

      doc.fontSize(7.5).font("Helvetica").fillColor(COLORS.textBody)
        .text(
          "DevLens evaluates publicly available GitHub evidence and does not certify professional proficiency. " +
          "A GitHub Evidence Found result indicates that repository evidence supports a resume claim; it does not independently establish professional expertise. " +
          "Skills outside GitHub verification scope are excluded from scoring rather than treated as missing.",
          leftMargin + 12, currentY + 22, { width: contentWidth - 24, lineGap: 1.5 }
        );

      // ────────────────────────────────────────────────────────────────────────
      // DYNAMIC PAGINATION, HEADERS & FOOTERS (Applied to all pages)
      // ────────────────────────────────────────────────────────────────────────
      const totalPages = doc.bufferedPageRange().count;

      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);

        // Header (pages 2+)
        if (i > 0) {
          doc.fontSize(7.5).font("Helvetica-Bold").fillColor(COLORS.textMuted)
            .text("DEVLENS · Developer Intelligence Platform", leftMargin, 30);
          doc.fontSize(7.5).font("Helvetica").fillColor(COLORS.textMuted)
            .text(`Verification Report: ${username}`, leftMargin, 30, { align: "right", width: contentWidth });
          doc.rect(leftMargin, 42, contentWidth, 0.5).fill(COLORS.cardBorder);
        }

        // Footer (all pages)
        const footerY = 800;
        doc.rect(leftMargin, footerY - 8, contentWidth, 0.5).fill(COLORS.cardBorder);
        doc.fontSize(7.5).font("Helvetica").fillColor(COLORS.textMuted)
          .text("Confidential · Generated by DevLens Developer Intelligence Platform", leftMargin, footerY);
        doc.fontSize(7.5).font("Helvetica").fillColor(COLORS.textMuted)
          .text(`Page ${i + 1} of ${totalPages}`, leftMargin, footerY, { align: "right", width: contentWidth });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateResumeReportPdf,
};
