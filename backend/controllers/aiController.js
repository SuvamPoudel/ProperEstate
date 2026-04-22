require("dotenv").config();
const Groq = require("groq-sdk");
const Land = require("../models/Land");

/* ─────────────────────────────────────────────────────────────────
   ACTUAL DB VALUES (from LandForm.js / constants/index.js):
   mainCategory : "House" | "Land" | "Room" | "Commercial"
   subCategory  : "Apartment / Flat" | "House / Villa" | "Bungalow" | "Townhouse"
                  "Agricultural Land" | "Residential Land" | "Commercial Land"
                  "Room - Living" | "Room - Office" | "Room - Storage"
                  "Shop / Showroom" | "Office Space" | "Warehouse" | "Restaurant Space"
   category     : legacy field — "Residential" | "Commercial" | "Agricultural" | "House" | ""
   ───────────────────────────────────────────────────────────────── */

/* ── Intent detection — triggers a DB search ───────────────── */
const SEARCH_INTENT_REGEX =
  /\b(find|search|looking for|want|need|show|any|available|list|suggest|recommend|give me|is there|are there|rent|buy|sale|lease|purchase|flat|apartment|room|house|office|shop|land|khet|pasal|ghar|kotha|bhada|property|properties|listing|listings|real estate|kathmandu|pokhara|chitwan|lalitpur|bhaktapur|butwal|biratnagar|birgunj|dharan|hetauda|nepalgunj|thamel|jhamsikhel|lazimpat|kirtipur|balkhu|lakeside|birauta|narayanghat|bharatpur|bhairahawa|damak|itahari|jhapa|rupandehi|nawalpur|sunsari|morang|banke|kavrepalanchok|sindhupalchok|dhading|nuwakot|makwanpur|baglung|parbat|gulmi|palpa|syangja|tanahun|gorkha|lamjung|bardiya|surkhet|dailekh|salyan|rukum|rolpa|pyuthan|naxal|kapan|mandikhatar|birtamode|nagarkot|patan|ekatabhasti)\b/i;

/* ── Follow-up intent ───────────────────────────────────────── */
const FOLLOWUP_INTENT_REGEX =
  /\b(more|another|other|different|cheaper|expensive|bigger|smaller|show more|any more|anything else|other options|alternatives|similar|nearby|close to|around|within)\b/i;

/* ── Parse budget ceiling from natural language ─────────────── */
function parseBudgetCeiling(message) {
  const patterns = [
    /(?:under|below|max|maximum|less than|upto|up to|within)\s*(?:rs\.?\s*)?(\d[\d,]*)\s*(k|thousand|lakh)?/i,
    /(?:rs\.?\s*)?(\d[\d,]*)\s*(k|thousand|lakh)?\s*(?:budget|max|maximum|or less|and below)/i,
    /budget\s*(?:of|is|:)?\s*(?:rs\.?\s*)?(\d[\d,]*)\s*(k|thousand|lakh)?/i,
  ];
  for (const pat of patterns) {
    const m = message.match(pat);
    if (m) {
      let val = parseInt(m[1].replace(/,/g, ""), 10);
      const unit = (m[2] || "").toLowerCase();
      if (unit === "k" || unit === "thousand") val *= 1000;
      if (unit === "lakh") val *= 100000;
      if (val > 0) return val;
    }
  }
  return null;
}

/* ── Map user intent → actual DB mainCategory + subCategory ─── */
function mapToDbCategories(lower) {
  const mainCats = new Set();
  const subCats  = new Set();

  // House / flat / apartment / villa / bungalow
  if (/\b(house|ghar|villa|bungalow|townhouse|home)\b/.test(lower)) {
    mainCats.add("House");
    if (/\b(villa)\b/.test(lower))     subCats.add("House / Villa");
    if (/\b(bungalow)\b/.test(lower))  subCats.add("Bungalow");
    if (/\b(townhouse)\b/.test(lower)) subCats.add("Townhouse");
    if (!subCats.size) subCats.add("House / Villa"); // default
  }
  if (/\b(flat|apartment|bhk|1bhk|2bhk|3bhk)\b/.test(lower)) {
    mainCats.add("House");
    subCats.add("Apartment / Flat");
  }

  // Room / kotha
  if (/\b(room|kotha|single room|double room)\b/.test(lower)) {
    mainCats.add("Room");
    if (/\b(office)\b/.test(lower))  subCats.add("Room - Office");
    else if (/\b(storage|store)\b/.test(lower)) subCats.add("Room - Storage");
    else subCats.add("Room - Living");
  }

  // Land / khet
  if (/\b(land|khet|plot|agricultural|farming|farm|agri|residential land|commercial land)\b/.test(lower)) {
    mainCats.add("Land");
    if (/\b(agri|agricultural|farming|farm|khet|crop)\b/.test(lower)) subCats.add("Agricultural Land");
    else if (/\b(commercial)\b/.test(lower)) subCats.add("Commercial Land");
    else subCats.add("Residential Land");
  }

  // Commercial / office / shop
  if (/\b(commercial|office|shop|pasal|showroom|warehouse|restaurant|store)\b/.test(lower)) {
    mainCats.add("Commercial");
    if (/\b(office)\b/.test(lower))      subCats.add("Office Space");
    if (/\b(shop|showroom|pasal)\b/.test(lower)) subCats.add("Shop / Showroom");
    if (/\b(warehouse|storage)\b/.test(lower))   subCats.add("Warehouse");
    if (/\b(restaurant)\b/.test(lower))  subCats.add("Restaurant Space");
  }

  return { mainCats: [...mainCats], subCats: [...subCats] };
}

/* ── Extract locations from message ────────────────────────── */
function extractLocations(lower) {
  const locationList = [
    "kathmandu","pokhara","chitwan","lalitpur","bhaktapur","butwal","biratnagar",
    "birgunj","dharan","hetauda","nepalgunj","thamel","jhamsikhel","lazimpat",
    "kirtipur","balkhu","lakeside","birauta","narayanghat","bharatpur","bhairahawa",
    "damak","itahari","jhapa","rupandehi","nawalpur","sunsari","morang","banke",
    "kavrepalanchok","sindhupalchok","dhading","nuwakot","makwanpur","baglung",
    "parbat","gulmi","palpa","syangja","tanahun","gorkha","lamjung","bardiya",
    "surkhet","dailekh","salyan","rukum","rolpa","pyuthan","naxal","kapan",
    "mandikhatar","birtamode","nagarkot","patan","ekatabhasti","ktm","sukedhara",
  ];
  const found = locationList.filter(loc => lower.includes(loc));
  // "ktm" and "kathmandu" are the same — normalise
  if (found.includes("ktm") && !found.includes("kathmandu")) found.push("kathmandu");
  return [...new Set(found)];
}

/* ── Smart DB search ──────────────────────────────────────────── */
async function searchDatabase(message, conversationContext = "") {
  try {
    const fullContext = (conversationContext + " " + message).trim();
    const lower = fullContext.toLowerCase();

    const locations = extractLocations(lower);
    const { mainCats, subCats } = mapToDbCategories(lower);
    const budget = parseBudgetCeiling(fullContext);

    // Build OR clauses
    const orClauses = [];

    // Location matching — search across ALL location-related fields + title + description
    // because many old listings only have location in the free-text "location" field or title
    if (locations.length > 0) {
      locations.forEach(loc => {
        // "kathmandu" should also match "Ktm" in location strings
        const pattern = loc === "kathmandu" ? "kathmandu|ktm" : loc;
        const r = new RegExp(pattern, "i");
        orClauses.push(
          { location: r },
          { city: r },
          { district: r },
          { province: r },
          { title: r },
          { description: r }
        );
      });
    }

    // Category matching — check mainCategory, subCategory, AND legacy "category" field
    if (mainCats.length > 0) {
      mainCats.forEach(mc => {
        const r = new RegExp(`^${mc}$`, "i");
        orClauses.push({ mainCategory: r }, { category: r });
      });
    }
    if (subCats.length > 0) {
      subCats.forEach(sc => {
        const r = new RegExp(sc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        orClauses.push({ subCategory: r });
      });
    }

    // Legacy category field mappings — many old listings use these values
    if (/\b(land|khet|plot|farm|agri)\b/.test(lower)) {
      orClauses.push(
        { category: /residential/i },   // "Residential" land listings
        { category: /agricultural/i },
        { title: /\bland\b/i },          // title contains "land"
        { title: /\bfarm\b/i },
      );
    }
    if (/\b(house|flat|apartment|ghar|bhk)\b/.test(lower)) {
      orClauses.push({ category: /residential/i }, { category: /house/i });
    }
    if (/\b(shop|office|commercial|pasal)\b/.test(lower)) {
      orClauses.push({ category: /commercial/i });
    }

    // Build base query
    const baseQuery = { status: "approved", available: true };
    if (orClauses.length > 0) baseQuery.$or = orClauses;
    if (budget) baseQuery.price = { $lte: budget };

    let results = await Land.find(baseQuery)
      .sort({ featured: -1, createdAt: -1 })
      .limit(6)
      .select("title location city district province price category mainCategory subCategory image description areaSize featured _id");

    let fallback = false;

    // Fallback 1: drop budget constraint if no results
    if (results.length === 0 && budget) {
      const noBudgetQuery = { status: "approved", available: true };
      if (orClauses.length > 0) noBudgetQuery.$or = orClauses;
      results = await Land.find(noBudgetQuery)
        .sort({ featured: -1, createdAt: -1 })
        .limit(6)
        .select("title location city district province price category mainCategory subCategory image description areaSize featured _id");
      if (results.length > 0) fallback = true;
    }

    // Fallback 2: drop category, keep only location
    if (results.length === 0 && locations.length > 0) {
      const locOnlyOr = [];
      locations.forEach(loc => {
        const r = new RegExp(loc === "ktm" ? "kathmandu|ktm" : loc, "i");
        locOnlyOr.push({ location: r }, { city: r }, { district: r }, { title: r });
      });
      results = await Land.find({ status: "approved", available: true, $or: locOnlyOr })
        .sort({ featured: -1, createdAt: -1 })
        .limit(6)
        .select("title location city district province price category mainCategory subCategory image description areaSize featured _id");
      if (results.length > 0) fallback = true;
    }

    // Fallback 3: drop location, keep only category
    if (results.length === 0 && (mainCats.length > 0 || subCats.length > 0)) {
      const catOnlyOr = [];
      mainCats.forEach(mc => catOnlyOr.push({ mainCategory: new RegExp(`^${mc}$`, "i") }, { category: new RegExp(`^${mc}$`, "i") }));
      subCats.forEach(sc => catOnlyOr.push({ subCategory: new RegExp(sc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }));
      if (catOnlyOr.length > 0) {
        results = await Land.find({ status: "approved", available: true, $or: catOnlyOr })
          .sort({ featured: -1, createdAt: -1 })
          .limit(6)
          .select("title location city district province price category mainCategory subCategory image description areaSize featured _id");
        if (results.length > 0) fallback = true;
      }
    }

    // Fallback 4: show latest listings if still nothing
    if (results.length === 0) {
      results = await Land.find({ status: "approved", available: true })
        .sort({ featured: -1, createdAt: -1 })
        .limit(4)
        .select("title location city district province price category mainCategory subCategory image description areaSize featured _id");
      fallback = results.length > 0;
    }

    return { found: results.length > 0, results, fallback };
  } catch (err) {
    console.error("DB search error:", err.message);
    return { found: false, results: [], fallback: false };
  }
}

/* ── Build rich context string for the AI ───────────────────── */
function buildDbContext(found, results, fallback) {
  if (!found) {
    return `\n\nDB_SEARCH_RESULTS: NOTHING FOUND. We do not have that type of property in our database right now. You MUST say "We don't have that in our database right now." You MUST NOT mention or suggest any other website (no Hamrobazar, no Gharbazar, no realestate.com.np, nothing). Ask the user if they want to try different criteria or browse all available listings on ProperEstate.`;
  }
  const header = fallback
    ? `\n\nDB_SEARCH_RESULTS (closest available listings — exact match not found, showing nearest results):\n`
    : `\n\nDB_SEARCH_RESULTS (LIVE from ProperEstate database):\n`;
  return header + results.map((p, i) => {
    const loc = [p.city, p.district, p.province].filter(Boolean).join(", ") || p.location || "Nepal";
    const type = p.subCategory || p.mainCategory || p.category || "Property";
    const desc = p.description ? " | " + p.description.slice(0, 100).replace(/\n/g, " ") + "…" : "";
    const badge = p.featured ? " ⭐" : "";
    return `${i + 1}.${badge} "${p.title}" — ${loc} | Rs.${parseInt(p.price || 0).toLocaleString()} | ${type} | Area: ${p.areaSize || "N/A"}${desc} | ID: ${p._id}`;
  }).join("\n");
}

/* ── System prompt ──────────────────────────────────────────── */
const SYSTEM_PROMPT = `You are ProperAgent, a smart and friendly AI assistant for ProperEstate — Nepal's broker-free real estate platform.

PERSONALITY: Warm, helpful, conversational. Talk like a knowledgeable friend, not a robot.

PROPERTY CATEGORIES ON THIS PLATFORM:
- House → sub-types: "Apartment / Flat", "House / Villa", "Bungalow", "Townhouse"
- Land → sub-types: "Agricultural Land", "Residential Land", "Commercial Land"
- Room → sub-types: "Room - Living", "Room - Office", "Room - Storage"
- Commercial → sub-types: "Shop / Showroom", "Office Space", "Warehouse", "Restaurant Space"

NEPAL RENTAL PRICES (2025 reference):
- Kathmandu: Room Rs.6k-18k/mo, Apartment/Flat Rs.15k-50k/mo, House Rs.25k-80k/mo, Office Rs.40-150/sqft/mo
- Pokhara: Room Rs.5k-12k/mo, Flat Rs.12k-35k/mo
- Chitwan: Room Rs.4k-9k/mo, Flat Rs.10k-22k/mo
- Butwal/Bhairahawa: Room Rs.3.5k-8k/mo, Flat Rs.8k-18k/mo
- Biratnagar: Room Rs.4k-10k/mo, Flat Rs.10k-22k/mo

PLATFORM INFO: ProperEstate is 100% broker-free. Buyers pay Rs.5000 eSewa deposit. Sellers need ID + admin approval.

NEPALI TERMS: kotha=room, ghar=house, khet=agri land, pasal=shop, bhada=rent.

STRICT RULES — FOLLOW EXACTLY:
1. When DB_SEARCH_RESULTS has listings → present them clearly. Mention price, location, type. Tell user the cards below are clickable.
2. When DB_SEARCH_RESULTS says "closest available" → be honest: say exact match wasn't found, these are the closest we have, ask if they want to refine.
3. When DB_SEARCH_RESULTS says "NOTHING FOUND" → say exactly "We don't have that in our database right now." Then ask if they want to try different criteria. NEVER EVER suggest Hamrobazar, Gharbazar, realestate.com.np, Saugat Homes, or ANY other website. This is a hard rule with no exceptions.
4. NEVER mention any external website under any circumstances. Only ProperEstate.
5. For casual chat → answer naturally without forcing real estate.
6. Always end with a helpful follow-up question or next step.
7. Keep replies under 250 words. Use bullet points for property lists.`;

/* ── Controller ─────────────────────────────────────────────── */
const aiAdvisor = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, reply: "No messages provided." });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, reply: "AI service is not configured." });
    }

    const lastMessage = messages[messages.length - 1].content || "";

    // Collect recent user messages for follow-up context
    const recentUserMessages = messages
      .filter(m => m.role === "user")
      .slice(-5)
      .map(m => m.content)
      .join(" ");

    const isFollowUp = FOLLOWUP_INTENT_REGEX.test(lastMessage) && recentUserMessages.length > 15;
    const shouldSearch = SEARCH_INTENT_REGEX.test(lastMessage) || isFollowUp;

    let dbContext = "";
    let dbResults = [];

    if (shouldSearch) {
      const searchText = isFollowUp && !SEARCH_INTENT_REGEX.test(lastMessage)
        ? recentUserMessages
        : lastMessage;

      const { found, results, fallback } = await searchDatabase(
        searchText,
        isFollowUp ? recentUserMessages : ""
      );
      dbResults = results;
      dbContext = buildDbContext(found, results, fallback);
    }

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT + dbContext },
        ...messages.slice(-14),
      ],
      max_tokens: 650,
      temperature: 0.65,
    });

    const rawReply = completion.choices[0]?.message?.content
      || "I couldn't generate a response. Please try again.";

    // Hard filter — strip any external site suggestions the LLM might still include
    const BANNED_SITES = [
      /hamrobazar\.com/gi, /gharbazar\.com/gi, /realestate\.com\.np/gi,
      /saugathomes\.com/gi, /saugat homes/gi,
      // Remove bullet lines that mention these sites
      /[•\-\*]\s*.*?(hamrobazar|gharbazar|realestate\.com\.np|saugat homes).*?\n?/gi,
    ];
    let reply = rawReply;
    BANNED_SITES.forEach(pat => { reply = reply.replace(pat, ""); });
    // Clean up any "external websites" / "other websites" sentences left behind
    reply = reply
      .replace(/I can suggest some external websites[^.]*\./gi, "")
      .replace(/You can (also )?try (searching on )?these (external |other )?websites?[^.]*\./gi, "")
      .replace(/Here are some (external |other )?websites?[^:]*:[^]*?(?=\n\n|\n[A-Z]|$)/gi, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    res.json({ success: true, reply, properties: dbResults.slice(0, 4) });

  } catch (err) {
    console.error("❌ Groq API error:", err.message);
    res.status(500).json({
      success: false,
      reply: "Something went wrong. Please try again in a moment.",
    });
  }
};

module.exports = { aiAdvisor };
