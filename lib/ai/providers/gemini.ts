import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider } from '../types';

export class GeminiProvider implements AIProvider {
    private client: GoogleGenerativeAI;
    private model: string;

    constructor(apiKey: string, model: string = 'gemini-2.0-flash-exp') {
        this.client = new GoogleGenerativeAI(apiKey);
        this.model = model;
    }

    async generateText(prompt: string): Promise<string> {
        const model = this.client.getGenerativeModel({ model: this.model });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    }
}

