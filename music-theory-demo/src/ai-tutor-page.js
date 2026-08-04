import { requestTutorExplanation } from './ai-tutor.js';
import { buildIncorrectFeedback, buildTutorRequest, createTutorController } from './ai-tutor-ui.js';

const feedbackElement = document.querySelector('#feedback');

if (feedbackElement) {
  const controller = createTutorController({
    feedbackElement,
    requestExplanation: requestTutorExplanation,
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
