"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { ozToG, dollarsToCents } from "@/lib/macros";
import { revalidatePath } from "next/cache";

export interface AddPurchaseInput {
  item_type: "protein" | "carb" | "veggie";
  item_id: string;
  amount: number;
  unit: "oz" | "g";
  price_dollars: number;
  store: "Sams Club" | "Food Lion" | "Other";
  is_mvp_discounted: boolean;
  purchased_at: string;
}

export async function addPurchase(
  input: AddPurchaseInput
): Promise<{ ok?: true; totalG?: number; error?: string }> {
  if (!input.item_id) return { error: "Pick an item." };
  if (!Number.isFinite(input.amount) || input.amount <= 0)
    return { error: "Amount must be positive." };
  if (!Number.isFinite(input.price_dollars) || input.price_dollars < 0)
    return { error: "Price must be a positive number." };

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const amount_g = input.unit === "oz" ? ozToG(input.amount) : input.amount;
  const total_price_cents = dollarsToCents(input.price_dollars);

  const { error: insertError } = await supabase.from("purchases").insert({
    user_id: user.id,
    item_type: input.item_type,
    item_id: input.item_id,
    store: input.store,
    amount_g,
    total_price_cents,
    is_mvp_discounted: input.is_mvp_discounted,
    purchased_at: input.purchased_at,
  });

  if (insertError) return { error: insertError.message };

  const { data: pantryRow } = await supabase
    .from("pantry")
    .select("remaining_g")
    .eq("item_type", input.item_type)
    .eq("item_id", input.item_id)
    .maybeSingle();

  revalidatePath("/pantry");
  revalidatePath("/");

  return { ok: true, totalG: pantryRow?.remaining_g ?? amount_g };
}
