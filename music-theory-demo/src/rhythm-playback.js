(function(){
  const QUARTER_UNITS=Object.freeze({'1/2':8,w:4,h:2,q:1,'8':.5,'16':.25,'32':.125});
  const SEMITONES=Object.freeze({c:0,d:2,e:4,f:5,g:7,a:9,b:11});

  function dottedUnits(base,dots=0){
    let units=base,addition=base/2;
    for(let index=0;index<dots;index+=1){units+=addition;addition/=2}
    return units;
  }

  function eventQuarterUnits(event){
    const base=QUARTER_UNITS[event.duration];
    if(!base)throw new Error(`Unsupported rhythm duration: ${event.duration}`);
    const dotted=dottedUnits(base,event.dots||0);
    if(event.tuplet===2)return dotted*1.5;
    if(event.tuplet===3||event.tuplet===true)return dotted*(2/3);
    return dotted;
  }

  function writtenPitchToMidi(pitch){
    if(!pitch)return null;
    const match=String(pitch).toLowerCase().match(/^([a-g])(#{1,2}|b{1,2})?\/(\d)$/);
    if(!match)return null;
    const accidental=(match[2]||'').split('').reduce((sum,sign)=>sum+(sign==='#'?1:-1),0);
    return (Number(match[3])+1)*12+SEMITONES[match[1]]+accidental;
  }

  function buildRhythmTimeline(specification,{quarterSeconds=.48}={}){
    let cursor=0;
    let previousSource=null;
    const timeline=[];
    (specification.events||[]).forEach(event=>{
      const duration=eventQuarterUnits(event)*quarterSeconds;
      const scheduled={time:cursor,duration,rest:!!event.rest,midi:event.rest?null:writtenPitchToMidi(event.keys?.[0])};
      cursor+=duration;
      const preceding=timeline[timeline.length-1];
      const continuesTie=!!previousSource?.tieToNext&&!scheduled.rest&&!preceding?.rest&&scheduled.midi!==null&&scheduled.midi===preceding?.midi;
      if(continuesTie)preceding.duration+=duration;
      else timeline.push(scheduled);
      previousSource=event;
    });
    return timeline;
  }

  function metronomePulseQuarterUnits([beats,beatValue]){
    return beatValue===8&&beats>=6&&beats%3===0?1.5:4/beatValue;
  }

  function buildMetronomeTimeline(meter,{bars=2,quarterSeconds=.48}={}){
    const [beats,beatValue]=meter;
    const barQuarterUnits=beats*4/beatValue;
    const pulseQuarterUnits=metronomePulseQuarterUnits(meter);
    const pulsesPerBar=Math.round(barQuarterUnits/pulseQuarterUnits);
    const result=[];
    for(let bar=0;bar<bars;bar+=1){
      for(let pulse=0;pulse<pulsesPerBar;pulse+=1){
        result.push({time:(bar*barQuarterUnits+pulse*pulseQuarterUnits)*quarterSeconds,accent:pulse===0,bar:bar+1,beat:pulse+1});
      }
    }
    return result;
  }

  function buildAccompaniedRhythmTimeline(specification,{quarterSeconds=.48}={}){
    const rhythm=buildRhythmTimeline(specification,{quarterSeconds});
    const last=rhythm[rhythm.length-1];
    const duration=last?last.time+last.duration:0;
    const [beats,beatValue]=specification.meter;
    const barDuration=beats*4/beatValue*quarterSeconds;
    const bars=Math.max(1,Math.ceil(duration/barDuration));
    const metronome=buildMetronomeTimeline(specification.meter,{bars,quarterSeconds})
      .filter(click=>click.time<duration);
    return {rhythm,metronome,duration};
  }

  window.ListeningDeskRhythmPlayback=Object.freeze({buildAccompaniedRhythmTimeline,buildMetronomeTimeline,buildRhythmTimeline,eventQuarterUnits,metronomePulseQuarterUnits,writtenPitchToMidi});
})();
