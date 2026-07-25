import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pitchToMidi, validateRhythm, validateScale, validateTriad } from "./music-validation.js";

describe("written pitch validation", () => {
  it("separates note names from accidentals", () => {
    assert.equal(pitchToMidi("b/3"), 59);
    assert.equal(pitchToMidi("bb/3"), 58);
    assert.equal(pitchToMidi("f#/4"), 66);
    assert.throws(() => pitchToMidi("h/4"), /Invalid written pitch/);
  });
});

describe("triad validation", () => {
  it("accepts a correctly spelled first-inversion C-major triad", () => {
    assert.equal(validateTriad({key:"C",roman:"I",quality:"major",inversion:1,notes:["e/4","g/4","c/5"],midis:[64,67,72],root:"c"}), true);
  });
  it("rejects notation that disagrees with audio", () => {
    assert.throws(() => validateTriad({key:"C",roman:"I",quality:"major",inversion:0,notes:["c/4","eb/4","g/4"],midis:[60,64,67],root:"c"}), /notation.*audio/i);
  });
});

describe("rhythm validation", () => {
  it("accepts a complete 5/8 bar grouped 2+3", () => {
    assert.equal(validateRhythm({meter:[5,8],groups:[2,3],durations:[1,1,1,1,1],unit:8}), true);
  });
  it("rejects an underfilled bar", () => {
    assert.throws(() => validateRhythm({meter:[5,8],groups:[2,3],durations:[1,1,1,1],unit:8}), /fill/i);
  });
});

describe("scale validation", () => {
  it("accepts a correctly written and sounded C-major scale", () => {
    assert.equal(validateScale({type:"major",notes:["c/4","d/4","e/4","f/4","g/4","a/4","b/4","c/5"],midis:[60,62,64,65,67,69,71,72]}), true);
  });
  it("rejects a major scale with a flat seventh", () => {
    assert.throws(() => validateScale({type:"major",notes:["c/4","d/4","e/4","f/4","g/4","a/4","bb/4","c/5"],midis:[60,62,64,65,67,69,70,72]}), /pattern/i);
  });
  it("accepts melodic minor with a natural-minor descent", () => {
    assert.equal(validateScale({
      type:"melodic-minor-ascending", notes:["a/3","b/3","c/4","d/4","e/4","f#/4","g#/4","a/4"], midis:[57,59,60,62,64,66,68,69],
      descendingType:"natural-minor-descending", descendingNotes:["a/4","g/4","f/4","e/4","d/4","c/4","b/3","a/3"], descendingMidis:[69,67,65,64,62,60,59,57],
    }), true);
  });
  it("rejects melodic minor that keeps raised notes while descending", () => {
    assert.throws(() => validateScale({
      type:"melodic-minor-ascending", notes:["a/3","b/3","c/4","d/4","e/4","f#/4","g#/4","a/4"], midis:[57,59,60,62,64,66,68,69],
      descendingType:"natural-minor-descending", descendingNotes:["a/4","g#/4","f#/4","e/4","d/4","c/4","b/3","a/3"], descendingMidis:[69,68,66,64,62,60,59,57],
    }), /pattern/i);
  });
  it("accepts conventional flats in chromatic descent", () => {
    assert.equal(validateScale({
      type:"chromatic", notes:["c/4","c#/4","d/4","d#/4","e/4","f/4","f#/4","g/4","g#/4","a/4","bb/4","b/4","c/5"], midis:[60,61,62,63,64,65,66,67,68,69,70,71,72],
      descendingType:"chromatic", descendingNotes:["c/5","b/4","bb/4","a/4","ab/4","g/4","gb/4","f/4","e/4","eb/4","d/4","db/4","c/4"], descendingMidis:[72,71,70,69,68,67,66,65,64,63,62,61,60],
    }), true);
  });
});
