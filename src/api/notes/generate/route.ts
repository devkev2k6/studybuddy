import { generateLectureNotes, NoteGenerationInputSchema } from '../../../lib/ai/notesGenerator';
import type { StudyNote } from '../../../types/guardian';

/**
 * POST /api/notes/generate
 * Accepts a lecture transcript and optional lecture title,
 * returning structured StudyNote JSON with key takeaways and summary.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: 'Invalid JSON body provided in request.' },
        { status: 400 }
      );
    }

    const validation = NoteGenerationInputSchema.safeParse(body);
    if (!validation.success) {
      return Response.json(
        {
          error: 'Validation failed for lecture transcript payload.',
          issues: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const studyNote: StudyNote = await generateLectureNotes(validation.data);

    return Response.json(studyNote, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return Response.json(
      {
        error: 'Failed to generate study notes from transcript.',
        details: message,
      },
      { status: 500 }
    );
  }
}
