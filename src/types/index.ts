
// Type definitions for SylhetGPT

export type MessageSender = 'user' | 'bot';

export type CategoryType = 'government' | 'culture' | 'diaspora';

export interface Message {
  id: string;
  content: string;
  sender: MessageSender;
  timestamp: Date;
  category?: CategoryType;
  isAudio?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface VoiceSettings {
  enabled: boolean;
  voiceId: string;
  speed: number;
  pitch: number;
  volume: number;
}

export interface AppSettings {
  darkMode: boolean;
  voice: VoiceSettings;
  selectedCategory: CategoryType;
  language: string;
}

export interface ApiConfig {
  openaiKey?: string;
  elevenlabsKey?: string;
  endpoint?: string;
  model?: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}
