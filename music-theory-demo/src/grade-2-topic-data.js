(function(){
  const q=(keys,duration='q',extra={})=>({keys,duration,...extra});
  const rest=(duration='q',extra={})=>({rest:true,duration,...extra});
  const rhythm=(events,meter)=>({type:'rhythm',events,meter});
  const notes=(written,clef='treble')=>({type:'interval',notes:written,clef});
  const scale=(key,written)=>({type:'scale',key,notes:written});
  const triad=(key,written)=>({type:'triad',key,notes:written});
  const ex=(label,rule,notation,explanation,midis)=>({label,rule,notation,explanation,audioType:notation.type==='rhythm'?'rhythm':'sequence',parts:[['Hear the example',midis],['Hear the first note',midis.slice(0,1)]]});
  const topic=(name,title,subtitle,intro,syllabus,examples)=>({name,title,subtitle,intro,syllabus,examples});
  window.ListeningDeskGrade2Topics=Object.freeze({
    'simple-time':topic('Simple time with minim beats','Hear the beat unit.','2/2, 3/2 and 4/2 use the minim as one beat.','The lower number tells you which note value receives one beat; beams still show the beat clearly.','Simple duple, triple and quadruple time with minim beats and correct grouping.',[
      ex('2/2','Two minims fill a bar of 2/2.',rhythm([q(['c/5'],'h'),q(['d/5'],'h')],[2,2]),'The minim is one beat, so there are two beats.',[60,62]),
      ex('3/2','Three minims fill a bar of 3/2.',rhythm([q(['c/5'],'h'),q(['d/5'],'h'),q(['e/5'],'h')],[3,2]),'Three minim beats make simple triple time.',[60,62,64]),
      ex('4/2','Four minims fill a bar of 4/2.',rhythm([q(['c/5'],'h'),q(['d/5'],'h'),q(['e/5'],'h'),q(['f/5'],'h')],[4,2]),'Four minim beats make simple quadruple time.',[60,62,64,65]),
      ex('Minim beat split','Two crotchets can divide one minim beat.',rhythm([q(['c/5'],'q',{group:1}),q(['d/5'],'q',{group:1}),q(['e/5'],'h')],[2,2]),'The first pair together equals one minim beat.',[60,62,64])
    ]),
    triplets:topic('Triplets','Fit three equal notes into two.','Triplets with notes and rests.','The small 3 tells you that three equal notes take the time normally used by two.','Triplet note groups and triplet rests.',[
      ex('Crotchet triplet','Three crotchets fit into two crotchet beats.',rhythm([q(['c/5'],'q',{tuplet:3,group:1}),q(['d/5'],'q',{tuplet:3,group:1}),q(['e/5'],'q',{tuplet:3,group:1}),q(['f/5'],'h')],[4,4]),'Keep all three notes evenly spaced.',[60,62,64,65]),
      ex('Quaver triplet','Three quavers fit into one crotchet beat.',rhythm([q(['c/5'],'8',{tuplet:3,group:1}),q(['d/5'],'8',{tuplet:3,group:1}),q(['e/5'],'8',{tuplet:3,group:1}),q(['f/5'],'q'),q(['g/5'],'h')],[4,4]),'The three quavers occupy one beat together.',[60,62,64,65,67]),
      ex('Triplet with rest','A rest can be one member of a triplet.',rhythm([q(['c/5'],'8',{tuplet:3,group:1}),rest('8',{tuplet:3,group:1}),q(['e/5'],'8',{tuplet:3,group:1}),q(['f/5'],'q'),q(['g/5'],'h')],[4,4]),'The silent triplet member still takes equal time.',[60,64,65,67]),
      ex('Triplet pulse','Listen for three evenly placed sounds.',rhythm([q(['g/4'],'q',{tuplet:3,group:1}),q(['a/4'],'q',{tuplet:3,group:1}),q(['b/4'],'q',{tuplet:3,group:1}),q(['c/5'],'h')],[4,4]),'Count “one-trip-let” evenly before the next beat.',[67,69,71,72])
    ]),
    'ledger-lines':topic('Ledger lines','Read up to two lines beyond the stave.','Treble and bass clef extensions.','Ledger lines continue the usual line-space pattern; count from a note you already know.','Treble and bass clef notes up to two ledger lines above and below the stave.',[
      ex('Middle C in treble','Middle C uses one ledger line below treble clef.',notes(['c/4']),'It is the familiar anchor below the treble stave.',[60]),
      ex('High A in treble','A5 needs two ledger lines above treble clef.',notes(['a/5']),'Count from top-line F upward to A.',[81]),
      ex('Middle C in bass','Middle C uses one ledger line above bass clef.',notes(['c/4'],'bass'),'It sounds the same as middle C in treble clef.',[60]),
      ex('Low F in bass','F2 uses two ledger lines below bass clef.',notes(['f/2'],'bass'),'Count downward from the bass-clef F line.',[41])
    ]),
    'relative-keys':topic('Relative major and minor','Find two keys sharing one signature.','Every major key has a relative minor.','Relative keys use the same accidentals but begin and end on different tonics.','Relative major and minor keys in the permitted Grade 2 range.',[
      ex('C major and A minor','No sharps or flats: C major and A minor.',scale('C',['c/4','d/4','e/4','f/4','g/4','a/4','b/4','c/5']),'A minor begins on the sixth note of C major.',[60,62,64,65,67,69,71,72]),
      ex('G major and E minor','One sharp: G major and E minor.',scale('G',['g/3','a/3','b/3','c/4','d/4','e/4','f#/4','g/4']),'Both keys use F sharp in the signature.',[55,57,59,60,62,64,66,67]),
      ex('F major and D minor','One flat: F major and D minor.',scale('F',['f/3','g/3','a/3','bb/3','c/4','d/4','e/4','f/4']),'Both keys use B flat in the signature.',[53,55,57,58,60,62,64,65]),
      ex('B-flat major and G minor','Two flats: B-flat major and G minor.',scale('Bb',['bb/3','c/4','d/4','eb/4','f/4','g/4','a/4','bb/4']),'The shared signature contains B flat and E flat.',[58,60,62,63,65,67,69,70])
    ]),
    'harmonic-minor':topic('Harmonic minor','Raise the seventh degree.','Keep the letter name and add the leading note.','Start with the key signature, then raise only degree 7 by a semitone.','Construction of harmonic minor scales in permitted keys.',[
      ex('A harmonic minor','Raise G to G sharp.',scale('Am',['a/3','b/3','c/4','d/4','e/4','f/4','g#/4','a/4']),'G sharp leads strongly up to A.',[57,59,60,62,64,65,68,69]),
      ex('E harmonic minor','Raise D to D sharp.',scale('Em',['e/4','f#/4','g/4','a/4','b/4','c/5','d#/5','e/5']),'The key signature still supplies F sharp.',[64,66,67,69,71,72,75,76]),
      ex('D harmonic minor','Raise C sharp to C sharp from C natural.',scale('Dm',['d/4','e/4','f/4','g/4','a/4','bb/4','c#/5','d/5']),'C sharp is the raised seventh degree.',[62,64,65,67,69,70,73,74]),
      ex('A leading note','Degree 7 rises by a semitone to degree 1.',notes(['g#/4','a/4']),'This is the defining sound of A harmonic minor.',[68,69])
    ]),
    'grade-2-keys':topic('Grade 2 key signatures','Learn the new key set.','A, B-flat and E-flat major; A, E and D minor.','Name the signature, use every scale letter once, then check the tonic.','Major keys A, B-flat and E-flat; minor keys A, E and D.',[
      ex('A major','A major has three sharps.',scale('A',['a/3','b/3','c#/4','d/4','e/4','f#/4','g#/4','a/4']),'F, C and G are sharp.',[57,59,61,62,64,66,68,69]),
      ex('E-flat major','E-flat major has three flats.',scale('Eb',['eb/4','f/4','g/4','ab/4','bb/4','c/5','d/5','eb/5']),'B, E and A are flat.',[63,65,67,68,70,72,74,75]),
      ex('E minor','E minor has one sharp in its signature.',scale('Em',['e/4','f#/4','g/4','a/4','b/4','c/5','d/5','e/5']),'The scale uses F sharp from the signature.',[64,66,67,69,71,72,74,76]),
      ex('D minor','D minor has one flat in its signature.',scale('Dm',['d/4','e/4','f/4','g/4','a/4','bb/4','c/5','d/5']),'The scale uses B flat from the signature.',[62,64,65,67,69,70,72,74])
    ]),
    'tonic-triads-degrees':topic('Tonic triads and degrees','Use 1, 3 and 5.','Identify the home note and its chord.','Scale-degree numbers show where a note sits; the tonic triad uses degrees 1, 3 and 5.','Scale-degree numbers and root-position tonic triads in permitted keys.',[
      ex('C major tonic triad','Degrees 1, 3 and 5 are C, E and G.',triad('C',['c/4','e/4','g/4']),'The tonic C is at the bottom in root position.',[60,64,67]),
      ex('A major tonic triad','Degrees 1, 3 and 5 are A, C sharp and E.',triad('A',['a/3','c#/4','e/4']),'The sharp belongs to the third of the chord.',[57,61,64]),
      ex('D minor tonic triad','Degrees 1, 3 and 5 are D, F and A.',triad('Dm',['d/4','f/4','a/4']),'Minor quality comes from the lowered third.',[62,65,69]),
      ex('Scale degree 5','In C major, G is degree 5.',notes(['c/4','g/4']),'Count from C as degree 1.',[60,67])
    ]),
    'intervals-above-tonic':topic('Intervals above the tonic','Count the interval number.','Work above the home note only.','Count the starting letter as one: C to E is a third, not a second.','Interval numbers above the tonic in permitted keys.',[
      ex('C to D','C to D is a second.',notes(['c/4','d/4']),'Count C as one and D as two.',[60,62]),
      ex('C to E','C to E is a third.',notes(['c/4','e/4']),'Count C–D–E.',[60,64]),
      ex('D to A','D to A is a fifth.',notes(['d/4','a/4']),'Count D–E–F–G–A.',[62,69]),
      ex('A to A','A to the next A is an octave.',notes(['a/3','a/4']),'The same letter spans eight scale positions.',[57,69])
    ]),
    'musical-terms':topic('Musical terms and signs','Recognise the direction in the score.','Tempo, dynamics and repeats.','A term tells the performer how to shape the music; read the symbol before acting on it.','Additional common musical terms and signs from the cumulative syllabus.',[
      ex('Andante','At a walking pace.',rhythm([q(['c/5']),q(['d/5']),q(['e/5']),q(['f/5'])],[4,4]),'The music should move calmly, not rush.',[60,62,64,65]),
      ex('Piano','Play softly.',rhythm([q(['c/5']),q(['d/5']),q(['e/5']),q(['f/5'])],[4,4]),'p is a dynamic marking.',[60,62,64,65]),
      ex('Slur','Play the joined notes smoothly.',rhythm([q(['c/5']),q(['d/5']),q(['e/5']),q(['f/5'])],[4,4]),'A slur joins notes into one smooth gesture.',[60,62,64,65]),
      ex('Repeat sign','Play the marked section again.',rhythm([q(['c/5']),q(['d/5']),q(['e/5']),q(['f/5'])],[4,4]),'The repeat sign returns you to the matching start sign.',[60,62,64,65])
    ])
  });
})();
