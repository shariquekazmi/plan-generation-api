import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OutboundCallService {
  private ai: GoogleGenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables.');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  // Evaluate or refine the user's prompt
  // helper function to evaluate if a prompt needs refinement
  async evaluatePromptForRefinement(
    prompt: string,
  ): Promise<{
    action: 'clarify' | 'approve';
    message: string;
    suggestions: string[];
  }> {
    const systemInstruction = `
You are a prompt-refinement assistant. Given the user's prompt, either:
 - return {"action":"approve","message":"..."} if the prompt is clear enough and just needs user confirmation,
 - OR return {"action":"suggestions","message":"...","suggestions":["...","...","..."]} suggesting specific ways to improve the prompt.

Respond ONLY with valid JSON. No extra text. 
User prompt: """${prompt}"""
`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: systemInstruction,
      });

      // Extract response text safely
      let text = '';
      if (typeof (response as any).text === 'function')
        text = (response as any).text();
      else if ((response as any).output?.[0]?.content?.[0]?.text)
        text = (response as any).output[0].content[0].text;
      else text = JSON.stringify(response);

      // 🧹 Clean markdown wrappers
      text = text.replace(/```json|```/g, '').trim();

      // 🧠 Parse Gemini JSON safely
      try {
        let parsed = JSON.parse(text);

        // 🩹 Double-parse if Gemini wrapped JSON as a string
        if (typeof parsed === 'string') {
          try {
            parsed = JSON.parse(parsed);
          } catch {}
        }

        return {
          action: parsed.action || 'clarify',
          message:
            parsed.message && parsed.message.trim()
              ? parsed.message
              : 'Could you clarify what you mean?',
          suggestions: Array.isArray(parsed.suggestions)
            ? parsed.suggestions
            : [],
        };
      } catch (err) {
        console.warn('⚠️ Could not parse Gemini JSON, fallback used.', text);
        return {
          action: 'clarify',
          message: text || 'Could you clarify what you mean?',
          suggestions: [],
        };
      }
    } catch (err) {
      console.error('❌ Gemini API error in evaluatePromptForRefinement:', err);
      return {
        action: 'clarify',
        message:
          'Can you be more specific about what you expect the AI to produce?',
        suggestions: [],
      };
    }
  }

  // Regular Gemini call (final generation)
  async geminiApiCall(query: string): Promise<any> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: query,
      });

      if (typeof (response as any).text === 'function') {
        return (response as any).text();
      } else if ((response as any).output?.[0]?.content?.[0]?.text) {
        return (response as any).output[0].content[0].text;
      } else {
        return JSON.stringify(response);
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error('Failed to get response from Gemini API.');
    }
  }
}
