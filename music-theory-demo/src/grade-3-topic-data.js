(function(){
  const q=(keys,duration='q',extra={})=>({keys,duration,...extra});
  const rest=(duration='q')=>({rest:true,duration});
  const rhythm=(events,meter)=>({type:'rhythm',events,meter});
  const notes=(written,clef='treble')=>({type:'interval',notes:written,clef});
  const scale=(key,written,descendingNotes=[])=>({type:'scale',key,notes:written,descendingNotes});
  const triad=(key,written)=>({type:'triad',key,notes:written});
  const ex=(label,rule,notation,explanation,midis)=>({label,rule,notation,explanation,audioType:notation.type==='rhythm'?'rhythm':'sequence',parts:[['Hear the example',midis],['Hear the first note',midis.slice(0,1)]]});
  const topic=(name,title,subtitle,intro,syllabus,examples)=>({name,title,subtitle,intro,syllabus,examples});
  window.ListeningDeskGrade3Topics=Object.freeze({
    'compound-time':topic('Compound time','Feel the beat in threes.','6/8, 9/8 and 12/8, with demisemiquavers.','In compound time, three equal subdivisions make one beat. Let the beams show those beats.','Compound duple, triple and quadruple time; correct grouping; demisemiquavers and rests.',[
      ex('6/8 grouping','Six quavers make two groups of three.',rhythm([0,1,2,3,4,5].map(i=>q([['c','d','e'][i%3]+'/5'],'8',{group:Math.floor(i/3)+1})),[6,8]),'Two groups of three quavers show two dotted-crotchet beats.',[60,62,64,60,62,64]),
      ex('9/8 grouping','Nine quavers make three groups of three.',rhythm(Array.from({length:9},(_,i)=>q([['c','d','e'][i%3]+'/5'],'8',{group:Math.floor(i/3)+1})),[9,8]),'Three groups of three quavers show compound triple time.',[60,62,64,60,62,64,60,62,64]),
      ex('12/8 grouping','Twelve quavers make four groups of three.',rhythm(Array.from({length:12},(_,i)=>q([['c','d','e'][i%3]+'/5'],'8',{group:Math.floor(i/3)+1})),[12,8]),'Four groups of three quavers show compound quadruple time.',[60,62,64,60,62,64,60,62,64,60,62,64]),
      ex('Demisemiquavers','Four demisemiquavers equal one quaver.',rhythm([q(['c/5'],'32',{group:1}),q(['d/5'],'32',{group:1}),q(['e/5'],'32',{group:1}),q(['f/5'],'32',{group:1}),q(['g/5'],'8'),q(['a/5'],'q',{dots:1})],[6,8]),'The four short notes fill one quaver subdivision before the next compound beat.',[60,62,64,65,67,69])
    ]),
    'extended-stave':topic('Reading beyond the stave','Read further from each clef anchor.','Treble and bass notes beyond two ledger lines.','Count outward from a familiar line or space; ledger lines extend the same alphabet.','Treble and bass clefs with notes extending beyond two ledger lines.',[
      ex('High treble A','A5 sits above the stave.',notes(['a/5']),'Count upward from the top-line F to reach A.',[81]),
      ex('Low treble A','A3 sits below the stave.',notes(['a/3']),'Count downward from middle C to reach low A.',[57]),
      ex('High bass E','E4 extends above bass clef.',notes(['e/4'],'bass'),'Use middle C as the bass-clef ledger-line anchor.',[64]),
      ex('Low bass E','E2 extends below bass clef.',notes(['e/2'],'bass'),'The note remains an E even when it needs several ledger lines.',[40])
    ]),
    'octave-transposition':topic('Octave transposition','Move between treble and bass clef.','Keep letters and rhythm; change register by one octave.','A transposition at the octave changes register, not the musical identity of the phrase.','Octave transposition between treble and bass clef.',[
      ex('Treble to bass','Move C5–E5–G5 down one octave into bass clef.',notes(['c/5','e/5','g/5']),'Write C4–E4–G4 in bass clef.',[72,76,79]),
      ex('Bass to treble','Move C3–E3–G3 up one octave into treble clef.',notes(['c/3','e/3','g/3'],'bass'),'Write C4–E4–G4 in treble clef.',[48,52,55]),
      ex('Accidental stays','Keep F sharp while moving it an octave.',notes(['f#/4'],'treble'),'The letter and accidental are preserved; only the octave changes.',[66]),
      ex('Phrase shape stays','A rising phrase remains rising after transposition.',notes(['d/3','f/3','a/3'],'bass'),'Keep every interval and duration exactly the same.',[50,53,57])
    ]),
    'major-keys':topic('Major keys through four signs','Build every allowed major scale.','Four sharps or flats is the Grade 3 boundary.','Use each letter once, apply the signature, and confirm the whole-step and half-step pattern.','All major keys up to and including four sharps and four flats.',[
      ex('E major','E major has four sharps.',scale('E',['e/4','f#/4','g#/4','a/4','b/4','c#/5','d#/5','e/5']),'F, C, G and D are sharpened.',[64,66,68,69,71,73,75,76]),
      ex('A-flat major','A-flat major has four flats.',scale('Ab',['ab/3','bb/3','c/4','db/4','eb/4','f/4','g/4','ab/4']),'B, E, A and D are flattened.',[56,58,60,61,63,65,67,68]),
      ex('B-flat major','B-flat major has two flats.',scale('Bb',['bb/3','c/4','d/4','eb/4','f/4','g/4','a/4','bb/4']),'Only B and E are flattened.',[58,60,62,63,65,67,69,70]),
      ex('A major','A major has three sharps.',scale('A',['a/3','b/3','c#/4','d/4','e/4','f#/4','g#/4','a/4']),'F, C and G are sharpened.',[57,59,61,62,64,66,68,69])
    ]),
    'minor-keys':topic('Harmonic and melodic minor','Hear the difference between the two forms.','Minor keys through four signs.','Harmonic minor raises degree 7; melodic minor raises degrees 6 and 7 only on the ascent.','All minor keys up to and including four sharps and four flats, in harmonic and melodic forms.',[
      ex('E harmonic minor','Raise D to D sharp.',scale('Em',['e/4','f#/4','g/4','a/4','b/4','c/5','d#/5','e/5']),'The raised seventh creates the leading note.',[64,66,67,69,71,72,75,76]),
      ex('E melodic minor','Raise C and D ascending; restore them descending.',scale('Em',['e/4','f#/4','g/4','a/4','b/4','c#/5','d#/5','e/5'],['e/5','d/5','c/5','b/4','a/4','g/4','f#/4','e/4']),'The descent follows the key signature.',[64,66,67,69,71,73,75,76]),
      ex('C harmonic minor','Raise B flat to B natural.',scale('Cm',['c/4','d/4','eb/4','f/4','g/4','ab/4','b/4','c/5']),'The seventh letter remains B.',[60,62,63,65,67,68,71,72]),
      ex('F melodic minor','Raise D flat and E flat ascending.',scale('Fm',['f/3','g/3','ab/3','bb/3','c/4','d/4','e/4','f/4'],['f/4','eb/4','db/4','c/4','bb/3','ab/3','g/3','f/3']),'Restore the signature notes when descending.',[53,55,56,58,60,62,64,65])
    ]),
    'intervals-above-tonic':topic('Intervals above the tonic','Count number and quality from home.','Work only from the tonic in an allowed key.','Count letter names inclusively, then use the key signature to identify major, minor or perfect quality.','Intervals above the tonic: number and type in permitted keys.',[
      ex('C major third','C to E is a major third.',notes(['c/4','e/4']),'C major supplies E natural.',[60,64]),
      ex('D major fifth','D to A is a perfect fifth.',notes(['d/4','a/4']),'Both notes belong to D major.',[62,69]),
      ex('E minor third','E to G is a minor third.',notes(['e/4','g/4']),'The tonic and third come from E minor.',[64,67]),
      ex('A-flat major sixth','A flat to F is a major sixth.',notes(['ab/3','f/4']),'Count A–B–C–D–E–F, then hear nine semitones.',[56,65])
    ]),
    'tonic-triads':topic('Tonic triads','Stack thirds above the home note.','Root-position tonic chords only.','Take degrees 1, 3 and 5 from the stated scale, keeping the tonic in the bass.','Root-position tonic triads in permitted major and minor keys.',[
      ex('E major tonic','E–G sharp–B makes the tonic triad.',triad('E',['e/3','g#/3','b/3']),'Use degrees 1, 3 and 5 of E major.',[52,56,59]),
      ex('A-flat major tonic','A flat–C–E flat makes the tonic triad.',triad('Ab',['ab/3','c/4','eb/4']),'The accidental spelling follows the key.',[56,60,63]),
      ex('E minor tonic','E–G–B makes the tonic triad.',triad('Em',['e/3','g/3','b/3']),'Minor keys have a minor tonic triad.',[52,55,59]),
      ex('C minor tonic','C–E flat–G makes the tonic triad.',triad('Cm',['c/4','eb/4','g/4']),'The third is E flat, not D sharp.',[60,63,67])
    ]),
    'musical-terms':topic('Musical terms and signs','Turn marks into musical decisions.','Cumulative vocabulary with a Grade 3 focus.','Ask whether the marking affects speed, volume, articulation or repetition.','Additional common musical terms and signs from the cumulative syllabus.',[
      ex('Allegretto','Moderately quick.',rhythm([q(['c/5']),q(['d/5']),q(['e/5']),q(['f/5'])],[4,4]),'It is lighter than allegro, but still moving.',[60,62,64,65]),
      ex('Mezzo forte','Moderately loud.',rhythm([q(['c/5']),q(['d/5']),q(['e/5']),q(['f/5'])],[4,4]),'mf is between soft and loud.',[60,62,64,65]),
      ex('Staccato','Make each marked note short and detached.',rhythm([q(['c/5'],'q',{staccato:true}),q(['d/5'],'q',{staccato:true}),q(['e/5'],'h')],[4,4]),'The dots change articulation, not the written pitch.',[60,62,64]),
      ex('Da capo','Return to the beginning.',rhythm([q(['c/5']),q(['d/5']),q(['e/5']),q(['f/5'])],[4,4]),'D.C. tells the performer to go back to the start.',[60,62,64,65])
    ])
  });
})();
