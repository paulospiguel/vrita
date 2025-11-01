"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import googleIcon from "@/assets/icons/google.svg";

export function AuthForm() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
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
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            Carregando...
          </span>
        ) : (
          "Continuar com Google"
        )}
      </Button>
      <p className="text-xs sm:text-sm text-center text-gray-500 mt-4">
        Ao continuar, você concorda com nossos termos de uso e política de
        privacidade
      </p>
    </div>
  );
}
