import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MIN_COMPARABLE = 5;

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

// Region helpers
function postalToNumber(pc: string | null | undefined): number {
  if (!pc) return 0;
  return parseInt(pc, 10) || 0;
}

function isCapitalArea(pc: string | null | undefined): boolean {
  const num = postalToNumber(pc);
  return num >= 100 && num <= 299;
}

function postalPrefix(pc: string | null | undefined): string {
  if (!pc || pc.length < 1) return '';
  return pc.charAt(0);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Authenticate caller
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const { associationId, filters } = await req.json();
    if (!associationId) {
      return new Response(JSON.stringify({ error: "associationId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for cross-association reads
    const db = createClient(supabaseUrl, serviceRoleKey);

    // Verify user is member of the requested association
    const { data: membership } = await db
      .from("association_members")
      .select("id")
      .eq("association_id", associationId)
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (!membership) {
      return new Response(JSON.stringify({ error: "Not a member of this association" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the requesting association's details
    const { data: myAssoc } = await db
      .from("associations")
      .select("id, num_units, type, postal_code, building_year")
      .eq("id", associationId)
      .single();

    if (!myAssoc || !myAssoc.num_units || myAssoc.num_units < 1) {
      return new Response(JSON.stringify({ rows: [], comparableCount: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const numUnits = myAssoc.num_units;

    // Date range: last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
    const fromDate = twelveMonthsAgo.toISOString().slice(0, 10);

    // 1. Get MY transactions (expenses only, negative amounts)
    const { data: myTx } = await db
      .from("transactions")
      .select("category_id, amount")
      .eq("association_id", associationId)
      .eq("is_income", false)
      .gte("date", fromDate);

    // 2. Get comparable associations
    const minUnits = filters?.minUnits ?? 2;
    const maxUnits = filters?.maxUnits ?? 200;
    const buildingType = filters?.buildingType ?? "all";
    const region = filters?.region ?? "all";
    const buildingYearFrom = filters?.buildingYearFrom ?? 1900;
    const buildingYearTo = filters?.buildingYearTo ?? new Date().getFullYear();

    let assocQuery = db
      .from("associations")
      .select("id, num_units, type, postal_code, building_year")
      .neq("id", associationId)
      .gte("num_units", minUnits)
      .lte("num_units", maxUnits);

    if (buildingType !== "all") {
      assocQuery = assocQuery.eq("type", buildingType);
    }

    const { data: otherAssocs } = await assocQuery;

    // Filter by region and building year
    const myPostalPrefix = postalPrefix(myAssoc.postal_code);
    const myIsCapital = isCapitalArea(myAssoc.postal_code);

    const filteredAssocs = (otherAssocs ?? []).filter((a: any) => {
      // Region filter
      if (region === 'local') {
        if (postalPrefix(a.postal_code) !== myPostalPrefix) return false;
      } else if (region === 'capital_vs_rural') {
        const otherIsCapital = isCapitalArea(a.postal_code);
        if (myIsCapital !== otherIsCapital) return false;
      }
      // Building year filter
      if (a.building_year != null) {
        if (a.building_year < buildingYearFrom || a.building_year > buildingYearTo) return false;
      }
      return true;
    });

    const otherAssocIds = filteredAssocs.map((a: any) => a.id);
    const comparableCount = otherAssocIds.length;

    // 3. Get transactions for other associations
    let otherTxList: Array<{ association_id: string; category_id: string | null; amount: number }> = [];
    if (otherAssocIds.length > 0) {
      for (let i = 0; i < otherAssocIds.length; i += 50) {
        const chunk = otherAssocIds.slice(i, i + 50);
        const { data: otherTx } = await db
          .from("transactions")
          .select("association_id, category_id, amount")
          .in("association_id", chunk)
          .eq("is_income", false)
          .gte("date", fromDate)
          .limit(10000);
        otherTxList = otherTxList.concat(otherTx ?? []);
      }
    }

    // 4. Aggregate MY costs per category
    const myTotals = new Map<string, number>();
    for (const tx of myTx ?? []) {
      if (!tx.category_id) continue;
      myTotals.set(tx.category_id, (myTotals.get(tx.category_id) ?? 0) + Math.abs(tx.amount));
    }

    // 5. Aggregate OTHER costs per association per category
    const assocUnits = new Map<string, number>();
    for (const a of filteredAssocs) {
      assocUnits.set(a.id, (a as any).num_units);
    }

    type CatMap = Map<string, number>;
    const otherTotals = new Map<string, CatMap>();
    for (const tx of otherTxList) {
      if (!tx.category_id) continue;
      if (!otherTotals.has(tx.association_id)) otherTotals.set(tx.association_id, new Map());
      const catMap = otherTotals.get(tx.association_id)!;
      catMap.set(tx.category_id, (catMap.get(tx.category_id) ?? 0) + Math.abs(tx.amount));
    }

    // 6. Get category metadata
    const { data: categories } = await db
      .from("categories")
      .select("id, name_is, color, icon");
    const catMeta = new Map<string, { name: string; color: string; icon: string }>();
    for (const c of categories ?? []) {
      catMeta.set(c.id, { name: c.name_is, color: c.color ?? "#94a3b8", icon: c.icon ?? "HelpCircle" });
    }

    // 7. Build benchmark rows
    const rows: any[] = [];
    for (const [catId, myTotal] of myTotals.entries()) {
      const myCostPerUnit = myTotal / numUnits / 12;

      const otherCosts: number[] = [];
      for (const [assocId, catMap] of otherTotals.entries()) {
        const otherTotal = catMap.get(catId);
        const units = assocUnits.get(assocId);
        if (otherTotal && units && units > 0) {
          otherCosts.push(otherTotal / units / 12);
        }
      }

      const comparableInCategory = otherCosts.length;

      if (comparableInCategory < MIN_COMPARABLE) {
        const meta = catMeta.get(catId);
        rows.push({
          categoryId: catId,
          categoryName: meta?.name ?? "Óþekkt flokkur",
          categoryColor: meta?.color ?? "#94a3b8",
          categoryIcon: meta?.icon ?? "HelpCircle",
          yourCostPerUnit: myCostPerUnit,
          median: null, p25: null, p75: null, avgCostPerUnit: null,
          diff: null, diffPercent: null, percentile: null,
          status: "insufficient",
          comparableInCategory,
        });
        continue;
      }

      const med = median(otherCosts);
      const p25 = percentile(otherCosts, 25);
      const p75 = percentile(otherCosts, 75);
      const avg = otherCosts.reduce((s, v) => s + v, 0) / otherCosts.length;

      const diff = myCostPerUnit - med;
      const diffPercent = med > 0 ? (diff / med) * 100 : 0;

      const cheaper = otherCosts.filter((v) => v < myCostPerUnit).length;
      const pct = Math.round((cheaper / otherCosts.length) * 100);

      const status = diffPercent <= -10 ? "below" : diffPercent >= 10 ? "above" : "average";

      const meta = catMeta.get(catId);
      rows.push({
        categoryId: catId,
        categoryName: meta?.name ?? "Óþekkt flokkur",
        categoryColor: meta?.color ?? "#94a3b8",
        categoryIcon: meta?.icon ?? "HelpCircle",
        yourCostPerUnit: myCostPerUnit,
        median: med, p25, p75, avgCostPerUnit: avg,
        diff, diffPercent, percentile: pct,
        status, comparableInCategory,
      });
    }

    rows.sort((a, b) => Math.abs(b.diffPercent ?? 0) - Math.abs(a.diffPercent ?? 0));

    return new Response(
      JSON.stringify({ rows, comparableCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
