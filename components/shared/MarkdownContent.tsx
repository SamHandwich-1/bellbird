// Markdown renderer for chat bubbles. Item 16: tables and other GFM features
// must render as real HTML rather than raw pipe characters.
//
// Visual language matches the bond-paper aesthetic — Fraunces body, mono
// inline code, hairline-bordered tables, no oversized headings (chat shouldn't
// be using h1/h2 anyway).

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { tokens } from '@/lib/tokens';

export function MarkdownContent({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p style={{ margin: '0 0 10px', lineHeight: 1.6 }}>{children}</p>
        ),
        ul: ({ children }) => (
          <ul style={{ margin: '0 0 10px', paddingLeft: 20 }}>{children}</ul>
        ),
        ol: ({ children }) => (
          <ol style={{ margin: '0 0 10px', paddingLeft: 20 }}>{children}</ol>
        ),
        li: ({ children }) => (
          <li style={{ marginBottom: 4 }}>{children}</li>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.startsWith('language-');
          if (isBlock) {
            return (
              <pre
                style={{
                  background: tokens.panel,
                  border: `1px solid ${tokens.line}`,
                  padding: '12px 14px',
                  margin: '8px 0',
                  fontSize: 12.5,
                  overflowX: 'auto',
                  fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                  color: tokens.body,
                }}
              >
                <code>{children}</code>
              </pre>
            );
          }
          return (
            <code
              style={{
                fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                fontSize: '0.9em',
                color: tokens.text,
                background: tokens.panel,
                padding: '1px 5px',
                borderRadius: 2,
              }}
            >
              {children}
            </code>
          );
        },
        table: ({ children }) => (
          <div style={{ overflowX: 'auto', margin: '12px 0' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 12.5,
                fontFamily: 'Manrope, system-ui, sans-serif',
              }}
            >
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead style={{ borderBottom: `1px solid ${tokens.line}` }}>
            {children}
          </thead>
        ),
        th: ({ children }) => (
          <th
            style={{
              textAlign: 'left',
              padding: '8px 10px',
              color: tokens.muted,
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              fontSize: 9.5,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td
            style={{
              padding: '8px 10px',
              borderBottom: `1px solid ${tokens.line}`,
              color: tokens.body,
              verticalAlign: 'top',
            }}
          >
            {children}
          </td>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: tokens.chime, textDecoration: 'underline', textDecorationThickness: 1 }}
          >
            {children}
          </a>
        ),
        strong: ({ children }) => (
          <strong style={{ color: tokens.text, fontWeight: 600 }}>{children}</strong>
        ),
        em: ({ children }) => (
          <em style={{ fontStyle: 'italic', color: tokens.body }}>{children}</em>
        ),
        blockquote: ({ children }) => (
          <blockquote
            style={{
              borderLeft: `2px solid ${tokens.line}`,
              paddingLeft: 14,
              margin: '10px 0',
              color: tokens.muted,
              fontStyle: 'italic',
            }}
          >
            {children}
          </blockquote>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
