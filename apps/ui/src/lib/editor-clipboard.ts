export const ORG_EDITOR_CLIPBOARD_WEB_FORMAT = "web application/x-org-tools-editor-clipboard";

const ORG_EDITOR_CLIPBOARD_TEXT_PREFIX = "org-tools-editor-clipboard:";

export type EditorClipboardPasteSource = "foreign" | "image" | "structure";

export const createEditorClipboardTextMarker = (token: string) =>
  `${ORG_EDITOR_CLIPBOARD_TEXT_PREFIX}${token}`;

export const parseEditorClipboardTextMarker = (value: string) => {
  if (!value.startsWith(ORG_EDITOR_CLIPBOARD_TEXT_PREFIX)) return null;
  const token = value.slice(ORG_EDITOR_CLIPBOARD_TEXT_PREFIX.length);
  return token.length > 0 ? token : null;
};

export const readEditorClipboardMarker = (dataTransfer: DataTransfer) => {
  const customToken = dataTransfer.getData(ORG_EDITOR_CLIPBOARD_WEB_FORMAT);
  if (customToken) return customToken;
  return parseEditorClipboardTextMarker(dataTransfer.getData("text/plain"));
};

export const setEditorClipboardMarker = (dataTransfer: DataTransfer, token: string) => {
  try {
    dataTransfer.setData(ORG_EDITOR_CLIPBOARD_WEB_FORMAT, token);
  } catch {
    // The plain-text marker below covers browsers without custom clipboard formats.
  }
  dataTransfer.setData("text/plain", createEditorClipboardTextMarker(token));
};

export const resolveEditorClipboardPasteSource = ({
  currentToken,
  hasImage,
  markerToken,
}: {
  currentToken: string | null;
  hasImage: boolean;
  markerToken: string | null;
}): EditorClipboardPasteSource => {
  if (currentToken && markerToken === currentToken) return "structure";
  return hasImage ? "image" : "foreign";
};

export const writeEditorClipboardMarker = async (token: string) => {
  if (typeof navigator === "undefined") return false;
  const textMarker = createEditorClipboardTextMarker(token);

  if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          [ORG_EDITOR_CLIPBOARD_WEB_FORMAT]: new Blob([token], {
            type: "application/x-org-tools-editor-clipboard",
          }),
          "text/plain": new Blob([textMarker], { type: "text/plain" }),
        }),
      ]);
      return true;
    } catch {
      // Fall back to the mandatory plain-text representation below.
    }
  }

  if (!navigator.clipboard?.writeText) return false;
  try {
    await navigator.clipboard.writeText(textMarker);
    return true;
  } catch {
    return false;
  }
};
