(function(){
  const GRADE5_ONLY=/tenor clef|transposing instrument|cadence|first inversion|second inversion|six sharps|six flats/i;

  function seededRandom(seed){
    let state=(Number(seed)||4)>>>0;
    return ()=>{
      state=(state+0x6D2B79F5)>>>0;
      let value=state;
      value=Math.imul(value^(value>>>15),value|1);
      value^=value+Math.imul(value^(value>>>7),value|61);
      return ((value^(value>>>14))>>>0)/4294967296;
    };
  }

  function shuffle(items,random){
    const result=items.slice();
    for(let index=result.length-1;index>0;index-=1){
      const swapIndex=Math.floor(random()*(index+1));
      [result[index],result[swapIndex]]=[result[swapIndex],result[index]];
    }
    return result;
  }

  function selectPair(topicId,topic,random){
    const pool=shuffle(topic.exercises||[],random);
    const first=pool[0];
    const second=pool.find(item=>item.questionType!==first?.questionType);
    if(!first||!second)throw new RangeError(`${topicId} needs exercises with two different question types.`);
    return [first,second];
  }

  function masteryExercise(topicId,exercise,round){
    return {
      ...exercise,
      id:`mastery-${topicId}-${round+1}-${exercise.id}`,
      sourceTopicId:topicId,
      sourceExerciseId:exercise.id
    };
  }

  function buildGrade4MasteryAssessment(registry,{seed=4}={}){
    const topics=Object.entries(registry||{});
    if(topics.length!==14)throw new RangeError('Grade 4 mastery needs exactly 14 topics.');
    const random=seededRandom(seed);
    const pairs=topics.map(([topicId,topic])=>[topicId,selectPair(topicId,topic,random)]);
    const firstRound=shuffle(pairs.map(([topicId,pair])=>masteryExercise(topicId,pair[0],0)),random);
    let secondRound=shuffle(pairs.map(([topicId,pair])=>masteryExercise(topicId,pair[1],1)),random);
    if(firstRound[firstRound.length-1]?.sourceTopicId===secondRound[0]?.sourceTopicId){
      secondRound=secondRound.slice(1).concat(secondRound[0]);
    }
    const exercises=firstRound.concat(secondRound);
    if(exercises.some(item=>!item.facts?.length))throw new TypeError('Every mastery exercise needs trusted tutor facts.');
    if(GRADE5_ONLY.test(JSON.stringify(exercises)))throw new RangeError('Grade 5-only material cannot enter Grade 4 mastery.');
    return Object.freeze({id:'grade-4-mastery',name:'Grade 4 mastery check',exercises:Object.freeze(exercises)});
  }

  function createMasteryState(exercises){
    const exerciseTopics={};
    const topicOrder=[];
    for(const exercise of exercises||[]){
      if(!exercise.id||!exercise.sourceTopicId)throw new TypeError('Mastery exercises need an ID and source topic.');
      exerciseTopics[exercise.id]=exercise.sourceTopicId;
      if(!topicOrder.includes(exercise.sourceTopicId))topicOrder.push(exercise.sourceTopicId);
    }
    return {total:(exercises||[]).length,completed:0,firstTryCorrect:0,attempts:{},firstResults:{},completedIds:[],exerciseTopics,topicOrder};
  }

  function recordMasteryAnswer(state,{exerciseId,topicId,isCorrect}){
    if(state.completedIds.includes(exerciseId))return state;
    if(state.exerciseTopics[exerciseId]!==topicId)throw new RangeError('The mastery answer topic does not match its exercise.');
    const priorAttempts=state.attempts[exerciseId]||0;
    const firstAttempt=priorAttempts===0;
    const correct=Boolean(isCorrect);
    return {
      ...state,
      completed:state.completed+(correct?1:0),
      firstTryCorrect:state.firstTryCorrect+(firstAttempt&&correct?1:0),
      attempts:{...state.attempts,[exerciseId]:priorAttempts+1},
      firstResults:firstAttempt?{...state.firstResults,[exerciseId]:correct}:state.firstResults,
      completedIds:correct?state.completedIds.concat(exerciseId):state.completedIds
    };
  }

  function diagnoseMasteryTopics(state,topicNames={}){
    return state.topicOrder.map(topicId=>{
      const exerciseIds=Object.keys(state.exerciseTopics).filter(id=>state.exerciseTopics[id]===topicId);
      const firstTryCorrect=exerciseIds.filter(id=>state.firstResults[id]===true).length;
      const total=exerciseIds.length;
      const status=firstTryCorrect===total?'secure':firstTryCorrect===0?'needs-review':'developing';
      return {topicId,name:topicNames[topicId]||topicId,firstTryCorrect,total,status};
    });
  }

  function escapeHtml(value){
    return String(value).replace(/[&<>"']/g,character=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[character]);
  }

  function renderMasteryResults(diagnoses,{firstTryCorrect,total}){
    const statusLabels={secure:'Secure',developing:'Developing','needs-review':'Needs review'};
    const rows=diagnoses.map(diagnosis=>{
      const topicId=encodeURIComponent(diagnosis.topicId);
      const review=diagnosis.status==='secure'?'':`<div class="mastery-topic-result__actions"><a href="topic.html?grade=4&amp;topic=${topicId}">Review lesson</a><a href="practice.html?grade=4&amp;topic=${topicId}">Practise topic</a></div>`;
      return `<li class="mastery-topic-result" data-status="${diagnosis.status}"><div><strong>${escapeHtml(diagnosis.name)}</strong><span>${diagnosis.firstTryCorrect}/${diagnosis.total} first try</span></div><b>${statusLabels[diagnosis.status]}</b>${review}</li>`;
    }).join('');
    return `<section class="mastery-results" aria-labelledby="mastery-results-heading"><p class="eyebrow">Grade 4 diagnostic</p><h2 id="mastery-results-heading">Your mastery check results</h2><p class="mastery-results__summary"><strong>${firstTryCorrect} of ${total}</strong> correct on the first try. Use the topic review links below to choose your next step.</p><ul>${rows}</ul><a class="mastery-results__return" href="grade-4.html">Return to Grade 4 contents</a></section>`;
  }

  const api=Object.freeze({buildGrade4MasteryAssessment,createMasteryState,diagnoseMasteryTopics,recordMasteryAnswer,renderMasteryResults});
  if(typeof window!=='undefined')window.ListeningDeskGrade4Mastery=api;
})();
