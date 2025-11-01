"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type GeneratorType = "prd" | "feature" | "designer" | null;

interface GeneratorState {
  input: string;
  output: string;
}

interface GenerationContextType {
  activeGenerator: GeneratorType;
  setActiveGenerator: (type: GeneratorType) => void;
  generatorStates: {
    feature: GeneratorState;
    designer: GeneratorState;
  };
  updateGeneratorState: (
    type: "feature" | "designer",
    state: Partial<GeneratorState>
  ) => void;
}

const GenerationContext = createContext<GenerationContextType>({
  activeGenerator: null,
  setActiveGenerator: () => {},
  generatorStates: {
    feature: { input: "", output: "" },
    designer: { input: "", output: "" },
  },
  updateGeneratorState: () => {},
});

export function GenerationProvider({ children }: { children: ReactNode }) {
  const [activeGenerator, setActiveGenerator] = useState<GeneratorType>("prd");
  const [generatorStates, setGeneratorStates] = useState({
    feature: { input: "", output: "" },
    designer: { input: "", output: "" },
  });

  const updateGeneratorState = (
    type: "feature" | "designer",
    state: Partial<GeneratorState>
  ) => {
    setGeneratorStates((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...state },
    }));
  };

  return (
    <GenerationContext.Provider
      value={{
        activeGenerator,
        setActiveGenerator,
        generatorStates,
        updateGeneratorState,
      }}
    >
      {children}
    </GenerationContext.Provider>
  );
}

export const useGeneration = () => useContext(GenerationContext);
