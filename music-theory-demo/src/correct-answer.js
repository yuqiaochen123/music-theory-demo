const DURATION_NAMES = Object.freeze({ "1/2": "breve", w: "semibreve", h: "minim", q: "crotchet", 8: "quaver", 16: "semiquaver", 32: "demisemiquaver" });

function pitchLabel(pitch) {
  const match = String(pitch || "").match(/^([a-g])(bb|##|b|#)?\/(\d)$/i);
  if (!match) return String(pitch || "");
  const accidental = { b: "♭", bb: "♭♭", "#": "♯", "##": "♯♯" }[match[2] || ""] || "";
  return `${match[1].toUpperCase()}${accidental}${match[3]}`;
}

function joinFinal(items) {
  if (items.length < 2) return items[0] || "";
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

function describeNotationAnswer(question) {
  const expected = question.expected || question.answer || {};
  const notes = expected.notes || [];
  const durations = expected.durations || question.durations || [];
  const written = notes.map((note, index) => {
    const rawDuration = durations[index] || durations[0] || "";
    return [pitchLabel(note), DURATION_NAMES[String(rawDuration)] || rawDuration].filter(Boolean).join(" ");
  }).join(", ");
  const context = [expected.clef && `${expected.clef} clef`, expected.key].filter(Boolean).join(" · ");
  return [written, context].filter(Boolean).join(" · ") || String(question.answer || "See the completed notation above.");
}

function describeMatchingAnswer(question) {
  const labels = new Map((question.labels || []).map(label => [label.id, label.text || label.label || label.id]));
  const expected = question.expected || question.answer || {};
  return (question.targets || []).map(target => {
    const answerId = expected[target.id];
    return `${target.label || target.title || target.id} — ${labels.get(answerId) || answerId}`;
  }).join("; ");
}

function describeSelectionAnswer(question) {
  const notes = question.notation?.notes || question.notes || [];
  const expected = Array.isArray(question.correctIndices) ? question.correctIndices : (Array.isArray(question.expected) ? question.expected : []);
  const selections = expected.map(index => `${index + 1} (${pitchLabel(notes[index])})`);
  return `Select note${selections.length === 1 ? "" : "s"} ${joinFinal(selections)}`;
}

export function describeCorrectAnswer(question) {
  if (question.interaction === "notation-entry") return describeNotationAnswer(question);
  if (question.interaction === "matching") return describeMatchingAnswer(question);
  if (question.interaction === "score-selection") return describeSelectionAnswer(question);
  return String(question.answer ?? "");
}
