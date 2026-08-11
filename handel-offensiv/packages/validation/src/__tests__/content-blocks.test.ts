import { describe, expect, it } from "vitest";
import {
  BlockConfigError,
  type BlockType,
  blockConfigSchema,
  blockTypes,
  parseBlockConfig,
  safeParseBlockConfig,
} from "../content-blocks";

const QUIZ_ID = "9f7a2f43-30f1-4a5e-9c9a-1af5f7a2b111";

/** Je Blocktyp: 1 gültiges + 1 ungültiges Beispiel. */
const cases: Record<BlockType, { valid: unknown; invalid: unknown }> = {
  text: {
    valid: { markdown: "# Willkommen" },
    invalid: {}, // weder html noch markdown
  },
  video: {
    valid: {
      provider: "external",
      url: "https://player.example.com/v/123",
      title: "Einführung",
      durationSeconds: 300,
    },
    invalid: { provider: "storage", title: "Ohne Pfad" }, // storagePath fehlt
  },
  audio: {
    valid: { storagePath: "audio/modul1/intro.mp3", title: "Intro" },
    invalid: { storagePath: "audio/x.mp3" }, // title fehlt
  },
  pdf: {
    valid: { storagePath: "pdf/handout.pdf", title: "Handout Modul 1" },
    invalid: { title: "Ohne Datei" }, // storagePath fehlt
  },
  image: {
    valid: { storagePath: "img/teamraum.jpg", alt: "Foto des Teamraums" },
    invalid: { storagePath: "img/x.jpg" }, // alt fehlt (Barrierefreiheit)
  },
  checklist: {
    valid: { items: [{ id: "a", label: "Verkaufsgespräch vorbereiten" }] },
    invalid: { items: [] }, // min. 1 Item
  },
  reflection: {
    valid: {
      question: "Was nehme ich aus Tag 1 mit?",
      visibilityDefault: "private",
      allowVisibilityChoice: true,
    },
    invalid: { question: "Ohne Sichtbarkeit?" }, // visibilityDefault/allowVisibilityChoice fehlen
  },
  single_choice: {
    valid: {
      question: "Was ist der erste Schritt?",
      options: [
        { id: "a", label: "Begrüßung", correct: true },
        { id: "b", label: "Abschluss" },
      ],
    },
    invalid: {
      question: "Zwei korrekte?",
      options: [
        { id: "a", label: "A", correct: true },
        { id: "b", label: "B", correct: true },
      ],
    }, // single_choice: max. 1 korrekte Option
  },
  multiple_choice: {
    valid: {
      question: "Welche Aussagen treffen zu?",
      options: [
        { id: "a", label: "A", correct: true },
        { id: "b", label: "B", correct: true },
        { id: "c", label: "C" },
      ],
      explanation: "A und B sind korrekt.",
    },
    invalid: { question: "Zu wenige Optionen", options: [{ id: "a", label: "A" }] },
  },
  quiz: {
    valid: { quizId: QUIZ_ID },
    invalid: { quizId: "keine-uuid" },
  },
  scale: {
    valid: { question: "Wie sicher fühlst du dich?", min: 1, max: 10, minLabel: "unsicher", maxLabel: "sehr sicher" },
    invalid: { question: "min >= max", min: 5, max: 5 },
  },
  transfer_task: {
    valid: {
      title: "Preisgespräch führen",
      description: "Führe diese Woche ein Preisgespräch und dokumentiere es.",
      dueMode: "days_after_release",
      dueDays: 7,
      evidence: { text: true, image: false, file: true },
    },
    invalid: {
      title: "Ohne Fälligkeit",
      description: "dueMode fixed, aber dueAt fehlt",
      dueMode: "fixed",
      evidence: { text: true, image: false, file: false },
    },
  },
  download: {
    valid: { storagePath: "downloads/checkliste.xlsx", title: "Checkliste" },
    invalid: { storagePath: "" }, // leerer Pfad + title fehlt
  },
  external_link: {
    valid: {
      url: "https://www.example.com/artikel",
      label: "Weiterführender Artikel",
      note: "Externer Link – es gelten die Datenschutzbestimmungen des Anbieters.",
    },
    invalid: { url: "https://www.example.com", label: "Ohne Hinweis" }, // note (Kennzeichnungspflicht) fehlt
  },
};

describe("blockConfigSchemas", () => {
  it("deckt alle Blocktypen ab", () => {
    expect(Object.keys(cases).sort()).toEqual([...blockTypes].sort());
  });

  for (const blockType of blockTypes) {
    const { valid, invalid } = cases[blockType];

    it(`${blockType}: akzeptiert gültige config`, () => {
      expect(() => parseBlockConfig(blockType, valid)).not.toThrow();
      expect(blockConfigSchema(blockType).safeParse(valid).success).toBe(true);
    });

    it(`${blockType}: lehnt ungültige config ab`, () => {
      expect(blockConfigSchema(blockType).safeParse(invalid).success).toBe(false);
      expect(() => parseBlockConfig(blockType, invalid)).toThrow(BlockConfigError);
    });
  }
});

describe("external_link", () => {
  it("lehnt http:// ab (nur https erlaubt)", () => {
    const result = safeParseBlockConfig("external_link", {
      url: "http://www.example.com",
      label: "Unsicherer Link",
      note: "Externer Link",
    });
    expect(result.success).toBe(false);
  });
});

describe("checklist", () => {
  it("braucht mindestens 1 Item", () => {
    expect(() => parseBlockConfig("checklist", { items: [] })).toThrow(BlockConfigError);
    expect(() =>
      parseBlockConfig("checklist", { items: [{ id: "1", label: "Erledigt" }] }),
    ).not.toThrow();
  });
});

describe("parseBlockConfig", () => {
  it("liefert eine saubere Fehlermeldung mit Blocktyp und Pfad", () => {
    try {
      parseBlockConfig("quiz", { quizId: "nope" });
      expect.unreachable("sollte werfen");
    } catch (err) {
      expect(err).toBeInstanceOf(BlockConfigError);
      expect((err as Error).message).toContain('block_type "quiz"');
      expect((err as Error).message).toContain("quizId");
    }
  });
});
