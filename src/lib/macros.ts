export const OZ_TO_G = 28.3495;

export function ozToG(oz: number): number {
  return oz * OZ_TO_G;
}

export function gToOz(g: number): number {
  return g / OZ_TO_G;
}

export function dollarsToCents(d: number): number {
  return Math.round(d * 100);
}

export function centsToDollars(c: number): number {
  return c / 100;
}

export function formatDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export interface Macros {
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
}

export function macrosForGrams(
  item: {
    kcal_per_100g?: number | null;
    protein_g_per_100g?: number | null;
    carb_g_per_100g?: number | null;
    fat_g_per_100g?: number | null;
    kcal_per_100g_dry?: number | null;
    protein_g_per_100g_dry?: number | null;
    carb_g_per_100g_dry?: number | null;
    fat_g_per_100g_dry?: number | null;
  },
  grams: number
): Macros {
  const k = item.kcal_per_100g ?? item.kcal_per_100g_dry ?? 0;
  const p = item.protein_g_per_100g ?? item.protein_g_per_100g_dry ?? 0;
  const c = item.carb_g_per_100g ?? item.carb_g_per_100g_dry ?? 0;
  const f = item.fat_g_per_100g ?? item.fat_g_per_100g_dry ?? 0;
  const factor = grams / 100;
  return {
    kcal: Math.round(k * factor),
    protein: round1(p * factor),
    carb: round1(c * factor),
    fat: round1(f * factor),
  };
}

export function sumMacros(...ms: Macros[]): Macros {
  return ms.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      protein: round1(acc.protein + m.protein),
      carb: round1(acc.carb + m.carb),
      fat: round1(acc.fat + m.fat),
    }),
    { kcal: 0, protein: 0, carb: 0, fat: 0 }
  );
}

export function centsPerGramProtein(
  totalCents: number,
  grams: number,
  proteinPer100g: number
): number {
  const totalProteinG = (grams * proteinPer100g) / 100;
  if (totalProteinG <= 0) return 0;
  return totalCents / totalProteinG;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
