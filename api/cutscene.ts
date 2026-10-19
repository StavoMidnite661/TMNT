import { GoogleGenAI } from '@google/genai';

/**
 * Shared cutscene-dialogue pipeline.
 * Used by both the local Express server (server.ts) and the
 * Vercel serverless function (this file's default export).
 */

const MAX_CONTEXT_CHARS = 2000;
const MAX_CHOICE_CHARS = 200;
const MAX_DIALOGUE_LINES = 6;
const MAX_LINE_CHARS = 300;

export const FALLBACK_DIALOGUE = [
  { name: 'Splinter', text: 'The alley is quiet... too quiet. The Foot is gathering beyond the docks.' },
  { name: 'Raphael', text: "Quiet never stopped them before. Let's move." },
];

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

let genAI: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!genAI) {
    genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
  }
  return genAI;
}

function sanitizeDialogue(raw: unknown): { dialogue: { name: string; text: string }[] } | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as { dialogue?: unknown };
  if (!Array.isArray(obj.dialogue) || obj.dialogue.length === 0) return null;

  const lines = obj.dialogue.slice(0, MAX_DIALOGUE_LINES).map((line: any) => ({
    name: String(line?.name ?? 'Shadows').slice(0, 40),
    text: String(line?.text ?? '...').slice(0, MAX_LINE_CHARS),
  }));
  return { dialogue: lines };
}

function extractJson(text: string): unknown | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export interface CutsceneResult {
  status: number;
  body: Record<string, unknown>;
}

export async function generateCutscene(body: unknown): Promise<CutsceneResult> {
  const { sceneContext, playerChoice } = (body ?? {}) as { sceneContext?: unknown; playerChoice?: unknown };

  if (
    typeof sceneContext !== 'string' ||
    sceneContext.trim().length === 0 ||
    sceneContext.length > MAX_CONTEXT_CHARS
  ) {
    return { status: 400, body: { error: `sceneContext must be a non-empty string (max ${MAX_CONTEXT_CHARS} chars)` } };
  }
  if (playerChoice !== undefined && (typeof playerChoice !== 'string' || playerChoice.length > MAX_CHOICE_CHARS)) {
    return { status: 400, body: { error: `playerChoice must be a string (max ${MAX_CHOICE_CHARS} chars)` } };
  }

  const ai = getGenAI();
  if (!ai) {
    console.warn('[API] GEMINI_API_KEY not set — returning fallback dialogue');
    return { status: 503, body: { dialogue: FALLBACK_DIALOGUE, fallback: true } };
  }

  const prompt = `
        You are writing dialogue for a gritty, mature 16-bit TMNT-inspired beat-em-up game called 'Shells in the Shadows'. 
        The tone is dark, urban, and industrial. 
        Context: ${sceneContext}
        Player Choice: ${playerChoice || 'None'}
        
        Write a brief interaction (max 3 lines) between a Turtle and a gritty NPC (e.g. a gang leader, a corrupt cop, or a mysterious contact).
        Include a moral consequence or a hint for the next level.
        Output as JSON: { "dialogue": [ { "name": "CHARACTER_NAME", "text": "DIALOGUE_TEXT" } ] }
      `;

  try {
    const response = await ai.models.generateContent({ model: GEMINI_MODEL, contents: prompt });
    const text = response.text || '';
    const parsed = extractJson(text);
    const sanitized = parsed ? sanitizeDialogue(parsed) : null;
    return { status: 200, body: sanitized ?? { dialogue: FALLBACK_DIALOGUE, fallback: true } };
  } catch (error) {
    console.error('Gemini Error:', error);
    return { status: 502, body: { error: 'AI dialogue provider failed', dialogue: FALLBACK_DIALOGUE, fallback: true } };
  }
}

// Vercel serverless function entry point
export async function POST(request: Request): Promise<Response> {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }
  const result = await generateCutscene(body);
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
