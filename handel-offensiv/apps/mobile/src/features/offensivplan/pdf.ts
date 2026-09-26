/**
 * PDF-Export des 90-Tage-Offensivplans (Briefing §14) via expo-print +
 * expo-sharing. Das HTML-Template folgt dem Aigner-Stil: Light Mode,
 * Markengrün, große Modulnummern, Radius 2, Fußzeile
 * "HANDEL IST MANNSCHAFTSSPORT." – Archivo fällt im Druck-WebView bewusst
 * auf die Systemschrift zurück (Fonts werden dort nicht gebündelt).
 */
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import type { ActionPlanItemRow } from "@handel-offensiv/types";
import { PLAN_FIELDS, statusLabel } from "./shared";

/** Konsolidierte Modulzeile für das PDF. */
export interface PdfModulePlan {
  numberLabel: string;
  title: string;
  item: ActionPlanItemRow | null;
}

export interface PdfInput {
  /** Anzeigename (kann null sein – dann ohne Namenszeile) */
  participantName: string | null;
  modulePlans: PdfModulePlan[];
  /** Eigene Vorhaben des 90-Tage-Plans (module_id null) */
  ninetyItems: ActionPlanItemRow[];
}

export type PdfExportResult = "shared" | "unavailable" | "error";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br/>");
}

function fieldRows(item: ActionPlanItemRow): string {
  return PLAN_FIELDS.map((field) => {
    const raw = item[field.key];
    const value = typeof raw === "string" && raw.trim().length > 0 ? escapeHtml(raw) : "&ndash;";
    return `
      <tr>
        <td class="field-label">${escapeHtml(field.label)}</td>
        <td class="field-value">${value}</td>
      </tr>`;
  }).join("");
}

function itemBlock(item: ActionPlanItemRow): string {
  return `
    <div class="item">
      <div class="item-status">${escapeHtml(statusLabel(item.status))}</div>
      <table class="fields">${fieldRows(item)}</table>
    </div>`;
}

function buildHtml(input: PdfInput): string {
  const generatedAt = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());

  const moduleSections = input.modulePlans
    .map(
      (plan) => `
      <section class="module">
        <div class="module-head">
          <span class="module-number">${escapeHtml(plan.numberLabel)}</span>
          <div>
            <div class="kicker">Modul ${escapeHtml(plan.numberLabel)}</div>
            <h2>${escapeHtml(plan.title)}</h2>
          </div>
        </div>
        ${
          plan.item
            ? itemBlock(plan.item)
            : '<p class="empty">Für dieses Modul wurde noch kein Plan erfasst.</p>'
        }
      </section>`,
    )
    .join("");

  const ninetySection =
    input.ninetyItems.length > 0
      ? `
      <section class="module">
        <div class="module-head">
          <span class="module-number">90</span>
          <div>
            <div class="kicker">Nach dem Programm</div>
            <h2>Meine Vorhaben für 90 Tage</h2>
          </div>
        </div>
        ${input.ninetyItems.map(itemBlock).join("")}
      </section>`
      : "";

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<style>
  /* Archivo ist im Druck-WebView nicht gebündelt – Systemschrift als Fallback */
  * { box-sizing: border-box; }
  body {
    font-family: Archivo, -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: #131711;
    background: #ffffff;
    margin: 32px 40px;
    font-size: 12px;
    line-height: 1.5;
  }
  .head { border-bottom: 3px solid #A8C62B; padding-bottom: 16px; margin-bottom: 24px; }
  .kicker {
    text-transform: uppercase; letter-spacing: 2px; font-size: 9px;
    font-weight: 700; color: #5F7A10;
  }
  h1 { font-size: 24px; font-weight: 800; margin: 4px 0 2px; letter-spacing: -0.5px; }
  h2 { font-size: 14px; font-weight: 800; margin: 2px 0 0; }
  .meta { color: #454B42; font-size: 10px; margin-top: 4px; }
  .module { margin-bottom: 22px; page-break-inside: avoid; }
  .module-head { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
  .module-number {
    font-size: 36px; font-weight: 800; letter-spacing: -1px; color: #A8C62B;
    line-height: 1;
  }
  .item {
    border: 1px solid #E3E3D8; border-radius: 2px; padding: 12px 14px;
    margin-bottom: 8px; background: #F7F6F1;
  }
  .item-status {
    display: inline-block; text-transform: uppercase; letter-spacing: 1.5px;
    font-size: 8px; font-weight: 700; color: #12160E; background: #A8C62B;
    border-radius: 2px; padding: 2px 6px; margin-bottom: 8px;
  }
  table.fields { width: 100%; border-collapse: collapse; }
  .fields td { vertical-align: top; padding: 4px 0; border-top: 1px solid #E3E3D8; }
  .fields tr:first-child td { border-top: none; }
  .field-label {
    width: 34%; text-transform: uppercase; letter-spacing: 1px;
    font-size: 8.5px; font-weight: 700; color: #454B42; padding-right: 12px;
  }
  .empty { color: #454B42; font-style: italic; }
  .footer {
    margin-top: 32px; border-top: 1px solid #E3E3D8; padding-top: 12px;
    text-transform: uppercase; letter-spacing: 2.5px; font-size: 10px;
    font-weight: 800; color: #12160E;
  }
  .footer .slash { color: #A8C62B; }
</style>
</head>
<body>
  <header class="head">
    <div class="kicker">Handel Offensiv &middot; Aigner Offensiv</div>
    <h1>Mein 90-Tage-Offensivplan</h1>
    <div class="meta">
      ${input.participantName ? `${escapeHtml(input.participantName)} &middot; ` : ""}Stand: ${generatedAt}
    </div>
  </header>
  ${moduleSections}
  ${ninetySection}
  <footer class="footer"><span class="slash">/</span> HANDEL IST MANNSCHAFTSSPORT.</footer>
</body>
</html>`;
}

/** PDF erzeugen und über das System-Share-Sheet anbieten. */
export async function exportOffensivplanPdf(input: PdfInput): Promise<PdfExportResult> {
  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) return "unavailable";

    const { uri } = await Print.printToFileAsync({ html: buildHtml(input) });
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
      dialogTitle: "90-Tage-Offensivplan teilen",
    });
    return "shared";
  } catch {
    return "error";
  }
}
