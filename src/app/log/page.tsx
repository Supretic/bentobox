import { createSupabaseServer } from "@/lib/supabase/server";
import { LogForm } from "./log-form";

export default async function LogPage() {
  const supabase = await createSupabaseServer();

  const [proteinsRes, carbsRes, veggiesRes] = await Promise.all([
    supabase.from("proteins").select("id, name, protein_g_per_100g").order("name"),
    supabase.from("carbs").select("id, name, protein_g_per_100g_dry").order("name"),
    supabase.from("veggies").select("id, name, protein_g_per_100g").order("name"),
  ]);

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
            01 · log
          </div>
        </div>

        <div className="mb-5">
          <h1 className="font-serif text-[38px] leading-[0.95] tracking-[-0.025em]">
            log a<br />
            <em className="italic text-tare">grocery.</em>
          </h1>
          <p className="text-[12px] text-rice/60 mt-3 leading-[1.45]">
            What'd you buy? We add it to the pantry and the price log.
          </p>
        </div>

        <LogForm
          proteins={proteinsRes.data ?? []}
          carbs={carbsRes.data ?? []}
          veggies={veggiesRes.data ?? []}
        />
      </div>
    </div>
  );
}
