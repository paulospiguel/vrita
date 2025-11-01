"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "./header";
import { PRDGenerator } from "@/components/generators/prd-generator";
import { FeatureGenerator } from "@/components/generators/feature-generator";
import { SystemDesignerGenerator } from "@/components/generators/system-designer-generator";
import { useGeneration } from "@/components/providers/generation-context";

export function TabsLayout() {
  const [activeTab, setActiveTab] = useState("prd");
  const { setActiveGenerator } = useGeneration();

  // Inicializar e sincronizar o gerador ativo
  useEffect(() => {
    setActiveGenerator(activeTab as "prd" | "feature" | "designer");
  }, [activeTab, setActiveGenerator]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Atualizar gerador ativo imediatamente quando trocar de aba
    setActiveGenerator(value as "prd" | "feature" | "designer");
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 lg:py-10">
        <div className="mb-8 sm:mb-10 text-center px-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
            Gerador de PRD Estruturado
          </h1>
          <p className="text-base sm:text-lg text-gray-600 px-2">
            Crie documentos profissionais para desenvolvimento de aplicações
          </p>
        </div>
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6 sm:mb-8 h-auto bg-white rounded-xl p-1.5 shadow-sm border border-gray-200/50">
            <TabsTrigger
              value="prd"
              className="text-xs sm:text-sm lg:text-base font-semibold px-3 sm:px-5 py-2.5 sm:py-3 whitespace-nowrap rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <span className="hidden sm:inline">Gerador de PRD</span>
              <span className="sm:hidden">PRD</span>
            </TabsTrigger>
            <TabsTrigger
              value="feature"
              className="text-xs sm:text-sm lg:text-base font-semibold px-3 sm:px-5 py-2.5 sm:py-3 whitespace-nowrap rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <span className="hidden sm:inline">Descrição de Feature</span>
              <span className="sm:hidden">Feature</span>
            </TabsTrigger>
            <TabsTrigger
              value="designer"
              className="text-xs sm:text-sm lg:text-base font-semibold px-3 sm:px-5 py-2.5 sm:py-3 whitespace-nowrap rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <span className="hidden sm:inline">System Designer</span>
              <span className="sm:hidden">Designer</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="prd" className="mt-0">
            <PRDGenerator />
          </TabsContent>
          <TabsContent value="feature" className="mt-0">
            <FeatureGenerator />
          </TabsContent>
          <TabsContent value="designer" className="mt-0">
            <SystemDesignerGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
