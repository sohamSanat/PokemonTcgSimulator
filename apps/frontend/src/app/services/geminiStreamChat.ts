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
  { username: '@CardSharkMax', badge: 'SUB 6M', color: 'text-teal-300', avatarColor: 'from-teal-500 to-emerald-600' },
  { username: '@SleeveAndTopload', badge: 'MOD', color: 'text-cyan-400', avatarColor: 'from-cyan-500 to-blue-600' },
  { username: '@PikaChaser_99', badge: 'BUYER', color: 'text-amber-300', avatarColor: 'from-yellow-400 to-orange-600' },
  { username: '@BinderMaster', badge: 'VIP', color: 'text-rose-400', avatarColor: 'from-rose-500 to-pink-600' },
  { username: '@VintageRipsOnly', badge: 'SUB 36M', color: 'text-yellow-400', avatarColor: 'from-amber-500 to-yellow-600' },
  { username: '@GengarLover', badge: 'FAN', color: 'text-purple-300', avatarColor: 'from-purple-600 to-indigo-700' },
  { username: '@CrownZenithKid', badge: 'BUYER', color: 'text-emerald-300', avatarColor: 'from-emerald-500 to-teal-700' },
  { username: '@GrailSeeker_X', badge: 'VIP', color: 'text-fuchsia-400', avatarColor: 'from-fuchsia-500 to-purple-600' }
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

export async function generateMultiViewerCardReaction(context: CardPullReactionContext): Promise<Array<{ viewer: StreamChatViewer; text: string }>> {
  const count = (context.cardValue >= 20 || context.isMostExpensive) ? 4 : (context.cardValue >= 5) ? 3 : 2;
  
  // Select unique viewers from pool
  const shuffled = [...VIEWER_POOL].sort(() => 0.5 - Math.random());
  const chosenViewers = shuffled.slice(0, count);
  
  const valStr = context.cardValue.toFixed(2);
  const buyer = context.buyerUsername || 'buyer';
  const name = context.cardName;

  if (GEMINI_API_KEY) {
    const systemPrompt = `You are simulating 3-4 distinct live chat room viewers watching a Pokemon TCG Rip & Ship live stream.
Viewers in chat: ${chosenViewers.map(v => v.username).join(', ')}.
A card was just pulled for buyer "${buyer}":
- Card Name: "${name}"
- Card Value: "$${valStr}"
- Rarity: "${context.rarity}"
- Top Hit of Pack: ${context.isMostExpensive ? 'YES' : 'NO'}

INSTRUCTION:
Generate EXACTLY ${count} distinct, energetic live stream chat messages, ONE for each viewer.
Each viewer MUST react to a DIFFERENT aspect (e.g. Viewer 1 reacts to card name/shock, Viewer 2 reacts to the $${valStr} price, Viewer 3 hypes @${buyer}, Viewer 4 screams to sleeve/topload it).
Format response strictly as a JSON array of strings:
["Message 1", "Message 2", ...]`;

    const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash"];
    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: `Generate ${count} reactions for pulling ${name} worth $${valStr}` }] }],
            generationConfig: { temperature: 0.95, maxOutputTokens: 160 }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (rawText) {
            const cleanJson = rawText.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed.slice(0, count).map((msg: string, i: number) => ({
                viewer: chosenViewers[i] || chosenViewers[0],
                text: String(msg).replace(/^["']|["']$/g, '')
              }));
            }
          }
        }
      } catch (err) {
        console.warn(`[StreamChat] Gemini multi-reaction error:`, err);
      }
    }
  }

  // Diverse Multi-Viewer Fallback Reaction Generator
  const reactions: Array<{ viewer: StreamChatViewer; text: string }> = [];
  const v = context.cardValue;

  if (v >= 20 || context.isMostExpensive) {
    const angle1 = [
      `HOLY GRAIL OMG!! ${name} PULL IS INSANE 😱🔥`,
      `NO WAY WE JUST PULLED ${name} LIVE!! 🎉🎉`,
      `THAT IS A MASSIVE BANGER PULL!! 💥✨`,
      `CHAT WAKE UP!! ${name} IS ON DECK 👑🔥`
    ];
    const angle2 = [
      `ITS A $${valStr} CARD BRO!! W IN THE CHAT 📈💰`,
      `THAT VALUE IS CRAZY ($${valStr}) 💵✨`,
      `BIG MONEY!! $${valStr} CARD RIGHT THERE 💰💸`,
      `CHECK THE PRICE TCGPLAYER ($${valStr})!! 📈🔥`
    ];
    const angle3 = [
      `@${buyer} IS WINNING TODAY LFG!! 👑🔥`,
      `Congrats @${buyer} huge banger!! 👏❤️`,
      `@${buyer} just made their money back and more!! 🎯💰`,
      `Lucky day for @${buyer}!! 🍀🎉`
    ];
    const angle4 = [
      `SLEEVE AND TOPLOAD THAT IMMEDIATELY HOST 🛡️⚡`,
      `PENNY SLEEVE & RIGID CASE RIGHT NOW 💎`,
      `GET THE ACRYLIC CASE OUT Streamer!! 🛡️🔥`,
      `THAT SLAB IS GOING TO PSA 10 💯📈`
    ];

    const angles = [angle1, angle2, angle3, angle4];
    for (let i = 0; i < count; i++) {
      const pool = angles[i % angles.length];
      const text = pool[Math.floor(Math.random() * pool.length)];
      reactions.push({ viewer: chosenViewers[i], text });
    }
  } else if (v >= 5) {
    const angle1 = [
      `Yo clean ${name} pull!! ✨`,
      `W hit for @${buyer}! Solid card 🔥`,
      `Nice ${name} pull chat! 👏`
    ];
    const angle2 = [
      `Artwork on this ${name} goes so hard 🎨`,
      `$${valStr} value, we take those! 📈`,
      `Solid $${valStr} hit for the binder 📦`
    ];
    const angle3 = [
      `Pack is cooking now boys 🔴⚡`,
      `Keep the luck rolling host! 🍀`,
      `Queue is hyped for the next pack 🔥`
    ];

    const angles = [angle1, angle2, angle3];
    for (let i = 0; i < count; i++) {
      const pool = angles[i % angles.length];
      const text = pool[Math.floor(Math.random() * pool.length)];
      reactions.push({ viewer: chosenViewers[i], text });
    }
  } else {
    const pool = [
      `Clean ${name}! ✨`,
      `Solid hit, $${valStr} value! 🔥`,
      `Moving in the right direction 📈`
    ];
    for (let i = 0; i < count; i++) {
      reactions.push({ viewer: chosenViewers[i], text: pool[i % pool.length] });
    }
  }

  return reactions;
}
