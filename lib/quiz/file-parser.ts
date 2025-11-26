// @ts-ignore - pdf-parse não tem tipos corretos
const pdfParse = require("pdf-parse");
import mammoth from "mammoth";

export type SupportedFileType = "pdf" | "docx" | "doc" | "txt";

export interface ParsedFile {
  content: string;
  fileName: string;
  fileType: SupportedFileType;
}

export function getFileType(fileName: string): SupportedFileType | null {
  const extension = fileName.toLowerCase().split(".").pop();
  
  switch (extension) {
    case "pdf":
      return "pdf";
    case "docx":
    case "doc":
      return "docx";
    case "txt":
      return "txt";
    default:
      return null;
  }
}

export async function parseFile(
  buffer: Buffer,
  fileName: string
): Promise<ParsedFile> {
  const fileType = getFileType(fileName);
  
  if (!fileType) {
    throw new Error(`Tipo de arquivo não suportado: ${fileName}`);
  }

  let content: string;

  switch (fileType) {
    case "pdf":
      content = await parsePDF(buffer);
      break;
    case "docx":
    case "doc":
      content = await parseWord(buffer);
      break;
    case "txt":
      content = buffer.toString("utf-8");
      break;
    default:
      throw new Error(`Tipo de arquivo não suportado: ${fileType}`);
  }

  return {
    content,
    fileName,
    fileType,
  };
}

async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error("Erro ao parsear PDF:", error);
    throw new Error("Não foi possível ler o arquivo PDF");
  }
}

async function parseWord(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error("Erro ao parsear Word:", error);
    throw new Error("Não foi possível ler o arquivo Word");
  }
}

export function validateFileSize(size: number, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
}

export function getSupportedExtensions(): string[] {
  return [".pdf", ".docx", ".doc", ".txt"];
}

