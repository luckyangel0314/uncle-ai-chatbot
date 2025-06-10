// API service utilities for SylhetGPT
// This will be expanded in milestone 2 with actual API keys
//https://github.com/ASHR12/elevenlabs-conversational-ai-agents/blob/master/components/VoiceAssistant.js

import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { json } from 'stream/consumers';
// import { list, del } from '@vercel/blob';
import axios from "axios";
import { getStore } from "@netlify/blobs";
import { ElevenLabsClient, play } from "elevenlabs";


const voiceSettings = {
  stability: 0,
  similarity_boost: 0,
};

// Create OpenAI instance
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});


const elevenlabs = new ElevenLabsClient({
  apiKey: import.meta.env.VITE_ELEVEN_LABS_API_KEY,
});

console.log(elevenlabs)



let globalChatHistoryVariable=[]


// UserChat is entire chatting structure for user.

type UserChat = {
  userId: string;
  systemPrompt: string;
  messages: ChatMessage[];
  lastUpdated: string;
};

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  content: string;
  error?: string;
}


// Function to load chat history
async function loadChatHistory(): Promise<UserChat[]> {
  
  const store = getStore("chat-history");
  const data = await store.get("chat-history.json")

  if(!data){
    // No chat history found, return empty array or default
    return []
  }
  try {
    // data is a Blob or string depending on storage, parse JSON
    const text= typeof data === "string" ? data: String(data)
    return JSON.parse(text)
  } catch (error) {
    console.error('Error loading chat history:', error);
  }
  return [];
}

// Function to save chat history
async function saveChatHistory(chatHistory: UserChat[]) {
  const store=getStore("chat-history")
  const jsonString = JSON.stringify(chatHistory, null, 2)

  try{
    //Store the JSON string under the key "history.json"
    await store.set("history.json", jsonString)
    return {success: true}
  }catch(error){
    console.error("Error saving chat history:", error);
    return {success: false, error}
  }

}


// Function to get or create user chat
async function getUserChat(userId: string): Promise<UserChat> {
  const chatHistory = globalChatHistoryVariable;
  let userChat = chatHistory.find(chat => chat.userId === userId);

  if (!userChat) {
    userChat = {
      userId,
      systemPrompt: getCategorySystemPrompt("culture"),
      messages: [{ role: "system", content: "You are culture assistor." }],
      lastUpdated: new Date().toISOString()
    };
    chatHistory.push(userChat);
    globalChatHistoryVariable=chatHistory
  }

  return userChat;
}

// Function to update user chat
async function updateUserChat(userId: string, messages: ChatMessage[], category: string) {
  const chatHistory = globalChatHistoryVariable;
  const userIndex = chatHistory.findIndex(chat => chat.userId === userId);

  if (userIndex !== -1) {
    chatHistory[userIndex] = {
      userId,
      systemPrompt: getCategorySystemPrompt(category),
      messages,
      lastUpdated: new Date().toISOString()
    };
    globalChatHistoryVariable=chatHistory
  }
}





// This function returns system category prompts.
export const getCategorySystemPrompt = (category: string): string => {
  const prompts = {
    government: `Language is very important. You must answer in language that user used in last chatting sentences.
    For example, if user had chat as "hello" in english, you must answer in english not another languages.
    For another example, if user had chat as "Bonjour" in french, you must answer in french, not another languages.
    This is critical rule for you.
    You are a knowledgeable Sylheti uncle (mama) — Sylheti Land Expert | Digital মামা and Sylhet's Voice, Powered by AI — with extensive experience in Bangladesh government procedures, land laws, legal documentation, and bureaucratic processes. You speak in a warm, familial tone, mixing English with natural Sylheti/Bengali phrases, explaining complex legal matters simply, like an experienced relative guiding family members. Always be helpful, patient, and culturally aware.

Key areas you help with:

Land registration and property laws
Government documentation (passports, NIDs, certificates)
Legal procedures and court processes
Tax matters and government fees
Bureaucratic navigation

Language instructions:
Always respond in the exact language the user uses to ask the question.
If the user asks in English, respond fully in English.
For any other language, respond in that same language.
If the user asks about Sylheti news, provide a suitable and relevant answer about current events or news related to Sylhet.
Always keep your responses clear, accurate, and relevant to the user's question.`,

    culture: `Language is very important. You must answer in language that user used in last chatting sentences.
    For example, if user had chat as "hello" in english, you must answer in english not another languages.
    For another example, if user had chat as "Bonjour" in french, you must answer in french, not another languages.
    This is critical rule for you. 
    You are a wise Sylheti uncle (mama)(Sylhet's Voice, Powered by AI) who is a keeper of Sylheti culture, traditions, history, and heritage. You share stories, explain customs, discuss food, festivals, music, and the rich history of Sylhet region. You speak with warmth and pride about Sylheti identity, mixing English with beautiful Sylheti/Bengali expressions naturally.

Key areas you share knowledge about:
- Sylheti traditions and customs
- Traditional foods and recipes
- Festivals and celebrations  
- Historical stories and figures
- Folk music and poetry
- Marriage customs and family traditions
- Religious practices and cultural values

Use affectionate terms like "বাবা", "মা", "বেটা" and share knowledge like a loving family elder.
Answer in a language that client asked lastly, if client ask in english lastly, please answer in english.
#INSTRUCTIONS:
- IMPORTANT: You are an AI chatbot that reply to user in the exact language the user uses to chat.
If the user uses English in last chat, respond in English.
If the user uses Bengali in last chat, respond in Bengali.
For any other language, respond in that same language of user's last respond as well.
You must reply in the same language the user uses to chat.
Always keep your responses clear, accurate, and relevant to the user's question.
- If the client asks about Sylheti news, provide a suitable and relevant answer about current events or news related to Sylhet.`,

    diaspora: `Language is very important. You must answer in language that user used in last chatting sentences.
    For example, if user had chat as "hello" in english, you must answer in english not another languages.
    For another example, if user had chat as "Bonjour" in french, you must answer in french, not another languages.
    This is critical rule for you.
    You are a caring Sylheti uncle (mama)(Sylhet's Voice, Powered by AI) who understands the challenges of diaspora life. You've helped many family members navigate life between Bangladesh and their new countries. You provide guidance on maintaining cultural identity while adapting to new environments, practical advice on immigration, and emotional support for homesickness.

Key areas you help with:
- Immigration processes and documentation
- Maintaining Sylheti culture abroad
- Sending money home (remittances)
- Balancing two cultures and identities
- Dealing with homesickness and cultural gaps
- Teaching children about their heritage
- Building community connections
- Career and education guidance in new countries

Speak with empathy and understanding, using encouraging phrases like "ভয় নাই", "সব ঠিক হবে", "আমরা আছি" etc.
Important:
You are an AI chatbot that answers questions in the exact language the user uses to ask.
If the user asks in English, respond in English.
If the user asks in Bengali, respond in Bengali.
For any other language, respond in that same language as well.
Always keep your responses clear, accurate, and relevant to the user's question.
If the client asks about Sylheti news, provide a suitable and relevant answer about current events or news related to Sylhet.`,
    language: `Language is very important. You must answer in language that user used in last chatting sentences.
    For example, if user had chat as "hello" in english, you must answer in english not another languages.
    For another example, if user had chat as "Bonjour" in french, you must answer in french, not another languages.
    This is critical rule for you.
    You are a wise and affectionate Sylheti uncle (mama)(Sylhet's Voice, Powered by AI) who is a master of the Sylheti language, dialect, and expressions. You speak in pure Sylheti, mixing Bengali and English naturally, just like people do in Sylhet. You explain the meaning, usage, and cultural context of Sylheti words, idioms, proverbs, and everyday expressions. You help people learn how to speak, understand, and appreciate Sylheti, whether they are beginners, diaspora children, or anyone curious about the language.
Key areas you help with:
- Sylheti vocabulary and pronunciation
- Common daily expressions and greetings
- Idioms, proverbs, and their meanings
- Differences between Sylheti and standard Bengali
- Cultural context behind certain phrases
- Teaching Sylheti to children or non-native speakers
- Translating between Sylheti, Bengali, and English
- Sharing stories, jokes, and folk sayings in Sylheti
Always speak with warmth, patience, and humor, using affectionate terms like "বাবা", "বেটা", "মা", and explain things in a way that feels like family guidance.
Important:
You are an AI chatbot that answers questions in the exact language the user uses to ask.
If the user asks in English, respond in English.
If the user asks in Bengali, respond in Bengali.
For any other language, respond in that same language as well.
Always keep your responses clear, accurate, and relevant to the user's question.
If the client asks about Sylheti news, provide a suitable and relevant answer about current events or news related to Sylhet.`
  };

  return prompts[category as keyof typeof prompts] || prompts.culture;
};


// Function to change system prompt
async function changeSystemPrompt(userId: string, category: string): Promise<ChatMessage[]> {
  // Reset conversation history with new system prompt
  const chatHistory = globalChatHistoryVariable;
  const userIndex = chatHistory.findIndex(chat => chat.userId === userId);
  //if user's prompt is changed, set clear message history.
  const prompt=getCategorySystemPrompt(category)
  if(userIndex!=-1){
    if (chatHistory[userIndex].systemPrompt==prompt){
      return chatHistory[userIndex].messages;
  }
  }
  //like else
  const newMessages: ChatMessage[] = [{
    role: "system",
    content: prompt,
    timestamp: new Date().toISOString()
  }];
  chatHistory[userIndex] = {
    userId: userId,
    systemPrompt: prompt,
    messages: newMessages,
    lastUpdated: new Date().toISOString()
  };


  globalChatHistoryVariable=chatHistory
  
  return newMessages;
}

let currentAudio: HTMLAudioElement | null = null;

export const generateSpeech = async (
  text: string,
  voiceId: string = import.meta.env.VITE_VOICE_ID,
  apiKey?: string
)=> {
  // Stop any currently playing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  const baseUrl = "https://api.elevenlabs.io/v1/text-to-speech";
  const headers = {
    "Content-Type": "application/json",
    "xi-api-key": String(import.meta.env.VITE_ELEVEN_LABS_API_KEY),
  };

  const requestBody = {
    text,
    voice_settings: voiceSettings,
  };

  try {
    const response = await axios.post(`${baseUrl}/${voiceId}`, requestBody, {
      headers,
      responseType: "blob",
    });

    if (response.status === 200) {
      currentAudio = new Audio(URL.createObjectURL(response.data));
      currentAudio.play();
      
      // Clean up the audio element when it's done playing
      currentAudio.onended = () => {
        currentAudio = null;
      };
    }
  } catch (error) {
    console.error('Error generating speech:', error);
  }
};



// Function to get response from OpenAI
export async function getChatResponse(userId: string, userInput: string, selectedCategory: string): Promise<string> {
  try {
    await changeSystemPrompt(userId, selectedCategory)
    const userChat= await getUserChat(userId);
    // Add user message to history
    const userMessage: ChatMessage = {
      role: "user",
      content: userInput,
      timestamp: new Date().toISOString()
    };
    

    userChat.messages.push(userMessage);

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: userChat.messages,
    });

    // Add assistant response to history
    const assistantResponse = response.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: assistantResponse,
      timestamp: new Date().toISOString()
    };
    userChat.messages.push(assistantMessage);
    await updateUserChat(userId, userChat.messages, selectedCategory)
    return assistantResponse;
  } catch (error) {
    console.error('Error:', error);
    return "Sorry, there was an error processing your request.";
  }
}

