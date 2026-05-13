"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logMealEaten } from "./actions";

interface Meal {
  id: string;
  name: string;
  recipe_text: string;
  prep_minutes: number | null;
  vibe_tags: string[];
  meal_type: string[];
  default_protein_g: number;
  default_carb_g: number;
  default_veggie_g: number;
}

export function MealCard({
  meal,
  proteinName,
  carbName,
  veggieName,
}: {
  meal: Meal;
  proteinName: string;
  carbName: string | null;
  veggieName: string;
}) {
  const [ate, setAte] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleAte() {
    startTransition(async () => {
      const res = await logMealEaten(
        meal.id,
        meal.default_protein_g,
        meal.default_carb_g,
        meal.default_veggie_g
      );
      if (res.ok) setAte(true);
    });
  }

  function handleRegenerate() {
    router.refresh();
  }

  const ingredients = [
    `${proteinName} · ${meal.default_protein_g}g`,
    carbName ? `${carbName} · ${meal.default_carb_g}g` : null,
    `${veggieName} · ${meal.default_veggie_g}g`,
  ].filter(Boolean);

  return (
    <div className="rounded-[14px] bg-nori text-rice overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="font-mono text-[9px] tracking-[0.16em] uppercase opacity-60 mb-1">
              {meal.prep_minutes && `${meal.prep_minutes} min · `}
              {meal.meal_type.join(" / ")}
            </div>
            <h2 className="font-serif text-[26px] leading-[0.95] tracking-[-0.02em]">
              {meal.name}
            </h2>
          </div>
        </div>

        {/* Vibe tags */}
        {meal.vibe_tags.length > 0 && (
          <div className="flex gap-1.5 mt-3">
            {meal.vibe_tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[9px] tracking-[0.12em] uppercase px-2 py-0.5 rounded-full bg-rice/10"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Ingredients */}
        <div className="mt-4 space-y-1">
          {ingredients.map((ing) => (
            <div
              key={ing}
              className="font-mono text-[11px] tracking-[0.04em] text-rice/80"
            >
              {ing}
            </div>
          ))}
        </div>
      </div>

      {/* Recipe steps */}
      <div className="px-5 pb-4">
        <div className="border-t border-rice/10 pt-4">
          <div className="font-mono text-[9px] tracking-[0.16em] uppercase opacity-50 mb-3">
            steps
          </div>
          <div className="text-[12px] leading-[1.6] text-rice/80 whitespace-pre-line">
            {meal.recipe_text}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-5">
        {ate ? (
          <div className="p-3 rounded-[8px] bg-rice/10 text-center">
            <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-tare">
              logged
            </div>
            <div className="text-[12px] mt-1 text-rice/70">
              Pantry updated. Nice cook.
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleAte}
              disabled={pending}
              className="flex-1 p-3 rounded-full bg-tare text-rice font-semibold text-[12px] shadow-cook disabled:opacity-50 hover:brightness-105 transition"
            >
              {pending ? "Logging…" : "I ate this →"}
            </button>
            <button
              onClick={handleRegenerate}
              className="px-4 p-3 rounded-full bg-rice/10 text-rice text-[12px] hover:bg-rice/15 transition"
            >
              Regenerate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
