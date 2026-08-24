(function(){
  const rotate=(items,offset)=>items.slice(offset).concat(items.slice(0,offset));
  const unique=(items)=>[...new Set(items)];
  const distract=(answer,pool,offset)=>{
    const alternatives=rotate(unique(pool.filter(item=>item!==answer)),offset).slice(0,3);
    return rotate([answer,...alternatives],offset%4);
  };
  const audioFor=example=>example.parts?.[0]?.[1]||[];
  const subjectByTopic={
    'rhythm-note-values':'rhythmic value or grouping',
    'time-signatures':'metre and rhythmic grouping',
    clefs:'pitch and clef',
    'clef-transposition':'octave transposition',
    accidentals:'accidental or enharmonic spelling',
    'major-keys':'key signature or scale',
    'minor-keys':'minor scale form',
    'scale-degrees':'scale-degree or chromatic feature',
    intervals:'interval',
    triads:'chord',
    'musical-terms':'performance direction',
    ornaments:'ornament',
    'orchestral-instruments':'instrument and clef pairing',
    'musical-observation':'musical feature'
  };
  const identificationTemplates=[
    subject=>`Which ${subject} is shown and heard?`,
    subject=>`How should the displayed and played ${subject} be identified?`,
    subject=>`Which option best names the ${subject} in the notation and playback?`,
    subject=>`Choose the most precise name for the displayed and played ${subject}.`,
    subject=>`What is the conventional name of this written and sounding ${subject}?`,
    subject=>`Which label matches both this ${subject} sign and its realization?`
  ];
  const accidentalText={b:'♭','#':'♯',bb:' double flat','##':' double sharp'};
  const formatPitch=key=>{
    const match=String(key||'').match(/^([a-g])(bb|##|b|#)?\/(\d)$/i);
    return match?`${match[1].toUpperCase()}${accidentalText[match[2]]||''}${match[3]}`:String(key||'note');
  };
  const writtenNotes=example=>(example.notation?.notes||example.notation?.events?.flatMap(event=>event.keys||[])||[]).map(formatPitch);
  const intervalDescription=example=>`the interval from ${writtenNotes(example).join(' to ')}`;
  const stimulusDescription=(topicId,example)=>{
    const pitches=writtenNotes(example);
    const meter=example.notation?.meter?.join('/');
    const descriptions={
      'rhythm-note-values':`${meter?`${meter} `:''}${example.notation?.events?.every(event=>event.rest)?'rest':'rhythm'}`,
      'time-signatures':`${meter} rhythmic grouping`,
      clefs:`${pitches.join(' and ')} in ${example.notation?.clef||'treble'} clef`,
      'clef-transposition':`${pitches.join('–')} in ${example.notation?.clef||'treble'} clef`,
      accidentals:`the written ${pitches.join(' and ')}`,
      'major-keys':`the displayed ${example.label} scale or key signature`,
      'minor-keys':`the displayed ${example.label} scale`,
      'scale-degrees':pitches.length?`the notes ${pitches.join('–')}`:'the displayed chromatic scale',
      intervals:intervalDescription(example),
      triads:`the chord ${pitches.join('–')}`,
      'musical-terms':`the ${example.label.toLowerCase()} marking`,
      ornaments:`the displayed ${example.label.toLowerCase()} sign`,
      'orchestral-instruments':`the ${example.label.toLowerCase()} part`,
      'musical-observation':`the displayed ${example.label.toLowerCase()} task`,
    };
    return descriptions[topicId]||'the displayed musical example';
  };
  const reasoningPrompt=(topicId,example)=>`Which statement correctly explains ${stimulusDescription(topicId,example)}?`;
  const applicationPrompt=(topicId,example)=>`Which statement correctly describes ${stimulusDescription(topicId,example)}?`;
  const identificationPrompt=(example,index,topicId)=>{
    if(topicId==='intervals')return `What interval is shown from ${writtenNotes(example).join(' to ')}?`;
    if(topicId!=='rhythm-note-values'||example.notation?.type!=='rhythm')return identificationTemplates[index](subjectByTopic[topicId]||'musical feature');
    const meter=(example.notation.meter||[]).join('/');
    const events=example.notation.events||[];
    if(events.length&&events.every(event=>event.rest))return `Which rest value is shown in this ${meter} bar?`;
    if(events.some(event=>event.tuplet))return `Which rhythmic grouping is shown at the beginning of this ${meter} bar?`;
    if(events.length>1)return `What is the value of the first note in this ${meter} bar?`;
    return `Which note value is shown in this ${meter} bar?`;
  };
  const trustedFacts=(data,example)=>[
    `ABRSM Grade 4 requirement: ${data.syllabus}`,
    `Musical detail: ${example.explanation}`,
    `Rule: ${example.rule}`
  ];
  const choice=(id,prompt,answer,choices,example,data,questionType)=>({
    id,prompt,answer,choices,questionType,interaction:'choice',notation:example.notation,midis:audioFor(example),playbackDurations:example.playbackDurations,facts:trustedFacts(data,example)
  });
  const matching=(id,data)=>({
    id,
    prompt:'Match each displayed excerpt to the most accurate musical label.',
    answer:'correct',questionType:'matching',interaction:'matching',
    labels:data.examples.map((example,index)=>({id:`label-${index}`,text:example.label})),
    targets:data.examples.map((example,index)=>({id:`target-${index}`,label:`Excerpt ${index+1}`,notation:example.notation,midis:audioFor(example),playbackDurations:example.playbackDurations})),
    expected:Object.fromEntries(data.examples.map((_,index)=>[`target-${index}`,`label-${index}`])),
    facts:[`ABRSM Grade 4 requirement: ${data.syllabus}`,...data.examples.slice(0,3).map(example=>`Musical detail: ${example.explanation}`)]
  });
  const listeningMatching=(id,data)=>{
    const examples=data.examples.slice(0,4);
    const reversed=[...examples].reverse();
    return {
      id,
      prompt:'Listen to and inspect each new excerpt, then match it to the most appropriate label.',
      answer:'correct',questionType:'listening-match',interaction:'matching',
      labels:examples.map((example,index)=>({id:`listen-label-${index}`,text:example.label})),
      targets:reversed.map((example,index)=>{
        const sourceIndex=examples.indexOf(example);
        return {id:`listen-target-${index}`,label:`Listening excerpt ${index+1}`,notation:example.notation,midis:audioFor(example),playbackDurations:example.playbackDurations,sourceIndex};
      }),
      expected:Object.fromEntries(reversed.map((example,index)=>[`listen-target-${index}`,`listen-label-${examples.indexOf(example)}`])),
      facts:[`ABRSM Grade 4 requirement: ${data.syllabus}`,...examples.map(example=>`Musical detail: ${example.explanation}`)]
    };
  };
  const phrase=(notes,clef)=>({
    type:'melody',notes:[...notes],slots:notes.map((_,index)=>index*4),durations:notes.map(()=>'q'),
    clef,key:'C',barCount:1
  });
  const notationEntry=(id,prompt,instruction,source,expected,facts)=>({
    id,prompt,instruction,answer:'correct',questionType:'construction',interaction:'notation-entry',
    source,expected,facts
  });

  const registry={};
  Object.entries(window.ListeningDeskGrade4Topics||{}).forEach(([topicId,data])=>{
    const labels=data.examples.map(example=>example.label);
    const rules=data.examples.map(example=>example.rule);
    const explanations=data.examples.map(example=>example.explanation);
    const exercises=[];
    data.examples.forEach((example,index)=>exercises.push(choice(
      `g4-${topicId}-identify-${index+1}`,
      identificationPrompt(example,index,topicId),
      example.label,distract(example.label,labels,index),example,data,'identification'
    )));
    const reasoningExamples=data.examples.length>4?data.examples.slice(0,2):data.examples;
    reasoningExamples.forEach((example,index)=>exercises.push(choice(
      `g4-${topicId}-reason-${index+1}`,
      reasoningPrompt(topicId,example),
      example.rule,distract(example.rule,rules,index+1),example,data,'reasoning'
    )));
    (data.examples.length>4?[2,4]:[0,2]).forEach((exampleIndex,index)=>{
      const example=data.examples[exampleIndex];
      exercises.push(choice(
        `g4-${topicId}-apply-${index+1}`,
        applicationPrompt(topicId,example),
        example.explanation,distract(example.explanation,explanations,index+2),example,data,'application'
      ));
    });
    exercises.push(matching(`g4-${topicId}-match`,data));
    exercises.push(listeningMatching(`g4-${topicId}-listening-match`,data));
    const evidenceExample=data.examples[3];
    exercises.push(choice(
      `g4-${topicId}-evidence`,
      applicationPrompt(topicId,evidenceExample),
      evidenceExample.explanation,
      distract(evidenceExample.explanation,explanations,1),
      evidenceExample,data,'evidence'
    ));
    registry[topicId]={
      name:data.name,title:`Apply your<br><em>${data.name.toLowerCase()}.</em>`,lead:data.subtitle,
      question:'Read, hear, compare and construct.',playLabel:'▶ Play displayed music',exercises
    };
  });
  registry['time-signatures'].exercises
    .filter(exercise=>exercise.questionType==='identification')
    .forEach(exercise=>{exercise.notation={...exercise.notation,showTimeSignature:false};});

  const observationIdentification=[
    {
      prompt:'Which major key has this key signature?',answer:'A major',
      choices:['A major','E major','D major','F-sharp major'],
      disablePlayback:true,midis:[],
      fact:'Three sharps form the key signature of A major.'
    },
    {
      prompt:'How are the six quavers grouped in this 6/8 bar?',answer:'Two groups of three quavers',
      choices:['Two groups of three quavers','Three groups of two quavers','One group of six quavers','A group of four and a group of two'],
      fact:'In 6/8, the beams show two compound beats, each containing three quavers.'
    },
    {
      prompt:'What interval is written from C4 to A4 in alto clef?',answer:'Major sixth',
      choices:['Major sixth','Minor sixth','Perfect fifth','Major seventh'],
      fact:'C to A spans six letter names and nine semitones, making a major sixth.'
    },
    {
      prompt:'Which chord is written in this A-minor extract?',answer:'Chord V (E major)',
      choices:['Chord V (E major)','Chord i (A minor)','Chord iv (D minor)','Chord VI (F major)'],
      fact:'E–G-sharp–B is E major, the dominant chord in A minor.'
    }
  ];
  registry['musical-observation'].exercises
    .filter(exercise=>exercise.questionType==='identification')
    .forEach((exercise,index)=>Object.assign(exercise,observationIdentification[index],{
      facts:[...exercise.facts,observationIdentification[index].fact]
    }));

  const transpositionFacts=[
    'ABRSM Grade 4 requirement: transpose a short melody by one octave between treble, alto and bass clefs.',
    'Rule: preserve every letter name, accidental and duration while changing each octave number by exactly one.'
  ];
  registry['clef-transposition'].exercises.splice(0,3,
    notationEntry(
      'g4-clef-transposition-write-1','Rewrite the three-note extract one octave lower in alto clef.',
      'Move every note down exactly one octave onto the alto-clef staff. Keep the rhythm unchanged.',
      phrase(['c/5','e/5','g/5'],'treble'),phrase(['c/4','e/4','g/4'],'alto'),transpositionFacts
    ),
    notationEntry(
      'g4-clef-transposition-write-2','Rewrite the three-note extract one octave higher in treble clef.',
      'Move every note up exactly one octave onto the treble-clef staff. Keep the rhythm unchanged.',
      phrase(['d/4','f/4','a/4'],'alto'),phrase(['d/5','f/5','a/5'],'treble'),transpositionFacts
    ),
    notationEntry(
      'g4-clef-transposition-write-3','Rewrite the three-note extract one octave higher in alto clef.',
      'Move every note up exactly one octave onto the alto-clef staff. Keep the rhythm unchanged.',
      phrase(['g/2','b/2','d/3'],'bass'),phrase(['g/3','b/3','d/4'],'alto'),transpositionFacts
    )
  );
  window.ListeningDeskGrade4Practice=Object.freeze(registry);
})();
