import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const read=(file)=>readFileSync(new URL(`../${file}`,import.meta.url),"utf8");

describe("new topic integration states",()=>{
  it("provides readable notation and audio fallbacks",()=>{
    const pages=read("topic.html")+read("practice.html");
    assert.match(pages,/Notation is unavailable in this browser\./);
    assert.match(pages,/Audio playback is unavailable; you can continue with notation\./);
  });

  it("finishes a ten-question session with a lesson return link",()=>{
    const practice=read("practice.html");
    assert.match(practice,/Session complete\./);
    assert.match(practice,/Return to the lesson/);
    assert.match(practice,/topic\.html\?topic=\$\{topic\}/);
  });

  it("renders semantic concept panels without pretending they are staff notation",()=>{
    const topic=read("topic.html");
    const practice=read("practice.html");
    assert.match(topic,/function conceptMarkup/);
    assert.match(topic,/class="concept-display"/);
    assert.match(practice,/function drawConcept/);
    assert.match(practice,/class="practice-concept"/);
  });
});
