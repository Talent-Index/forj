/**
 * Shared Forjora achievement language — families, tiers, skills, certificates.
 * Visual DNA stays on existing tokens / doodles / card patterns.
 */

export const ACHIEVEMENT_FAMILIES = Object.freeze({
  learning: { id: "learning", label: "Learning", doodle: "book", blurb: "Path and assessment milestones" },
  performance: { id: "performance", label: "Performance", doodle: "star", blurb: "Accuracy and consistency" },
  puzzle: { id: "puzzle", label: "Puzzle", doodle: "puzzle", blurb: "Credential puzzle progress" },
  streak: { id: "streak", label: "Streak", doodle: "fire", blurb: "Meaningful learning days" },
  skills: { id: "skills", label: "Skills", doodle: "hammer", blurb: "Demonstrated capability" },
  credential: { id: "credential", label: "Credentials", doodle: "certificate", blurb: "Records and certificates" },
});

export const TIER_LABELS = Object.freeze({
  1: "Explorer",
  2: "Builder",
  3: "Practitioner",
  4: "Specialist",
  5: "Master",
});

export const TIER_ROMAN = Object.freeze({
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
});

/** Overlay for registry rows — progressive extension without redesign. */
export const ACHIEVEMENT_META = Object.freeze({
  first: {
    family: "learning",
    doodle: "spark",
    displayName: "First Spark",
    skillLabel: "Getting started",
    requirementsCopy: ["Complete your first knowledge check"],
  },
  perfect_score: {
    family: "performance",
    doodle: "star",
    displayName: "Perfect Run",
    skillLabel: "Accuracy",
    requirementsCopy: ["Score 100% on any assessment"],
  },
  easy_complete: {
    family: "learning",
    doodle: "fire",
    displayName: "First Check",
    skillLabel: "Foundation",
    requirementsCopy: ["Finish a Foundation assessment"],
  },
  easy_master: {
    family: "learning",
    doodle: "fire",
    displayName: "Foundation Explorer",
    skillLabel: "Foundation",
    requirementsCopy: ["Perfect a Foundation assessment"],
  },
  medium_complete: {
    family: "learning",
    doodle: "blocks",
    displayName: "Builder Path",
    skillLabel: "Builder",
    requirementsCopy: ["Finish a Builder assessment"],
  },
  medium_master: {
    family: "learning",
    doodle: "blocks",
    displayName: "Builder",
    skillLabel: "Builder",
    requirementsCopy: ["Perfect a Builder assessment"],
  },
  hard_complete: {
    family: "learning",
    doodle: "hammer",
    displayName: "Advanced Path",
    skillLabel: "Advanced",
    requirementsCopy: ["Finish an Advanced assessment"],
  },
  hard_master: {
    family: "learning",
    doodle: "hammer",
    displayName: "Advanced Practitioner",
    skillLabel: "Advanced",
    requirementsCopy: ["Perfect an Advanced assessment"],
  },
  master_complete: {
    family: "learning",
    doodle: "diamond",
    displayName: "Mastery Path",
    skillLabel: "Mastery",
    requirementsCopy: ["Finish a Mastery assessment"],
  },
  master_master: {
    family: "learning",
    doodle: "diamond",
    displayName: "Mastermind",
    skillLabel: "Mastery",
    requirementsCopy: ["Perfect a Mastery assessment"],
  },
  persistent: {
    family: "performance",
    doodle: "pencil",
    displayName: "Consistent",
    skillLabel: "Practice",
    requirementsCopy: ["Complete at least 3 quiz attempts"],
  },
  avalanche_explorer: {
    family: "learning",
    doodle: "book",
    displayName: "Completionist",
    skillLabel: "Fundamentals track",
    requirementsCopy: ["Complete the Avalanche Fundamentals track"],
  },
  architecture_builder: { family: "learning", doodle: "blueprint", skillLabel: "Architecture" },
  l1_builder: { family: "skills", doodle: "mountain", skillLabel: "Avalanche L1s" },
  cchain_builder: { family: "skills", doodle: "contract", skillLabel: "C-Chain" },
  icm_builder: { family: "skills", doodle: "nodes", skillLabel: "ICM" },
  developer_builder: { family: "skills", doodle: "badge", skillLabel: "Developer path" },
  first_piece: {
    family: "puzzle",
    doodle: "puzzle",
    displayName: "First Piece",
    skillLabel: "Credential puzzle",
    requirementsCopy: ["Collect your first puzzle piece"],
  },
  puzzle_starter: {
    family: "puzzle",
    doodle: "puzzle",
    displayName: "Piece Collector",
    skillLabel: "Credential puzzle",
    requirementsCopy: ["Collect 4 of 16 puzzle pieces"],
  },
  puzzle_builder: {
    family: "puzzle",
    doodle: "puzzle",
    displayName: "Puzzle Builder",
    skillLabel: "Credential puzzle",
    requirementsCopy: ["Collect 8 of 16 puzzle pieces"],
  },
  near_completion: {
    family: "puzzle",
    doodle: "puzzle",
    displayName: "Near the Forge",
    skillLabel: "Credential puzzle",
    requirementsCopy: ["Collect 12 of 16 puzzle pieces"],
  },
  full_puzzle: {
    family: "puzzle",
    doodle: "diamond",
    displayName: "Puzzle Master",
    skillLabel: "Credential puzzle",
    requirementsCopy: ["Complete all 16 puzzle pieces"],
  },
  credential: {
    family: "credential",
    doodle: "certificate",
    displayName: "On-chain Record",
    skillLabel: "Fuji credential",
    requirementsCopy: ["Claim a soulbound credential on Fuji"],
  },
  track_complete: { family: "learning", doodle: "check", skillLabel: "Tracks" },
  path_complete: { family: "learning", doodle: "trophy", skillLabel: "Developer Path" },
  streak_3: {
    family: "streak",
    doodle: "fire",
    displayName: "Learning Spark",
    skillLabel: "Streak",
    requirementsCopy: ["Learn on 3 consecutive UTC days"],
  },
  streak_7: {
    family: "streak",
    doodle: "fire",
    displayName: "Week Builder",
    skillLabel: "Streak",
    requirementsCopy: ["Learn on 7 consecutive UTC days"],
  },
  streak_14: {
    family: "streak",
    doodle: "fire",
    displayName: "Momentum",
    skillLabel: "Streak",
    requirementsCopy: ["Learn on 14 consecutive UTC days"],
  },
  streak_30: {
    family: "streak",
    doodle: "fire",
    displayName: "Consistency",
    skillLabel: "Streak",
    requirementsCopy: ["Learn on 30 consecutive UTC days"],
  },
  streak_60: {
    family: "streak",
    doodle: "fire",
    displayName: "Discipline",
    skillLabel: "Streak",
    requirementsCopy: ["Learn on 60 consecutive UTC days"],
  },
  streak_100: {
    family: "streak",
    doodle: "fire",
    displayName: "Forjora Forge",
    skillLabel: "Streak",
    requirementsCopy: ["Learn on 100 consecutive UTC days"],
  },
  streak_180: {
    family: "streak",
    doodle: "fire",
    displayName: "Unstoppable",
    skillLabel: "Streak",
    requirementsCopy: ["Learn on 180 consecutive UTC days"],
  },
  streak_365: {
    family: "streak",
    doodle: "fire",
    displayName: "Legendary Streak",
    skillLabel: "Streak",
    requirementsCopy: ["Learn on 365 consecutive UTC days"],
  },
  halfway_hero: {
    family: "puzzle",
    doodle: "puzzle",
    displayName: "Halfway Hero",
    skillLabel: "Credential puzzle",
    requirementsCopy: ["Reach 8 of 16 pieces (same milestone as Puzzle Builder)"],
  },
  sharp_mind: {
    family: "performance",
    doodle: "star",
    displayName: "Sharp Mind",
    skillLabel: "Accuracy",
    requirementsCopy: ["Perfect Foundation and Builder assessments"],
  },
  unshaken: {
    family: "performance",
    doodle: "shield",
    displayName: "Unshaken",
    skillLabel: "Resilience",
    requirementsCopy: ["Complete Advanced without farming retries (finish Advanced once)"],
  },
  quiz_master: {
    family: "performance",
    doodle: "badge",
    displayName: "Quiz Master",
    skillLabel: "Assessments",
    requirementsCopy: ["Complete Foundation, Builder, and Advanced assessments"],
  },
});

export const STREAK_MILESTONE_BADGES = Object.freeze([
  { days: 3, id: "streak_3", name: "Learning Spark", xp: 10 },
  { days: 7, id: "streak_7", name: "Week Builder", xp: 20 },
  { days: 14, id: "streak_14", name: "Momentum", xp: 25 },
  { days: 30, id: "streak_30", name: "Consistency", xp: 40 },
  { days: 60, id: "streak_60", name: "Discipline", xp: 50 },
  { days: 100, id: "streak_100", name: "Forjora Forge", xp: 75 },
  { days: 180, id: "streak_180", name: "Unstoppable", xp: 100 },
  { days: 365, id: "streak_365", name: "Legendary Streak", xp: 150 },
]);

/**
 * Skill ladders — progressive I–V using existing progression signals.
 * Future skills can be appended without UI redesign.
 */
export const SKILL_LADDERS = Object.freeze({
  chain_navigator: {
    id: "chain_navigator",
    name: "Chain Navigator",
    skillLabel: "Avalanche networks & architecture",
    doodle: "nodes",
    tiers: [
      { tier: 1, requirement: { type: "quizCompleted", quizId: "easy" } },
      { tier: 2, requirement: { type: "trackComplete", trackId: "fundamentals" } },
      { tier: 3, requirement: { type: "trackComplete", trackId: "architecture" } },
      { tier: 4, requirement: { type: "perfectSection", sectionId: "medium" } },
      { tier: 5, requirement: { type: "pathComplete" } },
    ],
  },
  contract_crafter: {
    id: "contract_crafter",
    name: "Contract Crafter",
    skillLabel: "Smart Contract Development",
    doodle: "contract",
    tiers: [
      { tier: 1, requirement: { type: "quizCompleted", quizId: "easy" } },
      { tier: 2, requirement: { type: "quizCompleted", quizId: "medium" } },
      { tier: 3, requirement: { type: "trackComplete", trackId: "c-chain" } },
      { tier: 4, requirement: { type: "perfectSection", sectionId: "hard" } },
      { tier: 5, requirement: { type: "perfectSection", sectionId: "master" } },
    ],
  },
  dapp_builder: {
    id: "dapp_builder",
    name: "dApp Builder",
    skillLabel: "Application building",
    doodle: "blocks",
    tiers: [
      { tier: 1, requirement: { type: "quizCompleted", quizId: "medium" } },
      { tier: 2, requirement: { type: "trackComplete", trackId: "architecture" } },
      { tier: 3, requirement: { type: "trackComplete", trackId: "icm" } },
      { tier: 4, requirement: { type: "trackComplete", trackId: "developer" } },
      { tier: 5, requirement: { type: "allOf", all: [{ type: "pathComplete" }, { type: "perfectSection", sectionId: "hard" }] } },
    ],
  },
  security_sentinel: {
    id: "security_sentinel",
    name: "Security Sentinel",
    skillLabel: "Security & systems judgment",
    doodle: "shield",
    tiers: [
      { tier: 1, requirement: { type: "quizCompleted", quizId: "hard" } },
      { tier: 2, requirement: { type: "perfectSection", sectionId: "hard" } },
      { tier: 3, requirement: { type: "quizCompleted", quizId: "master" } },
      { tier: 4, requirement: { type: "perfectSection", sectionId: "master" } },
      { tier: 5, requirement: { type: "allOf", all: [{ type: "perfectSection", sectionId: "master" }, { type: "puzzleComplete" }] } },
    ],
  },
  defi_architect: {
    id: "defi_architect",
    name: "DeFi Architect",
    skillLabel: "Protocol structure",
    doodle: "blueprint",
    tiers: [
      { tier: 1, requirement: { type: "trackComplete", trackId: "architecture" } },
      { tier: 2, requirement: { type: "trackComplete", trackId: "l1s" } },
      { tier: 3, requirement: { type: "trackComplete", trackId: "icm" } },
      { tier: 4, requirement: { type: "perfectSection", sectionId: "hard" } },
      { tier: 5, requirement: { type: "pathComplete" } },
    ],
  },
  ai_builder: {
    id: "ai_builder",
    name: "AI Builder",
    skillLabel: "Builder tooling fluency",
    doodle: "spark",
    tiers: [
      { tier: 1, requirement: { type: "quizCount", min: 1 } },
      { tier: 2, requirement: { type: "attemptCount", min: 3 } },
      { tier: 3, requirement: { type: "quizCompleted", quizId: "medium" } },
      { tier: 4, requirement: { type: "trackComplete", trackId: "developer" } },
      { tier: 5, requirement: { type: "allOf", all: [{ type: "pathComplete" }, { type: "perfectQuiz" }] } },
    ],
  },
});

/**
 * Off-chain learning certificates (formal proof of path work).
 * Distinct from Fuji soulbound claimed/attested credentials.
 */
export const LEARNING_CERTIFICATES = Object.freeze([
  {
    id: "learning_cert_foundation",
    level: "Foundation",
    title: "Web3 Foundations",
    skills: ["Blockchain Fundamentals", "Avalanche Basics", "Wallet Awareness"],
    requirement: {
      type: "allOf",
      all: [
        { type: "quizCompleted", quizId: "easy" },
        { type: "trackComplete", trackId: "fundamentals" },
      ],
    },
  },
  {
    id: "learning_cert_builder",
    level: "Builder",
    title: "Web3 Development",
    skills: ["Blockchain Fundamentals", "Smart Contracts", "Ecosystem Architecture"],
    requirement: {
      type: "allOf",
      all: [
        { type: "quizCompleted", quizId: "medium" },
        { type: "trackComplete", trackId: "architecture" },
        { type: "trackComplete", trackId: "c-chain" },
      ],
    },
  },
  {
    id: "learning_cert_advanced",
    level: "Advanced",
    title: "Advanced Avalanche Practice",
    skills: ["Smart Contracts", "L1s", "ICM", "Testing"],
    requirement: {
      type: "allOf",
      all: [
        { type: "quizCompleted", quizId: "hard" },
        { type: "trackComplete", trackId: "l1s" },
        { type: "trackComplete", trackId: "icm" },
      ],
    },
  },
  {
    id: "learning_cert_specialist",
    level: "Specialist",
    title: "Avalanche Specialist",
    skills: ["dApp Development", "Deployment", "Cross-chain Messaging", "Architecture"],
    requirement: {
      type: "allOf",
      all: [
        { type: "perfectSection", sectionId: "hard" },
        { type: "trackComplete", trackId: "developer" },
      ],
    },
  },
  {
    id: "learning_cert_master",
    level: "Master",
    title: "Avalanche Mastery",
    skills: ["Security Judgment", "Systems Reasoning", "Capstone Path", "Credential Puzzle"],
    requirement: {
      type: "allOf",
      all: [
        { type: "perfectSection", sectionId: "master" },
        { type: "pathComplete" },
        { type: "puzzleComplete" },
      ],
    },
  },
]);

export const PUZZLE_MILESTONES = Object.freeze([
  { count: 1, id: "first_piece", label: "First Piece" },
  { count: 4, id: "puzzle_starter", label: "Piece Collector" },
  { count: 8, id: "puzzle_builder", label: "Puzzle Builder" },
  { count: 12, id: "near_completion", label: "Near the Forge" },
  { count: 16, id: "full_puzzle", label: "Puzzle Master" },
]);

export function enrichAchievement(item = {}) {
  const skillMatch = String(item.id || "").match(/^skill_([a-z0-9_]+)_([1-5])$/);
  let meta = ACHIEVEMENT_META[item.id] || {};
  if (skillMatch) {
    const ladder = SKILL_LADDERS[skillMatch[1]];
    const tier = Number(skillMatch[2]);
    if (ladder) {
      meta = {
        family: "skills",
        doodle: ladder.doodle,
        displayName: ladder.name,
        skillLabel: ladder.skillLabel,
        tier,
        requirementsCopy: [
          `Demonstrate ${ladder.skillLabel}`,
          `Reach tier ${TIER_ROMAN[tier]} — ${TIER_LABELS[tier]}`,
        ],
      };
    }
  }
  const familyId = meta.family || item.family || familyFromCategory(item.category);
  const family = ACHIEVEMENT_FAMILIES[familyId] || ACHIEVEMENT_FAMILIES.learning;
  const tier = meta.tier ?? item.tier ?? null;
  return {
    ...item,
    ...meta,
    family: familyId,
    familyLabel: family.label,
    doodle: meta.doodle || item.doodle || family.doodle || "badge",
    displayName: meta.displayName || item.name,
    skillLabel: meta.skillLabel || item.skillLabel || family.label,
    tier,
    tierLabel: tier ? TIER_LABELS[tier] : null,
    tierRoman: tier ? TIER_ROMAN[tier] : null,
    requirementsCopy: meta.requirementsCopy || item.requirementsCopy || [item.description].filter(Boolean),
  };
}

function familyFromCategory(category) {
  if (category === "quiz" || category === "track" || category === "path") return "learning";
  if (category === "puzzle") return "puzzle";
  if (category === "streak") return "streak";
  if (category === "credential") return "credential";
  return "learning";
}

export function groupAchievementsByFamily(items = []) {
  const groups = Object.values(ACHIEVEMENT_FAMILIES).map((family) => ({
    ...family,
    items: [],
  }));
  const byId = Object.fromEntries(groups.map((g) => [g.id, g]));
  for (const item of items) {
    const enriched = enrichAchievement(item);
    const bucket = byId[enriched.family] || byId.learning;
    bucket.items.push(enriched);
  }
  return groups.filter((g) => g.items.length > 0);
}

export function skillLadderEntries() {
  const out = [];
  for (const ladder of Object.values(SKILL_LADDERS)) {
    for (const step of ladder.tiers) {
      const id = `skill_${ladder.id}_${step.tier}`;
      out.push({
        id,
        name: `${ladder.name} ${TIER_ROMAN[step.tier]}`,
        description: `${ladder.skillLabel} — Level ${TIER_ROMAN[step.tier]} (${TIER_LABELS[step.tier]})`,
        category: "skills",
        family: "skills",
        hidden: false,
        badge: ladder.id,
        doodle: ladder.doodle,
        skillId: ladder.id,
        skillLabel: ladder.skillLabel,
        tier: step.tier,
        displayName: ladder.name,
        reward: { xp: 8 + step.tier * 4 },
        requirement: step.requirement,
        requirementsCopy: [
          `Reach ${TIER_LABELS[step.tier]} on ${ladder.name}`,
          ladder.skillLabel,
        ],
      });
    }
  }
  return out;
}

export function streakRegistryEntries() {
  return STREAK_MILESTONE_BADGES.map((row) => ({
    id: row.id,
    name: row.name,
    description: `Learn on ${row.days} consecutive UTC days`,
    category: "streak",
    family: "streak",
    hidden: row.days >= 100,
    badge: `streak-${row.days}`,
    doodle: "fire",
    reward: { xp: row.xp },
    requirement: { type: "streak", min: row.days },
    requirementsCopy: [`Learn on ${row.days} consecutive UTC days`],
  }));
}

export function nextStreakMilestone(current = 0) {
  const next = STREAK_MILESTONE_BADGES.find((row) => current < row.days);
  return next || null;
}

export function formatIssuedMonth(timestamp = Date.now()) {
  try {
    return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
      new Date(timestamp)
    );
  } catch {
    return "—";
  }
}

export function learningCredentialId(level, learnerKey = "LOCAL") {
  const seed = String(learnerKey).replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase() || "LOCAL";
  const tag = String(level || "FORJ").slice(0, 3).toUpperCase();
  return `FORJ-${tag}${seed}`.slice(0, 14);
}
