export interface AIProvider {
    generateText(prompt: string): Promise<string>;
}

export type AIProviderType = 'gemini' | 'openai' | 'none';

