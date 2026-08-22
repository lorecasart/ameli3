"use strict";
function l3(){
  hint.textContent='Guarda le direzioni una alla volta. Poi ripetile con i quattro tasti.';
  metric.textContent='ROUND 1 / 5';
  let w=document.createElement('div');
  w.className='sequenceWrap';
  w.innerHTML='<div class="sequenceCard"><div class="sequenceLabel">PREPARATI</div><div class="sequenceDisplay"></div><div class="sequencePrompt">la sequenza partirà tra poco</div></div><div class="sequenceDots"></div><div class="seqPad"><button data-k="U">↑</button><button data-k="L">←</button><button data-k="D">↓</button><button data-k="R">→</button></div>';
  stage.appendChild(w);
  let display=w.querySelector('.sequenceDisplay'),label=w.querySelector('.sequenceLabel'),prompt=w.querySelector('.sequencePrompt'),dots=w.querySelector('.sequenceDots'),buttons=[...w.querySelectorAll('.seqPad button')];
  const symbols={U:'↑',D:'↓',L:'←',R:'→'},keys=['U','D','L','R'];
  let round=1,seq=[],input=[],locked=true,confirmRound4=false,playToken=0;

  function setButtons(enabled){
    buttons.forEach(b=>{b.disabled=!enabled;b.style.opacity=enabled?'1':'.42'});
  }
  function renderDots(){
    dots.innerHTML='';
    for(let i=0;i<5;i++){
      let d=document.createElement('i');
      if(i<round-1)d.className='on';
      dots.appendChild(d);
    }
  }
  function newSequence(){
    const lengths=[3,4,4,5,5];
    seq=Array.from({length:lengths[round-1]},()=>keys[Math.floor(Math.random()*keys.length)]);
    input=[];
    metric.textContent='ROUND '+round+' / 5';
    renderDots();
    playSequence();
  }
  function showSingle(k,n,total,token){
    if(token!==playToken)return;
    display.innerHTML='';
    let a=document.createElement('div');
    a.className='seqArrow';
    a.textContent=symbols[k];
    a.style.transform='scale(1.12)';
    display.appendChild(a);
    prompt.textContent=(n+1)+' / '+total;
  }
  function playSequence(){
    playToken++;
    const token=playToken;
    locked=true;
    input=[];
    setButtons(false);
    label.textContent='MEMORIZZA';
    display.innerHTML='';
    prompt.textContent='3';
    later(()=>{if(token===playToken)prompt.textContent='2'},360);
    later(()=>{if(token===playToken)prompt.textContent='1'},720);
    later(()=>{
      if(token!==playToken)return;
      prompt.textContent='';
      const onMs=round>=4?520:600;
      const gapMs=170;
      seq.forEach((k,i)=>{
        let at=i*(onMs+gapMs);
        later(()=>showSingle(k,i,seq.length,token),at);
        later(()=>{if(token===playToken)display.innerHTML=''},at+onMs);
      });
      let end=seq.length*(onMs+gapMs)+120;
      later(()=>{
        if(token!==playToken)return;
        display.innerHTML='';
        label.textContent='TOCCA I TASTI';
        prompt.textContent='0 / '+seq.length;
        locked=false;
        input=[];
        setButtons(true);
      },end);
    },1080);
  }
  function wrong(){
    if(locked)return;
    locked=true;
    setButtons(false);
    input=[];
    feedback('Sequenza errata','bad');
    label.textContent='RIPROVA';
    prompt.textContent='te la mostro di nuovo';
    display.innerHTML='';
    later(playSequence,720);
  }
  function completeRound(){
    locked=true;
    setButtons(false);
    input=[];
    if(round===4&&!confirmRound4){
      confirmRound4=true;
      feedback('Conferma round','soft');
      label.textContent='CONFERMA';
      prompt.textContent='ripeti la stessa sequenza una volta';
      later(playSequence,650);
      return;
    }
    feedback('Corretto','soft');
    if(round>=5){
      renderDots();
      later(()=>win('Sequenze completate.'),420);
      return;
    }
    round++;
    label.textContent='CORRETTO';
    prompt.textContent='round successivo';
    later(newSequence,650);
  }
  function press(k,b){
    if(locked)return;
    b.animate?.([{transform:'scale(1)'},{transform:'scale(.91)'},{transform:'scale(1)'}],{duration:150});
    let idx=input.length;
    if(k!==seq[idx])return wrong();
    input.push(k);
    prompt.textContent=input.length+' / '+seq.length;
    if(input.length===seq.length)completeRound();
  }
  buttons.forEach(b=>on(b,'pointerdown',e=>{e.preventDefault();e.stopPropagation();press(b.dataset.k,b)}));
  setButtons(false);
  newSequence();
}
