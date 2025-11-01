import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL é obrigatória" },
        { status: 400 }
      )
    }

    // Validar formato da URL
    let validUrl: URL
    try {
      validUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { 
          valid: false,
          error: "URL inválida. Use o formato: https://exemplo.com"
        },
        { status: 200 }
      )
    }

    // Verificar se é HTTP ou HTTPS
    if (!["http:", "https:"].includes(validUrl.protocol)) {
      return NextResponse.json(
        { 
          valid: false,
          error: "URL deve usar HTTP ou HTTPS"
        },
        { status: 200 }
      )
    }

    // Tentar fazer fetch para verificar se a URL existe e buscar metadados
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // Timeout de 5 segundos

      const response = await fetch(url, {
        method: "HEAD",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; vRitaBot/1.0)",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return NextResponse.json(
          { 
            valid: false,
            error: `URL não acessível (${response.status}: ${response.statusText})`
          },
          { status: 200 }
        )
      }

      // Se HEAD não funcionar, tentar GET apenas para os primeiros bytes
      const htmlController = new AbortController()
      const htmlTimeoutId = setTimeout(() => htmlController.abort(), 8000) // Timeout de 8 segundos

      const htmlResponse = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; vRitaBot/1.0)",
        },
        signal: htmlController.signal,
      })

      clearTimeout(htmlTimeoutId)

      if (!htmlResponse.ok) {
        return NextResponse.json(
          { 
            valid: false,
            error: `URL não acessível (${htmlResponse.status}: ${htmlResponse.statusText})`
          },
          { status: 200 }
        )
      }

      const html = await htmlResponse.text()
      
      // Extrair título
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      const title = titleMatch ? titleMatch[1].trim() : null

      // Extrair meta description
      const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
      const description = descriptionMatch ? descriptionMatch[1].trim() : null

      // Extrair favicon
      const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i)
      let favicon = faviconMatch ? faviconMatch[1].trim() : null
      if (favicon && !favicon.startsWith("http")) {
        const baseUrl = `${validUrl.protocol}//${validUrl.host}`
        favicon = new URL(favicon, baseUrl).href
      }

      // Extrair og:image se disponível
      const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      let ogImage = ogImageMatch ? ogImageMatch[1].trim() : null
      if (ogImage && !ogImage.startsWith("http")) {
        const baseUrl = `${validUrl.protocol}//${validUrl.host}`
        ogImage = new URL(ogImage, baseUrl).href
      }

      return NextResponse.json({
        valid: true,
        url: url,
        title: title || validUrl.hostname,
        description: description || null,
        domain: validUrl.hostname,
        favicon: favicon || null,
        image: ogImage || null,
      })
    } catch (fetchError: any) {
      // Erro de timeout ou conexão
      if (fetchError.name === "AbortError" || fetchError.name === "TimeoutError") {
        return NextResponse.json(
          { 
            valid: false,
            error: "Timeout ao verificar URL. Verifique se o site está acessível."
          },
          { status: 200 }
        )
      }

      if (fetchError.message?.includes("CORS") || fetchError.message?.includes("Failed to fetch")) {
        return NextResponse.json(
          { 
            valid: false,
            error: "Não foi possível acessar a URL. Pode ser um problema de CORS ou o site não está acessível."
          },
          { status: 200 }
        )
      }

      return NextResponse.json(
        { 
          valid: false,
          error: `Erro ao verificar URL: ${fetchError.message || "Erro desconhecido"}`
        },
        { status: 200 }
      )
    }
  } catch (error: any) {
    console.error("Erro ao validar URL:", error)
    return NextResponse.json(
      { 
        valid: false,
        error: "Erro ao validar URL"
      },
      { status: 200 }
    )
  }
}

