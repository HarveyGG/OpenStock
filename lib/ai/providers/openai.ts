import OpenAI from 'openai';
import { AIProvider } from '../types';

export class OpenAIProvider implements AIProvider {
    private client: OpenAI;
    private model: string;

    constructor(apiKey: string, model: string = 'gpt-4o-mini') {
        this.client = new OpenAI({ apiKey });
        this.model = model;
    }

    async generateText(prompt: string): Promise<string> {
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
        });

        return response.choices[0]?.message?.content?.trim() || '';
    }
}

