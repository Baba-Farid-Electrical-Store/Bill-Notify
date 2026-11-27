import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { safeApiErrorMessage, safeApiErrorStatus } from '@/lib/api-errors';
import { db } from '@/lib/db';
import { settings, templates } from '@/lib/db/schema';
import { normalizeCountryCode } from '@/lib/phone';

export const dynamic = 'force-dynamic';

const settingsSchema = z.object({
  storeName: z.string().min(1).max(120),
  countryCode: z
    .string()
    .transform((value) => normalizeCountryCode(value) ?? value)
    .pipe(z.string().regex(/^\+\d{1,3}$/, 'Enter a country calling code such as +91.')),
  lookbackHours: z.coerce.number().int().min(1).max(720),
  autoSend: z.boolean(),
  dryRun: z.boolean(),
  confirmedBackfill: z.boolean().optional(),
});

export async function GET() {
  try {
    await requireUser();
    const database = db();
    const [created] = await database
      .insert(settings)
      .values({ id: 1 })
      .onConflictDoNothing()
      .returning();
    const [current] = created
      ? [created]
      : await database.select().from(settings).where(eq(settings.id, 1)).limit(1);
    const templateList = await database.select().from(templates);

    return Response.json({
      settings: current,
      templates: templateList,
      connections: {
        odooUrl: process.env.ODOO_URL || '',
        odooDb: process.env.ODOO_DB || '',
        odooUsername: process.env.ODOO_USERNAME || '',
        httpsmsFrom: process.env.HTTPSMS_FROM_NUMBER || '',
      },
    });
  } catch (error) {
    return Response.json(
      { error: safeApiErrorMessage(error, 'Could not load settings.') },
      { status: safeApiErrorStatus(error, 500) },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireUser();
    const input = settingsSchema.parse(await request.json());
    const database = db();
    const [current] = await database.select().from(settings).where(eq(settings.id, 1)).limit(1);

    if (input.autoSend && !current?.initialSyncDone) {
      return Response.json({ error: 'Run the first sync before enabling auto-send.' }, { status: 400 });
    }
    if (input.autoSend && !current?.autoSend && !input.confirmedBackfill) {
      return Response.json(
        { error: 'Review the first sync and confirm before enabling auto-send.' },
        { status: 400 },
      );
    }

    const values = {
      id: 1,
      storeName: input.storeName,
      countryCode: input.countryCode,
      lookbackHours: input.lookbackHours,
      autoSend: input.autoSend && !!current?.initialSyncDone,
      dryRun: input.dryRun,
      updatedAt: new Date(),
    };

    await database.insert(settings).values(values).onConflictDoUpdate({
      target: settings.id,
      set: {
        storeName: values.storeName,
        countryCode: values.countryCode,
        lookbackHours: values.lookbackHours,
        autoSend: values.autoSend,
        dryRun: values.dryRun,
        updatedAt: values.updatedAt,
      },
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: safeApiErrorMessage(error, 'Could not save settings.') },
      { status: safeApiErrorStatus(error, 500) },
    );
  }
}
