import { createClient } from "@supabase/supabase-js";
import seed from "../seed-data.json";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  console.error(
    "Missing env. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

async function run() {
  console.log(`Seeding ${seed.proteins.length} proteins…`);
  for (const p of seed.proteins) {
    const { error } = await supabase.from("proteins").upsert(p, { onConflict: "name" });
    if (error) console.error("  protein", p.name, "→", error.message);
  }

  console.log(`Seeding ${seed.carbs.length} carbs…`);
  for (const c of seed.carbs) {
    const { error } = await supabase.from("carbs").upsert(c, { onConflict: "name" });
    if (error) console.error("  carb", c.name, "→", error.message);
  }

  console.log(`Seeding ${seed.veggies.length} veggies…`);
  for (const v of seed.veggies) {
    const { error } = await supabase.from("veggies").upsert(v, { onConflict: "name" });
    if (error) console.error("  veggie", v.name, "→", error.message);
  }

  console.log("Done.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
