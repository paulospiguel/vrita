declare module "mammoth" {
  interface Input {
    path?: string;
    buffer?: Buffer;
    arrayBuffer?: ArrayBuffer;
  }

  interface ConversionResult {
    value: string;
    messages: Message[];
  }

  interface Message {
    type: string;
    message: string;
    paragraph?: unknown;
  }

  interface Options {
    styleMap?: string[];
    includeDefaultStyleMap?: boolean;
    convertImage?: (image: unknown) => Promise<{ src: string } | null>;
    ignoreEmptyParagraphs?: boolean;
    idPrefix?: string;
    transformDocument?: (document: unknown) => unknown;
  }

  export function convertToHtml(
    input: Input,
    options?: Options
  ): Promise<ConversionResult>;

  export function convertToMarkdown(
    input: Input,
    options?: Options
  ): Promise<ConversionResult>;

  export function extractRawText(input: Input): Promise<ConversionResult>;
}

