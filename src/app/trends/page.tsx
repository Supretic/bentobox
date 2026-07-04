import { createSupabaseServer } from "@/lib/supabase/server";
import { DEV_USER_ID } from "@/lib/dev-user";
import { Sparkline } from "@/components/Sparkline";

export default async function TrendsPage() {
  const supabase = await createSupabaseServer();

  // Fetch all protein price data for this user
  const { data: priceData } = await supabase
    .from("price_per_g")
    .select("*")
    .eq("user_id", DEV_USER_ID)
    .eq("item_type", "protein");

  // Fetch protein names
  const { data: proteins } = await supabase
    .from("proteins")
    .select("id, name, protein_g_per_100g");

  const proteinMap = new Map<string, { name: string; proteinPer100g: number }>();
  for (const p of proteins ?? []) {
    proteinMap.set(p.id, { name: p.name, proteinPer100g: p.protein_g_per_100g });
  }

  const items = (priceData ?? []).map((row) => {
    const protein = proteinMap.get(row.item_id);
    const centsPerGProtein =
      protein && protein.proteinPer100g > 0
        ? (row.cents_per_g / protein.proteinPer100g) * 100
        : null;

    return {
      itemId: row.item_id,
      name: protein?.name ?? "Unknown",
      centsPerG: row.cents_per_g,
      centsPerGProtein,
      purchaseCount: row.purchase_count,
      lastPurchased: row.last_purchased,
    };
  });

  // Sort by cheapest protein first
  items.sort((a, b) => (a.centsPerGProtein ?? 999) - (b.centsPerGProtein ?? 999));

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
            03 · trends
          </div>
        </div>

        <div className="mb-5">
          <h1 className="font-serif text-[38px] leading-[0.95] tracking-[-0.025em]">
            price<br />
            <em className="italic text-tamago">trends.</em>
          </h1>
          <p className="text-[12px] text-rice/60 mt-3 leading-[1.45]">
            {items.length > 0
              ? "Your proteins ranked by cost-per-gram-of-protein. Cheapest first."
              : "No purchase data yet. Log some groceries to see trends."}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="p-5 rounded-[14px] bg-lacquer-inner text-rice/50 text-center">
            <div className="font-serif text-[22px] mb-2">No data yet</div>
            <p className="text-[12px] leading-[1.45]">
              Log a few protein purchases and your trends will appear here.
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
            {items.map((item, i) => (
              <div
                key={item.itemId}
                className="p-4 rounded-[10px] bg-lacquer-inner flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-tare w-5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[13px] font-medium truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] tracking-[0.08em] text-rice/50 mt-1 ml-8">
                    {item.purchaseCount} purchase{item.purchaseCount !== 1 ? "s" : ""}
                    {item.lastPurchased &&
                      ` · last ${new Date(item.lastPurchased).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-3">
                  <Sparkline color="oklch(0.84 0.13 85)" width={40} height={18} />
                  {item.centsPerGProtein !== null && (
                    <div className="font-mono text-[11px] text-tamago text-right" style={{ minWidth: 52 }}>
                      {item.centsPerGProtein.toFixed(1)}¢/g
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
