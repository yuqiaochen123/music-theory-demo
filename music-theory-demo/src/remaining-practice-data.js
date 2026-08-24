(function(){
  const midi=pitch=>{const match=pitch.match(/^([a-g])(bb|##|b|#)?\/(\d)$/),pc={c:0,d:2,e:4,f:5,g:7,a:9,b:11},alter={bb:-2,b:-1,"":0,"#":1,"##":2};return 12*(Number(match[3])+1)+pc[match[1]]+alter[match[2]||""]};
  const melody=(notes,clef='treble',key=null,durations=null)=>({type:'melody',notes,slots:notes.map((_,index)=>index*4),durations:durations||notes.map(()=>"q"),clef,key,barCount:Math.max(1,Math.ceil(notes.length/4))});
  const rhythm=(events,meter=[4,4])=>({type:'rhythm',meter,events,showTimeSignature:true});
  const score=(id,prompt,answer,choices,notation,midis)=>({id,prompt,answer,choices,notation,midis});
  const q=(id,prompt,answer,choices,symbol,detail)=>({id,prompt,answer,choices,musical:false,concept:{symbol,kicker:'Question clue',detail}});
  const matching=(id,prompt,labels,targets,expected)=>({id,prompt,answer:'correct',interaction:'matching',labels,targets,expected});
  const entry=(id,prompt,instruction,source,expected)=>({id,prompt,instruction,answer:'correct',interaction:'notation-entry',source,expected});
  const phrase=(notes,key='C',clef='treble')=>({...melody(notes,clef,key),key,clef});
  const bank=(name,noun,lead,items)=>({name,title:`Identify the<br><em>${noun}.</em>`,lead,question:`Identify the ${noun}.`,playLabel:'▶ Play example',answers:[],exercises:items});

  const rnv=[
    score('rnv-1','How many quavers equal the dotted crotchet shown?','3',['2','3','4'],rhythm([{keys:['c/5'],duration:'q',dots:1},{rest:true,duration:'q'},{rest:true,duration:'8'}],[3,4]),[72]),
    score('rnv-2','How many crotchet beats does the minim last?','2',['1','2','4'],rhythm([{keys:['d/5'],duration:'h'},{rest:true,duration:'h'}]),[74]),
    score('rnv-3','What does the curved line between these notes do?','Joins durations of the same pitch',['Joins durations of the same pitch','Raises a pitch','Shortens a note'],rhythm([{keys:['e/5'],duration:'q',tieToNext:true},{keys:['e/5'],duration:'q'},{rest:true,duration:'h'}]),[76,76]),
    score('rnv-4','The bracketed group forms a…','Triplet',['Triplet','Duplet','Tie'],rhythm([{keys:['c/5'],duration:'8',tuplet:true},{keys:['d/5'],duration:'8',tuplet:true},{keys:['e/5'],duration:'8',tuplet:true},{rest:true,duration:'h'},{rest:true,duration:'q'}]),[72,74,76]),
    score('rnv-5','How many semiquavers fill one crotchet beat?','4',['2','3','4'],rhythm([{keys:['c/5'],duration:'16',group:1},{keys:['d/5'],duration:'16',group:1},{keys:['e/5'],duration:'16',group:1},{keys:['f/5'],duration:'16',group:1},{rest:true,duration:'h'},{rest:true,duration:'q'}]),[72,74,76,77]),
    score('rnv-6','How many crotchet beats does the dotted minim last?','3',['2','3','4'],rhythm([{keys:['c/5'],duration:'h',dots:1},{rest:true,duration:'q'}]),[72]),
    score('rnv-7','What does the engraved rest measure?','Silence',['Silence','Pitch','Tempo'],rhythm([{rest:true,duration:'q'},{keys:['g/4'],duration:'q'},{rest:true,duration:'h'}]),[67]),
    score('rnv-8','The two tied crotchets equal which note value?','Minim',['Quaver','Minim','Semibreve'],rhythm([{keys:['g/4'],duration:'q',tieToNext:true},{keys:['g/4'],duration:'q'},{rest:true,duration:'h'}]),[67,67]),
    score('rnv-9','A double dot adds what fractions to the original value?','One half and one quarter',['One half only','One half and one quarter','Two whole beats'],rhythm([{keys:['a/4'],duration:'h',dots:2},{rest:true,duration:'8'}]),[69]),
    score('rnv-10','Which note value fills this 4/4 bar alone?','Semibreve',['Minim','Semibreve','Crotchet'],rhythm([{keys:['c/5'],duration:'w'}]),[72])
  ];

  const clefs=[
    score('clef-1','Name the note shown in treble clef.','G4',['E4','G4','B4'],melody(['g/4']),[67]),
    score('clef-2','Name the note shown in bass clef.','F3',['D3','F3','A3'],melody(['f/3'],'bass'),[53]),
    score('clef-3','Name the note on the middle line of alto clef.','C4',['A3','C4','E4'],melody(['c/4'],'alto'),[60]),
    score('clef-4','Name the note on the fourth line of tenor clef.','C4',['A3','C4','E4'],melody(['c/4'],'tenor'),[60]),
    q('clef-5','Which clef is commonly used by viola?','Alto clef',['Alto clef','Bass clef','Treble clef'],'Viola','Its central register fits alto clef.'),
    q('clef-6','Which clef is commonly used for cello low notes?','Bass clef',['Bass clef','Alto clef','Treble clef'],'Cello','Low register uses bass clef.'),
    score('clef-7','A melody rises to this treble-clef note. Name it.','D5',['B4','D5','F5'],melody(['b/4','d/5']),[71,74]),
    score('clef-8','Which pitch is written below the bass stave?','A2',['F2','A2','C3'],melody(['a/2'],'bass'),[45]),
    score('clef-9','Read the upper note of this alto-clef third.','E4',['C4','D4','E4'],melody(['c/4','e/4'],'alto'),[60,64]),
    score('clef-10','Read the lower note of this tenor-clef fourth.','G3',['G3','C4','D4'],melody(['g/3','c/4'],'tenor'),[55,60])
  ];

  const clefTransposition=[
    entry('ct-1','Rewrite the extract one octave higher.','Transpose every note up one octave. Keep the rhythm unchanged.',phrase(['c/4','e/4','g/4']),phrase(['c/5','e/5','g/5'])),
    entry('ct-2','Rewrite the extract in bass clef at the same sounding pitch.','Change the clef, not the sound or rhythm.',phrase(['c/4','d/4','g/4']),phrase(['c/4','d/4','g/4'],'C','bass')),
    entry('ct-3','Rewrite the extract one octave higher.','Preserve each letter name, accidental, and note value.',phrase(['c/4','d/4','f#/4']),phrase(['c/5','d/5','f#/5'])),
    score('ct-4','Which pitch is this note transposed down one octave?','G3',['F3','G3','G5'],melody(['g/4']),[67]),
    score('ct-5','Which pitch is this note transposed up one octave?','B4',['A4','B4','C4'],melody(['b/3']),[59]),
    q('ct-6','Does octave transposition change rhythm?','No',['Yes','No','Only tied notes'],'♩ = ♩','Durations remain identical.'),
    score('ct-7','This note is middle C in alto clef. Which line is it on?','Third',['Second','Third','Fourth'],melody(['c/4'],'alto'),[60]),
    score('ct-8','This note is middle C in tenor clef. Which line is it on?','Fourth',['Third','Fourth','Fifth'],melody(['c/4'],'tenor'),[60]),
    score('ct-9','After octave transposition, what happens to the sharp?','It remains',['It disappears','It remains','It becomes flat'],melody(['f#/4']),[66]),
    q('ct-10','A melody moved entirely up an octave keeps its…','Intervals',['Register','Intervals','Clef'],'same shape','Every pitch moves equally.')
  ];

  const transposingInstruments=[
    entry('ti-1','Write the concert pitch for this B-flat instrument part.','Transpose the written extract down a major second.',phrase(['d/4','f#/4','a/4'],'D'),phrase(['c/4','e/4','g/4'],'C')),
    entry('ti-2','Write the concert pitch for this horn in F part.','Transpose the written extract down a perfect fifth.',phrase(['g/4','b/4','d/5'],'G'),phrase(['c/4','e/4','g/4'],'C')),
    entry('ti-3','Write a B-flat instrument part for this concert-pitch extract.','Transpose the concert extract up a major second.',phrase(['c/4','e/4','g/4'],'C'),phrase(['d/4','f#/4','a/4'],'D')),
    q('ti-4','Which is a B-flat instrument?','Trumpet in B-flat',['Flute','Trumpet in B-flat','Oboe'],'B♭ trumpet','Its written C sounds B-flat.'),
    q('ti-5','Which commonly sounds at concert pitch?','Flute',['Flute','Horn in F','Clarinet in A'],'Flute','Written and sounding pitch agree.'),
    q('ti-6','To write for B-flat clarinet from concert pitch, transpose…','Up a major second',['Down a major second','Up a major second','Up a fifth'],'Concert → written','Reverse its sounding transposition.'),
    q('ti-7','To find horn in F concert pitch, transpose written pitch…','Down a perfect fifth',['Up a perfect fifth','Down a perfect fifth','Down an octave'],'Written → concert','The horn sounds lower.'),
    score('ti-8','A B-flat trumpet reads this D. What is the concert pitch?','C',['C','D','E'],melody(['d/4']),[62]),
    score('ti-9','An A clarinet reads this E. What is the concert pitch?','C-sharp',['C','C-sharp','E-flat'],melody(['e/4']),[64]),
    q('ti-10','Why transpose instrument parts?','So intended concert pitches sound',['To change rhythm','So intended concert pitches sound','To remove key signatures'],'score alignment','Written parts compensate for instrument pitch.')
  ];

  const accidentals=[
    score('acc-1','What does the accidental do to this written note?','Raises it one semitone',['Raises it one semitone','Raises it two semitones','Lowers it one semitone'],melody(['f#/4']),[66]),
    score('acc-2','How far does this double flat lower the note?','Two semitones',['One semitone','Two semitones','Three semitones'],melody(['gbb/4']),[65]),
    score('acc-3','Which spelling is enharmonic with the shown C-sharp?','D-flat',['B-sharp','D-flat','D-sharp'],melody(['c#/4']),[61]),
    score('acc-4','Which natural pitch sounds the same as the shown B-sharp?','C',['B-flat','C','C-sharp'],melody(['b#/4']),[72]),
    score('acc-5','What does the natural sign do here?','Cancels the sharp',['Raises a semitone','Cancels the sharp','Lowers two semitones'],melody(['f#/4','f/4']),[66,65]),
    score('acc-6','How long does the first accidental normally remain in force?','To the end of the bar',['For one note only','To the end of the bar','To the end of the piece'],melody(['f#/4','f#/4']),[66,66]),
    score('acc-7','Which natural pitch is enharmonic with C-flat?','B',['B','B-flat','C'],melody(['cb/4']),[59]),
    score('acc-8','How far does the double sharp raise this note?','Two semitones',['One semitone','Two semitones','One octave'],melody(['f##/4']),[67]),
    score('acc-9','Why is E-sharp the correct leading note in F-sharp major?','It preserves scale letter order',['It sounds higher than F','It preserves scale letter order','It shortens the note'],melody(['e#/5','f#/5'], 'treble','F#'),[77,78]),
    score('acc-10','Which natural pitch sounds like A double flat?','G',['F-sharp','G','A-flat'],melody(['abb/4']),[67])
  ];

  const termsMatch=matching('term-1','Match each direction to its performance meaning.',[{id:'allegro',text:'Allegro'},{id:'dim',text:'Diminuendo'},{id:'ff',text:'Fortissimo'},{id:'rit',text:'Ritardando'}],[{id:'fast',label:'Fast and lively'},{id:'softer',label:'Gradually softer'},{id:'loud',label:'Very loud'},{id:'slower',label:'Gradually slower'}],{fast:'allegro',softer:'dim',loud:'ff',slower:'rit'});
  const musicalTerms=[termsMatch,q('term-2','What does cantabile mean?','In a singing style',['Detached','In a singing style','Very fast'],'cantabile','Shape a lyrical line.'),q('term-3','What does staccato request?','Short and detached',['Smooth and connected','Short and detached','Louder'],'· · ·','Articulation changes note length.'),q('term-4','What does legato request?','Smoothly connected',['Smoothly connected','Strongly accented','Slower'],'⌒','Connect the phrase.'),q('term-5','What does a tempo mean?','Return to the previous tempo',['Become faster','Return to the previous tempo','Pause'],'a tempo','Cancel a temporary tempo change.'),q('term-6','What does marcato mean?','Marked and emphasized',['Fading away','Marked and emphasized','Sweetly'],'marcato','Give notes clear emphasis.'),q('term-7','What does dolce mean?','Sweetly',['Angrily','Sweetly','Very quickly'],'dolce','Character direction.'),q('term-8','What does crescendo mean?','Gradually louder',['Gradually louder','Immediately loud','Gradually faster'],'cresc.','Dynamic change.'),q('term-9','What does adagio mean?','Slow',['Fast','Slow','Detached'],'adagio','Tempo direction.'),q('term-10','What does pianissimo mean?','Very soft',['Very soft','Moderately loud','Very loud'],'pp','Dynamic level.')];

  const ornamentMatch=matching('orn-1','Match each ornament symbol and realization to its name.',[{id:'trill',text:'Trill'},{id:'turn',text:'Turn'},{id:'mordent',text:'Mordent'},{id:'acciaccatura',text:'Acciaccatura'}],[
    {id:'tr',label:'Excerpt 1',notation:{type:'ornament',kind:'trill',principal:'d/5'},midis:[74,76,74,76,74,76,74,76,74],playbackDurations:[.1,.1,.1,.1,.1,.1,.1,.1,.28]},
    {id:'turn-symbol',label:'Excerpt 2',notation:{type:'ornament',kind:'turn',principal:'d/5'},midis:[76,74,73,74],playbackDurations:[.15,.15,.15,.3]},
    {id:'mordent-symbol',label:'Excerpt 3',notation:{type:'ornament',kind:'upper-mordent',principal:'e/5'},midis:[76,77,76],playbackDurations:[.11,.11,.34]},
    {id:'slash-note',label:'Excerpt 4',notation:{type:'ornament',kind:'acciaccatura',principal:'e/5',grace:'d/5'},midis:[74,76],playbackDurations:[.08,.52]}
  ],{tr:'trill','turn-symbol':'turn','mordent-symbol':'mordent','slash-note':'acciaccatura'});
  const ornaments=[ornamentMatch,q('orn-2','Which grace note leans expressively on the principal note?','Appoggiatura',['Appoggiatura','Acciaccatura','Turn'],'♫ → ♩','It takes time from the principal note.'),q('orn-3','A mordent makes…','A rapid single turn',['Repeated alternation','A rapid single turn','A long pause'],'𝆝','Principal and neighbouring note.'),q('orn-4','A turn circles around…','The principal note',['The tonic only','The principal note','The bass note'],'∽','Upper, principal, lower, principal.'),q('orn-5','Auxiliary notes follow the…','Key signature and accidentals',['Tempo only','Key signature and accidentals','Dynamic marking'],'♯ ♭','Pitch spelling still applies.'),q('orn-6','The structural note being decorated is the…','Principal note',['Passing note','Principal note','Pedal note'],'●','The ornament resolves around it.'),q('orn-7','Which ornament usually has the symbol tr?','Trill',['Turn','Trill','Mordent'],'tr','Standard abbreviation.'),q('orn-8','Which grace note usually has a slash?','Acciaccatura',['Acciaccatura','Appoggiatura','Trill'],'♪̸','The slash indicates crushed delivery.'),q('orn-9','Ornaments mainly add…','Decoration and expression',['A new key signature','Decoration and expression','A new time signature'],'✨','They elaborate existing notes.'),q('orn-10','Which ornament repeatedly alternates with the upper note?','Trill',['Trill','Mordent','Turn'],'tr','Rapid alternation.')];

  const familyMatch=matching('vi-1','Match each performer to its family or range.',[{id:'violin',text:'Violin'},{id:'oboe',text:'Oboe'},{id:'trumpet',text:'Trumpet'},{id:'soprano',text:'Soprano'}],[{id:'strings',label:'Strings'},{id:'woodwind',label:'Woodwind'},{id:'brass',label:'Brass'},{id:'highest',label:'Highest choir voice'}],{strings:'violin',woodwind:'oboe',brass:'trumpet',highest:'soprano'});
  const voices=[familyMatch,q('vi-2','Which is the lowest standard choir voice?','Bass',['Alto','Tenor','Bass'],'S A T B','High to low.'),q('vi-3','A saxophone belongs to which family?','Woodwind',['Woodwind','Brass','Percussion'],'Saxophone','It uses a reed.'),q('vi-4','A timpani belongs to which family?','Percussion',['Percussion','Brass','Strings'],'Timpani','Its membrane is struck.'),q('vi-5','Which instrument commonly reads alto clef?','Viola',['Violin','Viola','Flute'],'𝄡','Its register suits the clef.'),q('vi-6','Which instrument uses a double reed?','Oboe',['Clarinet','Oboe','Flute'],'Oboe','Two reeds vibrate together.'),q('vi-7','Which voice lies between soprano and tenor?','Alto',['Alto','Bass','Baritone'],'S A T B','Standard choral order.'),q('vi-8','Which family produces sound by buzzing lips?','Brass',['Brass','Woodwind','Percussion'],'Horn','Lips vibrate into a mouthpiece.'),q('vi-9','Which string instrument commonly reads bass clef?','Cello',['Violin','Cello','Flute'],'Cello','Its low register suits bass clef.'),q('vi-10','Which woodwind instrument has no reed?','Flute',['Oboe','Clarinet','Flute'],'Flute','Air splits across the embouchure hole.')];

  const observationMatch=matching('mo-1','Match each musical pattern to the analytical term.',[{id:'motif',text:'Motif'},{id:'sequence',text:'Sequence'},{id:'pedal',text:'Pedal'},{id:'imitation',text:'Imitation'}],[{id:'short',label:'Short recurring idea'},{id:'new-pitch',label:'Pattern repeated at a new pitch'},{id:'held-bass',label:'Repeated bass under changing harmony'},{id:'passed',label:'Idea passed to another part'}],{short:'motif','new-pitch':'sequence','held-bass':'pedal',passed:'imitation'});
  const observation=[observationMatch,q('mo-2','One melody with chordal support is…','Melody and accompaniment',['Monophony','Melody and accompaniment','Imitation'],'line + chords','One line remains primary.'),q('mo-3','Several independent melodic lines create…','Polyphonic texture',['Monophonic texture','Polyphonic texture','A key signature'],'lines ↕','Lines have separate identities.'),q('mo-4','A phrase ending V–I uses a…','Perfect cadence',['Perfect cadence','Imperfect cadence','Sequence'],'V → I','Dominant resolves to tonic.'),q('mo-5','Two performers moving in the same rhythm create…','Homorhythmic texture',['Imitation','Homorhythmic texture','Sequence'],'♩ ♩ / ♩ ♩','Rhythms align vertically.'),q('mo-6','Moving to a new key is called…','Modulation',['Transposition','Modulation','Inversion'],'Key A → Key B','The tonal centre changes.'),q('mo-7','The strongest evidence for analysis comes from…','Features visible in the score',['Personal preference','Features visible in the score','The page number'],'evidence','Name the exact musical feature.'),q('mo-8','One unaccompanied melodic line has which texture?','Monophonic',['Monophonic','Polyphonic','Homorhythmic'],'single line','Only one melodic line sounds.'),q('mo-9','A melody passed between parts is…','Imitation',['Imitation','Staccato','Modulation'],'a → part 2','Another part copies the idea.'),q('mo-10','A pattern repeated at a new pitch level is a…','Sequence',['Sequence','Tie','Pedal'],'a → a↑','Shape repeats after transposition.')];

  const combinedPractice={...window.ListeningDeskPractice,
    'rhythm-note-values':bank('Rhythm and note values','rhythm','Read, hear and calculate authentic notation.',rnv),
    clefs:bank('Clefs and note reading','clef','Read pitches from real treble, bass, alto and tenor staves.',clefs),
    'clef-transposition':bank('Clef and octave transposition','transposition','Write answers directly on the destination staff.',clefTransposition),
    'transposing-instruments':bank('Transposing instruments','concert pitch','Convert written and sounding extracts, then check your notation.',transposingInstruments),
    accidentals:bank('Accidentals and enharmonic equivalents','spelling','Read each accidental in real notation and compare its sound.',accidentals),
    'musical-terms':bank('Musical terms and signs','term','Match and interpret performance directions.',musicalTerms),
    ornaments:bank('Ornaments','ornament','Match ornament symbols and understand their performance.',ornaments),
    'voices-instruments':bank('Voices and instruments','performer','Classify ranges, families, clefs and sound production.',voices),
    'musical-observation':bank('General musical observation','observation','Match and identify structural musical evidence.',observation)
  };

  const derivedNotation=(topicId,item)=>{
    if(item.notation)return item.notation;
    if(topicId==='intervals'&&item.notes)return {type:'interval',notes:item.notes};
    if(topicId==='cadences'&&item.chords)return {type:'cadence',key:item.key,chords:item.chords};
    if(topicId==='triads'&&item.notes)return {type:'triad',key:item.key,notes:item.notes,showAccidentals:!item.key};
    if(topicId==='time-signatures'&&item.events)return {type:'rhythm',meter:item.meter,events:item.events,showTimeSignature:false};
    if(['scales','scale-degrees'].includes(topicId)&&item.notes)return {type:'scale',notes:item.notes,descendingNotes:item.descendingNotes,key:item.key};
    return null;
  };
  const varietyMatch=(topicId,practiceBank)=>{
    const candidates=practiceBank.exercises.filter(item=>item.interaction!=='matching'&&item.interaction!=='notation-entry');
    const unique=[];
    for(const item of candidates){
      if(unique.some(candidate=>candidate.answer===item.answer))continue;
      const notation=derivedNotation(topicId,item);
      const playbackMidis=item.midis||item.audio?.flat();
      if((notation&&playbackMidis?.length)||item.concept)unique.push({...item,midis:playbackMidis,derivedNotation:notation});
      if(unique.length===4)break;
    }
    const reversed=[...unique].reverse();
    return matching(
      `${topicId}-variety-match`,
      unique.some(item=>item.derivedNotation)
        ? 'Match each fresh score or listening excerpt to its musical answer.'
        : 'Match each fresh musical clue to its most appropriate term.',
      unique.map((item,index)=>({id:`variety-label-${index}`,text:item.answer})),
      reversed.map((item,index)=>{
        const rhythmEvents=topicId==='time-signatures'?item.events:null;
        const unitSeconds=item.unit?0.44*4/item.unit:0.24;
        return {
          id:`variety-target-${index}`,
          label:item.derivedNotation?`New excerpt ${index+1}`:item.concept.detail,
          notation:item.derivedNotation,
          midis:rhythmEvents?rhythmEvents.map((event,eventIndex)=>event.rest?null:item.midis[eventIndex]):item.midis,
          playbackDurations:rhythmEvents?item.durations.map(duration=>duration*unitSeconds):item.playbackDurations
        };
      }),
      Object.fromEntries(reversed.map((item,index)=>[`variety-target-${index}`,`variety-label-${unique.indexOf(item)}`]))
    );
  };
  Object.entries(combinedPractice).forEach(([topicId,practiceBank])=>{
    practiceBank.exercises.push(varietyMatch(topicId,practiceBank));
  });
  window.ListeningDeskPractice=Object.freeze(combinedPractice);
})();
