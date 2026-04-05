/**
 * BeehiveDrive Database Seed Script
 *
 * Inserts all 11 categories and 150 questions into Supabase.
 * Idempotent — safe to re-run thanks to upsert on unique constraints.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

// ---------------------------------------------------------------------------
// 1. Load environment variables from .env.local
// ---------------------------------------------------------------------------

function loadEnv(): Record<string, string> {
  const envPath = resolve(__dirname, "..", ".env.local");
  let content: string;
  try {
    content = readFileSync(envPath, "utf-8");
  } catch {
    console.error(`ERROR: Could not read ${envPath}`);
    console.error("Copy .env.local.example to .env.local and fill in your Supabase credentials.");
    process.exit(1);
  }
  const vars: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    vars[key] = value;
  }
  return vars;
}

const env = loadEnv();
const SUPABASE_URL = env["NEXT_PUBLIC_SUPABASE_URL"];
// Prefer service role key for seeding (bypasses RLS), fall back to anon key
const SUPABASE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"] || env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) must be set in .env.local");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Supabase client
// ---------------------------------------------------------------------------

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------------------------------------------------------------------------
// 3. Deterministic UUID from a string (so re-runs produce the same IDs)
// ---------------------------------------------------------------------------

function deterministicUUID(namespace: string, value: string): string {
  const hash = createHash("sha256").update(`${namespace}:${value}`).digest("hex");
  // Format as UUID v4-like (set version nibble to 4, variant to 8-b)
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    ((parseInt(hash[16], 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join("-");
}

// ---------------------------------------------------------------------------
// 4. Category definitions
// ---------------------------------------------------------------------------

interface CategorySeed {
  id: string;
  slug: string;
  name: string;
  track: string;
  map_city: string | null;
  map_order: number;
  icon: string;
  handbook_chapter: string | null;
  description: string | null;
  question_count: number;
}

const CATEGORIES: CategorySeed[] = [
  { slug: "road_signs", name: "Road Signs", track: "written_knowledge", map_city: "Salt Lake City", map_order: 1, icon: "🪧", handbook_chapter: "Signs, Signals & Markings", description: "Identify and understand Utah road signs", question_count: 0 },
  { slug: "traffic_signals", name: "Traffic Signals", track: "written_knowledge", map_city: "Park City", map_order: 2, icon: "🚦", handbook_chapter: "Signs, Signals & Markings", description: "Traffic lights, arrows, and signal rules", question_count: 0 },
  { slug: "right_of_way", name: "Right-of-Way", track: "written_knowledge", map_city: "Provo", map_order: 3, icon: "🔀", handbook_chapter: "Right-of-Way", description: "Who goes first at intersections, crosswalks, and more", question_count: 0 },
  { slug: "speed_limits", name: "Speed Limits", track: "written_knowledge", map_city: "Moab", map_order: 4, icon: "⚡", handbook_chapter: "Speed Limits", description: "Utah speed limits, basic speed law, and penalties", question_count: 0 },
  { slug: "dui_laws", name: "DUI & Impaired Driving", track: "written_knowledge", map_city: "St. George", map_order: 5, icon: "🚫", handbook_chapter: "Driving Under the Influence", description: "BAC limits, implied consent, and DUI consequences", question_count: 0 },
  { slug: "parking_rules", name: "Parking Rules", track: "written_knowledge", map_city: "Bryce Canyon", map_order: 6, icon: "🅿️", handbook_chapter: "Parking", description: "Legal parking, hill parking, and restricted zones", question_count: 0 },
  { slug: "sharing_road", name: "Sharing the Road", track: "written_knowledge", map_city: "Logan", map_order: 7, icon: "🤝", handbook_chapter: "Sharing the Road", description: "Pedestrians, cyclists, motorcycles, and large vehicles", question_count: 0 },
  { slug: "adverse_conditions", name: "Adverse Conditions", track: "written_knowledge", map_city: "Ogden", map_order: 8, icon: "❄️", handbook_chapter: "Adverse Conditions", description: "Driving in rain, snow, fog, and night conditions", question_count: 0 },
  { slug: "insurance_equipment", name: "Insurance & Equipment", track: "written_knowledge", map_city: "Cedar City", map_order: 9, icon: "📋", handbook_chapter: "Insurance & Vehicle Equipment", description: "Required insurance, vehicle equipment, and safety checks", question_count: 0 },
  { slug: "gdl_restrictions", name: "GDL Restrictions", track: "written_knowledge", map_city: null, map_order: 10, icon: "🔑", handbook_chapter: "Graduated Driver License", description: "Teen driving restrictions, permit rules, and supervised hours", question_count: 0 },
  { slug: "utah_specific", name: "Utah-Specific Laws", track: "written_knowledge", map_city: null, map_order: 11, icon: "🐝", handbook_chapter: "Utah-Specific Laws", description: "Move over law, headlight rules, and other Utah-specific regulations", question_count: 0 },
].map((c) => ({
  ...c,
  id: deterministicUUID("category", c.slug),
}));

// Lookup: slug -> category UUID
const categoryIdBySlug: Record<string, string> = {};
for (const cat of CATEGORIES) {
  categoryIdBySlug[cat.slug] = cat.id;
}

// ---------------------------------------------------------------------------
// 5. Import questions dynamically (the file uses TypeScript path aliases)
// ---------------------------------------------------------------------------

// We need to import the sample questions. Since the file uses @/ path aliases
// which tsx doesn't resolve by default, we'll register the path alias first.

async function loadQuestions(): Promise<any[]> {
  const questionsPath = resolve(__dirname, "..", "src", "lib", "sample-questions.ts");

  try {
    // Convert to file:// URL for Windows compatibility
    const fileUrl = "file:///" + questionsPath.replace(/\\/g, "/");
    const mod = await import(fileUrl);
    return mod.SAMPLE_QUESTIONS;
  } catch (e1) {
    try {
      // Fallback: try direct path (works on Unix)
      const mod = await import(questionsPath);
      return mod.SAMPLE_QUESTIONS;
    } catch (e2) {
      console.error("Failed to import sample-questions.ts:", e2);
      process.exit(1);
    }
  }
}

// ---------------------------------------------------------------------------
// 6. Transform a Question from the TS type to the DB row shape
// ---------------------------------------------------------------------------

interface QuestionRow {
  id: string;
  track: string;
  category_id: string;
  text: string;
  question_type: string;
  options: any;
  correct_answer: string;
  explanation: string;
  ai_explanation: string | null;
  mnemonic: string | null;
  difficulty: number;
  confusion_type: string | null;
  utah_code_ref: string | null;
  handbook_chapter: string | null;
  image_url: string | null;
  global_miss_rate: number;
  fatal_five_category: string | null;
  slider_min: number | null;
  slider_max: number | null;
  slider_correct_value: number | null;
  slider_unit: string | null;
}

function toQuestionRow(q: any): QuestionRow {
  const catId = categoryIdBySlug[q.categoryId];
  if (!catId) {
    throw new Error(`Unknown category slug "${q.categoryId}" for question "${q.id}"`);
  }
  return {
    id: deterministicUUID("question", q.id),
    track: q.track,
    category_id: catId,
    text: q.text,
    question_type: q.questionType,
    options: q.options, // JSONB — Supabase JS client serialises automatically
    correct_answer: q.correctAnswer,
    explanation: q.explanation,
    ai_explanation: q.aiExplanation ?? null,
    mnemonic: q.mnemonic ?? null,
    difficulty: q.difficulty,
    confusion_type: q.confusionType ?? null,
    utah_code_ref: q.utahCodeRef ?? null,
    handbook_chapter: q.handbookChapter ?? null,
    image_url: q.imageUrl ?? null,
    global_miss_rate: q.globalMissRate ?? 0.5,
    fatal_five_category: q.fatalFiveCategory ?? null,
    slider_min: q.sliderMin ?? null,
    slider_max: q.sliderMax ?? null,
    slider_correct_value: q.sliderCorrectValue ?? null,
    slider_unit: q.sliderUnit ?? null,
  };
}

// ---------------------------------------------------------------------------
// 7. Seed functions
// ---------------------------------------------------------------------------

async function seedCategories(): Promise<number> {
  console.log("\n--- Seeding categories ---");

  const { data, error } = await supabase
    .from("categories")
    .upsert(CATEGORIES, { onConflict: "slug" })
    .select("id");

  if (error) {
    throw new Error(`Failed to upsert categories: ${error.message}`);
  }

  const count = data?.length ?? 0;
  console.log(`  Upserted ${count} categories.`);
  return count;
}

async function seedQuestions(questions: any[]): Promise<number> {
  console.log("\n--- Seeding questions ---");

  const rows = questions.map(toQuestionRow);

  // Insert in batches of 50 to avoid payload limits
  const BATCH_SIZE = 50;
  let totalUpserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(rows.length / BATCH_SIZE);

    const { data, error } = await supabase
      .from("questions")
      .upsert(batch, { onConflict: "id" })
      .select("id");

    if (error) {
      throw new Error(`Failed to upsert questions (batch ${batchNum}): ${error.message}`);
    }

    const count = data?.length ?? 0;
    totalUpserted += count;
    console.log(`  Batch ${batchNum}/${totalBatches}: upserted ${count} questions.`);
  }

  console.log(`  Total questions upserted: ${totalUpserted}`);
  return totalUpserted;
}

async function updateCategoryCounts(): Promise<void> {
  console.log("\n--- Updating category question counts ---");

  // Count questions per category and update
  for (const cat of CATEGORIES) {
    const { count, error } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("category_id", cat.id);

    if (error) {
      console.warn(`  Warning: could not count questions for ${cat.slug}: ${error.message}`);
      continue;
    }

    const { error: updateError } = await supabase
      .from("categories")
      .update({ question_count: count ?? 0 })
      .eq("id", cat.id);

    if (updateError) {
      console.warn(`  Warning: could not update count for ${cat.slug}: ${updateError.message}`);
    } else {
      console.log(`  ${cat.slug}: ${count} questions`);
    }
  }
}

// ---------------------------------------------------------------------------
// 8. Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("==============================================");
  console.log("  BeehiveDrive Database Seed");
  console.log("==============================================");
  console.log(`  Supabase URL: ${SUPABASE_URL}`);
  console.log(`  Timestamp:    ${new Date().toISOString()}`);

  // Load questions from source
  const questions = await loadQuestions();
  console.log(`\n  Loaded ${questions.length} questions from sample-questions.ts`);

  // Seed categories first (questions reference them via FK)
  const catCount = await seedCategories();

  // Seed questions
  const qCount = await seedQuestions(questions);

  // Update question_count on each category
  await updateCategoryCounts();

  // Summary
  console.log("\n==============================================");
  console.log("  Seed complete!");
  console.log(`  Categories: ${catCount}`);
  console.log(`  Questions:  ${qCount}`);
  console.log("==============================================\n");
}

main().catch((err) => {
  console.error("\nSeed failed:", err);
  process.exit(1);
});
