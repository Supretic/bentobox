"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { DEV_USER_ID } from "@/lib/dev-user";
import { revalidatePath } from "next/cache";

export async function logMealEaten(
  mealId: string,
  proteinG: number,
  carbG: number,
  veggieG: number
): Promise<{ ok?: true; error?: string }> {
  const supabase = await createSupabaseServer();

  const { error } = await supabase.from("meal_logs").insert({
    user_id: DEV_USER_ID,
    meal_id: mealId,
    portions: 1,
    protein_g_used: proteinG,
    carb_g_used: carbG,
    veggie_g_used: veggieG,
  });

  if (error) return { error: error.message };

  revalidatePath("/pantry");
  revalidatePath("/");

  return { ok: true };
}
