import type {ReactNode} from 'react';

const parse = (text: string): ReactNode[] => {
  //match either [text](link) or **bold** or *italic* or 'code' or @mention (in that priority order)
  const pattern =
    /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|(@\w+)/g;
  const result: ReactNode[] = [];
  let lastIndex = 0;
  let match = pattern.exec(text);
  while (match) {
    //push text before the match as normal text
    if (match.index > lastIndex)
      result.push(text.slice(lastIndex, match.index));
    //link. match[1] is the text, match[2] is the url
    if (match[1] && match[2])
      result.push(
        <a key={match.index} href={match[2]} target="_blank" rel="noreferrer">
          {match[1]}
        </a>,
      );
    // bold. match[3] is the bold text
    else if (match[3])
      result.push(<strong key={match.index}>{match[3]}</strong>);
    // italic. match[4] is the italic text
    else if (match[4]) result.push(<em key={match.index}>{match[4]}</em>);
    // inline code. match[5] is the code block
    else if (match[5]) {
      result.push(
        <code key={match.index} className="inlineCode">
          {match[5]}
        </code>,
      );
    }
    // mention. match[6] is the mention
    else if (match[6]) {
      result.push(
        <span key={match.index} className="mention">
          {match[6]}
        </span>,
      );
    }
    lastIndex = pattern.lastIndex;
    match = pattern.exec(text);
  }
  //push remaining text as normal text
  if (lastIndex < text.length) result.push(text.slice(lastIndex));
  return result;
};
export const renderCommentRichText = (raw: string): ReactNode => {
  //we have a line by line parsing
  const lines = raw.split('\n');
  const elements: ReactNode[] = [];
  let bullets: ReactNode[] = [];
  const bulletRegex = /^\s*-\s+/;
  lines.forEach((line, i) => {
    //first check if it's a bullet point
    if (bulletRegex.test(line)) {
      //replace the bullet syntax chars with empty string, and parse the rest of the line for other syntax
      bullets.push(<li key={i}>{parse(line.replace(bulletRegex, ''))}</li>);
    } else {
      if (bullets.length) {
        //create element for the collected bullets and reset the bullets array
        elements.push(<ul key={`ul-${i}`}>{bullets}</ul>);
        bullets = [];
      }
      //parse the line for other syntax and add to elements
      if (line.trim()) elements.push(<p key={i}>{parse(line)}</p>);
    }
  });
  if (bullets.length) elements.push(<ul key="ul-last">{bullets}</ul>);
  return elements;
};
