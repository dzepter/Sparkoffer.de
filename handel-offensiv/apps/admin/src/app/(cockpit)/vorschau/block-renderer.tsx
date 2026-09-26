import type { ReactNode } from "react";

import type { ContentBlockRow, QuizQuestionRow, QuizRow } from "@handel-offensiv/types";
import { safeParseBlockConfig, type BlockConfigMap } from "@handel-offensiv/validation";

import { formatDuration } from "@/lib/content-meta";
import { renderMarkdownToHtml, sanitizeHtml } from "@/lib/sanitize";
import { formatDateTime } from "@/lib/datetime";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Read-only-Block-Renderer fuer die Teilnehmer-Vorschau (§25).
 * Text/HTML wird ueber den eigenen Whitelist-Sanitizer abgesichert;
 * Videos/Audios erscheinen als Platzhalter-Karten, Downloads als Liste.
 * Korrekte Antworten werden NICHT verraten (exakte Teilnehmersicht).
 */

function Frame({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded border border-line bg-white p-5">
      <p className="mb-3 text-xs font-bold uppercase tracking-kicker text-ink-soft">{label}</p>
      {children}
    </section>
  );
}

function MediaPlaceholder({
  kind,
  title,
  durationSeconds,
  description,
}: {
  kind: "Video" | "Audio";
  title: string;
  durationSeconds?: number | undefined;
  description?: string | undefined;
}) {
  return (
    <div className="pitch-lines-dark flex items-center gap-4 rounded bg-dark p-5">
      <span
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-pill border-2 border-green-bright text-green-bright"
      >
        {/* Play-Dreieck rein per CSS */}
        <span className="ml-1 block h-0 w-0 border-y-8 border-l-[12px] border-y-transparent border-l-green-bright" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-kicker text-paper/60">{kind}</p>
        <p className="truncate text-base font-bold text-paper">{title}</p>
        <p className="text-xs text-paper/60">
          {durationSeconds !== undefined ? `Dauer: ${formatDuration(durationSeconds)}` : "Dauer folgt"}
          {description ? ` · ${description}` : ""}
        </p>
      </div>
    </div>
  );
}

function ChoicePreview({
  question,
  options,
  multiple,
}: {
  question: string;
  options: Array<{ id: string; label: string }>;
  multiple: boolean;
}) {
  return (
    <div>
      <p className="text-base font-bold text-ink">{question}</p>
      <ul className="mt-3 space-y-2">
        {options.map((option) => (
          <li key={option.id} className="flex items-center gap-3 text-sm text-ink">
            <span
              aria-hidden="true"
              className={`h-5 w-5 shrink-0 border-2 border-line bg-paper ${multiple ? "rounded" : "rounded-pill"}`}
            />
            {option.label}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink-soft">
        {multiple ? "Mehrere Antworten möglich." : "Eine Antwort wählbar."}
      </p>
    </div>
  );
}

async function QuizPreview({ quizId }: { quizId: string }) {
  const supabase = await createSupabaseServerClient();
  const [quizRes, questionsRes] = await Promise.all([
    supabase.from("quizzes").select("*").eq("id", quizId).maybeSingle(),
    supabase
      .from("quiz_questions")
      .select("id, position, kind, body, points")
      .eq("quiz_id", quizId)
      .order("position", { ascending: true }),
  ]);

  const quiz = (quizRes.data ?? null) as QuizRow | null;
  if (quizRes.error || questionsRes.error || quiz === null) {
    return (
      <p className="text-sm text-ink-soft">
        Das Quiz konnte gerade nicht geladen werden. Bitte versuchen Sie es erneut.
      </p>
    );
  }
  const questions = (questionsRes.data ?? []) as Array<
    Pick<QuizQuestionRow, "id" | "position" | "kind" | "body" | "points">
  >;

  return (
    <div>
      <p className="text-base font-bold text-ink">{quiz.title}</p>
      {quiz.description ? <p className="mt-1 text-sm text-ink-soft">{quiz.description}</p> : null}
      <p className="mt-2 text-xs text-ink-soft">
        {questions.length === 1 ? "1 Frage" : `${questions.length} Fragen`}
        {quiz.pass_score !== null ? ` · Bestehensgrenze ${quiz.pass_score} Punkte` : ""}
        {quiz.max_attempts !== null
          ? ` · ${quiz.max_attempts === 1 ? "1 Versuch" : `${quiz.max_attempts} Versuche`}`
          : " · Unbegrenzte Versuche"}
      </p>
      {questions.length > 0 ? (
        <ol className="mt-3 space-y-1.5 border-t border-line/60 pt-3">
          {questions.map((question, index) => (
            <li key={question.id} className="flex gap-2 text-sm text-ink">
              <span className="font-bold tabular-nums text-ink-soft">{index + 1}.</span>
              <span className="min-w-0 flex-1">{question.body}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

/** Rendert genau einen Content-Block read-only. */
export async function BlockPreview({ block }: { block: ContentBlockRow }) {
  const parsed = safeParseBlockConfig(block.block_type, block.config);
  if (!parsed.success) {
    return (
      <section className="rounded border border-line bg-paper p-5 text-sm text-ink-soft">
        Dieser Inhalt kann gerade nicht angezeigt werden.
      </section>
    );
  }

  switch (block.block_type) {
    case "text": {
      const cfg = parsed.data as BlockConfigMap["text"];
      const html =
        cfg.html !== undefined ? sanitizeHtml(cfg.html) : renderMarkdownToHtml(cfg.markdown ?? "");
      return (
        <section
          className="preview-prose rounded border border-line bg-white p-5 text-sm leading-relaxed text-ink [&_a]:font-bold [&_a]:text-green-deep [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-green [&_blockquote]:pl-3 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-extrabold [&_h2]:uppercase [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-bold [&_h4]:mt-2 [&_h4]:font-bold [&_li]:ml-5 [&_ol]:mt-2 [&_ol]:list-decimal [&_p]:mt-2 first:[&_p]:mt-0 [&_ul]:mt-2 [&_ul]:list-disc"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    case "video": {
      const cfg = parsed.data as BlockConfigMap["video"];
      return (
        <Frame label="Video">
          <MediaPlaceholder
            kind="Video"
            title={cfg.title}
            durationSeconds={cfg.durationSeconds}
            description={cfg.description}
          />
        </Frame>
      );
    }

    case "audio": {
      const cfg = parsed.data as BlockConfigMap["audio"];
      return (
        <Frame label="Audio">
          <MediaPlaceholder kind="Audio" title={cfg.title} durationSeconds={cfg.durationSeconds} />
        </Frame>
      );
    }

    case "pdf": {
      const cfg = parsed.data as BlockConfigMap["pdf"];
      return (
        <Frame label="PDF">
          <p className="text-base font-bold text-ink">{cfg.title}</p>
          <p className="mt-1 text-xs text-ink-soft">Wird in der App als PDF geöffnet.</p>
        </Frame>
      );
    }

    case "image": {
      const cfg = parsed.data as BlockConfigMap["image"];
      return (
        <Frame label="Bild">
          <div className="pitch-lines flex min-h-32 items-center justify-center rounded border border-dashed border-line bg-paper p-6 text-center">
            <p className="text-sm text-ink-soft">Bild: {cfg.alt}</p>
          </div>
          {cfg.caption ? <p className="mt-2 text-xs text-ink-soft">{cfg.caption}</p> : null}
        </Frame>
      );
    }

    case "checklist": {
      const cfg = parsed.data as BlockConfigMap["checklist"];
      return (
        <Frame label="Checkliste">
          <ul className="space-y-2">
            {cfg.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 text-sm text-ink">
                <span
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 rounded border-2 border-line bg-paper"
                />
                {item.label}
              </li>
            ))}
          </ul>
        </Frame>
      );
    }

    case "reflection": {
      const cfg = parsed.data as BlockConfigMap["reflection"];
      return (
        <Frame label="Reflexionsfrage">
          <p className="text-base font-bold text-ink">{cfg.question}</p>
          <div className="mt-3 min-h-20 rounded border border-line bg-paper p-3 text-sm text-ink-soft">
            Hier schreiben Teilnehmer ihre Antwort.
          </div>
          <p className="mt-2 text-xs text-ink-soft">
            Sichtbarkeit:{" "}
            {cfg.visibilityDefault === "trainer" ? "Für Trainer sichtbar" : "Privat"}
            {cfg.allowVisibilityChoice ? " (durch Teilnehmer änderbar)" : ""}
          </p>
        </Frame>
      );
    }

    case "single_choice": {
      const cfg = parsed.data as BlockConfigMap["single_choice"];
      return (
        <Frame label="Single Choice">
          <ChoicePreview question={cfg.question} options={cfg.options} multiple={false} />
        </Frame>
      );
    }

    case "multiple_choice": {
      const cfg = parsed.data as BlockConfigMap["multiple_choice"];
      return (
        <Frame label="Multiple Choice">
          <ChoicePreview question={cfg.question} options={cfg.options} multiple={true} />
        </Frame>
      );
    }

    case "quiz": {
      const cfg = parsed.data as BlockConfigMap["quiz"];
      return (
        <Frame label="Quiz">
          <QuizPreview quizId={cfg.quizId} />
        </Frame>
      );
    }

    case "scale": {
      const cfg = parsed.data as BlockConfigMap["scale"];
      const values: number[] = [];
      for (let v = cfg.min; v <= cfg.max; v += 1) values.push(v);
      return (
        <Frame label="Skala">
          <p className="text-base font-bold text-ink">{cfg.question}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {values.map((value) => (
              <span
                key={value}
                className="flex h-11 w-11 items-center justify-center rounded border border-line bg-paper text-sm font-bold tabular-nums text-ink"
              >
                {value}
              </span>
            ))}
          </div>
          {cfg.minLabel !== undefined || cfg.maxLabel !== undefined ? (
            <p className="mt-2 flex justify-between text-xs text-ink-soft">
              <span>{cfg.minLabel ?? ""}</span>
              <span>{cfg.maxLabel ?? ""}</span>
            </p>
          ) : null}
        </Frame>
      );
    }

    case "transfer_task": {
      const cfg = parsed.data as BlockConfigMap["transfer_task"];
      const evidence = [
        cfg.evidence.text ? "Text" : null,
        cfg.evidence.image ? "Bild" : null,
        cfg.evidence.file ? "Datei" : null,
      ].filter(Boolean);
      return (
        <Frame label="Transferaufgabe">
          <p className="text-base font-bold text-ink">{cfg.title}</p>
          <p className="mt-2 whitespace-pre-line text-sm text-ink">{cfg.description}</p>
          <p className="mt-3 text-xs text-ink-soft">
            {cfg.dueMode === "fixed" && cfg.dueAt !== undefined
              ? `Fällig am ${formatDateTime(cfg.dueAt)}. `
              : cfg.dueMode === "days_after_release" && cfg.dueDays !== undefined
                ? `Fällig ${cfg.dueDays === 1 ? "1 Tag" : `${cfg.dueDays} Tage`} nach Freischaltung. `
                : ""}
            Nachweis: {evidence.join(", ")}.
          </p>
        </Frame>
      );
    }

    case "download": {
      const cfg = parsed.data as BlockConfigMap["download"];
      const fileName = cfg.storagePath.split("/").pop() ?? cfg.storagePath;
      return (
        <Frame label="Download">
          <ul>
            <li className="flex items-center justify-between gap-4 text-sm">
              <span className="min-w-0">
                <span className="block truncate font-bold text-ink">{cfg.title}</span>
                {cfg.description ? (
                  <span className="block truncate text-xs text-ink-soft">{cfg.description}</span>
                ) : null}
                <span className="block truncate text-xs text-ink-soft">{fileName}</span>
              </span>
              <span className="shrink-0 rounded border border-line px-3 py-1.5 text-xs font-bold uppercase tracking-kicker text-ink-soft">
                Download
              </span>
            </li>
          </ul>
        </Frame>
      );
    }

    case "external_link": {
      const cfg = parsed.data as BlockConfigMap["external_link"];
      return (
        <Frame label="Externer Link">
          <a
            href={cfg.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-bold text-green-deep underline"
          >
            {cfg.label}
          </a>
          <p className="mt-1 text-xs text-ink-soft">{cfg.note}</p>
        </Frame>
      );
    }
  }
}
