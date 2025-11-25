import { AIProvider, AIProviderType } from './types';
import { GeminiProvider } from './providers/gemini';
import { OpenAIProvider } from './providers/openai';
import { NoneProvider } from './providers/none';

export function createAIProvider(): AIProvider | null {
    const providerType = (process.env.AI_PROVIDER || 'auto').toLowerCase() as AIProviderType | 'auto';
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (providerType === 'none') {
        return null;
    }

    if (providerType === 'openai') {
        if (!openaiKey) {
            console.warn('⚠️ OPENAI_API_KEY not set, AI features disabled');
            return null;
        }
        const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
        console.log(`🤖 Using OpenAI provider with model: ${model}`);
        return new OpenAIProvider(openaiKey, model);
    }

    if (providerType === 'gemini') {
        if (!geminiKey) {
            console.warn('⚠️ GEMINI_API_KEY not set, AI features disabled');
            return null;
        }
        const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
        console.log(`🤖 Using Gemini provider with model: ${model}`);
        return new GeminiProvider(geminiKey, model);
    }

    if (providerType === 'auto') {
        if (openaiKey) {
            const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
            console.log(`🤖 Auto-selected OpenAI provider with model: ${model}`);
            return new OpenAIProvider(openaiKey, model);
        }
        if (geminiKey) {
            const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
            console.log(`🤖 Auto-selected Gemini provider with model: ${model}`);
            return new GeminiProvider(geminiKey, model);
        }
    }

    console.warn('⚠️ No AI provider configured, AI features disabled');
    return null;
}

