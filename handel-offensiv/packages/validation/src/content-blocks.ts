/**
 * Zod-Schemas für das `config`-jsonb-Feld von `content_blocks`,
 * ein Schema je `block_type` (Postgres-Enum).
 */
import { z } from "zod";

/** Alle Block-Typen – muss dem Postgres-Enum `block_type` entsprechen. */
export const blockTypes = [
  "text",
  "video",
  "audio",
  "pdf",
  "image",
  "checklist",
  "reflection",
  "single_choice",
  "multiple_choice",
  "quiz",
  "scale",
  "transfer_task",
  "download",
  "external_link",
] as const;

export type BlockType = (typeof blockTypes)[number];
export const blockTypeSchema = z.enum(blockTypes);

/* ----------------------------- Bausteine ----------------------------- */

/** Nur https-URLs erlaubt (kein http). */
export const httpsUrlSchema = z
  .string()
  .url({ message: "Muss eine gültige URL sein" })
  .refine((u) => u.startsWith("https://"), {
    message: "Nur https-URLs sind erlaubt",
  });

/** Pfad im Supabase-Storage (relativ, nicht leer). */
export const storagePathSchema = z
  .string()
  .min(1, "Storage-Pfad darf nicht leer sein");

const nonEmpty = (msg: string) => z.string().min(1, msg);
const durationSecondsSchema = z.number().int().positive();

/* ------------------------- Schemas je Blocktyp ------------------------ */

/** text: html ODER markdown – mindestens eines muss gesetzt sein. */
export const textConfigSchema = z
  .object({
    html: z.string().min(1).optional(),
    markdown: z.string().min(1).optional(),
  })
  .refine((v) => v.html !== undefined || v.markdown !== undefined, {
    message: "Entweder html oder markdown muss angegeben werden",
  });

/** video: je nach Provider url (extern) oder storagePath (Storage). */
const videoCommon = {
  title: nonEmpty("Titel erforderlich"),
  description: z.string().optional(),
  thumbnailPath: storagePathSchema.optional(),
  durationSeconds: durationSecondsSchema.optional(),
  subtitlesPath: storagePathSchema.optional(),
};

export const videoConfigSchema = z.discriminatedUnion("provider", [
  z.object({ provider: z.literal("external"), url: httpsUrlSchema, ...videoCommon }),
  z.object({ provider: z.literal("storage"), storagePath: storagePathSchema, ...videoCommon }),
]);

export const audioConfigSchema = z.object({
  storagePath: storagePathSchema,
  durationSeconds: durationSecondsSchema.optional(),
  title: nonEmpty("Titel erforderlich"),
});

export const pdfConfigSchema = z.object({
  storagePath: storagePathSchema,
  title: nonEmpty("Titel erforderlich"),
});

/** image: alt-Text ist Pflicht (Barrierefreiheit). */
export const imageConfigSchema = z.object({
  storagePath: storagePathSchema,
  alt: nonEmpty("Alternativtext erforderlich"),
  caption: z.string().optional(),
});

export const checklistItemSchema = z.object({
  id: nonEmpty("Item-ID erforderlich"),
  label: nonEmpty("Label erforderlich"),
});

/** checklist: mindestens 1 Item. */
export const checklistConfigSchema = z.object({
  items: z.array(checklistItemSchema).min(1, "Mindestens ein Item erforderlich"),
});

/** reflection: Standard-Sichtbarkeit + ob Teilnehmer sie ändern dürfen. */
export const reflectionConfigSchema = z.object({
  question: nonEmpty("Frage erforderlich"),
  visibilityDefault: z.enum(["private", "trainer"]),
  allowVisibilityChoice: z.boolean(),
});

const choiceOptionSchema = z.object({
  id: nonEmpty("Options-ID erforderlich"),
  label: nonEmpty("Label erforderlich"),
  correct: z.boolean().optional(),
});

const choiceBase = z.object({
  question: nonEmpty("Frage erforderlich"),
  options: z.array(choiceOptionSchema).min(2, "Mindestens zwei Optionen erforderlich"),
  explanation: z.string().optional(),
});

/** single_choice: höchstens eine Option darf als korrekt markiert sein. */
export const singleChoiceConfigSchema = choiceBase.refine(
  (v) => v.options.filter((o) => o.correct === true).length <= 1,
  { message: "Bei Single Choice darf höchstens eine Option korrekt sein", path: ["options"] },
);

export const multipleChoiceConfigSchema = choiceBase;

/** quiz: verweist auf quizzes.id. */
export const quizConfigSchema = z.object({
  quizId: z.string().uuid("quizId muss eine UUID sein"),
});

/** scale: Skala 1–10 (Default), min < max. */
export const scaleConfigSchema = z
  .object({
    question: nonEmpty("Frage erforderlich"),
    min: z.number().int().min(0).max(9).default(1),
    max: z.number().int().min(1).max(10).default(10),
    minLabel: z.string().optional(),
    maxLabel: z.string().optional(),
  })
  .refine((v) => v.min < v.max, { message: "min muss kleiner als max sein" });

/** transfer_task: Fälligkeit fix oder relativ zur Freischaltung. */
export const transferTaskConfigSchema = z
  .object({
    title: nonEmpty("Titel erforderlich"),
    description: nonEmpty("Beschreibung erforderlich"),
    dueMode: z.enum(["fixed", "days_after_release"]).optional(),
    dueAt: z.string().datetime({ offset: true }).optional(),
    dueDays: z.number().int().positive().optional(),
    evidence: z.object({
      text: z.boolean(),
      image: z.boolean(),
      file: z.boolean(),
    }),
  })
  .refine((v) => v.dueMode !== "fixed" || v.dueAt !== undefined, {
    message: "dueAt ist bei dueMode 'fixed' erforderlich",
    path: ["dueAt"],
  })
  .refine((v) => v.dueMode !== "days_after_release" || v.dueDays !== undefined, {
    message: "dueDays ist bei dueMode 'days_after_release' erforderlich",
    path: ["dueDays"],
  })
  .refine((v) => v.evidence.text || v.evidence.image || v.evidence.file, {
    message: "Mindestens eine Nachweisart muss erlaubt sein",
    path: ["evidence"],
  });

export const downloadConfigSchema = z.object({
  storagePath: storagePathSchema,
  title: nonEmpty("Titel erforderlich"),
  description: z.string().optional(),
});

/**
 * external_link: nur https; `note` ist Pflicht (Kennzeichnungspflicht –
 * Hinweis, dass ein externer Anbieter geöffnet wird).
 */
export const externalLinkConfigSchema = z.object({
  url: httpsUrlSchema,
  label: nonEmpty("Label erforderlich"),
  note: nonEmpty("Hinweistext (Kennzeichnungspflicht) erforderlich"),
});

/* --------------------------- Zuordnung/Union -------------------------- */

/** Map block_type → Config-Schema. */
export const blockConfigSchemas = {
  text: textConfigSchema,
  video: videoConfigSchema,
  audio: audioConfigSchema,
  pdf: pdfConfigSchema,
  image: imageConfigSchema,
  checklist: checklistConfigSchema,
  reflection: reflectionConfigSchema,
  single_choice: singleChoiceConfigSchema,
  multiple_choice: multipleChoiceConfigSchema,
  quiz: quizConfigSchema,
  scale: scaleConfigSchema,
  transfer_task: transferTaskConfigSchema,
  download: downloadConfigSchema,
  external_link: externalLinkConfigSchema,
} as const satisfies Record<BlockType, z.ZodTypeAny>;

export type BlockConfigMap = {
  [K in BlockType]: z.infer<(typeof blockConfigSchemas)[K]>;
};
export type BlockConfig = BlockConfigMap[BlockType];

/** Liefert das Config-Schema zum gegebenen block_type. */
export function blockConfigSchema<T extends BlockType>(
  blockType: T,
): (typeof blockConfigSchemas)[T] {
  return blockConfigSchemas[blockType];
}

/**
 * Discriminated Union über {blockType, config} – z. B. für
 * Admin-Formulare, die Typ und Konfiguration gemeinsam validieren.
 */
export const typedBlockConfigSchema = z.discriminatedUnion(
  "blockType",
  blockTypes.map((t) =>
    z.object({ blockType: z.literal(t), config: blockConfigSchemas[t] }),
  ) as unknown as [
    z.ZodObject<{ blockType: z.ZodLiteral<BlockType>; config: z.ZodTypeAny }>,
    ...z.ZodObject<{ blockType: z.ZodLiteral<BlockType>; config: z.ZodTypeAny }>[],
  ],
);

/** Fehler mit lesbarer, deutschsprachiger Zusammenfassung aller Issues. */
export class BlockConfigError extends Error {
  constructor(
    public readonly blockType: BlockType,
    public readonly issues: z.ZodIssue[],
  ) {
    const details = issues
      .map((i) => `${i.path.length > 0 ? i.path.join(".") : "(root)"}: ${i.message}`)
      .join("; ");
    super(`Ungültige config für block_type "${blockType}": ${details}`);
    this.name = "BlockConfigError";
  }
}

/**
 * Parst und validiert eine Block-Konfiguration.
 * Wirft BlockConfigError mit sauberer Fehlermeldung bei ungültigen Daten.
 */
export function parseBlockConfig<T extends BlockType>(
  blockType: T,
  config: unknown,
): BlockConfigMap[T] {
  const result = blockConfigSchemas[blockType].safeParse(config);
  if (!result.success) {
    throw new BlockConfigError(blockType, result.error.issues);
  }
  return result.data as BlockConfigMap[T];
}

/** Wie parseBlockConfig, aber ohne Exception (safeParse-Variante). */
export function safeParseBlockConfig<T extends BlockType>(
  blockType: T,
  config: unknown,
):
  | { success: true; data: BlockConfigMap[T] }
  | { success: false; error: BlockConfigError } {
  const result = blockConfigSchemas[blockType].safeParse(config);
  if (!result.success) {
    return { success: false, error: new BlockConfigError(blockType, result.error.issues) };
  }
  return { success: true, data: result.data as BlockConfigMap[T] };
}
