// Type declarations for modules without @types packages

// ─── nodemailer ───────────────────────────────────────────────────────────────
declare module "nodemailer" {
  export interface TransportOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: { user?: string; pass?: string };
    connectionTimeout?: number;
    greetingTimeout?: number;
    socketTimeout?: number;
    [key: string]: unknown;
  }

  export interface MailOptions {
    from?: string;
    to?: string | string[];
    subject?: string;
    html?: string;
    text?: string;
    attachments?: Array<{
      filename?: string;
      content?: string | Buffer;
      encoding?: string;
      contentType?: string;
    }>;
    [key: string]: unknown;
  }

  export interface SentMessageInfo {
    messageId: string;
    envelope: { from: string; to: string[] };
    accepted: string[];
    rejected: string[];
    response: string;
  }

  export interface Transporter {
    sendMail(mailOptions: MailOptions): Promise<SentMessageInfo>;
  }

  export function createTransport(options: TransportOptions): Transporter;

  const nodemailer: { createTransport: typeof createTransport };
  export default nodemailer;
}

// papaparse — CSV parsing library
declare module "papaparse" {
  export interface ParseConfig<T = unknown> {
    delimiter?: string;
    newline?: string;
    quoteChar?: string;
    escapeChar?: string;
    header?: boolean;
    transformHeader?: (header: string, index: number) => string;
    dynamicTyping?: boolean;
    preview?: number;
    encoding?: string;
    worker?: boolean;
    comments?: boolean | string;
    step?: (results: ParseResult<T>, parser: Parser) => void;
    complete?: (results: ParseResult<T>, file: File) => void;
    error?: (error: ParseError, file: File) => void;
    download?: boolean;
    downloadRequestHeaders?: Record<string, string>;
    skipEmptyLines?: boolean | "greedy";
    chunk?: (results: ParseResult<T>, parser: Parser) => void;
    fastMode?: boolean;
    beforeFirstChunk?: (chunk: string) => string | void;
    withCredentials?: boolean;
    transform?: (value: string, field: string | number) => unknown;
    delimitersToGuess?: string[];
  }

  export interface ParseMeta {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    fields?: string[];
    truncated: boolean;
    cursor: number;
  }

  export interface ParseError {
    type: string;
    code: string;
    message: string;
    row?: number;
  }

  export interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  }

  export interface Parser {
    abort: () => void;
    aborted: () => boolean;
    pause: () => void;
    resume: () => void;
  }

  export function parse<T = unknown>(
    input: string | File | NodeJS.ReadableStream,
    config?: ParseConfig<T>
  ): ParseResult<T>;

  export function unparse(data: unknown[], config?: object): string;

  const Papa: {
    parse: typeof parse;
    unparse: typeof unparse;
    SCRIPT_PATH: string;
    BAD_DELIMITERS: string[];
    RECORD_SEP: string;
    UNIT_SEP: string;
    BYTE_ORDER_MARK: string;
    WORKERS_SUPPORTED: boolean;
  };

  export default Papa;
}
