(function(){
  const q=(id,prompt,answer,choices,symbol,detail)=>({id,prompt,answer,choices,concept:{symbol,kicker:'Question clue',detail}});
  const bank=(name,noun,lead,items)=>({name,title:`Identify the<br><em>${noun}.</em>`,lead,question:`Identify the ${noun}.`,playLabel:'Review clue',answers:[],exercises:items});
  const remaining={
    "rhythm-note-values":bank('Rhythm and note values','rhythm','Calculate durations, ties, rests and tuplets.',[
      q('rnv-1','How many quavers equal a dotted crotchet?','3',['2','3','4'],'♩.','A dot adds half the original duration.'),
      q('rnv-2','How many crotchet beats equal a minim?','2',['1','2','4'],'𝅗𝅥','Count the full duration.'),
      q('rnv-3','What does a tie do?','Joins durations of the same pitch',['Joins durations of the same pitch','Raises a pitch','Shortens a note'],'⌒','The tied notes sound as one.'),
      q('rnv-4','Three quavers in the time of two form a…','Triplet',['Triplet','Duplet','Tie'],'3 : 2','Three equal divisions replace two.'),
      q('rnv-5','How many semiquavers equal one crotchet?','4',['2','3','4'],'♬ ♬','Four quarter-beat divisions.'),
      q('rnv-6','A dotted minim equals how many crotchets?','3',['2','3','4'],'𝅗𝅥.','Add half of two beats.'),
      q('rnv-7','What does a rest measure?','Silence',['Silence','Pitch','Tempo'],'𝄽','Rests occupy exact durations.'),
      q('rnv-8','Two tied crotchets equal which value?','Minim',['Quaver','Minim','Semibreve'],'♩⌒♩','Add the two durations.'),
      q('rnv-9','A double dot adds what fractions?','One half and one quarter',['One half only','One half and one quarter','Two whole beats'],'..','The second dot adds half the first dot.'),
      q('rnv-10','Which note value fills a 4/4 bar alone?','Semibreve',['Minim','Semibreve','Crotchet'],'𝅝','Four crotchet beats.')
    ]),
    "clefs":bank('Clefs and note reading','clef','Use each clef reference line to read pitch.',[
      q('clef-1','Which clef curls around the G line?','Treble clef',['Treble clef','Bass clef','Alto clef'],'𝄞','The curl identifies G.'),
      q('clef-2','Which clef has dots surrounding the F line?','Bass clef',['Bass clef','Tenor clef','Treble clef'],'𝄢','The dots frame F.'),
      q('clef-3','Where is middle C in alto clef?','Third line',['Second line','Third line','Fourth line'],'𝄡','The centre of the C clef points to middle C.'),
      q('clef-4','Where is middle C in tenor clef?','Fourth line',['Third line','Fourth line','Fifth line'],'𝄡','The C-clef centre moves up one line.'),
      q('clef-5','Which clef is commonly used by viola?','Alto clef',['Alto clef','Bass clef','Treble clef'],'Viola','Its central register fits alto clef.'),
      q('clef-6','Which clef is commonly used for cello low notes?','Bass clef',['Bass clef','Alto clef','Treble clef'],'Cello','Low register uses bass clef.'),
      q('clef-7','The second line of treble clef is…','G',['F','G','A'],'𝄞 · line 2','Count from the clef reference.'),
      q('clef-8','The fourth line of bass clef is…','F',['E','F','G'],'𝄢 · line 4','The bass-clef dots surround it.'),
      q('clef-9','Which two are C clefs?','Alto and tenor',['Treble and bass','Alto and tenor','Bass and tenor'],'𝄡','Both point directly to middle C.'),
      q('clef-10','Changing clef without transposing changes the sounding pitch?','No',['Yes','No','Only in minor keys'],'Same note','Only its staff position changes.')
    ]),
    "clef-transposition":bank('Clef and octave transposition','transposition','Preserve pitch or move it by an exact octave.',[
      q('ct-1','Moving C4 to C5 is a…','Perfect octave',['Perfect fifth','Perfect octave','Major seventh'],'C4 → C5','Same letter, twelve semitones.'),
      q('ct-2','When rewriting in another clef, what must stay unchanged?','Sounding pitch',['Staff line','Clef sign','Sounding pitch'],'𝄞 → 𝄢','Only notation position changes.'),
      q('ct-3','An octave contains how many semitones?','12',['7','8','12'],'8ve','Chromatic distance.'),
      q('ct-4','Transpose G4 down an octave.','G3',['F3','G3','G5'],'G4 ↓ 8','Keep the letter name.'),
      q('ct-5','Transpose B3 up an octave.','B4',['A4','B4','C4'],'B3 ↑ 8','Keep accidental and letter.'),
      q('ct-6','Does an octave transposition change rhythm?','No',['Yes','No','Only tied notes'],'♩ = ♩','Durations remain identical.'),
      q('ct-7','Middle C is on which line in alto clef?','Third',['Second','Third','Fourth'],'𝄡','Use the C-clef centre.'),
      q('ct-8','Middle C is on which line in tenor clef?','Fourth',['Third','Fourth','Fifth'],'𝄡','Use the C-clef centre.'),
      q('ct-9','Transpose F-sharp up an octave. What happens to the sharp?','It remains',['It disappears','It remains','It becomes flat'],'F♯ ↑ 8','Preserve accidental spelling.'),
      q('ct-10','A melody moved entirely up an octave keeps its…','Intervals',['Register','Intervals','Clef'],'same shape','Every pitch moves equally.')
    ]),
    "transposing-instruments":bank('Transposing instruments','concert pitch','Convert between written and sounding pitch.',[
      q('ti-1','A B-flat instrument reads C. What sounds?','B-flat',['B-flat','C','D'],'Written C → B♭','Sound down a major second.'),
      q('ti-2','A horn in F reads C. What sounds?','F',['F','G','C'],'Written C → F','Sound down a perfect fifth.'),
      q('ti-3','A clarinet in A reads C. What sounds?','A',['A','B-flat','C'],'Written C → A','Sound down a minor third.'),
      q('ti-4','Which is a B-flat instrument?','Trumpet in B-flat',['Flute','Trumpet in B-flat','Oboe'],'B♭','Its written C sounds B-flat.'),
      q('ti-5','Which commonly sounds at concert pitch?','Flute',['Flute','Horn in F','Clarinet in A'],'C instrument','Written and sounding pitch agree.'),
      q('ti-6','To write for B-flat clarinet from concert pitch, transpose…','Up a major second',['Down a major second','Up a major second','Up a fifth'],'Concert → written','Reverse its sounding transposition.'),
      q('ti-7','To find horn in F concert pitch, transpose written pitch…','Down a perfect fifth',['Up a perfect fifth','Down a perfect fifth','Down an octave'],'Written → concert','The horn sounds lower.'),
      q('ti-8','A B-flat trumpet reads D. Concert pitch is…','C',['C','D','E'],'D → C','Down one tone.'),
      q('ti-9','An A clarinet reads E. Concert pitch is…','C-sharp',['C','C-sharp','E-flat'],'E → C♯','Down a minor third.'),
      q('ti-10','Why transpose instrument parts?','So intended concert pitches sound',['To change rhythm','So intended concert pitches sound','To remove key signatures'],'score alignment','Written parts compensate for instrument pitch.')
    ]),
    "accidentals":bank('Accidentals and enharmonic equivalents','spelling','Apply accidentals and choose functional enharmonic names.',[
      q('acc-1','A sharp raises a note by…','One semitone',['One semitone','Two semitones','One tone and a half'],'♯','Raise the written pitch.'),
      q('acc-2','A double flat lowers a note by…','Two semitones',['One semitone','Two semitones','Three semitones'],'𝄫','Two chromatic steps.'),
      q('acc-3','Which is enharmonic with F-sharp?','G-flat',['E-sharp','G-flat','A-flat'],'F♯ = G♭','Same sounding key.'),
      q('acc-4','Which is enharmonic with B-sharp?','C',['B-flat','C','C-sharp'],'B♯ = C','Same sounding pitch.'),
      q('acc-5','What does a natural sign do?','Cancels a sharp or flat',['Raises a semitone','Cancels a sharp or flat','Lowers two semitones'],'♮','Return to the unaltered letter.'),
      q('acc-6','An accidental normally lasts until…','The end of the bar',['The next note','The end of the bar','The end of the piece'],'| barline','Same pitch and octave within the bar.'),
      q('acc-7','Which is enharmonic with C-flat?','B',['B','B-flat','C'],'C♭ = B','Same sounding pitch.'),
      q('acc-8','A double sharp raises by…','Two semitones',['One semitone','Two semitones','One octave'],'𝄪','Two chromatic steps.'),
      q('acc-9','Why choose E-sharp instead of F in F-sharp major?','To preserve scale letter order',['To sound higher','To preserve scale letter order','To shorten the note'],'E♯ → F♯','Each scale degree needs a different letter.'),
      q('acc-10','G double flat sounds like…','F',['F','F-sharp','G-flat'],'G𝄫 = F','Lower G twice.')
    ]),
    "musical-terms":bank('Musical terms and signs','term','Translate written directions into performance actions.',[
      q('term-1','What does allegro mean?','Fast and lively',['Slow and broad','Fast and lively','Very soft'],'allegro','Tempo and character.'),
      q('term-2','What does diminuendo mean?','Gradually softer',['Gradually louder','Gradually softer','Immediately fast'],'dim.','A gradual dynamic change.'),
      q('term-3','What does cantabile mean?','In a singing style',['Detached','In a singing style','Very fast'],'cantabile','Shape a lyrical line.'),
      q('term-4','What does staccato request?','Short and detached',['Smooth and connected','Short and detached','Louder'],'· · ·','Articulation changes note length.'),
      q('term-5','What does legato request?','Smoothly connected',['Smoothly connected','Strongly accented','Slower'],'⌒','Connect the phrase.'),
      q('term-6','What does a tempo mean?','Return to the previous tempo',['Become faster','Return to the previous tempo','Pause'],'a tempo','Cancel a temporary tempo change.'),
      q('term-7','What does fortissimo mean?','Very loud',['Very soft','Moderately loud','Very loud'],'ff','Dynamic level.'),
      q('term-8','What does ritardando mean?','Gradually slower',['Gradually slower','Suddenly slow','Gradually louder'],'rit.','Tempo changes over time.'),
      q('term-9','What does marcato mean?','Marked and emphasized',['Fading away','Marked and emphasized','Sweetly'],'marcato','Give notes clear emphasis.'),
      q('term-10','What does dolce mean?','Sweetly',['Angrily','Sweetly','Very quickly'],'dolce','Character direction.')
    ]),
    "ornaments":bank('Ornaments','ornament','Identify decorations and their auxiliary notes.',[
      q('orn-1','Which ornament repeatedly alternates with the upper note?','Trill',['Trill','Mordent','Acciaccatura'],'tr','Rapid alternation.'),
      q('orn-2','Which grace note is normally crushed very quickly?','Acciaccatura',['Appoggiatura','Acciaccatura','Turn'],'♪→♩','Very short before the principal note.'),
      q('orn-3','Which ornament leans expressively on a grace note?','Appoggiatura',['Appoggiatura','Mordent','Trill'],'♫ → ♩','It takes time from the principal note.'),
      q('orn-4','A mordent makes…','A rapid single turn',['Repeated alternation','A rapid single turn','A long pause'],'𝆝','Principal and neighbouring note.'),
      q('orn-5','A turn circles around…','The principal note',['The tonic only','The principal note','The bass note'],'∽','Upper, principal, lower, principal.'),
      q('orn-6','Auxiliary notes follow the…','Key signature and accidentals',['Tempo only','Key signature and accidentals','Dynamic marking'],'♯ ♭','Pitch spelling still applies.'),
      q('orn-7','The structural note being decorated is the…','Principal note',['Passing note','Principal note','Pedal note'],'●','The ornament resolves around it.'),
      q('orn-8','Which ornament usually has the symbol tr?','Trill',['Turn','Trill','Mordent'],'tr','Standard abbreviation.'),
      q('orn-9','Which grace note usually has a slash?','Acciaccatura',['Acciaccatura','Appoggiatura','Trill'],'♪̸','The slash indicates crushed delivery.'),
      q('orn-10','Ornaments mainly add…','Decoration and expression',['A new key signature','Decoration and expression','A new time signature'],'✨','They elaborate existing notes.')
    ]),
    "voices-instruments":bank('Voices and instruments','performer','Classify ranges, families, clefs and sound production.',[
      q('vi-1','Which is the highest standard choir voice?','Soprano',['Soprano','Alto','Tenor'],'S A T B','High to low.'),
      q('vi-2','Which is the lowest standard choir voice?','Bass',['Alto','Tenor','Bass'],'S A T B','High to low.'),
      q('vi-3','A violin belongs to which family?','Strings',['Strings','Woodwind','Brass'],'Violin','Sound comes from vibrating strings.'),
      q('vi-4','A saxophone belongs to which family?','Woodwind',['Woodwind','Brass','Percussion'],'Saxophone','It uses a reed.'),
      q('vi-5','A trumpet belongs to which family?','Brass',['Woodwind','Brass','Strings'],'Trumpet','Buzzing lips excite the air column.'),
      q('vi-6','A timpani belongs to which family?','Percussion',['Percussion','Brass','Strings'],'Timpani','Its membrane is struck.'),
      q('vi-7','Which instrument commonly reads alto clef?','Viola',['Violin','Viola','Flute'],'𝄡','Its register suits the clef.'),
      q('vi-8','Which instrument uses a double reed?','Oboe',['Clarinet','Oboe','Flute'],'Oboe','Two reeds vibrate together.'),
      q('vi-9','Which voice lies between soprano and tenor?','Alto',['Alto','Bass','Baritone'],'S A T B','Standard choral order.'),
      q('vi-10','Which family produces sound by buzzing lips?','Brass',['Brass','Woodwind','Percussion'],'Horn','Lips vibrate into a mouthpiece.')
    ]),
    "musical-observation":bank('General musical observation','observation','Use visible evidence to explain structure, texture and harmony.',[
      q('mo-1','A short recurring musical idea is a…','Motif',['Motif','Cadence','Clef'],'a · a · a','A recognisable small unit.'),
      q('mo-2','A pattern repeated at a new pitch level is a…','Sequence',['Sequence','Tie','Pedal'],'a → a↑','Shape repeats after transposition.'),
      q('mo-3','One melody with chordal support is…','Melody and accompaniment',['Monophony','Melody and accompaniment','Imitation'],'line + chords','One line remains primary.'),
      q('mo-4','Several independent melodic lines create…','Polyphonic texture',['Monophonic texture','Polyphonic texture','A key signature'],'lines ↕','Lines have separate identities.'),
      q('mo-5','A phrase ending V–I uses a…','Perfect cadence',['Perfect cadence','Imperfect cadence','Sequence'],'V → I','Dominant resolves to tonic.'),
      q('mo-6','A repeated bass note beneath changing harmony is a…','Pedal',['Pedal','Motif','Turn'],'G ———','One sustained or repeated pitch.'),
      q('mo-7','Two performers moving in the same rhythm create…','Homorhythmic texture',['Imitation','Homorhythmic texture','Sequence'],'♩ ♩ / ♩ ♩','Rhythms align vertically.'),
      q('mo-8','A melody passed between parts is…','Imitation',['Imitation','Staccato','Modulation'],'a → part 2','Another part copies the idea.'),
      q('mo-9','Moving to a new key is called…','Modulation',['Transposition','Modulation','Inversion'],'Key A → Key B','The tonal centre changes.'),
      q('mo-10','The strongest evidence for an analytical answer comes from…','Features visible in the score',['Personal preference','Features visible in the score','The page number'],'evidence','Name the exact musical feature.')
    ])
  };
  window.ListeningDeskPractice=Object.freeze({...window.ListeningDeskPractice,...remaining});
})();
