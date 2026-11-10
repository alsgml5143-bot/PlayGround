(() => {
  const $ = (id) => document.getElementById(id);
  const board = $('board');
  const translations = {
    ko: {
      edition:'궁전 아케이드 · 한국어 패치', eyebrow:'오늘의 왕실 도전', titleLine1:'숫자를 모아', titleLine2:'블록을 깨워라!', subtitle:'합이 목표 숫자와 딱 맞으면, 한 번에 와르르!', princess:'창현 공주', prince:'민수 왕자', stage:'스테이지', hearts:'왕실의 축복', targetLabel:'목표 합계', selectedLabel:'선택한 숫자', clear:'선택 해제', smash:'블록 깨기', smashShortcut:'깨기', clearShortcut:'선택 해제', selectHint:'숫자 블록을 골라 목표 합계를 만들어 보세요.', howTitle:'플레이 방법', how1:'숫자 블록을 눌러 선택해요.', how2:'목표 합계와 정확히 맞춰요.', how3:'블록을 모두 깨고 왕실 보물을 찾아요!', tip:'숫자 블록은 여러 개를 함께 선택할 수 있어요.', royalTeam:'왕실의 파트너', princessRole:'숫자의 지혜', princeRole:'블록의 용기', scoreLabel:'획득 점수', footer:'창현 공주와 민수 왕자의 숫자 모험', footerTag:'마음을 모아, 합을 맞춰!', best:'최고 점수', selectMore:'블록을 선택해 목표 숫자를 맞춰 보세요.', exact:'완벽해요! 지금 깨 보세요!', tooHigh:'목표보다 커요. 블록을 다시 골라 보세요.', tooLow:'아직 부족해요. 숫자를 더 골라 보세요.', wrong:'합이 맞지 않아요! 축복 하나를 잃었어요.', smashed:'정확해요! 블록 {n}개를 깼어요!', shuffled:'블록을 섞었어요. 새 목표에 도전!', startTitle:'숫자 모험을 시작할까요?', startText:'창현 공주와 민수 왕자와 함께 숫자 블록을 깨 보세요!', startButton:'모험 시작', ready:'ROYAL CHALLENGE', levelTitle:'스테이지 클리어!', levelText:'멋져요! 다음 숫자 퍼즐이 기다리고 있어요.', nextButton:'다음 스테이지', overTitle:'모험이 끝났어요', overText:'다시 도전해서 왕실의 최고 기록을 세워 보세요!', retry:'다시 도전', boardClear:'블록을 모두 깼어요! 다음 스테이지로!', soundOn:'효과음 켜짐', soundOff:'효과음 꺼짐', remaining:'남은 블록', noSelection:'먼저 숫자 블록을 골라 주세요.'
    },
    en: {
      edition:'PALACE ARCADE · KOREAN PATCH', eyebrow:'TODAY’S ROYAL CHALLENGE', titleLine1:'ADD UP THE NUMBERS', titleLine2:'SMASH THE BLOCKS!', subtitle:'Match the target sum exactly and watch them tumble!', princess:'Princess Changhyun', prince:'Prince Minsu', stage:'STAGE', hearts:'ROYAL BLESSINGS', targetLabel:'TARGET SUM', selectedLabel:'YOUR SUM', clear:'Clear selection', smash:'Smash blocks', smashShortcut:'smash', clearShortcut:'clear', selectHint:'Pick number blocks to make the target sum.', howTitle:'HOW TO PLAY', how1:'Tap number blocks to select them.', how2:'Match the target sum exactly.', how3:'Smash every block and find the royal treasure!', tip:'You can select several number blocks at once.', royalTeam:'ROYAL TEAM', princessRole:'Number smarts', princeRole:'Block bravery', scoreLabel:'SCORE', footer:'A number adventure with Princess Changhyun & Prince Minsu', footerTag:'Team up and match the sum!', best:'BEST', selectMore:'Select blocks to match the target number.', exact:'Perfect match! Smash them now!', tooHigh:'That’s over the target. Try another combination.', tooLow:'Not quite there. Pick a few more numbers.', wrong:'Not a match! You lost a royal blessing.', smashed:'Perfect! You smashed {n} blocks!', shuffled:'Blocks shuffled. A fresh target awaits!', startTitle:'Ready for a number adventure?', startText:'Smash number blocks with Princess Changhyun and Prince Minsu!', startButton:'Start adventure', ready:'ROYAL CHALLENGE', levelTitle:'STAGE CLEARED!', levelText:'Amazing! A new number puzzle is waiting.', nextButton:'Next stage', overTitle:'Adventure over', overText:'Try again and set a new royal high score!', retry:'Play again', boardClear:'All blocks smashed! On to the next stage!', soundOn:'Sound on', soundOff:'Sound off', remaining:'blocks left', noSelection:'Pick some number blocks first.'
    }
  };
  let language='ko', stage=1, score=0, lives=3, target=0, selected=new Set(), tiles=[], running=false, sound=true, audioContext=null;
  const t=(key)=>translations[language][key] || key;
  const setStatus=(text,type='')=>{const el=$('statusMessage');el.textContent=text;el.className=`status-message ${type}`;};
  const modal=(icon,kicker,title,text,button,action)=>{
    $('modalIcon').textContent=icon;$('modalKicker').textContent=kicker;$('modalTitle').textContent=title;$('modalText').textContent=text;
    const btn=$('modalButton');btn.querySelector('span').textContent=button;btn.onclick=action;$('modal').classList.remove('hidden');btn.focus();
  };
  const hideModal=()=>{$('modal').classList.add('hidden');};
  const getSum=()=>Array.from(selected).reduce((sum,index)=>sum+tiles[index],0);
  const paintScore=()=>{$('scoreDisplay').textContent=String(score).padStart(4,'0');$('stageNumber').textContent=String(stage).padStart(2,'0');$('livesDisplay').innerHTML=Array.from({length:3},(_,i)=>`<span class="${i>=lives?'lost':''}">♥</span>`).join(' ');const best=Number(localStorage.getItem('sumSmashBest')||0);$('bestScore').textContent=`${t('best')}: ${String(best).padStart(4,'0')}`;};
  function possibleTargets(){
    const values=tiles.filter((_,i)=>!selected.has(i));
    if(values.length===0)return [];
    const sums=new Set();
    const maxCount=Math.min(4,values.length);
    function walk(start,count,sum){if(count>=2)sums.add(sum);if(count===maxCount)return;for(let i=start;i<values.length;i++)walk(i+1,count+1,sum+values[i]);}
    if(values.length===1)return [values[0]];
    walk(0,0,0);
    let choices=[...sums].filter(n=>n>=5&&n<=26);
    if(!choices.length)choices=[...sums];
    return choices;
  }
  function setTarget(){const choices=possibleTargets();if(!choices.length){target=0;return;}target=choices[Math.floor(Math.random()*choices.length)];$('targetValue').textContent=target;}
  function newBoard(){
    const max=Math.min(9,5+Math.floor((stage-1)/2));tiles=Array.from({length:25},()=>1+Math.floor(Math.random()*max));selected.clear();setTarget();render();updateSelection();
  }
  function render(){
    board.innerHTML='';tiles.forEach((value,index)=>{const button=document.createElement('button');button.type='button';button.className='number-block';button.textContent=value;button.setAttribute('role','gridcell');button.setAttribute('aria-label',`${value}${language==='ko'?' 숫자 블록':' number block'}`);button.setAttribute('aria-pressed',selected.has(index));button.dataset.index=index;if(selected.has(index))button.classList.add('selected');button.addEventListener('click',()=>toggle(index));board.append(button);});
    board.setAttribute('aria-label',`${tiles.length} ${t('remaining')}`);
  }
  function updateSelection(){
    const sum=getSum();$('currentSum').textContent=sum;$('sumEquation').textContent=selected.size?Array.from(selected).map(i=>tiles[i]).join(' + '):'';
    board.querySelectorAll('.number-block').forEach(button=>{const on=selected.has(Number(button.dataset.index));button.classList.toggle('selected',on);button.setAttribute('aria-pressed',on);});
    if(!selected.size){setStatus(t('selectHint'));return;}
    setStatus(sum===target?t('exact'):sum>target?t('tooHigh'):t('tooLow'),sum===target?'success':sum>target?'error':'');
  }
  function toggle(index){if(!running||!Number.isInteger(tiles[index]))return;if(selected.has(index))selected.delete(index);else selected.add(index);playTone(selected.has(index)?520:380,.045);updateSelection();}
  function playTone(freq=440,duration=.08){if(!sound)return;try{audioContext=audioContext||new(window.AudioContext||window.webkitAudioContext)();const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.frequency.value=freq;osc.type='sine';gain.gain.setValueAtTime(.055,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+duration);}catch(_){}}
  function submit(){if(!running)return;if(!selected.size){setStatus(t('noSelection'),'error');return;}const sum=getSum();if(sum!==target){lives--;paintScore();playTone(170,.18);board.classList.remove('shake');void board.offsetWidth;board.classList.add('shake');selected.clear();updateSelection();setStatus(t('wrong'),'error');if(lives<=0){running=false;setTimeout(()=>endGame(),650);}return;}
    const smashed=[...selected].sort((a,b)=>b-a);score+=sum*10+smashed.length*20+stage*5;for(const index of smashed){const button=board.querySelector(`[data-index="${index}"]`);if(button)button.classList.add('burst');}playTone(740,.12);setTimeout(()=>{smashed.forEach(index=>tiles.splice(index,1));selected.clear();paintScore();if(!tiles.length){stage++;lives=Math.min(3,lives+1);paintScore();running=false;setTimeout(()=>modal('👑',t('ready'),t('levelTitle'),t('levelText'),t('nextButton'),()=>{hideModal();newBoard();running=true;setStatus(t('selectHint'));}),180);}else{setTarget();render();updateSelection();setStatus(t('smashed').replace('{n}',smashed.length),'success');}},180);
  }
  function endGame(){const best=Number(localStorage.getItem('sumSmashBest')||0);if(score>best)localStorage.setItem('sumSmashBest',String(score));paintScore();modal('💫',t('ready'),t('overTitle'),t('overText'),t('retry'),()=>{hideModal();stage=1;score=0;lives=3;newBoard();paintScore();running=true;setStatus(t('selectHint'));});}
  function start(){stage=1;score=0;lives=3;newBoard();paintScore();running=true;hideModal();setStatus(t('selectHint'));}
  $('smashButton').addEventListener('click',submit);
  $('clearButton').addEventListener('click',()=>{selected.clear();updateSelection();});
  $('shuffleButton').addEventListener('click',()=>{if(!running)return;for(let i=tiles.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[tiles[i],tiles[j]]=[tiles[j],tiles[i]];}selected.clear();setTarget();render();updateSelection();setStatus(t('shuffled'));});
  $('soundButton').addEventListener('click',()=>{sound=!sound;$('soundButton').textContent=sound?'♫':'♩';$('soundButton').title=sound?t('soundOn'):t('soundOff');$('soundButton').setAttribute('aria-label',$('soundButton').title);if(sound)playTone(660,.07);});
  $('languageButton').addEventListener('click',()=>{language=language==='ko'?'en':'ko';document.documentElement.lang=language;$('languageButton').innerHTML=language==='ko'?'EN <span>↗</span>':'한국어 <span>↗</span>';document.querySelectorAll('[data-i18n]').forEach(el=>{const key=el.dataset.i18n;if(translations[language][key])el.textContent=translations[language][key];});$('stageNumber').textContent=String(stage).padStart(2,'0');paintScore();if(selected.size)updateSelection();});
  document.addEventListener('keydown',event=>{if(event.key==='Enter'&&!$('modal').classList.contains('hidden')){event.preventDefault();$('modalButton').click();return;}if(event.key==='Enter'){event.preventDefault();submit();}if(event.key==='Escape'){selected.clear();updateSelection();}if(['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(event.key)&&document.activeElement?.classList.contains('number-block')){event.preventDefault();const current=Number(document.activeElement.dataset.index),delta=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:event.key==='ArrowDown'?5:-5,next=Math.max(0,Math.min(tiles.length-1,current+delta));board.querySelector(`[data-index="${next}"]`)?.focus();}});
  document.querySelectorAll('[data-i18n]').forEach(el=>{const key=el.dataset.i18n;if(translations.ko[key])el.textContent=translations.ko[key];});
  newBoard();paintScore();$('modalButton').querySelector('span').textContent=t('startButton');modal('👑',t('ready'),t('startTitle'),t('startText'),t('startButton'),start);
})();
