// Live Stream Chat Service
// API key loaded from VITE_GEMINI_API_KEY environment variable.

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

export interface StreamChatViewer {
  username: string;
  badge?: string;
  color?: string;
  avatarColor?: string;
}

export interface StreamChatContext {
  activePackName?: string;
  activeUsername?: string;
  userMessage: string;
  chatHistory: Array<{ username: string; message: string }>;
}

const VIEWER_POOL: StreamChatViewer[] = [
  { username: '@PokeKing99', badge: 'BUYER', color: 'text-amber-400', avatarColor: 'from-amber-400 to-orange-500' },
  { username: '@SlabHunter', badge: 'VIP', color: 'text-purple-400', avatarColor: 'from-purple-500 to-indigo-600' },
  { username: '@CharizardGod', badge: 'SUB 12M', color: 'text-red-400', avatarColor: 'from-red-500 to-rose-700' },
  { username: '@Moonbreon99', badge: 'MOD', color: 'text-blue-400', avatarColor: 'from-blue-400 to-cyan-600' },
  { username: '@PackRipperX', badge: 'FAN', color: 'text-emerald-400', avatarColor: 'from-emerald-400 to-teal-600' },
  { username: '@AltArtAddict', badge: 'VIP', color: 'text-pink-400', avatarColor: 'from-pink-500 to-rose-500' },
  { username: '@WotcConnoisseur', badge: 'SUB 24M', color: 'text-yellow-300', avatarColor: 'from-yellow-400 to-amber-600' },
  { username: '@GottaPullEmAll', badge: 'FAN', color: 'text-indigo-400', avatarColor: 'from-indigo-400 to-purple-600' },
];

export function getRandomViewer(): StreamChatViewer {
  return VIEWER_POOL[Math.floor(Math.random() * VIEWER_POOL.length)];
}

const CHAT_TEMPLATES = [
  "LFG!! Rip the next pack!! 🔥🔥🔥",
  "Send luck in the chat boys!! 🙏✨",
  "Host is cooking today 🔴🔥",
  "Is that set tradeable or for shipment?",
  "Pull the Alt Art Umbreon please!! 🌙",
  "What a stream today, chat is moving so fast ⚡",
  "HYPE HYPE HYPE 🎉🎉",
  "GL to whoever is in the queue right now! 🍀",
  "We need a GRAIL hit today!! 👑",
  "Subbed for 6 months, love these live rips! ❤️",
];

export function getRandomStreamMessage(): { viewer: StreamChatViewer; text: string } {
  const viewer = getRandomViewer();
  const text = CHAT_TEMPLATES[Math.floor(Math.random() * CHAT_TEMPLATES.length)];
  return { viewer, text };
}

export async function generateStreamViewerReply(context: StreamChatContext): Promise<{ viewer: StreamChatViewer; text: string }> {
  const viewer = getRandomViewer();
  const packInfo = context.activePackName ? `Current pack on deck: ${context.activePackName}.` : '';
  
  const systemPrompt = `You are an active live stream chatter in a live Pokémon TCG Rip & Ship stream.
Your Twitch/Whatnot username is "${viewer.username}".
${packInfo}
The streamer (HOST 🔴) just said: "${context.userMessage}".

CRITICAL RULES:
- Write ONE short, energetic, casual live stream chat message (3-12 words max).
- Use stream/card community slang (LFG, hype, grail, pull, hit, pack, luck, host, 🔥, ✨, 🙏, 📦).
- Sound like a real live stream viewer in Twitch/Whatnot chat.
- Never act like an AI, customer service, or vendor.
- Keep it natural and fun!`;

  if (GEMINI_API_KEY) {
    const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash"];
    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: context.userMessage }] }],
            generationConfig: { temperature: 0.9, maxOutputTokens: 60 }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (reply) {
            return { viewer, text: reply.replace(/^["']|["']$/g, '') };
          }
        }
      } catch (err) {
        console.warn(`[StreamChat] Gemini ${model} error:`, err);
      }
    }
  }

  // Fallback engine for local AI stream chatter
  const msgLower = context.userMessage.toLowerCase();
  let fallbackText = "LFG!! Let's get some massive hits chat! 🔥";

  if (msgLower.includes("hello") || msgLower.includes("hi") || msgLower.includes("welcome") || msgLower.includes("sup")) {
    fallbackText = `Yo host!! Glad to be on the stream today! 🔥`;
  } else if (msgLower.includes("pack") || msgLower.includes("rip") || msgLower.includes("open")) {
    fallbackText = `RIPP IT!! Let's see that shiny foil tear! 📦⚡`;
  } else if (msgLower.includes("hit") || msgLower.includes("chase") || msgLower.includes("grail")) {
    fallbackText = `Manifesting a secret rare hit right now! 🙏✨`;
  } else if (msgLower.includes("order") || msgLower.includes("buy") || msgLower.includes("queue")) {
    fallbackText = `Queue is moving! Who's pack is next?? 🛒🔥`;
  } else {
    const randomFallbacks = [
      `Chat is hyped today!! 🔥`,
      `Let's gooo Host!! 🔴✨`,
      `Big luck incoming for this stream! 🍀`,
      `W stream as always!! ❤️`,
    ];
    fallbackText = randomFallbacks[Math.floor(Math.random() * randomFallbacks.length)];
  }

  return { viewer, text: fallbackText };
}

export interface CardPullReactionContext {
  cardName: string;
  cardValue: number;
  rarity: string;
  isMostExpensive?: boolean;
  buyerUsername?: string;
}

export async function generateCardPullReaction(context: CardPullReactionContext): Promise<{ viewer: StreamChatViewer; text: string }> {
  const viewer = getRandomViewer();
  const valStr = context.cardValue.toFixed(2);
  const buyer = context.buyerUsername || 'buyer';

  const systemPrompt = `You are a live stream chatter watching a Pokemon TCG Rip & Ship opening stream.
Your Twitch/Whatnot username is "${viewer.username}".
A card was just pulled for customer "${buyer}":
- Card Name: "${context.cardName}"
- Card Price: "$${valStr}"
- Rarity: "${context.rarity}"
- Top Hit of Pack: ${context.isMostExpensive ? 'YES' : 'NO'}

CRITICAL INSTRUCTION:
Write ONE energetic, authentic, real human live chat reaction (3-12 words max).
React directly to the specific card name and price ($${valStr}).
- If price > $40 or Top Hit: be HYPER, scream in caps, hype up the value, call it a GRAIL, tell them to sleeve it immediately!
- If price $10-$40: hype the nice pull, comment on card art or price value, say W pull!
- If price < $10: give a quick casual Twitch chat style reaction.
Use stream slang (LFG, W, SHEESH, Grail, $${valStr}, sleeve it, 🔥, 💰, 📈, 👑, 😱).
Do not use quotes or explanations. Return ONLY the chat message text.`;

  if (GEMINI_API_KEY) {
    const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash"];
    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: `React to pulling ${context.cardName} worth $${valStr}` }] }],
            generationConfig: { temperature: 0.95, maxOutputTokens: 50 }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (reply) {
            return { viewer, text: reply.replace(/^["']|["']$/g, '') };
          }
        }
      } catch (err) {
        console.warn(`[StreamChat] Gemini card reaction error:`, err);
      }
    }
  }

  // Realistic Fallback Engine based on Card Value & Rarity
  const v = context.cardValue;
  const name = context.cardName;

  if (v >= 40 || (context.isMostExpensive && v >= 15)) {
    const grailReactions = [
      `HOLY GRAIL OMG!! ${name} IS $${valStr}!! 😱🔥`,
      `SHEESH!! @${buyer} JUST HIT THE $${valStr} ${name}!! 💰👑`,
      `SLEEVE THAT NOW!! $${valStr} BANGER!! 🛡️⚡`,
      `W IN THE CHAT BOYS!! ${name} GRAIL PULL!! 📈📈`,
      `NO WAY!! $${valStr} ${name}!! BIGGEST HIT OF THE STREAM! 🎉🔥`
    ];
    return { viewer, text: grailReactions[Math.floor(Math.random() * grailReactions.length)] };
  } else if (v >= 10) {
    const midReactions = [
      `Yo nice $${valStr} pull!! ${name} is clean AF ✨`,
      `W hit for @${buyer}! $${valStr} ${name}! 🔥`,
      `That ${name} art goes hard! Solid $${valStr} card 👏`,
      `Let's gooo! $${valStr} ${name} in the pack! 📈`
    ];
    return { viewer, text: midReactions[Math.floor(Math.random() * midReactions.length)] };
  } else if (v >= 2) {
    const minorReactions = [
      `Clean ${name}! ✨`,
      `Solid holo pull, $${valStr} value! 🔥`,
      `We take those! Nice ${name} 🍀`,
      `Not bad at all! Moving up 📈`
    ];
    return { viewer, text: minorReactions[Math.floor(Math.random() * minorReactions.length)] };
  } else {
    const bulkReactions = [
      `Warmup card, real hit incoming! ⚡`,
      `Bulk for the binder! 📦`,
      `Next card is the big hit chat! 🙏`,
      `Send luck for the rare slot! 🍀`
    ];
    return { viewer, text: bulkReactions[Math.floor(Math.random() * bulkReactions.length)] };
  }
}
