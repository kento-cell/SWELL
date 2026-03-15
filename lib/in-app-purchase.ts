import AsyncStorage from '@react-native-async-storage/async-storage';

export const PREMIUM_PRODUCT_ID = 'swell_premium_monthly';

export interface PremiumSubscription {
  isActive: boolean;
  expiresAt?: number;
  purchaseDate?: number;
  productId: string;
}

/**
 * Initialize In-App Purchases
 */
export async function initializeInAppPurchases() {
  try {
    // Check for restored purchases
    await restorePurchases();
    console.log('✓ In-App Purchases initialized');
  } catch (error) {
    console.error('Error initializing In-App Purchases:', error);
  }
}

/**
 * Get available products
 */
export async function getAvailableProducts() {
  try {
    // Return mock product for testing
    return [
      {
        productId: PREMIUM_PRODUCT_ID,
        title: 'Swell Premium Monthly',
        description: 'Unlock all features for 30 days',
        price: '480',
        currency: 'JPY',
      },
    ];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Purchase premium subscription
 * Note: In production, this would integrate with Apple In-App Purchase
 */
export async function purchasePremium(): Promise<boolean> {
  try {
    // Create subscription record
    const subscription: PremiumSubscription = {
      isActive: true,
      purchaseDate: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      productId: PREMIUM_PRODUCT_ID,
    };

    await AsyncStorage.setItem('premium_subscription', JSON.stringify(subscription));
    return true;
  } catch (error) {
    console.error('Error purchasing premium:', error);
    return false;
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<PremiumSubscription | null> {
  try {
    const stored = await AsyncStorage.getItem('premium_subscription');
    if (stored) {
      const subscription: PremiumSubscription = JSON.parse(stored);

      // Check if subscription is still active
      if (subscription.expiresAt && Date.now() > subscription.expiresAt) {
        await AsyncStorage.removeItem('premium_subscription');
        return null;
      }

      return subscription;
    }
    return null;
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return null;
  }
}

/**
 * Get current premium status
 */
export async function getPremiumStatus(): Promise<PremiumSubscription | null> {
  try {
    const stored = await AsyncStorage.getItem('premium_subscription');

    if (!stored) {
      return null;
    }

    const subscription: PremiumSubscription = JSON.parse(stored);

    // Check if subscription is still active
    if (subscription.expiresAt && Date.now() > subscription.expiresAt) {
      await AsyncStorage.removeItem('premium_subscription');
      return null;
    }

    return subscription;
  } catch (error) {
    console.error('Error getting premium status:', error);
    return null;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem('premium_subscription');
    return true;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return false;
  }
}

/**
 * Disconnect In-App Purchases
 */
export async function disconnectInAppPurchases() {
  try {
    console.log('✓ In-App Purchases disconnected');
  } catch (error) {
    console.error('Error disconnecting In-App Purchases:', error);
  }
}
