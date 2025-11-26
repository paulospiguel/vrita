"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import googleIcon from "@/assets/icons/google.svg";
import { Mail, Loader2, ArrowRight, Key } from "lucide-react";
import { toast } from "sonner";

/**
 * Valida e sanitiza uma URL de redirecionamento para prevenir open redirect attacks
 * Apenas permite URLs relativas (que começam com '/')
 * Rejeita URLs absolutas, protocol-relative URLs, e caracteres perigosos
 * @param url - URL a ser validada
 * @returns URL segura (relativa) ou '/' como fallback
 */
function validateRedirectUrl(url: string | null): string {
  if (!url) return "/";

  // Remover espaços
  const trimmedUrl = url.trim();

  // Rejeitar strings vazias
  if (trimmedUrl.length === 0) return "/";

  // Apenas permitir URLs relativas que começam com '/'
  // Rejeitar explicitamente:
  // - URLs absolutas (http://, https://, etc.) - case-insensitive
  // - Protocol-relative URLs (//)
  // - JavaScript: URLs - case-insensitive
  // - Data URLs - case-insensitive
  const lowerTrimmedUrl = trimmedUrl.toLowerCase();
  if (
    trimmedUrl.startsWith("/") &&
    !trimmedUrl.startsWith("//") &&
    !lowerTrimmedUrl.startsWith("/http") &&
    !lowerTrimmedUrl.startsWith("/https") &&
    !lowerTrimmedUrl.startsWith("/javascript:") &&
    !lowerTrimmedUrl.startsWith("/data:")
  ) {
    // Validar que não contém caracteres perigosos após decodificação
    // Tentar decodificar uma vez para detectar bypasses como %2F%2F
    let decodedUrl: string;
    try {
      decodedUrl = decodeURIComponent(trimmedUrl);
    } catch {
      // Se falhar ao decodificar, rejeitar
      return "/";
    }

    // Verificar novamente após decodificação (case-insensitive)
    const lowerDecodedUrl = decodedUrl.toLowerCase();
    if (
      decodedUrl.startsWith("//") ||
      lowerDecodedUrl.startsWith("http://") ||
      lowerDecodedUrl.startsWith("https://") ||
      lowerDecodedUrl.startsWith("javascript:") ||
      lowerDecodedUrl.startsWith("data:")
    ) {
      return "/";
    }

    // Validar formato: apenas caracteres alfanuméricos, /, ?, #, &, =, -, _, ., ~, %, +, :
    // Permitir espaços codificados (%20) mas não espaços literais
    const safePattern = /^\/[a-zA-Z0-9\/?#&=\-_.~%+:]*$/;
    if (safePattern.test(trimmedUrl)) {
      return trimmedUrl;
    }
  }

  // Se não for uma URL relativa segura, retornar '/'
  return "/";
}

export function AuthForm() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Validar e sanitizar redirect URL para prevenir open redirect attacks
  const redirectUrl = validateRedirectUrl(searchParams.get("redirect"));

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const callbackUrl = `${
        window.location.origin
      }/auth/callback?redirect=${encodeURIComponent(redirectUrl)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!email.trim()) {
      toast.error("Digite seu email");
      return;
    }

    try {
      setLoading(true);
      // Enviar código OTP (sem emailRedirectTo para usar código ao invés de link)
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      setCodeSent(true);
      toast.success("Código enviado! Verifique seu email.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar código");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim() || code.length !== 6) {
      toast.error("Digite o código de 6 dígitos");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "email",
      });

      if (error) throw error;

      if (data.session) {
        toast.success("Login realizado com sucesso!");
        // Redirecionar após login bem-sucedido (redirectUrl já foi validado)
        window.location.href = redirectUrl;
      }
    } catch (error: any) {
      toast.error(error.message || "Código inválido. Tente novamente.");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  if (codeSent) {
    return (
      <div className="w-full space-y-4">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
            <Key className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold">Código enviado!</h3>
          <p className="text-sm text-muted-foreground">
            Enviamos um código de 6 dígitos para <strong>{email}</strong>.<br />
            Copie e cole o código abaixo para fazer login.
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="code">Código de acesso</Label>
            <Input
              id="code"
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(value);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
              className="text-center text-2xl font-mono tracking-widest"
              maxLength={6}
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-center">
              Digite o código de 6 dígitos recebido por email
            </p>
          </div>

          <Button
            onClick={handleVerifyCode}
            disabled={loading || code.length !== 6}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Verificar Código
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setCodeSent(false);
              setCode("");
            }}
            className="w-full"
          >
            Usar outro email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Google Login */}
      <Button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-6 sm:py-7 text-base sm:text-lg shadow-sm hover:shadow-md transition-all duration-300 group"
        size="lg"
      >
        <Image
          src={googleIcon}
          alt="Google"
          width={20}
          height={20}
          className="mr-2 h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform"
        />
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </span>
        ) : (
          "Continuar com Google"
        )}
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">ou</span>
        </div>
      </div>

      {/* Email com Código */}
      {!showEmailInput ? (
        <Button
          variant="outline"
          onClick={() => setShowEmailInput(true)}
          className="w-full py-6"
        >
          <Mail className="w-4 h-4 mr-2" />
          Continuar com Email (Código)
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
              disabled={codeSent}
            />
          </div>
          <Button
            onClick={handleSendCode}
            disabled={loading || codeSent}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Enviar Código
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
          {showEmailInput && !codeSent && (
            <Button
              variant="ghost"
              onClick={() => setShowEmailInput(false)}
              className="w-full text-sm"
            >
              Voltar
            </Button>
          )}
        </div>
      )}

      <p className="text-xs sm:text-sm text-center text-gray-500">
        Ao continuar, você concorda com nossos termos de uso e política de
        privacidade
      </p>
    </div>
  );
}
