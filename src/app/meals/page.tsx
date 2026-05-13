import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MealCard } from "./meal-card";

export default async function MealsPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get pantry items with enough stock for a meal
  const { data: pantryItems } = await supabase
    .from("pantry")
    .select("item_type, item_id, remaining_g")
    .gt("remaining_g", 10);

  const pantryProteinIds = (pantryItems ?? [])
    .filter((p) => p.item_type === "protein")
    .map((p) => p.item_id);
  const pantryCarbIds = (pantryItems ?? [])
    .filter((p) => p.item_type === "carb")
    .map((p) => p.item_id);
  const pantryVeggieIds = (pantryItems ?? [])
    .filter((p) => p.item_type === "veggie")
    .map((p) => p.item_id);

  // Find meals that match what's in the pantry
  let meals: any[] = [];
  if (pantryProteinIds.length > 0 && pantryVeggieIds.length > 0) {
    const { data } = await supabase
      .from("meals")
      .select(
        `id, name, recipe_text, prep_minutes, vibe_tags, meal_type,
         default_protein_g, default_carb_g, default_veggie_g,
         protein_id, carb_id, veggie_id`
      )
      .in("protein_id", pantryProteinIds)
      .in("veggie_id", pantryVeggieIds)
      .limit(20);

    // Filter for carb match (carb_id is nullable — null means no carb needed)
    meals = (data ?? []).filter(
      (m: any) => m.carb_id === null || pantryCarbIds.includes(m.carb_id)
    );
  }

  // Fetch ingredient names for display
  const allItemIds = [
    ...new Set(
      meals.flatMap((m: any) =>
        [m.protein_id, m.carb_id, m.veggie_id].filter(Boolean)
      )
    ),
  ];

  const nameMap = new Map<string, string>();
  if (allItemIds.length > 0) {
    const [p, c, v] = await Promise.all([
      supabase.from("proteins").select("id, name").in("id", allItemIds),
      supabase.from("carbs").select("id, name").in("id", allItemIds),
      supabase.from("veggies").select("id, name").in("id", allItemIds),
    ]);
    for (const row of [...(p.data ?? []), ...(c.data ?? []), ...(v.data ?? [])]) {
      nameMap.set(row.id, row.name);
    }
  }

  // Pick a random meal to show
  const pick = meals.length > 0 ? meals[Math.floor(Math.random() * meals.length)] : null;

  return (
    <div className="min-h-screen bg-lacquer text-rice">
      <div className="mx-auto px-6 pb-12" style={{ maxWidth: 448 }}>
        <div className="pt-6 pb-4 flex items-center justify-between">
          <a
            href="/"
            className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-rice/60 hover:text-tare transition"
          >
            ← home
          </a>
          <div className="font-mono text-[10.5px] tracking-[0.12em] uppercase text-rice/60">
            meal pick
          </div>
        </div>

        <div className="mb-5">
          <h1 className="font-serif text-[38px] leading-[0.95] tracking-[-0.025em]">
            tonight's<br />
            <em className="italic text-nori">pick.</em>
          </h1>
          <p className="text-[12px] text-rice/60 mt-3 leading-[1.45]">
            {pick
              ? "Built from what's in your pantry right now."
              : "Pantry's not deep enough for a full meal yet. Add a carb or veggie."}
          </p>
        </div>

        {pick ? (
          <MealCard
            meal={pick}
            proteinName={nameMap.get(pick.protein_id) ?? "Protein"}
            carbName={pick.carb_id ? nameMap.get(pick.carb_id) ?? "Carb" : null}
            veggieName={nameMap.get(pick.veggie_id) ?? "Veggie"}
          />
        ) : (
          <div className="p-5 rounded-[14px] bg-lacquer-inner text-rice/50 text-center">
            <div className="font-serif text-[22px] mb-2">No meals available</div>
            <p className="text-[12px] leading-[1.45]">
              Log at least one protein and one veggie, then generate the meal catalog.
            </p>
            <a
              href="/log"
              className="inline-block mt-4 px-5 py-2.5 rounded-full bg-tare text-rice font-semibold text-[12px] shadow-cook hover:brightness-105 transition"
            >
              Log a grocery →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
