import { useMemo, useState } from "react";
import { checkAnswer, getInterval } from "./intervals.js";
import { playNotes } from "./audio.js";

export function App() {
  const [selected, setSelected] = useState("major");
  const [quizInterval, setQuizInterval] = useState("major");
  const [answer, setAnswer] = useState(null);
  const interval = getInterval(selected);
  const result = useMemo(
    () => (answer ? checkAnswer(quizInterval, answer) : null),
    [answer, quizInterval],
  );

  const play = (kind) => {
    const notes = interval.notes.map((note) => note.midi);
    if (kind === "lower") playNotes([notes[0]]);
    if (kind === "upper") playNotes([notes[1]]);
    if (kind === "both") playNotes(notes);
    if (kind === "compare") {
      playNotes(getInterval("major").notes.map((note) => note.midi));
      window.setTimeout(
        () => playNotes(getInterval("minor").notes.map((note) => note.midi)),
        1100,
      );
    }
  };

  const newListeningCheck = () => {
    const next = Math.random() > 0.5 ? "major" : "minor";
    setQuizInterval(next);
    setAnswer(null);
    playNotes(getInterval(next).notes.map((note) => note.midi));
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#lesson" aria-label="Listening Desk home">
          Listening Desk <span aria-hidden="true">♪</span>
        </a>
        <nav aria-label="Main navigation">
          <a className="active" href="#lesson">Topics</a>
          <a href="#check">Practice</a>
          <a href="#progress">Progress</a>
        </nav>
      </header>

      <main id="lesson">
        <section className="lesson-heading">
          <div>
            <p className="eyebrow">Grade 5 · Intervals</p>
            <h1>Major third <span>vs.</span> Minor third</h1>
            <p>Listen to the interval, compare the sound, then identify what you hear.</p>
          </div>
          <div className="interval-switch" role="group" aria-label="Choose an interval">
            {['major', 'minor'].map((id) => (
              <button key={id} className={selected === id ? 'selected' : ''} onClick={() => setSelected(id)}>
                <span className="wave" aria-hidden="true">▥</span> {getInterval(id).label}
              </button>
            ))}
          </div>
        </section>

        <section className="notation-panel" aria-label={`${interval.label} notation`}>
          <img src="/assets/staff-major.png" alt="A major third shown on a treble-clef staff" />
          <div className="notation-label"><strong>{interval.notes[0].name}</strong><span>to</span><strong>{interval.notes[1].name}</strong></div>
        </section>

        <section className="playback-grid" aria-label="Playback controls">
          <button className="play-card" onClick={() => play('lower')}>
            <span className="note-mark" aria-hidden="true">1</span><strong>Play note 1</strong><small>Lower note · {interval.notes[0].name}</small>
          </button>
          <button className="play-card" onClick={() => play('upper')}>
            <span className="note-mark" aria-hidden="true">2</span><strong>Play note 2</strong><small>Upper note · {interval.notes[1].name}</small>
          </button>
          <button className="play-card primary" onClick={() => play('both')}>
            <span className="note-mark coral" aria-hidden="true">1+2</span><strong>Play both</strong><small>Hear the interval</small>
          </button>
          <button className="compare-button" onClick={() => play('compare')}>
            <span className="play-dot" aria-hidden="true">▶</span>
            <span><strong>Compare A / B</strong><small>Major, then minor</small></span>
          </button>
        </section>

        <section className="lower-grid">
          <article className="explanation-card">
            <div className="card-title"><span className="info-icon" aria-hidden="true">i</span><h2>What’s the difference?</h2></div>
            <div className="explanation-body">
              <div><p className="mini-label">{interval.label}</p><h3>{interval.character}</h3><p>{interval.explanation}</p></div>
              <div className="semitone-count"><strong>{interval.semitones}</strong><span>semitones</span></div>
            </div>
          </article>

          <article className="quiz-card" id="check">
            <div className="card-title"><span className="question-icon" aria-hidden="true">?</span><div><h2>Which interval did you hear?</h2><p>Listen, then choose one.</p></div></div>
            <button className="listen-button" onClick={newListeningCheck}>▶ Play listening check</button>
            <div className="answer-row">
              {['major', 'minor'].map((id, index) => (
                <button key={id} className={answer === id ? 'chosen' : ''} onClick={() => setAnswer(id)}>
                  <span>{index === 0 ? 'A' : 'B'}</span>{getInterval(id).label}
                </button>
              ))}
            </div>
            {answer && (
              <div className={`feedback ${result ? 'correct' : 'incorrect'}`} role="status">
                <strong>{result ? 'Correct.' : 'Not quite.'}</strong>{' '}
                {result ? `That was a ${getInterval(quizInterval).label.toLowerCase()}.` : 'Replay it and listen to the distance between the notes.'}
              </div>
            )}
          </article>
        </section>
      </main>

      <footer id="progress"><span>Lesson 1 of 8</span><div className="bar"><i /></div><span>Intervals</span></footer>
    </div>
  );
}
