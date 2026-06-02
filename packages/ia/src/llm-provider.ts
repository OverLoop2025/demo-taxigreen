export interface GenerateObjectArgs<T> {
  prompt: string;
  schema: unknown;
  timeoutMs?: number;
  maxTokens?: number;
  __outType?: T;
}

export interface GenerateTextArgs {
  prompt: string;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface LLMProvider {
  readonly name: string;
  generateObject<T>(args: GenerateObjectArgs<T>): Promise<T>;
  generateText(args: GenerateTextArgs): Promise<string>;
}
