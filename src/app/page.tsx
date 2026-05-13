import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sparkline } from "@/components/Sparkline";

function greeting(d: Date) {
  const h = d.getHours();
  if (h < 5) return "still up,";
  if (h < 12) return "good morning,";
  if (h < 17) return "good afternoon,";
  return "good evening,";
}

function dateStamp(d: Date) {
  const day = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const mo = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const dom = d.getDate();
  const time = d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toUpperCase();
  return { top: `${day} · ${mo} ${dom}`, time };
}

export default async function Home() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const nickname = user.user_metadata?.nickname;
  if (!nickname) redirect("/setup");
  const firstName = nickname;
  const now = new Date();
  const stamp = dateStamp(now);

  const pantryCount = 0;
  const lowCount = 0;
  const trendItem = "—";
  const trendDelta = "";
  const pick = null as null | { name: string; ingredients: string };

  return (
    <div className="min-h-screen bg-lacquer text-rice">
      <div className="mx-auto" style={{ maxWidth: 448 }}>
        <div className="px-6 pt-6 pb-4 flex justify-between items-end">
          <div className="font-serif text-[30px] leading-none tracking-tight">
            {greeting(now)}
            <br />
            <em className="italic text-tare">{firstName}.</em>
          </div>
          <div className="font-mono text-[10.5px] tracking-[0.12em] uppercase text-right text-rice/70">
            {stamp.top}
            <b className="block text-rice font-medium mt-[3px] tracking-[0.06em]">
              {stamp.time}
            </b>
          </div>
        </div>

        <div
          className="mx-[18px] mb-[18px] bg-lacquer-inner rounded-[14px] p-[10px] grid gap-[10px] shadow-bento"
          style={{
            height: 600,
            gridTemplateColumns: "1.45fr 1fr",
            gridTemplateRows: "1.05fr 0.95fr 0.9fr",
          }}
        >
          <a
            href="/log"
            className="rice-grain relative overflow-hidden rounded-[8px] bg-rice text-lacquer p-[18px] flex flex-col justify-between transition-transform hover:-translate-y-0.5"
            style={{ gridColumn: 1, gridRow: "1 / span 2" }}
          >
            <div
              className="ume absolute rounded-full"
              style={{ top: 22, right: 22, width: 46, height: 46 }}
              aria-hidden
            />
            <div>
              <div className="font-mono text-[9.5px] tracking-[0.18em] uppercase opacity-55">
                01 · primary
              </div>
              <div className="font-serif text-[46px] leading-[0.9] tracking-[-0.025em] mt-1">
                log a
                <br />
                <em className="italic text-tare">grocery</em>
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div className="text-[12px] opacity-60 max-w-[130px] leading-[1.35]">
                name · weight · price · store
              </div>
              <div className="w-[44px] h-[44px] rounded-full bg-lacquer text-rice flex items-center justify-center text-[20px]">
                →
              </div>
            </div>
          </a>

          <a
            href="/pantry"
            className="relative overflow-hidden rounded-[8px] bg-salmon text-lacquer p-[18px] transition-transform hover:-translate-y-0.5"
            style={{ gridColumn: 2, gridRow: 1 }}
          >
            <div className="font-mono text-[9.5px] tracking-[0.18em] uppercase opacity-55">
              02
            </div>
            <div className="font-serif text-[28px] leading-[0.95] tracking-[-0.02em] mt-1.5">
              Pantry
            </div>
            <div
              className="absolute flex flex-col gap-[3px]"
              style={{ top: 14, right: 14 }}
              aria-hidden
            >
              <i className="block h-[5px] rounded-[2px] bg-tare" style={{ width: 28, opacity: 0.85 }} />
              <i className="block h-[5px] rounded-[2px] bg-lacquer" style={{ width: 22, opacity: 0.6 }} />
              <i className="block h-[5px] rounded-[2px] bg-shoyu" style={{ width: 26, opacity: 0.7 }} />
              <i className="block h-[5px] rounded-[2px] bg-lacquer" style={{ width: 18, opacity: 0.4 }} />
            </div>
            <div
              className="absolute text-[11px] opacity-60"
              style={{ bottom: 14, left: 18 }}
            >
              <b className="font-mono font-medium">{pantryCount}</b> items
              {lowCount > 0 && ` · ${lowCount} low`}
            </div>
          </a>

          <a
            href="/trends"
            className="relative overflow-hidden rounded-[8px] bg-tamago text-lacquer p-[18px] transition-transform hover:-translate-y-0.5"
            style={{ gridColumn: 2, gridRow: 2 }}
          >
            <div className="font-mono text-[9.5px] tracking-[0.18em] uppercase opacity-55">
              03
            </div>
            <div className="font-serif text-[28px] leading-[0.95] tracking-[-0.02em] mt-1.5">
              Trends
            </div>
            <div
              className="absolute"
              style={{ bottom: 12, right: 12 }}
              aria-hidden
            >
              <Sparkline color="oklch(0.30 0.04 60)" />
            </div>
            <div
              className="absolute text-[11px] opacity-60"
              style={{ bottom: 14, left: 18 }}
            >
              {trendDelta ? (
                <>
                  {trendItem}{" "}
                  <b className="font-mono text-tare-dark">{trendDelta}</b>
                </>
              ) : (
                <span className="opacity-70">no data yet</span>
              )}
            </div>
          </a>

          <a
            href="/meals"
            className="relative overflow-hidden rounded-[8px] bg-nori text-rice flex items-center gap-[14px] p-[14px_16px] transition-transform hover:-translate-y-0.5"
            style={{ gridColumn: "1 / span 2", gridRow: 3 }}
          >
            <div
              className="thumb-placeholder rounded-[6px] flex-shrink-0"
              style={{ width: 88, height: "100%" }}
              aria-hidden
            />
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[9px] tracking-[0.16em] uppercase opacity-70">
                {pick ? "tonight's pick · $$" : "tonight's pick"}
              </div>
              <div className="font-serif text-[18px] leading-[1.1] mt-[3px] tracking-[-0.01em]">
                {pick?.name ?? "Add groceries to unlock a pick."}
              </div>
              <div className="text-[11px] opacity-70 mt-1">
                {pick?.ingredients ?? "your pantry is empty"}
              </div>
            </div>
            <div className="bg-tare text-rice px-[14px] py-[10px] rounded-full font-body font-semibold text-[12px] whitespace-nowrap shadow-cook">
              Cook this →
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
