(function(){
  const q=(keys,duration='q',extra={})=>({keys,duration,...extra});
  const rest=(duration='q',extra={})=>({rest:true,duration,...extra});
  const rhythm=(events,meter=[4,4])=>({type:'rhythm',meter,events});
  const notes=(written,clef='treble')=>({type:'interval',notes:written,clef});
  const scale=(key,written,descendingNotes=[])=>({type:'scale',key,notes:written,descendingNotes});
  const triad=(key,written)=>({type:'triad',key,notes:written});
  const keySignature=key=>({type:'key-signature',key});
  const part=(label,midis)=>[label,midis];
  const ex=(label,rule,notation,explanation,midis,extra={})=>({
    label,rule,notation,explanation,audioType:notation.type==='rhythm'?'rhythm':midis.length>1?'sequence':'note',parts:[part(`Hear ${label.toLowerCase()}`,midis),part('Hear the anchor',midis.slice(0,1))],...extra
  });
  const topic=(name,title,subtitle,intro,syllabus,examples,extra={})=>({name,title,subtitle,intro,syllabus,examples,...extra});
  const sameC=[
    {writtenPitch:'c/4',clef:'treble',audioMidi:60,label:'Middle C in treble clef'},
    {writtenPitch:'c/4',clef:'alto',audioMidi:60,label:'Middle C in alto clef'},
    {writtenPitch:'c/4',clef:'bass',audioMidi:60,label:'Middle C in bass clef'}
  ];

  window.ListeningDeskGrade4Topics=Object.freeze({
    'rhythm-note-values':topic('Long values and duplets','Control extended note values.','Breves, double dots and duplets.','Build each duration from values you already know.','Breves and rests; double-dotted notes and rests; duplets.',[
      ex('Breve','A breve equals eight crotchet beats.',rhythm([q(['c/5'],'1/2')],[8,4]),'One breve lasts for eight steady crotchet beats.',[60]),
      ex('Breve rest','A breve rest fills eight crotchet beats.',rhythm([rest('1/2')],[8,4]),'Count eight silent crotchet beats before continuing.',[]),
      ex('Double-dotted minim','A second dot adds one quarter of the original value.',rhythm([q(['c/5'],'h',{dots:2}),q(['d/5'],'8')]),'A double-dotted minim lasts three and a half crotchet beats.',[60,62]),
      ex('Duplet','Two equal notes replace three of the same value in compound time.',rhythm([q(['c/5'],'8',{tuplet:2,group:1}),q(['d/5'],'8',{tuplet:2,group:1}),q(['e/5'],'q',{dots:1})],[6,8]),'Keep both duplet notes equal inside one dotted-crotchet beat.',[60,62,64])
    ]),
    'time-signatures':topic('Metre and grouping','Make every beat visible.','All regular simple and compound metres.','Read the upper number as beats or subdivisions, then group notation around the beat.','All simple and compound duple, triple and quadruple time signatures and correct grouping.',[
      ex('Simple duple','Two crotchet beats form one bar of 2/4.',rhythm([q(['c/5'],'8',{group:1}),q(['d/5'],'8',{group:1}),q(['e/5'],'q')],[2,4]),'Each pair of quavers stays inside one crotchet beat.',[60,62,64]),
      ex('Simple triple','Three minim beats form one bar of 3/2.',rhythm([q(['c/5'],'h'),q(['d/5'],'h'),q(['e/5'],'h')],[3,2]),'The denominator identifies the minim as the beat unit.',[60,62,64]),
      ex('Compound duple','Six quavers divide into two dotted-crotchet beats.',rhythm([0,1,2,3,4,5].map((_,i)=>q([`${['c','d','e','f','g','a'][i]}/5`],'8',{group:Math.floor(i/3)+1})),[6,8]),'Beam 6/8 as two groups of three quavers.',[60,62,64,65,67,69]),
      ex('Compound quadruple','Twelve quavers divide into four dotted-crotchet beats.',rhythm(Array.from({length:12},(_,i)=>q([`${['c','d','e'][i%3]}/5`],'8',{group:Math.floor(i/3)+1})),[12,8]),'Four groups of three reveal the four compound beats.',[60,62,64,60,62,64,60,62,64,60,62,64])
    ]),
    clefs:topic('Alto clef and pitch comparison','Find the same sound in three clefs.','Use middle C as a shared anchor.','A clef changes staff position, never the pitch itself.','Alto clef and notes of the same pitch in treble, alto and bass clefs.',[
      ex('Middle C in alto clef','The centre of the C clef marks middle C.',notes(['c/4'],'alto'),'Middle C sits on the third line in alto clef.',[60],{inspectNotes:[sameC[1]]}),
      ex('Middle C in treble clef','Middle C uses the ledger line below the treble stave.',notes(['c/4'],'treble'),'It sounds exactly like middle C in alto clef.',[60],{inspectNotes:[sameC[0]]}),
      ex('Middle C in bass clef','Middle C uses the ledger line above the bass stave.',notes(['c/4'],'bass'),'The staff position moves but MIDI 60 does not.',[60],{inspectNotes:[sameC[2]]}),
      ex('A shared G','G4 occupies different positions in each clef.',notes(['g/4'],'alto'),'Trace upward from each clef anchor before naming it.',[67],{inspectNotes:[{writtenPitch:'g/4',clef:'alto',audioMidi:67,label:'G4'}]})
    ],{comparison:{title:'Middle C across three clefs',notes:sameC}}),
    'clef-transposition':topic('Octave transposition','Move phrases into or out of alto clef.','Write the same notes one octave away.','Preserve every letter, accidental and rhythm while changing clef and octave.','Octave transposition from treble or bass to alto clef, and vice versa.',[
      ex('Treble to alto','Move every note down one octave into alto clef.',notes(['c/5','e/5','g/5'],'treble'),'C5–E5–G5 becomes C4–E4–G4.',[72,76,79]),
      ex('Alto to treble','Move every note up one octave into treble clef.',notes(['d/4','f/4','a/4'],'alto'),'D4–F4–A4 becomes D5–F5–A5.',[62,65,69]),
      ex('Bass to alto','Move every note up one octave into alto clef.',notes(['g/2','b/2','d/3'],'bass'),'Keep the letters and raise each octave number by one.',[43,47,50]),
      ex('Alto to bass','Move every note down one octave into bass clef.',notes(['a/4','c/5','e/5'],'alto'),'Accidentals and durations must also be copied exactly.',[69,72,76])
    ],{tool:'grade4-clef-transposition'}),
    accidentals:topic('Double accidentals and enharmonics','Spell chromatic pitches precisely.','Double sharps, double flats and cancellation.','Staff position follows the letter name; the accidental changes only the sound.','Double sharp and double flat signs, cancellation, and enharmonic equivalents.',[
      ex('Double sharp','A double sharp raises the written note by two semitones.',notes(['f##/4']),'F double sharp sounds as G natural but remains written on F.',[67]),
      ex('Double flat','A double flat lowers the written note by two semitones.',notes(['ebb/4']),'E double flat sounds as D natural but remains written on E.',[62]),
      ex('Cancellation','A natural can cancel a preceding sharp or flat.',notes(['f#/4','f/4']),'The second F returns to its natural sounding pitch.',[66,65]),
      ex('Enharmonic pair','C sharp and D flat share one sounding pitch.',notes(['c#/4','db/4']),'Choose the spelling that fits the key or melodic direction.',[61,61])
    ]),
    'major-keys':topic('Major keys','Master keys through five signs.','Key signatures and complete major scales.','Count sharps or flats, then confirm the tonic and letter sequence.','All major keys up to and including five sharps and flats.',[
      ex('B major','B major has five sharps.',scale('B',['b/4','c#/5','d#/5','e/5','f#/5','g#/5','a#/5','b/5']),'Use each letter once and finish on B.',[71,73,75,76,78,80,82,83]),
      ex('D-flat major','D-flat major has five flats.',scale('Db',['db/4','eb/4','f/4','gb/4','ab/4','bb/4','c/5','db/5']),'The spelling preserves every scale letter.',[61,63,65,66,68,70,72,73]),
      ex('E major','E major has four sharps.',scale('E',['e/4','f#/4','g#/4','a/4','b/4','c#/5','d#/5','e/5']),'Its signature contains F, C, G and D sharp.',[64,66,68,69,71,73,75,76]),
      ex('A-flat major','A-flat major has four flats.',keySignature('Ab'),'Use the penultimate-flat rule to identify the major key.',[68])
    ]),
    'minor-keys':topic('Minor keys','Compare harmonic and melodic forms.','Minor keys through five signs.','The key signature stays fixed while raised scale degrees use accidentals.','All minor keys up to and including five sharps and flats, harmonic and melodic forms.',[
      ex('G-sharp harmonic minor','Raise degree 7 to create the leading note.',scale('G#m',['g#/4','a#/4','b/4','c#/5','d#/5','e/5','f##/5','g#/5']),'F double sharp is required: the seventh letter must remain F.',[68,70,71,73,75,76,79,80]),
      ex('G-sharp melodic minor','Raise degrees 6 and 7 ascending, restore them descending.',scale('G#m',['g#/4','a#/4','b/4','c#/5','d#/5','e#/5','f##/5','g#/5'],['g#/5','f#/5','e/5','d#/5','c#/5','b/4','a#/4','g#/4']),'The descending form follows the key signature.',[68,70,71,73,75,77,79,80]),
      ex('B-flat harmonic minor','Raise A flat to A natural as the leading note.',scale('Bbm',['bb/3','c/4','db/4','eb/4','f/4','gb/4','a/4','bb/4']),'The harmonic form creates an augmented second before the leading note.',[58,60,61,63,65,66,69,70]),
      ex('C-sharp melodic minor','Restore B and A on the way down.',scale('C#m',['c#/4','d#/4','e/4','f#/4','g#/4','a#/4','b#/4','c#/5'],['c#/5','b/4','a/4','g#/4','f#/4','e/4','d#/4','c#/4']),'Read ascending and descending forms independently.',[61,63,64,66,68,70,72,73])
    ]),
    'scale-degrees':topic('Scale degrees and chromatic scales','Name function and spell semitones.','Technical names plus chromatic construction.','Scale degrees describe tonal function; chromatic scales move in semitones without changing key.','Technical names for diatonic notes and construction of the chromatic scale.',[
      ex('Tonic to leading note','Degrees 1 and 7 create the strongest resolution.',notes(['b/4','c/5']),'The leading note rises a semitone to the tonic.',[71,72]),
      ex('Subdominant to dominant','Degrees 4 and 5 sit next to each other.',notes(['f/4','g/4']),'Name position from the tonic of the stated key.',[65,67]),
      ex('Ascending chromatic scale','Sharps commonly clarify an ascending chromatic line.',scale('C',['c/4','c#/4','d/4','d#/4','e/4','f/4','f#/4','g/4','g#/4','a/4','a#/4','b/4','c/5']),'Every adjacent sound is one semitone apart.',[60,61,62,63,64,65,66,67,68,69,70,71,72]),
      ex('Descending chromatic scale','Flats commonly clarify a descending chromatic line.',scale('C',['c/5','b/4','bb/4','a/4','ab/4','g/4','gb/4','f/4','e/4','eb/4','d/4','db/4','c/4']),'Avoid ambiguous repeated-letter spelling.',[72,71,70,69,68,67,66,65,64,63,62,61,60])
    ]),
    intervals:topic('Diatonic intervals','Count within the stated key.','All intervals not exceeding an octave.','Count letter names inclusively, then identify quality from the key.','All intervals not exceeding an octave between diatonic notes in permitted keys.',[
      ex('Major third','C to E is a third in C major.',notes(['c/4','e/4']),'Three letter names and four semitones make a major third.',[60,64]),
      ex('Minor sixth','E to C is a sixth in C major.',notes(['e/4','c/5']),'Both notes belong to C major; the result is a minor sixth.',[64,72]),
      ex('Perfect fifth','D to A is a fifth in D major.',notes(['d/4','a/4']),'A fifth belonging to the key is perfect here.',[62,69]),
      ex('Major seventh','D flat to C is a seventh in D-flat major.',notes(['db/4','c/5']),'Use the stated key rather than respelling the lower note.',[61,72])
    ]),
    triads:topic('Primary triads','Construct root-position I, IV and V.','Major and minor keys through five signs.','Start on the named scale degree and stack alternate scale notes.','Root-position tonic, subdominant and dominant chords in all permitted keys.',[
      ex('I in B major','The tonic triad is B–D sharp–F sharp.',triad('B',['b/3','d#/4','f#/4']),'B remains the lowest note in root position.',[59,63,66]),
      ex('IV in D-flat major','The subdominant triad is G flat–B flat–D flat.',triad('Db',['gb/3','bb/3','db/4']),'Build on scale degree 4 and preserve the key spelling.',[54,58,61]),
      ex('V in C-sharp minor','Use harmonic minor for the dominant chord.',triad('C#m',['g#/3','b#/3','d#/4']),'B sharp supplies the leading note in chord V.',[56,60,63]),
      ex('I in B-flat minor','The tonic triad is B flat–D flat–F.',triad('Bbm',['bb/3','db/4','f/4']),'The tonic stays in the bass in root position.',[58,61,65])
    ]),
    'musical-terms':topic('Terms and signs','Translate markings into performance.','Cumulative Grade 1–4 vocabulary.','Read every marking in the context of the phrase it affects.','More terms and signs from the cumulative syllabus.',[
      ex('Rallentando','Gradually become slower.',rhythm([q(['c/5'],'q'),q(['d/5'],'q'),q(['e/5'],'h')]),'The change happens progressively, not suddenly.',[60,62,64]),
      ex('Crescendo','Gradually become louder.',rhythm([q(['c/5'],'q'),q(['d/5'],'q'),q(['e/5'],'q'),q(['f/5'],'q')]),'Shape the whole marked span.',[60,62,64,65]),
      ex('Sforzando','Give one note a sudden strong accent.',rhythm([q(['c/5'],'q'),q(['d/5'],'q',{accent:true}),q(['e/5'],'h')]),'The emphasis belongs to the marked attack.',[60,62,64]),
      ex('Tenuto','Hold the note for its full value.',rhythm([q(['c/5'],'q'),q(['d/5'],'q'),q(['e/5'],'h')]),'Tenuto affects articulation, not written duration.',[60,62,64])
    ]),
    ornaments:topic('Ornaments','Recognise and name six signs.','Trill, turn, mordents and grace notes.','Identify the written sign before considering its possible realization.','Recognition and naming of trill, turn, upper/lower mordent, acciaccatura and appoggiatura.',[
      ex('Trill','Rapidly alternate the main note and upper neighbour.',notes(['d/5','e/5']),'The trill sign sits above the main note.',[74,76],{ornament:'Trill'}),
      ex('Turn','Move above, through, below and back to the main note.',notes(['d/5']),'The sideways S-shaped sign identifies a turn.',[76,74,73,74],{ornament:'Turn'}),
      ex('Upper and lower mordents','A mordent makes one quick neighbour movement.',notes(['e/5','d/5']),'The stroke distinguishes the Lower mordent from the Upper mordent.',[76,77,76,76,75,76],{ornament:'Upper mordent · Lower mordent'}),
      ex('Grace-note ornaments','Acciaccatura is crushed; Appoggiatura leans on the beat.',rhythm([q(['d/5'],'8'),q(['e/5'],'h')]),'Compare the slashed Acciaccatura with the unslashed Appoggiatura.',[74,76],{ornament:'Acciaccatura · Appoggiatura'})
    ]),
    'orchestral-instruments':topic('Orchestral instruments','Recognise instruments in a score.','Simple Grade 4 passage questions.','Use the instrument name and its written line as evidence.','Simple questions about standard orchestral instruments in a musical passage.',[
      ex('Viola','Viola commonly reads alto clef.',notes(['c/4'],'alto'),'The alto clef is a strong visual clue for viola.',[60],{instrument:'Viola'}),
      ex('Flute','Flute is normally written in treble clef.',notes(['g/5'],'treble'),'Its line often occupies the upper register.',[79],{instrument:'Flute'}),
      ex('Cello','Cello commonly reads bass clef at this level.',notes(['c/3'],'bass'),'Use the low written range and instrument label together.',[48],{instrument:'Cello'}),
      ex('Oboe','Oboe is normally written in treble clef.',notes(['d/5'],'treble'),'Grade 4 questions identify standard instruments in context.',[74],{instrument:'Oboe'})
    ]),
    'musical-observation':topic('Passage analysis','Combine Grade 4 knowledge.','Read before you calculate.','Use key, metre, clef, markings and melodic detail as connected evidence.','Simple questions about a musical passage using cumulative Grade 4 knowledge.',[
      ex('Identify the key','Combine signature with opening and ending notes.',keySignature('A'),'Three sharps suggest A major or F-sharp minor; the phrase supplies context.',[69]),
      ex('Explain the grouping','Use beaming to confirm compound duple metre.',rhythm([0,1,2,3,4,5].map((_,i)=>q([`${['c','d','e','f','g','a'][i]}/5`],'8',{group:Math.floor(i/3)+1})),[6,8]),'Two groups of three quavers reveal two dotted-crotchet beats.',[60,62,64,65,67,69]),
      ex('Name the interval','Read both pitches in the stated clef and key.',notes(['c/4','a/4'],'alto'),'Count letter names before deciding quality.',[60,69]),
      ex('Find chord V','Use harmonic minor when the passage is in a minor key.',triad('Am',['e/4','g#/4','b/4']),'The raised leading note identifies the dominant chord.',[64,68,71])
    ])
  });
})();
