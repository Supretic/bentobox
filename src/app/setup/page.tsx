"use client";

import { useState, useTransition } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const [nickname, setNickname] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nickname.trim().toLowerCase();
    if (!trimmed) return;

    startTransition(async () => {
      const supabase = createSupabaseBrowser();
      await supabase.auth.updateUser({
        data: { nickname: trimmed },
      });
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen bg-lacquer text-rice">
      <div className="mx-auto px-6" style={{ maxWidth: 448 }}>
        <div className="pt-20 pb-8">
          <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-tare mb-3">
            — one more thing
          </div>
          <h1 className="font-serif text-[42px] leading-[0.9] tracking-[-0.035em] font-medium">
            what should we
            <br />
            <em className="italic text-tare">call you?</em>
          </h1>
          <p className="text-[13px] text-rice/60 mt-4 max-w-[280px] leading-[1.45]">
            Pick a name for your greeting. First name, nickname, whatever you want.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-rice/60">
              nickname
            </span>
            <input
              type="text"
              required
              autoFocus
              maxLength={20}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. akira"
              className="mt-1 w-full p-3 rounded-[8px] border border-rice/20 bg-lacquer-inner text-rice placeholder:text-rice/40 focus:outline-none focus:border-tare"
            />
          </label>
          <button
            type="submit"
            disabled={pending || !nickname.trim()}
            className="w-full p-3 rounded-full bg-tare text-rice font-semibold text-[13px] shadow-cook disabled:opacity-50 hover:brightness-105 transition"
          >
            {pending ? "Saving…" : "Let's cook →"}
          </button>
        </form>
      </div>
    </div>
  );
}
