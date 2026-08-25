(function(){
  const rotate=(items,n)=>items.slice(n).concat(items.slice(0,n));
  const choices=(answer,pool,n)=>rotate([answer,...pool.filter(item=>item!==answer).slice(0,3)],n%4);
  const registry={};
  Object.entries(window.ListeningDeskGrade3Topics||{}).forEach(([id,data])=>{
    const labels=data.examples.map(item=>item.label),rules=data.examples.map(item=>item.rule),details=data.examples.map(item=>item.explanation);
    const make=(prefix,prompt,answer,pool,item)=>({id:`g3-${id}-${prefix}`,prompt,answer,choices:choices(answer,pool,prefix.length),interaction:'choice',questionType:'choice',notation:item.notation,midis:item.parts[0][1],facts:[`ABRSM Grade 3 requirement: ${data.syllabus}`,`Rule: ${item.rule}`,`Detail: ${item.explanation}`]});
    const exercises=[];
    data.examples.forEach((item,index)=>exercises.push(make(`identify-${index+1}`,'Which musical feature is shown and heard?',item.label,labels,item)));
    data.examples.slice(0,3).forEach((item,index)=>exercises.push(make(`rule-${index+1}`,'Which statement correctly explains this example?',item.rule,rules,item)));
    data.examples.slice(1,4).forEach((item,index)=>exercises.push(make(`detail-${index+1}`,'Which description best matches the notation and sound?',item.explanation,details,item)));
    registry[id]={name:data.name,title:`Apply your<br><em>${data.name.toLowerCase()}.</em>`,lead:data.subtitle,question:'Read the notation, listen carefully, then choose the precise answer.',playLabel:'▶ Play displayed music',exercises};
  });
  window.ListeningDeskGrade3Practice=Object.freeze(registry);
})();
