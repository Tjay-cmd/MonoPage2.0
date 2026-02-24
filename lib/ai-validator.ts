const FORBIDDEN_JS_PATTERNS = [
  /eval\s*\(/i,
  /Function\s*\(/,
  /import\s*\(/,
  /\bfetch\s*\(/,
  /XMLHttpRequest/i,
];

// Raw JSX outside strings - invalid in plain script (e.g. "return <div>" or "x = <nav>")
const JSX_LIKE_PATTERN =
  /(?:return|=)\s*<\s*(?:div|span|nav|ul|ol|li|a|p|h[1-6]|header|footer|section|article|button|input|form|label|main|aside)\s*[>\s]/i;

function stripStringsAndComments(js: string): string {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, "") // block comments
    .replace(/\/\/[^\n]*/g, "") // line comments
    .replace(/`(?:[^`\\]|\\.)*`/g, '""')
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''");
}

const FORBIDDEN_HTML_PATTERNS = [
  /<script[^>]*src\s*=\s*["']https?:\/\//i,
  /on\w+\s*=\s*["'][^"']*https?:\/\//i,
  /<iframe[^>]*src\s*=\s*["']https?:\/\//i,
];

export function validateJs(js: string): boolean {
  if (FORBIDDEN_JS_PATTERNS.some((p) => p.test(js))) return false;
  if (JSX_LIKE_PATTERN.test(stripStringsAndComments(js))) return false;
  return true;
}

export function validateHtml(html: string): boolean {
  return !FORBIDDEN_HTML_PATTERNS.some((p) => p.test(html));
}

export function validateOutput(
  html?: string,
  css?: string,
  js?: string
): { valid: boolean; reason?: string } {
  if (html !== undefined && !validateHtml(html)) {
    return { valid: false, reason: "HTML contains forbidden attributes" };
  }
  if (js !== undefined) {
    if (FORBIDDEN_JS_PATTERNS.some((p) => p.test(js))) {
      return { valid: false, reason: "JS contains forbidden patterns" };
    }
    if (JSX_LIKE_PATTERN.test(stripStringsAndComments(js))) {
      return {
        valid: false,
        reason:
          "JavaScript must not use JSX. Use innerHTML, document.createElement(), or template literals for HTML.",
      };
    }
  }
  return { valid: true };
}
