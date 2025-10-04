import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Component({
  selector: 'app-chat-bot',
  templateUrl: './chat-bot.page.html',
  styleUrls: ['./chat-bot.page.scss'],
  standalone: false,
})
export class ChatBotPage implements OnInit {

    public genAI = new GoogleGenerativeAI('AIzaSyCqucjLfdHlLZrGOHNqBcDhKlqY37WdE3I'); // Gemini API Key

 messages: { 
  text: string, 
  sender: 'user' | 'bot', 
  audioUrl?: string,
  isThinking?: boolean
}[] = [
  { text: 'Hi there! How can I help you?', sender: 'bot' }
];

  userInput: string = '';
  selectedLanguage: string = 'English';
  isThinking: boolean = false;

  currentAudio: HTMLAudioElement | null = null;
  playingMessageIndex: number = -1;

  constructor(public http: HttpClient) {}

  ngOnInit() {}

  // Send user message
async sendMessage() {
  if (!this.userInput.trim()) return;

  // Add user message
  this.messages.push({ text: this.userInput, sender: 'user' });
  const userMsg = this.userInput;
  this.userInput = '';

  // Show thinking animation
  this.isThinking = true;
  this.messages.push({ text: '', sender: 'bot', isThinking: true });

  try {
    // Get response from Gemini
    const response = await this.geminiChat(userMsg);

    // Remove thinking message
    this.messages.pop();
    this.isThinking = false;

    // Generate speech audio (but don't play automatically)
    const audioUrl = await this.generateElevenLabsAudio(response) || undefined;
    this.messages.push({ text: response, sender: 'bot', audioUrl });
  } catch (error) {
    // Remove thinking message on error
    this.messages.pop();
    this.isThinking = false;
    this.messages.push({ text: 'Sorry, I encountered an error. Please try again.', sender: 'bot' });
  }
}
  // Call Gemini AI
  async geminiChat(message: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

      const prompt = `
        You are an agriculture expert.

        Rules for answering:
        - Only answer agriculture-related questions (farming, crops, soil, irrigation, fertilizers, pesticides, agri-tech).
        - If the question is unrelated, reply exactly: "Sorry, I can only answer agriculture-related questions."
        - Format in numbered points.
        - Each point on a new line.
        - After points, add a 2–3 sentence summary.
        - Ask 2–3 follow-up questions.
        - Keep answers concise.
        - Return response in beautified HTML.
        - Respond in this language: ${this.selectedLanguage}

        User Question: ${message}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();

    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return 'Sorry, I encountered an error. Please try again.';
    }
  }

  // Generate audio via ElevenLabs
  public async generateElevenLabsAudio(text: string): Promise<string | null> {
    try {
      const apiKey = "sk_3a7607f0c0df4262805a721f48f723edc94f2b396ed0c7fe";
      const voiceId = this.getVoiceIdForLanguage(this.selectedLanguage);

      const response = await this.http.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true
          }
        },
        {
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json'
          },
          responseType: 'blob'
        }
      ).toPromise();

      if (response) {
        const audioBlob = new Blob([response], { type: 'audio/mpeg' });
        return URL.createObjectURL(audioBlob);
      }

      return null;
    } catch (error) {
      console.error('ElevenLabs API error:', error);
      return null;
    }
  }

  // Map languages to ElevenLabs voice IDs
  public getVoiceIdForLanguage(language: string): string {
    switch (language) {
      case 'Hindi': return 'pNInz6obpgDQGcFmaJgB'; // Adam
      case 'Punjabi': return '21m00Tcm4TlvDq8ikWAM'; // Rachel
      default: return 'EXAVITQu4vr4xnSDxMaL'; // Bella (English)
    }
  }

  // Play audio manually when speaker icon is clicked
  public async playAudio(audioUrl: string, messageIndex: number): Promise<void> {
    // Stop current audio if playing
    if (this.currentAudio) {
      this.stopSpeech();
    }

    return new Promise((resolve, reject) => {
      this.currentAudio = new Audio(audioUrl);
      this.playingMessageIndex = messageIndex;

      this.currentAudio.onended = () => {
        this.playingMessageIndex = -1;
        this.currentAudio = null;
        resolve();
      };

      this.currentAudio.onerror = (error) => {
        this.playingMessageIndex = -1;
        this.currentAudio = null;
        reject(error);
      };

      this.currentAudio.play().catch(reject);
    });
  }

  // Stop speech
  stopSpeech() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.playingMessageIndex = -1;
  }

  // Check if a specific message is currently playing
  isMessagePlaying(index: number): boolean {
    return this.playingMessageIndex === index;
  }

}