(function installPracticeShell(global) {
  function bootstrap({ document, search = global.location?.search ?? "" } = {}) {
    const params = new URLSearchParams(search);
    const grade = params.get("grade") === "4" ? 4 : 5;
    const practice = grade === 4 ? global.ListeningDeskGrade4Practice : global.ListeningDeskPractice;
    if (!document || !practice) return null;
    const requestedTopic = params.get("topic");
    const topic = practice[requestedTopic] ? requestedTopic : grade === 4 ? "rhythm-note-values" : "intervals";
    const gradeQuery = grade === 4 ? "grade=4&" : "";
    const labels = practice[topic];
    const question = labels?.exercises?.[0];
    if (!labels || !question) return null;
    const get = (id) => document.querySelector(`#${id}`);
    document.body.dataset.topic = topic;
    get("page-title").innerHTML = labels.title;
    get("lead").textContent = labels.lead;
    get("question").textContent = question.prompt || labels.question;
    get("play").textContent = labels.playLabel;
    get("lesson-link").href = `topic.html?${gradeQuery}topic=${topic}`;
    const footer = get("footer-label") || get("footer");
    if (footer) footer.textContent = `Grade ${grade} · ${labels.name} practice`;
    const choices = question.choices ? question.choices.map((choice) => [choice, choice]) : labels.answers;
    get("answers").innerHTML = choices.map(([value, text]) => `<button data-answer="${value}">${text}</button>`).join("");
    if (topic === "scales" && global.ListeningDeskNotation) {
      try {
        global.ListeningDeskNotation.render(get("notation"), {
          type: "scale",
          notes: question.notes,
          descendingNotes: question.descendingNotes,
        }, { width: 820 });
      } catch {
        get("notation").textContent = "Loading scale notation…";
      }
    }
    return topic;
  }
  global.ListeningDeskPracticeShell = { bootstrap };
})(window);
