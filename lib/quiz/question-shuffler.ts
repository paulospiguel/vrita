import type { QuizQuestion } from "./types";

export interface ShuffledQuestion extends QuizQuestion {
  shuffled_options: string[];
  shuffled_correct_option: number;
  original_order_index: number;
}

/**
 * Gera um número pseudo-aleatório determinístico baseado em um seed
 */
function seededRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

/**
 * Embaralha um array de forma determinística usando um seed
 */
function deterministicShuffle<T>(array: T[], seed: number): T[] {
  const random = seededRandom(seed);
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Converte um índice embaralhado de volta para o índice original
 * @param shuffledIndex Índice na ordem embaralhada (0-3)
 * @param originalOptions Array original de opções
 * @param shuffledOptions Array embaralhado de opções
 * @returns Índice original (0-3)
 */
export function convertShuffledToOriginalIndex(
  shuffledIndex: number,
  originalOptions: string[],
  shuffledOptions: string[]
): number {
  if (shuffledIndex < 0 || shuffledIndex >= shuffledOptions.length) {
    return -1;
  }
  const selectedText = shuffledOptions[shuffledIndex];
  return originalOptions.indexOf(selectedText);
}

/**
 * Reordena as perguntas e opções de forma determinística para cada participante
 * Isso evita que participantes copiem respostas uns dos outros
 * O embaralhamento é determinístico baseado no participantId para poder recalcular depois
 */
export function shuffleQuestionsForParticipant(
  questions: QuizQuestion[],
  participantId?: string
): ShuffledQuestion[] {
  // Criar seed determinístico baseado no ID do participante
  const seed = participantId 
    ? participantId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    : Math.floor(Math.random() * 1000000);

  // Criar cópia das perguntas
  const shuffled = [...questions];

  // Embaralhar a ordem das perguntas de forma determinística
  const shuffledQuestions = deterministicShuffle(shuffled, seed);

  // Para cada pergunta, embaralhar as opções e atualizar o índice correto
  return shuffledQuestions.map((question, newIndex) => {
    const options = [...question.options];
    const correctOption = question.correct_option;

    // Criar seed único para esta pergunta
    const questionSeed = seed + question.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // Embaralhar os índices das opções de forma determinística
    const optionIndices = deterministicShuffle([0, 1, 2, 3], questionSeed);

    // Criar novo array de opções na ordem embaralhada
    const shuffledOptions = optionIndices.map((idx) => options[idx]);

    // Encontrar o novo índice da opção correta
    const shuffledCorrectOption = optionIndices.indexOf(correctOption);

    return {
      ...question,
      shuffled_options: shuffledOptions,
      shuffled_correct_option: shuffledCorrectOption,
      original_order_index: question.order_index,
      order_index: newIndex, // Nova ordem para este participante
    };
  });
}

/**
 * Converte uma pergunta embaralhada de volta para o formato original
 * (usado para salvar a resposta com o índice original)
 */
export function getOriginalQuestionData(
  shuffledQuestion: ShuffledQuestion,
  selectedShuffledOption: number
): {
  original_question_id: string;
  original_correct_option: number;
  original_selected_option: number | null;
} {
  // Encontrar o índice original da opção selecionada
  const shuffledOptions = shuffledQuestion.shuffled_options;
  const selectedOptionText = shuffledOptions[selectedShuffledOption];

  // Encontrar o índice original
  const originalSelectedOption =
    shuffledQuestion.options.indexOf(selectedOptionText);

  return {
    original_question_id: shuffledQuestion.id,
    original_correct_option: shuffledQuestion.correct_option,
    original_selected_option:
      originalSelectedOption >= 0 ? originalSelectedOption : null,
  };
}

