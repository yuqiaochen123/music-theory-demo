import { noteMidi, pitchLabel } from "./clef-transposition-editor.js";

export function createScoreSelectionState() { return { selected: new Set() }; }
export function toggleScoreSelection(state, index) {
  const selected = new Set(state.selected);
  selected.has(index) ? selected.delete(index) : selected.add(index);
  return { ...state, selected };
}
export function checkScoreSelection(state, exercise) {
  const expected = new Set(exercise.correctIndices || []);
  const correct = state.selected.size === expected.size && [...expected].every(index => state.selected.has(index));
  return { correct, code: correct ? "correct" : "incorrect", message: correct ? (exercise.successMessage || "Exactly right — every relevant note is selected.") : (exercise.retryMessage || "Not quite. Inspect and listen again, then change your selection and retry.") };
}
export function mountScoreSelectionPractice({ container, exercise, notation, play, onResult }) {
  let state = createScoreSelectionState();
  container.innerHTML = `<div class="score-selection-practice"><p class="notation-instruction">${exercise.instruction || exercise.prompt}</p><div class="score-selection-score" data-selection-score></div><div class="score-selection-actions"><button type="button" data-play-selection>▶ Hear score</button><button type="button" class="notation-check" data-check-selection>Check answer</button></div><p class="notation-status" data-selection-status aria-live="polite">Select directly on the score. You can change any selection before or after checking.</p></div>`;
  const score = container.querySelector("[data-selection-score]");
  const status = container.querySelector("[data-selection-status]");
  function paintNotehead(notehead, color) {
    if (!notehead) return;
    notehead.querySelectorAll("text, path").forEach(glyph => {
      glyph.style.setProperty("fill", color || "", color ? "important" : "");
      glyph.style.setProperty("stroke", color || "", color ? "important" : "");
    });
  }
  function refreshSelectionUi() {
    score.querySelectorAll("[data-score-note]").forEach(button => {
      const index = Number(button.dataset.scoreNote);
      button.setAttribute("aria-pressed", String(state.selected.has(index)));
    });
    score.querySelectorAll("[data-engraved-note]").forEach(notehead => {
      const selected = state.selected.has(Number(notehead.dataset.engravedNote));
      notehead.classList.toggle("is-score-selected", selected);
      paintNotehead(notehead, selected ? "#1687d9" : "");
    });
    const selectedNumbers = [...state.selected].sort((a, b) => a - b).map(index => index + 1);
    status.textContent = selectedNumbers.length
      ? `Selected notes: ${selectedNumbers.join(", ")}. Select another note or check your answer.`
      : "No notes selected. Select directly on the score.";
    delete status.dataset.result;
  }
  function positionTargets() {
    score.querySelectorAll("[data-score-note]").forEach(node => node.remove());
    const svg = score.querySelector("svg");
    if (!svg) return;
    let positions = [];
    try { positions = JSON.parse(svg.dataset.notePositions || "[]"); } catch {}
    const viewBox = svg.viewBox.baseVal;
    positions.forEach(({ index, x, y }) => {
      const engravedNotehead = svg.querySelector(`[data-engraved-note="${index}"]`);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "score-note-target";
      button.dataset.scoreNote = String(index);
      button.setAttribute("aria-label", `Note ${index + 1}, ${pitchLabel(exercise.notation.notes[index])}`);
      button.setAttribute("aria-pressed", String(state.selected.has(index)));
      if (engravedNotehead) {
        const scoreBounds = score.getBoundingClientRect();
        const noteBounds = engravedNotehead.getBoundingClientRect();
        button.style.left = `${noteBounds.left + noteBounds.width / 2 - scoreBounds.left}px`;
        button.style.top = `${noteBounds.top + noteBounds.height / 2 - scoreBounds.top}px`;
      } else {
        button.style.left = `${(x - viewBox.x) / viewBox.width * 100}%`;
        button.style.top = `${(y - viewBox.y) / viewBox.height * 100}%`;
      }
      const setHover = hovered => {
        const notehead = score.querySelector(`[data-engraved-note="${index}"]`);
        if (!notehead) return;
        const showHover = hovered && !state.selected.has(index);
        notehead.classList.toggle("is-score-hovered", showHover);
        paintNotehead(notehead, state.selected.has(index) ? "#1687d9" : showHover ? "#69bff2" : "");
      };
      button.addEventListener("pointerenter", () => setHover(true));
      button.addEventListener("pointerleave", () => setHover(false));
      button.addEventListener("mouseenter", () => setHover(true));
      button.addEventListener("mouseleave", () => setHover(false));
      button.addEventListener("focus", () => setHover(true));
      button.addEventListener("blur", () => setHover(false));
      const activateNote = event => {
        event.preventDefault();
        event.stopPropagation();
        state = toggleScoreSelection(state, index);
        setHover(false);
        refreshSelectionUi();
      };
      button.addEventListener("pointerdown", activateNote);
      button.addEventListener("click", event => {
        if (event.detail !== 0) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        activateNote(event);
      });
      score.append(button);
    });
  }
  function draw() {
    notation.renderMelody(score, exercise.notation, { width: 820 });
    positionTargets();
    refreshSelectionUi();
  }
  container.querySelector("[data-play-selection]").addEventListener("click", () => play(exercise.notation.notes.map(noteMidi), 0, 0.28, 0.22));
  container.querySelector("[data-check-selection]").addEventListener("click", () => { const result = checkScoreSelection(state, exercise); status.textContent = result.message; status.dataset.result = result.code; onResult(result); });
  window.addEventListener("resize", positionTargets);
  draw();
  return { destroy() { window.removeEventListener("resize", positionTargets); container.replaceChildren(); } };
}
