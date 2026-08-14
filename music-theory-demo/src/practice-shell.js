(function installPracticeShell(global) {
  function bootstrap({ document, search = global.location?.search ?? "" } = {}) {
    const practice = global.ListeningDeskPractice;
    if (!document || !practice) return null;
    const requestedTopic = new URLSearchParams(search).get("topic");
    const topic = practice[requestedTopic] ? requestedTopic : "intervals";
    const labels = practice[topic];
    const question = labels?.exercises?.[0];
    if (!labels || !question) return null;
    const get = (id) => document.querySelector(`#${id}`);
    document.body.dataset.topic = topic;
    get("page-title").innerHTML = labels.title;
    get("lead").textContent = labels.lead;
    get("question").textContent = question.prompt || labels.question;
    get("play").textContent = labels.playLabel;
    get("lesson-link").href = `topic.html?topic=${topic}`;
    const footer = get("footer-label") || get("footer");
    if (footer) footer.textContent = `Grade 5 · ${labels.name} practice`;
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
