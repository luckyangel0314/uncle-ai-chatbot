
import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Send, Volume2, VolumeX, Moon, Sun } from 'lucide-react';
import { toast } from "sonner";
import { getChatResponse } from "@/utils/apiService"

type Message = {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  category?: string;
};

type Category = 'government' | 'culture' | 'diaspora';

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('culture');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    const welcomeMessage: Message = {
      id: '1',
      content: 'Assalamu Alaikum! আমি SylhetGPT, আপনার ডিজিটাল মামা। I\'m here to help you with Sylheti culture, history, land laws, and diaspora questions. আপনি কেমন আছেন? How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  const getCategoryPrompt = (category: Category) => {
    const prompts = {
      government: "You are a knowledgeable Sylheti uncle who understands Bangladesh government procedures, land laws, and legal matters. Respond in a mix of English and Sylheti/Bengali, explaining things clearly like an experienced relative would.",
      culture: "You are a wise Sylheti uncle sharing stories about Sylheti culture, traditions, food, festivals, and history. Mix English with Sylheti/Bengali phrases naturally, speaking warmly like family.",
      diaspora: "You are a caring Sylheti uncle helping with diaspora life - immigration, maintaining culture abroad, sending money home, and bridging two worlds. Speak with the wisdom of someone who understands both Bangladesh and Western life."
    };
    return prompts[category];
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date(),
      category: selectedCategory
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInputText('');

    try {
      const userId = "default";
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: await getChatResponse(userId, content, selectedCategory),
        sender: 'bot',
        timestamp: new Date(),
        category: selectedCategory
      };

      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);

      if (voiceEnabled) {
        speakMessage(botResponse.content);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      setIsLoading(false);
    }
  };

  const speakMessage = async (text: string) => {
    if (!voiceEnabled) return;

    setIsSpeaking(true);

    // For now, use browser speech synthesis
    // In production, this will be replaced with ElevenLabs API
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      toast.error('Voice synthesis failed');
    };

    speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();

    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'bn-BD';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsListening(false);
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
      toast.error('Speech recognition failed');
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ease-in-out ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      <div className="container mx-auto max-w-4xl h-screen flex flex-col">
        {/* Header */}
        <div className={`backdrop-blur-md transition-all duration-300 ${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} border-b p-4 flex items-center justify-between shadow-sm`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg transform transition-transform duration-200 hover:scale-105">
              S
            </div>
            <div>
              <h1 className={`text-xl font-bold transition-colors duration-300 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                SylhetGPT
              </h1>
              <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Your Digital Sylheti Uncle
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleVoice}
              className={`transition-all duration-300 transform hover:scale-105 ${darkMode ? 'text-gray-300 hover:text-green-400 hover:bg-gray-700/50' : 'text-gray-600 hover:text-green-600 hover:bg-gray-100/50'}`}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDarkMode(!darkMode)}
              className={`transition-all duration-300 transform hover:scale-105 ${darkMode ? 'text-gray-300 hover:text-green-400 hover:bg-gray-700/50' : 'text-gray-600 hover:text-green-600 hover:bg-gray-100/50'}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Category Selection */}
        <div className={`backdrop-blur-md transition-all duration-300 ${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} border-b p-4`}>
          <Select value={selectedCategory} onValueChange={(value: Category) => setSelectedCategory(value)}>
            <SelectTrigger className={`w-full max-w-xs transition-all duration-300 hover:scale-[1.02] ${darkMode ? 'bg-gray-700/50 border-gray-600/50 text-green-400 hover:bg-gray-700/70' : 'bg-gray-50/50 border-gray-300/50 text-green-600 hover:bg-gray-50/70'}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="backdrop-blur-md">
              <SelectItem value="culture">🏛️ Culture & History</SelectItem>
              <SelectItem value="government">📋 Government & Law</SelectItem>
              <SelectItem value="diaspora">🌍 Diaspora Questions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex animate-fade-in ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Card className={`max-w-xs sm:max-w-md lg:max-w-lg p-4 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg ${message.sender === 'user'
                ? `${darkMode ? 'bg-gradient-to-br from-green-600 to-green-700 text-white shadow-green-500/20' : 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-green-400/20'} shadow-lg`
                : `${darkMode ? 'bg-gray-800/70 border-gray-700/50 text-green-300 shadow-gray-900/20' : 'bg-white/70 border-gray-200/50 text-gray-800 shadow-gray-200/20'} backdrop-blur-sm shadow-lg`
                }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
                <p className={`text-xs mt-2 opacity-70 transition-opacity duration-300`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </Card>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <Card className={`max-w-xs p-4 backdrop-blur-sm transition-all duration-300 ${darkMode ? 'bg-gray-800/70 border-gray-700/50' : 'bg-white/70 border-gray-200/50'} shadow-lg`}>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 ${darkMode ? 'bg-green-400' : 'bg-green-600'} rounded-full animate-bounce`}></div>
                  <div className={`w-2 h-2 ${darkMode ? 'bg-green-400' : 'bg-green-600'} rounded-full animate-bounce`} style={{ animationDelay: '0.1s' }}></div>
                  <div className={`w-2 h-2 ${darkMode ? 'bg-green-400' : 'bg-green-600'} rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
                  <span className={`text-sm transition-colors duration-300 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>Uncle is thinking...</span>
                </div>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`backdrop-blur-md transition-all duration-300 ${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} border-t p-4 shadow-lg`}>
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask your digital uncle anything... আমাকে কিছু জিজ্ঞেস করুন"
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(inputText)}
                disabled={isLoading}
                className={`transition-all duration-300 focus:scale-[1.02] ${darkMode ? 'bg-gray-700/50 border-gray-600/50 text-green-300 placeholder-gray-400 focus:bg-gray-700/70' : 'bg-gray-50/50 border-gray-300/50 text-gray-800 placeholder-gray-500 focus:bg-gray-50/70'} backdrop-blur-sm`}
              />
            </div>

            <Button
              onClick={isListening ? stopListening : startListening}
              variant="outline"
              size="icon"
              disabled={isLoading}
              className={`transition-all duration-300 transform hover:scale-105 ${isListening
                ? 'bg-red-500 hover:bg-red-600 text-white border-red-500 animate-pulse shadow-red-500/30'
                : `${darkMode ? 'border-gray-600/50 text-green-400 hover:bg-gray-700/50 hover:border-green-400/50' : 'border-gray-300/50 text-green-600 hover:bg-gray-50/50 hover:border-green-600/50'} backdrop-blur-sm`
                } shadow-lg`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>

            <Button
              onClick={() => sendMessage(inputText)}
              disabled={isLoading || !inputText.trim()}
              className={`transition-all duration-300 transform hover:scale-105 ${darkMode ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-green-500/30' : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-400/30'} text-white shadow-lg disabled:transform-none disabled:hover:scale-100`}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          <p className={`text-xs mt-2 transition-all duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-600'} text-center ${isSpeaking ? 'animate-pulse' : ''}`}>
            {isSpeaking ? '🔊 Uncle is speaking...' : 'Type your message or click the mic to speak'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
