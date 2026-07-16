import { getCardShowDynamicJapaneseCards } from './scrydex';

export interface AuctionPoolCard {
  name: string;
  price: number;
  color: string;
  title: string;
  img: string;
}

export function getVendorAuctionPools(): { expensive: AuctionPoolCard[]; normal: AuctionPoolCard[] } {
  // Master thematic pools from vendor tables
  const vintageEng = [
    { name: "Charizard Base Set Holo", grade: "PSA 10", price: 12450.0, id: "base1-4", img: "https://images.scrydex.com/pokemon/base1-4/large" },
    { name: "Blastoise 1st Ed Shadowless", grade: "PSA 9", price: 7400.0, id: "base1-2", img: "https://images.scrydex.com/pokemon/base1-2/large" },
    { name: "Lugia 1st Ed Neo Genesis", grade: "PSA 10", price: 18200.0, id: "neo1-9", img: "https://images.scrydex.com/pokemon/neo1-9/large" },
    { name: "Shining Charizard Neo Destiny", grade: "PSA 9", price: 3800.0, id: "neo4-107", img: "https://images.scrydex.com/pokemon/neo4-107/large" },
    { name: "Venusaur 1st Ed Base Set", grade: "PSA 9", price: 2100.0, id: "base1-15", img: "https://images.scrydex.com/pokemon/base1-15/large" },
    { name: "Alakazam Base Set Holo", grade: "PSA 9", price: 340.0, id: "base1-1", img: "https://images.scrydex.com/pokemon/base1-1/large" },
    { name: "Gengar Fossil Holo 1st Ed", grade: "PSA 9", price: 420.0, id: "fo1-5", img: "https://images.scrydex.com/pokemon/fo1-5/large" },
    { name: "Dragonite Fossil Holo", grade: "PSA 9", price: 310.0, id: "fo1-4", img: "https://images.scrydex.com/pokemon/fo1-4/large" },
    { name: "Pikachu E3 Stamp Promo", grade: "PSA 9", price: 185.0, id: "pr-1", img: "https://images.scrydex.com/pokemon/basep-1/large" },
    { name: "Mewtwo Base Set Holo", grade: "PSA 8", price: 120.0, id: "base1-10", img: "https://images.scrydex.com/pokemon/base1-10/large" },
    { name: "Zapdos 1st Ed Fossil Holo", grade: "PSA 9", price: 240.0, id: "fo1-15", img: "https://images.scrydex.com/pokemon/fo1-15/large" },
    { name: "Dark Charizard Team Rocket", grade: "PSA 9", price: 480.0, id: "tr1-4", img: "https://images.scrydex.com/pokemon/tr1-4/large" },
    { name: "Dark Dragonite Team Rocket", grade: "PSA 9", price: 290.0, id: "tr1-5", img: "https://images.scrydex.com/pokemon/tr1-5/large" },
    { name: "Dark Raichu Secret Rare 1st Ed", grade: "PSA 9", price: 360.0, id: "tr1-83", img: "https://images.scrydex.com/pokemon/tr1-83/large" },
    { name: "Sabrina's Gengar Gym Heroes", grade: "PSA 9", price: 340.0, id: "gh1-14", img: "https://images.scrydex.com/pokemon/gh1-14/large" },
    { name: "Blaine's Moltres Gym Heroes", grade: "PSA 9", price: 195.0, id: "gh1-1", img: "https://images.scrydex.com/pokemon/gh1-1/large" },
    { name: "Erika's Venusaur Gym Challenge", grade: "PSA 9", price: 280.0, id: "gc1-4", img: "https://images.scrydex.com/pokemon/gc1-4/large" },
    { name: "Typhlosion 1st Ed Neo Genesis", grade: "PSA 9", price: 680.0, id: "neo1-17", img: "https://images.scrydex.com/pokemon/neo1-17/large" },
    { name: "Pichu 1st Ed Neo Genesis", grade: "PSA 9", price: 220.0, id: "neo1-12", img: "https://images.scrydex.com/pokemon/neo1-12/large" },
    { name: "Shining Mewtwo Neo Destiny", grade: "PSA 9", price: 1150.0, id: "neo4-109", img: "https://images.scrydex.com/pokemon/neo4-109/large" },
    { name: "Shining Celebi Neo Destiny", grade: "PSA 9", price: 540.0, id: "neo4-106", img: "https://images.scrydex.com/pokemon/neo4-106/large" }
  ];

  const vintageJpn = [
    { name: "Japanese Base Charizard (No Rarity)", grade: "PSA 9", price: 3400.0, id: "base1_ja-4", img: "https://images.pokemontcg.io/base1/4_hires.png" },
    { name: "CoroCoro Shining Mew Holo (JPN)", grade: "PSA 10", price: 1650.0, id: "coro_ja-1", img: "https://images.pokemontcg.io/np/47_hires.png" },
    { name: "Japanese Neo 2 Charizard Holo", grade: "PSA 10", price: 890.0, id: "neo2_ja-30", img: "https://images.pokemontcg.io/np/30_hires.png" },
    { name: "Japanese Web Series Gengar Holo", grade: "PSA 10", price: 920.0, id: "fo1_ja-5", img: "https://images.pokemontcg.io/fo1/5_hires.png" },
    { name: "VS Series Lance's Charizard (JPN)", grade: "PSA 10", price: 780.0, id: "base1_ja-4", img: "https://images.pokemontcg.io/base1/4_hires.png" },
    { name: "Japanese e-Series Crystal Charizard", grade: "PSA 9", price: 2650.0, id: "skyridge_ja-146", img: "https://images.pokemontcg.io/ecard3/146_hires.png" },
    { name: "Crystal Ho-Oh e-Series (JPN)", grade: "PSA 9", price: 1120.0, id: "skyridge_ja-149", img: "https://images.pokemontcg.io/ecard3/149_hires.png" },
    { name: "Japanese Vending Series 3 Mewtwo", grade: "PSA 10", price: 340.0, id: "base1_ja-10", img: "https://images.pokemontcg.io/base1/10_hires.png" },
    { name: "Japanese Vending Series 1 Pikachu", grade: "PSA 10", price: 280.0, id: "base1_ja-58", img: "https://images.pokemontcg.io/base1/58_hires.png" },
    { name: "Imakuni's Doduo Vending Promo", grade: "PSA 10", price: 210.0, id: "gym1_ja-112", img: "https://images.pokemontcg.io/gym1/112_hires.png" },
    { name: "GB Dragonite Promo Holo (JPN)", grade: "PSA 10", price: 390.0, id: "fo1_ja-4", img: "https://images.pokemontcg.io/fo1/4_hires.png" },
    { name: "CD Promo Charizard Holo (JPN)", grade: "PSA 10", price: 650.0, id: "base1_ja-4", img: "https://images.pokemontcg.io/base1/4_hires.png" },
    { name: "CD Promo Blastoise Holo (JPN)", grade: "PSA 10", price: 380.0, id: "base1_ja-2", img: "https://images.pokemontcg.io/base1/2_hires.png" },
    { name: "CD Promo Venusaur Holo (JPN)", grade: "PSA 10", price: 360.0, id: "base1_ja-15", img: "https://images.pokemontcg.io/base1/15_hires.png" },
    { name: "Japanese Gym Leader Erika Holo", grade: "PSA 9", price: 145.0, id: "gc1_ja-16", img: "https://images.pokemontcg.io/gym2/16_hires.png" },
    { name: "Kanji Lugia Neo Genesis (JPN)", grade: "PSA 9", price: 420.0, id: "neo1_ja-9", img: "https://images.pokemontcg.io/neo1/9_hires.png" },
    { name: "Japanese Neo Discovery Umbreon Holo", grade: "PSA 9", price: 380.0, id: "neo2_ja-13", img: "https://images.pokemontcg.io/neo2/13_hires.png" },
    { name: "Japanese Blaine's Arcanine Holo", grade: "PSA 9", price: 165.0, id: "gh1_ja-1", img: "https://images.pokemontcg.io/gym1/1_hires.png" }
  ];

  const modernAlt = [
    { name: "Umbreon VMAX Alt Art (Moonbreon)", grade: "PSA 10", price: 1420.0, id: "evs-215", img: "https://images.scrydex.com/pokemon/swsh7-215/large" },
    { name: "Giratina V Alt Art Lost Origin", grade: "PSA 10", price: 650.0, id: "lor-186", img: "https://images.scrydex.com/pokemon/swsh11-186/large" },
    { name: "Rayquaza VMAX Alt Art Evolving Skies", grade: "PSA 10", price: 580.0, id: "evs-218", img: "https://images.scrydex.com/pokemon/swsh7-218/large" },
    { name: "Lugia V Alt Art Silver Tempest", grade: "PSA 10", price: 320.0, id: "sit-186", img: "https://images.scrydex.com/pokemon/swsh12-186/large" },
    { name: "Charizard V Alt Art Brilliant Stars", grade: "PSA 10", price: 240.0, id: "brs-154", img: "https://images.scrydex.com/pokemon/swsh9-154/large" },
    { name: "Sylveon VMAX Alt Art Evolving Skies", grade: "PSA 10", price: 310.0, id: "evs-212", img: "https://images.scrydex.com/pokemon/swsh7-212/large" },
    { name: "Gengar VMAX Alt Art Fusion Strike", grade: "PSA 10", price: 390.0, id: "fst-271", img: "https://images.scrydex.com/pokemon/swsh8-271/large" },
    { name: "Mewtwo V Alt Art Pokemon GO", grade: "PSA 10", price: 110.0, id: "pgo-72", img: "https://images.scrydex.com/pokemon/pgo-72/large" },
    { name: "Espeon VMAX Alt Art Fusion Strike", grade: "PSA 10", price: 290.0, id: "fst-270", img: "https://images.scrydex.com/pokemon/swsh8-270/large" },
    { name: "Leafeon VMAX Alt Art Evolving Skies", grade: "PSA 10", price: 270.0, id: "evs-205", img: "https://images.scrydex.com/pokemon/swsh7-205/large" },
    { name: "Dragonite V Alt Art Evolving Skies", grade: "PSA 10", price: 165.0, id: "evs-192", img: "https://images.scrydex.com/pokemon/swsh7-192/large" },
    { name: "Aerodactyl V Alt Art Lost Origin", grade: "PSA 10", price: 155.0, id: "lor-180", img: "https://images.scrydex.com/pokemon/swsh11-180/large" },
    { name: "Charizard ex SIR Obsidian Flames", grade: "PSA 10", price: 165.0, id: "obf-223", img: "https://images.scrydex.com/pokemon/sv3-223/large" },
    { name: "Mew ex SIR 151", grade: "PSA 10", price: 140.0, id: "meo-205", img: "https://images.scrydex.com/pokemon/sv3pt5-205/large" }
  ];

  const jpnModern = [
    { name: "Japanese Iono SAR (Clay Burst)", grade: "PSA 10", price: 850.0, rawPrice: 240.0, id: "sv2d_ja-96", img: "https://images.scrydex.com/pokemon/sv2d_ja-96/large" },
    { name: "Japanese Miriam SAR (Violet ex)", grade: "PSA 10", price: 340.0, rawPrice: 110.0, id: "sv1v_ja-105", img: "https://images.scrydex.com/pokemon/sv1v_ja-105/large" },
    { name: "Japanese 151 Master Ball Pikachu", grade: "PSA 10", price: 380.0, rawPrice: 135.0, id: "sv3pt5_ja-25", img: "https://images.scrydex.com/pokemon/sv3pt5_ja-25/large" },
    { name: "Japanese 151 Master Ball Gengar", grade: "PSA 10", price: 220.0, rawPrice: 85.0, id: "sv3pt5_ja-94", img: "https://images.scrydex.com/pokemon/sv3pt5_ja-94/large" },
    { name: "Japanese Erika's Invitation SAR (151)", grade: "PSA 10", price: 210.0, rawPrice: 80.0, id: "sv3pt5_ja-206", img: "https://images.scrydex.com/pokemon/sv3pt5_ja-206/large" },
    { name: "Japanese Charizard ex SAR (Ruler)", grade: "PSA 10", price: 240.0, rawPrice: 90.0, id: "sv3_ja-223", img: "https://images.scrydex.com/pokemon/sv3_ja-223/large" },
    { name: "Japanese Mew ex SAR (151 JPN)", grade: "PSA 10", price: 185.0, rawPrice: 65.0, id: "sv3pt5_ja-205", img: "https://images.scrydex.com/pokemon/sv3pt5_ja-205/large" },
    { name: "Japanese Pikachu AR (VSTAR Universe)", grade: "PSA 10", price: 65.0, rawPrice: 24.0, id: "swsh12a_ja-205", img: "https://images.scrydex.com/pokemon/swsh12a_ja-205/large" },
    { name: "Japanese Poncho Pikachu (Charizard X)", grade: "PSA 10", price: 4600.0, rawPrice: 1600.0, id: "swsh12a_ja-262", img: "https://images.scrydex.com/pokemon/swsh12a_ja-262/large" },
    { name: "Japanese Erika's Hospitality SR", grade: "PSA 10", price: 650.0, rawPrice: 220.0, id: "sm12a_ja-190", img: "https://images.scrydex.com/pokemon/sm12a_ja-190/large" },
    { name: "Japanese Mewtwo VSTAR SAR (Universe)", grade: "PSA 10", price: 120.0, rawPrice: 45.0, id: "swsh12a_ja-221", img: "https://images.scrydex.com/pokemon/swsh12a_ja-221/large" },
    { name: "Japanese God Pack Charizard VMAX (Climax)", grade: "PSA 10", price: 210.0, rawPrice: 80.0, id: "swsh8b_ja-260", img: "https://images.scrydex.com/pokemon/swsh8b_ja-260/large" }
  ];

  const tagTeams = [
    { name: "Latios & Latias GX Alt Art", grade: "PSA 10", price: 890.0, id: "sm9-170", img: "https://images.scrydex.com/pokemon/sm9-170/large" },
    { name: "Gengar & Mimikyu GX Alt Art", grade: "PSA 10", price: 450.0, id: "sm9-165", img: "https://images.scrydex.com/pokemon/sm9-165/large" },
    { name: "Magikarp & Wailord GX Alt Art", grade: "PSA 10", price: 380.0, id: "sm9-161", img: "https://images.scrydex.com/pokemon/sm9-161/large" },
    { name: "Charizard & Reshiram GX Alt Art", grade: "PSA 10", price: 310.0, id: "sm10-214", img: "https://images.scrydex.com/pokemon/sm10-214/large" },
    { name: "Mewtwo & Mew GX Alt Art", grade: "PSA 10", price: 280.0, id: "sm11-222", img: "https://images.scrydex.com/pokemon/sm11-222/large" },
    { name: "Arceus & Dialga & Palkia GX Alt Art", grade: "PSA 10", price: 230.0, id: "sm12-221", img: "https://images.scrydex.com/pokemon/sm12-221/large" },
    { name: "Solgaleo & Lunala GX Full Art", grade: "PSA 10", price: 165.0, id: "sm12-216", img: "https://images.scrydex.com/pokemon/sm12-216/large" },
    { name: "Blastoise & Piplup GX Alt Art", grade: "PSA 10", price: 195.0, id: "sm12-215", img: "https://images.scrydex.com/pokemon/sm12-215/large" }
  ];

  const goldStarsEx = [
    { name: "Rayquaza Gold Star Holo Deoxys", grade: "CGC 9.5", price: 9800.0, id: "ex8-107", img: "https://images.scrydex.com/pokemon/ex8-107/large" },
    { name: "Charizard Gold Star Delta Species", grade: "PSA 9", price: 2900.0, id: "ex13-100", img: "https://images.scrydex.com/pokemon/ex13-100/large" },
    { name: "Mew Gold Star Holo Dragon Frontiers", grade: "PSA 9", price: 1250.0, id: "ex15-101", img: "https://images.scrydex.com/pokemon/ex15-101/large" },
    { name: "Pikachu Gold Star Holo Holon Phantoms", grade: "PSA 9", price: 1480.0, id: "ex13-104", img: "https://images.scrydex.com/pokemon/ex13-104/large" },
    { name: "Torchic Gold Star Holo Team Rocket Returns", grade: "PSA 9", price: 1100.0, id: "ex7-108", img: "https://images.scrydex.com/pokemon/ex7-108/large" },
    { name: "Lugia ex Unseen Forces Holo", grade: "PSA 9", price: 890.0, id: "ex10-105", img: "https://images.scrydex.com/pokemon/ex10-105/large" },
    { name: "Mewtwo EX Full Art Secret Rare", grade: "PSA 10", price: 2150.0, id: "xy8-164", img: "https://images.scrydex.com/pokemon/xy8-164/large" },
    { name: "Latias Gold Star Holo Deoxys", grade: "PSA 9", price: 3200.0, id: "ex8-105", img: "https://images.scrydex.com/pokemon/ex8-105/large" },
    { name: "Lillie Full Art Ultra Prism", grade: "PSA 10", price: 3200.0, id: "ulp-151", img: "https://images.scrydex.com/pokemon/sm5-151/large" }
  ];

  const rawBinderSingles = [
    { name: "Pikachu IR Paldea Evolved", grade: "Raw NM", price: 38.0, id: "bgt-1", img: "https://images.scrydex.com/pokemon/sv2-203/large" },
    { name: "Charmander IR 151", grade: "Raw NM", price: 32.0, id: "bgt-2", img: "https://images.scrydex.com/pokemon/sv3pt5-168/large" },
    { name: "Squirtle IR 151", grade: "Raw NM", price: 28.0, id: "bgt-3", img: "https://images.scrydex.com/pokemon/sv3pt5-170/large" },
    { name: "Bulbasaur IR 151", grade: "Raw NM", price: 26.0, id: "bgt-4", img: "https://images.scrydex.com/pokemon/sv3pt5-166/large" },
    { name: "Snorlax IR 151", grade: "Raw NM", price: 24.0, id: "bgt-5", img: "https://images.scrydex.com/pokemon/sv3pt5-181/large" },
    { name: "Japanese 151 Master Ball Eevee", grade: "Raw NM", price: 65.0, id: "bgt-6", img: "https://images.scrydex.com/pokemon/sv2a_ja-133/large" },
    { name: "Japanese 151 Master Ball Dragonite", grade: "Raw NM", price: 75.0, id: "bgt-7", img: "https://images.scrydex.com/pokemon/sv2a_ja-149/large" },
    { name: "Japanese Pikachu AR VSTAR Universe", grade: "Raw NM", price: 42.0, id: "bgt-8", img: "https://images.scrydex.com/pokemon/swsh12a_ja-205/large" },
    { name: "Japanese Kanji Gym Erika Holo", grade: "Raw LP/NM", price: 35.0, id: "bgt-9", img: "https://images.pokemontcg.io/gym2/16_hires.png" },
    { name: "Japanese Vending Series Pikachu", grade: "Raw NM", price: 48.0, id: "bgt-10", img: "https://images.pokemontcg.io/base1/58_hires.png" },
    { name: "Pidgeot ex SIR Obsidian Flames", grade: "Raw NM", price: 15.0, id: "bgt-11", img: "https://images.scrydex.com/pokemon/sv3-225/large" },
    { name: "Glaceon V Alt Art Evolving Skies", grade: "Raw NM", price: 90.0, id: "bgt-13", img: "https://images.scrydex.com/pokemon/swsh7-175/large" },
    { name: "Celebi V Alt Art Fusion Strike", grade: "Raw NM", price: 45.0, id: "bgt-14", img: "https://images.scrydex.com/pokemon/swsh8-245/large" },
    { name: "Japanese VSTAR Universe Mew VMAX SAR", grade: "Raw NM", price: 48.0, id: "bgt-15", img: "https://images.scrydex.com/pokemon/swsh12a_ja-183/large" },
    { name: "1st Ed Base Set Squirtle", grade: "Raw LP/NM", price: 45.0, id: "bgt-16", img: "https://images.pokemontcg.io/base1/63_hires.png" },
    { name: "1st Ed Base Set Charmander", grade: "Raw LP", price: 38.0, id: "bgt-17", img: "https://images.pokemontcg.io/base1/46_hires.png" },
    { name: "Jungle Scyther Holo", grade: "Raw NM", price: 42.0, id: "bgt-18", img: "https://images.pokemontcg.io/ju1/10_hires.png" },
    { name: "Fossil Haunter Holo", grade: "Raw NM", price: 38.0, id: "bgt-19", img: "https://images.pokemontcg.io/fo1/6_hires.png" },
    { name: "Mew ex SIR 151", grade: "Raw NM", price: 85.0, id: "bgt-21", img: "https://images.scrydex.com/pokemon/sv3pt5-205/large" },
    { name: "Zapdos ex SIR 151", grade: "Raw NM", price: 42.0, id: "bgt-22", img: "https://images.scrydex.com/pokemon/sv3pt5-202/large" },
    { name: "Alakazam ex SIR 151", grade: "Raw NM", price: 34.0, id: "bgt-23", img: "https://images.scrydex.com/pokemon/sv3pt5-201/large" },
    { name: "Erika's Invitation SIR 151", grade: "Raw NM", price: 36.0, id: "bgt-24", img: "https://images.scrydex.com/pokemon/sv3pt5-203/large" },
    { name: "Charizard ex SIR Obsidian Flames", grade: "Raw NM", price: 55.0, id: "bgt-25", img: "https://images.scrydex.com/pokemon/sv3-223/large" },
    { name: "Empoleon V Alt Art Battle Styles", grade: "Raw NM", price: 40.0, id: "bgt-27", img: "https://images.scrydex.com/pokemon/swsh5-146/large" },
    { name: "Noivern V Alt Art Evolving Skies", grade: "Raw NM", price: 35.0, id: "bgt-29", img: "https://images.scrydex.com/pokemon/swsh7-196/large" }
  ];

  // Dynamic Japanese vendor catalog (thousands of cards from scrydex cache)
  const dynamicJpn = getCardShowDynamicJapaneseCards(4000);

  const allCombined = [
    ...vintageEng,
    ...vintageJpn,
    ...modernAlt,
    ...jpnModern,
    ...tagTeams,
    ...goldStarsEx,
    ...rawBinderSingles,
    ...dynamicJpn
  ].map((c: any, i: number) => {
    const rawPriceNum = typeof c.price === 'number' ? c.price : (typeof c.rawPrice === 'number' ? c.rawPrice : 45);
    return {
      name: c.name || `Vendor Card #${i + 1}`,
      price: rawPriceNum,
      color: i % 3 === 0 ? "indigo" : i % 3 === 1 ? "emerald" : "amber",
      title: `${c.grade || "Raw NM"} • Vendor Pool`,
      img: c.img || c.images?.large || c.images?.small || "https://images.pokemontcg.io/swsh3/19_hires.png"
    };
  });

  const expensive = allCombined.filter(c => c.price >= 100);
  const normal = allCombined.filter(c => c.price < 100 && c.price > 0);

  return {
    expensive: expensive.length > 0 ? expensive : allCombined,
    normal: normal.length > 0 ? normal : allCombined
  };
}
