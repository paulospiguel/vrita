// Types para o Requirements Wisdom Quiz

export interface Quiz {
  id: string
  user_id: string
  title: string
  description: string | null
  share_code: string
  documents_content: string
  questions_count: number
  time_per_question: number
  status: 'draft' | 'active' | 'closed'
  created_at: string
  updated_at: string
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  question_text: string
  options: string[]
  correct_option: number
  explanation: string
  difficulty: number
  points: number
  order_index: number
  created_at: string
}

export interface QuizParticipant {
  id: string
  quiz_id: string
  user_id: string
  display_name: string
  avatar_url: string | null
  total_score: number
  questions_answered: number
  correct_answers: number
  skips_used: number
  cards_used: number
  audience_used: number
  current_question_index: number
  status: 'playing' | 'completed' | 'abandoned'
  started_at: string
  completed_at: string | null
}

export interface QuizAnswer {
  id: string
  participant_id: string
  question_id: string
  selected_option: number | null
  is_correct: boolean
  is_skipped: boolean
  time_taken: number
  points_earned: number
  lifeline_used: 'skip' | 'cards' | 'audience' | null
  answered_at: string
}

export interface QuizQuestionStats {
  id: string
  question_id: string
  option_0_count: number
  option_1_count: number
  option_2_count: number
  option_3_count: number
  total_answers: number
  updated_at: string
}

// Input types para criação
export interface CreateQuizInput {
  title: string
  description?: string
  documents_content: string
  questions_count: number
  time_per_question: number
}

export interface GeneratedQuestion {
  question_text: string
  options: string[]
  correct_option: number
  explanation: string
  difficulty: number
}

// Response types
export interface QuizWithQuestions extends Quiz {
  questions: QuizQuestion[]
}

export interface ParticipantWithAnswers extends QuizParticipant {
  answers: QuizAnswer[]
}

export interface QuizRanking {
  position: number
  participant: QuizParticipant
  user_email?: string
}

export interface QuizDashboardStats {
  total_participants: number
  average_score: number
  completion_rate: number
  most_missed_questions: {
    question: QuizQuestion
    error_rate: number
  }[]
  most_correct_questions: {
    question: QuizQuestion
    correct_rate: number
  }[]
  participant_scores: {
    participant: QuizParticipant
    user_email?: string
  }[]
}

// Lifeline types
export type LifelineType = 'skip' | 'cards' | 'audience'

export interface LifelineResult {
  type: LifelineType
  data: {
    // Para 'cards': duas opções eliminadas
    eliminatedOptions?: number[]
    // Para 'audience': porcentagens
    percentages?: number[]
  }
}

// Game state
export interface QuizGameState {
  quiz: Quiz
  participant: QuizParticipant
  currentQuestion: QuizQuestion | null
  questionsCount: number
  timeRemaining: number
  lifelines: {
    skip: { available: number; max: number }
    cards: { available: number; max: number }
    audience: { available: number; max: number }
  }
  isFinished: boolean
}

