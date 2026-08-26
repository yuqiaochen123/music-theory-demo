import {
  NATURAL_PITCHES, NOTE_DURATIONS, addBars, applyAccidental, canPlaceNote, clearPhrase,
  createEditorState, deleteSelected, durationLabel, noteMidi, pitchLabel, placeAtCursor, rhythmicRests,
  selectNote, setTargetKey, transposePhrase, transposePhraseAtOctave, undo,
} from "./clef-transposition-editor.js?v=20260826-clefhover1";

const DEFAULT_TREBLE_PITCHES = Object.freeze([
  "c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4",
  "c/5", "d/5", "e/5", "f/5", "g/5",
]);

export function yForPitch(pitch, pitchYs = null) {
  if (pitchYs && Number.isFinite(Number(pitchYs[pitch]))) return Number(pitchYs[pitch]);
  const pitchIndex = DEFAULT_TREBLE_PITCHES.indexOf(pitch);
  return pitchIndex < 0 ? null : 122 - (pitchIndex * 60) / 11;
}

export function ledgerLineYsForPitch(noteY, staffLineYs = null) {
  const lines = Array.isArray(staffLineYs)
    ? staffLineYs.map(Number).filter(Number.isFinite).sort((left, right) => left - right)
    : [];
  if (!Number.isFinite(Number(noteY)) || lines.length < 2) return [];
  const top = lines[0];
  const bottom = lines.at(-1);
  const spacing = (bottom - top) / (lines.length - 1);
  if (!(spacing > 0)) return [];
  const ledgers = [];
  if (noteY < top) {
    for (let y = top - spacing; y >= noteY - 0.01; y -= spacing) ledgers.push(y);
  } else if (noteY > bottom) {
    for (let y = bottom + spacing; y <= noteY + 0.01; y += spacing) ledgers.push(y);
  }
  return ledgers;
}

export function pitchFromStaffPoint(clientY, rect, pitchYs = null) {
  const engravingY = ((clientY - rect.top) / rect.height) * 190;
  if (pitchYs) {
    const candidates = Object.entries(pitchYs)
      .map(([pitch, y]) => ({ pitch, y: Number(y) }))
      .filter(({ y }) => Number.isFinite(y));
    if (candidates.length) {
      candidates.sort((left, right) => left.y - right.y);
      const nearest = candidates.reduce((best, candidate) => (
        Math.abs(candidate.y - engravingY) < Math.abs(best.y - engravingY) ? candidate : best
      ));
      const steps = candidates.slice(1).map((candidate, index) => Math.abs(candidate.y - candidates[index].y)).filter(step => step > 0);
      const step = steps.length ? Math.min(...steps) : 5;
      return Math.abs(nearest.y - engravingY) <= step * 0.75 ? nearest.pitch : null;
    }
  }
  if (engravingY < 57 || engravingY > 127) return null;
  return DEFAULT_TREBLE_PITCHES[Math.round(((122 - engravingY) * 11) / 60)] || null;
}

export function selectedIndexFromStaffPoint(clientX, rect, noteCount) {
  const slots = Array.isArray(noteCount) ? noteCount : Array.from({ length: noteCount }, (_, index) => index);
  const clickedSlot = slotFromStaffPoint(clientX, rect);
  return clickedSlot === null ? null : (slots.indexOf(clickedSlot) >= 0 ? slots.indexOf(clickedSlot) : null);
}

export function slotFromStaffPoint(clientX, rect, slotCenters = null) {
  if (Array.isArray(slotCenters) && slotCenters.length > 0) {
    const localX = clientX - rect.left;
    let nearestSlot = null;
    let nearestDistance = Infinity;
    slotCenters.forEach((center, slot) => {
      const distance = Math.abs(localX - center);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestSlot = slot;
      }
    });
    return nearestDistance <= 16 ? nearestSlot : null;
  }
  const engravingX = ((clientX - rect.left) / rect.width) * 800;
  if (engravingX < 150 || engravingX > 750) return null;
  return Math.max(0, Math.min(7, Math.floor(((engravingX - 150) / 600) * 8)));
}

export function scaleSlotCenters(slotCenters, engravingWidth, viewportWidth) {
  if (!Array.isArray(slotCenters) || !Number.isFinite(engravingWidth) || engravingWidth <= 0 || !Number.isFinite(viewportWidth)) return slotCenters;
  const scale = viewportWidth / engravingWidth;
  return slotCenters.map((center) => center * scale);
}

export function previewFromStaffPoint(clientX, clientY, rect, slotCenters = null, occupiedSlots = [], duration = "16", durations = []) {
  const pitch = pitchFromStaffPoint(clientY, rect);
  const slot = slotFromStaffPoint(clientX, rect, slotCenters);
  if (!pitch || slot === null) return null;
  const length = NOTE_DURATIONS[duration] || 1;
  const occupied = new Set();
  occupiedSlots.forEach((start, index) => {
    const occupiedLength = NOTE_DURATIONS[durations[index] || "16"] || 1;
    for (let offset = 0; offset < occupiedLength; offset += 1) occupied.add(start + offset);
  });
  return Array.from({ length }, (_, offset) => slot + offset).every((unit) => !occupied.has(unit)) ? { pitch, slot } : null;
}

export function hoveredNoteIndexFromStaffPoint(clientX, clientY, rect, slotCenters, notes, slots) {
  const engravingY = ((clientY - rect.top) / rect.height) * 190;
  const slot = slotFromStaffPoint(clientX, rect, slotCenters);
  if (engravingY < 50 || engravingY > 136 || slot === null) return null;
  const index = slots.indexOf(slot);
  return index >= 0 && notes[index] ? index : null;
}

export function mountClefTranspositionEditor({ container, notation, play, mode = "key" }) {
  let state = createEditorState([]);
  const grade4Mode = mode === "grade4-clef";
  let sourceClef = "treble";
  let targetClef = "alto";
  let selectedDuration = "q";
  let selectedAccidental = "";
  const find = (selector) => container.querySelector(selector);
  const source = find("[data-editor-source]");
  const destination = find("[data-editor-destination]");
  const keySelect = find("[data-target-key]");
  let sourceClefSelect = null;
  if (grade4Mode) {
    const targetField = keySelect.closest(".editor-field");
    targetField.querySelector("label").textContent = "Target clef";
    targetField.insertAdjacentHTML("beforebegin", '<div class="editor-field"><label>Source clef</label><select data-source-clef><option value="treble">Treble</option><option value="alto">Alto</option><option value="bass">Bass</option></select></div>');
    sourceClefSelect = find("[data-source-clef]");
  }
  const transposeButton = find("[data-transpose]");
  const status = find("[data-editor-status]");
  const count = find("[data-note-count]");
  const noteList = find("[data-note-list]");
  const deleteButton = find("[data-delete-note]");
  const undoButton = find("[data-undo]");
  const clearButton = find("[data-clear]");
  const playButton = find("[data-play-phrase]");
  const playTransposedButton = find("[data-play-transposed]");
  const addBarButton = find("[data-add-bar]");
  const addBarsButton = find("[data-add-bars]");

  function drawStaff(target, notes, slots, durations, key = null, selectedIndex = null, cursorSlot = null, rests = [], clef = "treble") {
    try {
      notation.renderMelody(target, { notes, slots, durations, clef, key, selectedIndex, cursorSlot, rests, barCount: state.barCount }, { width: 820 });
    } catch (error) {
      target.textContent = "Notation is unavailable in this browser.";
    }
  }

  function render() {
    if(grade4Mode){source.closest(".editor-staff").querySelector("h3").textContent=`Source · ${sourceClef[0].toUpperCase()+sourceClef.slice(1)} clef`;destination.closest(".editor-staff").querySelector("h3").textContent=`Target · ${targetClef[0].toUpperCase()+targetClef.slice(1)} clef`}
    drawStaff(source, state.notes, state.slots, state.durations, grade4Mode ? null : "C", state.selectedIndex, state.cursorSlot, rhythmicRests(state),grade4Mode?sourceClef:"treble");
    drawStaff(destination, state.transposedNotes, state.transposedNotes.length ? state.slots : [], state.durations, grade4Mode?null:state.targetKey, null, null,
      state.transposedNotes.length ? rhythmicRests(state) : [],grade4Mode?targetClef:"treble");
    keySelect.value = grade4Mode ? targetClef : state.targetKey;
    if(sourceClefSelect)sourceClefSelect.value=sourceClef;
    status.textContent = state.message;
    count.textContent = `${state.notes.length} notes · ${state.barCount} bars`;
    deleteButton.disabled = state.selectedIndex === null;
    undoButton.disabled = state.history.length === 0;
    clearButton.disabled = state.notes.length === 0;
    playButton.disabled = state.notes.length === 0;
    playTransposedButton.disabled = state.transposedNotes.length === 0;
    transposeButton.disabled = state.notes.length === 0;
    container.querySelectorAll("[data-duration]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.duration === selectedDuration)));
    container.querySelectorAll("[data-accidental]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.accidental === selectedAccidental)));
    noteList.innerHTML = state.notes.map((pitch, index) => (
      `<button type="button" data-select-note="${index}" aria-pressed="${index === state.selectedIndex}">${pitchLabel(pitch)} · ${durationLabel(state.durations[index])}</button>`
    )).join("");
  }

  const update = (nextState) => { state = nextState; render(); };
  const staffHitData = () => {
    const svg = source.querySelector("svg");
    const rect = svg?.getBoundingClientRect() || source.getBoundingClientRect();
    let slotCenters = null;
    try {
      slotCenters = JSON.parse(svg?.dataset.slotCenters || "null");
      const engravingWidth = svg?.viewBox?.baseVal?.width || Number(svg?.getAttribute("width")) || rect.width;
      slotCenters = scaleSlotCenters(slotCenters, engravingWidth, rect.width);
    } catch {}
    let pitchYs = null;
    try { pitchYs = JSON.parse(svg?.dataset.pitchYs || "null"); } catch {}
    return { rect, slotCenters, pitchYs };
  };
  function updatePointerPreview(event) {
    const svg = source.querySelector("svg");
    if (!svg) return;
    const existing = svg.querySelector("[data-editor-pointer-preview]");
    const rect = svg.getBoundingClientRect();
    let pitchYs = null;
    try { pitchYs = JSON.parse(svg.dataset.pitchYs || "null"); } catch {}
    let staffLineYs = null;
    try { staffLineYs = JSON.parse(svg.dataset.staffLineYs || "null"); } catch {}
    const pitch = pitchFromStaffPoint(event.clientY, rect, pitchYs);
    if (!pitch || !canPlaceNote(state, state.cursorSlot, selectedDuration)) {
      existing?.remove();
      return;
    }
    const x = Number(svg.dataset.cursorX);
    if (!Number.isFinite(x)) {
      existing?.remove();
      return;
    }
    const y = yForPitch(pitch, pitchYs);
    const namespace = "http://www.w3.org/2000/svg";
    const preview = existing || document.createElementNS(namespace, "g");
    preview.setAttribute("data-editor-pointer-preview", "");
    preview.setAttribute("pointer-events", "none");
    preview.replaceChildren();
    ledgerLineYsForPitch(y, staffLineYs).forEach((ledgerY) => {
      const ledger = document.createElementNS(namespace, "line");
      ledger.setAttribute("x1", String(x - 11));
      ledger.setAttribute("x2", String(x + 11));
      ledger.setAttribute("y1", String(ledgerY));
      ledger.setAttribute("y2", String(ledgerY));
      ledger.setAttribute("stroke", "#1687d9");
      ledger.setAttribute("stroke-width", "2");
      ledger.setAttribute("stroke-linecap", "round");
      ledger.setAttribute("data-hover-ledger-line", "");
      preview.append(ledger);
    });
    const head = document.createElementNS(namespace, "ellipse");
    head.setAttribute("cx", String(x));
    head.setAttribute("cy", String(y));
    head.setAttribute("rx", "7.5");
    head.setAttribute("ry", "5");
    head.setAttribute("transform", `rotate(-12 ${x} ${y})`);
    head.setAttribute("fill", selectedDuration === "w" ? "white" : "#1687d9");
    head.setAttribute("stroke", "#1687d9");
    head.setAttribute("stroke-width", selectedDuration === "w" ? "2.5" : "1");
    preview.append(head);
    if (selectedDuration !== "w") {
      const stem = document.createElementNS(namespace, "path");
      stem.setAttribute("d", `M ${x + 6.5} ${y} V ${y - 34}`);
      stem.setAttribute("fill", "none");
      stem.setAttribute("stroke", "#1687d9");
      stem.setAttribute("stroke-width", "2");
      preview.append(stem);
      const flagCount = selectedDuration === "16" ? 2 : selectedDuration === "8" ? 1 : 0;
      for (let flag = 0; flag < flagCount; flag += 1) {
        const flagPath = document.createElementNS(namespace, "path");
        const flagY = y - 34 + flag * 9;
        flagPath.setAttribute("d", `M ${x + 6.5} ${flagY} C ${x + 18} ${flagY + 5}, ${x + 18} ${flagY + 16}, ${x + 8} ${flagY + 23}`);
        flagPath.setAttribute("fill", "none");
        flagPath.setAttribute("stroke", "#1687d9");
        flagPath.setAttribute("stroke-width", "3");
        preview.append(flagPath);
      }
    }
    if (!existing) svg.append(preview);
  }
  container.querySelectorAll("[data-duration]").forEach((button) => button.addEventListener("click", () => { selectedDuration = button.dataset.duration; render(); }));
  container.querySelectorAll("[data-accidental]").forEach((button) => button.addEventListener("click", () => { selectedAccidental = button.dataset.accidental; render(); }));
  deleteButton.addEventListener("click", () => update(deleteSelected(state)));
  undoButton.addEventListener("click", () => update(undo(state)));
  clearButton.addEventListener("click", () => update(clearPhrase(state)));
  function syncGrade4Targets(){
    if(!grade4Mode)return;
    const targets=sourceClef==="alto"?["treble","bass"]:["alto"];
    keySelect.innerHTML=targets.map(clef=>`<option value="${clef}">${clef[0].toUpperCase()+clef.slice(1)}</option>`).join("");
    if(!targets.includes(targetClef))targetClef=targets[0];
  }
  sourceClefSelect?.addEventListener("change",()=>{sourceClef=sourceClefSelect.value;syncGrade4Targets();state={...state,transposedNotes:[],message:`Enter a phrase in ${sourceClef} clef, then transpose it at the octave.`};render()});
  keySelect.addEventListener("change", () => {if(grade4Mode){targetClef=keySelect.value;state={...state,transposedNotes:[],message:`Ready to move the phrase from ${sourceClef} to ${targetClef} clef.`};render()}else update(setTargetKey(state,keySelect.value))});
  transposeButton.addEventListener("click", () => update(grade4Mode?transposePhraseAtOctave(state,sourceClef,targetClef):transposePhrase(state)));
  playButton.addEventListener("click", () => play(state.notes.map(noteMidi), 0, 0.28, 0.22));
  playTransposedButton.addEventListener("click", () => play(state.transposedNotes.map(noteMidi), 0, 0.28, 0.22));
  addBarButton.addEventListener("click", () => update(addBars(state, 1)));
  addBarsButton.addEventListener("click", () => {
    const requested = window.prompt("How many more bars would you like to add?", "2");
    if (requested === null) return;
    const count = Number(requested);
    if (Number.isInteger(count) && count > 0 && count <= 32) update(addBars(state, count));
    else update({ ...state, message: "Enter a whole number from 1 to 32." });
  });
  noteList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-select-note]");
    if (button) update(selectNote(state, Number(button.dataset.selectNote)));
  });
  source.addEventListener("pointerdown", (event) => {
    const { rect, pitchYs } = staffHitData();
    const pitch = pitchFromStaffPoint(event.clientY, rect, pitchYs);
    if (pitch && canPlaceNote(state, state.cursorSlot, selectedDuration)) update(placeAtCursor(state, applyAccidental(pitch, selectedAccidental), selectedDuration));
  });
  source.addEventListener("pointermove", updatePointerPreview);
  source.addEventListener("pointerleave", () => source.querySelector("[data-editor-pointer-preview]")?.remove());
  window.addEventListener("keydown", (event) => {
    if (event.key !== "Delete" && event.key !== "Backspace") return;
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
    const deleteIndex = state.selectedIndex;
    if (deleteIndex === null) return;
    event.preventDefault();
    update(deleteSelected(selectNote(state, deleteIndex)));
  });
  window.addEventListener("resize", render);
  container.hidden = false;
  if(grade4Mode){syncGrade4Targets();container.dataset.editorMode="grade4-clef";find("[data-play-transposed]").textContent="▶ Play target";find("[data-transpose]").textContent="Transpose one octave";source.closest(".editor-staff").querySelector("h3").textContent="Source · Treble clef";destination.closest(".editor-staff").querySelector("h3").textContent="Target · Alto clef"}
  render();
  return { getState: () => state };
}
