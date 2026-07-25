const LETTER_CLASSES = Object.freeze({c:0,d:2,e:4,f:5,g:7,a:9,b:11});
const ALTERATIONS = Object.freeze({bb:-2,b:-1,"":0,"#":1,"##":2});
const SCALE_PATTERNS = Object.freeze({
  major:[2,2,1,2,2,2,1],
  "major-descending":[1,2,2,2,1,2,2],
  "harmonic-minor":[2,1,2,2,1,3,1],
  "harmonic-minor-descending":[1,3,1,2,2,1,2],
  "melodic-minor-ascending":[2,1,2,2,2,2,1],
  "natural-minor-descending":[2,2,1,2,2,1,2],
  chromatic:[1,1,1,1,1,1,1,1,1,1,1,1],
});

export function pitchToMidi(writtenPitch){
  const match=writtenPitch.match(/^([a-g])(bb|##|b|#)?\/(\d)$/i);
  if(!match)throw new Error(`Invalid written pitch: ${writtenPitch}`);
  const [,letter,accidental="",octave]=match;
  return 12*(Number(octave)+1)+LETTER_CLASSES[letter.toLowerCase()]+ALTERATIONS[accidental];
}

function nameToClass(name){
  const match=name.match(/^([a-g])(bb|##|b|#)?$/i);
  if(!match)throw new Error(`Invalid pitch name: ${name}`);
  return (LETTER_CLASSES[match[1].toLowerCase()]+ALTERATIONS[match[2]||""]+12)%12;
}

function assertWrittenMatchesAudio(notes,midis){
  if(notes.length!==midis.length||notes.some((note,index)=>pitchToMidi(note)!==midis[index])){
    throw new Error("Written notation does not match audio MIDI");
  }
}

export function validateTriad(exercise){
  assertWrittenMatchesAudio(exercise.notes,exercise.midis);
  const root=nameToClass(exercise.root);
  const relative=[...new Set(exercise.midis.map((midi)=>(midi-root+120)%12))].sort((a,b)=>a-b);
  const expected=exercise.quality==="major"?[0,4,7]:exercise.quality==="minor"?[0,3,7]:null;
  if(!expected||relative.join(",")!==expected.join(","))throw new Error("Triad quality does not match its pitches");
  const members=exercise.quality==="major"?[root,(root+4)%12,(root+7)%12]:[root,(root+3)%12,(root+7)%12];
  if(exercise.midis[0]%12!==members[exercise.inversion])throw new Error("Triad inversion does not match its bass note");
  if(exercise.key&&exercise.roman){
    const degreeIndex={I:0,ii:1,IV:3,V:4}[exercise.roman];
    if(degreeIndex===undefined)throw new Error("Unsupported Roman numeral");
    const keyRoot=nameToClass(exercise.key);
    const scale=[0,2,4,5,7,9,11];
    if(root!==(keyRoot+scale[degreeIndex])%12)throw new Error("Roman numeral does not match the key and root");
  }
  return true;
}

export function validateRhythm(exercise){
  const [numerator,denominator]=exercise.meter;
  if(exercise.unit!==denominator)throw new Error("Rhythm unit does not match the time-signature denominator");
  if(exercise.groups.reduce((sum,value)=>sum+value,0)!==numerator)throw new Error("Beat groups do not fill the bar");
  if(exercise.durations.reduce((sum,value)=>sum+value,0)!==numerator)throw new Error("Rhythm durations do not fill the bar");
  return true;
}

export function validateScale(exercise){
  assertWrittenMatchesAudio(exercise.notes,exercise.midis);
  const pattern=SCALE_PATTERNS[exercise.type];
  if(!pattern)throw new Error(`Unsupported scale type: ${exercise.type}`);
  const steps=exercise.midis.slice(1).map((midi,index)=>Math.abs(midi-exercise.midis[index]));
  if(steps.join(",")!==pattern.join(","))throw new Error("Scale pattern does not match its declared type");
  if(exercise.descendingNotes||exercise.descendingMidis||exercise.descendingType){
    if(!exercise.descendingNotes||!exercise.descendingMidis||!exercise.descendingType)throw new Error("Scale descent must include written notes, MIDI values, and a pattern type");
    assertWrittenMatchesAudio(exercise.descendingNotes,exercise.descendingMidis);
    const descendingPattern=SCALE_PATTERNS[exercise.descendingType];
    if(!descendingPattern)throw new Error(`Unsupported descending scale type: ${exercise.descendingType}`);
    const descendingSteps=exercise.descendingMidis.slice(1).map((midi,index)=>Math.abs(midi-exercise.descendingMidis[index]));
    if(descendingSteps.join(",")!==descendingPattern.join(","))throw new Error("Descending scale pattern does not match its declared type");
  }
  return true;
}
