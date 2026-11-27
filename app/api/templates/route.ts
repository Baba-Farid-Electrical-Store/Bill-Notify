import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { safeApiErrorMessage, safeApiErrorStatus } from '@/lib/api-errors';
import { db } from '@/lib/db';
import { templates } from '@/lib/db/schema';
import { DEFAULT_BODY } from '@/lib/templates';

export const dynamic = 'force-dynamic';

const templateSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  language: z.string().min(1),
  body: z.string().min(1),
  isDefault: z.boolean(),
});

export async function GET() {
  try {
    await requireUser();
    const database = db();
    const existingDefault = await database
      .select()
      .from(templates)
      .where(eq(templates.isDefault, true))
      .limit(1);

    if (existingDefault.length === 0) {
      await database
        .insert(templates)
        .values({ name: 'Invoice ready', language: 'English', body: DEFAULT_BODY, isDefault: true })
        .onConflictDoNothing();
    }

    return Response.json(await database.select().from(templates));
  } catch (error) {
    return Response.json(
      { error: safeApiErrorMessage(error, 'Could not load templates.') },
      { status: safeApiErrorStatus(error, 500) },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireUser();
    const input = templateSchema.parse(await request.json());
    const database = db();

    if (input.isDefault) {
      await database.update(templates).set({ isDefault: false });
    }

    if (input.id) {
      await database
        .update(templates)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(templates.id, input.id));
    } else {
      await database.insert(templates).values(input);
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: safeApiErrorMessage(error, 'Could not save the template.') },
      { status: safeApiErrorStatus(error, 500) },
    );
  }
}
