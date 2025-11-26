declare module "pdf-parse" {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: {
      PDFFormatVersion?: string;
      IsAcroFormPresent?: boolean;
      IsXFAPresent?: boolean;
      [key: string]: unknown;
    };
    metadata: unknown;
    text: string;
    version: string;
  }

  interface PDFOptions {
    pagerender?: (pageData: unknown) => Promise<string>;
    max?: number;
    version?: string;
  }

  function pdf(
    dataBuffer: Buffer | ArrayBuffer,
    options?: PDFOptions
  ): Promise<PDFData>;

  export = pdf;
}

