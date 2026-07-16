// AI Vendor Chat Service powered by Google Gemini (gemini-2.5-flash / gemini-1.5-flash with fallback)
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
1. KEEP IT SHORT AND TO THE POINT! Your reply MUST be 1 or 2 short sentences maximum (under 35 words total).
2. Embody your specific vendor personality right away in how you talk.
3. Directly answer whatever specific question the buyer just asked (for example: if they ask about condition, PSA 9/10 potential, centering, or shipping, answer THAT specifically!).
4. If they ask for a discount ("what's the lowest you can go", "can you do X?"), make a realistic instant-cash counteroffer (e.g. taking 5-10% off right now).
5. Never write long paragraphs or bullet points. Use 1 or 2 fitting emojis like 🔥, 🤝, 💎, 📈. Never mention AI or prompts.`;

  // Build contents with STRICT turn alternation (user -> model -> user -> model) to prevent Gemini API 400 Bad Request errors.
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  // Always start with user turn establishing context
  contents.push({
    role: "user",
    parts: [{ text: `Hi! I am at your booth ${context.vendorBooth} (${context.vendorName}) looking at your ${context.cardName} (Condition: ${context.cardGrade}) listed for $${context.cardPrice.toLocaleString()}. Let's talk!` }]
  });

  // Process recent chat history while ensuring no consecutive duplicate roles (e.g. no model -> model or user -> user)
  for (const msg of context.chatHistory.slice(-8)) {
    const role = msg.sender === 'user' ? 'user' : 'model';
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      // Merge into previous turn of the same role to maintain exact alternation
      contents[contents.length - 1].parts[0].text += `\n\n${msg.text}`;
    } else {
      contents.push({
        role,
        parts: [{ text: msg.text }]
      });
    }
  }

  // Ensure the very last turn is 'user' containing the user's current question
  if (contents.length === 0 || contents[contents.length - 1].role !== 'user') {
    contents.push({
      role: 'user',
      parts: [{ text: context.userMessage }]
    });
  } else if (!contents[contents.length - 1].parts[0].text.includes(context.userMessage)) {
    contents[contents.length - 1].parts[0].text += `\n\n${context.userMessage}`;
  }

  // Try standard v1beta Gemini endpoints
  const modelsToTry = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-2.0-flash-exp",
    "gemini-1.5-pro",
    "gemini-2.5-flash"
  ];

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents,
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 120,
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Gemini API error with model ${model}: status ${response.status}`, errText);
        continue;
      }

      const data = await response.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (reply) {
        return reply;
      }
    } catch (err) {
      console.warn(`Gemini vendor chat fetch error with ${model}:`, err);
    }
  }

  // Intelligent context-aware fallback if all API calls fail (network issue, rate limit, etc.)
  const lowerMsg = context.userMessage.toLowerCase();
  if (lowerMsg.includes("condition") || lowerMsg.includes("psa") || lowerMsg.includes("grade") || lowerMsg.includes("10") || lowerMsg.includes("9") || lowerMsg.includes("art")) {
    return `The condition on this ${context.cardName} is super clean—sharp corners, zero whitening, and strong centering (${context.cardGrade})! Definitely worthy of a PSA 9 or 10 candidate! 🔥💎`;
  }
  if (lowerMsg.includes("ship") || lowerMsg.includes("send") || lowerMsg.includes("pack")) {
    return `We ship everything in top-loaders wrapped in double bubble wrap and rigid boxes right from ${context.vendorName}! Ready to take it home? 📦✨`;
  }
  if (lowerMsg.includes("why") || lowerMsg.includes("real") || lowerMsg.includes("authentic")) {
    return `Every single card in our showcase at ${context.vendorBooth} is 100% verified and authenticated before hitting the convention floor! Guaranteed authentic! ShieldCheck 🛡️`;
  }

  const discounted = Math.round(context.cardPrice * 0.92 * 100) / 100;
  return `Since you're right here at booth ${context.vendorBooth}, I can do $${discounted.toLocaleString()} cash out the door right now! Do we have a deal? 🤝🔥`;
}
