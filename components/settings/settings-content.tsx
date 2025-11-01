"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/layout/header";
import { User } from "@supabase/supabase-js";
import {
  User as UserIcon,
  Mail,
  Sparkles,
  Save,
  Crown,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  X,
  SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { AVAILABLE_MODELS, getModelsByProvider } from "@/lib/ai/models";
import type { AIProvider } from "@/lib/ai/types";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface SettingsContentProps {
  user: User;
}

export function SettingsContent({ user }: SettingsContentProps) {
  const [provider, setProvider] = useState<AIProvider>("gemini");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    hasActiveSubscription: boolean;
    hasUserApiKey: boolean;
    canUseServerAIKey: boolean;
  } | null>(null);
  const [customModels, setCustomModels] = useState<
    Array<{
      id: string;
      name: string;
      modelId: string;
      provider: AIProvider;
      description?: string;
    }>
  >([]);
  const [showCustomModelDialog, setShowCustomModelDialog] = useState(false);
  const [editingModel, setEditingModel] = useState<{
    id?: string;
    name: string;
    modelId: string;
    provider: AIProvider;
    description: string;
  } | null>(null);

  const availableModels = getModelsByProvider(provider);
  const allAvailableModels = [
    ...availableModels,
    ...customModels
      .filter((m) => m.provider === provider)
      .map((m) => ({
        id: m.modelId,
        name: m.name,
        provider: m.provider,
        description: m.description,
      })),
  ];

  useEffect(() => {
    // Carregar configuração atual, status de assinatura e modelos personalizados
    const loadConfig = async () => {
      setLoading(true);
      try {
        const [configResponse, subscriptionResponse, customModelsResponse] =
          await Promise.all([
            fetch("/api/ai-config"),
            fetch("/api/subscription/status"),
            fetch("/api/custom-models"),
          ]);

        if (configResponse.ok) {
          const config = await configResponse.json();
          setProvider(config.provider || "gemini");
          setModel(config.model || "gemini-2.5-flash");
          setApiKey(config.apiKey || "");
        }

        if (subscriptionResponse.ok) {
          const subscription = await subscriptionResponse.json();
          setSubscriptionStatus({
            hasActiveSubscription: subscription.hasActiveSubscription || false,
            hasUserApiKey: subscription.hasUserApiKey || false,
            canUseServerAIKey: subscription.canUseServerAIKey || false,
          });
        }

        if (customModelsResponse.ok) {
          const data = await customModelsResponse.json();
          setCustomModels(data.models || []);
        }
      } catch (error) {
        console.error("Erro ao carregar configuração:", error);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  // Resetar modelo quando mudar provedor
  useEffect(() => {
    const allModels = [
      ...getModelsByProvider(provider),
      ...customModels
        .filter((m) => m.provider === provider)
        .map((m) => ({
          id: m.modelId,
          name: m.name,
          provider: m.provider,
          description: m.description,
        })),
    ];
    if (allModels.length > 0 && !allModels.find((m) => m.id === model)) {
      setModel(allModels[0].id);
    }
  }, [provider, model, customModels]);

  const handleSave = async () => {
    if (!model) {
      toast.error("Selecione um modelo");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/ai-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model,
          apiKey: apiKey.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar configuração");
      }

      toast.success("Configuração salva com sucesso!", {
        description: "Suas preferências de IA foram atualizadas.",
      });
    } catch (error: any) {
      console.error("Erro ao salvar configuração:", error);
      toast.error("Erro ao salvar configuração", {
        description: error.message || "Tente novamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold my-6 sm:mb-8 text-foreground flex items-center gap-2">
          <SettingsIcon className="h-8 w-8 mr-2" /> Configurações
        </h1>

        <div className="space-y-4 sm:space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Perfil do Usuário
              </CardTitle>
              <CardDescription>Informações da sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {user.user_metadata?.avatar_url ? (
                  <Image
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-lg">
                    {user.user_metadata?.full_name || user.email}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Configurações de IA
              </CardTitle>
              <CardDescription>
                Escolha o provedor e modelo de IA para geração de conteúdo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5">
              {loading ? (
                <div className="text-center py-4 sm:py-6 text-muted-foreground">
                  Carregando configurações...
                </div>
              ) : (
                <>
                  <div className="space-y-2 sm:space-y-3">
                    <Label htmlFor="provider">Provedor de IA</Label>
                    <Select
                      value={provider}
                      onValueChange={(value) =>
                        setProvider(value as AIProvider)
                      }
                    >
                      <SelectTrigger id="provider">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                        <SelectItem value="openrouter">OpenRouter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="model">Modelo</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingModel({
                            name: "",
                            modelId: "",
                            provider: provider,
                            description: "",
                          });
                          setShowCustomModelDialog(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Modelo Personalizado
                      </Button>
                    </div>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger id="model">
                        <SelectValue placeholder="Selecione um modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.length > 0 && (
                          <>
                            <SelectItem value="__default__" disabled>
                              Modelos Padrão
                            </SelectItem>
                            {availableModels.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name}
                              </SelectItem>
                            ))}
                          </>
                        )}
                        {customModels.filter((m) => m.provider === provider)
                          .length > 0 && (
                          <>
                            <SelectItem value="__custom__" disabled>
                              Modelos Personalizados
                            </SelectItem>
                            {customModels
                              .filter((m) => m.provider === provider)
                              .map((m) => (
                                <SelectItem key={m.id} value={m.modelId}>
                                  {m.name} (Personalizado)
                                </SelectItem>
                              ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <Label htmlFor="apiKey">Sua Chave de API (Opcional)</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder={
                        provider === "gemini"
                          ? "sk-... (opcional - use sua própria chave do Google)"
                          : "sk-or-... (opcional - use sua própria chave do OpenRouter)"
                      }
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    {!apiKey && !subscriptionStatus?.hasActiveSubscription && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                        <p className="text-xs text-red-800 dark:text-red-200 mb-2">
                          <strong>⚠️ Atenção:</strong> Para usar a chave de IA
                          do servidor, você precisa de uma assinatura ativa.
                        </p>
                        <Link href="/subscription">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Crown className="mr-2 h-4 w-4" />
                            Ver Planos de Assinatura
                            <ExternalLink className="ml-2 h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    )}
                    {subscriptionStatus?.hasActiveSubscription && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                        <p className="text-xs text-green-800 dark:text-green-200 flex items-center gap-2">
                          <Crown className="h-4 w-4" />
                          <span>
                            Você tem uma assinatura ativa e pode usar a chave do
                            servidor.
                          </span>
                        </p>
                      </div>
                    )}
                    {apiKey && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-800 dark:text-blue-200">
                          <strong>✓ Sua chave configurada:</strong> Você está
                          usando sua própria chave de API. Isso permite controle
                          total sobre custos e limites, sem necessidade de
                          assinatura.
                        </p>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={saving || !model}
                    className="w-full"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Salvando..." : "Salvar Configuração"}
                  </Button>

                  {customModels.filter((m) => m.provider === provider).length >
                    0 && (
                    <div className="pt-4 mt-4 border-t">
                      <Label className="mb-3 block">
                        Modelos Personalizados
                      </Label>
                      <div className="space-y-2">
                        {customModels
                          .filter((m) => m.provider === provider)
                          .map((m) => (
                            <div
                              key={m.id}
                              className="flex items-center justify-between p-2 bg-muted rounded-md"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium">{m.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {m.modelId}
                                </p>
                                {m.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {m.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingModel({
                                      id: m.id,
                                      name: m.name,
                                      modelId: m.modelId,
                                      provider: m.provider,
                                      description: m.description || "",
                                    });
                                    setShowCustomModelDialog(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    if (
                                      confirm(
                                        "Tem certeza que deseja remover este modelo personalizado?"
                                      )
                                    ) {
                                      try {
                                        const response = await fetch(
                                          `/api/custom-models?id=${m.id}`,
                                          {
                                            method: "DELETE",
                                          }
                                        );
                                        if (response.ok) {
                                          setCustomModels(
                                            customModels.filter(
                                              (cm) => cm.id !== m.id
                                            )
                                          );
                                          toast.success(
                                            "Modelo removido com sucesso"
                                          );
                                        } else {
                                          throw new Error(
                                            "Erro ao remover modelo"
                                          );
                                        }
                                      } catch (error) {
                                        toast.error("Erro ao remover modelo");
                                      }
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Dialog para criar/editar modelo personalizado */}
          <Dialog
            open={showCustomModelDialog}
            onOpenChange={setShowCustomModelDialog}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingModel?.id
                    ? "Editar Modelo Personalizado"
                    : "Adicionar Modelo Personalizado"}
                </DialogTitle>
                <DialogDescription>
                  Configure um modelo personalizado que não está na lista padrão
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-model-name">Nome do Modelo</Label>
                  <Input
                    id="custom-model-name"
                    placeholder="Ex: Meu Modelo Customizado"
                    value={editingModel?.name || ""}
                    onChange={(e) =>
                      setEditingModel({
                        ...editingModel!,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-model-id">ID do Modelo</Label>
                  <Input
                    id="custom-model-id"
                    placeholder={
                      provider === "gemini"
                        ? "Ex: gemini-2.0-flash-exp"
                        : "Ex: anthropic/claude-3.5-sonnet"
                    }
                    value={editingModel?.modelId || ""}
                    onChange={(e) =>
                      setEditingModel({
                        ...editingModel!,
                        modelId: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {provider === "gemini"
                      ? "ID do modelo conforme documentação do Google Gemini"
                      : "ID do modelo conforme documentação do OpenRouter"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-model-provider">Provedor</Label>
                  <Select
                    value={editingModel?.provider || provider}
                    onValueChange={(value) =>
                      setEditingModel({
                        ...editingModel!,
                        provider: value as AIProvider,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                      <SelectItem value="openrouter">OpenRouter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-model-description">
                    Descrição (Opcional)
                  </Label>
                  <Textarea
                    id="custom-model-description"
                    placeholder="Descreva o modelo ou suas características..."
                    value={editingModel?.description || ""}
                    onChange={(e) =>
                      setEditingModel({
                        ...editingModel!,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCustomModelDialog(false);
                      setEditingModel(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!editingModel?.name || !editingModel?.modelId) {
                        toast.error("Preencha nome e ID do modelo");
                        return;
                      }

                      try {
                        const url = editingModel.id
                          ? "/api/custom-models"
                          : "/api/custom-models";
                        const method = editingModel.id ? "PUT" : "POST";

                        const response = await fetch(url, {
                          method,
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            id: editingModel.id,
                            name: editingModel.name,
                            modelId: editingModel.modelId,
                            provider: editingModel.provider,
                            description: editingModel.description || undefined,
                          }),
                        });

                        if (!response.ok) {
                          const error = await response.json();
                          throw new Error(
                            error.error || "Erro ao salvar modelo"
                          );
                        }

                        // Recarregar modelos personalizados
                        const modelsResponse = await fetch(
                          "/api/custom-models"
                        );
                        if (modelsResponse.ok) {
                          const data = await modelsResponse.json();
                          setCustomModels(data.models || []);
                        }

                        toast.success(
                          editingModel.id
                            ? "Modelo atualizado com sucesso"
                            : "Modelo adicionado com sucesso"
                        );
                        setShowCustomModelDialog(false);
                        setEditingModel(null);
                      } catch (error: any) {
                        toast.error(error.message || "Erro ao salvar modelo");
                      }
                    }}
                  >
                    {editingModel?.id ? "Atualizar" : "Adicionar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Sobre o vRita AI
              </CardTitle>
              <CardDescription>
                Plataforma SaaS para geração inteligente de documentação técnica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-accent rounded-lg border border-border">
                  <h3 className="font-semibold text-lg mb-2 text-foreground">
                    Objetivo da Plataforma
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    O vRita AI é uma plataforma SaaS projetada para revolucionar
                    a criação de documentação técnica para projetos de software.
                    Nossa missão é acelerar o desenvolvimento de aplicações
                    fornecendo ferramentas inteligentes de geração de PRDs
                    (Product Requirement Documents), descrições de features e
                    sistemas de design, tudo alimentado por Inteligência
                    Artificial de última geração.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Versão
                      </p>
                      <p className="text-lg font-semibold">1.0.0</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Plataforma
                      </p>
                      <p className="text-sm">SaaS Multi-tenant</p>
                    </div>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Status
                      </p>
                      <p className="text-sm font-medium text-primary">
                        Em Produção
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Arquitetura
                      </p>
                      <p className="text-sm">Cloud-First</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 sm:pt-6 border-t">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Funcionalidades Principais
                  </p>
                  <ul className="space-y-2 sm:space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>
                        Geração automática de PRDs estruturados e profissionais
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>
                        Descrições detalhadas de features com especificações
                        técnicas
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>
                        Sistemas de design completos com teoria de cores e
                        psicologia visual
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>
                        Suporte a múltiplos provedores de IA (Gemini,
                        OpenRouter)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>
                        Gerenciamento de projetos e documentação centralizada
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
