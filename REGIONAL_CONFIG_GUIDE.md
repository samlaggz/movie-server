# Regional Provider Configuration Guide

This guide helps you configure your Vega app to automatically download appropriate providers based on user location and language.

## Quick Start

The configuration is available in two formats:
1. **JSON**: `regional-providers.json` - For apps that can parse JSON
2. **TypeScript**: `providers/regionalConfig.ts` - Type-safe with helper functions

## How It Works

```
User Location → Detect Country Code → Get Regional Providers → Download Top 5
     ↓
If no regional providers → Use Global English Providers (fallback)
```

## Configuration Structure

### Regional Provider Object
```typescript
{
  "IN": {
    "name": "India",
    "primaryLanguage": "hi",           // ISO language code
    "languages": ["hi", "en", "ta", "te"],  // Supported languages
    "fallbackRegion": "US",            // Fallback if needed
    "providers": [
      {
        "provider": "world4u",         // Provider value from manifest.json
        "languages": ["hi", "en"],     // Languages this provider supports
        "priority": 10,                // Higher = better (1-10)
        "categories": ["bollywood", "hollywood"],
        "description": "Best for Bollywood..."
      }
    ]
  }
}
```

## Implementation Examples

### Example 1: Basic Usage (JavaScript/React Native)

```javascript
import regionalConfig from './regional-providers.json';

// Get user country code (from device locale or IP geolocation)
const userCountry = 'IN'; // India
const maxProviders = 5;

function getProvidersForRegion(countryCode) {
  const region = regionalConfig.regions[countryCode];
  
  if (!region) {
    // Unknown region - use fallback English providers
    return regionalConfig.fallbackProviders.slice(0, maxProviders);
  }
  
  // Get regional providers sorted by priority
  const providers = region.providers
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxProviders);
  
  // If not enough providers, add fallback
  if (providers.length < maxProviders && region.fallbackRegion) {
    const fallback = regionalConfig.regions[region.fallbackRegion];
    if (fallback) {
      const needed = maxProviders - providers.length;
      providers.push(...fallback.providers.slice(0, needed));
    }
  }
  
  // If still not enough, use global fallback
  if (providers.length < maxProviders) {
    const needed = maxProviders - providers.length;
    providers.push(...regionalConfig.fallbackProviders.slice(0, needed));
  }
  
  return providers;
}

// Usage
const providers = getProvidersForRegion('IN');
console.log(providers);
// Output: [world4u, hdhub4u, kmMovies, filmyfly, moviezwap]
```

### Example 2: TypeScript with Type Safety

```typescript
import { 
  getProvidersForRegion, 
  getProvidersByLanguage,
  getAvailableRegions 
} from './providers/regionalConfig';

// Method 1: By country code
const indianProviders = getProvidersForRegion('IN', 5);
// Returns top 5 providers for India

// Method 2: By language code
const hindiProviders = getProvidersByLanguage('hi', 5);
// Returns all providers that support Hindi

// Method 3: Get available regions for settings
const regions = getAvailableRegions();
// Returns: [{ code: 'IN', name: 'India', primaryLanguage: 'hi' }, ...]
```

### Example 3: React Native Implementation

```typescript
// hooks/useRegionalProviders.ts
import { useState, useEffect } from 'react';
import * as Localization from 'expo-localization'; // or react-native-localize
import regionalConfig from '../regional-providers.json';

export function useRegionalProviders(maxProviders = 5) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState(null);

  useEffect(() => {
    async function loadProviders() {
      try {
        // Get country from device locale
        const locale = Localization.locale; // e.g., "en-IN"
        const countryCode = locale.split('-')[1] || 'US';
        
        // Or get from IP geolocation API
        // const response = await fetch('https://ipapi.co/json/');
        // const { country_code } = await response.json();
        
        const regionConfig = regionalConfig.regions[countryCode];
        
        if (regionConfig) {
          setRegion(regionConfig.name);
          
          // Get top providers
          const sorted = regionConfig.providers
            .sort((a, b) => b.priority - a.priority)
            .slice(0, maxProviders);
            
          // Add fallback if needed
          if (sorted.length < maxProviders && regionConfig.fallbackRegion) {
            const fallback = regionalConfig.regions[regionConfig.fallbackRegion];
            if (fallback) {
              const needed = maxProviders - sorted.length;
              sorted.push(...fallback.providers.slice(0, needed));
            }
          }
          
          // Add global fallback if still not enough
          if (sorted.length < maxProviders) {
            const needed = maxProviders - sorted.length;
            sorted.push(...regionalConfig.fallbackProviders.slice(0, needed));
          }
          
          setProviders(sorted);
        } else {
          // Unknown region - use global English providers
          setRegion('Global (English)');
          setProviders(regionalConfig.fallbackProviders.slice(0, maxProviders));
        }
      } catch (error) {
        console.error('Error loading providers:', error);
        // Fallback to English
        setProviders(regionalConfig.fallbackProviders.slice(0, maxProviders));
      } finally {
        setLoading(false);
      }
    }

    loadProviders();
  }, [maxProviders]);

  return { providers, region, loading };
}

// Usage in component
function ProviderSelector() {
  const { providers, region, loading } = useRegionalProviders(5);

  if (loading) return <ActivityIndicator />;

  return (
    <View>
      <Text>Detected Region: {region}</Text>
      {providers.map(p => (
        <ProviderCard 
          key={p.provider}
          name={p.provider}
          description={p.description}
          languages={p.languages}
        />
      ))}
    </View>
  );
}
```

### Example 4: Download Providers Dynamically

```typescript
// services/providerDownloader.ts

const BASE_URL = 'https://your-provider-server.com/dist';

export async function downloadProviders(providers: string[]) {
  const downloaded = [];
  
  for (const provider of providers) {
    try {
      // Download provider files
      const postsUrl = `${BASE_URL}/${provider}/posts.js`;
      const metaUrl = `${BASE_URL}/${provider}/meta.js`;
      const streamUrl = `${BASE_URL}/${provider}/stream.js`;
      const catalogUrl = `${BASE_URL}/${provider}/catalog.js`;
      const indexUrl = `${BASE_URL}/${provider}/index.js`;
      
      const responses = await Promise.all([
        fetch(indexUrl),
        fetch(postsUrl),
        fetch(metaUrl),
        fetch(streamUrl),
        fetch(catalogUrl),
      ]);
      
      // Check if all successful
      if (responses.every(r => r.ok)) {
        downloaded.push(provider);
        console.log(`✅ Downloaded: ${provider}`);
      } else {
        console.warn(`⚠️ Partial download for: ${provider}`);
      }
    } catch (error) {
      console.error(`❌ Failed to download: ${provider}`, error);
    }
  }
  
  return downloaded;
}

// Usage
async function setupRegionalProviders() {
  const { providers } = useRegionalProviders(5);
  const providerNames = providers.map(p => p.provider);
  
  const downloaded = await downloadProviders(providerNames);
  console.log(`Downloaded ${downloaded.length} providers`);
}
```

## Supported Regions

### 🌏 Asia
- **IN** (India) - Hindi, Tamil, Telugu, Marathi, Gujarati, Punjabi, Bengali
- **PK** (Pakistan) - Urdu, Hindi
- **BD** (Bangladesh) - Bengali, Hindi
- **LK** (Sri Lanka) - Sinhala, Tamil
- **SA** (Saudi Arabia) - Arabic, English
- **AE** (UAE) - Arabic, English, Hindi, Urdu
- **JP** (Japan) - Japanese, English
- **KR** (South Korea) - Korean, English
- **SG** (Singapore) - English, Chinese, Tamil
- **MY** (Malaysia) - Malay, English, Tamil
- **TH** (Thailand) - Thai, English
- **PH** (Philippines) - Tagalog, English
- **ID** (Indonesia) - Indonesian, English

### 🌍 Europe
- **IT** (Italy) - Italian, English
- **ES** (Spain) - Spanish, English (fallback)
- **FR** (France) - French, English (fallback)
- **DE** (Germany) - German, English (fallback)
- **RU** (Russia) - Russian, English (fallback)
- **TR** (Turkey) - Turkish, English (fallback)

### 🌎 Americas
- **US** (United States) - English
- **CA** (Canada) - English, French
- **MX** (Mexico) - Spanish, English
- **BR** (Brazil) - Portuguese, English (fallback)

### 🌍 Africa
- **NG** (Nigeria) - English
- **ZA** (South Africa) - English, Afrikaans

### 🌏 Oceania
- **AU** (Australia) - English
- **GB** (United Kingdom) - English

## Provider Categories by Region

### 🇮🇳 India (Best Providers)
1. **world4u** (Priority 10) - Bollywood, Hollywood, Punjabi, Marathi, Gujarati
2. **hdhub4u** (Priority 10) - South Indian in Hindi, Bollywood
3. **kmMovies** (Priority 9) - Dual audio movies
4. **filmyfly** (Priority 9) - Hollywood in Hindi
5. **moviezwap** (Priority 8) - Telugu, Tamil movies

### 🇺🇸 USA/English (Best Providers)
1. **showbox** (Priority 10) - Best overall English provider
2. **flixhq** (Priority 9) - High quality streams
3. **autoEmbed** (Priority 9) - Multiple sources
4. **vega** (Priority 8) - Netflix/Prime content
5. **drive** (Priority 8) - Direct download links

### 🇯🇵 Japan (Best Providers)
1. **hiAnime** (Priority 10) - Japanese anime
2. **animetsu** (Priority 9) - Anime content
3. **kissKh** (Priority 7) - Asian dramas

## Fallback Chain

```
User Region → Regional Providers → Fallback Region → Global English
     ↓
Example: 
Pakistan (PK) → Urdu/Hindi providers → India (IN) → USA (US)
```

## Customization

### Adding a New Region

```typescript
// In regionalConfig.ts
"NEW": {
  name: "New Country",
  code: "NEW",
  primaryLanguage: "xx",
  secondaryLanguages: ["en"],
  fallbackRegion: "US",
  providers: [
    { provider: "someProvider", languages: ["xx", "en"], priority: 8, categories: ["movies"] }
  ]
}
```

### Adding a Provider to Existing Region

```typescript
// In regional-providers.json
"IN": {
  "providers": [
    // ... existing providers ...
    {
      "provider": "newProvider",
      "languages": ["hi", "en"],
      "priority": 7,
      "categories": ["bollywood", "hollywood"],
      "description": "New provider description"
    }
  ]
}
```

### Adjusting Provider Priority

Higher priority (10 = best) means the provider will be downloaded first:
```json
{
  "provider": "showbox",
  "languages": ["en"],
  "priority": 10,  // Increase to 10 to make it #1
  "categories": ["movies", "tv", "hollywood"]
}
```

## API Reference

### Helper Functions (TypeScript)

```typescript
// Get providers for a specific region
getProvidersForRegion(countryCode: string, maxProviders?: number): ProviderConfig[]

// Get providers by language code
getProvidersByLanguage(languageCode: string, maxProviders?: number): ProviderConfig[]

// Get list of all available regions
getAvailableRegions(): { code: string; name: string; primaryLanguage: string }[]
```

### Language Codes (ISO 639-1)

Common codes used:
- `en` - English
- `hi` - Hindi
- `ta` - Tamil
- `te` - Telugu
- `mr` - Marathi
- `gu` - Gujarati
- `pa` - Punjabi
- `bn` - Bengali
- `ur` - Urdu
- `ar` - Arabic
- `ja` - Japanese
- `ko` - Korean
- `zh` - Chinese
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `ru` - Russian
- `tr` - Turkish

## Best Practices

1. **Cache the configuration** - Don't fetch it on every app launch
2. **Allow manual override** - Let users change their region in settings
3. **Show loading state** - Provider download may take time
4. **Handle failures gracefully** - If download fails, keep existing providers
5. **Update periodically** - Check for new providers monthly
6. **Respect user bandwidth** - Don't auto-download on mobile data
7. **Show region detection** - Display "Detected: India" so users know

## Testing

Test different regions:
```javascript
// Simulate different countries
const testRegions = ['IN', 'US', 'JP', 'SA', 'BR', 'DE'];

testRegions.forEach(region => {
  const providers = getProvidersForRegion(region);
  console.log(`\n${region}:`, providers.map(p => p.provider));
});
```

## Troubleshooting

### Issue: No providers downloaded
- Check if `manifest.json` has the provider files built
- Verify the BASE_URL is correct
- Check network connectivity

### Issue: Wrong region detected
- Allow users to manually select region in settings
- Use IP geolocation as backup
- Store user's preference

### Issue: Regional providers not working
- All providers now have stream validation (filters dead links)
- Check if provider is disabled in manifest.json
- Try fallback English providers

## Files

- `regional-providers.json` - JSON configuration
- `providers/regionalConfig.ts` - TypeScript with types and helpers
- `manifest.json` - Provider list with availability status

---

**Need to add a new region or provider?** 
Edit `regional-providers.json` and submit a PR!
