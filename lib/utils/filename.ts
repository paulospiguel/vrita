/**
 * Formata um nome de arquivo para download
 * - Converte para minúsculo
 * - Substitui espaços e caracteres especiais por underscore
 * - Adiciona timestamp no formato YYYYMMDD_HHMMSS
 */
export function formatDownloadFilename(baseName: string, extension: string = "md"): string {
  // Normalizar o nome base: minúsculo, remover acentos básicos, substituir espaços e caracteres especiais por underscore
  const normalized = baseName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]+/g, "_") // Substitui caracteres não alfanuméricos por underscore
    .replace(/^_+|_+$/g, "") // Remove underscores no início e fim
    .replace(/_+/g, "_"); // Remove underscores duplicados

  // Gerar timestamp no formato YYYYMMDD_HHMMSS
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  
  const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;

  // Retornar nome formatado: nome_base_timestamp.extensao
  return `${normalized}_${timestamp}.${extension}`;
}

