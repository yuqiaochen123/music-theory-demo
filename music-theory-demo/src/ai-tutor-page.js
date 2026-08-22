import { requestTutorExplanation } from './ai-tutor.js';
import { buildIncorrectFeedback, buildTutorRequest, createTutorController } from './ai-tutor-ui.js';

const feedbackElement = document.querySelector('#feedback');

if (feedbackElement) {
  const controller = createTutorController({
    feedbackElement,
    requestExplanation: requestTutorExplanation,
    useFloatingGuide: true,
    onPending() {
      window.dispatchEvent(new CustomEvent('listening-desk:quaver', {
        detail: { type: 'tutor:pending' },
      }));
    },
    onExplanation(message) {
      window.dispatchEvent(new CustomEvent('listening-desk:quaver', {
        detail: { type: 'tutor:explanation', message },
      }));
    },
  });

  window.ListeningDeskTutor = {
    reset: controller.reset,
    ask: controller.ask,
    feedback(input) {
      return buildIncorrectFeedback(buildTutorRequest(input));
    },
    explain(input) {
      return controller.explain(buildTutorRequest(input));
    },
  };
}
