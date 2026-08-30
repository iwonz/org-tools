const maximumDiagnosticCount = 50;
const maximumDiagnosticLength = 2_000;

const boundText = (value) => {
  const text = String(value).replaceAll(/\s+/gu, " ").trim();
  return text.length <= maximumDiagnosticLength
    ? text
    : `${text.slice(0, maximumDiagnosticLength - 1)}…`;
};

const isApplicationUrl = (value) => {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      (url.hostname === "127.0.0.1" || url.hostname === "localhost")
    );
  } catch {
    return false;
  }
};

const formatConsoleLocation = (location) => {
  if (!location.url) return "";
  const line = location.lineNumber ? `:${location.lineNumber}` : "";
  const column = location.columnNumber ? `:${location.columnNumber}` : "";
  return `${location.url}${line}${column}`;
};

export function createBrowserDiagnostics({ runtime, scenario }) {
  const diagnostics = [];
  const attachedPages = new WeakSet();

  const record = (category, message, url = "") => {
    if (diagnostics.length >= maximumDiagnosticCount) return;
    diagnostics.push({
      category,
      message: boundText(message),
      url: boundText(url),
    });
  };

  const attach = (page) => {
    if (attachedPages.has(page)) return;
    attachedPages.add(page);

    page.on("console", (message) => {
      if (message.type() !== "error" && message.type() !== "warning") return;
      record(
        `console.${message.type()}`,
        message.text(),
        formatConsoleLocation(message.location()),
      );
    });
    page.on("pageerror", (error) => {
      record("pageerror", error.stack || error.message, page.url());
    });
    page.on("requestfailed", (request) => {
      if (!isApplicationUrl(request.url())) return;
      record(
        "requestfailed",
        `${request.method()} ${request.failure()?.errorText ?? "unknown failure"}`,
        request.url(),
      );
    });
    page.on("response", (response) => {
      if (response.status() < 400 || !isApplicationUrl(response.url())) return;
      record(
        "response",
        `${response.request().method()} HTTP ${response.status()} ${response.statusText()}`,
        response.url(),
      );
    });
  };

  const assertClean = () => {
    if (diagnostics.length === 0) return;
    const formatted = diagnostics
      .map(
        (diagnostic, index) =>
          `${index + 1}. [${diagnostic.category}] ${diagnostic.message}${diagnostic.url ? `\n   ${diagnostic.url}` : ""}`,
      )
      .join("\n");
    throw new Error(`Unexpected browser diagnostics in ${runtime} / ${scenario}:\n${formatted}`);
  };

  return { assertClean, attach, diagnostics };
}
