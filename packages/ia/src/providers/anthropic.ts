import { anthropic } from '@ai-sdk/anthropic';
import { generateObject, generateText, type FlexibleSchema } from 'ai';
import type { LLMProvider, GenerateObjectArgs, GenerateTextArgs } from '../llm-provider';

export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic';

  constructor(
    private readonly modelExtraccion: string = 'claude-sonnet-4-6',
    private readonly modelRapido: string = 'claude-haiku-4-5-20251001',
  ) {}

  async generateObject<T>({ prompt, schema, timeoutMs = 5000, maxTokens = 1400 }: GenerateObjectArgs<T>): Promise<T> {
    this.assertConfigured();
    const result = await generateObject({
      model: anthropic(this.modelExtraccion),
      schema: schema as FlexibleSchema<T>,
      prompt,
      maxOutputTokens: maxTokens,
      maxRetries: 0,
      timeout: timeoutMs,
    });
    return result.object as T;
  }

  async generateText({ prompt, timeoutMs = 3000, maxTokens = 600 }: GenerateTextArgs): Promise<string> {
    this.assertConfigured();
    const result = await generateText({
      model: anthropic(this.modelRapido),
      prompt,
      maxOutputTokens: maxTokens,
      maxRetries: 0,
      timeout: timeoutMs,
    });
    return result.text;
  }

  modelos(): { extraccion: string; rapido: string } {
    return { extraccion: this.modelExtraccion, rapido: this.modelRapido };
  }

  private assertConfigured() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY no configurada');
    }
  }
}
