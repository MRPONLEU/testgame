import { Question, ShuffledQuestion } from '../types';

/**
 * Modern Fisher-Yates shuffle algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Prepares questions for a student session:
 * 1. Shuffles question order if shuffleQuestions is true
 * 2. Shuffles option choices for each question if shuffleOptions is true
 * 3. Keeps mapping to evaluate correct answer correctly
 */
export function prepareStudentQuestions(
  questions: Question[],
  shuffleQuestions: boolean = true,
  shuffleOptions: boolean = true
): ShuffledQuestion[] {
  let list = [...questions];
  if (shuffleQuestions) {
    list = shuffleArray(list);
  }

  return list.map((q) => {
    let options = [...q.options];
    if (shuffleOptions) {
      options = shuffleArray(options);
    }
    return {
      originalId: q.id,
      prompt: q.prompt,
      options,
      originalCorrectOptionId: q.correctOptionId,
      explanation: q.explanation,
      points: q.points ?? 10,
      moduleId: q.moduleId,
    };
  });
}

/**
 * Khmer Choice Labels (ក, ខ, គ, ឃ...) & English (A, B, C, D...)
 */
export const KHMER_LABELS = ['ក', 'ខ', 'គ', 'ឃ', 'ង', 'ច'];
export const EN_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
