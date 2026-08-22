(function(){
  const rotate=(items,offset)=>items.slice(offset).concat(items.slice(0,offset));
  const unique=(items)=>[...new Set(items)];
  const distract=(answer,pool,offset)=>rotate(unique([answer,...pool.filter(item=>item!==answer)]),offset).slice(0,4);
  const audioFor=example=>example.parts?.[0]?.[1]||[];
  const identificationPrompt=(example,index,topicId)=>{
    if(topicId!=='rhythm-note-values'||example.notation?.type!=='rhythm')return `Study notation sample ${index+1}. Which musical label identifies it most precisely?`;
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
    id,prompt,answer,choices,questionType,interaction:'choice',notation:example.notation,midis:audioFor(example),facts:trustedFacts(data,example)
  });
  const matching=(id,data)=>({
    id,
    prompt:'Match each unnamed notation sample to the most accurate musical label.',
    answer:'correct',questionType:'matching',interaction:'matching',
    labels:data.examples.map((example,index)=>({id:`label-${index}`,text:example.label})),
    targets:data.examples.map((example,index)=>({id:`target-${index}`,label:`Notation sample ${index+1}`,notation:example.notation})),
    expected:Object.fromEntries(data.examples.map((_,index)=>[`target-${index}`,`label-${index}`])),
    facts:[`ABRSM Grade 4 requirement: ${data.syllabus}`,...data.examples.slice(0,3).map(example=>`Musical detail: ${example.explanation}`)]
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
    data.examples.forEach((example,index)=>exercises.push(choice(
      `g4-${topicId}-reason-${index+1}`,
      `For notation sample ${index+1}, which rule gives the correct Grade 4 reasoning?`,
      example.rule,distract(example.rule,rules,index+1),example,data,'reasoning'
    )));
    [0,2].forEach((exampleIndex,index)=>{
      const example=data.examples[exampleIndex];
      exercises.push(choice(
        `g4-${topicId}-apply-${index+1}`,
        `After reading and hearing application sample ${index+1}, which conclusion is justified?`,
        example.explanation,distract(example.explanation,explanations,index+2),example,data,'application'
      ));
    });
    exercises.push(matching(`g4-${topicId}-match`,data));
    exercises.push(choice(
      `g4-${topicId}-syllabus`,
      'Which curriculum requirement is tested by the notation and musical clue shown here?',
      data.syllabus,
      distract(data.syllabus,[
        'Regular simple and compound metre with correct grouping.',
        'Alto-clef reading and octave pitch transfer.',
        'Root-position tonic, subdominant and dominant triads.',
        'Diatonic intervals within one octave in permitted keys.'
      ],1),
      data.examples[3],data,'syllabus-application'
    ));
    registry[topicId]={
      name:data.name,title:`Apply your<br><em>${data.name.toLowerCase()}.</em>`,lead:data.subtitle,
      question:'Read, hear, compare and construct.',playLabel:'▶ Play displayed music',exercises
    };
  });
  window.ListeningDeskGrade4Practice=Object.freeze(registry);
})();
