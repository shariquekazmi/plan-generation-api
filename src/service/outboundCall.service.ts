import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OutboundCallService {
  constructor() {}

  async geminiApiCall() {
    const configService = new ConfigService();
    console.log('Gemini API Key:', configService.get<string>('GEMINI_API_KEY'));
    const ai = new GoogleGenAI({
      apiKey: configService.get<string>('GEMINI_API_KEY'),
    });
    return 'Gemini API Call Successful';
  }
}
