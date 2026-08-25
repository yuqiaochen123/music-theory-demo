export function configureIntervalBackLink({ link, grade, topic, lessonId }) {
  if (!link) return;
  const isIndividualIntervalLesson = Number(grade) === 5 && topic === "intervals" && Boolean(lessonId);
  link.hidden = !isIndividualIntervalLesson;
  if (!isIndividualIntervalLesson) {
    link.removeAttribute("href");
    return;
  }
  link.setAttribute("href", "topic.html?topic=intervals#quick-guide");
  link.setAttribute("aria-label", "Back to all intervals");
}

export function initialIntervalOverviewSlide(slides, hash = "") {
  const availableSlides = Array.from(slides || []);
  if (hash === "#quick-guide") {
    return availableSlides.find((slide) => slide.id === "quick-guide") || availableSlides[0] || null;
  }
  return availableSlides[0] || null;
}
