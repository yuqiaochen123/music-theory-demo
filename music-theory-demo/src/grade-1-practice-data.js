(function(){
  const rotate=(items,n)=>items.slice(n).concat(items.slice(0,n));
  const choices=(answer,pool,n)=>rotate([answer,...pool.filter(item=>item!==answer).slice(0,3)],n%4);
  const registry={};

  Object.entries(window.ListeningDeskGrade1Topics||{}).forEach(([id,data])=>{
    const labels=data.examples.map(item=>item.label);
    const rules=data.examples.map(item=>item.rule);
    const explanations=data.examples.map(item=>item.explanation);
    const make=(kind,index,item)=>{
      const answer=kind==='identify'?item.label:kind==='rule'?item.rule:item.explanation;
      const pool=kind==='identify'?labels:kind==='rule'?rules:explanations;
      const prompt=kind==='identify'
        ? `Which ${data.name.toLowerCase()} idea is shown?`
        : kind==='rule'
          ? `Which rule correctly describes this ${data.name.toLowerCase()} example?`
          : `Which explanation best matches the displayed example?`;
      return {
        id:`g1-${id}-${kind}-${index+1}`,
        prompt,
        answer,
        choices:choices(answer,pool,kind.length+index),
        interaction:'choice',
        questionType:'choice',
        notation:item.notation,
        concept:item.concept,
        disablePlayback:Boolean(item.disablePlayback),
        midis:item.midis,
        facts:[`Topic: ${data.name}`,`Rule: ${item.rule}`,`Detail: ${item.explanation}`]
      };
    };
    const exercises=[];
    data.examples.forEach((item,index)=>exercises.push(make('identify',index,item)));
    data.examples.slice(0,3).forEach((item,index)=>exercises.push(make('rule',index,item)));
    data.examples.slice(1,4).forEach((item,index)=>exercises.push(make('detail',index,item)));
    registry[id]={
      name:data.name,
      title:`Apply your<br><em>${data.name.toLowerCase()}.</em>`,
      lead:data.subtitle,
      question:'Read the notation, listen carefully, then answer the specific question.',
      playLabel:'▶ Play displayed music',
      exercises
    };
  });

  window.ListeningDeskGrade1Practice=Object.freeze(registry);
})();
