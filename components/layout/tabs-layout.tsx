"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "./header"
import { PRDGenerator } from "@/components/generators/prd-generator"
import { FeatureGenerator } from "@/components/generators/feature-generator"
import { SystemDesignerGenerator } from "@/components/generators/system-designer-generator"

export function TabsLayout() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Gerador de PRD Estruturado
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Crie documentos profissionais para desenvolvimento de aplica??es
          </p>
        </div>
        <Tabs defaultValue="prd" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="prd" className="text-base font-semibold">
              Gerador de PRD
            </TabsTrigger>
            <TabsTrigger value="feature" className="text-base font-semibold">
              Descri??o de Feature
            </TabsTrigger>
            <TabsTrigger value="designer" className="text-base font-semibold">
              System Designer
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
