/**
 * Classe de erro customizada para erros que podem ser retentados
 */
export class RetryableError extends Error {
  constructor(message: string, public readonly isRetryable: boolean = true) {
    super(message)
    this.name = "RetryableError"
  }
}

