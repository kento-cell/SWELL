import { describe, it, expect, beforeEach, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PREMIUM_PRODUCT_ID,
  getPremiumStatus,
  purchasePremium,
  cancelSubscription,
  getAvailableProducts,
} from '../in-app-purchase';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe('In-App Purchase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct product ID', () => {
    expect(PREMIUM_PRODUCT_ID).toBe('swell_premium_monthly');
  });

  it('should return available products', async () => {
    const products = await getAvailableProducts();
    expect(products.length).toBe(1);
    expect(products[0].productId).toBe(PREMIUM_PRODUCT_ID);
    expect(products[0].price).toBe('480');
    expect(products[0].currency).toBe('JPY');
  });

  it('should purchase premium subscription', async () => {
    const result = await purchasePremium();
    expect(result).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('should cancel subscription', async () => {
    const result = await cancelSubscription();
    expect(result).toBe(true);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('premium_subscription');
  });

  it('should handle purchase errors gracefully', async () => {
    vi.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('Storage error'));
    const result = await purchasePremium();
    expect(result).toBe(false);
  });

  it('should get premium status from storage', async () => {
    const mockSubscription = {
      isActive: true,
      purchaseDate: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      productId: PREMIUM_PRODUCT_ID,
    };

    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(mockSubscription));

    const status = await getPremiumStatus();
    expect(status).toEqual(mockSubscription);
  });

  it('should return null when no subscription exists', async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);

    const status = await getPremiumStatus();
    expect(status).toBeNull();
  });

  it('should remove expired subscription', async () => {
    const expiredSubscription = {
      isActive: true,
      purchaseDate: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
      expiresAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
      productId: PREMIUM_PRODUCT_ID,
    };

    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(expiredSubscription));

    const status = await getPremiumStatus();
    expect(status).toBeNull();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('premium_subscription');
  });
});
