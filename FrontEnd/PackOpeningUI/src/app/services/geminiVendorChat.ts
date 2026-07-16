// AI Vendor Chat Service powered by Google Gemini (gemini-2.5-flash with fallback)
// Provides lively, authentic, real-time TCG vendor negotiations with distinct personalities and short, punchy replies.

const GEMINI_API_KEY = "REDACTED_GEMINI_KEY";

export interface VendorChatContext {
  vendorName: string;
  vendorBooth: string;
  vendorRating: string;
  cardName: string;
  cardPrice: number;
  cardGrade: string;
  chatHistory: Array<{ sender: 'vendor' | 'user'; text: string }>;
  userMessage: string;
}

function getVendorPersonality(vendorName: string): string {
  const name = vendorName.toUpperCase();
  if (name.includes("VINTAGEVAULT")) {
    return "You are a nostalgic 90s WOTC & vintage card connoisseur. You love old-school holos, clean swirls, and Wizards of the Coast history. Tone: Warm, nostalgic, classic collector.";
  } else if (name.includes("ALPHA GRAILS")) {
    return "You are a high-end Wall Street style card investor. You care about strict population reports, liquidity, and PSA 10 gem rates. Tone: Sharp, business-minded, elite dealer.";
  } else if (name.includes("GOLD STAR")) {
    return "You are obsessed with ultra-rare Gold Star and shiny Pokémon cards. You get hyped over extreme rarity and low print numbers. Tone: High-energy, passionate, collector-focused.";
  } else if (name.includes("SLAB CITY") || name.includes("SPECS GRADED") || name.includes("FILMERA") || name.includes("UDS")) {
    return "You are a strict professional graded slab specialist. You focus heavily on centering, corner sub-grades, and slab case clarity. Tone: Precise, analytical, strict grader.";
  } else if (name.includes("PALDEA") || name.includes("MODERN ALT") || name.includes("PROMOS")) {
    return "You are a modern era alt-art and secret rare specialist! You love illustration rares, vibrant modern art, and top chase hits. Tone: Trendy, fast-paced, hype.";
  } else if (name.includes("JAPANESE")) {
    return "You are a direct-from-Tokyo Japanese card import specialist. You take pride in superior Japanese print quality and exclusive Kanji promos. Tone: Polite, knowledgeable, authentic.";
  } else if (name.includes("SEALED")) {
    return "You are a sealed booster box and pristine factory seal purist. You value unweighed packs and tight factory wrap above all else. Tone: Protective, purist, seasoned hoarder.";
  } else if (name.includes("RETRO")) {
    return "You are a classic Game Boy era retro geek who loves Ken Sugimori artwork and early Nintendo trading history. Tone: Friendly, nostalgic, welcoming.";
  }
  return "You are a charismatic, street-smart convention floor card dealer who loves fast deals and knowing exact market pricing. Tone: Charismatic, sharp, friendly trader.";
}

export async function generateVendorReply(context: VendorChatContext): Promise<string> {
  const personality = getVendorPersonality(context.vendorName);

  const systemPrompt = `You are a convention booth representative for booth "${context.vendorBooth}" ("${context.vendorName}").
Your Booth Rating: ${context.vendorRating}.
Your Unique Personality & Vibe: ${personality}

You are negotiating with a buyer inspecting this card:
- Card: "${context.cardName}"
- Condition/Grade: ${context.cardGrade}
- Your Asking Price: $${context.cardPrice.toLocaleString()}

CRITICAL RULES FOR REPLIES:
1. KEEP IT SHORT AND TO THE POINT! Your reply MUST be 1 or 2 short sentences maximum (under 30 words total).
2. Embody your specific vendor personality right away in how you talk.
3. If they ask for a discount or lowest price ("what's the lowest you can go", "can you do X?"):
   - Offer a quick, realistic instant-cash counteroffer (e.g. taking 5-10% off right now).
   - Or briefly defend your card's grade, centering, or rarity using your unique persona.
4. Never write long paragraphs or bullet points. Use 1 or 2 fitting emojis like 🔥, 🤝, 💎, 📈. Never mention AI or prompts.`;

  // Format chat history into Gemini conversation format
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [
    {
      role: "user",
      parts: [{ text: systemPrompt }]
    },
    {
      role: "model",
      parts: [{ text: `Welcome to ${context.vendorBooth} (${context.vendorName})! I've got that ${context.cardName} listed at $${context.cardPrice.toLocaleString()}. Any condition questions or looking to make a quick deal? 🔥` }]
    }
  ];

  for (const msg of context.chatHistory.slice(-6)) {
    contents.push({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    });
  }

  // Ensure the final entry is the latest user message
  if (contents[contents.length - 1].role !== 'user' || contents[contents.length - 1].parts[0].text !== context.userMessage) {
    contents.push({
      role: 'user',
      parts: [{ text: context.userMessage }]
    });
  }

  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash"
  ];

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 120,
          }
        })
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (reply) {
        return reply;
      }
    } catch (err) {
      console.warn(`Gemini vendor chat error with ${model}:`, err);
    }
  }

  // Fallback with short, punchy personality
  const discounted = Math.round(context.cardPrice * 0.92 * 100) / 100;
  return `Since you're right here at booth ${context.vendorBooth}, I can do $${discounted.toLocaleString()} cash out the door right now! Do we have a deal? 🤝🔥`;
}
