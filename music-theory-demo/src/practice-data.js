(function () {
  const intervals=[
    {answer:'major',notes:['c/4','e/4'],midis:[60,64]},
    {answer:'minor',notes:['c/4','eb/4'],midis:[60,63]},
    {answer:'major',notes:['g/3','b/3'],midis:[55,59]},
    {answer:'minor',notes:['g/3','bb/3'],midis:[55,58]},
    {answer:'major',notes:['d/4','f#/4'],midis:[62,66]},
    {answer:'minor',notes:['a/3','c/4'],midis:[57,60]},
    {answer:'major',notes:['e/4','g#/4'],midis:[64,68]},
    {answer:'minor',notes:['e/4','g/4'],midis:[64,67]},
    {answer:'major',notes:['f/4','a/4'],midis:[65,69]},
    {answer:'minor',notes:['f/4','ab/4'],midis:[65,68]}
  ];
  const cadences=[
    {answer:'perfect',key:'F',chords:[['e/4','g/4','c/5'],['f/4','a/4','c/5']],audio:[[64,67,72],[65,69,72]]},
    {answer:'imperfect',key:'F',chords:[['f/4','a/4','c/5'],['e/4','g/4','c/5']],audio:[[65,69,72],[64,67,72]]},
    {answer:'perfect',key:'G',chords:[['f#/4','a/4','d/5'],['g/4','b/4','d/5']],audio:[[66,69,74],[67,71,74]]},
    {answer:'imperfect',key:'G',chords:[['g/4','b/4','d/5'],['f#/4','a/4','d/5']],audio:[[67,71,74],[66,69,74]]},
    {answer:'perfect',key:'D',chords:[['c#/4','e/4','a/4'],['d/4','f#/4','a/4']],audio:[[61,64,69],[62,66,69]]},
    {answer:'imperfect',key:'D',chords:[['d/4','f#/4','a/4'],['c#/4','e/4','a/4']],audio:[[62,66,69],[61,64,69]]},
    {answer:'perfect',key:'A',chords:[['g#/4','b/4','e/5'],['a/4','c#/5','e/5']],audio:[[68,71,76],[69,73,76]]},
    {answer:'imperfect',key:'A',chords:[['a/4','c#/5','e/5'],['g#/4','b/4','e/5']],audio:[[69,73,76],[68,71,76]]},
    {answer:'perfect',key:'Bb',chords:[['a/4','c/5','f/5'],['bb/4','d/5','f/5']],audio:[[69,72,77],[70,74,77]]},
    {answer:'imperfect',key:'Bb',chords:[['bb/4','d/5','f/5'],['a/4','c/5','f/5']],audio:[[70,74,77],[69,72,77]]}
  ];
  const triads=[
    {answer:'Major triad',prompt:'What chord quality is shown?',choices:['Major triad','Minor triad'],quality:'major',inversion:0,root:'c',notes:['c/4','e/4','g/4'],midis:[60,64,67]},
    {answer:'Minor triad',prompt:'What chord quality is shown?',choices:['Major triad','Minor triad'],quality:'minor',inversion:0,root:'c',notes:['c/4','eb/4','g/4'],midis:[60,63,67]},
    {answer:'First inversion',prompt:'Which inversion is shown?',choices:['Root position','First inversion','Second inversion'],quality:'major',inversion:1,root:'f',notes:['a/4','c/5','f/5'],midis:[69,72,77]},
    {answer:'First inversion',prompt:'Which inversion is shown?',choices:['Root position','First inversion','Second inversion'],quality:'minor',inversion:1,root:'d',notes:['f/4','a/4','d/5'],midis:[65,69,74]},
    {answer:'Second inversion',prompt:'Which inversion is shown?',choices:['Root position','First inversion','Second inversion'],quality:'major',inversion:2,root:'g',notes:['d/4','g/4','b/4'],midis:[62,67,71]},
    {answer:'Second inversion',prompt:'Which inversion is shown?',choices:['Root position','First inversion','Second inversion'],quality:'minor',inversion:2,root:'a',notes:['e/4','a/4','c/5'],midis:[64,69,72]},
    {answer:'I',prompt:'Which chord is this in C major?',choices:['I','ii','IV','V'],key:'C',roman:'I',quality:'major',inversion:1,root:'c',notes:['e/4','g/4','c/5'],midis:[64,67,72]},
    {answer:'ii',prompt:'Which chord is this in C major?',choices:['I','ii','IV','V'],key:'C',roman:'ii',quality:'minor',inversion:0,root:'d',notes:['d/4','f/4','a/4'],midis:[62,65,69]},
    {answer:'IV',prompt:'Which chord is this in G major?',choices:['I','ii','IV','V'],key:'G',roman:'IV',quality:'major',inversion:1,root:'c',notes:['e/4','g/4','c/5'],midis:[64,67,72]},
    {answer:'V',prompt:'Which chord is this in D major?',choices:['I','ii','IV','V'],key:'D',roman:'V',quality:'major',inversion:2,root:'a',notes:['e/4','a/4','c#/5'],midis:[64,69,73]}
  ];
  const makeEvents=(count,duration,groups)=>{let group=1,used=0,limit=groups[0];return Array.from({length:count},()=>{const downbeat=used===0;const event={keys:[downbeat?'e/5':'c/5'],duration,group,accent:downbeat};used++;if(used===limit){group++;used=0;limit=groups[group-1]||Infinity}return event})};
  const rhythm=(answer,meter,groups,duration,choices)=>{const events=makeEvents(meter[0],duration,groups);return {answer,prompt:'Which time signature matches this bar?',choices,meter,groups,durations:Array(meter[0]).fill(1),unit:meter[1],events,midis:events.map(event=>event.keys[0]==='e/5'?76:72),showTimeSignature:false}};
  const timeSignatures=[
    rhythm('2/4',[2,4],[1,1],'q',['2/4','3/4','4/4']),
    rhythm('3/4',[3,4],[1,1,1],'q',['2/4','3/4','4/4']),
    rhythm('4/4',[4,4],[1,1,1,1],'q',['2/4','3/4','4/4']),
    rhythm('6/8',[6,8],[3,3],'8',['6/8','9/8','12/8']),
    rhythm('9/8',[9,8],[3,3,3],'8',['6/8','9/8','12/8']),
    rhythm('12/8',[12,8],[3,3,3,3],'8',['6/8','9/8','12/8']),
    rhythm('5/4',[5,4],[2,3],'q',['5/4','7/4','5/8']),
    rhythm('7/4',[7,4],[4,3],'q',['5/4','7/4','7/8']),
    rhythm('5/8',[5,8],[2,3],'8',['5/4','5/8','7/8']),
    rhythm('7/8',[7,8],[2,2,3],'8',['7/4','5/8','7/8'])
  ];
  const scales=[
    {answer:'C major',prompt:'Which scale is shown?',choices:['C major','G major','F major'],type:'major',notes:['c/4','d/4','e/4','f/4','g/4','a/4','b/4','c/5'],midis:[60,62,64,65,67,69,71,72],descendingType:'major-descending',descendingNotes:['c/5','b/4','a/4','g/4','f/4','e/4','d/4','c/4'],descendingMidis:[72,71,69,67,65,64,62,60]},
    {answer:'G major',prompt:'Which scale is shown?',choices:['C major','G major','D major'],type:'major',notes:['g/3','a/3','b/3','c/4','d/4','e/4','f#/4','g/4'],midis:[55,57,59,60,62,64,66,67],descendingType:'major-descending',descendingNotes:['g/4','f#/4','e/4','d/4','c/4','b/3','a/3','g/3'],descendingMidis:[67,66,64,62,60,59,57,55]},
    {answer:'F major',prompt:'Which scale is shown?',choices:['C major','F major','B-flat major'],type:'major',notes:['f/3','g/3','a/3','bb/3','c/4','d/4','e/4','f/4'],midis:[53,55,57,58,60,62,64,65],descendingType:'major-descending',descendingNotes:['f/4','e/4','d/4','c/4','bb/3','a/3','g/3','f/3'],descendingMidis:[65,64,62,60,58,57,55,53]},
    {answer:'D major',prompt:'Which scale is shown?',choices:['G major','D major','A major'],type:'major',notes:['d/4','e/4','f#/4','g/4','a/4','b/4','c#/5','d/5'],midis:[62,64,66,67,69,71,73,74],descendingType:'major-descending',descendingNotes:['d/5','c#/5','b/4','a/4','g/4','f#/4','e/4','d/4'],descendingMidis:[74,73,71,69,67,66,64,62]},
    {answer:'B-flat major',prompt:'Which scale is shown?',choices:['F major','B-flat major','E-flat major'],type:'major',notes:['bb/3','c/4','d/4','eb/4','f/4','g/4','a/4','bb/4'],midis:[58,60,62,63,65,67,69,70],descendingType:'major-descending',descendingNotes:['bb/4','a/4','g/4','f/4','eb/4','d/4','c/4','bb/3'],descendingMidis:[70,69,67,65,63,62,60,58]},
    {answer:'A harmonic minor',prompt:'Which minor scale is shown?',choices:['A harmonic minor','A melodic minor','E harmonic minor'],type:'harmonic-minor',notes:['a/3','b/3','c/4','d/4','e/4','f/4','g#/4','a/4'],midis:[57,59,60,62,64,65,68,69],descendingType:'harmonic-minor-descending',descendingNotes:['a/4','g#/4','f/4','e/4','d/4','c/4','b/3','a/3'],descendingMidis:[69,68,65,64,62,60,59,57]},
    {answer:'E harmonic minor',prompt:'Which minor scale is shown?',choices:['A harmonic minor','E harmonic minor','D harmonic minor'],type:'harmonic-minor',notes:['e/4','f#/4','g/4','a/4','b/4','c/5','d#/5','e/5'],midis:[64,66,67,69,71,72,75,76],descendingType:'harmonic-minor-descending',descendingNotes:['e/5','d#/5','c/5','b/4','a/4','g/4','f#/4','e/4'],descendingMidis:[76,75,72,71,69,67,66,64]},
    {answer:'D harmonic minor',prompt:'Which minor scale is shown?',choices:['D harmonic minor','A harmonic minor','D melodic minor'],type:'harmonic-minor',notes:['d/4','e/4','f/4','g/4','a/4','bb/4','c#/5','d/5'],midis:[62,64,65,67,69,70,73,74],descendingType:'harmonic-minor-descending',descendingNotes:['d/5','c#/5','bb/4','a/4','g/4','f/4','e/4','d/4'],descendingMidis:[74,73,70,69,67,65,64,62]},
    {answer:'A melodic minor',prompt:'Which minor scale is shown?',choices:['A natural minor','A harmonic minor','A melodic minor'],type:'melodic-minor-ascending',notes:['a/3','b/3','c/4','d/4','e/4','f#/4','g#/4','a/4'],midis:[57,59,60,62,64,66,68,69],descendingType:'natural-minor-descending',descendingNotes:['a/4','g/4','f/4','e/4','d/4','c/4','b/3','a/3'],descendingMidis:[69,67,65,64,62,60,59,57]},
    {answer:'C chromatic',prompt:'Which scale is shown?',choices:['C major','C chromatic','A harmonic minor'],type:'chromatic',notes:['c/4','c#/4','d/4','d#/4','e/4','f/4','f#/4','g/4','g#/4','a/4','bb/4','b/4','c/5'],midis:[60,61,62,63,64,65,66,67,68,69,70,71,72],descendingType:'chromatic',descendingNotes:['c/5','b/4','bb/4','a/4','ab/4','g/4','gb/4','f/4','e/4','eb/4','d/4','db/4','c/4'],descendingMidis:[72,71,70,69,68,67,66,65,64,63,62,61,60]}
  ];
  const scaleDegrees=[
    {answer:'Tonic',prompt:'In C major, what is degree 1 called?',choices:['Tonic','Dominant','Mediant'],notes:['c/4','d/4','e/4','f/4','g/4','a/4','b/4','c/5'],descendingNotes:['c/5','b/4','a/4','g/4','f/4','e/4','d/4','c/4'],midis:[60,62,64,65,67,69,71,72]},
    {answer:'Supertonic',prompt:'In C major, what is degree 2 called?',choices:['Supertonic','Subdominant','Submediant'],notes:['c/4','d/4','e/4','f/4','g/4','a/4','b/4','c/5'],descendingNotes:['c/5','b/4','a/4','g/4','f/4','e/4','d/4','c/4'],midis:[60,62,64,65,67,69,71,72]},
    {answer:'Mediant',prompt:'In A minor, what is degree 3 called?',choices:['Mediant','Dominant','Subtonic'],notes:['a/3','b/3','c/4','d/4','e/4','f/4','g/4','a/4'],descendingNotes:['a/4','g/4','f/4','e/4','d/4','c/4','b/3','a/3'],midis:[57,59,60,62,64,65,67,69]},
    {answer:'Subdominant',prompt:'In C major, what is degree 4 called?',choices:['Subdominant','Supertonic','Submediant'],notes:['c/4','d/4','e/4','f/4','g/4','a/4','b/4','c/5'],descendingNotes:['c/5','b/4','a/4','g/4','f/4','e/4','d/4','c/4'],midis:[60,62,64,65,67,69,71,72]},
    {answer:'Dominant',prompt:'In A minor, what is degree 5 called?',choices:['Dominant','Mediant','Tonic'],notes:['a/3','b/3','c/4','d/4','e/4','f/4','g/4','a/4'],descendingNotes:['a/4','g/4','f/4','e/4','d/4','c/4','b/3','a/3'],midis:[57,59,60,62,64,65,67,69]},
    {answer:'Submediant',prompt:'In C major, what is degree 6 called?',choices:['Submediant','Subdominant','Supertonic'],notes:['c/4','d/4','e/4','f/4','g/4','a/4','b/4','c/5'],descendingNotes:['c/5','b/4','a/4','g/4','f/4','e/4','d/4','c/4'],midis:[60,62,64,65,67,69,71,72]},
    {answer:'Leading note',prompt:'In C major, what is degree 7 called?',choices:['Leading note','Subtonic','Dominant'],notes:['c/4','d/4','e/4','f/4','g/4','a/4','b/4','c/5'],descendingNotes:['c/5','b/4','a/4','g/4','f/4','e/4','d/4','c/4'],midis:[60,62,64,65,67,69,71,72]},
    {answer:'Subtonic',prompt:'In A natural minor, what is degree 7 called?',choices:['Subtonic','Leading note','Dominant'],notes:['a/3','b/3','c/4','d/4','e/4','f/4','g/4','a/4'],descendingNotes:['a/4','g/4','f/4','e/4','d/4','c/4','b/3','a/3'],midis:[57,59,60,62,64,65,67,69]},
    {answer:'Leading note',prompt:'In A harmonic minor, what is raised degree 7 called?',choices:['Leading note','Subtonic','Mediant'],notes:['a/3','b/3','c/4','d/4','e/4','f/4','g#/4','a/4'],descendingNotes:['a/4','g#/4','f/4','e/4','d/4','c/4','b/3','a/3'],midis:[57,59,60,62,64,65,68,69]},
    {answer:'Subtonic',prompt:'Descending A melodic minor uses G natural. What is degree 7 called?',choices:['Subtonic','Leading note','Supertonic'],notes:['a/3','b/3','c/4','d/4','e/4','f#/4','g#/4','a/4'],descendingNotes:['a/4','g/4','f/4','e/4','d/4','c/4','b/3','a/3'],midis:[57,59,60,62,64,66,68,69]}
  ];
  const keySignatures=[
    {id:'ks-1',answer:'G major / E minor',prompt:'Which relative keys share this signature?',choices:['G major / E minor','D major / B minor','F major / D minor'],notation:{type:'key-signature',key:'G'},midis:[67,69,71,72,74,76,78,79]},
    {id:'ks-2',answer:'D major / B minor',prompt:'Which relative keys share this signature?',choices:['G major / E minor','D major / B minor','A major / F-sharp minor'],notation:{type:'key-signature',key:'D'},midis:[62,64,66,67,69,71,73,74]},
    {id:'ks-3',answer:'A major / F-sharp minor',prompt:'Which relative keys share this signature?',choices:['D major / B minor','A major / F-sharp minor','E major / C-sharp minor'],notation:{type:'key-signature',key:'A'},midis:[69,71,73,74,76,78,80,81]},
    {id:'ks-4',answer:'F major / D minor',prompt:'Which relative keys share this signature?',choices:['F major / D minor','B-flat major / G minor','C major / A minor'],notation:{type:'key-signature',key:'F'},midis:[65,67,69,70,72,74,76,77]},
    {id:'ks-5',answer:'B-flat major / G minor',prompt:'Which relative keys share this signature?',choices:['F major / D minor','B-flat major / G minor','E-flat major / C minor'],notation:{type:'key-signature',key:'Bb'},midis:[70,72,74,75,77,79,81,82]},
    {id:'ks-6',answer:'E-flat major / C minor',prompt:'Which relative keys share this signature?',choices:['B-flat major / G minor','E-flat major / C minor','A-flat major / F minor'],notation:{type:'key-signature',key:'Eb'},midis:[63,65,67,68,70,72,74,75]},
    {id:'ks-7',answer:'B major / G-sharp minor',prompt:'Which relative keys share this signature?',choices:['E major / C-sharp minor','B major / G-sharp minor','F-sharp major / D-sharp minor'],notation:{type:'key-signature',key:'B'},midis:[59,61,63,64,66,68,70,71]},
    {id:'ks-8',answer:'F-sharp major / D-sharp minor',prompt:'Which relative keys share this signature?',choices:['B major / G-sharp minor','F-sharp major / D-sharp minor','D-flat major / B-flat minor'],notation:{type:'key-signature',key:'F#'},midis:[66,68,70,71,73,75,77,78]},
    {id:'ks-9',answer:'D-flat major / B-flat minor',prompt:'Which relative keys share this signature?',choices:['A-flat major / F minor','D-flat major / B-flat minor','G-flat major / E-flat minor'],notation:{type:'key-signature',key:'Db'},midis:[61,63,65,66,68,70,72,73]},
    {id:'ks-10',answer:'G-flat major / E-flat minor',prompt:'Which relative keys share this signature?',choices:['D-flat major / B-flat minor','G-flat major / E-flat minor','F-sharp major / D-sharp minor'],notation:{type:'key-signature',key:'Gb'},midis:[66,68,70,71,73,75,77,78]}
  ];
  window.ListeningDeskPractice = Object.freeze({
    "intervals": {name:'Intervals',title:'Identify the<br><em>interval.</em>',lead:'Use the staff notation and sound. Every written third appears once.',question:'What interval is this?',playLabel:'▶ Play interval',answers:[['major','Major third'],['minor','Minor third']],exercises:intervals},
    "cadences": {name:'Cadences',title:'Identify the<br><em>cadence.</em>',lead:'Read the key signature, then use the notation and sound to decide where the phrase leads.',question:'What cadence is this?',playLabel:'▶ Play cadence',answers:[['perfect','Perfect cadence'],['imperfect','Imperfect cadence']],exercises:cadences},
    "triads": {name:'Triads and chords',title:'Identify the<br><em>triad.</em>',lead:'Use the notation, key and sound to identify quality, inversion or function.',question:'What triad is this?',playLabel:'▶ Play triad',answers:[],exercises:triads},
    "time-signatures": {name:'Time signatures and grouping',title:'Identify the<br><em>metre.</em>',lead:'Follow the written grouping and audible accents.',question:'What metre is this?',playLabel:'▶ Play rhythm',answers:[],exercises:timeSignatures},
    "scales": {name:'Major and minor scales',title:'Identify the<br><em>scale.</em>',lead:'Follow the written pitches and listen to the scale pattern.',question:'What scale is this?',playLabel:'▶ Play scale',answers:[],exercises:scales},
    "scale-degrees": {name:'Scale degrees and technical names',title:'Name the<br><em>scale degree.</em>',lead:'Read the complete scale, then identify the named degree in its major or minor context.',question:'What is this technical name?',playLabel:'▶ Play scale',answers:[],exercises:scaleDegrees}
    ,"key-signatures": {name:'Key signatures and key relationships',title:'Read the<br><em>key signature.</em>',lead:'Read the signature, then connect its relative major and minor keys.',question:'Which keys share this signature?',playLabel:'▶ Play pitch collection',answers:[],exercises:keySignatures}
  });
})();
