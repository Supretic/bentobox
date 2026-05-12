"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-lacquer text-rice">
      <div className="mx-auto px-6" style={{ maxWidth: 448 }}>
        <div className="pt-20 pb-8">
          <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-tare mb-3">
            — welcome
          </div>
          <h1 className="font-serif text-[56px] leading-[0.9] tracking-[-0.035em] font-medium">
            bento
            <br />
            <em className="italic text-tare">box.</em>
          </h1>
          <p className="text-[13px] text-rice/60 mt-4 max-w-[260px] leading-[1.45]">
            Groceries in. Meals out. Macros known.
          </p>
        </div>

        {sent ? (
          <div className="p-4 rounded-[8px] bg-rice text-lacquer border-l-4 border-tare">
            <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-tare opacity-80">
              link sent
            </div>
            <div className="font-serif text-[20px] leading-[1.1] mt-1 tracking-[-0.01em]">
              Check <em className="italic">{email}</em> — your magic link is waiting.
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block">
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-rice/60">
                email
              </span>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full p-3 rounded-[8px] border border-rice/20 bg-lacquer-inner text-rice placeholder:text-rice/40 focus:outline-none focus:border-tare"
              />
            </label>
            {error && (
              <div className="text-[12px] text-tare bg-tare-dark/20 border border-tare/40 rounded-[8px] p-3">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 rounded-full bg-tare text-rice font-semibold text-[13px] shadow-cook disabled:opacity-50 hover:brightness-105 transition"
            >
              {loading ? "Sending…" : "Send magic link →"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
