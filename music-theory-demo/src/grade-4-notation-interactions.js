import { writtenPitchToMidi } from './grade-4-music.js';

const pitchName=pitch=>{
  const match=String(pitch).match(/^([a-g])(bb|##|b|#)?\/(-?\d+)$/i);
  if(!match)return String(pitch);
  const accidental={bb:'♭♭','##':'𝄪',b:'♭','#':'♯','':''}[match[2]||''];
  return `${match[1].toUpperCase()}${accidental}${match[3]}`;
};

export function noteInspectionLabel(note){
  const role=note.function?` · ${note.function}`:'';
  return `${pitchName(note.writtenPitch)} · ${note.clef} clef · sounds MIDI ${note.audioMidi}${role}`;
}

export function groupEquivalentNotes(notes){
  const groups=new Map();
  for(const note of notes){
    if(!groups.has(note.audioMidi))groups.set(note.audioMidi,[]);
    groups.get(note.audioMidi).push(note);
  }
  return groups;
}

function setEquivalentHighlight(midi,active){
  document.querySelectorAll(`[data-equivalent-midi="${midi}"]`).forEach(button=>button.classList.toggle('is-equivalent',active));
}

export function mountGrade4NotationInteractions({container,notes=[],play=()=>{}}={}){
  if(!container||container.querySelector('[data-grade4-inspector]'))return {destroy(){}};
  const normalized=notes.map(note=>({
    clef:note.clef||'treble',writtenPitch:note.writtenPitch,
    audioMidi:note.audioMidi??writtenPitchToMidi(note.writtenPitch),function:note.function
  }));
  if(!normalized.length)return {destroy(){}};
  const inspector=document.createElement('div');
  inspector.className='grade4-note-inspector';
  inspector.dataset.grade4Inspector='';
  const tooltip=document.createElement('p');
  tooltip.className='grade4-note-tooltip';
  tooltip.id=`grade4-note-tooltip-${Math.random().toString(36).slice(2)}`;
  tooltip.textContent='Hover, focus, or tap a note to inspect and hear it.';
  inspector.append(tooltip);
  normalized.forEach(note=>{
    const button=document.createElement('button');
    button.type='button';
    button.className='grade4-note-target';
    button.dataset.equivalentMidi=String(note.audioMidi);
    button.setAttribute('aria-describedby',tooltip.id);
    button.textContent=pitchName(note.writtenPitch);
    const reveal=()=>{tooltip.textContent=noteInspectionLabel(note);setEquivalentHighlight(note.audioMidi,true)};
    const hide=()=>setEquivalentHighlight(note.audioMidi,false);
    button.addEventListener('mouseenter',reveal);
    button.addEventListener('mouseleave',hide);
    button.addEventListener('focus',reveal);
    button.addEventListener('blur',hide);
    button.addEventListener('click',()=>{reveal();play([note.audioMidi],0,0,.5)});
    inspector.append(button);
  });
  container.append(inspector);
  return {destroy(){inspector.remove()}};
}

export function renderClefComparison({container,notes,notation,play}={}){
  if(!container)return {destroy(){}};
  container.innerHTML='<div class="grade4-clef-comparison" role="group" aria-label="Same sounding pitch across treble, alto and bass clefs"></div>';
  const grid=container.firstElementChild;
  notes.forEach((note,index)=>{
    const card=document.createElement('section');
    card.className='grade4-clef-card';
    card.innerHTML=`<h3>${note.clef[0].toUpperCase()+note.clef.slice(1)} clef</h3><div class="grade4-clef-staff" data-clef-staff="${index}"></div>`;
    grid.append(card);
    notation.render(card.querySelector('[data-clef-staff]'),{type:'interval',notes:[note.writtenPitch],clef:note.clef},{width:300});
    mountGrade4NotationInteractions({container:card,notes:[note],play});
  });
  return {destroy(){container.replaceChildren()}};
}
