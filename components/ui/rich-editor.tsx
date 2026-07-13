"use client";

import { cn } from "@/lib/utils";
import { marked } from "marked";

/* ─── Display helpers ─────────────────────────────────────────── */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Detect if a block of lines is a Markdown table.
 * A valid MD table needs: header row with pipes, separator row with dashes.
 */
function isMarkdownTable(lines: string[]): boolean {
  if (lines.length < 2) return false;
  const hasPipeRow = lines[0].includes("|");
  const hasSeparator = /^\|?[\s-:|]+\|[\s-:|]+\|?$/.test(lines[1].trim());
  return hasPipeRow && hasSeparator;
}

/**
 * Detect if a block of lines is tab-separated (from copying web tables).
 */
function isTsvBlock(lines: string[]): boolean {
  if (lines.length < 2) return false;
  const tabLines = lines.filter((l) => l.includes("\t"));
  return tabLines.length >= 2 && tabLines.length >= lines.length * 0.5;
}

/**
 * Convert tab-separated lines into an HTML table.
 */
function tsvToHtmlTable(lines: string[]): string {
  const nonEmpty = lines.filter((l) => l.trim() !== "");
  if (nonEmpty.length === 0) return "";

  let html = '<table><thead><tr>';
  const headers = nonEmpty[0].split("\t");
  for (const h of headers) {
    html += `<th>${escapeHtml(h.trim())}</th>`;
  }
  html += '</tr></thead><tbody>';

  for (let i = 1; i < nonEmpty.length; i++) {
    html += '<tr>';
    const cells = nonEmpty[i].split("\t");
    for (const c of cells) {
      html += `<td>${escapeHtml(c.trim())}</td>`;
    }
    html += '</tr>';
  }

  html += '</tbody></table>';
  return html;
}

/**
 * Parse raw text into display-ready HTML.
 *
 * Handles:
 *  - Already-HTML content (pass-through)
 *  - Markdown (including tables, bold, italic, headings, lists)
 *  - Tab-separated data (copied from web tables) → HTML table
 *  - Code blocks (``` fenced)
 *  - Plain text paragraphs
 */
export function parseTextToHtml(text: string): string {
  if (!text) return "";
  const trimmed = text.trim();

  // Already HTML? Return as-is.
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return trimmed;
  }

  const lines = trimmed.split("\n");

  // Pure TSV table
  if (isTsvBlock(lines)) {
    return tsvToHtmlTable(lines);
  }

  // Use marked for Markdown (handles tables, bold, code fences, etc.)
  try {
    return marked.parse(text, { breaks: true }) as string;
  } catch {
    return `<p>${escapeHtml(text)}</p>`;
  }
}

export function convertToHtmlIfNeeded(content: string): string {
  return parseTextToHtml(content);
}

/* ─── Simple Textarea Component ─────────────────────────────── */

interface RichEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
}

export function RichEditor({
  content,
  onChange,
  placeholder,
  className,
  wrapperClassName,
}: RichEditorProps) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Describe your progress..."}
        rows={6}
        className={cn(
          "w-full bg-secondary/30 border border-border/50 rounded-2xl px-5 py-4",
          "text-sm font-medium leading-relaxed",
          "placeholder:text-muted-foreground/30",
          "focus:border-primary focus:ring-4 ring-primary/10 outline-none",
          "transition-all resize-y min-h-[150px]",
          "font-mono",
          className,
        )}
      />
    </div>
  );
}
