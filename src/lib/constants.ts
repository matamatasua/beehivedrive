// ============================================
// BeehiveDrive Constants
// ============================================

export const APP_NAME = "BeehiveDrive";
export const APP_TAGLINE = "Pass your Utah driver's test. For real this time.";

// --- Game Constants ---
export const MAX_LIVES = 3;
export const MIN_STREAK_QUESTIONS = 5;
export const COMBO_THRESHOLD = 3;
export const COMBO_SUPER_THRESHOLD = 5;

// --- Session Sizes ---
export const SESSION_SIZES = {
  quick_quiz: 10,
  practice: 20,
  exam_sim_written_original: 50,
  exam_sim_written_renewal: 25,
  exam_sim_traffic_safety: 40,
  numbers_gauntlet: 15,
  boss_battle: 10,
  challenge_100: 10, // per section
  diagnostic: 30,
} as const;

// --- Test Requirements ---
export const PASSING_SCORE_WRITTEN = 0.8; // 80%
export const PASSING_SCORE_TRAFFIC_SAFETY = 1.0; // 100%
export const WRITTEN_TEST_ORIGINAL_COUNT = 50;
export const WRITTEN_TEST_RENEWAL_COUNT = 25;
export const TRAFFIC_SAFETY_TOTAL = 40;
export const TRAFFIC_SAFETY_SECTIONS = 4;
export const TRAFFIC_SAFETY_PER_SECTION = 10;

// --- License Fees ---
export const LICENSE_FEES = {
  learner_permit: 19,
  minor_license: 39,
  adult_license: 52,
} as const;

// --- Utah Road Trip Map Stops ---
export const MAP_STOPS = [
  {
    city: "Salt Lake City",
    slug: "road_signs",
    x: 185,
    y: 95,
    funFact: "Home to the Utah DLD headquarters and over 200,000 registered drivers.",
  },
  {
    city: "Park City",
    slug: "traffic_signals",
    x: 220,
    y: 85,
    funFact: "Host of the Sundance Film Festival — and some seriously winding mountain roads.",
  },
  {
    city: "Provo",
    slug: "right_of_way",
    x: 190,
    y: 145,
    funFact: "Utah County has more roundabouts per capita than almost anywhere in the US.",
  },
  {
    city: "Moab",
    slug: "speed_limits",
    x: 320,
    y: 220,
    funFact: "Near Arches National Park. Some Utah interstates allow 80 mph — the highest in the nation.",
  },
  {
    city: "St. George",
    slug: "dui_laws",
    x: 80,
    y: 340,
    funFact: "Utah's 0.05% BAC limit is the lowest in the entire United States.",
  },
  {
    city: "Bryce Canyon",
    slug: "parking_rules",
    x: 145,
    y: 280,
    funFact: "Hill parking matters here — always turn your wheels the right way on steep grades!",
  },
  {
    city: "Logan",
    slug: "sharing_road",
    x: 175,
    y: 25,
    funFact: "Watch for wildlife! Northern Utah has frequent deer and elk crossings.",
  },
  {
    city: "Ogden",
    slug: "adverse_conditions",
    x: 175,
    y: 60,
    funFact: "Canyon driving in winter requires R2 traction devices. Know the rules!",
  },
  {
    city: "Cedar City",
    slug: "insurance_equipment",
    x: 95,
    y: 290,
    funFact: "Utah requires 25/65/15 minimum liability plus mandatory PIP coverage.",
  },
  {
    city: "DLD Office",
    slug: "final_exam",
    x: 185,
    y: 110,
    funFact: "You made it! Time to prove you're ready for the real thing.",
  },
] as const;

// --- Achievement Definitions ---
export const ACHIEVEMENTS = [
  {
    id: "road_scholar",
    name: "Road Scholar",
    description: "Master all road sign questions",
    icon: "🎓",
  },
  {
    id: "sign_sage",
    name: "Sign Sage",
    description: "Get 50 sign questions correct in a row",
    icon: "🪧",
  },
  {
    id: "numbers_ninja",
    name: "Numbers Ninja",
    description: "Master the Numbers Gauntlet",
    icon: "🔢",
  },
  {
    id: "bee_line",
    name: "Bee-Line Driver",
    description: "Complete a practice test with 100% accuracy",
    icon: "🐝",
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Study for 7 days in a row",
    icon: "🔥",
  },
  {
    id: "streak_30",
    name: "Monthly Master",
    description: "Study for 30 days in a row",
    icon: "⭐",
  },
  {
    id: "speed_demon",
    name: "Speed Demon",
    description: "Complete a speed round with 90%+ accuracy",
    icon: "⚡",
  },
  {
    id: "boss_slayer",
    name: "Boss Slayer",
    description: "Defeat Chief Hardcase",
    icon: "🏆",
  },
  {
    id: "ready_to_drive",
    name: "Ready to Drive",
    description: "Reach 90%+ readiness score",
    icon: "🚗",
  },
  {
    id: "perfect_safety",
    name: "Safety First",
    description: "Pass the Traffic Safety practice with 100%",
    icon: "🛡️",
  },
] as const;

// --- The Numbers (key facts people fail on) ---
export const KEY_NUMBERS = [
  { value: "15-50 feet", rule: "Stop distance before railroad tracks", mnemonic: "15 is your permit age, 50 is the test question count. Stop between them!" },
  { value: "500 feet", rule: "Dim high beams for oncoming vehicle", mnemonic: "5 fingers waving at the oncoming car — 500 feet." },
  { value: "300 feet", rule: "Dim high beams when following", mnemonic: "Following is closer than oncoming. 300 < 500." },
  { value: "1,000 feet", rule: "Headlights required when visibility is less than", mnemonic: "1,000 feet — think '1K visibility' like a 1K race you can barely see." },
  { value: "3 seconds", rule: "Minimum following distance at highway speed", mnemonic: "3 seconds: 'Only a FOOL follows too close' — fool has 4 letters, but 3 is the rule." },
  { value: "15 feet", rule: "Minimum distance from fire hydrant when parking", mnemonic: "15 — same as the permit age. Stay 15 from hydrants!" },
  { value: "0.02%", rule: "BAC level where impairment actually begins", mnemonic: "POINT-ZERO-TWO: Two sips and you're already impaired." },
  { value: "0.05%", rule: "Utah's legal BAC limit (lowest in US)", mnemonic: "Utah's POINT-ZERO-FIVE is #1 strictest. High five for safety! ✋" },
  { value: "25/65/15", rule: "Utah minimum insurance (per person/per accident/property)", mnemonic: "25-65-15: Remember '25 at 65 in 15 seconds' — fast like a car." },
  { value: "20 mph", rule: "Speed limit in school zones", mnemonic: "20 in a school zone — even 21 is an instant fail on the driving test!" },
  { value: "40 hours", rule: "Supervised driving required (10 at night) for teens", mnemonic: "40 hours — a full work week of driving practice." },
  { value: "6 months", rule: "Minimum learner permit holding period", mnemonic: "Half a year with your permit before you can test." },
  { value: "12 inches", rule: "Maximum distance from curb when parallel parking", mnemonic: "12 inches = 1 foot. Park within a foot of the curb." },
  { value: "100 feet", rule: "Signal before turning in the city", mnemonic: "100 feet in the city — think '1 football field' (roughly)." },
] as const;
