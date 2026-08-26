(function(){
  const q=(keys,duration='q',extra={})=>({keys,duration,...extra});
  const rest=(duration='q',extra={})=>({rest:true,duration,...extra});
  const rhythm=(events,meter)=>({type:'rhythm',events,meter});
  const notes=(written,clef='treble')=>({type:'interval',notes:written,clef});
  const scale=(key,written,clef='treble')=>({type:'scale',key,notes:written,clef});
  const triad=(key,written,clef='treble')=>({type:'triad',key,notes:written,clef});
  const ex=(label,rule,notation,explanation,midis,extra={})=>({
    label,rule,notation,explanation,midis,audioType:notation.type==='rhythm'?'rhythm':'sequence',
    parts:[['Hear the example',midis],['Hear the first note',midis.slice(0,1)]],...extra
  });
  const topic=(name,title,subtitle,intro,syllabus,examples)=>({name,title,subtitle,intro,syllabus,examples});

  window.ListeningDeskGrade1Topics=Object.freeze({
    'note-values-rests':topic('Note values and rests','Make every beat count.','Semibreves to semiquavers, with matching rests.','Read duration before pitch: the note head, stem, flags and dots tell you how long sound or silence lasts.','Note and rest values from semibreve to semiquaver, ties and single dots.',[
      ex('Five note values','Each value halves the one before it.',rhythm([q(['c/4'],'w'),q(['d/4'],'h'),q(['e/4'],'q'),q(['f/4'],'8'),q(['g/4'],'16')],[4,4]),'A semibreve divides into 2 minims, 4 crotchets, 8 quavers or 16 semiquavers.',[60,62,64,65,67]),
      ex('Matching rests','A rest lasts as long as its matching note.',rhythm([rest('h'),q(['c/4'],'h')],[4,4]),'The minim rest gives two silent crotchet beats.',[60]),
      ex('A single dot','A dot adds half the original value.',rhythm([q(['c/4'],'h',{dots:1}),q(['d/4'],'q')],[4,4]),'A dotted minim lasts three crotchet beats.',[60,62]),
      ex('A tie','A tie joins the duration of two notes at the same pitch.',rhythm([q(['g/4'],'h',{tieStart:true}),q(['g/4'],'q',{tieEnd:true}),q(['a/4'],'q')],[4,4]),'The two written G notes sound as one held note.',[67,67,69])
    ]),
    'simple-time':topic('Simple time','Find the steady beat.','Duple, triple and quadruple bars.','In simple time, each beat divides naturally into two equal parts.','Simple 2/4, 3/4 and 4/4 time, bar lines and correct grouping.',[
      ex('2/4','Two crotchet beats fill one bar.',rhythm([q(['c/4']),q(['d/4'])],[2,4]),'Count two steady beats: 1–2.',[60,62]),
      ex('3/4','Three crotchet beats fill one bar.',rhythm([q(['c/4']),q(['d/4']),q(['e/4'])],[3,4]),'Count three steady beats: 1–2–3.',[60,62,64]),
      ex('4/4','Four crotchet beats fill one bar.',rhythm([q(['c/4']),q(['d/4']),q(['e/4']),q(['f/4'])],[4,4]),'Count four steady beats, with the first strongest.',[60,62,64,65]),
      ex('Grouped quavers','Quavers are grouped to show each crotchet beat.',rhythm([q(['c/4'],'8',{group:1}),q(['d/4'],'8',{group:1}),q(['e/4'],'8',{group:2}),q(['f/4'],'8',{group:2})],[2,4]),'Each beamed pair equals one crotchet beat.',[60,62,64,65])
    ]),
    'treble-clef':topic('Treble clef','Read notes above middle C.','Use line and space anchors.','The treble clef curls around the G line; count stepwise from a note you know.','Treble-clef notes on the stave and middle C.',[
      ex('Middle C','Middle C sits on one ledger line below the treble stave.',notes(['c/4']),'This is the bridge between treble and bass clefs.',[60]),
      ex('Treble spaces','F, A, C and E fill the four spaces.',notes(['f/4','a/4','c/5','e/5']),'Read the spaces from bottom to top.',[65,69,72,76]),
      ex('Treble lines','E, G, B, D and F sit on the five lines.',notes(['e/4','g/4','b/4','d/5','f/5']),'Read the lines from bottom to top.',[64,67,71,74,77]),
      ex('Stepwise reading','Line and space notes alternate as the melody moves by step.',notes(['c/4','d/4','e/4','f/4','g/4']),'Each move to the next position changes one letter name.',[60,62,64,65,67])
    ]),
    'bass-clef':topic('Bass clef','Read notes below middle C.','Use F as the clef anchor.','The two dots of the bass clef surround the F line; count stepwise from there.','Bass-clef notes on the stave and middle C.',[
      ex('Middle C','Middle C sits on one ledger line above the bass stave.',notes(['c/4'],'bass'),'It is the same sounding note as middle C in treble clef.',[60]),
      ex('Bass spaces','A, C, E and G fill the four spaces.',notes(['a/2','c/3','e/3','g/3'],'bass'),'Read the spaces from bottom to top.',[45,48,52,55]),
      ex('Bass lines','G, B, D, F and A sit on the five lines.',notes(['g/2','b/2','d/3','f/3','a/3'],'bass'),'The fourth line is the F named by the clef.',[43,47,50,53,57]),
      ex('Stepwise reading','Bass notes also alternate line and space by step.',notes(['c/3','d/3','e/3','f/3','g/3'],'bass'),'Count letters in order rather than guessing the shape.',[48,50,52,53,55])
    ]),
    accidentals:topic('Accidentals','Change one written pitch.','Sharps, flats, naturals and cancellation.','An accidental affects that letter at that octave until the next bar line unless another sign cancels it.','Single sharps, flats and naturals, including cancellation within a bar.',[
      ex('Sharp','A sharp raises F by one semitone.',notes(['f/4','f#/4']),'F sharp is one semitone higher than F natural.',[65,66]),
      ex('Flat','A flat lowers B by one semitone.',notes(['b/3','bb/3']),'B flat is one semitone lower than B natural.',[59,58]),
      ex('Natural','A natural sign cancels an earlier sharp or flat.',notes(['f#/4','f/4']),'The second note returns to F natural.',[66,65]),
      ex('Bar-line reset','An accidental does not automatically continue into the next bar.',notes(['c#/4','c/4']),'After the bar line, C is natural again unless the sharp is rewritten.',[61,60])
    ]),
    'major-scale-construction':topic('Major scale construction','Build the major-scale pattern.','T–T–S–T–T–T–S.','Use every letter name once, then place tones and semitones in the major-scale order.','Construction of a major scale using the tone and semitone pattern.',[
      ex('First two tones','C–D and D–E are tones.',notes(['c/4','d/4','e/4']),'Two whole-tone steps begin the major scale.',[60,62,64]),
      ex('First semitone','E–F is the first semitone.',notes(['e/4','f/4']),'These notes are adjacent on the keyboard.',[64,65]),
      ex('Upper pattern','G–A–B uses two tones, then B–C is a semitone.',notes(['g/4','a/4','b/4','c/5']),'The final semitone leads back to the tonic.',[67,69,71,72]),
      ex('Complete pattern','C major shows T–T–S–T–T–T–S.',scale('C',['c/4','d/4','e/4','f/4','g/4','a/4','b/4','c/5']),'The two semitones occur between degrees 3–4 and 7–8.',[60,62,64,65,67,69,71,72])
    ]),
    'grade-1-keys':topic('Grade 1 keys','Know four major keys.','C, G, D and F major.','Read the tonic first, then apply the key signature consistently to the scale.','C, G, D and F major scales and key signatures in treble and bass clefs.',[
      ex('C major','C major has no sharps or flats.',scale('C',['c/4','d/4','e/4','f/4','g/4','a/4','b/4','c/5']),'Every scale note is natural.',[60,62,64,65,67,69,71,72]),
      ex('G major','G major has F sharp.',scale('G',['g/3','a/3','b/3','c/4','d/4','e/4','f#/4','g/4']),'F sharp preserves the major-scale pattern.',[55,57,59,60,62,64,66,67]),
      ex('D major','D major has F sharp and C sharp.',scale('D',['d/3','e/3','f#/3','g/3','a/3','b/3','c#/4','d/4'],'bass'),'Both sharps belong to the key signature.',[50,52,54,55,57,59,61,62]),
      ex('F major','F major has B flat.',scale('F',['f/2','g/2','a/2','bb/2','c/3','d/3','e/3','f/3'],'bass'),'B flat creates the semitone between degrees 3 and 4.',[41,43,45,46,48,50,52,53])
    ]),
    'tonic-triads-degrees-intervals':topic('Triads, degrees and intervals','Count from the tonic.','Use numbered scale positions.','The tonic is degree 1; its root-position triad uses 1, 3 and 5, while intervals count both end notes.','Tonic triads, numbered degrees and intervals above the tonic.',[
      ex('C tonic triad','Degrees 1, 3 and 5 are C, E and G.',triad('C',['c/4','e/4','g/4']),'The tonic is the lowest note in root position.',[60,64,67]),
      ex('F tonic triad','Degrees 1, 3 and 5 are F, A and C.',triad('F',['f/3','a/3','c/4'],'bass'),'Count upward through the F-major scale.',[53,57,60]),
      ex('Scale degree 5','G is degree 5 in C major.',notes(['c/4','g/4']),'Count C as 1, then D–2, E–3, F–4, G–5.',[60,67]),
      ex('A third above tonic','C to E is a third.',notes(['c/4','e/4']),'Count both letter names: C–D–E.',[60,64])
    ]),
    'musical-terms-observation':topic('Terms and musical observation','Read what the score asks.','Tempo, dynamics, articulation and melody direction.','Words and signs shape how written notes are performed; visual patterns also reveal repeated and stepwise ideas.','Common Grade 1 terms, signs and elementary melodic observation.',[
      ex('Allegro','Allegro means fast and lively.',notes(['c/4','d/4','e/4','f/4']),'It describes the tempo of the music.',[60,62,64,65],{concept:{symbol:'Allegro',detail:'Fast and lively'}}),
      ex('Piano','p means play softly.',notes(['g/4']),'This is a dynamic marking, not the instrument name here.',[67],{concept:{symbol:'p',detail:'Softly'}}),
      ex('Staccato','Dots above or below notes mean short and detached.',notes(['c/4','e/4','g/4']),'Leave a small silence between the sounds.',[60,64,67],{concept:{symbol:'staccato',detail:'Short and detached'}}),
      ex('Repeated then rising','The first note repeats before the melody rises by step.',notes(['c/4','c/4','d/4','e/4']),'Observe repeated notes and melodic direction before naming pitches.',[60,60,62,64])
    ])
  });
})();
