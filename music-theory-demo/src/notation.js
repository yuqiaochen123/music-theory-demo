(function () {
  const VF = window.VexFlow;

  function requireVexFlow() {
    if (!VF) throw new Error("The local VexFlow bundle did not load.");
  }

  function accidentalFor(key) {
    const pitch = key.split("/")[0];
    const match = pitch.match(/^[a-g](bb|##|b|#)?$/i);
    return match?.[1] || null;
  }

  function staveNote(keys, showAccidentals, duration = "q") {
    const note = new VF.StaveNote({ keys, duration });
    if (showAccidentals) {
      keys.forEach((key, index) => {
        const accidental = accidentalFor(key);
        if (accidental) note.addModifier(new VF.Accidental(accidental), index);
      });
    }
    return note;
  }

  function responsiveWidth(element, requestedWidth) {
    const frameWidth = element.clientWidth || requestedWidth;
    return Math.max(1, Math.min(requestedWidth, frameWidth - 48));
  }

  function scaleEngravingWidth(notes, availableWidth) {
    const accidentalCount = notes.filter((key) => accidentalFor(key)).length;
    const minimumWidth = 112 + notes.length * 34 + accidentalCount * 22;
    return Math.max(availableWidth, minimumWidth);
  }

  function prepare(element, width, height, key, timeSignature) {
    requireVexFlow();
    element.replaceChildren();
    const renderer = new VF.Renderer(element, VF.Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();
    const stave = new VF.Stave(18, 42, width - 58);
    stave.addClef("treble");
    if (key && key !== "C") stave.addKeySignature(key);
    if (timeSignature) stave.addTimeSignature(timeSignature);
    stave.setContext(context).draw();
    return { context, stave };
  }

  function renderInterval(element, notes, options = {}) {
    const width = responsiveWidth(element, options.width || 620);
    const { context, stave } = prepare(element, width, 190, null);
    stave.setNoteStartX(width * 0.47);
    const voice = new VF.Voice({ numBeats: 1, beatValue: 4 });
    voice.addTickable(staveNote(notes, true));
    new VF.Formatter().joinVoices([voice]).format([voice], 80);
    voice.draw(context, stave);
  }

  function renderCadence(element, key, chords, options = {}) {
    const width = responsiveWidth(element, options.width || 680);
    const { context, stave } = prepare(element, width, 210, key);
    stave.setNoteStartX(width * 0.34);
    const voice = new VF.Voice({ numBeats: 2, beatValue: 4 });
    voice.addTickables(chords.map((keys) => staveNote(keys, false)));
    new VF.Formatter().joinVoices([voice]).format([voice], width * 0.42);
    voice.draw(context, stave);
  }

  function renderTriad(element, specification, options = {}) {
    const width = responsiveWidth(element, options.width || 620);
    const { context, stave } = prepare(element, width, 190, specification.key || null);
    stave.setNoteStartX(width * 0.47);
    const voice = new VF.Voice({ numBeats: 1, beatValue: 4 });
    voice.addTickable(staveNote(specification.notes, specification.showAccidentals !== false));
    new VF.Formatter().joinVoices([voice]).format([voice], 90);
    voice.draw(context, stave);
  }

  function renderRhythm(element, specification, options = {}) {
    const width = responsiveWidth(element, options.width || 760);
    const meter = specification.showTimeSignature === false ? null : `${specification.meter[0]}/${specification.meter[1]}`;
    const { context, stave } = prepare(element, width, 190, null, meter);
    function addDotToAll(note, count) {
      for (let index = 0; index < (count || 0); index += 1) note.addModifier(new VF.Dot(), 0);
      return note;
    }
    const notes = specification.events.map((event) => {
      const dottedDuration = `${event.duration}${"d".repeat(event.dots || 0)}`;
      const duration = event.rest ? `${dottedDuration}r` : dottedDuration;
      const note = staveNote(event.rest ? ["b/4"] : event.keys, false, duration);
      if (!event.rest) note.setStemDirection(note.calculateOptimalStemDirection());
      addDotToAll(note, event.dots);
      if (event.accent) note.addModifier(new VF.Articulation("a>"), 0);
      if (event.staccato) note.addModifier(new VF.Articulation("a."), 0);
      return note;
    });
    const tupletEvents = specification.events.map((event, index) => ({ event, note: notes[index] })).filter(({ event }) => event.tuplet);
    const tuplets = tupletEvents.length > 1 ? [new VF.Tuplet(tupletEvents.map(({ note }) => note), { num_notes: 3, notes_occupied: 2 })] : [];
    const voice = new VF.Voice({ numBeats: specification.meter[0], beatValue: specification.meter[1] });
    voice.addTickables(notes);
    const grouped = new Map();
    specification.events.forEach((event, index) => {
      const group = event.group || 0;
      if (!grouped.has(group)) grouped.set(group, []);
      grouped.get(group).push({ note: notes[index], event });
    });
    const beams = [];
    grouped.forEach((items) => {
      if (items.length > 1 && items.every(({ event }) => event.duration === "8" && !event.rest)) {
        beams.push(new VF.Beam(items.map(({ note }) => note)));
      }
    });
    const ties = specification.events.flatMap((event, index) => event.tieToNext && notes[index + 1] ? [new VF.StaveTie({ firstNote: notes[index], lastNote: notes[index + 1], firstIndexes: [0], lastIndexes: [0] })] : []);
    new VF.Formatter().joinVoices([voice]).formatToStave([voice], stave);
    voice.draw(context, stave);
    beams.forEach((beam) => beam.setContext(context).draw());
    tuplets.forEach((tuplet) => tuplet.setContext(context).draw());
    ties.forEach((tie) => tie.setContext(context).draw());
    attachRhythmHoverLabels(element, notes, specification.events);
  }

  function attachRhythmHoverLabels(element, notes, events) {
    element.querySelectorAll(".rhythm-note-tooltip").forEach((tooltip) => tooltip.remove());
    const tooltip = document.createElement("div");
    tooltip.className = "rhythm-note-tooltip";
    tooltip.setAttribute("role", "tooltip");
    tooltip.hidden = true;
    element.append(tooltip);
    let timers = [];
    let cursor = null;
    let hasPlayed = false;
    let demoVisible = false;

    function show(noteElement, note, label) {
      const frame = element.getBoundingClientRect();
      const svg = noteElement.ownerSVGElement;
      const svgBox = svg?.getBoundingClientRect();
      const viewBox = svg?.viewBox?.baseVal;
      const scaleX = svgBox && viewBox?.width ? svgBox.width / viewBox.width : 1;
      const scaleY = svgBox && viewBox?.height ? svgBox.height / viewBox.height : 1;
      const noteBox = noteElement.getBoundingClientRect();
      const engravedX = note.getAbsoluteX?.();
      const engravedY = note.getYs?.()?.[0];
      tooltip.textContent = label;
      tooltip.hidden = false;
      tooltip.style.left = `${svgBox && Number.isFinite(engravedX) ? svgBox.left - frame.left + engravedX * scaleX : noteBox.left - frame.left + noteBox.width / 2}px`;
      tooltip.style.top = `${svgBox && Number.isFinite(engravedY) ? svgBox.top - frame.top + engravedY * scaleY : noteBox.top - frame.top}px`;
    }

    function hide() {
      tooltip.hidden = true;
    }

    function clearTimers() {
      timers.forEach((timer) => clearTimeout(timer));
      timers = [];
    }

    function cancel() {
      clearTimers();
      cursor?.remove();
      cursor = null;
      if (demoVisible) hide();
      demoVisible = false;
    }

    const targets = [];

    events.forEach((event, index) => {
      if (!event.hoverLabel) return;
      const noteElement = notes[index].getSVGElement?.();
      if (!noteElement) return;
      noteElement.classList.add("rhythm-hover-note");
      noteElement.setAttribute("tabindex", "0");
      noteElement.setAttribute("role", "img");
      noteElement.setAttribute("aria-label", event.hoverLabel);
      targets.push({ event, note: notes[index], noteElement });
      noteElement.addEventListener("mouseenter", () => { cancel(); show(noteElement, notes[index], event.hoverLabel); });
      noteElement.addEventListener("mouseleave", hide);
      noteElement.addEventListener("focus", () => { cancel(); show(noteElement, notes[index], event.hoverLabel); });
      noteElement.addEventListener("blur", hide);
    });

    function play() {
      if (hasPlayed || !targets.length) return;
      hasPlayed = true;
      const target = targets.find(({ event }) => event.demoTarget) || targets[0];
      const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      const reveal = () => {
        demoVisible = true;
        show(target.noteElement, target.note, target.event.hoverLabel);
      };
      if (reducedMotion) {
        reveal();
        timers.push(setTimeout(cancel, 1050));
        return;
      }
      const frame = element.getBoundingClientRect();
      const symbol = target.noteElement.getBoundingClientRect();
      cursor = document.createElement("span");
      cursor.className = "rhythm-demo-cursor";
      cursor.setAttribute("aria-hidden", "true");
      cursor.style.left = `${symbol.left - frame.left + symbol.width / 2}px`;
      cursor.style.top = `${symbol.top - frame.top + symbol.height / 2}px`;
      element.append(cursor);
      requestAnimationFrame(() => cursor?.classList.add("is-arriving"));
      timers.push(setTimeout(reveal, 480));
      timers.push(setTimeout(() => cursor?.classList.add("is-leaving"), 1350));
      timers.push(setTimeout(cancel, 1700));
    }

    ["pointerdown", "touchstart", "keydown"].forEach((type) => element.addEventListener(type, cancel, { passive: type !== "keydown" }));
    element.rhythmInteractionDemo = { play, cancel };
  }

  function renderScale(element, specification, options = {}) {
    const requestedWidth = options.width || 820;
    const responsiveScaleWidth = responsiveWidth(element, requestedWidth);
    const availableWidth = specification.degreeLabels
      ? Math.max(responsiveScaleWidth, requestedWidth)
      : responsiveScaleWidth;
    const descendingNotes = specification.descendingNotes || [...specification.notes].reverse();
    const singleDirection = specification.singleDirection === true;
    const width = Math.max(
      scaleEngravingWidth(specification.notes, availableWidth),
      scaleEngravingWidth(descendingNotes, availableWidth),
    );
    requireVexFlow();
    element.replaceChildren();
    const renderer = new VF.Renderer(element, VF.Renderer.Backends.SVG);
    renderer.resize(width, singleDirection ? 170 : 320);
    const context = renderer.getContext();
    // Labelled scale rows are horizontally scrollable, so place the clef near
    // the real left edge and let their containing viewport own the overflow.
    const leftInset = specification.degreeLabels ? 28 : 18;
    const ascendingY = singleDirection ? 20 : 26;
    const ascendingStave = new VF.Stave(leftInset, ascendingY, width - leftInset - 40);
    const descendingStave = singleDirection
      ? null
      : new VF.Stave(leftInset, 130, width - leftInset - 40);
    [ascendingStave, descendingStave].filter(Boolean).forEach((stave) => {
      stave.addClef("treble");
      if (specification.key && specification.key !== "C") stave.addKeySignature(specification.key);
      stave.setContext(context).draw();
    });
    function drawScalePath(keys, stave, labels) {
      const notes = keys.map((key, index) => {
        const note = staveNote([key], specification.showAccidentals !== false, "8");
        return note;
      });
      const voice = new VF.Voice({ numBeats: notes.length, beatValue: 8 });
      voice.addTickables(notes);
      const beams = VF.Beam.generateBeams(notes);
      new VF.Formatter().joinVoices([voice]).formatToStave([voice], stave);
      voice.draw(context, stave);
      beams.forEach((beam) => beam.setContext(context).draw());
      if (labels?.length === notes.length) {
        context.save();
        context.setFont("Arial, sans-serif", 11, 700);
        context.setFillStyle("#344567");
        labels.forEach((label, index) => {
          const labelWidth = context.measureText(label).width;
          context.fillText(label, notes[index].getAbsoluteX() - labelWidth / 2, 148);
        });
        context.restore();
      }
    }
    drawScalePath(specification.notes, ascendingStave, specification.degreeLabels);
    if (descendingStave) drawScalePath(descendingNotes, descendingStave);
  }

  function renderKeySignature(element, specification, options = {}) {
    const width = responsiveWidth(element, options.width || 300);
    prepare(element, width, 160, specification.key || "C");
  }

  function renderMelody(element, specification, options = {}) {
    const barCount = specification.barCount || 2;
    const requestedWidth = Math.max(options.width || 820, 110 + barCount * 355);
    const width = barCount > 2 ? requestedWidth : responsiveWidth(element, requestedWidth);
    const totalSlots = barCount * 16;
    const durationUnits = { w: 16, q: 4, "8": 2, "16": 1 };
    requireVexFlow();
    element.replaceChildren();
    const renderer = new VF.Renderer(element, VF.Renderer.Backends.SVG);
    renderer.resize(width, 190);
    const context = renderer.getContext();
    const stave = new VF.Stave(18, 32, width - 58);
    stave.addClef(specification.clef);
    if (specification.key && specification.key !== "C") stave.addKeySignature(specification.key);
    stave.addTimeSignature("4/4");
    stave.setContext(context).draw();
    const pitchBySlot = new Map(specification.slots.map((slot, index) => [slot, {
      pitch: specification.notes[index], duration: specification.durations?.[index] || "q", index, slot,
    }]));
    const restsBySlot = new Map((specification.rests || []).map((rest) => [rest.slot, rest]));
    const tickables = [];
    const gridTickables = [];
    const shortNotesByBeat = new Map();
    let cursorTickable = null;
    for (let slot = 0; slot < totalSlots;) {
      const placement = pitchBySlot.get(slot);
      if (placement) {
        const note = staveNote([placement.pitch], true, placement.duration);
        if (placement.index === specification.selectedIndex) note.setKeyStyle(0, { fillStyle: "#1687d9", strokeStyle: "#1687d9" });
        tickables.push(note);
        if (["8", "16"].includes(placement.duration)) {
          const beat = Math.floor(placement.slot / 4);
          if (!shortNotesByBeat.has(beat)) shortNotesByBeat.set(beat, []);
          shortNotesByBeat.get(beat).push({ note, slot: placement.slot, duration: placement.duration });
        }
        slot += durationUnits[placement.duration] || 4;
      } else if (restsBySlot.has(slot)) {
        const placement = restsBySlot.get(slot);
        const rest = new VF.StaveNote({ clef: specification.clef, keys: ["b/4"], duration: placement.duration === "w" ? "wr" : `${placement.duration}r` });
        if (placement.slot === specification.cursorSlot) {
          rest.setStyle({ fillStyle: "#1687d9", strokeStyle: "#1687d9" });
          cursorTickable = rest;
        }
        tickables.push(rest);
        slot += durationUnits[placement.duration] || 1;
      } else {
        tickables.push(new VF.GhostNote({ duration: "16" }));
        slot += 1;
      }
      if (slot % 16 === 0 && slot < totalSlots) tickables.push(new VF.BarNote(VF.BarlineType.SINGLE));
    }
    for (let slot = 0; slot < totalSlots; slot += 1) gridTickables.push(new VF.GhostNote({ duration: "16" }));
    const voice = new VF.Voice({ numBeats: barCount * 4, beatValue: 4 });
    const gridVoice = new VF.Voice({ numBeats: barCount * 4, beatValue: 4 });
    voice.addTickables(tickables);
    gridVoice.addTickables(gridTickables);
    const beams = [];
    shortNotesByBeat.forEach((items) => {
      items.sort((left, right) => left.slot - right.slot);
      let group = [];
      let groupEnd = null;
      const finishGroup = () => {
        if (group.length > 1) beams.push(new VF.Beam(group.map(({ note }) => note)));
        group = [];
      };
      items.forEach((item) => {
        const isContiguous = item.slot === groupEnd;
        if (groupEnd !== null && !isContiguous) finishGroup();
        group.push(item);
        groupEnd = item.slot + durationUnits[item.duration];
      });
      finishGroup();
    });
    // Format the engraved voice independently. Joining the invisible grid voice
    // can make VexFlow treat simultaneous tick contexts as a chord, collapsing
    // the melody onto one x-position in some browsers.
    new VF.Formatter().joinVoices([voice]).formatToStave([voice], stave);
    new VF.Formatter().joinVoices([gridVoice]).formatToStave([gridVoice], stave);
    voice.draw(context, stave);
    beams.forEach((beam) => beam.setContext(context).draw());
    const svg = element.querySelector("svg");
    svg.dataset.slotCenters = JSON.stringify(gridTickables.map((tickable) => tickable.getAbsoluteX()));
    const editorPitches = ["c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4", "c/5", "d/5", "e/5", "f/5", "g/5"];
    svg.dataset.pitchYs = JSON.stringify(Object.fromEntries(editorPitches.map((pitch) => {
      const probe = new VF.StaveNote({ clef: specification.clef, keys: [pitch], duration: "q" });
      probe.setStave(stave);
      return [pitch, probe.getYs()[0]];
    })));
    if (cursorTickable) svg.dataset.cursorX = String(cursorTickable.getAbsoluteX());
  }

  function render(element, specification, options) {
    if (specification.type === "cadence") {
      renderCadence(element, specification.key || "C", specification.chords, options);
    } else if (specification.type === "triad") {
      renderTriad(element, specification, options);
    } else if (specification.type === "rhythm") {
      renderRhythm(element, specification, options);
    } else if (specification.type === "scale") {
      renderScale(element, specification, options);
    } else if (specification.type === "key-signature") {
      renderKeySignature(element, specification, options);
    } else if (specification.type === "melody") {
      renderMelody(element, specification, options);
    } else {
      renderInterval(element, specification.notes, options);
    }
  }

  window.ListeningDeskNotation = { accidentalFor, responsiveWidth, scaleEngravingWidth, render, renderInterval, renderCadence, renderTriad, renderRhythm, renderScale, renderKeySignature, renderMelody };
})();
