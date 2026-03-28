import axios from 'axios';

export interface Collectible {
  id: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: string;
  imageUrl?: string;
  rarity?: string;
}

/**
 * コレクティブルデータ取得クライアント
 * ポケモンカード・スニーカーの高額取引データを取得
 * フォールバック：モックデータを使用
 */

const MOCK_POKEMON_CARDS: Collectible[] = [
  { id: 'pokemon-1', name: 'Charizard Holographic 1st Edition', price: 15000, change: 500, changePercent: 3.45, type: 'pokemon-card', rarity: 'Rare Holo' },
  { id: 'pokemon-2', name: 'Blastoise Holographic 1st Edition', price: 8500, change: 200, changePercent: 2.40, type: 'pokemon-card', rarity: 'Rare Holo' },
  { id: 'pokemon-3', name: 'Venusaur Holographic 1st Edition', price: 7200, change: 150, changePercent: 2.12, type: 'pokemon-card', rarity: 'Rare Holo' },
  { id: 'pokemon-4', name: 'Mewtwo Holographic 1st Edition', price: 12000, change: 300, changePercent: 2.56, type: 'pokemon-card', rarity: 'Rare Holo' },
  { id: 'pokemon-5', name: 'Dragonite Holographic 1st Edition', price: 6800, change: 100, changePercent: 1.49, type: 'pokemon-card', rarity: 'Rare Holo' },
];

const MOCK_SNEAKERS: Collectible[] = [
  { id: 'sneaker-1', name: 'Nike Air Jordan 1 Retro High OG Chicago', price: 2500, change: 50, changePercent: 2.04, type: 'sneaker', rarity: 'Limited' },
  { id: 'sneaker-2', name: 'Adidas Yeezy 350 Boost V2 Zebra', price: 1800, change: 30, changePercent: 1.69, type: 'sneaker', rarity: 'Limited' },
  { id: 'sneaker-3', name: 'Nike SB Dunk Low Pro Travis Scott', price: 3200, change: 80, changePercent: 2.56, type: 'sneaker', rarity: 'Limited' },
  { id: 'sneaker-4', name: 'Yeezy Foam Runner Onyx', price: 950, change: 20, changePercent: 2.15, type: 'sneaker', rarity: 'Limited' },
  { id: 'sneaker-5', name: 'New Balance 990v3 Stray Rats', price: 1400, change: 25, changePercent: 1.82, type: 'sneaker', rarity: 'Limited' },
];

export async function getPokemonCards(): Promise<Collectible[]> {
  try {
    // Try TCGPlayer API
    const response = await axios.get(
      'https://api.tcgplayer.com/v1/products',
      {
        params: {
          q: 'pokemon',
          sort: 'price_desc',
          limit: 5,
        },
        timeout: 3000,
      }
    );

    const cards: Collectible[] = [];
    const results = response.data?.results || [];

    for (const card of results.slice(0, 5)) {
      cards.push({
        id: `pokemon-${card.productId}`,
        name: card.name || 'Unknown Card',
        price: card.lowestPrice || 0,
        change: 0,
        changePercent: 0,
        type: 'pokemon-card',
        imageUrl: card.image,
        rarity: card.rarity || 'Unknown',
      });
    }

    return cards.length > 0 ? cards : MOCK_POKEMON_CARDS;
  } catch (error) {
    console.log('[PokemonCards] API 取得失敗、モックデータを使用:', error);
    return MOCK_POKEMON_CARDS;
  }
}

export async function getSneakers(): Promise<Collectible[]> {
  try {
    // Try StockX API
    const response = await axios.get(
      'https://api.stockx.com/api/v2/products',
      {
        params: {
          sort: 'price_desc',
          limit: 5,
          category: 'sneakers',
        },
        timeout: 3000,
      }
    );

    const sneakers: Collectible[] = [];
    const results = response.data?.data || [];

    for (const sneaker of results.slice(0, 5)) {
      sneakers.push({
        id: `sneaker-${sneaker.id}`,
        name: sneaker.name || 'Unknown Sneaker',
        price: sneaker.lastSale?.price || 0,
        change: 0,
        changePercent: 0,
        type: 'sneaker',
        imageUrl: sneaker.image?.imageUrl,
        rarity: 'Limited',
      });
    }

    return sneakers.length > 0 ? sneakers : MOCK_SNEAKERS;
  } catch (error) {
    console.log('[Sneakers] API 取得失敗、モックデータを使用:', error);
    return MOCK_SNEAKERS;
  }
}
