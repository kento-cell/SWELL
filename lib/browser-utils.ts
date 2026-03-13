import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

/**
 * Open a URL in the app's web browser
 * Falls back to system browser on web platform
 */
export async function openInBrowser(url: string): Promise<void> {
  if (!url) {
    console.warn('No URL provided to openInBrowser');
    return;
  }

  // Validate URL format
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.warn('Invalid URL format:', url);
    return;
  }

  try {
    if (Platform.OS === 'web') {
      // On web, open in new tab
      window.open(url, '_blank');
    } else {
      // On native, use expo-web-browser for in-app browser
      await WebBrowser.openBrowserAsync(url);
    }
  } catch (error) {
    console.error('Failed to open URL:', error);
    // Fallback: try to open with system browser
    try {
      if (Platform.OS !== 'web') {
        await WebBrowser.openBrowserAsync(url);
      }
    } catch (fallbackError) {
      console.error('Fallback browser open also failed:', fallbackError);
    }
  }
}

/**
 * Open a URL and return to the app when done (iOS only)
 */
export async function openInBrowserWithReturn(url: string): Promise<void> {
  if (!url) return;

  try {
    if (Platform.OS !== 'web') {
      const result = await WebBrowser.openBrowserAsync(url);
      // result.type: 'opened' | 'dismissed' | 'cancel'
      console.log('Browser result:', result.type);
    } else {
      window.open(url, '_blank');
    }
  } catch (error) {
    console.error('Failed to open URL:', error);
  }
}

/**
 * Share a URL using the system share sheet
 */
export async function shareURL(url: string, title?: string): Promise<void> {
  if (!url) return;

  try {
    if (Platform.OS === 'web') {
      // On web, copy to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        console.log('URL copied to clipboard');
      }
    } else {
      // On native, use native share
      const { Share } = require('react-native');
      await Share.share({
        message: title ? `${title}\n${url}` : url,
        url: url,
        title: title || 'Share',
      });
    }
  } catch (error) {
    console.error('Failed to share URL:', error);
  }
}
