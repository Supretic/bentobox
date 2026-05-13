"use client";

import { useState, useTransition } from "react";
import { addPurchase } from "./actions";
import { gToOz } from "@/lib/macros";

type Item = {
  id: string;
  name: string;
  protein_g_per_100g?: number;
  protein_g_per_100g_dry?: number;
};

type ItemType = "protein" | "carb" | "veggie";
type Store = "Sams Club" | "Food Lion" | "Other";

const LABEL =
  "font-mono text-[10px] tracking-[0.18em] uppercase text-lacquer/55";
const INPUT =
  "mt-1 w-full p-3 rounded-[8px] border border-lacquer/15 bg-rice text-lacquer focus:outline-none focus:border-tare placeholder:text-lacquer/40";

export function LogForm({
  proteins,
  carbs,
  veggies,
}: {
  proteins: Item[];
  carbs: Item[];
  veggies: Item[];
}) {
  const [itemType, setItemType] = useState<ItemType>("protein");
  const [itemId, setItemId] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<"oz" | "g">("oz");
  const [price, setPrice] = useState("");
  const [store, setStore] = useState<Store>("Food Lion");
  const [mvp, setMvp] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null
  );
  const [pending, startTransition] = useTransition();

  const items: Item[] =
    itemType === "protein" ? proteins : itemType === "carb" ? carbs : veggies;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await addPurchase({
        item_type: itemType,
        item_id: itemId,
        amount: parseFloat(amount),
        unit,
        price_dollars: parseFloat(price),
        store,
        is_mvp_discounted: store === "Food Lion" ? mvp : false,
        purchased_at: date,
      });

      if (res.error) {
        setResult({ ok: false, message: res.error });
        return;
      }

      const totalOz = gToOz(res.totalG ?? 0).toFixed(1);
      setResult({
        ok: true,
        message: `Added. Pantry now holds ${res.totalG?.toFixed(0)}g (~${totalOz} oz).`,
      });
      setAmount("");
      setPrice("");
      setItemId("");
      setMvp(false);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-5 rounded-[14px] bg-rice text-lacquer shadow-bento"
    >
      <div className="flex gap-2">
        {(["protein", "carb", "veggie"] as const).map((t, i) => (
          <button
            type="button"
            key={t}
            onClick={() => {
              setItemType(t);
              setItemId("");
            }}
            className={`flex-1 py-2 rounded-[8px] capitalize font-mono text-[11px] tracking-[0.12em] uppercase transition ${
              itemType === t
                ? "bg-lacquer text-rice"
                : "bg-lacquer/5 hover:bg-lacquer/10 text-lacquer"
            }`}
          >
            <span className="opacity-70 mr-1">{`0${i + 1}`}</span>
            {t}
          </button>
        ))}
      </div>

      <label className="block">
        <span className={LABEL}>item</span>
        <select
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          required
          className={INPUT}
        >
          <option value="">Pick one…</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-3 gap-2">
        <label className="col-span-2 block">
          <span className={LABEL}>amount</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className={INPUT}
          />
        </label>
        <label className="block">
          <span className={LABEL}>unit</span>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as "oz" | "g")}
            className={INPUT}
          >
            <option value="oz">oz</option>
            <option value="g">g</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className={LABEL}>price ($)</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          placeholder="What you actually paid"
          className={INPUT}
        />
      </label>

      <label className="block">
        <span className={LABEL}>store</span>
        <select
          value={store}
          onChange={(e) => setStore(e.target.value as Store)}
          className={INPUT}
        >
          <option>Food Lion</option>
          <option>Sams Club</option>
          <option>Other</option>
        </select>
      </label>

      {store === "Food Lion" && (
        <label className="flex items-center gap-2 text-[12px] text-lacquer">
          <input
            type="checkbox"
            checked={mvp}
            onChange={(e) => setMvp(e.target.checked)}
            className="w-4 h-4 accent-tare"
          />
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase">
            MVP discount applied
          </span>
        </label>
      )}

      <label className="block">
        <span className={LABEL}>purchased on</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={INPUT}
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full p-3 rounded-full bg-tare text-rice font-semibold text-[13px] shadow-cook disabled:opacity-50 hover:brightness-105 transition"
      >
        {pending ? "Saving…" : "Add to pantry →"}
      </button>

      {result && (
        <div
          className={`p-3 rounded-[8px] text-[12px] border-l-4 ${
            result.ok
              ? "bg-tare-pale border-tare text-lacquer"
              : "bg-tare-pale border-tare-dark text-tare-dark"
          }`}
        >
          <div className="font-mono text-[9px] tracking-[0.16em] uppercase opacity-70">
            {result.ok ? "added" : "error"}
          </div>
          <div className="mt-1">{result.message}</div>
        </div>
      )}
    </form>
  );
}
