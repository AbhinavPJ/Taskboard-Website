//this file contains helpers for the task page

//this helps us get and set the state of our markdown editor in a way that
// it lets us manipulate the text and cursor position
export interface EditorStateBinding {
  value: string;
  setValue: (nextValue: string) => void;
  ref: {current: HTMLTextAreaElement | null};
}

// format relative time
export const relTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

//below are some helpers to apply markdown tokens to the selected text in the editor,when a
//button is pressed
export const applyInlineToken = (
  editorState: EditorStateBinding,
  prefix: string,
  suffix = prefix,
  placeholder = 'text',
) => {
  //prefix:before cursor,suffix:after cursor
  const {value, setValue, ref} = editorState;
  const editor = ref.current;
  if (!editor) return;
  const selStart = editor.selectionStart;
  const selEnd = editor.selectionEnd;
  const selected = value.slice(selStart, selEnd);
  const content = selected || placeholder;
  //insert prefix and suffix
  const nextValue =
    value.slice(0, selStart) +
    `${prefix}${content}${suffix}` +
    value.slice(selEnd);
  setValue(nextValue);
  const nextSelStart = selStart + prefix.length;
  const nextSelEnd = nextSelStart + content.length;
  requestAnimationFrame(() => {
    const node = ref.current;
    if (!node) return;
    node.focus();
    node.setSelectionRange(nextSelStart, nextSelEnd);
  });
};

//does not work the same as applyInlineToken,because we want to select the url part of the link token,not the whole thing
export const applyLinkToken = (editorState: EditorStateBinding) => {
  const {value, setValue, ref} = editorState;
  const editor = ref.current;
  if (!editor) return;
  const selStart = editor.selectionStart;
  const selEnd = editor.selectionEnd;
  const selected = value.slice(selStart, selEnd) || 'link text';
  const snippet = `[${selected}](https://example.com)`;
  const nextValue = value.slice(0, selStart) + snippet + value.slice(selEnd);
  setValue(nextValue);

  const urlStart = selStart + snippet.indexOf('https://example.com');
  const urlEnd = urlStart + 'https://example.com'.length;
  requestAnimationFrame(() => {
    const node = ref.current;
    if (!node) return;
    node.focus();
    node.setSelectionRange(urlStart, urlEnd);
  });
};
//inserts bullet points at the start of each selected line,or the current line if no text is selected
export const applyListToken = (editorState: EditorStateBinding) => {
  const {value, setValue, ref} = editorState;
  const editor = ref.current;
  if (!editor) return;
  const selStart = editor.selectionStart;
  const selEnd = editor.selectionEnd;
  const blockStart = value.lastIndexOf('\n', Math.max(selStart - 1, 0)) + 1;
  const blockEndPos = value.indexOf('\n', selEnd);
  const blockEnd = blockEndPos === -1 ? value.length : blockEndPos;
  const selectedLines = value.slice(blockStart, blockEnd).split('\n');
  const prefixed = selectedLines
    .map((line) => {
      return `- ${line.replace(/^\s*[-*+]\s+/, '')}`;
    })
    .join('\n');
  const nextValue =
    value.slice(0, blockStart) + prefixed + value.slice(blockEnd);
  setValue(nextValue);
  requestAnimationFrame(() => {
    const node = ref.current;
    if (!node) return;
    node.focus();
    node.setSelectionRange(blockStart, blockStart + prefixed.length);
  });
};
