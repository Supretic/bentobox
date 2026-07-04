import { createClient } from "@supabase/supabase-js";

// Template-based meal catalog generator. No API calls — recipes are
// composed from cooking-method templates keyed by protein category,
// veggie prep style, and carb type, with seasoning profiles for variety.
//
// Coverage guarantee: every (protein, veggie) pair gets one no-carb meal,
// so any pantry holding a protein and a veggie always matches something.
// Each pair also gets two carb variants picked from sensible pairings.
//
// Deterministic: choices are hash-seeded from row ids, so re-runs produce
// identical output and skip combos that already exist.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  console.error(
    "Missing env. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

// ---------- deterministic helpers ----------

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

const shortName = (name: string) => name.split("(")[0].trim();

// ---------- seasoning profiles ----------

interface Profile {
  label: string;
  season: string; // completes "Season 170g X ..."
  finish: string; // final-step flourish
  vibes: string[];
}

const PROFILES: Profile[] = [
  {
    label: "Lemon-Garlic",
    season: "with salt, pepper, and plenty of minced garlic",
    finish: "Finish with a big squeeze of lemon and a drizzle of olive oil.",
    vibes: ["fresh"],
  },
  {
    label: "Soy-Ginger",
    season: "with soy sauce, grated ginger, and a pinch of sugar",
    finish: "Glaze with soy sauce and a splash of rice vinegar; top with sesame seeds.",
    vibes: ["fresh"],
  },
  {
    label: "Smoky",
    season: "with smoked paprika, garlic powder, and salt",
    finish: "Finish with a knob of butter and one more pinch of paprika.",
    vibes: ["comfort"],
  },
  {
    label: "Herbed",
    season: "with Italian herbs, salt, and pepper",
    finish: "Finish with olive oil, cracked pepper, and parmesan if you have it.",
    vibes: ["comfort"],
  },
  {
    label: "Cajun",
    season: "with Cajun seasoning — paprika, cayenne, garlic, oregano",
    finish: "Hit it with hot sauce at the table.",
    vibes: ["spicy"],
  },
  {
    label: "Honey-Mustard",
    season: "with salt and pepper",
    finish: "Whisk honey, dijon, and a splash of vinegar; spoon it over everything.",
    vibes: ["comfort"],
  },
  {
    label: "Chili-Lime",
    season: "with chili powder, cumin, and salt",
    finish: "Squeeze lime over the top and add cilantro or hot sauce if you have it.",
    vibes: ["spicy", "fresh"],
  },
  {
    label: "Garlic-Butter",
    season: "with salt and pepper",
    finish: "Melt butter with minced garlic in the pan and spoon it over the top.",
    vibes: ["comfort"],
  },
];

// Mild profiles for no-cook proteins (yogurt bowls, mozzarella, canned tuna)
const MILD_PROFILE_IDX = [0, 2, 3, 6];

// ---------- protein methods ----------

interface ProteinRow {
  id: string;
  name: string;
  category: string | null;
  protein_g_per_100g: number;
}
interface CarbRow {
  id: string;
  name: string;
  type: string;
}
interface VeggieRow {
  id: string;
  name: string;
}

interface Method {
  steps: (p: string, profile: Profile) => string[];
  minutes: number;
  vibes: string[];
  noCook?: boolean;
  bowl?: boolean;
  mealTypes?: string[][]; // hash-picked; default lunch/dinner mixes
}

function methodFor(p: ProteinRow): Method {
  const n = p.name.toLowerCase();

  if (n.includes("ground"))
    return {
      steps: (pn, pr) => [
        `Brown 170g ${pn} in a hot skillet, breaking it up as it cooks, seasoned ${pr.season}.`,
      ],
      minutes: 15,
      vibes: [],
    };
  if (n.includes("wings") || n.includes("drumsticks"))
    return {
      steps: (pn, pr) => [
        `Season 170g ${pn} ${pr.season}.`,
        `Bake at 425°F for 35-40 min, flipping halfway, until the skin crisps.`,
      ],
      minutes: 45,
      vibes: ["comfort"],
      mealTypes: [["dinner"]],
    };
  if (n.includes("chuck") || n.includes("shoulder") || n.includes("stew"))
    return {
      steps: (pn, pr) => [
        `Season 170g ${pn} ${pr.season} and sear hard on all sides.`,
        `Add a splash of broth, cover, and simmer low 1.5-2 hours until it pulls apart.`,
      ],
      minutes: 90,
      vibes: ["comfort", "meal-prep"],
      mealTypes: [["dinner"]],
    };
  if (n.includes("bacon"))
    return {
      steps: (pn) => [
        `Chop 170g ${pn} and render until crisp; keep a spoonful of the fat in the pan.`,
      ],
      minutes: 12,
      vibes: ["comfort"],
    };
  if (n.includes("canned tuna"))
    return {
      steps: (pn, pr) => [`Drain 170g ${pn}, flake it, and season ${pr.season}.`],
      minutes: 8,
      vibes: ["lazy"],
      noCook: true,
    };
  if (n.includes("shrimp"))
    return {
      steps: (pn, pr) => [
        `Season 170g ${pn} ${pr.season}.`,
        `Sear in a ripping hot pan, about 2 min per side.`,
      ],
      minutes: 12,
      vibes: ["fresh"],
    };
  if (n.includes("tuna steak"))
    return {
      steps: (pn, pr) => [
        `Season 170g ${pn} ${pr.season}.`,
        `Sear 1-2 min per side, keeping the center pink, then slice.`,
      ],
      minutes: 12,
      vibes: ["fresh"],
    };
  if (p.category === "fish")
    return {
      steps: (pn, pr) => [
        `Season 170g ${pn} ${pr.season}.`,
        `Pan-sear in oil, 3-4 min per side, until it flakes easily.`,
      ],
      minutes: 15,
      vibes: ["fresh"],
    };
  if (n.includes("egg"))
    return {
      steps: (pn) => [
        `Beat 170g ${pn} with a pinch of salt.`,
        `Soft-scramble in butter over medium-low heat.`,
      ],
      minutes: 10,
      vibes: ["lazy"],
      mealTypes: [["breakfast", "lunch"]],
    };
  if (n.includes("tofu"))
    return {
      steps: (pn, pr) => [
        `Press 170g ${pn}, cube it, and toss ${pr.season}.`,
        `Pan-fry in oil until golden on all sides, about 8 min.`,
      ],
      minutes: 18,
      vibes: [],
    };
  if (n.includes("tempeh"))
    return {
      steps: (pn, pr) => [
        `Slice 170g ${pn} and season ${pr.season}.`,
        `Sear 3-4 min per side until caramelized.`,
      ],
      minutes: 15,
      vibes: [],
    };
  if (n.includes("lentils"))
    return {
      steps: (pn, pr) => [
        `Simmer 170g ${pn} in salted water until just tender, about 20 min; drain and season ${pr.season}.`,
      ],
      minutes: 25,
      vibes: ["meal-prep"],
    };
  if (n.includes("black beans") || n.includes("chickpeas"))
    return {
      steps: (pn, pr) => [
        `Warm 170g ${pn} in a pan ${pr.season}, mashing a few for texture.`,
      ],
      minutes: 10,
      vibes: ["lazy"],
    };
  if (n.includes("edamame"))
    return {
      steps: (pn, pr) => [`Steam 170g ${pn} until bright green, then season ${pr.season}.`],
      minutes: 10,
      vibes: ["fresh"],
    };
  if (n.includes("yogurt") || n.includes("cottage") || n.includes("oikos"))
    return {
      steps: (pn, pr) => [`Scoop 170g ${pn} into a bowl and season ${pr.season}.`],
      minutes: 5,
      vibes: ["lazy"],
      noCook: true,
      bowl: true,
      mealTypes: [["breakfast", "lunch"]],
    };
  if (n.includes("mozzarella"))
    return {
      steps: (pn, pr) => [`Tear 170g ${pn} into chunks and season ${pr.season}.`],
      minutes: 5,
      vibes: ["fresh", "lazy"],
      noCook: true,
    };
  // steaks, chops, breasts, thighs, tenderloin, turkey — the sear-and-slice default
  return {
    steps: (pn, pr) => [
      `Season 170g ${pn} ${pr.season}.`,
      `Sear in a hot oiled skillet, 4-6 min per side, until cooked through.`,
      `Rest a few minutes, then slice.`,
    ],
    minutes: 20,
    vibes: [],
  };
}

// ---------- veggie prep ----------

function veggieStep(v: VeggieRow, seed: number): string {
  const n = v.name.toLowerCase();
  const vn = shortName(v.name);

  if (n.includes("frozen"))
    return `Stir-fry 150g ${vn} straight from frozen over high heat until hot and blistered.`;
  if (n.includes("diced tomatoes"))
    return `Pour in 150g diced tomatoes and simmer into a quick pan sauce.`;
  if (n.includes("artichoke"))
    return `Drain 150g ${vn} and sear cut-side down until golden.`;
  if (n.includes("cherry tomatoes"))
    return `Blister 150g cherry tomatoes in a hot pan until they burst.`;
  if (n.includes("garlic ("))
    return `Roast 150g garlic cloves in oil until golden and sweet.`;
  if (n.includes("green onion"))
    return `Char 150g green onions whole until softened and smoky.`;
  if (n.includes("jalapeno"))
    return `Char 150g jalapenos, then slice — seeds out for less heat.`;
  if (n.includes("mushrooms"))
    return `Sauté 150g mushrooms in a hot pan until deeply browned.`;
  if (n.includes("onion ("))
    return `Slice 150g onion and cook it low and slow until caramelized at the edges.`;
  if (n.includes("peas ("))
    return `Stir 150g peas in near the end to warm through.`;
  if (n.includes("corn"))
    return `Char 150g corn in a dry skillet until spotted.`;

  const leafy = ["spinach", "kale", "collard", "bok choy", "cabbage"];
  if (leafy.some((l) => n.includes(l)))
    return `Sauté 150g ${vn} with garlic until just wilted.`;

  const raw = ["lettuce", "mixed greens", "cucumber", "tomato (raw)", "avocado", "radish", "celery"];
  if (raw.some((r) => n.includes(r)))
    return `Chop 150g ${vn} and dress with olive oil, lemon, and salt for a quick side salad.`;

  // roastable default — hash decides roast vs sauté
  return seed % 2 === 0
    ? `Toss 150g ${vn} with oil and roast at 425°F for 12-15 min until browned at the edges.`
    : `Sauté 150g ${vn} in a hot pan until crisp-tender, 4-6 min.`;
}

// ---------- carb prep ----------

function carbStep(c: CarbRow): string {
  const n = c.name.toLowerCase();
  const cn = shortName(c.name);

  if (n.includes("plantain")) return `Slice 75g plantain and pan-fry in oil until caramelized.`;
  if (n.includes("couscous")) return `Pour boiling water over 75g couscous, cover 5 min, and fluff.`;
  if (n.includes("grits") || n.includes("polenta"))
    return `Whisk 75g ${cn} into simmering water and cook until creamy.`;
  if (n.includes("oats")) return `Cook 75g ${cn} with water or milk until creamy.`;
  if (n.includes("cornbread") || n.includes("stuffing"))
    return `Prepare 75g ${cn} according to the box.`;
  if (n.includes("tortilla")) return `Char 75g ${cn} in a dry pan until spotted.`;
  if (n.includes("naan") || n.includes("pita")) return `Warm 75g ${cn} in a dry pan.`;

  switch (c.type) {
    case "rice":
      return `Cook 75g ${cn} according to the package.`;
    case "pasta":
    case "protein-pasta":
      return `Boil 75g ${cn} al dente and save a splash of pasta water.`;
    case "noodle":
      return `Cook 75g ${cn} per the package and drain.`;
    case "potato":
      return `Cube 75g ${cn} and roast at 425°F until golden, about 20 min.`;
    case "grain":
      return `Simmer 75g ${cn} until tender.`;
    case "bread":
      return `Toast 75g ${cn}.`;
    default:
      return `Cook 75g ${cn} according to the package.`;
  }
}

const CARB_MINUTES: Record<string, number> = {
  rice: 25,
  pasta: 15,
  "protein-pasta": 15,
  noodle: 10,
  potato: 25,
  grain: 20,
  bread: 5,
};

// ---------- carb compatibility ----------

const ALL_CARB_TYPES = ["rice", "pasta", "protein-pasta", "noodle", "potato", "grain", "bread"];

const CARB_TYPES_FOR_CATEGORY: Record<string, string[]> = {
  poultry: ALL_CARB_TYPES,
  beef: ALL_CARB_TYPES,
  pork: ALL_CARB_TYPES,
  lamb: ["rice", "grain", "potato", "bread", "pasta"],
  fish: ALL_CARB_TYPES,
  plant: ["rice", "grain", "pasta", "noodle", "potato", "bread"],
  egg: ["bread", "potato", "rice", "grain"],
  dairy: ["grain", "bread"],
};

// ---------- name generation ----------

function mealName(
  p: string,
  v: string,
  carb: CarbRow | null,
  profile: Profile,
  seed: number
): string {
  const carbNoun = carb
    ? { rice: "Rice Bowl", pasta: "Pasta", "protein-pasta": "Pasta", noodle: "Noodles", potato: "Plate", grain: "Bowl", bread: "Plate" }[carb.type] ?? "Plate"
    : "Skillet";

  const patterns = [
    `${profile.label} ${p} & ${v}`,
    `${p} & ${v} ${carb ? "Bowl" : "Skillet"}`,
    `${profile.label} ${p} ${carbNoun}`,
  ];
  return patterns[seed % patterns.length];
}

// ---------- assembly ----------

function buildMeal(p: ProteinRow, carb: CarbRow | null, v: VeggieRow) {
  const seed = hash(`${p.id}|${carb?.id ?? "none"}|${v.id}`);
  const method = methodFor(p);

  const profileIdx = method.noCook
    ? MILD_PROFILE_IDX[seed % MILD_PROFILE_IDX.length]
    : seed % PROFILES.length;
  const profile = PROFILES[profileIdx];

  const pn = shortName(p.name);
  const vn = shortName(v.name);

  const steps: string[] = [];
  if (carb) steps.push(carbStep(carb));
  steps.push(...method.steps(pn, profile));
  steps.push(veggieStep(v, seed >>> 3));

  if (method.bowl) {
    steps.push(
      `Top the bowl with the ${vn.toLowerCase()}${carb ? ` and serve the ${shortName(carb.name).toLowerCase()} alongside` : ""}. ${profile.finish}`
    );
  } else if (carb) {
    steps.push(`Pile everything over the ${shortName(carb.name).toLowerCase()}. ${profile.finish}`);
  } else {
    steps.push(`Plate it up. ${profile.finish}`);
  }

  const recipe_text = steps.map((s, i) => `${i + 1}. ${s}`).join("\n");

  const vibes = [...new Set([...profile.vibes, ...method.vibes])];
  if (p.protein_g_per_100g >= 20 && !vibes.includes("high-protein")) vibes.push("high-protein");

  const mealTypes = method.mealTypes
    ? method.mealTypes[seed % method.mealTypes.length]
    : seed % 3 === 0
      ? ["lunch", "dinner"]
      : ["dinner"];

  const carbMin = carb ? CARB_MINUTES[carb.type] ?? 20 : 0;
  const prep_minutes = Math.max(method.minutes, carbMin) + (carb ? 5 : 0);

  return {
    protein_id: p.id,
    carb_id: carb?.id ?? null,
    veggie_id: v.id,
    name: mealName(pn, vn, carb, profile, seed >>> 5),
    recipe_text,
    prep_minutes,
    vibe_tags: vibes.slice(0, 3),
    meal_type: mealTypes,
    default_protein_g: 170,
    default_carb_g: carb ? 75 : 0,
    default_veggie_g: 150,
    source: "generated",
  };
}

// ---------- main ----------

async function run() {
  const [proteinsRes, carbsRes, veggiesRes, existingRes] = await Promise.all([
    supabase.from("proteins").select("id, name, category, protein_g_per_100g"),
    supabase.from("carbs").select("id, name, type"),
    supabase.from("veggies").select("id, name"),
    supabase.from("meals").select("protein_id, carb_id, veggie_id"),
  ]);

  const proteins = (proteinsRes.data ?? []) as ProteinRow[];
  const carbs = (carbsRes.data ?? []) as CarbRow[];
  const veggies = (veggiesRes.data ?? []) as VeggieRow[];
  const existing = new Set(
    (existingRes.data ?? []).map(
      (e) => `${e.protein_id}|${e.carb_id ?? "none"}|${e.veggie_id}`
    )
  );

  console.log(
    `Catalog: ${proteins.length} proteins × ${veggies.length} veggies. ${existing.size} meals already exist.`
  );

  const rows: ReturnType<typeof buildMeal>[] = [];
  let skipped = 0;

  for (const p of proteins) {
    const allowedTypes = CARB_TYPES_FOR_CATEGORY[p.category ?? ""] ?? ALL_CARB_TYPES;
    const compatibleCarbs = carbs.filter((c) => allowedTypes.includes(c.type));

    for (const v of veggies) {
      const pairSeed = hash(`${p.id}|${v.id}`);

      // two hash-picked distinct carb variants + the no-carb baseline
      const carbA = compatibleCarbs[pairSeed % compatibleCarbs.length];
      let carbB = compatibleCarbs[(pairSeed >>> 4) % compatibleCarbs.length];
      if (carbB.id === carbA.id)
        carbB = compatibleCarbs[((pairSeed >>> 4) + 1) % compatibleCarbs.length];

      for (const carb of [null, carbA, carbB]) {
        const key = `${p.id}|${carb?.id ?? "none"}|${v.id}`;
        if (existing.has(key)) {
          skipped++;
          continue;
        }
        existing.add(key);
        rows.push(buildMeal(p, carb, v));
      }
    }
  }

  console.log(`Generating ${rows.length} meals (${skipped} combos already existed)…`);

  const CHUNK = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from("meals").insert(chunk);
    if (error) {
      console.error(`Chunk ${i / CHUNK + 1} failed: ${error.message}`);
      process.exit(1);
    }
    inserted += chunk.length;
    console.log(`  ${inserted}/${rows.length}`);
  }

  console.log(`\nDone. Inserted: ${inserted} | Skipped (existing): ${skipped}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
