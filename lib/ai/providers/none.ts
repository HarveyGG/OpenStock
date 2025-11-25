import { AIProvider } from '../types';

export class NoneProvider implements AIProvider {
    async generateText(prompt: string): Promise<string> {
        return '';
    }
}

