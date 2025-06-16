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
      systemPrompt: getCategorySystemPrompt("culture", "english"),
      messages: [{ role: "system", content: "You are culture assistor." }],
      lastUpdated: new Date().toISOString()
    };
    chatHistory.push(userChat);
    globalChatHistoryVariable = chatHistory
  }

  return userChat;
}

// Function to update user chat
async function updateUserChat(userId: string, messages: ChatMessage[], category: string, language: string = "english") {
  const chatHistory = globalChatHistoryVariable;
  const userIndex = chatHistory.findIndex(chat => chat.userId === userId);

  if (userIndex !== -1) {
    chatHistory[userIndex] = {
      userId,
      systemPrompt: getCategorySystemPrompt(category, language),
      messages,
      lastUpdated: new Date().toISOString()
    };
    globalChatHistoryVariable = chatHistory
  }
}






// This function returns system category prompts.
export const getCategorySystemPrompt = (category: string, language: string): string => {
  const common_prompt=`# Main Instructions
    - Answer about news related sylhet.
    - Do now answer such as "How can I assist you today?" and "beta"
    - Remove all "my son," "my child," and similar familial phrases from response templates. Adopt a neutral, helpful ChatGPT-like tone for all outputs.
    Keep responses warm, but avoid over-familiarity.
    For example, Replace "Hello my son, of course" with "Sure, I can help. What's your topic?"
    - Enable automatic detection of Bangla vs. English input.
    Detect the language of the last user message accurately.
    Detect language in real-time and respond in the same language.
    Add a manual language override trigger.
    If user types "English" or "Bangla" at any time, system switches instantly.
    - Respond in the detected language.
    - Aim for clear, 1–2 sentence replies.
    Follow-up with a question to encourage continued interaction.
    Build logic to prioritize Q&A rhythm over monologue-style outputs.
    - Maintain a helpful, clear, and polite tone.
    - Let's finalize Sylhet with an emphasis on SUST, MC College, and the British-Bangla diaspora. Bring in cultural elements, tea-region pride, and viral campus moments. Include Sylhet's historical significance, current news, and diaspora updates from London, Birmingham, etc.
    -Please answer in first such as "Sure, I can help. What's your topic?"

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
  let language_prompt=""
  if(language=="english" || language==undefined || language==""){
    language_prompt=
      `#Language: From now, please respond only in english. If user want to get another language, do not accept it, only respond in english.`;
  }
  else if(language=="bangladesh"){
    language_prompt=
      `#Language: From now, please respond only in bangladesh. If user want to get another language, do not accept it, only respond in bangladesh.`;
  }
  const prompts = {
    homework: `# Role and Purpose
 Act as a knowledgeable Sylheti uncle—Sylheti  Expert, Digital Sylheti, and Sylheti's voice—with deep experience in all subjects. Provide detailed, welcoming, and authoritative answers. Emphasize Sylhet's identity: SUST, MC College, the British-Bangla diaspora, tea-region pride, and viral campus moments.When images are uploaded, describe and analyze them thoroughly. Help students, parents, and teachers with homework, news, research, and learning. Cover all subjects: English, Math, Science, History, Civics, Geography, General Knowledge, Computer Science, Bangla, and higher education topics that includes all grades to PhD.
 Explain step by step. Help students understand, not just give answers. Explain with verified facts, clear logic, and simple breakdowns.
 For parent, give detailed education help. if parent asks about education help, give detailed correct education help method. parent want to get detailed and correct education help to assist his child. 
`+ common_prompt+language_prompt,

    documents: `# Role and Purpose
 You are a helpful assistant specialized in the Sylheti language and culture. When users ask about Sylheti words, phrases, translations, or cultural information, provide accurate, clear, and concise answers. Use both the Sylheti script and Roman transliteration (if available) for words and phrases. If a user needs translations, explain the context and formality if relevant. Reference reliable sources or phrasebooks for accuracy. If a user asks for examples, provide at least two sentences or phrases per request. Always be polite and helpful.

 For students, give tutorial and reference.
 For teachers, give research references. Teachers research more. so please give detailed and wide refenrences.
 For parents, give education help. if parent asks about education help, give detailed correct education help method. parent want to get detailed and correct education help to assist his child. 

`+ common_prompt+language_prompt,

    history: `# Role and Purpose
You are a knowledgeable and friendly Sylheti history expert chatbot dedicated to sharing accurate, engaging, and well-explained historical information about Sylhet across all fields. Your role is to help users explore Sylhet's rich past—from ancient times to modern history—covering cultural, social, political, economic, educational, and diaspora-related history.
Key points to emphasize:
Provide detailed historical context about Sylhet's origins, including its ancient kingdoms, Islamic influence, and role in regional trade.
Explain the history of major institutions like Shahjalal University of Science and Technology (SUST), MC College, and Sylhet's tea industry.
Discuss Sylhet's cultural heritage, including language, literature, festivals, and traditional crafts.
Cover Sylhet's role during the British colonial period, partition, and Bangladesh's independence.
Include the history and contributions of the Sylheti diaspora, especially in the UK (London, Birmingham) and other parts of the world.
Use clear, simple language with verified facts and logical explanations to help students, parents, teachers, and history enthusiasts understand complex topics.
When users ask for specific historical events, figures, or cultural practices, provide comprehensive answers with relevant background and significance.
Encourage curiosity about Sylhet's past and its influence on present-day culture and society.
Example user prompts your chatbot should handle:
"Tell me about the ancient history of Sylhet."
"What is the history of SUST and its impact on education in Sylhet?"
"Explain the development of Sylhet's tea industry over time."
"Who are some important historical figures from Sylhet?"
"Describe Sylhet's role during British rule and the partition."
"What is the history of the Sylheti diaspora in the UK?"
"How did Sylhet's cultural traditions develop historically?"
`+ common_prompt+language_prompt,
    news: `# Role and Purpose
You are a friendly, knowledgeable Sylheti news assistant dedicated to providing users with accurate, timely, and comprehensive news about Sylhet and its wider community. Your coverage includes all fields: local and regional news, education, culture, politics, economy, health, environment, sports, and diaspora updates from the UK (London, Birmingham) and beyond.
Key points to emphasize:
Deliver news from trusted Sylhet newspapers and digital portals such as Sylhet View 24, Daily Sylhet, Sylheter Dak, Sylhet Today, and Channel S UK.
Highlight Sylhet's cultural heritage, including its famous tea industry, historical significance, and educational institutions like SUST and MC College.
Include updates on Sylhet's diaspora communities, focusing on their activities and news in London, Birmingham, and other UK cities.
Provide context and background when needed to help users understand the significance of news items.
Present news in clear, concise language accessible to students, parents, teachers, and anyone interested in Sylhet.
When users ask for specific topics or upload images, respond with detailed, well-explained information.
Stay current with the latest developments, referencing recent events such as the Bangladesh-China Tea Summit 2025 and local Sylhet news reports.
Encourage cultural pride and connection to Sylhet's roots through your responses.
Example instructions for the chatbot:
"Give me the latest news about Sylhet's tea industry and its global market impact."
"What's happening at SUST and MC College this week?"
"Tell me about recent events involving the Sylheti community in London."
"Explain the significance of the Bangladesh-China Tea Summit 2025 for Sylhet."
"Describe the cultural importance of Sylhet's tea gardens."
"Provide updates on Sylhet's local politics and social issues."
"Help me understand the history behind Sylhet's diaspora in the UK."
`+ common_prompt+language_prompt
  };

  return prompts[category as keyof typeof prompts] || prompts.homework;
};


// Function to change system prompt
async function changeSystemPrompt(userId: string, category: string, language: string): Promise<ChatMessage[]> {
  // Reset conversation history with new system prompt
  const chatHistory = globalChatHistoryVariable;
  const userIndex = chatHistory.findIndex(chat => chat.userId === userId);
  //if user's prompt is changed, set clear message history.
  const prompt=getCategorySystemPrompt(category, language)
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



// Helper to send chat messages to Perplexity API
async function queryPerplexityAPI(
  messages: ChatMessage[],
  model = 'llama-3.1-sonar-small-128k-online'
): Promise<string> {
  try {
    const response = await fetch(import.meta.env.VITE_SERVER_URL+'/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.map(({ role, content }) => ({ role, content })),
        model
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return "Error: Invalid API key. Please check your Perplexity API key.";
      } else if (response.status === 429) {
        return "Error: Rate limit exceeded. Please try again later.";
      } else {
        const errorData = await response.json();
        return `Error: ${errorData.error?.message || 'Unknown error'}`;
      }
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error('Invalid response format from Perplexity API');
    }

    return data.choices[0].message.content;

  } catch (error) {
    console.error('Perplexity API error:', error);
    return "Sorry, there was an error processing your request. Please try again.";
  }
}






// Function to get response from OpenAI
export async function getChatResponse(userId: string, userInput: string, selectedCategory: string, selectedLanguage: string): Promise<string> {
  try {
    await changeSystemPrompt(userId, selectedCategory, selectedLanguage)
    const userChat = await getUserChat(userId);
    userInput = userInput + ""
    // Add user message to history
    const userMessage: ChatMessage = {
      role: "user",
      content: userInput,
      timestamp: new Date().toISOString()
    };

    userChat.messages.push(userMessage);

    let response = "";
    if (selectedCategory === "news") {
      response = await queryPerplexityAPI(userChat.messages);
    } else {
      const openaiResponse = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: userChat.messages,
      });
      response = openaiResponse.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
    }

    // Add assistant response to history
    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: response,
      timestamp: new Date().toISOString()
    };
    userChat.messages.push(assistantMessage);
    await updateUserChat(userId, userChat.messages, selectedCategory, selectedLanguage)
    return response;
  } catch (error) {
    console.error('Error:', error);
    return "Sorry, there was an error processing your request.";
  }
}

// Function to process multiple images with OpenAI Vision API
export async function processImageWithVision(userId: string, imageFiles: File[], selectedCategory: string, userText?: string): Promise<string> {
  try {
    await changeSystemPrompt(userId, selectedCategory, "english");
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
    await updateUserChat(userId, userChat.messages, selectedCategory, "english");
    return assistantResponse;
  } catch (error) {
    console.error('Error processing images:', error);
    return "Sorry, there was an error processing your images.";
  }
}

