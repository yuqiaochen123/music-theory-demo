import { bootstrapDailyPractice } from "./daily-practice-ui.js?v=20260826-streak-ready1";
import { installDailyPracticeOverlay } from "./daily-practice-overlay.js?v=20260826-grade-parity1";
import { sharedRegistryFromWindow } from "./shared-practice-registry.js";

const scripts = [
  ["ListeningDeskGrade1Topics", "src/grade-1-topic-data.js"],
  ["ListeningDeskGrade1Practice", "src/grade-1-practice-data.js"],
  ["ListeningDeskGrade2Topics", "src/grade-2-topic-data.js"],
  ["ListeningDeskGrade2Practice", "src/grade-2-practice-data.js"],
  ["ListeningDeskGrade3Topics", "src/grade-3-topic-data.js"],
  ["ListeningDeskGrade3Practice", "src/grade-3-practice-data.js"],
  ["ListeningDeskGrade4Topics", "src/grade-4-topic-data.js"],
  ["ListeningDeskGrade4Practice", "src/grade-4-practice-data.js"],
  ["ListeningDeskTopics", "src/topic-data.js"],
  ["ListeningDeskTopics.rhythm-note-values", "src/remaining-topic-data.js"],
  ["ListeningDeskPractice", "src/practice-data.js"],
  ["ListeningDeskPractice.rhythm-note-values", "src/remaining-practice-data.js"],
];

function loadClassicScript(globalName, src) {
  const present = String(globalName).split(".").reduce((value, key) => value?.[key], window);
  if (present) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
}

async function start() {
  for (const [globalName, src] of scripts) await loadClassicScript(globalName, src);
  window.ListeningDeskSharedPractice = sharedRegistryFromWindow(window);
  bootstrapDailyPractice({ registry: window.ListeningDeskSharedPractice });
  installDailyPracticeOverlay();
}

void start().catch(error => {
  console.error(error);
  bootstrapDailyPractice();
  installDailyPracticeOverlay();
});
