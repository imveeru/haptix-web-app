import { PageController } from '../router';
import { RouteParams, FeedbackSubmission, FeedbackQuestion } from '../types';
import { StarRating } from '../components/star-rating';
import { submitFeedback } from '../services/feedback';
import { toastInstance } from '../components/toast';

const QUESTIONS: Omit<FeedbackQuestion, 'rating'>[] = [
  { id: 'q1', label: 'Overall enjoyment of the experience' },
  { id: 'q2', label: 'Video content quality' },
  { id: 'q3', label: 'Haptic feedback relevance' },
  { id: 'q4', label: 'Haptic feedback intensity' },
  { id: 'q5', label: 'Haptic feedback timing accuracy' },
  { id: 'q6', label: 'App responsiveness and performance' },
  { id: 'q7', label: 'Visual design and aesthetics' },
  { id: 'q8', label: 'Ease of navigation' },
  { id: 'q9', label: 'Audio-haptic synchronization' },
  { id: 'q10', label: 'Likelihood to recommend Haptix' },
];

export class FeedbackPage implements PageController {
  private container!: HTMLElement;
  private questions: FeedbackQuestion[] = [];
  private starComponents: StarRating[] = [];

  mount(container: HTMLElement, _params: RouteParams): void {
    this.container = container;
    this.questions = QUESTIONS.map(q => ({ ...q, rating: 0 }));
    this.render();
  }

  unmount(): void {
    this.container.innerHTML = '';
  }

  private render() {
    this.container.innerHTML = `
      <div class="feedback-page">
        <header class="feedback-header">
          <h2 class="feedback-title">Feedback</h2>
        </header>
        <form class="feedback-form" id="feedback-form" novalidate>
          <div id="questions-container"></div>
          <button type="submit" class="submit-button" id="submit-btn">Submit Feedback</button>
          <div class="error-text" id="error-text" role="alert" aria-live="assertive"></div>
        </form>
      </div>
    `;

    const qContainer = this.container.querySelector('#questions-container')!;
    
    this.questions.forEach((q, index) => {
      const fieldset = document.createElement('fieldset');
      const legend = document.createElement('legend');
      legend.textContent = q.label;
      fieldset.appendChild(legend);

      const starRating = new StarRating(q.id, q.label, q.rating, (rating) => {
        this.questions[index].rating = rating;
        this.clearError();
      });
      
      this.starComponents.push(starRating);
      fieldset.appendChild(starRating.getElement());
      qContainer.appendChild(fieldset);
    });

    const form = this.container.querySelector('#feedback-form') as HTMLFormElement;
    form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    this.clearError();

    const submitBtn = this.container.querySelector('#submit-btn') as HTMLButtonElement;
    
    const submission: FeedbackSubmission = {
      timestamp: new Date().toISOString(),
      questions: [...this.questions]
    };

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
      
      await submitFeedback(submission);
      
      toastInstance.show('Thanks for your feedback!');
      this.resetForm();
    } catch (err: any) {
      this.showError(err.message || 'An error occurred. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Feedback';
    }
  }

  private resetForm() {
    this.questions.forEach(q => (q.rating = 0));
    this.starComponents.forEach(c => c.reset());
  }

  private showError(msg: string) {
    const errorEl = this.container.querySelector('#error-text')!;
    errorEl.textContent = msg;
  }

  private clearError() {
    const errorEl = this.container.querySelector('#error-text');
    if (errorEl) errorEl.textContent = '';
  }
}
