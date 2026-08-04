import {
  NATURAL_PITCHES, addNote, applyAccidental, clearPhrase, createEditorState,
  deleteSelected, noteMidi, placeAtCursor, rhythmicRests, selectNote, undo,
} from "./clef-transposition-editor.js";
import { pitchFromStaffPoint } from "./clef-transposition-editor-ui.js";
import { validateNotationAnswer } from "./notation-answer.js";

export function createNotationPracticeState(exercise) {
  const expected = exercise.expected || exercise.answer;
  return {
    source: { ...exercise.source, notes: [...exercise.source.notes] },
    editor: { ...createEditorState([]), barCount: expected.barCount || exercise.source.barCount || 1 },
    duration: "q",
    accidental: "",
  };
}

export function checkNotationPractice(state, exercise) {
  return validateNotationAnswer(state.editor, exercise.expected || exercise.answer);
}

function pitchLabel(pitch) {
  return pitch.replace("/", "").replace("bb", "♭♭").replace("##", "♯♯").replace("b", "♭").replace("#", "♯").toUpperCase();
}

export function mountNotationPractice({ container, exercise, notation, play, onResult }) {
  let state = createNotationPracticeState(exercise);
  container.innerHTML = `
    <div class="notation-practice">
      <p class="notation-instruction">${exercise.instruction}</p>
      <section class="notation-score"><div class="notation-score__heading"><strong>Source · ${exercise.source.key || "C major"}</strong><button type="button" data-play-source>▶ Play source</button></div><div data-source-staff></div></section>
      <div class="notation-toolbar" aria-label="Notation entry tools">
        <div class="notation-tool-group" aria-label="Note value">
          <button type="button" data-duration="q" aria-label="Crotchet">♩</button><button type="button" data-duration="8" aria-label="Quaver">♪</button><button type="button" data-duration="16" aria-label="Semiquaver">♬</button>
        </div>
        <div class="notation-tool-group" aria-label="Accidental">
          <button type="button" data-accidental="" aria-label="Natural">♮</button><button type="button" data-accidental="#" aria-label="Sharp">♯</button><button type="button" data-accidental="b" aria-label="Flat">♭</button>
        </div>
        <label class="notation-pitch-fallback">Pitch <select data-pitch>${NATURAL_PITCHES.map(pitch => `<option value="${pitch}">${pitchLabel(pitch)}</option>`).join("")}</select></label>
        <button type="button" data-add-note>Add note</button>
        <button type="button" data-delete-note>Delete note</button><button type="button" data-undo>Undo</button><button type="button" data-clear>Clear</button>
      </div>
      <section class="notation-score notation-score--answer"><div class="notation-score__heading"><strong>Your answer · ${(exercise.expected || exercise.answer).key || "destination staff"}</strong><span>Click a staff height to enter the next note.</span></div><div data-answer-staff></div></section>
      <div class="notation-practice__actions"><button type="button" data-play-answer>▶ Play your answer</button><button type="button" class="notation-check" data-check-answer>Check answer</button></div>
      <p class="notation-status" data-notation-status aria-live="polite">Write the complete answer on the staff, then check it.</p>
      <div class="notation-note-list" data-note-list aria-label="Entered notes"></div>
    </div>`;

  const find = selector => container.querySelector(selector);
  const sourceStaff = find("[data-source-staff]");
  const answerStaff = find("[data-answer-staff]");
  const status = find("[data-notation-status]");
  const noteList = find("[data-note-list]");

  function draw() {
    notation.renderMelody(sourceStaff, { ...state.source, clef: state.source.clef || "treble", rests: [] }, { width: 820 });
    notation.renderMelody(answerStaff, {
      notes: state.editor.notes, slots: state.editor.slots, durations: state.editor.durations,
      clef: (exercise.expected || exercise.answer).clef || "treble", key: (exercise.expected || exercise.answer).key,
      rests: rhythmicRests(state.editor), barCount: state.editor.barCount,
      cursorSlot: state.editor.cursorSlot, selectedIndex: state.editor.selectedIndex,
    }, { width: 820 });
    container.querySelectorAll("[data-duration]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.duration === state.duration)));
    container.querySelectorAll("[data-accidental]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.accidental === state.accidental)));
    find("[data-play-answer]").disabled = state.editor.notes.length === 0;
    find("[data-delete-note]").disabled = state.editor.selectedIndex === null;
    find("[data-undo]").disabled = state.editor.history.length === 0;
    find("[data-clear]").disabled = state.editor.notes.length === 0;
    noteList.innerHTML = state.editor.notes.map((pitch, index) => `<button type="button" data-note-index="${index}" aria-pressed="${index === state.editor.selectedIndex}">${pitchLabel(pitch)}</button>`).join("");
  }

  function update(editor, message = editor.message) {
    state = { ...state, editor };
    status.textContent = message;
    draw();
  }

  container.querySelectorAll("[data-duration]").forEach(button => button.addEventListener("click", () => { state = { ...state, duration: button.dataset.duration }; draw(); }));
  container.querySelectorAll("[data-accidental]").forEach(button => button.addEventListener("click", () => { state = { ...state, accidental: button.dataset.accidental }; draw(); }));
  find("[data-add-note]").addEventListener("click", () => update(addNote(state.editor, applyAccidental(find("[data-pitch]").value, state.accidental), state.duration)));
  find("[data-delete-note]").addEventListener("click", () => update(deleteSelected(state.editor)));
  find("[data-undo]").addEventListener("click", () => update(undo(state.editor)));
  find("[data-clear]").addEventListener("click", () => update(clearPhrase(state.editor)));
  find("[data-play-source]").addEventListener("click", () => play(state.source.notes.map(noteMidi), 0, 0.28, 0.22));
  find("[data-play-answer]").addEventListener("click", () => play(state.editor.notes.map(noteMidi), 0, 0.28, 0.22));
  find("[data-check-answer]").addEventListener("click", () => {
    const result = checkNotationPractice(state, exercise);
    status.textContent = result.message;
    status.dataset.result = result.code;
    onResult(result);
  });
  noteList.addEventListener("click", event => {
    const button = event.target.closest("[data-note-index]");
    if (button) update(selectNote(state.editor, Number(button.dataset.noteIndex)));
  });
  answerStaff.addEventListener("pointerdown", event => {
    const svg = answerStaff.querySelector("svg");
    const rect = svg?.getBoundingClientRect() || answerStaff.getBoundingClientRect();
    let pitchYs = null;
    try { pitchYs = JSON.parse(svg?.dataset.pitchYs || "null"); } catch {}
    const pitch = pitchFromStaffPoint(event.clientY, rect, pitchYs);
    if (pitch) update(placeAtCursor(state.editor, applyAccidental(pitch, state.accidental), state.duration));
  });
  draw();
  return { getState: () => state, destroy: () => container.replaceChildren() };
}
