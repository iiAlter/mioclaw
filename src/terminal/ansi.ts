const ANSI_SGR_PATTERN = "\\x1b\\[[0-9;]*m";
// OSC-8 hyperlinks: ESC ] 8 ; ; url ST ... ESC ] 8 ; ; ST
const OSC8_PATTERN = "\\x1b\\]8;;.*?\\x1b\\\\|\\x1b\\]8;;\\x1b\\\\";

const ANSI_REGEX = new RegExp(ANSI_SGR_PATTERN, "g");
const OSC8_REGEX = new RegExp(OSC8_PATTERN, "g");
const graphemeSegmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

export function stripAnsi(input: string): string {
  return input.replace(OSC8_REGEX, "").replace(ANSI_REGEX, "");
}

export function splitGraphemes(input: string): string[] {
  if (!input) {
    return [];
  }
  if (!graphemeSegmenter) {
    return Array.from(input);
  }
  try {
    return Array.from(graphemeSegmenter.segment(input), (segment) => segment.segment);
  } catch {
    return Array.from(input);
  }
}

/**
 * Sanitize a value for safe interpolation into log messages.
 * Strips ANSI escape sequences, C0 control characters (U+0000–U+001F),
 * and DEL (U+007F) to prevent log forging / terminal escape injection (CWE-117).
 */
export function sanitizeForLog(v: string): string {
  let out = stripAnsi(v);
  for (let c = 0; c <= 0x1f; c++) {
    out = out.replaceAll(String.fromCharCode(c), "");
  }
  return out.replaceAll(String.fromCharCode(0x7f), "");
}

function isZeroWidthCodePoint(codePoint: number): boolean {
  return (
    (codePoint >= 0x0300 && codePoint <= 0x036f) ||
    (codePoint >= 0x1ab0 && codePoint <= 0x1aff) ||
    (codePoint >= 0x1dc0 && codePoint <= 0x1dff) ||
    (codePoint >= 0x20d0 && codePoint <= 0x20ff) ||
    (codePoint >= 0xfe20 && codePoint <= 0xfe2f) ||
    (codePoint >= 0xfe00 && codePoint <= 0xfe0f) ||
    codePoint === 0x200d
  );
}

function isFullWidthCodePoint(codePoint: number): boolean {
  if (codePoint < 0x1100) {
    return false;
  }
  return (
    codePoint <= 0x115f ||
    codePoint === 0x2329 ||
    codePoint === 0x232a ||
    (codePoint >= 0x2e80 && codePoint <= 0x3247 && codePoint !== 0x303f) ||
    (codePoint >= 0x3250 && codePoint <= 0x4dbf) ||
    (codePoint >= 0x4e00 && codePoint <= 0xa4c6) ||
    (codePoint >= 0xa960 && codePoint <= 0xa97c) ||
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
    (codePoint >= 0xfe30 && codePoint <= 0xfe6b) ||
    (codePoint >= 0xff01 && codePoint <= 0xff60) ||
    (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
    (codePoint >= 0x1aff0 && codePoint <= 0x1aff3) ||
    (codePoint >= 0x1aff5 && codePoint <= 0x1affb) ||
    (codePoint >= 0x1affd && codePoint <= 0x1affe) ||
    (codePoint >= 0x1b000 && codePoint <= 0x1b2ff) ||
    (codePoint >= 0x1f200 && codePoint <= 0x1f251) ||
    (codePoint >= 0x20000 && codePoint <= 0x3fffd)
  );
}

const emojiLikePattern = /[\p{Extended_Pictographic}\p{Regional_Indicator}\u20e3]/u;

function graphemeWidth(grapheme: string): number {
  if (!grapheme) {
    return 0;
  }
  if (emojiLikePattern.test(grapheme)) {
    return 2;
  }

  let sawPrintable = false;
  for (const char of grapheme) {
    const codePoint = char.codePointAt(0);
    if (codePoint == null) {
      continue;
    }
    if (isZeroWidthCodePoint(codePoint)) {
      continue;
    }
    if (isFullWidthCodePoint(codePoint)) {
      return 2;
    }
    sawPrintable = true;
  }
  return sawPrintable ? 1 : 0;
}

/**
 * 将 Markdown 格式文本转换为纯文本。
 *
 * 此函数移除常见的 Markdown 语法标记，保留文本内容。
 * 常用于将 AI 生成的 Markdown 回复转换为纯文本，以适配不支持 Markdown 的渠道（如微信）。
 *
 * 支持的转换：
 * - 删除线：~~删除文本~~ → 删除文本
 * - 粗体：**粗体文本** 或 __粗体文本__ → 粗体文本
 * - 斜体：*斜体文本* 或 _斜体文本_（排除已作为粗体标记的 __ 和 **）→ 斜体文本
 * - 行内代码：`代码` → 代码
 * - 标题：### 一级标题 等 → 一级标题（1-6 级标题符号均被移除）
 * - 引用：> 引用文本 → 引用文本
 * - 分隔线：---、***、___ 等 → 空行
 * - 无序列表标记：-、*、+ 开头的列表项 → 仅保留文本
 * - 有序列表标记：1.、2. 等开头的列表项 → 仅保留文本
 *
 * @param input - 原始 Markdown 文本
 * @returns 移除 Markdown 语法后的纯文本
 *
 * @example
 * stripMarkdown("**粗体** and *斜体*") // 返回 "粗体 and 斜体"
 * stripMarkdown("### 标题\n> 引用")  // 返回 "标题\n引用"
 */
export function stripMarkdown(input: string): string {
  let result = input;

  // 删除线：~~text~~ → text
  // 使用非贪婪匹配，捕获删除线内的内容并保留
  result = result.replace(/~~([^~]+)~~/g, "$1");

  // 粗体：**text** 或 __text__ → text
  // 匹配双星号或双下划线包裹的文本，保留括号中捕获的内容
  result = result.replace(/\*\*([^*]+)\*\*/g, "$1");
  result = result.replace(/__([^_]+)__/g, "$1");

  // 斜体：*text* 或 _text_ → text
  // 使用负向预查 (?!\*) 和 (?!\*$) 确保不匹配已作为粗体的 **text**
  // 同样处理下划线，确保不匹配 __text__
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1");
  result = result.replace(/(?<!_) _([^_]+)_(?!_)/g, "$1");

  // 行内代码：`code` → code
  // 匹配反引号包裹的内容，保留反引号内的代码文本
  result = result.replace(/`([^`]+)`/g, "$1");

  // 标题：### 标题 → 标题（1-6 级标题）
  // ^ 表示行首，g 表示全局匹配，m 表示多行模式
  // 移除 1-6 个 # 符号及其后的空格
  result = result.replace(/^#{1,6}\s+/gm, "");

  // 引用：> 引用文本 → 引用文本
  // 移除每行开头的 > 符号及其后的空格（多行模式）
  result = result.replace(/^>\s+/gm, "");

  // 分隔线：--- 或 *** 或 ___ 等 → 空行
  // 匹配一行中 3 个或更多的 -、*、_ 字符及其后的空白
  result = result.replace(/^[-*_]{3,}\s*$/gm, "");

  // 无序列表标记：- item、* item、+ item → item
  // 匹配行首的可选空白、一个列表标记符号、一个或多个空格
  result = result.replace(/^[\s]*[-*+]\s+/gm, "");

  // 有序列表标记：1. item、2. item → item
  // 匹配行首的可选空白、一个或多个数字、一个点、一个或多个空格
  result = result.replace(/^[\s]*\d+\.\s+/gm, "");

  return result;
}

export function visibleWidth(input: string): number {
  return splitGraphemes(stripAnsi(input)).reduce(
    (sum, grapheme) => sum + graphemeWidth(grapheme),
    0,
  );
}
