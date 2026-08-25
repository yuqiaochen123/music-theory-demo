(function(){
  const rotate=(items,n)=>items.slice(n).concat(items.slice(0,n));
  const options=(answer,pool,n)=>rotate([answer,...pool.filter(item=>item!==answer).slice(0,3)],n%4);
  const trimStop=text=>text.replace(/[.?!]+$/,'');
  const prompts={
    'simple-time':{
      identify:item=>item.label==='Minim beat split'?'How is the first minim beat divided in this bar?':'Which missing time signature completes this bar of minim beats?',
      rule:()=> 'How are the minim beats counted or divided in this bar?',
      detail:()=> 'Why does the displayed rhythm fit this minim-beat metre?'
    },
    triplets:{
      identify:()=> 'Which type of triplet is shown at the start of this bar?',
      rule:()=> 'How much beat-time does the displayed triplet occupy?',
      detail:()=> 'How should the displayed triplet be counted or performed?'
    },
    'ledger-lines':{
      identify:()=> 'Which written note is shown on this stave?',
      rule:()=> 'Where does this note sit in the displayed clef?',
      detail:()=> 'How can this ledger-line note be identified?'
    },
    'relative-keys':{
      identify:()=> 'Which pair of relative major and minor keys is shown by this scale?',
      rule:()=> 'Which key-signature fact identifies these relative major and minor keys?',
      detail:()=> 'How are the displayed relative major and minor keys connected?'
    },
    'harmonic-minor':{
      identify:()=> 'Which harmonic-minor scale or leading-note pattern is shown?',
      rule:()=> 'Which seventh scale degree is raised in this harmonic-minor example?',
      detail:()=> 'Why is the seventh scale degree raised in this example?'
    },
    'grade-2-keys':{
      identify:()=> 'Which key is shown by this scale and key signature?',
      rule:()=> 'Which accidentals belong to the displayed key?',
      detail:()=> 'How does the key signature affect the displayed scale?'
    },
    'tonic-triads-degrees':{
      identify:()=> 'Which tonic triad or numbered scale degree is shown?',
      rule:()=> 'Which notes or scale degrees form the displayed example?',
      detail:()=> 'How is the tonic, scale degree, or chord quality identified here?'
    },
    'intervals-above-tonic':{
      identify:()=> 'What interval is shown above the tonic?',
      rule:()=> 'How many letter names does the displayed interval span?',
      detail:()=> 'How should this interval be counted from the tonic?'
    },
    'musical-terms':{
      identify:item=>`Which musical term means “${trimStop(item.rule)}”?`,
      rule:item=>`What does ${item.label} tell the performer to do?`,
      detail:item=>`Which explanation describes ${item.label}?`
    }
  };
  const registry={};
  Object.entries(window.ListeningDeskGrade2Topics||{}).forEach(([id,data])=>{
    const labels=data.examples.map(item=>item.label),rules=data.examples.map(item=>item.rule),details=data.examples.map(item=>item.explanation);
    const make=(kind,index,answer,pool,item)=>{
      const isTerm=id==='musical-terms';
      const hidesRequestedMeter=id==='simple-time'&&kind==='identify'&&/^\d+\/\d+$/.test(answer);
      return {
        id:`g2-${id}-${kind}-${index+1}`,
        prompt:prompts[id][kind](item),
        answer,
        choices:options(answer,pool,kind.length+index),
        interaction:'choice',
        questionType:'choice',
        notation:hidesRequestedMeter?{...item.notation,showTimeSignature:false}:item.notation,
        concept:isTerm?{symbol:kind==='identify'?item.rule:item.label,detail:kind==='identify'?'Choose the musical term that gives this instruction.':'Choose what this musical term or sign means.'}:undefined,
        disablePlayback:isTerm,
        midis:item.parts[0][1],
        facts:[`Topic: ${data.name}`,`Rule: ${item.rule}`,`Detail: ${item.explanation}`]
      };
    };
    const exercises=[];
    data.examples.forEach((item,index)=>exercises.push(make('identify',index,item.label,labels,item)));
    data.examples.slice(0,3).forEach((item,index)=>exercises.push(make('rule',index,item.rule,rules,item)));
    data.examples.slice(1,4).forEach((item,index)=>exercises.push(make('detail',index,item.explanation,details,item)));
    registry[id]={name:data.name,title:`Apply your<br><em>${data.name.toLowerCase()}.</em>`,lead:data.subtitle,question:'Read the notation, listen carefully, then answer the specific question.',playLabel:'▶ Play displayed music',exercises};
  });
  window.ListeningDeskGrade2Practice=Object.freeze(registry);
})();
