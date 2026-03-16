import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fixed UUIDs for demo data so teardown can find them
const DEMO_BATCH_ID = "00000000-dead-beef-0000-000000000001";
const DEMO_POSTAL = "DEMO";
const DEMO_KENNITALA_PREFIX = "DEMO";

// Fixed IDs for associations so we can reference them
const ASSOC_IDS = [
  "00000000-aaaa-0001-0000-000000000001",
  "00000000-aaaa-0002-0000-000000000002",
  "00000000-aaaa-0003-0000-000000000003",
];

const PROVIDER_IDS = [
  "00000000-bbbb-0001-0000-000000000001",
  "00000000-bbbb-0002-0000-000000000002",
];

const BID_REQUEST_IDS = [
  "00000000-cccc-0001-0000-000000000001",
  "00000000-cccc-0002-0000-000000000002",
];

const BID_IDS = [
  "00000000-dddd-0001-0000-000000000001",
  "00000000-dddd-0002-0000-000000000002",
  "00000000-dddd-0003-0000-000000000003",
];

const TASK_IDS = [
  "00000000-eeee-0001-0000-000000000001",
  "00000000-eeee-0002-0000-000000000002",
  "00000000-eeee-0003-0000-000000000003",
  "00000000-eeee-0004-0000-000000000004",
  "00000000-eeee-0005-0000-000000000005",
  "00000000-eeee-0006-0000-000000000006",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, serviceRoleKey);

    // Get caller user_id from auth header
    const authHeader = req.headers.get("authorization") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action } = await req.json();

    if (action === "teardown") {
      // Delete in FK order
      // bid_messages via bids
      await db.from("bid_messages").delete().in("bid_id", BID_IDS);
      await db.from("bids").delete().in("id", BID_IDS);
      await db.from("bid_requests").delete().in("id", BID_REQUEST_IDS);
      await db.from("task_comments").delete().in("task_id", TASK_IDS);
      await db.from("tasks").delete().in("id", TASK_IDS);
      await db
        .from("transactions")
        .delete()
        .eq("uploaded_batch_id", DEMO_BATCH_ID);
      await db.from("upload_batches").delete().eq("id", DEMO_BATCH_ID);
      await db
        .from("association_members")
        .delete()
        .in("association_id", ASSOC_IDS);
      await db.from("notifications").delete().in(
        "related_entity_id",
        [...TASK_IDS, ...BID_IDS, ...BID_REQUEST_IDS]
      );
      await db.from("associations").delete().in("id", ASSOC_IDS);
      await db
        .from("service_provider_categories")
        .delete()
        .in("provider_id", PROVIDER_IDS);
      await db.from("service_providers").delete().in("id", PROVIDER_IDS);

      return new Response(
        JSON.stringify({ success: true, message: "Demo gögn fjarlægð" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "seed") {
      const userId = user.id;

      // 1. Categories — fetch existing to reference
      const { data: categories } = await db
        .from("categories")
        .select("id, name_is")
        .limit(20);
      const catMap: Record<string, string> = {};
      (categories ?? []).forEach((c: any) => {
        catMap[c.name_is] = c.id;
      });
      const catIds = Object.values(catMap);
      const pickCat = (idx: number) =>
        catIds[idx % catIds.length] ?? catIds[0];

      // 2. Associations
      const associations = [
        {
          id: ASSOC_IDS[0],
          name: "Birkigrund 5",
          address: "Birkigrund 5",
          postal_code: DEMO_POSTAL,
          city: "Reykjavík",
          type: "fjolbyli",
          num_units: 12,
          num_floors: 3,
          has_elevator: false,
          has_parking: true,
          building_year: 1978,
          square_meters_total: 960,
        },
        {
          id: ASSOC_IDS[1],
          name: "Laugavegur 22",
          address: "Laugavegur 22",
          postal_code: DEMO_POSTAL,
          city: "Reykjavík",
          type: "fjolbyli",
          num_units: 24,
          num_floors: 5,
          has_elevator: true,
          has_parking: false,
          building_year: 2005,
          square_meters_total: 2400,
        },
        {
          id: ASSOC_IDS[2],
          name: "Skógarhlíð 10",
          address: "Skógarhlíð 10",
          postal_code: DEMO_POSTAL,
          city: "Kópavogur",
          type: "radhus",
          num_units: 6,
          num_floors: 2,
          has_elevator: false,
          has_parking: true,
          building_year: 1995,
          square_meters_total: 720,
        },
      ];
      await db.from("associations").upsert(associations, { onConflict: "id" });

      // 3. Association members (current user as admin in all)
      const members = ASSOC_IDS.map((assocId) => ({
        association_id: assocId,
        user_id: userId,
        role: "admin",
        is_active: true,
      }));
      await db.from("association_members").upsert(members, {
        onConflict: "association_id,user_id",
        ignoreDuplicates: true,
      });

      // 4. Upload batch marker
      await db.from("upload_batches").upsert(
        {
          id: DEMO_BATCH_ID,
          association_id: ASSOC_IDS[0],
          uploaded_by: userId,
          file_name: "DEMO_SEED",
          file_type: "demo",
          row_count: 0,
        },
        { onConflict: "id" }
      );

      // 5. Transactions — spread over 12 months
      const txDescriptions = [
        { desc: "Húsgjöld frá íbúum", income: true },
        { desc: "Rafmagnsreikningur", income: false },
        { desc: "Hitaveita - mánaðarreikningur", income: false },
        { desc: "Tryggingariðgjald", income: false },
        { desc: "Viðhaldssjóður innborgun", income: true },
        { desc: "Lyftuþjónusta ehf", income: false },
        { desc: "Snjómokstur", income: false },
        { desc: "Garðvinna og umhirða", income: false },
        { desc: "Vatnsskattur", income: false },
        { desc: "Sorpgjald sveitarfélags", income: false },
        { desc: "Bílastæðaleiga", income: true },
        { desc: "Málningarframkvæmdir", income: false },
        { desc: "Þrifalager ehf", income: false },
        { desc: "Húsfélagsgjöld vangreidd", income: true },
        { desc: "Lóðarleiga", income: false },
      ];

      const transactions: any[] = [];
      let txCounter = 0;
      for (const assocId of ASSOC_IDS) {
        for (let month = 0; month < 12; month++) {
          const numTx = 3 + Math.floor(Math.random() * 3); // 3-5 per month
          for (let t = 0; t < numTx; t++) {
            const txDef =
              txDescriptions[txCounter % txDescriptions.length];
            const amount = txDef.income
              ? 50000 + Math.floor(Math.random() * 200000)
              : -(10000 + Math.floor(Math.random() * 150000));
            const day = 1 + Math.floor(Math.random() * 27);
            const dateStr = `2025-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            transactions.push({
              association_id: assocId,
              date: dateStr,
              description: txDef.desc,
              original_description: txDef.desc,
              amount,
              is_income: txDef.income,
              category_id: pickCat(txCounter),
              uploaded_batch_id: DEMO_BATCH_ID,
            });
            txCounter++;
          }
        }
      }
      // Insert in batches of 50
      for (let i = 0; i < transactions.length; i += 50) {
        await db.from("transactions").insert(transactions.slice(i, i + 50));
      }

      // Update batch row count
      await db
        .from("upload_batches")
        .update({ row_count: transactions.length })
        .eq("id", DEMO_BATCH_ID);

      // 6. Service providers
      const providers = [
        {
          id: PROVIDER_IDS[0],
          user_id: userId,
          company_name: "Pípulagningar Jóns ehf",
          kennitala: "DEMO000001",
          description_is:
            "Pípulagningar og viðhald fyrir fjölbýlishús á höfuðborgarsvæðinu.",
          email: "jon@pipulagningar.is",
          phone: "555-1234",
          is_approved: true,
          service_area: ["Reykjavík", "Kópavogur"],
        },
        {
          id: PROVIDER_IDS[1],
          user_id: userId,
          company_name: "Garðyrkja Guðrúnar",
          kennitala: "DEMO000002",
          description_is:
            "Garðaþjónusta, trjáklipping og lóðahirða fyrir húsfélög.",
          email: "gudrun@gardyrkja.is",
          phone: "555-5678",
          is_approved: true,
          service_area: ["Reykjavík", "Garðabær", "Kópavogur"],
        },
      ];
      await db
        .from("service_providers")
        .upsert(providers, { onConflict: "id" });

      // Provider categories
      if (catIds.length >= 2) {
        await db.from("service_provider_categories").upsert(
          [
            {
              provider_id: PROVIDER_IDS[0],
              category_id: pickCat(0),
            },
            {
              provider_id: PROVIDER_IDS[1],
              category_id: pickCat(1),
            },
          ],
          { onConflict: "id", ignoreDuplicates: true }
        );
      }

      // 7. Bid requests
      const bidRequests = [
        {
          id: BID_REQUEST_IDS[0],
          association_id: ASSOC_IDS[0],
          category_id: pickCat(0),
          title: "Endurnýja þaklagnir á Birkigrund 5",
          description:
            "Þakið er farið að leka og þarf að endurnýja þakpappa og einangrun.",
          created_by: userId,
          status: "open",
          deadline: "2025-06-30T23:59:59Z",
        },
        {
          id: BID_REQUEST_IDS[1],
          association_id: ASSOC_IDS[1],
          category_id: pickCat(1),
          title: "Garðvinna og trjáklipping sumarið 2025",
          description:
            "Þarf reglulega garðhirðu frá maí til september, þ.m.t. slátt og klipping.",
          created_by: userId,
          status: "open",
          deadline: "2025-04-15T23:59:59Z",
        },
      ];
      await db
        .from("bid_requests")
        .upsert(bidRequests, { onConflict: "id" });

      // 8. Bids
      const bids = [
        {
          id: BID_IDS[0],
          bid_request_id: BID_REQUEST_IDS[0],
          provider_id: PROVIDER_IDS[0],
          amount: 2850000,
          description:
            "Heildarverð fyrir þakpappa og einangrun. Verkið tekur ca. 2 vikur.",
          status: "pending",
          valid_until: "2025-05-31T23:59:59Z",
        },
        {
          id: BID_IDS[1],
          bid_request_id: BID_REQUEST_IDS[0],
          provider_id: PROVIDER_IDS[1],
          amount: 3200000,
          description: "Tilboð í þakviðgerð, innifalið efni og vinna.",
          status: "pending",
          valid_until: "2025-06-15T23:59:59Z",
        },
        {
          id: BID_IDS[2],
          bid_request_id: BID_REQUEST_IDS[1],
          provider_id: PROVIDER_IDS[1],
          amount: 450000,
          description:
            "Mánaðarlegt garðaþjónustusamband, maí-september, 90.000 kr/mán.",
          status: "pending",
          valid_until: "2025-04-10T23:59:59Z",
        },
      ];
      await db.from("bids").upsert(bids, { onConflict: "id" });

      // 9. Tasks
      const now = new Date();
      const tasks = [
        {
          id: TASK_IDS[0],
          association_id: ASSOC_IDS[0],
          title: "Laga leka pípulagnir í kjallara",
          description: "Leki á kaldavatnspípu í sameignarhluta kjallara.",
          status: "open",
          priority: "warning",
          assigned_to: userId,
          created_by: userId,
          due_date: "2025-04-01",
          visibility: "all",
        },
        {
          id: TASK_IDS[1],
          association_id: ASSOC_IDS[0],
          title: "Senda inn árstilkynningu til Húseigendafélagsins",
          status: "open",
          priority: "info",
          created_by: userId,
          due_date: "2025-03-31",
          visibility: "board",
        },
        {
          id: TASK_IDS[2],
          association_id: ASSOC_IDS[1],
          title: "Bóka aðalfund vorið 2025",
          description: "Finna stað og tíma fyrir aðalfund.",
          status: "open",
          priority: "info",
          created_by: userId,
          due_date: "2025-05-15",
          visibility: "all",
        },
        {
          id: TASK_IDS[3],
          association_id: ASSOC_IDS[1],
          title: "Fá tilboð í málningu stigagangs",
          status: "waiting",
          priority: "info",
          assigned_to: userId,
          created_by: userId,
          visibility: "all",
        },
        {
          id: TASK_IDS[4],
          association_id: ASSOC_IDS[2],
          title: "Skipta um ljósaperur í sameignarhlutum",
          status: "done",
          priority: "info",
          assigned_to: userId,
          created_by: userId,
          completed_at: new Date(
            now.getTime() - 5 * 24 * 60 * 60 * 1000
          ).toISOString(),
          visibility: "all",
        },
        {
          id: TASK_IDS[5],
          association_id: ASSOC_IDS[0],
          title: "Innheimta vangreidd húsfélagsgjöld",
          description: "Einn eigandi skuldar 3 mánaða gjöld.",
          status: "open",
          priority: "warning",
          created_by: userId,
          due_date: "2025-03-20",
          visibility: "board",
        },
      ];
      await db.from("tasks").upsert(tasks, { onConflict: "id" });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Demo gögn sett inn: ${associations.length} húsfélög, ${transactions.length} færslur, ${providers.length} þjónustuaðilar, ${tasks.length} verkefni`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'seed' or 'teardown'." }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
