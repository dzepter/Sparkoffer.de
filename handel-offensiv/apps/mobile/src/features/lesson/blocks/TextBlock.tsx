/**
 * text-Block: eigener Markdown-light-Renderer (§13) – bewusst klein:
 * Absätze, **fett**, ungeordnete ("- ", "* ") und nummerierte Listen,
 * "## "-Zwischenüberschriften. Kein externes Paket, kein WebView.
 * html-Konfigurationen werden defensiv in Text umgewandelt (Tags entfernt).
 */
import { Fragment, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { colors, spacing } from "@handel-offensiv/config";
import type { BlockConfigMap } from "@handel-offensiv/validation";
import { Text, archivoFamily } from "../../../ui";

/* ------------------------- Markdown-light-Parser ------------------------ */

type MdBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] };

function parseMarkdownLight(source: string): MdBlock[] {
  const blocks: MdBlock[] = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = (): void => {
    if (paragraph.length > 0) {
      blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
  };
  const flushList = (): void => {
    if (list !== null) {
      blocks.push({ kind: "list", ordered: list.ordered, items: list.items });
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (line.length === 0) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = /^#{1,3}\s+(.*)$/.exec(line);
    if (heading !== null) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "heading", text: heading[1] ?? "" });
      continue;
    }
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    if (bullet !== null) {
      flushParagraph();
      if (list === null || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(bullet[1] ?? "");
      continue;
    }
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    if (numbered !== null) {
      flushParagraph();
      if (list === null || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(numbered[1] ?? "");
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return blocks;
}

/** Inline: **fett** -> Archivo Bold */
function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <Text key={i} variant="body" style={styles.bold}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/** Sehr einfacher HTML-Fallback: Zeilenumbrüche erhalten, Tags entfernen. */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<\s*(br|\/p|\/li|\/h[1-6])\s*\/?>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/** Wiederverwendbarer Renderer (auch für Transferaufgaben-Beschreibungen). */
export function MarkdownLight({ source }: { source: string }) {
  const mdBlocks = parseMarkdownLight(source);
  return (
    <View style={styles.stack}>
      {mdBlocks.map((b, i) => {
        if (b.kind === "heading") {
          return (
            <Text key={i} variant="h3" accessibilityRole="header">
              {b.text}
            </Text>
          );
        }
        if (b.kind === "paragraph") {
          return (
            <Text key={i} variant="body">
              {renderInline(b.text)}
            </Text>
          );
        }
        return (
          <View key={i} style={styles.list} accessibilityRole="list">
            {b.items.map((item, j) => (
              <View key={j} style={styles.listItem}>
                <Text variant="body" color={colors.greenDeep} style={styles.marker}>
                  {b.ordered ? `${j + 1}.` : "–"}
                </Text>
                <Text variant="body" style={styles.itemText}>
                  {renderInline(item)}
                </Text>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

/* ------------------------------- Block --------------------------------- */

export interface TextBlockProps {
  config: BlockConfigMap["text"];
}

export function TextBlock({ config }: TextBlockProps) {
  const source =
    config.markdown !== undefined ? config.markdown : htmlToPlainText(config.html ?? "");
  return <MarkdownLight source={source} />;
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  bold: { fontFamily: archivoFamily("700") },
  list: { gap: spacing.sm },
  listItem: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  marker: { fontFamily: archivoFamily("700"), minWidth: 20 },
  itemText: { flex: 1 },
});
