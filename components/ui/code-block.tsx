"use client";

import React, { useState } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  showCopyButton?: boolean;
  maxHeight?: string;
}

/**
 * Detects the likely language of a code snippet based on syntax patterns.
 */
function detectLanguage(code: string): string {
  const trimmed = code.trim();

  // Python patterns
  if (/\bdef\s+\w+\s*\(/.test(trimmed) || /\bclass\s+\w+.*:/.test(trimmed) || /^\s*import\s+\w+/m.test(trimmed) && !/\bfrom\s+['"]/.test(trimmed)) {
    if (/\bself\b/.test(trimmed) || /\bprint\s*\(/.test(trimmed) || /:\s*$/.test(trimmed.split('\n')[0])) {
      return "python";
    }
  }

  // C++ patterns
  if (/\b(#include|std::|vector<|cout|cin|nullptr|->)\b/.test(trimmed) || /\bint\s+main\s*\(/.test(trimmed)) {
    return "cpp";
  }

  // Java patterns (check before JS due to overlap)
  if (/\bpublic\s+(static\s+)?class\b/.test(trimmed) || /\bSystem\.out\.print/.test(trimmed) || /\bpublic\s+static\s+void\s+main/.test(trimmed)) {
    return "java";
  }

  // TypeScript patterns
  if (/:\s*(string|number|boolean|void|any)\b/.test(trimmed) || /\binterface\s+\w+/.test(trimmed) || /\b(as|type)\s+\w+/.test(trimmed)) {
    return "typescript";
  }

  // JavaScript / default
  if (/\b(const|let|var|function|=>|require|import)\b/.test(trimmed)) {
    return "javascript";
  }

  return "javascript";
}

export function CodeBlock({
  code,
  language,
  showCopyButton = true,
  maxHeight = "400px",
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const detectedLang = language || detectLanguage(code);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="relative group/codeblock rounded-xl overflow-hidden shadow-lg"
      style={{ background: "#011627" }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-2">
          {/* Fake traffic lights */}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <span
            className="text-[9px] font-bold uppercase tracking-widest ml-2"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            {detectedLang}
          </span>
        </div>
        {showCopyButton && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: copied ? "#28c840" : "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        )}
      </div>

      {/* Highlighted code area */}
      <Highlight
        theme={themes.nightOwl}
        code={code.trim()}
        language={detectedLang}
      >
        {({ tokens, getLineProps, getTokenProps, style }) => (
          <div
            className="overflow-auto"
            style={{ maxHeight }}
          >
            <pre
              style={{
                ...style,
                margin: 0,
                padding: "16px 0",
                background: "transparent",
                fontSize: "13px",
                lineHeight: "1.7",
                fontFamily: "'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace",
              }}
            >
              <table className="border-collapse w-full" style={{ tableLayout: "auto" }}>
                <tbody>
                  {tokens.map((line, i) => {
                    const lineProps = getLineProps({ line });
                    return (
                      <tr
                        key={i}
                        {...lineProps}
                        style={{}}
                        className="transition-colors"
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        {/* Line numbers */}
                        <td
                          style={{
                            width: "1%",
                            whiteSpace: "nowrap",
                            userSelect: "none",
                            paddingRight: "20px",
                            paddingLeft: "20px",
                            textAlign: "right",
                            color: "rgba(255,255,255,0.15)",
                            fontSize: "11px",
                            fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
                            verticalAlign: "top",
                          }}
                        >
                          {i + 1}
                        </td>
                        {/* Code content */}
                        <td style={{ whiteSpace: "pre", paddingRight: "20px" }}>
                          {line.map((token, key) => {
                            const tokenProps = getTokenProps({ token });
                            return <span key={key} {...tokenProps} />;
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </pre>
          </div>
        )}
      </Highlight>

      {/* Subtle gradient fade at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none"
        style={{ background: "linear-gradient(to top, #011627, transparent)" }}
      />
    </div>
  );
}

/**
 * A dark-themed textarea for code input that looks like an IDE editor.
 */
interface CodeTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function CodeTextarea({
  value,
  onChange,
  placeholder = "Paste your solution code here...",
  minHeight = "180px",
}: CodeTextareaProps) {
  return (
    <div className="relative rounded-xl overflow-hidden shadow-lg" style={{ background: "#011627" }}>
      {/* Editor header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span
          className="text-[9px] font-bold uppercase tracking-widest ml-2"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          solution
        </span>
      </div>

      {/* Textarea styled to look like code editor */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        style={{
          width: "100%",
          minHeight,
          background: "transparent",
          color: "#d6deeb",
          caretColor: "#80a4c2",
          fontFamily: "'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace",
          fontSize: "13px",
          lineHeight: "1.7",
          padding: "16px 20px",
          border: "none",
          outline: "none",
          resize: "vertical",
        }}
        className="placeholder:text-white/20"
      />
    </div>
  );
}
