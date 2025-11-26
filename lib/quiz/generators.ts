import { GeminiProvider } from "@/lib/ai/providers/gemini";
import type { GeneratedQuestion } from "./types";

export async function generateQuizQuestions(
  documentsContent: string,
  questionsCount: number,
  userId?: string // Mantido para compatibilidade, mas não é mais usado
): Promise<GeneratedQuestion[]> {
  // Usar GEMINI_API_KEY diretamente para gerar perguntas do quiz
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error(
      "GEMINI_API_KEY não configurada. Configure a variável de ambiente GEMINI_API_KEY."
    );
  }

  // Usar modelo padrão do Gemini para quiz
  const defaultModel = "gemini-2.5-flash";
  const provider = new GeminiProvider(geminiApiKey, defaultModel);

  const prompt = `Você é um especialista em criar perguntas de quiz para avaliar o entendimento de documentos técnicos como PRDs (Product Requirement Documents) e RSDs (Requirements Specification Documents).

Analise o seguinte documento e crie ${questionsCount} perguntas de múltipla escolha para testar se uma equipe entendeu bem os requisitos do projeto.

DOCUMENTO:
${documentsContent}

INSTRUÇÕES:
1. Crie perguntas que testem a compreensão real dos requisitos, não apenas memorização
2. Cada pergunta deve ter exatamente 4 opções de resposta
3. As opções incorretas devem ser plausíveis mas claramente distinguíveis da correta para quem entendeu o documento
4. Inclua perguntas de diferentes níveis de dificuldade (1-5)
5. A explicação deve ser educativa, explicando por que a resposta está correta e referenciando o documento
6. Varie os tipos de pergunta: conceituais, práticas, sobre fluxos, sobre requisitos técnicos, etc.
7. As perguntas devem ajudar a identificar gaps de entendimento na equipe

FORMATO DE RESPOSTA (JSON Array):
[
  {
    "question_text": "Pergunta clara e objetiva?",
    "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
    "correct_option": 0,
    "explanation": "Explicação detalhada de por que esta é a resposta correta, referenciando o documento.",
    "difficulty": 2
  }
]

IMPORTANTE: 
- Retorne APENAS o JSON válido, sem texto antes ou depois
- correct_option é o índice (0-3) da opção correta
- difficulty vai de 1 (fácil) a 5 (muito difícil)
- Distribua as dificuldades: algumas fáceis, maioria média, algumas difíceis`;

  const result = await provider.generate({ prompt, maxTokens: 8192 });
  const text = result.content;

  // Extrair JSON da resposta
  try {
    const jsonMatch =
      text.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/) ||
      text.match(/(\[[\s\S]*\])/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]) as GeneratedQuestion[];

      // Validar e normalizar as perguntas
      return parsed.map((q, index) => ({
        question_text: q.question_text,
        options:
          Array.isArray(q.options) && q.options.length === 4
            ? q.options
            : ["Opção A", "Opção B", "Opção C", "Opção D"],
        correct_option:
          typeof q.correct_option === "number" &&
          q.correct_option >= 0 &&
          q.correct_option <= 3
            ? q.correct_option
            : 0,
        explanation: q.explanation || "Explicação não disponível.",
        difficulty:
          typeof q.difficulty === "number" &&
          q.difficulty >= 1 &&
          q.difficulty <= 5
            ? q.difficulty
            : Math.ceil((index + 1) / (questionsCount / 5)), // Distribuir dificuldade progressiva
      }));
    }

    throw new Error("Não foi possível extrair JSON da resposta");
  } catch (error) {
    console.error("Erro ao parsear perguntas:", error);
    throw new Error("Falha ao gerar perguntas do quiz");
  }
}

// Calcula pontos baseado na dificuldade e tempo restante
export function calculatePoints(
  difficulty: number,
  timeRemaining: number,
  totalTime: number
): number {
  const basePoints = difficulty * 100; // 100-500 pontos base
  const timeBonus = Math.floor((timeRemaining / totalTime) * 50); // até 50 pontos de bônus
  return basePoints + timeBonus;
}

// Gera resultado da ajuda "Cartas" (elimina 2 opções incorretas)
export function generateCardsHelp(correctOption: number): {
  eliminatedOptions: number[];
} {
  const incorrectOptions = [0, 1, 2, 3].filter((opt) => opt !== correctOption);
  // Embaralhar e pegar 2
  const shuffled = incorrectOptions.sort(() => Math.random() - 0.5);
  return { eliminatedOptions: shuffled.slice(0, 2) };
}

// Gera resultado da ajuda "Resposta da Equipe" (média das respostas)
export function generateAudienceHelp(
  stats: {
    option_0_count: number;
    option_1_count: number;
    option_2_count: number;
    option_3_count: number;
    total_answers: number;
  } | null,
  correctOption: number
): { percentages: number[] } {
  if (stats && stats.total_answers > 0) {
    // Usar estatísticas reais
    const total = stats.total_answers;
    return {
      percentages: [
        Math.round((stats.option_0_count / total) * 100),
        Math.round((stats.option_1_count / total) * 100),
        Math.round((stats.option_2_count / total) * 100),
        Math.round((stats.option_3_count / total) * 100),
      ],
    };
  }

  // Gerar percentagens simuladas sempre favorecendo a resposta correta
  // A resposta correta sempre terá a maior porcentagem (45-65%)
  const percentages = [0, 0, 0, 0];
  const correctPercentage = 45 + Math.floor(Math.random() * 21); // 45-65% - sempre a maior
  percentages[correctOption] = correctPercentage;

  let remaining = 100 - correctPercentage;
  const incorrectOptions = [0, 1, 2, 3].filter((opt) => opt !== correctOption);

  // Distribuir o restante de forma aleatória mas realista
  // Cada opção incorreta terá entre 5-25%
  incorrectOptions.forEach((opt, index) => {
    if (index === incorrectOptions.length - 1) {
      // Última opção pega o que sobrou
      percentages[opt] = remaining;
    } else {
      // Distribuir aleatoriamente, mas garantindo que nenhuma seja maior que a correta
      const maxForThis = Math.min(
        remaining,
        Math.floor(remaining / (incorrectOptions.length - index))
      );
      const minForThis = Math.max(5, Math.floor(remaining * 0.2));
      const value =
        minForThis + Math.floor(Math.random() * (maxForThis - minForThis));
      percentages[opt] = value;
      remaining -= value;
    }
  });

  // Garantir que a soma seja 100%
  const sum = percentages.reduce((a, b) => a + b, 0);
  if (sum !== 100) {
    const diff = 100 - sum;
    percentages[correctOption] += diff;
  }

  return { percentages };
}
