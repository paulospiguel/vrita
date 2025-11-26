import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { parseFile, getFileType, validateFileSize, getSupportedExtensions } from "@/lib/quiz/file-parser";

// POST: Upload e processar arquivo
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar role do usuário
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = profile?.role || "user";
    
    if (!["admin", "manager"].includes(userRole)) {
      return NextResponse.json(
        { error: "Apenas administradores e gerentes podem criar quizzes" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    const parsedContents: string[] = [];
    const supportedExtensions = getSupportedExtensions();
    const uploadedFilePaths: string[] = [];

    for (const file of files) {
      // Validar tipo do arquivo
      const fileType = getFileType(file.name);
      if (!fileType) {
        return NextResponse.json(
          { 
            error: `Tipo de arquivo não suportado: ${file.name}. Use: ${supportedExtensions.join(", ")}` 
          },
          { status: 400 }
        );
      }

      // Validar tamanho do arquivo (máx 10MB)
      if (!validateFileSize(file.size, 10)) {
        return NextResponse.json(
          { error: `Arquivo muito grande: ${file.name}. Máximo: 10MB` },
          { status: 400 }
        );
      }

      // Upload para Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Tentar fazer upload para storage (opcional - não bloqueia se falhar)
      try {
        const { error: uploadError } = await supabase.storage
          .from("quiz-documents")
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.warn(`Aviso: Não foi possível fazer upload de ${file.name} para storage:`, uploadError.message);
          // Continuar mesmo se o upload falhar - o arquivo será processado normalmente
        } else {
          uploadedFilePaths.push(filePath);
        }
      } catch (storageError: any) {
        console.warn(`Aviso: Erro ao acessar storage para ${file.name}:`, storageError.message);
        // Continuar mesmo se o storage não estiver disponível
      }

      // Parsear o conteúdo do arquivo
      try {
        const parsed = await parseFile(buffer, file.name);
        parsedContents.push(`=== ${parsed.fileName} ===\n\n${parsed.content}`);
      } catch (parseError: any) {
        console.error("Erro ao parsear arquivo:", parseError);
        // Continuar mesmo se um arquivo falhar no parse
        parsedContents.push(`=== ${file.name} ===\n\n[Erro ao processar arquivo: ${parseError.message}]`);
      }
    }

    // Combinar todo o conteúdo
    const combinedContent = parsedContents.join("\n\n---\n\n");

    return NextResponse.json({
      content: combinedContent,
      filesProcessed: files.length,
      totalCharacters: combinedContent.length,
      uploadedPaths: uploadedFilePaths,
    });
  } catch (error: any) {
    console.error("Erro ao processar arquivo:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao processar arquivo" },
      { status: 500 }
    );
  }
}
