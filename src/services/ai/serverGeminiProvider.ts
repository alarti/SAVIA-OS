import type { AIProvider, AIRequest, AIResponse, AIChunk } from './types';

/**
 * Server-Proxied Gemini Provider (Safe, hides API key behind /api/ai/chat)
 */
export class ServerGeminiProvider implements AIProvider {
  public id = 'server-gemini-3.7-flash';
  public name = 'Google Gemini 3.7 Flash (Servidor Seguro)';

  public async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch('/api/ai/project-state', { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async generateText(input: AIRequest, signal?: AbortSignal): Promise<AIResponse> {
    const t0 = performance.now();

    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: input.prompt,
        history: input.history || [],
        systemInstruction: input.systemInstruction,
      }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
      throw new Error(errorData.error || `HTTP ${response.status} from AI Server`);
    }

    const data = await response.json();
    const t1 = performance.now();

    return {
      text: data.reply || '',
      modelUsed: 'gemini-2.5-flash',
      latencyMs: Math.round(t1 - t0),
    };
  }

  public async *streamText(input: AIRequest, signal?: AbortSignal): AsyncIterable<AIChunk> {
    // Fallback emulation for non-SSE servers: generates text and streams words progressively
    const full = await this.generateText(input, signal);
    const words = full.text.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (signal?.aborted) break;
      const isComplete = i === words.length - 1;
      const deltaText = words[i] + (isComplete ? '' : ' ');
      yield { deltaText, isComplete };
      // Small simulated streaming cadence
      await new Promise((resolve) => setTimeout(resolve, 15));
    }
  }
}

export const defaultAiProvider = new ServerGeminiProvider();
