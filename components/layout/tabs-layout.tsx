"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "./header"
import { PRDGenerator } from "@/components/generators/prd-generator"
import { FeatureGenerator } from "@/components/generators/feature-generator"
import { SystemDesignerGenerator } from "@/components/generators/system-designer-generator"
import { useGeneration } from "@/components/providers/generation-context"

export function TabsLayout() {
  const [activeTab, setActiveTab] = useState("prd")
  const { setActiveGenerator } = useGeneration()

  // Inicializar e sincronizar o gerador ativo
  useEffect(() => {
    setActiveGenerator(activeTab as "prd" | "feature" | "designer")
  }, [activeTab, setActiveGenerator])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Atualizar gerador ativo imediatamente quando trocar de aba
    setActiveGenerator(value as "prd" | "feature" | "designer")
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8 text-center px-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Gerador de PRD Estruturado
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 px-2">
            Crie documentos profissionais para desenvolvimento de aplicações
          </p>
        </div>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 lg:mb-8 h-auto">
            <TabsTrigger 
              value="prd" 
              className="text-xs sm:text-sm lg:text-base font-semibold px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Gerador de PRD</span>
              <span className="sm:hidden">PRD</span>
            </TabsTrigger>
            <TabsTrigger 
              value="feature" 
              className="text-xs sm:text-sm lg:text-base font-semibold px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Descrição de Feature</span>
              <span className="sm:hidden">Feature</span>
            </TabsTrigger>
            <TabsTrigger 
              value="designer" 
              className="text-xs sm:text-sm lg:text-base font-semibold px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap"
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
  )
}
