import { createSupabaseServer } from "@/lib/supabase/server";
import { pickMealFromPantry } from "@/lib/pick-meal";
import { MealCard } from "./meal-card";

export default async function MealsPage() {
  const supabase = await createSupabaseServer();
  const pick = await pickMealFromPantry(supabase);

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
            meal={pick.meal}
            proteinName={pick.proteinName}
            carbName={pick.carbName}
            veggieName={pick.veggieName}
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
