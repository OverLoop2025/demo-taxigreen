import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export interface PromptCargado {
  meta: {
    version: number;
    purpose?: string;
    targetModel?: string;
    fallback?: string;
  };
  body: string;
}

export const PROMPTS_DISPONIBLES = [
  'ingesta-whatsapp.v1',
  'aclaracion-datos-faltantes.v1',
  'asignacion-racional.v1',
  'clasificacion-incidencia.v1',
] as const;

export type NombrePrompt = (typeof PROMPTS_DISPONIBLES)[number];

function parseFrontmatter(raw: string): PromptCargado {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/u.exec(raw);
  if (!match?.[1] || !match[2]) {
    return { meta: { version: 1 }, body: raw.trim() };
  }

  const meta: PromptCargado['meta'] = { version: 1 };
  for (const line of match[1].split('\n')) {
    const [key, ...rest] = line.split(':');
    if (!key || rest.length === 0) continue;
    const value = rest.join(':').trim();
    if (key === 'version') meta.version = Number(value);
    if (key === 'purpose') meta.purpose = value;
    if (key === 'target-model') meta.targetModel = value;
    if (key === 'fallback') meta.fallback = value;
  }

  return { meta, body: match[2].trim() };
}

export function loadPrompt(nombre: NombrePrompt): PromptCargado {
  const path = fileURLToPath(new URL(`../prompts/${nombre}.md`, import.meta.url));
  return parseFrontmatter(readFileSync(path, 'utf8'));
}

export function renderPrompt(nombre: NombrePrompt, variables: Record<string, string | null | undefined>): string {
  const prompt = loadPrompt(nombre);
  const body = prompt.body.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, key: string) => {
    return variables[key] ?? '';
  });
  return body;
}
