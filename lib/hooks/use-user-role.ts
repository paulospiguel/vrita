"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export type UserRole = "admin" | "manager" | "user";

interface UseUserRoleReturn {
  role: UserRole;
  isAdmin: boolean;
  isManager: boolean;
  canCreateQuiz: boolean;
  loading: boolean;
}

export function useUserRole(): UseUserRoleReturn {
  const [role, setRole] = useState<UserRole>("user");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role) {
          setRole(profile.role as UserRole);
        }
      } catch (error) {
        console.error("Erro ao buscar role:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [supabase]);

  return {
    role,
    isAdmin: role === "admin",
    isManager: role === "manager",
    canCreateQuiz: role === "admin" || role === "manager",
    loading,
  };
}

