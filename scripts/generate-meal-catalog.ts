import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anthropicKey = process.env.ANTHROPIC_API_KEY!;

if (!url || !serviceKey || !anthropicKey) {
  console.error(
    "Missing env. Need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const anthropic = new Anthropic({ apiKey: anthropicKey });

interface Catalog {
  proteins: Array<{ id: string; name: string; category: string | null }>;
  carbs: Array<{ id: string; name: string; type: string }>;
  veggies: Array<{ id: string; name: string }>;
  existing: Set<string>;
}

async function fetchCatalogs(): Promise<Catalog> {
  const [proteinsRes, carbsRes, veggiesRes, existingRes] = await Promise.all([
    supabase.from("proteins").select("id, name, category"),
    supabase.from("carbs").select("id, name, type"),
    supabase.from("veggies").select("id, name"),
    supabase.from("meals").select("protein_id, carb_id, veggie_id"),
  ]);

  const existing = new Set(
    (existingRes.data ?? []).map(
      (e: any) => `${e.protein_id}|${e.carb_id ?? "null"}|${e.veggie_id}`
    )
  );
  return {
    proteins: proteinsRes.data ?? [],
    carbs: carbsRes.data ?? [],
    veggies: veggiesRes.data ?? [],
    existing,
  };
}

interface Recipe {
  name: string;
  recipe_text: string;
  prep_minutes: number;
  vibe_tags: string[];
  meal_type: string[];
}

async function generateRecipe(
  protein: Catalog["proteins"][0],
  carb: Catalog["carbs"][0] | null,
  veggie: Catalog["veggies"][0]
): Promise<Recipe> {
  const ingredientList = [
    `${protein.name} (170g raw)`,
    carb ? `${carb.name} (75g dry)` : null,
    `${veggie.name} (150g raw)`,
  ]
    .filter(Boolean)
    .join(", ");

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 700,
    messages: [
      {
        role: "user",
        content: `You're writing one short recipe for the BentoBox app. Ingredients only:
${ingredientList}

Return ONLY valid JSON (no prose, no code fences) in this exact shape:
{
  "name": "short fun name, max 5 words",
  "recipe_text": "4-7 numbered markdown steps, mention exact gram amounts, casual voice, under 180 words",
  "prep_minutes": <integer>,
  "vibe_tags": [<1-3 of: "spicy","lazy","meal-prep","comfort","high-protein","fresh">],
  "meal_type": [<1-2 of: "breakfast","lunch","dinner">]
}

If the combo is awkward (e.g. yogurt + pasta + asparagus), still write a serviceable recipe — tag it "lazy" and keep it under 5 minutes.`,
      },
    ],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in response");
  return JSON.parse(jsonMatch[0]) as Recipe;
}

function pick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length > 0) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

const COMBOS_PER_PROTEIN = 5;

async function run() {
  const cat = await fetchCatalogs();

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const protein of cat.proteins) {
    const veggies = pick(cat.veggies, COMBOS_PER_PROTEIN);

    for (const veggie of veggies) {
      const carb = Math.random() > 0.3 ? pick(cat.carbs, 1)[0] : null;
      const key = `${protein.id}|${carb?.id ?? "null"}|${veggie.id}`;
      if (cat.existing.has(key)) {
        skipped++;
        continue;
      }

      const label = `${protein.name} + ${carb?.name ?? "no carb"} + ${veggie.name}`;
      try {
        process.stdout.write(`[${created + 1}] ${label}… `);
        const recipe = await generateRecipe(protein, carb, veggie);

        const { error } = await supabase.from("meals").insert({
          protein_id: protein.id,
          carb_id: carb?.id ?? null,
          veggie_id: veggie.id,
          name: recipe.name,
          recipe_text: recipe.recipe_text,
          prep_minutes: recipe.prep_minutes,
          vibe_tags: recipe.vibe_tags,
          meal_type: recipe.meal_type,
          default_protein_g: 170,
          default_carb_g: carb ? 75 : 0,
          default_veggie_g: 150,
        });

        if (error) {
          console.log(`insert error: ${error.message}`);
          failed++;
        } else {
          console.log("ok");
          created++;
        }

        await new Promise((r) => setTimeout(r, 300));
      } catch (e: any) {
        console.log(`error: ${e.message}`);
        failed++;
      }
    }
  }

  console.log(`\nDone. Created: ${created} | Skipped: ${skipped} | Failed: ${failed}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
