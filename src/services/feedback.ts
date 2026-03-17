import { FeedbackSubmission } from '../types';

export async function submitFeedback(submission: FeedbackSubmission): Promise<void> {
  // Validate all questions have > 0 rating
  const hasUnanswered = submission.questions.some(q => q.rating === 0);
  if (hasUnanswered) {
    throw new Error('Please answer all questions before submitting.');
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1200));

  // Log to console per requirements
  console.log('Feedback submitted:', submission);
}
