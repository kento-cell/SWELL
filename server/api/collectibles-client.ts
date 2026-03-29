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
 */

export async function getPokemonCards(): Promise<Collectible[]> {
  try {
    // TCGPlayer API - 高額ポケモンカード取得
    const response = await axios.get(
      'https://api.tcgplayer.com/v1/products',
      {
        params: {
          q: 'pokemon charizard holographic',
          sort: 'price_desc',
          limit: 5,
        },
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    const cards: Collectible[] = [];
    const results = response.data?.results || [];

    for (const card of results.slice(0, 5)) {
      if (card.lowestPrice && card.lowestPrice > 0) {
        cards.push({
          id: `pokemon-${card.productId}`,
          name: card.name || 'Unknown Card',
          price: card.lowestPrice,
          change: 0,
          changePercent: 0,
          type: 'pokemon-card',
          imageUrl: card.image,
          rarity: card.rarity || 'Unknown',
        });
      }
    }

    return cards;
  } catch (error) {
    console.error('[PokemonCards] Failed to fetch from TCGPlayer:', error);
    return [];
  }
}

export async function getSneakers(): Promise<Collectible[]> {
  try {
    // StockX API - 限定スニーカー取得
    const response = await axios.get(
      'https://api.stockx.com/api/v2/products',
      {
        params: {
          sort: 'price_desc',
          limit: 5,
          category: 'sneakers',
        },
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    const sneakers: Collectible[] = [];
    const results = response.data?.data || [];

    for (const sneaker of results.slice(0, 5)) {
      if (sneaker.lastSale?.price && sneaker.lastSale.price > 0) {
        sneakers.push({
          id: `sneaker-${sneaker.id}`,
          name: sneaker.name || 'Unknown Sneaker',
          price: sneaker.lastSale.price,
          change: 0,
          changePercent: 0,
          type: 'sneaker',
          imageUrl: sneaker.image?.imageUrl,
          rarity: 'Limited',
        });
      }
    }

    return sneakers;
  } catch (error) {
    console.error('[Sneakers] Failed to fetch from StockX:', error);
    return [];
  }
}

export async function getCollectibles(): Promise<Collectible[]> {
  try {
    const [pokemonCards, sneakers] = await Promise.all([
      getPokemonCards(),
      getSneakers(),
    ]);

    return [...pokemonCards, ...sneakers];
  } catch (error) {
    console.error('[Collectibles] Failed to fetch collectibles:', error);
    return [];
  }
}
