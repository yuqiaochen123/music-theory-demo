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
    const meter = `${specification.meter[0]}/${specification.meter[1]}`;
    const { context, stave } = prepare(element, width, 190, null, meter);
    const notes = specification.events.map((event) => {
      const note = staveNote(event.keys, false, event.duration);
      note.setStemDirection(note.calculateOptimalStemDirection());
      if (event.accent) note.addModifier(new VF.Articulation("a>"), 0);
      return note;
    });
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
      if (items.length > 1 && items.every(({ event }) => event.duration === "8")) {
        beams.push(new VF.Beam(items.map(({ note }) => note)));
      }
    });
    new VF.Formatter().joinVoices([voice]).formatToStave([voice], stave);
    voice.draw(context, stave);
    beams.forEach((beam) => beam.setContext(context).draw());
  }

  function renderScale(element, specification, options = {}) {
    const availableWidth = responsiveWidth(element, options.width || 820);
    const descendingNotes = specification.descendingNotes || [...specification.notes].reverse();
    const width = Math.max(
      scaleEngravingWidth(specification.notes, availableWidth),
      scaleEngravingWidth(descendingNotes, availableWidth),
    );
    requireVexFlow();
    element.replaceChildren();
    const renderer = new VF.Renderer(element, VF.Renderer.Backends.SVG);
    renderer.resize(width, 210);
    const context = renderer.getContext();
    const ascendingStave = new VF.Stave(18, 20, width - 58);
    const descendingStave = new VF.Stave(18, 124, width - 58);
    [ascendingStave, descendingStave].forEach((stave) => {
      stave.addClef("treble");
      if (specification.key && specification.key !== "C") stave.addKeySignature(specification.key);
      stave.setContext(context).draw();
    });
    function drawScalePath(keys, stave) {
      const notes = keys.map((key) => staveNote([key], specification.showAccidentals !== false, "8"));
      const voice = new VF.Voice({ numBeats: notes.length, beatValue: 8 });
      voice.addTickables(notes);
      const beams = VF.Beam.generateBeams(notes);
      new VF.Formatter().joinVoices([voice]).formatToStave([voice], stave);
      voice.draw(context, stave);
      beams.forEach((beam) => beam.setContext(context).draw());
    }
    drawScalePath(specification.notes, ascendingStave);
    drawScalePath(descendingNotes, descendingStave);
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
    } else {
      renderInterval(element, specification.notes, options);
    }
  }

  window.ListeningDeskNotation = { accidentalFor, responsiveWidth, scaleEngravingWidth, render, renderInterval, renderCadence, renderTriad, renderRhythm, renderScale };
})();
