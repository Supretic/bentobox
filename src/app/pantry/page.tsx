import { createSupabaseServer } from "@/lib/supabase/server";
import { DEV_USER_ID } from "@/lib/dev-user";
import { centsPerGramProtein, gToOz, formatDollars } from "@/lib/macros";

export default async function PantryPage() {
  const supabase = await createSupabaseServer();

  // Fetch pantry items with their catalog info and price data
  const { data: pantryItems } = await supabase
    .from("pantry")
    .select("item_type, item_id, remaining_g, last_purchase_date")
    .eq("user_id", DEV_USER_ID)
    .order("last_purchase_date", { ascending: false });

  // Fetch catalog data for name lookups
  const [proteinsRes, carbsRes, veggiesRes, pricesRes] = await Promise.all([
    supabase.from("proteins").select("id, name, protein_g_per_100g"),
    supabase.from("carbs").select("id, name, protein_g_per_100g_dry"),
    supabase.from("veggies").select("id, name, protein_g_per_100g"),
    supabase.from("price_per_g").select("*").eq("user_id", DEV_USER_ID),
  ]);

  const catalogMap = new Map<string, { name: string; proteinPer100g: number }>();
  for (const p of proteinsRes.data ?? []) {
    catalogMap.set(p.id, { name: p.name, proteinPer100g: p.protein_g_per_100g });
  }
  for (const c of carbsRes.data ?? []) {
    catalogMap.set(c.id, { name: c.name, proteinPer100g: c.protein_g_per_100g_dry });
  }
  for (const v of veggiesRes.data ?? []) {
    catalogMap.set(v.id, { name: v.name, proteinPer100g: v.protein_g_per_100g });
  }

  const priceMap = new Map<string, number>();
  for (const p of pricesRes.data ?? []) {
    priceMap.set(p.item_id, p.cents_per_g);
  }

  const items = (pantryItems ?? []).map((row) => {
    const catalog = catalogMap.get(row.item_id);
    const centsPerG = priceMap.get(row.item_id);
    const daysSincePurchase = row.last_purchase_date
      ? Math.floor(
          (Date.now() - new Date(row.last_purchase_date).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    return {
      ...row,
      name: catalog?.name ?? "Unknown",
      proteinPer100g: catalog?.proteinPer100g ?? 0,
      centsPerG: centsPerG ?? null,
      daysSincePurchase,
    };
  });

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
            02 · pantry
          </div>
        </div>

        <div className="mb-5">
          <h1 className="font-serif text-[38px] leading-[0.95] tracking-[-0.025em]">
            your<br />
            <em className="italic text-salmon">pantry.</em>
          </h1>
          <p className="text-[12px] text-rice/60 mt-3 leading-[1.45]">
            {items.length > 0
              ? `${items.length} items in stock. Sorted by most recent.`
              : "Nothing's in the fridge. Time to shop."}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="p-5 rounded-[14px] bg-lacquer-inner text-rice/50 text-center">
            <div className="font-serif text-[22px] mb-2">Empty</div>
            <p className="text-[12px] leading-[1.45]">
              Log a grocery to see it here.
            </p>
            <a
              href="/log"
              className="inline-block mt-4 px-5 py-2.5 rounded-full bg-tare text-rice font-semibold text-[12px] shadow-cook hover:brightness-105 transition"
            >
              Log a grocery →
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={`${item.item_type}-${item.item_id}`}
                className="p-4 rounded-[10px] bg-lacquer-inner flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        item.item_type === "protein"
                          ? "bg-salmon"
                          : item.item_type === "carb"
                          ? "bg-tamago"
                          : "bg-nori"
                      }`}
                    />
                    <span className="text-[13px] font-medium truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] tracking-[0.08em] text-rice/50 mt-1 ml-4">
                    {item.remaining_g.toFixed(0)}g (~{gToOz(item.remaining_g).toFixed(1)} oz)
                    {item.daysSincePurchase !== null &&
                      ` · ${item.daysSincePurchase}d ago`}
                  </div>
                </div>
                {item.centsPerG !== null && (
                  <div className="font-mono text-[11px] text-tare ml-3">
                    {item.centsPerG.toFixed(2)}¢/g
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
