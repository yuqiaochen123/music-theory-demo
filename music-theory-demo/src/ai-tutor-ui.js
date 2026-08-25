function removeTutorRegion(feedbackElement) {
  feedbackElement.querySelector('.tutor-feedback')?.remove();
}

function createTextElement(document, tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function list(value) {
  return Array.isArray(value) ? value.flat(2).map(item => String(item)).join(', ') : '';
}

export function cleanTutorExplanation(value) {
  const original = String(value ?? '').trim();
  const cleaned = original
    .replace(/^Your choice\b[\s\S]*?\bis different from the correct answer\b[\s\S]*?[.!?][”"']?\s*/i, '')
    .replace(/^Your (?:answer|choice)\b[\s\S]*?\b(?:is|was) (?:incorrect|wrong)[.!?][”"']?\s*/i, '')
    .replace(/^(?:That|This) (?:answer|choice) (?:is|was) (?:incorrect|wrong)[.!?][”"']?\s*/i, '')
    .trim();
  return cleaned || original;
}

export function buildIncorrectFeedback(input) {
  const detail = input.facts?.find(fact => fact.startsWith('Musical detail: '))?.slice(16);
  return `The correct answer is “${input.correctAnswer}”.${detail ? ` ${detail}` : ''}`;
}

function answerGuide(input) {
  const explanation = buildIncorrectFeedback(input);
  const tip = `Compare “${input.selectedAnswer}” with the defining clue in the question.`;
  return { explanation, tip };
}

export function buildTutorRequest({ topicId, exerciseId, question, selectedAnswer, defaultPrompt }) {
  const facts = [];
  const add = (label, value) => {
    const detail = list(value);
    if (detail) facts.push(`${label}: ${detail}`.slice(0, 500));
  };

  add('Available choices', question.choices);
  add('Written notes', question.notes);
  add('Key', question.key ? [question.key] : []);
  add('Written chords', question.chords);
  add('Metre', question.meter);
  add('Beat grouping', question.groups);
  add('Scale type', question.type ? [question.type] : []);
  add('Visual clue', question.concept?.symbol ? [question.concept.symbol] : []);
  add('Musical detail', question.concept?.detail ? [question.concept.detail] : []);

  return {
    topicId: String(topicId),
    exerciseId: String(exerciseId),
    prompt: String(question.prompt || defaultPrompt),
    selectedAnswer: String(selectedAnswer),
    correctAnswer: String(question.answer),
    facts: facts.slice(0, 8),
  };
}

export function createTutorController({ requestExplanation, feedbackElement, useFloatingGuide = false, onPending = null, onExplanation = null }) {
  let generation = 0;
  let currentRequest = null;
  let history = [];
  let followUpCount = 0;
  let pending = false;
  let chatElements = null;

  function combinedReply(result) {
    return `${cleanTutorExplanation(result.explanation)} Try this: ${result.tip}`;
  }

  function appendChatMessage(role, text) {
    if (!chatElements) return;
    chatElements.messages.append(createTextElement(
      feedbackElement.ownerDocument,
      'p',
      `tutor-chat__message tutor-chat__message--${role}`,
      text,
    ));
  }

  function setPending(value) {
    pending = value;
    if (!chatElements) return;
    chatElements.input.disabled = value || followUpCount >= 8;
    chatElements.submit.disabled = value || followUpCount >= 8;
    chatElements.status.textContent = value
      ? 'Quaver is replying…'
      : followUpCount >= 8
        ? 'You have reached the eight-question limit for this exercise.'
        : '';
  }

  function installChat(region) {
    const document = feedbackElement.ownerDocument;
    const toggle = createTextElement(document, 'button', 'tutor-chat__toggle', 'Ask Quaver a follow-up →');
    toggle.type = 'button';
    toggle.setAttribute?.('aria-expanded', 'false');

    const chat = createTextElement(document, 'div', 'tutor-chat', '');
    chat.hidden = true;
    const messages = createTextElement(document, 'div', 'tutor-chat__messages', '');
    messages.setAttribute?.('aria-live', 'polite');
    const form = createTextElement(document, 'form', 'tutor-chat__form', '');
    const input = createTextElement(document, 'input', 'tutor-chat__input', '');
    input.type = 'text';
    input.maxLength = 500;
    input.required = true;
    input.placeholder = 'Ask about this exercise…';
    input.setAttribute?.('aria-label', 'Ask Quaver a follow-up question');
    const submit = createTextElement(document, 'button', 'tutor-chat__submit', 'Send');
    submit.type = 'submit';
    const status = createTextElement(document, 'span', 'tutor-chat__status', '');
    form.append(input, submit, status);
    chat.append(messages, form);
    region.append(toggle, chat);
    chatElements = { toggle, chat, messages, form, input, submit, status };

    toggle.onclick = () => {
      chat.hidden = !chat.hidden;
      toggle.textContent = chat.hidden ? 'Ask Quaver a follow-up →' : 'Close chat';
      toggle.setAttribute?.('aria-expanded', String(!chat.hidden));
      if (!chat.hidden) input.focus?.();
    };
    form.onsubmit = event => {
      event?.preventDefault?.();
      const question = String(input.value ?? '').trim();
      if (!question) return;
      input.value = '';
      ask(question);
    };
  }

  function reset() {
    generation += 1;
    currentRequest = null;
    history = [];
    followUpCount = 0;
    pending = false;
    chatElements = null;
    removeTutorRegion(feedbackElement);
  }

  async function ask(question) {
    const followUpQuestion = String(question ?? '').trim();
    if (!currentRequest || (!useFloatingGuide && !chatElements) || pending || followUpCount >= 8 || !followUpQuestion || followUpQuestion.length > 500) {
      return null;
    }

    const requestGeneration = generation;
    const priorHistory = history.map(item => ({ ...item }));
    followUpCount += 1;
    appendChatMessage('user', followUpQuestion);
    setPending(true);
    const result = await requestExplanation({
      ...currentRequest,
      followUpQuestion,
      history: priorHistory,
    });
    if (generation !== requestGeneration) return null;
    setPending(false);
    if (!result) {
      const failureMessage = 'Quaver could not reply just now. Your explanation above is still available.';
      if (chatElements) chatElements.status.textContent = failureMessage;
      if (useFloatingGuide) onExplanation?.(failureMessage);
      return null;
    }

    const assistantReply = combinedReply(result);
    history.push(
      { role: 'user', content: followUpQuestion },
      { role: 'assistant', content: assistantReply },
    );
    if (useFloatingGuide) onExplanation?.(assistantReply);
    else appendChatMessage('assistant', assistantReply);
    setPending(false);
    return result;
  }

  async function explain(input) {
    reset();
    const requestGeneration = generation;
    const document = feedbackElement.ownerDocument;
    if (useFloatingGuide) {
      onPending?.();
      const result = await requestExplanation(input);
      if (generation !== requestGeneration) return null;
      const response = result
        ? combinedReply(result)
        : `${answerGuide(input).explanation} Try this: ${answerGuide(input).tip}`;
      currentRequest = { ...input };
      history = [{ role: 'assistant', content: response }];
      onExplanation?.(response);
      return result;
    }
    const region = createTextElement(document, 'div', 'tutor-feedback', 'Quaver is preparing a short explanation…');
    region.setAttribute?.('aria-live', 'polite');
    feedbackElement.append(region);

    const result = await requestExplanation(input);
    if (generation !== requestGeneration) return null;
    if (!result) {
      const fallback = answerGuide(input);
      region.textContent = '';
      region.append(
        createTextElement(document, 'strong', 'tutor-feedback__label', 'Answer guide'),
        createTextElement(document, 'p', 'tutor-feedback__explanation', fallback.explanation),
        createTextElement(document, 'p', 'tutor-feedback__tip', `Try this: ${fallback.tip}`),
      );
      return null;
    }

    region.textContent = '';
    region.append(
      createTextElement(document, 'strong', 'tutor-feedback__label', 'Quaver'),
      createTextElement(document, 'p', 'tutor-feedback__explanation', cleanTutorExplanation(result.explanation)),
      createTextElement(document, 'p', 'tutor-feedback__tip', `Try this: ${result.tip}`),
    );
    currentRequest = { ...input };
    history = [{ role: 'assistant', content: combinedReply(result) }];
    installChat(region);
    return result;
  }

  return { reset, explain, ask };
}
