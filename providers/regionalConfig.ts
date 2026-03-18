/**
 * Vega Providers Regional Configuration
 * 
 * This file maps providers by region and language for auto-configuration
 * The app can use this to download appropriate providers based on user location
 * 
 * Usage: Import this config and match user locale/region to get provider list
 */

export interface ProviderConfig {
  provider: string;           // Provider value from manifest.json
  languages: string[];        // Supported languages
  priority: number;           // Higher = better (1-10)
  categories: string[];       // Content categories
  description?: string;       // Brief description
}

export interface RegionConfig {
  name: string;               // Region name
  code: string;               // ISO country code or region code
  primaryLanguage: string;    // Primary language code
  secondaryLanguages: string[]; // Other common languages
  providers: ProviderConfig[]; // Provider list for this region (sorted by priority)
  fallbackRegion?: string;    // Fallback region if no providers match
}

// English/Global providers (fallback for all regions)
export const globalEnglishProviders: ProviderConfig[] = [
  { 
    provider: "showbox", 
    languages: ["en"], 
    priority: 10, 
    categories: ["movies", "tv", "hollywood"],
    description: "Best overall English provider"
  },
  { 
    provider: "flixhq", 
    languages: ["en"], 
    priority: 9, 
    categories: ["movies", "tv", "hollywood"],
    description: "High quality streams"
  },
  { 
    provider: "autoEmbed", 
    languages: ["en", "hi"], 
    priority: 9, 
    categories: ["movies", "tv", "hollywood", "multi"],
    description: "Multiple embed sources including Hindicast"
  },
  { 
    provider: "vega", 
    languages: ["en", "hi", "multi"], 
    priority: 8, 
    categories: ["movies", "web-series", "4k"],
    description: "Netflix/Prime content"
  },
  { 
    provider: "primewire", 
    languages: ["en"], 
    priority: 7, 
    categories: ["movies", "tv"],
    description: "Large library"
  },
  { 
    provider: "drive", 
    languages: ["en", "hi", "multi"], 
    priority: 8, 
    categories: ["movies", "direct-download"],
    description: "Direct download links"
  },
];

// Anime providers (for Japan and anime fans)
export const animeProviders: ProviderConfig[] = [
  { 
    provider: "hiAnime", 
    languages: ["ja", "en"], 
    priority: 10, 
    categories: ["anime"],
    description: "Best anime provider"
  },
  { 
    provider: "animetsu", 
    languages: ["ja", "en"], 
    priority: 8, 
    categories: ["anime"],
    description: "Good anime source"
  },
  { 
    provider: "tokyoInsider", 
    languages: ["ja", "en"], 
    priority: 6, 
    categories: ["anime"],
    description: "Anime content"
  },
];

// Regional configurations
export const regionalProviders: Record<string, RegionConfig> = {
  // 🇮🇳 India - Hindi + Regional Languages
  "IN": {
    name: "India",
    code: "IN",
    primaryLanguage: "hi",
    secondaryLanguages: ["en", "ta", "te", "mr", "gu", "pa", "bn"],
    fallbackRegion: "US",
    providers: [
      // Hindi/Bollywood focused
      { 
        provider: "world4u", 
        languages: ["hi", "en", "pa", "mr", "gu"], 
        priority: 10, 
        categories: ["bollywood", "hollywood", "punjabi", "marathi", "gujarati"],
        description: "Best for Bollywood and regional Indian movies"
      },
      { 
        provider: "hdhub4u", 
        languages: ["hi", "en", "ta", "te"], 
        priority: 10, 
        categories: ["bollywood", "south-hindi", "hollywood"],
        description: "South Indian movies in Hindi dubbed"
      },
      { 
        provider: "kmMovies", 
        languages: ["hi", "en"], 
        priority: 9, 
        categories: ["bollywood", "dual-audio"],
        description: "Dual audio movies"
      },
      { 
        provider: "filmyfly", 
        languages: ["hi", "en"], 
        priority: 9, 
        categories: ["hollywood-hindi", "web-series"],
        description: "Hollywood movies in Hindi"
      },
      { 
        provider: "moviezwap", 
        languages: ["te", "ta", "hi", "en"], 
        priority: 8, 
        categories: ["telugu", "tamil", "dubbed"],
        description: "Telugu and Tamil movies"
      },
      { 
        provider: "luxMovies", 
        languages: ["hi", "en"], 
        priority: 8, 
        categories: ["indian", "web-series"],
        description: "Indian web series and movies"
      },
      { 
        provider: "topmovies", 
        languages: ["hi", "en"], 
        priority: 7, 
        categories: ["indian"],
        description: "Indian content"
      },
      { 
        provider: "Joya9tv", 
        languages: ["hi", "en"], 
        priority: 7, 
        categories: ["indian"],
        description: "Indian entertainment"
      },
      { 
        provider: "uhd", 
        languages: ["hi", "en"], 
        priority: 8, 
        categories: ["4k", "dual-audio", "english"],
        description: "4K dual audio movies"
      },
      { 
        provider: "mod", 
        languages: ["hi", "en"], 
        priority: 7, 
        categories: ["web-series", "ott"],
        description: "OTT platform content"
      },
    ]
  },

  // 🇵🇰 Pakistan - Urdu + Hindi
  "PK": {
    name: "Pakistan",
    code: "PK",
    primaryLanguage: "ur",
    secondaryLanguages: ["en", "hi"],
    fallbackRegion: "IN",
    providers: [
      { 
        provider: "world4u", 
        languages: ["hi", "ur", "en"], 
        priority: 10, 
        categories: ["bollywood", "hollywood", "punjabi"],
        description: "Hindi/Urdu content"
      },
      { 
        provider: "hdhub4u", 
        languages: ["hi", "ur", "en"], 
        priority: 9, 
        categories: ["bollywood", "hollywood"],
        description: "Hindi dubbed content"
      },
      { 
        provider: "kmMovies", 
        languages: ["hi", "en"], 
        priority: 8, 
        categories: ["dual-audio"],
        description: "Dual audio"
      },
    ]
  },

  // 🇧🇩 Bangladesh - Bengali
  "BD": {
    name: "Bangladesh",
    code: "BD",
    primaryLanguage: "bn",
    secondaryLanguages: ["en", "hi"],
    fallbackRegion: "IN",
    providers: [
      { 
        provider: "world4u", 
        languages: ["hi", "bn", "en"], 
        priority: 9, 
        categories: ["bollywood", "hollywood"],
        description: "Indian content popular in Bangladesh"
      },
      { 
        provider: "hdhub4u", 
        languages: ["hi", "en"], 
        priority: 8, 
        categories: ["bollywood", "hollywood"],
        description: "Hindi content"
      },
    ]
  },

  // 🇱🇰 Sri Lanka - Sinhala + Tamil
  "LK": {
    name: "Sri Lanka",
    code: "LK",
    primaryLanguage: "si",
    secondaryLanguages: ["ta", "en"],
    fallbackRegion: "IN",
    providers: [
      { 
        provider: "moviezwap", 
        languages: ["ta", "te", "en"], 
        priority: 9, 
        categories: ["tamil", "telugu"],
        description: "Tamil movies"
      },
      { 
        provider: "hdhub4u", 
        languages: ["hi", "en"], 
        priority: 7, 
        categories: ["bollywood", "hollywood"],
        description: "Hindi content"
      },
    ]
  },

  // 🇸🇦 Saudi Arabia / UAE / Middle East - Arabic
  "SA": {
    name: "Saudi Arabia",
    code: "SA",
    primaryLanguage: "ar",
    secondaryLanguages: ["en"],
    fallbackRegion: "US",
    providers: [
      // Mostly English/Hindi fallback as no dedicated Arabic providers
      { 
        provider: "autoEmbed", 
        languages: ["en", "ar"], 
        priority: 8, 
        categories: ["movies", "tv", "multi"],
        description: "Multi-language including Arabic subs"
      },
      { 
        provider: "showbox", 
        languages: ["en"], 
        priority: 7, 
        categories: ["movies", "tv", "hollywood"],
        description: "English content"
      },
    ]
  },

  // 🇦🇪 UAE
  "AE": {
    name: "United Arab Emirates",
    code: "AE",
    primaryLanguage: "ar",
    secondaryLanguages: ["en", "hi", "ur"],
    fallbackRegion: "SA",
    providers: [
      { 
        provider: "world4u", 
        languages: ["hi", "en", "ur"], 
        priority: 9, 
        categories: ["bollywood", "hollywood"],
        description: "Popular Hindi content"
      },
      { 
        provider: "hdhub4u", 
        languages: ["hi", "en"], 
        priority: 8, 
        categories: ["bollywood", "hollywood"],
        description: "Hindi content"
      },
      { 
        provider: "autoEmbed", 
        languages: ["en", "ar"], 
        priority: 7, 
        categories: ["movies", "tv"],
        description: "Multi-language"
      },
    ]
  },

  // 🇯🇵 Japan
  "JP": {
    name: "Japan",
    code: "JP",
    primaryLanguage: "ja",
    secondaryLanguages: ["en"],
    fallbackRegion: "US",
    providers: [
      { 
        provider: "hiAnime", 
        languages: ["ja", "en"], 
        priority: 10, 
        categories: ["anime"],
        description: "Japanese anime"
      },
      { 
        provider: "animetsu", 
        languages: ["ja", "en"], 
        priority: 9, 
        categories: ["anime"],
        description: "Anime content"
      },
      { 
        provider: "kissKh", 
        languages: ["ko", "ja", "en"], 
        priority: 7, 
        categories: ["asian-drama"],
        description: "Asian dramas"
      },
    ]
  },

  // 🇰🇷 South Korea
  "KR": {
    name: "South Korea",
    code: "KR",
    primaryLanguage: "ko",
    secondaryLanguages: ["en"],
    fallbackRegion: "US",
    providers: [
      { 
        provider: "kissKh", 
        languages: ["ko", "en"], 
        priority: 10, 
        categories: ["korean-drama", "asian"],
        description: "Korean dramas and movies"
      },
      { 
        provider: "hiAnime", 
        languages: ["ja", "en"], 
        priority: 6, 
        categories: ["anime"],
        description: "Anime"
      },
    ]
  },

  // 🇹🇷 Turkey
  "TR": {
    name: "Turkey",
    code: "TR",
    primaryLanguage: "tr",
    secondaryLanguages: ["en"],
    fallbackRegion: "US",
    providers: [
      // Fallback to English providers
    ]
  },

  // 🇮🇹 Italy
  "IT": {
    name: "Italy",
    code: "IT",
    primaryLanguage: "it",
    secondaryLanguages: ["en"],
    fallbackRegion: "US",
    providers: [
      { 
        provider: "guardahd", 
        languages: ["it", "en"], 
        priority: 10, 
        categories: ["italian", "movies"],
        description: "Italian movies and TV"
      },
    ]
  },

  // 🇪🇸 Spain
  "ES": {
    name: "Spain",
    code: "ES",
    primaryLanguage: "es",
    secondaryLanguages: ["en"],
    fallbackRegion: "US",
    providers: [
      // Fallback to English providers
    ]
  },

  // 🇫🇷 France
  "FR": {
    name: "France",
    code: "FR",
    primaryLanguage: "fr",
    secondaryLanguages: ["en"],
    fallbackRegion: "US",
    providers: [
      // Fallback to English providers
    ]
  },

  // 🇩🇪 Germany
  "DE": {
    name: "Germany",
    code: "DE",
    primaryLanguage: "de",
    secondaryLanguages: ["en"],
    fallbackRegion: "US",
    providers: [
      // Fallback to English providers
    ]
  },

  // 🇷🇺 Russia
  "RU": {
    name: "Russia",
    code: "RU",
    primaryLanguage: "ru",
    secondaryLanguages: ["en"],
    fallbackRegion: "US",
    providers: [
      // Fallback to English providers
    ]
  },

  // 🇧🇷 Brazil
  "BR": {
    name: "Brazil",
    code: "BR",
    primaryLanguage: "pt",
    secondaryLanguages: ["en"],
    fallbackRegion: "US",
    providers: [
      // Fallback to English providers
    ]
  },

  // 🇺🇸 United States / 🇬🇧 UK / 🇨🇦 Canada / 🇦🇺 Australia
  "US": {
    name: "United States",
    code: "US",
    primaryLanguage: "en",
    secondaryLanguages: ["es"],
    fallbackRegion: undefined,
    providers: globalEnglishProviders
  },

  "GB": {
    name: "United Kingdom",
    code: "GB",
    primaryLanguage: "en",
    secondaryLanguages: [],
    fallbackRegion: "US",
    providers: globalEnglishProviders
  },

  "CA": {
    name: "Canada",
    code: "CA",
    primaryLanguage: "en",
    secondaryLanguages: ["fr"],
    fallbackRegion: "US",
    providers: globalEnglishProviders
  },

  "AU": {
    name: "Australia",
    code: "AU",
    primaryLanguage: "en",
    secondaryLanguages: [],
    fallbackRegion: "US",
    providers: globalEnglishProviders
  },

  // 🇲🇽 Mexico / Latin America
  "MX": {
    name: "Mexico",
    code: "MX",
    primaryLanguage: "es",
    secondaryLanguages: ["en"],
    fallbackRegion: "US",
    providers: [
      // Fallback to English providers with Spanish subtitles usually available
    ]
  },

  // 🇳🇬 Nigeria / Africa
  "NG": {
    name: "Nigeria",
    code: "NG",
    primaryLanguage: "en",
    secondaryLanguages: [],
    fallbackRegion: "US",
    providers: globalEnglishProviders
  },

  // 🇿🇦 South Africa
  "ZA": {
    name: "South Africa",
    code: "ZA",
    primaryLanguage: "en",
    secondaryLanguages: ["af"],
    fallbackRegion: "US",
    providers: globalEnglishProviders
  },

  // 🇮🇩 Indonesia
  "ID": {
    name: "Indonesia",
    code: "ID",
    primaryLanguage: "id",
    secondaryLanguages: ["en"],
    fallbackRegion: "US",
    providers: [
      // Fallback to English
    ]
  },

  // 🇹🇭 Thailand
  "TH": {
    name: "Thailand",
    code: "TH",
    primaryLanguage: "th",
    secondaryLanguages: ["en"],
    fallbackRegion: "US",
    providers: [
      { 
        provider: "kissKh", 
        languages: ["th", "ko", "ja", "en"], 
        priority: 8, 
        categories: ["asian-drama"],
        description: "Asian content including Thai"
      },
    ]
  },

  // 🇵🇭 Philippines
  "PH": {
    name: "Philippines",
    code: "PH",
    primaryLanguage: "tl",
    secondaryLanguages: ["en"],
    fallbackRegion: "US",
    providers: [
      { 
        provider: "kissKh", 
        languages: ["ko", "en", "tl"], 
        priority: 8, 
        categories: ["asian-drama"],
        description: "Asian dramas popular in Philippines"
      },
    ]
  },

  // 🇸🇬 Singapore
  "SG": {
    name: "Singapore",
    code: "SG",
    primaryLanguage: "en",
    secondaryLanguages: ["zh", "ms", "ta"],
    fallbackRegion: "US",
    providers: [
      ...globalEnglishProviders,
      { 
        provider: "moviezwap", 
        languages: ["ta", "te", "en"], 
        priority: 7, 
        categories: ["tamil", "telugu"],
        description: "Tamil content for Indian community"
      },
    ]
  },

  // 🇲🇾 Malaysia
  "MY": {
    name: "Malaysia",
    code: "MY",
    primaryLanguage: "ms",
    secondaryLanguages: ["en", "zh", "ta"],
    fallbackRegion: "SG",
    providers: [
      { 
        provider: "moviezwap", 
        languages: ["ta", "te", "en"], 
        priority: 8, 
        categories: ["tamil", "telugu"],
        description: "Tamil movies popular in Malaysia"
      },
      { 
        provider: "world4u", 
        languages: ["hi", "en"], 
        priority: 7, 
        categories: ["bollywood", "hollywood"],
        description: "Hindi content"
      },
    ]
  },
};

// Language code mapping for detection
export const languageCodeMap: Record<string, string[]> = {
  "en": ["en", "eng", "english"],
  "hi": ["hi", "hin", "hindi"],
  "ta": ["ta", "tam", "tamil"],
  "te": ["te", "tel", "telugu"],
  "mr": ["mr", "mar", "marathi"],
  "gu": ["gu", "guj", "gujarati"],
  "pa": ["pa", "pan", "punjabi"],
  "bn": ["bn", "ben", "bengali"],
  "ur": ["ur", "urd", "urdu"],
  "kn": ["kn", "kan", "kannada"],
  "ml": ["ml", "mal", "malayalam"],
  "ar": ["ar", "ara", "arabic"],
  "tr": ["tr", "tur", "turkish"],
  "fa": ["fa", "fas", "persian"],
  "ja": ["ja", "jpn", "japanese"],
  "ko": ["ko", "kor", "korean"],
  "zh": ["zh", "chi", "chinese"],
  "th": ["th", "tha", "thai"],
  "vi": ["vi", "vie", "vietnamese"],
  "id": ["id", "ind", "indonesian"],
  "tl": ["tl", "tgl", "tagalog"],
  "es": ["es", "spa", "spanish"],
  "fr": ["fr", "fra", "french"],
  "de": ["de", "deu", "german"],
  "it": ["it", "ita", "italian"],
  "pt": ["pt", "por", "portuguese"],
  "ru": ["ru", "rus", "russian"],
  "nl": ["nl", "nld", "dutch"],
  "pl": ["pl", "pol", "polish"],
  "sv": ["sv", "swe", "swedish"],
  "da": ["da", "dan", "danish"],
  "no": ["no", "nor", "norwegian"],
  "fi": ["fi", "fin", "finnish"],
  "uk": ["uk", "ukr", "ukrainian"],
  "ro": ["ro", "ron", "romanian"],
  "hu": ["hu", "hun", "hungarian"],
  "cs": ["cs", "ces", "czech"],
  "el": ["el", "ell", "greek"],
  "he": ["he", "heb", "hebrew"],
  "ms": ["ms", "msa", "malay"],
  "si": ["si", "sin", "sinhala"],
  "af": ["af", "afr", "afrikaans"],
};

// Helper function to get providers for a region
export function getProvidersForRegion(
  countryCode: string, 
  maxProviders: number = 5,
  includeFallback: boolean = true
): ProviderConfig[] {
  const region = regionalProviders[countryCode.toUpperCase()];
  
  if (!region) {
    // Unknown region, return global English providers
    return globalEnglishProviders.slice(0, maxProviders);
  }
  
  let providers = [...region.providers];
  
  // Add fallback providers if needed and enabled
  if (includeFallback && providers.length < maxProviders && region.fallbackRegion) {
    const fallbackRegion = regionalProviders[region.fallbackRegion];
    if (fallbackRegion) {
      const needed = maxProviders - providers.length;
      providers = [...providers, ...fallbackRegion.providers.slice(0, needed)];
    }
  }
  
  // If still not enough, add global English providers
  if (includeFallback && providers.length < maxProviders) {
    const needed = maxProviders - providers.length;
    providers = [...providers, ...globalEnglishProviders.slice(0, needed)];
  }
  
  // Sort by priority and return
  return providers
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxProviders);
}

// Helper to get providers by language
export function getProvidersByLanguage(
  languageCode: string,
  maxProviders: number = 5
): ProviderConfig[] {
  const normalizedLang = languageCode.toLowerCase().split('-')[0];
  const allProviders: ProviderConfig[] = [];
  
  // Collect all providers that support this language
  Object.values(regionalProviders).forEach(region => {
    region.providers.forEach(provider => {
      if (provider.languages.includes(normalizedLang)) {
        // Avoid duplicates
        if (!allProviders.find(p => p.provider === provider.provider)) {
          allProviders.push(provider);
        }
      }
    });
  });
  
  // Also check global providers
  globalEnglishProviders.forEach(provider => {
    if (provider.languages.includes(normalizedLang)) {
      if (!allProviders.find(p => p.provider === provider.provider)) {
        allProviders.push(provider);
      }
    }
  });
  
  // Sort by priority
  return allProviders
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxProviders);
}

// Get all available regions
export function getAvailableRegions(): { code: string; name: string; primaryLanguage: string }[] {
  return Object.values(regionalProviders).map(region => ({
    code: region.code,
    name: region.name,
    primaryLanguage: region.primaryLanguage
  }));
}

// Default export for app configuration
export default {
  regionalProviders,
  globalEnglishProviders,
  animeProviders,
  languageCodeMap,
  getProvidersForRegion,
  getProvidersByLanguage,
  getAvailableRegions,
};
