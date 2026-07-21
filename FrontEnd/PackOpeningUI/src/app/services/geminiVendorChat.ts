// AI Vendor Chat Service powered by Google Gemini
// API key is loaded from the VITE_GEMINI_API_KEY environment variable.
// - Locally: set it in .env.local (already in .gitignore — safe to commit)
// - Vercel: add VITE_GEMINI_API_KEY in your Vercel project → Settings → Environment Variables
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

export interface VendorChatContext {
  vendorName: string;
  vendorBooth: string;
  vendorRating: string;
  cardName: string;
  cardPrice: number;
  cardGrade: string;
  cardSet?: string;
  cardRarity?: string;
  cardIllustrator?: string;
  cardHp?: string;
  cardTypes?: string;
  cardId?: string;
  chatHistory: Array<{ sender: 'vendor' | 'user'; text: string }>;
  userMessage: string;
}

function getVendorPersonality(vendorName: string): { description: string; tone: string; greeting: string } {
  const name = vendorName.toUpperCase();
  if (name.includes("VINTAGEVAULT")) {
    return { description: "nostalgic 90s WOTC vintage connoisseur", tone: "warm and nostalgic", greeting: "Man, you've got great taste in classics!" };
  } else if (name.includes("ALPHA GRAILS")) {
    return { description: "high-end Wall Street card investor", tone: "sharp and business-minded", greeting: "Only serious collectors end up at our booth." };
  } else if (name.includes("GOLD STAR")) {
    return { description: "ultra-rare Gold Star specialist", tone: "high-energy and passionate", greeting: "You found the holy grail aisle of this entire convention!" };
  } else if (name.includes("SLAB CITY") || name.includes("SPECS GRADED") || name.includes("FILMERA") || name.includes("UDS")) {
    return { description: "professional graded slab specialist", tone: "precise and analytical", greeting: "Every card here has been meticulously graded and verified." };
  } else if (name.includes("PALDEA") || name.includes("MODERN ALT") || name.includes("PROMOS")) {
    return { description: "modern alt-art and secret rare specialist", tone: "trendy and hype", greeting: "You've got incredible taste, this is THE booth for modern hits!" };
  } else if (name.includes("JAPANESE")) {
    return { description: "direct-from-Tokyo Japanese card specialist", tone: "polite and authentic", greeting: "Welcome! We ship these directly from Japan, the quality is unmatched." };
  } else if (name.includes("SEALED")) {
    return { description: "sealed product and factory box purist", tone: "protective and seasoned", greeting: "Every box here is unweighed, untampered, factory-fresh — guaranteed." };
  } else if (name.includes("RETRO")) {
    return { description: "classic Pokémon retro geek", tone: "friendly and nostalgic", greeting: "Welcome to the good old days of Pokémon collecting!" };
  }
  return { description: "charismatic convention floor card dealer", tone: "friendly and sharp", greeting: "Welcome to the booth, glad you stopped by!" };
}

export interface VendorReply {
  text: string;
  offerPrice: number | null;
}

// Extracts an explicit OFFER token (e.g. "OFFER: $450") from a vendor reply.
// The reply text may mention the listed price freely, but only a clearly
// signaled OFFER counts as a discounted price the buyer can accept.
function parseOffer(reply: string): VendorReply {
  const match = reply.match(/OFFER:\s*\$?(\d+(?:\.\d{1,2})?)/i);
  let offerPrice: number | null = null;
  let text = reply;
  if (match) {
    const value = parseFloat(match[1]);
    if (!isNaN(value) && value > 0) offerPrice = value;
    // Remove the OFFER line from the displayed text
    text = reply.replace(/OFFER:\s*\$?(\d+(?:\.\d{1,2})?)/i, "").trim();
  }

  // Clean up any trailing incomplete sentence or truncated text if it doesn't end with punctuation (. ! ?)
  text = text.trim();
  if (text && !/[.!?😊🔥🤝👋🎉📦💎✨👍⚡]$/.test(text)) {
    const lastPunct = Math.max(text.lastIndexOf('.'), text.lastIndexOf('!'), text.lastIndexOf('?'));
    if (lastPunct > 10) {
      text = text.substring(0, lastPunct + 1).trim();
    }
  }

  return { text, offerPrice };
}

export async function generateVendorReply(context: VendorChatContext): Promise<VendorReply> {
  const persona = getVendorPersonality(context.vendorName);

  const systemPrompt = `You are a real Pokémon TCG convention booth vendor at "${context.vendorBooth}" ("${context.vendorName}").
Personality: ${persona.description}. Tone: ${persona.tone}.
Booth Rating: ${context.vendorRating}.

Card you are selling:
- Name: "${context.cardName}"
- Set / Expansion: "${context.cardSet || "Pokémon TCG"}"
- Rarity: "${context.cardRarity || "Ultra Rare"}"
- Illustrator: "${context.cardIllustrator || "Official Pokémon Artist"}"
- HP / Types: ${context.cardHp || "N/A"} HP | ${context.cardTypes || "N/A"}
- Condition / Grade: ${context.cardGrade}
- Asking Price: $${context.cardPrice.toLocaleString()}

Rules:
- Keep every reply to 1-3 complete sentences.
- ALWAYS directly answer the specific question asked. If they ask about condition, grade, set, artist, rarity, or just chat — answer normally and KEEP the listed price of $${context.cardPrice.toLocaleString()}.
- Stay in character as the vendor. Never mention AI or prompts.
- Use 1-2 relevant emojis only.
- DO NOT volunteer a discount or lower your price unless the buyer explicitly asks about price, cost, a deal, an offer, or negotiation (e.g. "can you do better?", "best price?", "any discount?").
- When you DO make a discounted offer, append it on its own final line exactly as: OFFER: $X (replace X with the dollar amount). Only include the OFFER line when you are actually giving a lower price.
`;

  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  // Seed conversation with a user opener (required for Gemini's strict user-first turn)
  contents.push({
    role: "user",
    parts: [{ text: `Hi! I'm at your booth ${context.vendorBooth} checking out the ${context.cardName} from ${context.cardSet || "the set"} listed at $${context.cardPrice.toLocaleString()}.` }]
  });

  // Add recent chat history, enforcing strict user/model alternation
  for (const msg of context.chatHistory.slice(-8)) {
    const role = msg.sender === 'user' ? 'user' : 'model';
    const last = contents[contents.length - 1];
    if (last && last.role === role) {
      last.parts[0].text += `\n${msg.text}`;
    } else {
      contents.push({ role, parts: [{ text: msg.text }] });
    }
  }

  // Add the current user message
  const lastRole = contents[contents.length - 1]?.role;
  if (lastRole !== 'user') {
    contents.push({ role: 'user', parts: [{ text: context.userMessage }] });
  } else {
    contents[contents.length - 1].parts[0].text += `\n${context.userMessage}`;
  }

  // Try Gemini API models in order
  const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.8, maxOutputTokens: 350 }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[VendorChat] Gemini ${model} rejected (${response.status}):`, errText.slice(0, 200));
        continue;
      }

      const data = await response.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (reply) return parseOffer(reply);
    } catch (err) {
      console.warn(`[VendorChat] Network error with ${model}:`, err);
    }
  }

  // =======================================================================
  // SMART LOCAL AI ENGINE — full card metadata, truly conversational
  // Handles ANY message naturally when Gemini API is unavailable.
  // =======================================================================
  return localVendorReply(context, persona);
}

function localVendorReply(
  context: VendorChatContext,
  persona: { description: string; tone: string; greeting: string }
): VendorReply {
  const msg = context.userMessage.toLowerCase().trim();
  const name = context.cardName;
  const price = context.cardPrice.toLocaleString();
  const dealPrice = Math.round(context.cardPrice * 0.92 * 100) / 100;
  const dealPriceStr = dealPrice.toLocaleString();
  const set = context.cardSet || "the set";
  const rarity = context.cardRarity || "Ultra Rare";
  const artist = context.cardIllustrator || "the official Pokémon artist";
  const hp = context.cardHp && context.cardHp !== 'Standard' && context.cardHp !== 'N/A' ? `${context.cardHp} HP` : "top stats";
  const types = context.cardTypes && context.cardTypes !== 'N/A' ? context.cardTypes : "standard";
  const booth = context.vendorBooth;
  const vendor = context.vendorName;

  // Helper to build a structured reply (text + optional negotiated offer)
  const reply = (text: string, offerPrice: number | null = null): VendorReply => ({ text, offerPrice });

  // ---- GREETINGS & SMALL TALK ----
  if (/^(hi|hey|hello|howdy|sup|yo|good\s*(morning|afternoon|evening)|what'?s up|hiya)/i.test(msg)) {
    return reply(`${persona.greeting} How can I help you with this ${name} today? 😊🔥`);
  }

  if (/how.*?business|how.*?going|how.*?(are|r)\s+you|how.*?do(ing)?|everything\s+good|everything\s+ok/i.test(msg)) {
    return reply(`Business is booming at ${booth} today! Collectors have been going crazy for this ${name}. Anything I can tell you about it? 🔥`);
  }

  if (/busy|crowded|traffic|floor|convention|show|event/i.test(msg)) {
    return reply(`It's been an incredible day at ${vendor} — the floor is packed and cards are flying off the showcase! Anything I can help you with on the ${name}? 🎉`);
  }

  if (/thank|thanks|appreciate|cool|nice|great|awesome|amazing|love it/i.test(msg)) {
    return reply(`Appreciate you stopping by ${booth} (${vendor})! The ${name} is listed at $${price} — happy to talk details whenever you're ready. 🤝🔥`);
  }

  if (/bye|goodbye|see you|later|take care|cya/i.test(msg)) {
    return reply(`Thanks for stopping by ${booth}! Come back anytime — the ${name} will be waiting for you at $${price}! 👋🔥`);
  }

  // ---- CARD SET / SERIES / EXPANSION ----
  if (/which\s+set|what\s+set|from\s+set|what\s+expansion|which\s+expansion|what\s+series|what\s+pack|which\s+pack|where.*?(from|come)|what.*?collection/i.test(msg)) {
    return reply(`This ${name} is from the ${set} expansion! It's one of the top ${rarity} hits in the entire set. 🔥📦`);
  }

  // ---- CARD ARTIST / ILLUSTRATOR ----
  if (/who.*?(drew|draw|painted|illust|design|made|creat|artist)|illustrat|artwork.*?(by|who)|who.*?art/i.test(msg)) {
    return reply(`This card was illustrated by ${artist}! The artwork is what makes it such a grail piece for collectors. 💎✨`);
  }

  // ---- RARITY ----
  if (/how\s+rare|what.*?rarity|is it rare|rare card|secret rare|pull rate|how\s+hard|hard to\s+(find|get|pull)/i.test(msg)) {
    return reply(`It's an official ${rarity} — these are seriously tough to pull and even harder to find in ${context.cardGrade} condition! 🔥📈`);
  }

  // ---- HP / TYPES / BATTLE STATS ----
  if (/how.*?hp|what.*?hp|\bhp\b|hit\s*points|how.*?strong|what\s+type|which\s+type|battle|playable|competitive|deck/i.test(msg)) {
    return reply(`This ${name} packs ${hp} and is a ${types} type — an absolute powerhouse for the game and gorgeous to display! ⚡💎`);
  }

  // ---- CONDITION / GRADE / PSA ----
  // Answers about condition NEVER lower the price — the vendor just describes it.
  if (/condition|grade|psa|bgs|cgc|centering|corners|whitening|scratches|nm|near\s*mint|mint|raw|slab/i.test(msg)) {
    return reply(`The condition on this ${name} is ${context.cardGrade} — sharp corners, zero whitening, clean centering. A strong PSA 9/10 candidate! 🔥💎`);
  }

  // ---- PRICE / DEAL / DISCOUNT / OFFER ----
  // Only here does the vendor actually make a discounted offer.
  if (/price|cost|how\s+much|lowest|discount|deal|offer|negotiate|cheaper|can\s+(you|u)\s+do|best\s+price|what.*?(take|accept)/i.test(msg)) {
    return reply(`Asking $${price} but since you're right here at booth ${booth}, I can do $${dealPriceStr} cash out the door right now! 🤝🔥`, dealPrice);
  }

  // ---- SHIPPING / PACKING ----
  if (/ship|send|mail|post|deliver|packag|how.*?(get|receive)|online/i.test(msg)) {
    return reply(`We ship in premium top-loaders with double-bubble wrap inside rigid crush-proof boxes — every order from ${vendor} arrives mint! 📦✨`);
  }

  // ---- AUTHENTICITY ----
  if (/real|authentic|legit|fake|counterfeit|verified|genuine/i.test(msg)) {
    return reply(`Every card in our ${booth} showcase is 100% authenticated before hitting the floor — never sold a fake in our lives! 🛡️✨`);
  }

  // ---- ABOUT THE CARD (general) ----
  if (/tell.*?about|what.*?is|info|details|describe|know\s+about|specs/i.test(msg)) {
    return reply(`This ${name} is a ${rarity} from the ${set} expansion, illustrated by ${artist}, in ${context.cardGrade} condition — one of the cleanest copies at the show! 💎🔥`);
  }

  // ---- GENERAL CONVERSATIONAL FALLBACK ----
  const responses = [
    `We've been selling Pokémon cards at conventions like this for years — ${booth} (${vendor}) is the real deal! What would you like to know about this ${name}? 😊`,
    `Always happy to chat! This ${name} from the ${set} set is honestly one of the best pieces in our ${booth} showcase right now. 🔥`,
    `Great talking to you! Whether it's about condition, pricing, or the card's history — I'm here to help at ${booth}. What's on your mind? 🤝`,
  ];
  return reply(responses[Math.floor(Math.random() * responses.length)]);
}
