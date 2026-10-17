/**
 * Kleiner Whitelist-Sanitizer fuer die Teilnehmer-Vorschau (§25).
 *
 * Prinzip fail-closed: Nur explizit erlaubte Tags bleiben als Markup erhalten,
 * ALLE Attribute werden verworfen (einzige Ausnahme: href auf <a>, nur https).
 * Alles andere – unbekannte Tags, Kommentare, kaputtes Markup – wird escaped
 * und damit als sichtbarer Text gerendert statt ausgefuehrt.
 * Keine externe Dependency, rein string-basiert.
 */

/** Erlaubte Tags ohne Attribute. */
const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "hr",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "h4",
  "blockquote",
]);

const VOID_TAGS = new Set(["br", "hr"]);

/**
 * Escaped Text fuer HTML-Ausgabe. Bereits vorhandene benannte/numerische
 * Entities bleiben erhalten (kein doppeltes &amp;amp;).
 */
export function escapeHtmlText(text: string): string {
  return text
    .replace(/&(?![a-zA-Z][a-zA-Z0-9]{1,31};|#\d{1,7};|#x[0-9a-fA-F]{1,6};)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Nur https-Links werden uebernommen. */
function safeHref(raw: string): string | null {
  const url = raw.trim();
  return /^https:\/\//i.test(url) ? url : null;
}

/**
 * Sanitisiert einen HTML-String gegen die Whitelist.
 * Rueckgabe ist sicher fuer dangerouslySetInnerHTML in der Vorschau.
 */
export function sanitizeHtml(input: string): string {
  const tokens = input.match(/<[^>]*>|[^<]+|</g) ?? [];
  let out = "";

  for (const token of tokens) {
    if (!token.startsWith("<") || token === "<") {
      out += escapeHtmlText(token);
      continue;
    }

    const m = /^<\s*(\/?)\s*([a-zA-Z0-9]+)([^>]*)>$/.exec(token);
    if (!m) {
      // Kommentare, Doctype, kaputtes Markup -> als Text zeigen
      out += escapeHtmlText(token);
      continue;
    }

    const closing = m[1] === "/";
    const name = (m[2] ?? "").toLowerCase();
    const rest = m[3] ?? "";

    if (name === "a") {
      if (closing) {
        out += "</a>";
        continue;
      }
      const hrefMatch = /(?:^|\s)href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(rest);
      const rawHref = hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3] ?? "";
      const href = safeHref(rawHref);
      out += href
        ? `<a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">`
        : "<a>";
      continue;
    }

    if (!ALLOWED_TAGS.has(name)) {
      out += escapeHtmlText(token);
      continue;
    }

    if (VOID_TAGS.has(name)) {
      if (!closing) out += `<${name} />`;
      continue;
    }

    out += closing ? `</${name}>` : `<${name}>`;
  }

  return out;
}

/* ------------------------------- Markdown ------------------------------ */

/** Inline-Auszeichnung auf bereits escaptem Text: Links (https), fett, kursiv. */
function inlineMarkdown(escaped: string): string {
  return escaped
    .replace(
      /\[([^\]]+)\]\((https:\/\/[^\s)"']+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    )
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
}

/**
 * Sehr kleines Markdown-Subset fuer Text-Bloecke:
 * #/##/### Ueberschriften, "-"-Listen, "1."-Listen, Absaetze, fett/kursiv,
 * https-Links. Das Ergebnis ist bereits sanitisiert (Input wird escaped).
 */
export function renderMarkdownToHtml(markdown: string): string {
  const lines = escapeHtmlText(markdown.replace(/\r\n?/g, "\n")).split("\n");
  const parts: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let paragraph: string[] = [];

  const closeList = (): void => {
    if (listType !== null) {
      parts.push(`</${listType}>`);
      listType = null;
    }
  };
  const flushParagraph = (): void => {
    if (paragraph.length > 0) {
      parts.push(`<p>${inlineMarkdown(paragraph.join("<br />"))}</p>`);
      paragraph = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "") {
      flushParagraph();
      closeList();
      continue;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      closeList();
      const level = (heading[1] ?? "#").length + 1; // # -> h2 ... ### -> h4
      parts.push(`<h${level}>${inlineMarkdown(heading[2] ?? "")}</h${level}>`);
      continue;
    }

    const unordered = /^[-*]\s+(.*)$/.exec(trimmed);
    if (unordered) {
      flushParagraph();
      if (listType !== "ul") {
        closeList();
        parts.push("<ul>");
        listType = "ul";
      }
      parts.push(`<li>${inlineMarkdown(unordered[1] ?? "")}</li>`);
      continue;
    }

    const ordered = /^\d+\.\s+(.*)$/.exec(trimmed);
    if (ordered) {
      flushParagraph();
      if (listType !== "ol") {
        closeList();
        parts.push("<ol>");
        listType = "ol";
      }
      parts.push(`<li>${inlineMarkdown(ordered[1] ?? "")}</li>`);
      continue;
    }

    closeList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  closeList();
  return parts.join("\n");
}
