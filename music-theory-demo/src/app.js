import { checkAnswer, getInterval } from "./intervals.js";
import { playNotes } from "./audio.js";

let selected = "major";
let quizInterval = "major";

function notes(id = selected) { return getInterval(id).notes.map((note) => note.midi); }

function renderInterval() {
  const interval = getInterval(selected);
  document.querySelectorAll("[data-interval]").forEach((button) => button.classList.toggle("selected", button.dataset.interval === selected));
  document.querySelector(".notation-panel").setAttribute("aria-label", `${interval.label} notation`);
  document.querySelector(".notation-panel img").alt = `${interval.label} shown on a treble-clef staff`;
  document.querySelector("#lower-name").textContent = interval.notes[0].name;
  document.querySelector("#upper-name").textContent = interval.notes[1].name;
  document.querySelector("#lower-detail").textContent = `Lower note · ${interval.notes[0].name}`;
  document.querySelector("#upper-detail").textContent = `Upper note · ${interval.notes[1].name}`;
  document.querySelector("#interval-label").textContent = interval.label;
  document.querySelector("#character").textContent = interval.character;
  document.querySelector("#explanation").textContent = interval.explanation;
  document.querySelector("#semitones").textContent = interval.semitones;
}

document.querySelectorAll("[data-interval]").forEach((button) => button.addEventListener("click", () => { selected = button.dataset.interval; renderInterval(); }));
document.querySelectorAll("[data-play]").forEach((button) => button.addEventListener("click", () => {
  const kind = button.dataset.play;
  if (kind === "lower") playNotes([notes()[0]]);
  if (kind === "upper") playNotes([notes()[1]]);
  if (kind === "both") playNotes(notes());
  if (kind === "compare") { playNotes(notes("major")); window.setTimeout(() => playNotes(notes("minor")), 1100); }
}));

document.querySelector("#listen-check").addEventListener("click", () => {
  quizInterval = Math.random() > 0.5 ? "major" : "minor";
  document.querySelector("#feedback").hidden = true;
  document.querySelectorAll("[data-answer]").forEach((button) => button.classList.remove("chosen"));
  playNotes(notes(quizInterval));
});

document.querySelectorAll("[data-answer]").forEach((button) => button.addEventListener("click", () => {
  const answer = button.dataset.answer;
  const correct = checkAnswer(quizInterval, answer);
  document.querySelectorAll("[data-answer]").forEach((item) => item.classList.toggle("chosen", item === button));
  const feedback = document.querySelector("#feedback");
  feedback.hidden = false;
  feedback.className = `feedback ${correct ? "correct" : "incorrect"}`;
  feedback.innerHTML = correct ? `<strong>Correct.</strong> That was a ${getInterval(quizInterval).label.toLowerCase()}.` : "<strong>Not quite.</strong> Replay it and listen to the distance between the notes.";
}));

renderInterval();
