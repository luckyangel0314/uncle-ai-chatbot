
// SylhetGPT Configuration Constants

export const APP_CONFIG = {
  name: 'SylhetGPT',
  tagline: 'Your Digital Sylheti Uncle',
  version: '1.0.0',
  author: 'Maz Chowdury',
} as const;

export const CATEGORIES = {
  culture: {
    id: 'culture',
    name: 'Culture & History',
    icon: '📜',
    description: 'Learn about Sylheti traditions, food, festivals, and heritage'
  },
  government: {
    id: 'government', 
    name: 'Land & Inheritance Laws',
    icon: '🏠',
    description: 'Get help with legal procedures, land laws, and documentation'
  },
  diaspora: {
    id: 'diaspora',
    name: 'Sylheti Diaspora Support', 
    icon: '🌍',
    description: 'Navigate life abroad while maintaining your Sylheti identity'
  },
  language: {
    id: 'language',
    name: 'Sylheti Language & Expressions', 
    icon: '🗣️',
    description: 'Assist to learn Sylheti Language and Expressions.'
  }
} as const;

export const VOICE_CONFIG = {
  defaultVoiceId: 'pNInz6obpgDQGcFmaJgB', // ElevenLabs Adam voice
  defaultLanguage: 'bn-BD',
  speechRate: 0.9,
  speechPitch: 1.0,
  speechVolume: 0.8
} as const;

export const THEME_CONFIG = {
  colors: {
    dark: {
      primary: 'green-400',
      secondary: 'green-600', 
      background: 'gray-900',
      surface: 'gray-800',
      text: 'green-300'
    },
    light: {
      primary: 'green-600',
      secondary: 'green-500',
      background: 'gray-50', 
      surface: 'white',
      text: 'gray-800'
    }
  }
} as const;

export const API_ENDPOINTS = {
  openai: 'https://api.openai.com/v1/chat/completions',
  elevenlabs: 'https://api.elevenlabs.io/v1/text-to-speech',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions'
} as const;

// For milestone 2 - API key storage helpers
export const getApiKey = (service: 'openai' | 'elevenlabs'): string | null => {
  // In production, these would come from environment variables or secure storage
  return localStorage.getItem(`${service}_api_key`);
};

export const setApiKey = (service: 'openai' | 'elevenlabs', key: string): void => {
  localStorage.setItem(`${service}_api_key`, key);
};
