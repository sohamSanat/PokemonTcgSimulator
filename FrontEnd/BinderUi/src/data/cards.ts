export interface PricePoint {
  day: number
  price: number
}

export interface Card {
  id: string
  name: string
  setName: string
  setNumber: string
  rarity: "Common" | "Uncommon" | "Rare" | "Ultra Rare" | "Illustration Rare" | "Special Illustration Rare"
  type: "Fire" | "Water" | "Grass" | "Psychic" | "Lightning" | "Fighting" | "Dragon" | "Colorless"
  currentPrice: number
  priceChange: number
  priceHistory: PricePoint[]
  holofoil: boolean
  imageUrl: string
  favorite: boolean
}

function genPriceHistory(base: number, trend: number): PricePoint[] {
  const points: PricePoint[] = []
  let price = base * (1 - trend * 0.3)
  for (let i = 0; i < 30; i++) {
    price += (Math.random() - 0.42) * base * 0.06 + trend * base * 0.01
    points.push({ day: i + 1, price: Math.max(0.5, +price.toFixed(2)) })
  }
  return points
}

export const CARDS: (Card | null)[] = [
  {
    id: "c1",
    name: "Charizard ex",
    setName: "Obsidian Flames",
    setNumber: "125/197",
    rarity: "Special Illustration Rare",
    type: "Fire",
    currentPrice: 312.50,
    priceChange: 8.4,
    priceHistory: genPriceHistory(290, 0.8),
    holofoil: true,
    imageUrl: "https://images.unsplash.com/photo-1607537183893-e6e7f7e3c9c1?w=300&h=420&fit=crop&auto=format",
    favorite: true,
  },
  {
    id: "c2",
    name: "Pikachu VMAX",
    setName: "Vivid Voltage",
    setNumber: "044/185",
    rarity: "Ultra Rare",
    type: "Lightning",
    currentPrice: 89.99,
    priceChange: 3.2,
    priceHistory: genPriceHistory(85, 0.4),
    holofoil: true,
    imageUrl: "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=300&h=420&fit=crop&auto=format",
    favorite: false,
  },
  {
    id: "c3",
    name: "Mewtwo V-UNION",
    setName: "SWSH Promos",
    setNumber: "SWSH159",
    rarity: "Illustration Rare",
    type: "Psychic",
    currentPrice: 54.00,
    priceChange: -1.8,
    priceHistory: genPriceHistory(58, -0.3),
    holofoil: true,
    imageUrl: "https://images.unsplash.com/photo-1609861406570-d6a80f80a7f8?w=300&h=420&fit=crop&auto=format",
    favorite: true,
  },
  {
    id: "c4",
    name: "Gardevoir ex",
    setName: "Scarlet & Violet",
    setNumber: "086/198",
    rarity: "Special Illustration Rare",
    type: "Psychic",
    currentPrice: 201.00,
    priceChange: 12.1,
    priceHistory: genPriceHistory(175, 1.1),
    holofoil: true,
    imageUrl: "https://images.unsplash.com/photo-1518791841217-8f162f1912da?w=300&h=420&fit=crop&auto=format",
    favorite: false,
  },
  null,
  {
    id: "c6",
    name: "Lugia V",
    setName: "Silver Tempest",
    setNumber: "138/195",
    rarity: "Ultra Rare",
    type: "Colorless",
    currentPrice: 47.50,
    priceChange: -4.3,
    priceHistory: genPriceHistory(52, -0.5),
    holofoil: false,
    imageUrl: "https://images.unsplash.com/photo-1597983073493-88cd7be63b20?w=300&h=420&fit=crop&auto=format",
    favorite: false,
  },
  {
    id: "c7",
    name: "Rayquaza VMAX",
    setName: "Evolving Skies",
    setNumber: "217/203",
    rarity: "Special Illustration Rare",
    type: "Dragon",
    currentPrice: 178.00,
    priceChange: 6.7,
    priceHistory: genPriceHistory(160, 0.9),
    holofoil: true,
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=420&fit=crop&auto=format",
    favorite: true,
  },
  {
    id: "c8",
    name: "Umbreon VMAX",
    setName: "Evolving Skies",
    setNumber: "215/203",
    rarity: "Special Illustration Rare",
    type: "Psychic",
    currentPrice: 256.00,
    priceChange: 2.9,
    priceHistory: genPriceHistory(245, 0.3),
    holofoil: true,
    imageUrl: "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=300&h=420&fit=crop&auto=format",
    favorite: false,
  },
  null,
]

export const BINDERS = [
  { id: "b1", name: "Chase Cards", count: 24, value: 4820 },
  { id: "b2", name: "Charizard Collection", count: 18, value: 5940 },
  { id: "b3", name: "Master Set — SV", count: 266, value: 2310 },
  { id: "b4", name: "Evolving Skies", count: 102, value: 1512 },
]
