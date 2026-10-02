import { z } from 'zod';
import type { StudyNote } from '../../types/guardian';
import { mockStudyNotes } from '../mocks/guardianMocks';

/**
 * Validation schema for the incoming transcript payload.
 */
export const NoteGenerationInputSchema = z.object({
  transcriptText: z.string().min(1, 'transcriptText is required and cannot be empty'),
  lectureTitle: z.string().optional(),
});

export type NoteGenerationInput = z.infer<typeof NoteGenerationInputSchema>;

/**
 * Zod schema enforcing the required structured LLM response shape.
 */
export const LLMNotesResponseSchema = z.object({
  sourceTitle: z.string().min(1, 'sourceTitle must be non-empty'),
  summary: z.string().min(1, 'summary must be non-empty'),
  keyTakeaways: z.array(z.string().min(1)).min(1, 'At least one key takeaway is required'),
  actionItems: z.array(z.string()).default([]),
});

export type LLMNotesResponse = z.infer<typeof LLMNotesResponseSchema>;

const SYSTEM_PROMPT = `You are an expert academic tutor and lecture note synthesizer.
Given a lecture transcript, transform it into structured, high-yield study notes.
You MUST output ONLY a valid JSON object adhering strictly to this JSON schema:
{
  "sourceTitle": "string",
  "summary": "2-3 concise summary sentences",
  "keyTakeaways": ["string", "string", "string", "string"],
  "actionItems": ["string", "string"]
}
Do not wrap your output in markdown formatting or commentary. Return raw JSON only.`;

/**
 * Generates structured notes from a lecture transcript.
 * Falls back to deterministic seed data with 800ms latency if USE_MOCK_AI is set or API keys are absent.
 */
export async function generateLectureNotes(input: NoteGenerationInput): Promise<StudyNote> {
  const validatedInput = NoteGenerationInputSchema.parse(input);

  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const forceMock = process.env.USE_MOCK_AI === 'true';

  const shouldUseMock = forceMock || (!geminiApiKey && !openaiApiKey);

  if (shouldUseMock) {
    return generateMockNotes(validatedInput);
  }

  try {
    if (geminiApiKey) {
      return await generateWithGemini(validatedInput, geminiApiKey);
    } else if (openaiApiKey) {
      return await generateWithOpenAI(validatedInput, openaiApiKey);
    } else {
      return generateMockNotes(validatedInput);
    }
  } catch (error) {
    console.warn('Live LLM synthesis failed; falling back to deterministic mock note.', error);
    return generateMockNotes(validatedInput);
  }
}

/**
 * Mock generator with 800ms latency matching the exact StudyNote schema.
 */
async function generateMockNotes(input: NoteGenerationInput): Promise<StudyNote> {
  // Realistic 800ms artificial latency
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Deterministically select a rich pre-computed mock note based on input content
  const hash = input.transcriptText
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const selectedMock = mockStudyNotes[hash % mockStudyNotes.length];

  const title = input.lectureTitle?.trim() || selectedMock.sourceTitle;

  const note: StudyNote = {
    id: `note_gen_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    sourceTitle: title,
    summary: selectedMock.summary,
    keyTakeaways: selectedMock.keyTakeaways,
    actionItems: [
      'Review fundamental theorems and implementation guarantees',
      'Solve associated problem set exercises',
    ],
    handwrittenRenderUrl: selectedMock.handwrittenRenderUrl,
    createdAt: new Date().toISOString(),
  };

  return note;
}

/**
 * Cleanly strips markdown code fence wrappers from LLM string output if present.
 */
function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }
  return cleaned.trim();
}

/**
 * Calls Google Gemini API using @google/genai SDK.
 */
async function generateWithGemini(
  input: NoteGenerationInput,
  apiKey: string
): Promise<StudyNote> {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Lecture Title: ${input.lectureTitle ?? 'Untitled Lecture'}\n\nTranscript Content:\n${input.transcriptText}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json',
    },
  });

  const rawText = response.text ?? '';
  const parsed = JSON.parse(cleanJsonString(rawText));
  const validated = LLMNotesResponseSchema.parse(parsed);

  return {
    id: `note_live_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    sourceTitle: validated.sourceTitle || input.lectureTitle || 'Lecture Notes',
    summary: validated.summary,
    keyTakeaways: validated.keyTakeaways,
    actionItems: validated.actionItems,
    handwrittenRenderUrl: null,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Calls OpenAI API using official openai SDK.
 */
async function generateWithOpenAI(
  input: NoteGenerationInput,
  apiKey: string
): Promise<StudyNote> {
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey });

  const prompt = `Lecture Title: ${input.lectureTitle ?? 'Untitled Lecture'}\n\nTranscript Content:\n${input.transcriptText}`;

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
  });

  const rawText = completion.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(cleanJsonString(rawText));
  const validated = LLMNotesResponseSchema.parse(parsed);

  return {
    id: `note_live_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    sourceTitle: validated.sourceTitle || input.lectureTitle || 'Lecture Notes',
    summary: validated.summary,
    keyTakeaways: validated.keyTakeaways,
    actionItems: validated.actionItems,
    handwrittenRenderUrl: null,
    createdAt: new Date().toISOString(),
  };
}
