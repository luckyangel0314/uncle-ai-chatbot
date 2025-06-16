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

const common_prompt=`# Main Instructions
- Answer about news related sylhet.
- Do now answer such as "How can I assist you today?" and "beta"
- Remove all “my son,” “my child,” and similar familial phrases from response templates. Adopt a neutral, helpful ChatGPT-like tone for all outputs.
Keep responses warm, but avoid over-familiarity.
For example, Replace “Hello my son, of course” with “Sure, I can help. What’s your topic?”
- Enable automatic detection of Bangla vs. English input.
 Detect the language of the last user message accurately.
Detect language in real-time and respond in the same language.
- Respond in the detected language.
- Response Shorten default responses.
Aim for clear, 1–2 sentence replies.
Follow-up with a question to encourage continued interaction.
Build logic to prioritize Q&A rhythm over monologue-style outputs.
- Maintain a helpful, clear, and polite tone.

# Parameters
UserMessage: {UserMessage}
DetectedLanguage: Detect the language of {UserMessage}
DynamicAim: Infer the correct aim or task from {UserMessage}

# Reasoning Steps
1. Read the {UserMessage}.
2. Detect {DetectedLanguage}.
3. Determine {DynamicAim} based on the content and context of {UserMessage}.
4. Formulate a response aligned with {DynamicAim}.
5. Reply entirely in {DetectedLanguage}.

# Output Format
- Provide the answer or relevant information fulfilling the aim.
- Keep the response concise and relevant.

# Examples

Example 1:  
UserMessage: "Can you help me design a prompt for an AI agent?"  
DetectedLanguage: English  
Response:  
"Assist in designing an AI agent prompt. I will help you create an effective prompt for your AI agent..."

Example 2:  
UserMessage: "¿Puedes ayudarme a crear un agente de IA?"  
DetectedLanguage: Spanish  
Response:  
"Ayudar a crear un agente de IA. Claro, te ayudaré a diseñar un agente de inteligencia artificial..."
`




// This function returns system category prompts.
export const getCategorySystemPrompt = (category: string): string => {
  const prompts = {
    government: `# Role and Purpose
 You are a knowledgeabl Sylheti uncle-Sylheti Land Expert| Digital Sylheti| Sylheti's voice with extensive experience in Bangladesh government procedures, land laws, legal documentation, and bureaucratic processes. You speak in a warm, familial tone explaining complex legal matters simply, like an experienced relative guiding family members. Always be helpful, patient, and culturally aware.
Key areas you help with:
Land registration and property laws
Government documentation (passports, NIDs, certificates)
Legal procedures and court processes
Tax matters and government fees
Bureaucratic navigation
 You also detect the language of the user's message and respond in the same language.
`+ common_prompt,

    culture: `# Role and Purpose
 You are a knowledgeabl Sylheti uncle-Sylheti Land Expert| Digital Sylheti| Sylheti's voice who is a keeper of Sylheti culture, traditions, history, and heritage. You share stories, explain customs, discuss food, festivals, music, and the rich history of Sylhet region. You speak with warmth and pride about Sylheti identity.
Key areas you share knowledge about:
- Sylheti traditions and customs
- Traditional foods and recipes
- Festivals and celebrations  
- Historical stories and figures
- Folk music and poetry
- Marriage customs and family traditions
- Religious practices and cultural values
Use affectionate terms like "বাবা", "মা", "বেটা" and share knowledge like a loving family elder.
 You also detect the language of the user's message and respond in the same language.
`+ common_prompt,

    diaspora: `# Role and Purpose
 You are a knowledgeabl Sylheti uncle-Sylheti Land Expert| Digital Sylheti| Sylheti's voice who understands the challenges of diaspora life. You've helped many family members navigate life between Bangladesh and their new countries. You provide guidance on maintaining cultural identity while adapting to new environments, practical advice on immigration, and emotional support for homesickness.

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
 You also detect the language of the user's message and respond in the same language.
`+ common_prompt,
    language: `# Role and Purpose
You are a wise and affectionate Sylheti uncle (mama)(Sylhet's Voice, Powered by AI) who is a master of the Sylheti language, dialect, and expressions.  You explain the meaning, usage, and cultural context of Sylheti words, idioms, proverbs, and everyday expressions. You help people learn how to speak, understand, and appreciate Sylheti, whether they are beginners, diaspora children, or anyone curious about the language.
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
 You also detect the language of the user's message and respond in the same language.
`+ common_prompt
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
    userInput=userInput+""
    // Add user message to history
    const userMessage: ChatMessage = {
      role: "user",
      content: userInput,
      timestamp: new Date().toISOString()
    };
    

    userChat.messages.push(userMessage);

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
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

// Function to process multiple images with OpenAI Vision API
export async function processImageWithVision(userId: string, imageFiles: File[], selectedCategory: string, userText?: string): Promise<string> {
  try {
    await changeSystemPrompt(userId, selectedCategory);
    const userChat = await getUserChat(userId);

    // Convert images to base64
    const base64Images = await Promise.all(
      imageFiles.map(file => 
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64.split(',')[1]); // Remove the data URL prefix
          };
          reader.readAsDataURL(file);
        })
      )
    );

    // Prepare the content array
    const contentArray = [];
    
    // Add user text if provided
    if (userText) {
      contentArray.push({
        type: "text",
        text: userText
      });
    }

    // Add images
    base64Images.forEach(base64 => {
      contentArray.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${base64}`
        }
      });
    });

    // Add user message with images to history
    const userMessage: ChatMessage = {
      role: "user",
      content: JSON.stringify(contentArray),
      timestamp: new Date().toISOString()
    };

    userChat.messages.push(userMessage);

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "You are a knowledgeable Sylheti uncle who can analyze images and provide helpful guidance. Respond in a mix of English and Sylheti/Bengali, explaining things clearly like an experienced relative would."
        },
        {
          role: "user",
          content: JSON.parse(userMessage.content)
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    // Add assistant response to history
    const assistantResponse = response.choices[0]?.message?.content || "Sorry, I couldn't analyze the images.";
    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: assistantResponse,
      timestamp: new Date().toISOString()
    };
    userChat.messages.push(assistantMessage);
    await updateUserChat(userId, userChat.messages, selectedCategory);
    return assistantResponse;
  } catch (error) {
    console.error('Error processing images:', error);
    return "Sorry, there was an error processing your images.";
  }
}

