export function createMatchingState() {
  return { selectedLabel: null, assignments: {} };
}

export function assignMatch(state, labelId, targetId) {
  const assignments = Object.fromEntries(Object.entries(state.assignments).filter(([, assigned]) => assigned !== labelId));
  assignments[targetId] = labelId;
  return { selectedLabel: null, assignments };
}

export function checkMatches(state, exercise) {
  if (Object.keys(state.assignments).length < exercise.targets.length) {
    return { correct: false, code: "incomplete", message: "Match every item before checking." };
  }
  const expected = exercise.expected || exercise.answer;
  const correct = exercise.targets.every(target => state.assignments[target.id] === expected[target.id]);
  return correct
    ? { correct: true, code: "correct", message: "Correct — every musical clue is matched." }
    : { correct: false, code: "incorrect", message: "Some matches need another look. You can rearrange them and check again." };
}

export function playMatchingTarget(target, play) {
  if (!target?.midis?.length || typeof play !== "function") return false;
  play(target.midis, target.playbackDurations);
  return true;
}

export function mountMatchingPractice({ container, exercise, notation, play, onResult }) {
  let state = createMatchingState(exercise);
  container.innerHTML = `<div class="matching-practice"><p class="matching-instruction">Drag a term onto each clue, or select a term and then select its clue.</p><div class="matching-labels">${exercise.labels.map(label => `<button type="button" draggable="true" data-match-label="${label.id}" aria-pressed="false">${label.text}</button>`).join("")}</div><div class="matching-targets">${exercise.targets.map(target => `<div class="matching-target-card"><button type="button" data-match-target="${target.id}"><span class="matching-clue">${target.label || "Music clue"}</span><span data-assignment>Choose a term</span><span class="matching-notation" data-target-notation="${target.id}"></span></button>${target.midis?.length ? `<button type="button" class="matching-play" data-play-match="${target.id}" aria-label="Hear ${target.label || "music clue"}">▶ Hear excerpt</button>` : ""}</div>`).join("")}</div><button type="button" class="matching-check" data-check-matches>Check matches</button><p class="matching-status" data-matching-status aria-live="polite"></p></div>`;
  const find = selector => container.querySelector(selector);

  exercise.targets.forEach(target => {
    if (!target.notation) return;
    const notationTarget = find(`[data-target-notation="${target.id}"]`);
    try { notation.render(notationTarget, target.notation, { width: 320 }); } catch { notationTarget.textContent = "Notation unavailable"; }
  });

  function render() {
    container.querySelectorAll("[data-match-label]").forEach(button => {
      button.setAttribute("aria-pressed", String(state.selectedLabel === button.dataset.matchLabel));
      const assigned = Object.values(state.assignments).includes(button.dataset.matchLabel);
      button.dataset.assigned = String(assigned);
      const label = exercise.labels.find(item => item.id === button.dataset.matchLabel);
      button.setAttribute("aria-label", assigned ? `${label.text}, placed` : label.text);
    });
    container.querySelectorAll("[data-match-target]").forEach(button => {
      const labelId = state.assignments[button.dataset.matchTarget];
      const label = exercise.labels.find(item => item.id === labelId);
      button.querySelector("[data-assignment]").textContent = label ? label.text : "Choose a term";
      button.dataset.filled = String(Boolean(label));
    });
  }

  function chooseLabel(labelId) {
    state = { ...state, selectedLabel: state.selectedLabel === labelId ? null : labelId };
    render();
  }
  function chooseTarget(targetId, labelId = state.selectedLabel) {
    if (!labelId) return;
    state = assignMatch(state, labelId, targetId);
    render();
  }

  container.querySelectorAll("[data-match-label]").forEach(button => {
    button.addEventListener("click", () => chooseLabel(button.dataset.matchLabel));
    button.addEventListener("dragstart", event => event.dataTransfer.setData("text/plain", button.dataset.matchLabel));
  });
  container.querySelectorAll("[data-match-target]").forEach(button => {
    button.addEventListener("click", () => chooseTarget(button.dataset.matchTarget));
    button.addEventListener("dragover", event => event.preventDefault());
    button.addEventListener("drop", event => { event.preventDefault(); chooseTarget(button.dataset.matchTarget, event.dataTransfer.getData("text/plain")); });
  });
  container.querySelectorAll("[data-play-match]").forEach(button => {
    button.addEventListener("click", () => playMatchingTarget(exercise.targets.find(target => target.id === button.dataset.playMatch), play));
  });
  find("[data-check-matches]").addEventListener("click", () => {
    const result = checkMatches(state, exercise);
    find("[data-matching-status]").textContent = result.message;
    find("[data-matching-status]").dataset.result = result.code;
    onResult(result);
  });
  render();
  return { getState: () => state, destroy: () => container.replaceChildren() };
}
