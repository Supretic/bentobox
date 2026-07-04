import type { SupabaseClient } from "@supabase/supabase-js";
import { DEV_USER_ID } from "./dev-user";

export interface MealPick {
  meal: {
    id: string;
    name: string;
    recipe_text: string;
    prep_minutes: number | null;
    vibe_tags: string[];
    meal_type: string[];
    default_protein_g: number;
    default_carb_g: number;
    default_veggie_g: number;
    protein_id: string;
    carb_id: string | null;
    veggie_id: string;
  };
  proteinName: string;
  carbName: string | null;
  veggieName: string;
}

// Finds meals cookable from the current pantry (>10g of each ingredient).
// Pass `seed` for a deterministic pick (e.g. day-of-year so the home tile
// holds steady all day); omit it for a fresh random roll.
export async function pickMealFromPantry(
  supabase: SupabaseClient,
  seed?: number
): Promise<MealPick | null> {
  const { data: pantryItems } = await supabase
    .from("pantry")
    .select("item_type, item_id, remaining_g")
    .eq("user_id", DEV_USER_ID)
    .gt("remaining_g", 10);

  const ids = (t: string) =>
    (pantryItems ?? []).filter((p) => p.item_type === t).map((p) => p.item_id);
  const proteinIds = ids("protein");
  const carbIds = ids("carb");
  const veggieIds = ids("veggie");
  if (proteinIds.length === 0 || veggieIds.length === 0) return null;

  // Sample from ids only — the catalog is thousands of rows, so fetching
  // full recipes for every candidate would be wasteful.
  const { data: idRows } = await supabase
    .from("meals")
    .select("id, carb_id")
    .in("protein_id", proteinIds)
    .in("veggie_id", veggieIds)
    .order("id")
    .limit(5000);

  const candidates = (idRows ?? []).filter(
    (m) => m.carb_id === null || carbIds.includes(m.carb_id)
  );
  if (candidates.length === 0) return null;

  const idx =
    seed === undefined
      ? Math.floor(Math.random() * candidates.length)
      : seed % candidates.length;

  const { data: meal } = await supabase
    .from("meals")
    .select(
      `id, name, recipe_text, prep_minutes, vibe_tags, meal_type,
       default_protein_g, default_carb_g, default_veggie_g,
       protein_id, carb_id, veggie_id`
    )
    .eq("id", candidates[idx].id)
    .single();
  if (!meal) return null;

  const itemIds = [meal.protein_id, meal.carb_id, meal.veggie_id].filter(Boolean);
  const [p, c, v] = await Promise.all([
    supabase.from("proteins").select("id, name").in("id", itemIds),
    supabase.from("carbs").select("id, name").in("id", itemIds),
    supabase.from("veggies").select("id, name").in("id", itemIds),
  ]);
  const nameMap = new Map<string, string>();
  for (const row of [...(p.data ?? []), ...(c.data ?? []), ...(v.data ?? [])]) {
    nameMap.set(row.id, row.name);
  }

  return {
    meal,
    proteinName: nameMap.get(meal.protein_id) ?? "Protein",
    carbName: meal.carb_id ? nameMap.get(meal.carb_id) ?? "Carb" : null,
    veggieName: nameMap.get(meal.veggie_id) ?? "Veggie",
  };
}
