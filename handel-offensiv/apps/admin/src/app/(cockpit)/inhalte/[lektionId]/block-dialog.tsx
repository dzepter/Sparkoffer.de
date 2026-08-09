"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import type { BlockType } from "@handel-offensiv/types";
import { blockTypes } from "@handel-offensiv/validation";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BLOCK_TYPE_LABELS, initialDialogState, isoToBerlinLocal } from "@/lib/content-meta";

import { addBlockAction, updateBlockAction } from "../actions";

export interface BlockDialogValues {
  id: string;
  block_type: BlockType;
  config: unknown;
  required: boolean;
}

export interface QuizOption {
  id: string;
  title: string;
}

/* --------------------------- Config-Auslesen --------------------------- */

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function str(cfg: Record<string, unknown>, key: string): string {
  const v = cfg[key];
  return typeof v === "string" ? v : "";
}

function num(cfg: Record<string, unknown>, key: string): string {
  const v = cfg[key];
  return typeof v === "number" ? String(v) : "";
}

function bool(cfg: Record<string, unknown>, key: string): boolean {
  return cfg[key] === true;
}

function itemLines(cfg: Record<string, unknown>): string {
  const items = cfg.items;
  if (!Array.isArray(items)) return "";
  return items
    .map((item) => (typeof asRecord(item).label === "string" ? (asRecord(item).label as string) : ""))
    .filter((label) => label !== "")
    .join("\n");
}

function optionLines(cfg: Record<string, unknown>): string {
  const options = cfg.options;
  if (!Array.isArray(options)) return "";
  return options
    .map((option) => {
      const o = asRecord(option);
      const label = typeof o.label === "string" ? o.label : "";
      if (label === "") return "";
      return o.correct === true ? `* ${label}` : label;
    })
    .filter((line) => line !== "")
    .join("\n");
}

function evidence(cfg: Record<string, unknown>, key: "text" | "image" | "file"): boolean {
  return asRecord(cfg.evidence)[key] === true;
}

/* ------------------------------- Dialog -------------------------------- */

/**
 * Block hinzufuegen (Typ-Auswahl der 14 Blocktypen, dann typspezifisches
 * Formular) bzw. bestehenden Block bearbeiten. Die verbindliche Validierung
 * laeuft serverseitig via parseBlockConfig (@handel-offensiv/validation).
 */
export function BlockDialog({
  lessonId,
  quizzes,
  block,
  triggerLabel,
  triggerVariant = "secondary",
  triggerSize = "sm",
}: {
  lessonId: string;
  quizzes: QuizOption[];
  block?: BlockDialogValues;
  triggerLabel: string;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
}) {
  const [open, setOpen] = useState(false);
  const [blockType, setBlockType] = useState<BlockType | null>(block?.block_type ?? null);

  const action = block ? updateBlockAction : addBlockAction;
  const [state, formAction, pending] = useActionState(action, initialDialogState);
  const lastTs = useRef(0);

  useEffect(() => {
    if (state.ok && state.ts !== lastTs.current) {
      lastTs.current = state.ts;
      setOpen(false);
      if (!block) setBlockType(null);
    }
  }, [state, block]);

  const cfg = asRecord(block?.config);
  const prefix = block ? `block-${block.id}` : "block-neu";

  const title = block
    ? `Block bearbeiten: ${BLOCK_TYPE_LABELS[block.block_type]}`
    : blockType === null
      ? "Block hinzufügen"
      : `Block hinzufügen: ${BLOCK_TYPE_LABELS[blockType]}`;

  return (
    <>
      <Button variant={triggerVariant} size={triggerSize} onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title={title} className="max-w-2xl">
        {blockType === null ? (
          <div>
            <p className="mb-4 text-sm text-ink-soft">Welche Art von Inhalt möchten Sie hinzufügen?</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {blockTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setBlockType(type)}
                  className="min-h-touch rounded border border-line bg-white px-3 py-2 text-left text-sm font-bold text-ink hover:border-green-deep hover:bg-paper"
                >
                  {BLOCK_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <form action={formAction} noValidate className="space-y-4">
            <input type="hidden" name="lektionId" value={lessonId} />
            {block ? <input type="hidden" name="blockId" value={block.id} /> : null}
            <input type="hidden" name="blockTyp" value={blockType} />

            <TypeFields
              blockType={blockType}
              cfg={cfg}
              prefix={prefix}
              quizzes={quizzes}
            />

            <Checkbox
              id={`${prefix}-pflicht`}
              name="pflicht"
              defaultChecked={block?.required ?? false}
              label="Pflichtbaustein"
              description="Teilnehmer müssen diesen Block bearbeiten, damit die Lektion als abgeschlossen gilt."
            />

            {state.error ? (
              <p
                role="alert"
                className="rounded border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm text-danger"
              >
                {state.error}
              </p>
            ) : null}

            <div className="flex justify-between gap-3">
              {!block ? (
                <Button variant="ghost" onClick={() => setBlockType(null)}>
                  Anderer Typ
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Wird gespeichert …" : "Speichern"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Dialog>
    </>
  );
}

/* ------------------------ Typspezifische Felder ------------------------- */

function TypeFields({
  blockType,
  cfg,
  prefix,
  quizzes,
}: {
  blockType: BlockType;
  cfg: Record<string, unknown>;
  prefix: string;
  quizzes: QuizOption[];
}) {
  switch (blockType) {
    case "text":
      return <TextFields cfg={cfg} prefix={prefix} />;
    case "video":
      return <VideoFields cfg={cfg} prefix={prefix} />;
    case "audio":
      return (
        <>
          <StoragePathField cfg={cfg} prefix={prefix} />
          <TitleField cfg={cfg} prefix={prefix} />
          <DurationField cfg={cfg} prefix={prefix} />
        </>
      );
    case "pdf":
      return (
        <>
          <StoragePathField cfg={cfg} prefix={prefix} />
          <TitleField cfg={cfg} prefix={prefix} />
        </>
      );
    case "image":
      return (
        <>
          <StoragePathField cfg={cfg} prefix={prefix} />
          <FormField
            htmlFor={`${prefix}-alt`}
            label="Alternativtext"
            required
            hint="Beschreibt das Bild für Screenreader (Barrierefreiheit)."
          >
            <Input id={`${prefix}-alt`} name="alt" defaultValue={str(cfg, "alt")} required />
          </FormField>
          <FormField htmlFor={`${prefix}-bildunterschrift`} label="Bildunterschrift">
            <Input
              id={`${prefix}-bildunterschrift`}
              name="bildunterschrift"
              defaultValue={str(cfg, "caption")}
            />
          </FormField>
        </>
      );
    case "checklist":
      return (
        <FormField
          htmlFor={`${prefix}-punkte`}
          label="Checklisten-Punkte"
          required
          hint="Ein Punkt pro Zeile."
        >
          <Textarea
            id={`${prefix}-punkte`}
            name="punkte"
            defaultValue={itemLines(cfg)}
            rows={6}
            required
          />
        </FormField>
      );
    case "reflection":
      return (
        <>
          <QuestionField cfg={cfg} prefix={prefix} />
          <FormField htmlFor={`${prefix}-sichtbarkeit`} label="Standard-Sichtbarkeit" required>
            <Select
              id={`${prefix}-sichtbarkeit`}
              name="sichtbarkeit"
              defaultValue={str(cfg, "visibilityDefault") === "trainer" ? "trainer" : "private"}
            >
              <option value="private">Privat (nur Teilnehmer)</option>
              <option value="trainer">Für Trainer sichtbar</option>
            </Select>
          </FormField>
          <Checkbox
            id={`${prefix}-sichtbarkeitWaehlbar`}
            name="sichtbarkeitWaehlbar"
            defaultChecked={bool(cfg, "allowVisibilityChoice")}
            label="Teilnehmer dürfen die Sichtbarkeit selbst ändern"
          />
        </>
      );
    case "single_choice":
    case "multiple_choice":
      return (
        <>
          <QuestionField cfg={cfg} prefix={prefix} />
          <FormField
            htmlFor={`${prefix}-optionen`}
            label="Antwortoptionen"
            required
            hint={
              blockType === "single_choice"
                ? 'Eine Option pro Zeile; die richtige Antwort mit "* " am Zeilenanfang markieren (höchstens eine).'
                : 'Eine Option pro Zeile; richtige Antworten mit "* " am Zeilenanfang markieren.'
            }
          >
            <Textarea
              id={`${prefix}-optionen`}
              name="optionen"
              defaultValue={optionLines(cfg)}
              rows={5}
              required
            />
          </FormField>
          <FormField htmlFor={`${prefix}-erklaerung`} label="Erklärung (nach Beantwortung)">
            <Textarea
              id={`${prefix}-erklaerung`}
              name="erklaerung"
              defaultValue={str(cfg, "explanation")}
              rows={2}
            />
          </FormField>
        </>
      );
    case "quiz":
      return quizzes.length === 0 ? (
        <p className="rounded border border-warning/40 bg-warning/10 px-3 py-2.5 text-sm text-ink">
          Es ist noch kein Quiz angelegt. Bitte legen Sie zunächst in der{" "}
          <Link href="/inhalte/quizze" className="font-bold underline">
            Quiz-Verwaltung
          </Link>{" "}
          ein Quiz an.
        </p>
      ) : (
        <FormField htmlFor={`${prefix}-quizId`} label="Quiz" required>
          <Select id={`${prefix}-quizId`} name="quizId" defaultValue={str(cfg, "quizId")}>
            {quizzes.map((quiz) => (
              <option key={quiz.id} value={quiz.id}>
                {quiz.title}
              </option>
            ))}
          </Select>
        </FormField>
      );
    case "scale":
      return (
        <>
          <QuestionField cfg={cfg} prefix={prefix} />
          <div className="grid grid-cols-2 gap-4">
            <FormField htmlFor={`${prefix}-min`} label="Minimum" required>
              <Input
                id={`${prefix}-min`}
                name="min"
                type="number"
                min={0}
                max={9}
                defaultValue={num(cfg, "min") || "1"}
              />
            </FormField>
            <FormField htmlFor={`${prefix}-max`} label="Maximum" required>
              <Input
                id={`${prefix}-max`}
                name="max"
                type="number"
                min={1}
                max={10}
                defaultValue={num(cfg, "max") || "10"}
              />
            </FormField>
            <FormField htmlFor={`${prefix}-minLabel`} label="Beschriftung Minimum">
              <Input id={`${prefix}-minLabel`} name="minLabel" defaultValue={str(cfg, "minLabel")} />
            </FormField>
            <FormField htmlFor={`${prefix}-maxLabel`} label="Beschriftung Maximum">
              <Input id={`${prefix}-maxLabel`} name="maxLabel" defaultValue={str(cfg, "maxLabel")} />
            </FormField>
          </div>
        </>
      );
    case "transfer_task":
      return <TransferTaskFields cfg={cfg} prefix={prefix} />;
    case "download":
      return (
        <>
          <StoragePathField cfg={cfg} prefix={prefix} />
          <TitleField cfg={cfg} prefix={prefix} />
          <FormField htmlFor={`${prefix}-beschreibung`} label="Beschreibung">
            <Textarea
              id={`${prefix}-beschreibung`}
              name="beschreibung"
              defaultValue={str(cfg, "description")}
              rows={2}
            />
          </FormField>
        </>
      );
    case "external_link":
      return (
        <>
          <FormField htmlFor={`${prefix}-url`} label="URL (https)" required>
            <Input
              id={`${prefix}-url`}
              name="url"
              type="url"
              placeholder="https://…"
              defaultValue={str(cfg, "url")}
              required
            />
          </FormField>
          <FormField htmlFor={`${prefix}-label`} label="Linktext" required>
            <Input id={`${prefix}-label`} name="label" defaultValue={str(cfg, "label")} required />
          </FormField>
          <FormField
            htmlFor={`${prefix}-hinweis`}
            label="Hinweistext"
            required
            hint="Kennzeichnungspflicht: Hinweis, dass ein externer Anbieter geöffnet wird."
          >
            <Input id={`${prefix}-hinweis`} name="hinweis" defaultValue={str(cfg, "note")} required />
          </FormField>
        </>
      );
  }
}

/* ---------------------------- Feld-Bausteine ---------------------------- */

function TitleField({ cfg, prefix }: { cfg: Record<string, unknown>; prefix: string }) {
  return (
    <FormField htmlFor={`${prefix}-titel`} label="Titel" required>
      <Input id={`${prefix}-titel`} name="titel" defaultValue={str(cfg, "title")} required />
    </FormField>
  );
}

function QuestionField({ cfg, prefix }: { cfg: Record<string, unknown>; prefix: string }) {
  return (
    <FormField htmlFor={`${prefix}-frage`} label="Frage" required>
      <Textarea id={`${prefix}-frage`} name="frage" defaultValue={str(cfg, "question")} rows={2} required />
    </FormField>
  );
}

function StoragePathField({ cfg, prefix }: { cfg: Record<string, unknown>; prefix: string }) {
  return (
    <FormField
      htmlFor={`${prefix}-storagePfad`}
      label="Storage-Pfad"
      required
      hint="Pfad der Datei im Storage, z. B. global/modul-01/arbeitsblatt.pdf."
    >
      <Input
        id={`${prefix}-storagePfad`}
        name="storagePfad"
        defaultValue={str(cfg, "storagePath")}
        required
      />
    </FormField>
  );
}

function DurationField({ cfg, prefix }: { cfg: Record<string, unknown>; prefix: string }) {
  return (
    <FormField htmlFor={`${prefix}-dauerSekunden`} label="Dauer in Sekunden">
      <Input
        id={`${prefix}-dauerSekunden`}
        name="dauerSekunden"
        type="number"
        min={1}
        defaultValue={num(cfg, "durationSeconds")}
      />
    </FormField>
  );
}

function TextFields({ cfg, prefix }: { cfg: Record<string, unknown>; prefix: string }) {
  const initialMode = str(cfg, "markdown") !== "" ? "markdown" : "html";
  const [mode, setMode] = useState<"html" | "markdown">(initialMode);
  const initialContent = initialMode === "markdown" ? str(cfg, "markdown") : str(cfg, "html");

  return (
    <>
      <FormField htmlFor={`${prefix}-modus`} label="Format" required>
        <Select
          id={`${prefix}-modus`}
          name="modus"
          value={mode}
          onChange={(event) => setMode(event.target.value === "markdown" ? "markdown" : "html")}
        >
          <option value="html">HTML</option>
          <option value="markdown">Markdown</option>
        </Select>
      </FormField>
      <FormField
        htmlFor={`${prefix}-inhalt`}
        label="Inhalt"
        required
        hint={
          mode === "markdown"
            ? "Markdown: # Überschrift, **fett**, *kursiv*, - Liste."
            : "Erlaubt sind einfache Tags wie <p>, <strong>, <ul>, <li>, <a href=\"https://…\">."
        }
      >
        <Textarea
          id={`${prefix}-inhalt`}
          name="inhalt"
          defaultValue={initialContent}
          rows={8}
          required
        />
      </FormField>
    </>
  );
}

function VideoFields({ cfg, prefix }: { cfg: Record<string, unknown>; prefix: string }) {
  const [provider, setProvider] = useState<"external" | "storage">(
    str(cfg, "provider") === "storage" ? "storage" : "external",
  );

  return (
    <>
      <FormField htmlFor={`${prefix}-provider`} label="Quelle" required>
        <Select
          id={`${prefix}-provider`}
          name="provider"
          value={provider}
          onChange={(event) =>
            setProvider(event.target.value === "storage" ? "storage" : "external")
          }
        >
          <option value="external">Externe URL (https)</option>
          <option value="storage">Datei im Storage</option>
        </Select>
      </FormField>
      {provider === "external" ? (
        <FormField htmlFor={`${prefix}-url`} label="Video-URL (https)" required>
          <Input
            id={`${prefix}-url`}
            name="url"
            type="url"
            placeholder="https://…"
            defaultValue={str(cfg, "url")}
            required
          />
        </FormField>
      ) : (
        <StoragePathField cfg={cfg} prefix={prefix} />
      )}
      <TitleField cfg={cfg} prefix={prefix} />
      <FormField htmlFor={`${prefix}-beschreibung`} label="Beschreibung">
        <Textarea
          id={`${prefix}-beschreibung`}
          name="beschreibung"
          defaultValue={str(cfg, "description")}
          rows={2}
        />
      </FormField>
      <DurationField cfg={cfg} prefix={prefix} />
    </>
  );
}

function TransferTaskFields({ cfg, prefix }: { cfg: Record<string, unknown>; prefix: string }) {
  const initialDueMode =
    str(cfg, "dueMode") === "fixed"
      ? "fixed"
      : str(cfg, "dueMode") === "days_after_release"
        ? "days_after_release"
        : "none";
  const [dueMode, setDueMode] = useState<"none" | "fixed" | "days_after_release">(initialDueMode);
  const dueAtLocal = str(cfg, "dueAt") !== "" ? isoToBerlinLocal(str(cfg, "dueAt")) : "";

  return (
    <>
      <TitleField cfg={cfg} prefix={prefix} />
      <FormField htmlFor={`${prefix}-beschreibung`} label="Aufgabenbeschreibung" required>
        <Textarea
          id={`${prefix}-beschreibung`}
          name="beschreibung"
          defaultValue={str(cfg, "description")}
          rows={4}
          required
        />
      </FormField>

      <FormField htmlFor={`${prefix}-faelligkeit`} label="Fälligkeit">
        <Select
          id={`${prefix}-faelligkeit`}
          name="faelligkeit"
          value={dueMode}
          onChange={(event) => {
            const v = event.target.value;
            setDueMode(v === "fixed" ? "fixed" : v === "days_after_release" ? "days_after_release" : "none");
          }}
        >
          <option value="none">Ohne Fälligkeit</option>
          <option value="fixed">Festes Datum</option>
          <option value="days_after_release">Tage nach Freischaltung</option>
        </Select>
      </FormField>

      {dueMode === "fixed" ? (
        <FormField htmlFor={`${prefix}-faelligAm`} label="Fällig am (Europe/Berlin)" required>
          <Input
            id={`${prefix}-faelligAm`}
            name="faelligAm"
            type="datetime-local"
            defaultValue={dueAtLocal}
            required
          />
        </FormField>
      ) : null}

      {dueMode === "days_after_release" ? (
        <FormField htmlFor={`${prefix}-faelligTage`} label="Tage nach Freischaltung" required>
          <Input
            id={`${prefix}-faelligTage`}
            name="faelligTage"
            type="number"
            min={1}
            defaultValue={num(cfg, "dueDays") || "7"}
            required
          />
        </FormField>
      ) : null}

      <fieldset>
        <legend className="mb-1 block text-sm font-bold text-ink">
          Erlaubte Nachweisarten
          <span aria-hidden="true" className="ml-0.5 text-green-deep">*</span>
        </legend>
        <Checkbox
          id={`${prefix}-nachweisText`}
          name="nachweisText"
          defaultChecked={evidence(cfg, "text") || Object.keys(cfg).length === 0}
          label="Text"
        />
        <Checkbox
          id={`${prefix}-nachweisBild`}
          name="nachweisBild"
          defaultChecked={evidence(cfg, "image")}
          label="Bild"
        />
        <Checkbox
          id={`${prefix}-nachweisDatei`}
          name="nachweisDatei"
          defaultChecked={evidence(cfg, "file")}
          label="Datei"
        />
      </fieldset>
    </>
  );
}
