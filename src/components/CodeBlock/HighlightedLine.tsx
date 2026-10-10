import type { Token } from './tokenize';
import syntax from './syntax.module.css';

/** Renders one tokenized line as coloured spans. Shared by CodeBlock and CodeEditor. */
export function HighlightedLine({ tokens }: { tokens: Token[] }) {
  return (
    <>
      {tokens.map((t, i) =>
        t.type === 'plain' ? (
          t.text
        ) : (
          <span key={i} className={syntax[t.type]}>
            {t.text}
          </span>
        ),
      )}
    </>
  );
}
