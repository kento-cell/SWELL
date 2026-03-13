# Swell App Clips Guide

## Overview

App Clips are lightweight, fast-loading experiences that users can access directly from the lock screen, home screen, or through NFC tags and QR codes on iOS 14+. Swell includes a widget-style App Clip that displays the latest news topics.

## Widget Route

The App Clips widget is located at:
```
app/clips/widget.tsx
```

This route displays:
- Top 3 news topics
- Wave visualization for each topic
- Quick access to full app
- Minimal, fast-loading interface

## Building and Testing

### For iOS (Native Build)

1. **Generate native iOS project:**
   ```bash
   eas build --platform ios --profile preview
   ```

2. **Configure App Clips in Xcode:**
   - Open the generated `.xcworkspace` file
   - Create a new target: File → New → Target → App Clip
   - Set the bundle ID to: `space.manus.swell.Clip`
   - Point the main storyboard to the widget route

3. **Test on device:**
   - Build and run on iOS 14+ device
   - Access via: Settings → Shortcuts → Swell Widget
   - Or scan a QR code linked to the App Clip

### For Web/Preview

The widget is accessible at:
```
https://your-app-url/clips/widget
```

## Implementation Details

### Data Source

The widget uses the same data source manager as the main app:
```typescript
import { getTopicsByCategory } from '@/lib/data-source-manager';

const newsTopics = await getTopicsByCategory('NEWS');
```

### Performance Optimization

- Loads only 3 topics (minimal data)
- Disables wave animations to reduce CPU usage
- Uses AsyncStorage cache for instant load
- 5-minute cache refresh interval

### Styling

The widget uses the Famicom color palette:
- Background: `#1A1A2E` (deep black)
- Text: `#F0F0F0` (off-white)
- Accent: `#E74C3C` (Famicom red)
- Borders: `#3D3D5C` (dark gray)

## Deep Linking

To link directly to the widget from QR codes or NFC:
```
swell://clips/widget
```

Or for specific topics:
```
swell://topic/[topic-id]
```

## Future Enhancements

1. **Interactive Widgets** — Allow users to mark topics as read without opening the app
2. **Multiple Sizes** — Small (2 topics), Medium (3 topics), Large (5 topics)
3. **Custom Refresh** — Allow users to set update frequency (5min, 15min, 30min, 1hour)
4. **Notification Integration** — Send notifications when high-wave topics appear
5. **Siri Shortcuts** — Voice commands to read top topics

## Troubleshooting

### Widget not appearing on home screen
- Ensure iOS 14+ device
- Check that App Clip is properly signed
- Verify bundle ID matches configuration

### Data not updating
- Check internet connection
- Verify data source is set to HackerNews or RSS (not just mock)
- Clear app cache: Settings → General → iPhone Storage → Swell

### Performance issues
- Reduce topic count from 3 to 2
- Disable wave animations
- Increase cache duration to 10 minutes
