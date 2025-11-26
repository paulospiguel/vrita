"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  SkipForward,
  CreditCard,
  Users,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import type { LifelineType } from "@/lib/quiz/types";

interface LifelineConfig {
  available: number;
  max: number;
}

interface QuizLifelinesProps {
  lifelines: {
    skip: LifelineConfig;
    cards: LifelineConfig;
    audience: LifelineConfig;
  };
  onUseLifeline: (type: LifelineType) => void;
  disabled?: boolean;
  className?: string;
}

export function QuizLifelines({
  lifelines,
  onUseLifeline,
  disabled = false,
  className,
}: QuizLifelinesProps) {
  const lifelineButtons = [
    {
      type: "skip" as LifelineType,
      label: "Pular",
      description: `${lifelines.skip.available}/${lifelines.skip.max} disponíveis`,
      icon: SkipForward,
      available: lifelines.skip.available,
      gradient: "from-blue-500 to-blue-600",
      hoverGradient: "hover:from-blue-600 hover:to-blue-700",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-500",
    },
    {
      type: "cards" as LifelineType,
      label: "Cartas",
      description: lifelines.cards.available > 0
        ? "Elimina 2 opções"
        : "Já utilizado",
      icon: CreditCard,
      available: lifelines.cards.available,
      gradient: "from-purple-500 to-purple-600",
      hoverGradient: "hover:from-purple-600 hover:to-purple-700",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-500",
    },
    {
      type: "audience" as LifelineType,
      label: "Resposta da Equipe",
      description:
        lifelines.audience.available > 0
          ? "Média das respostas"
          : "Já utilizado",
      icon: Users,
      available: lifelines.audience.available,
      gradient: "from-amber-500 to-amber-600",
      hoverGradient: "hover:from-amber-600 hover:to-amber-700",
      iconBg: "bg-amber-500/20",
      iconColor: "text-amber-500",
    },
  ];

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {lifelineButtons.map((lifeline) => {
        const isAvailable = lifeline.available > 0;
        const Icon = lifeline.icon;

        return (
          <Button
            key={lifeline.type}
            onClick={() => onUseLifeline(lifeline.type)}
            disabled={disabled || !isAvailable}
            variant="outline"
            className={cn(
              "relative flex flex-col items-center justify-center gap-3 h-auto py-5 px-4 w-full",
              "border-2 transition-all duration-300 rounded-xl",
              "group",
              isAvailable &&
                !disabled && [
                  "border-transparent",
                  `bg-gradient-to-br ${lifeline.gradient}`,
                  lifeline.hoverGradient,
                  "text-white shadow-lg hover:shadow-xl hover:scale-[1.02]",
                  "hover:ring-2 hover:ring-white/20",
                ],
              !isAvailable &&
                "opacity-50 cursor-not-allowed bg-muted border-muted-foreground/20"
            )}
          >
            {/* Sparkle effect for available */}
            {isAvailable && !disabled && (
              <Sparkles className="absolute top-2 right-2 w-5 h-5 text-yellow-300 animate-pulse" />
            )}

            {/* Icon container */}
            <div
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                isAvailable && !disabled
                  ? "bg-white/20 group-hover:bg-white/30"
                  : lifeline.iconBg
              )}
            >
              <Icon
                className={cn(
                  "w-7 h-7 transition-transform group-hover:scale-110",
                  isAvailable && !disabled
                    ? "text-white"
                    : lifeline.iconColor
                )}
              />
            </div>

            {/* Label */}
            <span className="font-bold text-base">{lifeline.label}</span>

            {/* Description */}
            <span
              className={cn(
                "text-xs text-center leading-tight",
                isAvailable && !disabled
                  ? "text-white/90"
                  : "text-muted-foreground"
              )}
            >
              {lifeline.description}
            </span>

            {/* Indicator dots for skip */}
            {lifeline.type === "skip" && (
              <div className="flex gap-1.5 mt-1">
                {Array.from({ length: lifelines.skip.max }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      i < lifelines.skip.available
                        ? isAvailable && !disabled
                          ? "bg-white shadow-sm"
                          : "bg-blue-500"
                        : isAvailable && !disabled
                          ? "bg-white/30"
                          : "bg-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Used indicator for single-use lifelines */}
            {(lifeline.type === "cards" || lifeline.type === "audience") &&
              !isAvailable && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <X className="w-3.5 h-3.5 text-white" />
                </div>
              )}
          </Button>
        );
      })}
    </div>
  );
}

// Componente para mostrar resultado da ajuda "Resposta da Equipe"
interface AudienceResultProps {
  percentages: number[];
  options: string[];
  className?: string;
}

export function AudienceResult({
  percentages,
  options,
  className,
}: AudienceResultProps) {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-amber-500",
    "bg-red-500",
  ];

  return (
    <div
      className={cn(
        "space-y-4 p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl border-2 border-amber-200 dark:border-amber-800 shadow-lg",
        className
      )}
    >
      <div className="flex items-center gap-3 text-base font-semibold text-amber-900 dark:text-amber-100">
        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
          <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <span>Resposta da Equipe</span>
      </div>

      <div className="space-y-3">
        {percentages.map((percentage, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold truncate max-w-[250px]">
                {String.fromCharCode(65 + index)}. {options[index]}
              </span>
              <span className="font-bold text-lg text-amber-900 dark:text-amber-100">
                {percentage}%
              </span>
            </div>
            <div className="h-4 bg-amber-200/50 dark:bg-amber-900/30 rounded-full overflow-hidden shadow-inner">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-out shadow-sm",
                  colors[index]
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
