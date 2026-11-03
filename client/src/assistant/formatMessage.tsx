import React, { type ReactNode } from "react";

/**
 * Turns an assistant reply into safe React elements. Models like to write **bold** and
 * "- list items" even when asked not to, so those two are shown properly instead of as
 * raw symbols. Nothing else is interpreted, and no HTML is ever injected: the text is
 * always rendered as text.
 */
const bold = (text: string, keyPrefix: string): ReactNode[] =>
  text
    .split(/(\*\*[^*\n]+\*\*)/g)
    .map((part, i) =>
      /^\*\*[^*\n]+\*\*$/.test(part) ? (
        <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
      ) : (
        <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>
      )
    );

const BULLET = /^\s*(?:[-*•]|\d+[.)])\s+(.*)$/;

export const formatMessage = (content: string): ReactNode => {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let items: string[] = [];

  const flushList = () => {
    if (items.length === 0) return;
    const key = `l${blocks.length}`;
    blocks.push(
      <ul key={key}>
        {items.map((item, i) => (
          <li key={i}>{bold(item, `${key}-${i}`)}</li>
        ))}
      </ul>
    );
    items = [];
  };

  lines.forEach((line, i) => {
    const bullet = BULLET.exec(line);
    if (bullet) {
      items.push(bullet[1]);
      return;
    }
    flushList();
    if (line.trim()) blocks.push(<p key={`p${i}`}>{bold(line, `p${i}`)}</p>);
  });
  flushList();

  return blocks;
};
