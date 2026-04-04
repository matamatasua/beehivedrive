# BeehiveDrive - Utah Driver's License Test Prep App

## Vision
An AI-powered, gamified learning app that helps people pass both Utah driver's license exams — not by memorizing answers, but by truly understanding Utah driving laws. Built for your daughter, architected for the market.

## The Problem
- Utah's written knowledge test has a ~200 question pool; each test randomly draws 50 questions
- Static study guides don't work — they're passive reading, which research shows is the least effective learning method
- The test is slightly different every time, so memorizing one set of answers fails
- Questions use confusing phrasing (double negatives, close-but-wrong answers, scenario-based)
- Most competitor apps are 80% generic national content with a "Utah" label

## The Two Tests

### Written Knowledge Test (at DLD office)
- **Original/Learner:** 50 questions, closed-book, 80% to pass (40/50)
- **Renewal/Transfer:** 25 questions, open-book, 80% to pass (20/25)
- **Fee covers 3 attempts** within one year
- Computer-based touchscreen at DLD offices
- Questions drawn from rotating pool of ~200+ questions

### Traffic Safety & Trends Exam (online)
- **40 questions** (4 sections of 10)
- **100% required** — must get every question right
- Open-book, video-based
- Unlimited attempts
- Required for anyone getting an original Utah license
- Focuses on the "Fatal Five": Speeding, Distracted Driving, Impaired Driving, Seatbelt Use, Aggressive Driving

## Target Audience
1. **Primary:** Teens (15-17) getting learner permits / first licenses
2. **Secondary:** Adults getting first Utah license (new residents, immigrants, never-licensed)
3. **Tertiary:** License renewals (expired 6+ months), out-of-state transfers

## Utah-Specific Laws (Key Differentiators)
- **0.05% BAC** — lowest in the US (everyone else is 0.08%)
- **Impairment begins at 0.02%** — test trap: legal limit ≠ impairment threshold
- **Hands-free phone law** (since May 2022) — primary offense
- **80 mph speed limits** on some rural interstates
- **Move-over law** — includes disabled vehicles with hazards
- **No-fault insurance** with mandatory PIP ($3,000)
- **Insurance minimums: 25/65/15**
- **Roundabouts everywhere** — UDOT is a national leader
- **Canyon traction requirements (R2)** — Little Cottonwood Canyon, etc.
- **GDL restrictions** — 40 hours supervised (10 at night), 6-month holding period
- **School zone: 20 mph** — 1 mph over = instant fail on driving skills test
- **Child restraint:** Under 8 must be in car seat/booster unless 57" tall

## Common Failure Areas (Priority Content)
1. **Right-of-Way rules** — #1 failure reason
2. **Road Sign Recognition** — #2 failure reason
3. **"The Numbers"** — specific distances, speeds, percentages:
   - 15-50 feet: stop before railroad tracks
   - 500 feet: dim high beams for oncoming
   - 300 feet: dim high beams when following
   - 1,000 feet: headlights required (visibility)
   - 3 seconds: minimum following distance
   - 15 feet: distance from fire hydrant
   - 0.02%: impairment begins
   - 0.05%: Utah legal BAC limit
   - 25/65/15: insurance minimums
   - 20 mph: school zone speed
4. **DUI/BAC specifics** — the 0.02% vs 0.05% trap
5. **Pavement markings** — solid white vs double solid white vs broken yellow
6. **Following distance rules** by condition
7. **School zone and work zone rules** — fine doubling
8. **Parking distances**
9. **Railroad crossing rules**
10. **Headlight usage requirements**

## Driving Skills Test Auto-Fail Triggers (Track 3 content)
| Failure | The Mistake | Teaching Opportunity |
|---------|-------------|---------------------|
| Rolling stops | Not feeling the "set" of the car | Full 1-2 second count |
| Striking objects | Hitting cone/curb | Spatial awareness for parallel parking, 3-point turn |
| Incomplete observation | Not checking blind spots | Mirror + head check sequence |
| Examiner intervention | Failing to yield | Pedestrian/vehicle awareness |
| School zones | Going 21 in a 20 mph zone | Utah examiners are strict: even 1 mph over = fail |

---

## Product Architecture

### Onboarding Flow
1. "What are you preparing for?" (Permit / Transfer / Renewal)
2. License journey checklist (full sequence to getting licensed)
3. Diagnostic quiz (20 questions across all categories to assess baseline)
4. Personalized study plan based on results

### Track 1: Written Knowledge Test
- Study Mode (spaced repetition via Leitner boxes, adaptive difficulty)
  - Road Signs & Signals
  - Right-of-Way
  - Speed & Speed Limits
  - DUI & Impaired Driving (0.02% vs 0.05% distinction)
  - Insurance & Financial (25/65/15 + PIP)
  - Parking Rules
  - Sharing the Road
  - Equipment & Maintenance
  - GDL Restrictions (teens)
  - Winter/Adverse Conditions
  - Utah-Specific Laws
  - Pavement Markings
- Practice Test (25 or 50 questions, randomized from pool)
- Timed Simulation (30 questions / 30 min, mirrors DLD practice test)
- Weak Areas Focus (auto-generated from error analytics)
- Readiness Score ("You're 92% likely to pass")
- Numbers Gauntlet (dedicated numerical facts mode)

### Track 2: Traffic Safety & Trends (100% required)
- Fatal Five Learning Modules:
  1. Speeding
  2. Distracted Driving
  3. Impaired Driving
  4. Seatbelt Use
  5. Aggressive Driving
- Section Practice (4 sections x 10 questions)
- 100% Challenge Mode (one wrong = section reset)
- Save & Resume between sections
- Handbook Quick-Reference

### Track 3: Driving Skills Prep (bonus content)
- DLD Skills Test Videos (embedded/linked from dld.utah.gov/driving-test-videos/)
- Maneuver Guides (parallel parking, U-turns, hill parking)
- Auto-fail triggers and how to avoid them
- "Curb Check" diagrams with "Up-Up-Away" mnemonic
- What to expect at specific DLD offices

### Progress Dashboard
- Utah road trip map (SVG, car moves through cities as topics mastered)
- License progression (Learner Permit → Provisional → Full License)
- Readiness scores per track
- Score history graph
- Streak tracker
- Attempt counter with fee alerts
- Category mastery heatmap
- Global miss rate per question ("70% of users get this wrong")

---

## Gamification Design

### Three Currencies Only
| Currency | Purpose | Mechanic |
|----------|---------|----------|
| **XP** | Reward correct answers | 10 XP per correct, combo bonus for 3+, diminishing returns on mastered content |
| **Lives** | Stakes per session | 3 per session, lose all = session ends + review mistakes, immediate retry allowed |
| **Streaks** | Daily habit | Consecutive days (minimum 5 questions to count) |

### Utah Road Trip Navigation
- SVG map of Utah with ~8-10 stops (topic groups)
- Route: Salt Lake City → Park City → Provo → Moab → St. George → Bryce Canyon → Logan → DLD Office
- Each stop = topic cluster, car moves as topics are mastered
- Fun Utah facts at each stop
- Final destination = DLD office (final exam simulator)

### License Level Progression
| Level | Mastery | Unlocks |
|-------|---------|---------|
| Learner Permit | 0-40% | Topic-by-topic learning, basic quizzes |
| Provisional License | 40-80% | Mixed-topic practice, boss challenges, Numbers Gauntlet |
| Full License | 80-100% | Full exam simulator, speed rounds, challenge modes |

### Boss Battles (DMV Examiner Challenges)
- After each topic group: 10 hardest questions, mixed topics, 3 lives
- Characters: "Officer Easy" (intro), "Sergeant Sharp" (medium), "Chief Hardcase" (hard)
- Final boss: Full 50-question timed exam simulator

### Session Sizes
| Mode | Questions | Time | Context |
|------|-----------|------|---------|
| Quick Quiz | 10 | ~3-5 min | Between classes, waiting in line |
| Practice Round | 20 | ~8-10 min | Dedicated study |
| Exam Simulator | 50 or 40 | ~20-30 min | Final prep |
| Numbers Gauntlet | 15-20 | ~5-7 min | Targeted number drilling |

### Feedback Design (Asymmetric)
- **Correct:** Green flash, checkmark, satisfying "ding," confetti on combos (0.5-1 sec)
- **Wrong:** Gentle red flash, X icon, subtle shake → immediately show correct answer + explanation
- **Never:** crash sounds, "FAIL" text, lockout timers, anything anxiety-inducing

### Anti-Patterns (Do NOT build)
- No timers on every question (optional challenge mode only)
- No public leaderboards
- No "FAIL" language
- No XP for speed (accuracy only)
- No lockout after losing lives
- No more than 3 game currencies
- No 3-second celebration animations (keep to 0.5-1 sec)
- No rewarding easy-question farming

---

## Learning Science Engine

### Spaced Repetition (Leitner Box System)
Invisible to user, surfaced as "practice" and "review" sessions:
- **Box 1:** New/wrong questions — shown every session
- **Box 2:** Correct once — every 2 sessions
- **Box 3:** Correct twice — every 4 sessions
- **Box 4:** Correct 3x — every 8 sessions
- **Box 5 (Mastered):** Correct 4+ times — review/boss rounds only

### Confidence-Based Learning
After each answer: "Sure / Not sure / Total guess"
- Correct + Sure → long review interval (well learned)
- Correct + Guess → short interval (lucky, needs reinforcement)
- Wrong + Sure → HIGHEST PRIORITY (dangerous misconception)
- Wrong + Not sure → normal short interval

### Adaptive Difficulty
- Questions tagged with difficulty tiers (1-5)
- Start in the middle, adjust based on performance
- Each practice test uses stratified random sampling across all topic categories

### Error Tracking
- Track WHICH wrong answer was selected (not just that it was wrong)
- Category-level alerts: "You're struggling with right-of-way"
- Confusion-type tagging: double-negative, close-answer, "all of the above"
- Re-presentation schedule: same session (5-10 Qs later) → next session → 3 days later

### Numbers Gauntlet (dedicated mode)
Four mechanics combined:
1. **Slider input** — drag to the correct number (motor memory)
2. **Number matching** — drag-and-drop numbers to rules
3. **Comparison challenges** — "Which is greater?" (relational encoding)
4. **Mnemonics on wrong answers** — memorable associations for each number

### Interactive Question Types
- Standard multiple choice (4 options)
- Swipe-based "Legal or Illegal?"
- Tap-on-diagram ("Tap where you should stop")
- Drag-to-reorder (lane change steps, etc.)
- Slider-based numerical answers
- Scenario branching (text-based choose-your-adventure)
- Sign/image identification

### Question Difficulty Tiers
- **Tier 1 (Direct Knowledge):** Straight fact recall
- **Tier 2 (Applied Knowledge):** Scenario-based
- **Tier 3 (Tricky Phrasing):** Double negatives, close answers (mirrors real test)
- **Tier 4 (Edge Cases):** Combines multiple rules, unusual scenarios

---

## Question Bank Strategy

### Target: ~420 questions total
- ~300 for Written Knowledge Test (heavy on right-of-way + road signs)
- ~120 for Traffic Safety & Trends (Fatal Five focused)

### Sourcing (Legal Strategy)
- Utah Code Title 41, Chapter 6a — PUBLIC DOMAIN (actual statutes)
- Utah Driver Handbook — government publication, facts freely usable
- Write ALL questions from scratch based on these sources
- Tag each question with relevant Utah Code section
- Do NOT copy from commercial test prep sites
- AI-assisted generation with human review (daughter as QA)

### Question Metadata Schema
Each question tagged with:
- Category (signs, right-of-way, DUI, etc.)
- Difficulty tier (1-4)
- Confusion type (double-negative, close-answer, scenario, etc.)
- Utah Code reference
- Handbook chapter reference
- Global miss rate (tracked from user data)
- Mnemonic (if applicable, for numerical facts)

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 15 (App Router) | Experience (ResumeMaster), ecosystem, PWA support |
| Delivery | PWA | One codebase, offline-capable, add to home screen |
| Database | Supabase (Postgres) | Relational data, bundled auth, RLS, free tier |
| Auth | Supabase Auth | Bundled with DB, email + Google + Apple |
| AI | Claude API | Explanations, study plans, question generation, tutor |
| Hosting | Vercel | Native Next.js, git push deploys, free tier |
| Styling | Tailwind CSS | Rapid UI development, responsive |
| Animations | Framer Motion | Correct/incorrect feedback, transitions |
| Drag & Drop | dnd-kit | Number matching, reorder challenges |
| Charts | Recharts or Chart.js | Progress graphs, score history |
| Maps | Custom SVG | Utah road trip progression map |

### Monthly Cost (MVP)
- Vercel: Free tier
- Supabase: Free tier
- Claude API: ~$15-30/month
- Domain: ~$12/year
- **Total: ~$20-35/month**

---

## Database Schema

```sql
-- Question bank
questions (
  id uuid PRIMARY KEY,
  track TEXT NOT NULL, -- 'written_knowledge' | 'traffic_safety'
  category_id uuid REFERENCES categories(id),
  text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice', -- 'multiple_choice' | 'slider' | 'drag_match' | 'swipe' | 'tap_diagram' | 'reorder' | 'scenario'
  options JSONB, -- array of {text, is_correct, explanation}
  correct_answer TEXT,
  explanation TEXT, -- human-written
  ai_explanation TEXT, -- AI-generated detailed explanation
  mnemonic TEXT, -- memory aid for numerical facts
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 4),
  confusion_type TEXT, -- 'double_negative' | 'close_answer' | 'all_above' | 'scenario_distractor' | 'absolute_language' | null
  utah_code_ref TEXT, -- e.g., '41-6a-904'
  handbook_chapter TEXT,
  image_url TEXT, -- for sign identification questions
  global_miss_rate FLOAT DEFAULT 0.5,
  fatal_five_category TEXT, -- 'speeding' | 'distracted' | 'impaired' | 'seatbelt' | 'aggressive' | null
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Topic categories
categories (
  id uuid PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  track TEXT NOT NULL,
  handbook_chapter TEXT,
  map_city TEXT, -- Utah city for road trip map
  map_order INTEGER, -- order on the road trip
  icon TEXT,
  description TEXT,
  question_count INTEGER DEFAULT 0
)

-- Users
users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  display_name TEXT,
  license_type TEXT DEFAULT 'original', -- 'original' | 'renewal' | 'transfer'
  age_group TEXT, -- 'teen' | 'adult'
  xp INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_study_date DATE,
  license_level TEXT DEFAULT 'learner', -- 'learner' | 'provisional' | 'full'
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Per-question progress (Leitner box system)
user_progress (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  question_id uuid REFERENCES questions(id),
  leitner_box INTEGER DEFAULT 1 CHECK (leitner_box BETWEEN 1 AND 5),
  times_seen INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  last_confidence TEXT, -- 'sure' | 'unsure' | 'guess'
  next_review TIMESTAMPTZ,
  last_reviewed TIMESTAMPTZ,
  UNIQUE(user_id, question_id)
)

-- Study sessions
sessions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  track TEXT NOT NULL,
  session_type TEXT NOT NULL, -- 'quick_quiz' | 'practice' | 'exam_sim' | 'numbers_gauntlet' | 'boss_battle' | 'challenge_100'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_questions INTEGER,
  correct_count INTEGER,
  score_percent FLOAT,
  lives_remaining INTEGER,
  xp_earned INTEGER DEFAULT 0
)

-- Individual answers within sessions
session_answers (
  id uuid PRIMARY KEY,
  session_id uuid REFERENCES sessions(id),
  question_id uuid REFERENCES questions(id),
  selected_answer TEXT,
  is_correct BOOLEAN,
  confidence TEXT, -- 'sure' | 'unsure' | 'guess'
  time_spent_ms INTEGER,
  answered_at TIMESTAMPTZ DEFAULT NOW()
)

-- Achievements / titles
achievements (
  id uuid PRIMARY KEY,
  name TEXT NOT NULL, -- 'Road Scholar', 'Sign Sage', etc.
  description TEXT,
  icon TEXT,
  criteria JSONB -- e.g., {type: 'category_mastery', category: 'road_signs', threshold: 100}
)

user_achievements (
  user_id uuid REFERENCES users(id),
  achievement_id uuid REFERENCES achievements(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(user_id, achievement_id)
)

-- Daily challenges
daily_challenges (
  id uuid PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category_id uuid REFERENCES categories(id),
  question_count INTEGER DEFAULT 10,
  time_limit_seconds INTEGER -- null = untimed
)
```

---

## Official DLD Resources
- Utah Driver Handbook: https://dld.utah.gov/handbooks/
- Written Knowledge Test info: https://dld.utah.gov/written-knowledge-test/
- Traffic Safety & Trends Exam: https://dld.utah.gov/traffic-safety-and-trends-exam/
- Official 30-question Practice Test: https://dld.utah.gov/practice-test/
- Driving Skills Test Videos: https://dld.utah.gov/driving-test-videos/
- Online exam portal: https://secure.utah.gov/dlexams
- Utah Code Title 41-6a (Traffic Code): https://le.utah.gov/xcode/Title41/Chapter6a/41-6a.html

## License Fees
- Learner Permit: $19
- Minor License: $39
- Adult License: $52

---

## Market Assessment
- ~55,000-65,000 people/year take the Utah written test
- ~35,000-45,000 addressable digital users
- Competitors are nationally focused, generically "Utah" labeled
- Hyper-local + AI-powered + gamified = genuine differentiation
- Monetization: Free app + insurance affiliate leads (new driver → new insurance customer)
- Realistic revenue: $15K-60K/year Utah-only, scalable to other states
- Cost to run: ~$20-35/month — minimal downside to publishing

## Competitive Differentiation
1. Actually Utah-specific (not generic national content)
2. Covers BOTH tests (written + traffic safety) as integrated experience
3. AI-powered explanations and adaptive learning
4. Gamified with driving-themed progression (road trip map, license levels)
5. Numbers Gauntlet specifically targets #1 failure mode
6. 100% Challenge mode for traffic safety exam
7. Teaches test-TAKING skills alongside content (confusion-type awareness)
