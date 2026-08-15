"use strict";
const $=s=>document.querySelector(s), canvas=$("#gameCanvas"), ctx=canvas.getContext("2d");
const home=$("#home"), intro=$("#introLevel"), game=$("#game"), hud=$("#hud"), overlay=$("#resultOverlay"), final=$("#final");
const metric=$("#metric"), livesEl=$("#lives"), stageTitle=$("#stageTitle"), tip=$("#tip"), joy=$("#joy"), stick=$("#stick"), action=$("#action");
let W=0,H=0,DPR=1, raf=0, active=false, level=1, state=null, last=0;
let unlocked=Math.max(1,Math.min(6,+localStorage.getItem("amelieUnlocked")||1));
const taunts=["Prestazione rivedibile.","Musino si aspettava qualcosina in più.","Tentativo registrato. Preferiremmo dimenticarlo.","Okay. Questa non era fortissima.","Il sistema suggerisce: riprovare.","Amelie, abbiamo margine.","Non è successo niente. Nessuno ha visto.","Statisticamente poteva andare meglio."];
const info={
1:{title:"Catch Combo",desc:"Prendi i target giusti, evita quelli sbagliati e costruisci una combo. Qui il tapping casuale viene punito.",rules:[["♥","3 vite"],["◎","14 punti per vincere"],["💔","target sbagliato = vita persa"]]},
2:{title:"Dodge the Kiss",desc:"Joystick virtuale. Sopravvivi 18 secondi mentre i bacini arrivano dai bordi e diventano progressivamente meno educati.",rules:[["◉","muoviti col joystick"],["18s","sopravvivi"],["♥","3 colpi e si ricomincia"]]},
3:{title:"Perfect Timing",desc:"Ferma l'indicatore dentro la zona rosa. Cinque centri prima di tre errori.",rules:[["TAP","tocca ovunque"],["5×","centri richiesti"],["×3","tre errori = game over"]]},
4:{title:"Pattern Memory",desc:"Guarda la sequenza e ripetila. Ogni round aggiunge un elemento. Niente screenshot, grazie.",rules:[["4","quattro pad"],["5","round da superare"],["♥","3 errori totali"]]},
5:{title:"Heart Maze",desc:"Porta il cuore fino all'uscita con il joystick. Pareti e ostacoli mobili non collaborano.",rules:[["◉","joystick"],["25s","tempo limite"],["♥","3 collisioni"]]},
6:{title:"BOSS // Heart of Musino",desc:"Tre fasi. Schiva gli attacchi, raccogli energia e colpisci il cuore quando il tasto HIT si carica.",rules:[["3","fasi"],["◉","joystick"],["HIT","si carica raccogliendo 3 orb"]]}
};
function resize(){DPR=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;canvas.width=Math.floor(W*DPR);canvas.height=Math.floor(H*DPR);canvas.style.width=W+"px";canvas.style.height=H+"px";ctx.setTransform(DPR,0,0,DPR,0,0)}
addEventListener("resize",resize);resize();
function screensOff(){document.querySelectorAll(".screen").forEach(x=>x.classList.remove("on"))}
function showHome(){stop();screensOff();home.classList.add("on");renderMap()}
function renderMap(){const m=$("#homeMap");m.innerHTML="";for(let i=1;i<=6;i++){let p=document.createElement("div");p.className="pip"+(i<unlocked?" done":i===unlocked?" now":"");m.appendChild(p)}$("#startBtn").textContent=unlocked>1?"continua":"inizia"}
function introLevel(n){stop();level=n;screensOff();intro.classList.add("on");$("#bigNum").textContent=n===6?"BOSS":String(n).padStart(2,"0");$("#introBrand").textContent=n===6?"FINAL STAGE":"LEVEL "+String(n).padStart(2,"0");$("#introTitle").textContent=info[n].title;$("#introDesc").textContent=info[n].desc;const r=$("#introRules");r.innerHTML="";info[n].rules.forEach(([a,b])=>{let d=document.createElement("div");d.className="rule";d.innerHTML='<div class="icon">'+a+'</div><div><b>'+b+'</b><br><span>'+ruleSub(a,b)+'</span></div>';r.appendChild(d)})}
function ruleSub(a,b){if(b.includes("vite"))return "Finite le vite, il livello riparte.";if(b.includes("joystick"))return "Pensato per il pollice sinistro.";if(b.includes("tempo"))return "Sì, c'è pressione.";if(b.includes("round"))return "La memoria verrà giudicata.";return "Niente scorciatoie."}
$("#startBtn").onclick=()=>introLevel(unlocked);$("#resetBtn").onclick=()=>{localStorage.removeItem("amelieUnlocked");localStorage.removeItem("amelieBest");unlocked=1;renderMap()};$("#playBtn").onclick=()=>startLevel(level);
function setHUD(title,m=""){stageTitle.textContent=title;metric.textContent=m;hud.classList.add("on")}
function setLives(n){livesEl.textContent="♥".repeat(Math.max(0,n))+"♡".repeat(Math.max(0,3-n))}
function startLevel(n){screensOff();overlay.classList.remove("on");game.classList.add("on");level=n;active=true;last=performance.now();action.classList.remove("on");joy.classList.remove("on");tip.textContent="";resetJoy();if(n===1)initCatch();if(n===2)initDodge();if(n===3)initTiming();if(n===4)initMemory();if(n===5)initMaze();if(n===6)initBoss();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}
function stop(){active=false;cancelAnimationFrame(raf);game.classList.remove("on");hud.classList.remove("on");joy.classList.remove("on");action.classList.remove("on");resetJoy()}
function win(extra=""){active=false;cancelAnimationFrame(raf);const next=Math.min(7,level+1);if(level<6&&unlocked<next){unlocked=next;localStorage.setItem("amelieUnlocked",unlocked)}$("#resultStatus").textContent="LEVEL CLEAR";$("#resultTitle").textContent=level===6?"Boss sconfitto. Tecnicamente.":"Pulito.";$("#resultText").textContent=extra||["Combo accettabile. Musino approva.","Sei sopravvissuta ai bacini. Per ora.","Timing sorprendentemente competente.","Memoria promossa.","Cuore consegnato senza danni."][level-1];$("#resultBtn").textContent=level===6?"vedi il finale":"continua";$("#resultBtn").onclick=()=>{overlay.classList.remove("on");if(level===6)showFinal();else introLevel(level+1)};overlay.classList.add("on")}
function lose(reason=""){active=false;cancelAnimationFrame(raf);$("#resultStatus").textContent="GAME OVER";$("#resultTitle").textContent=taunts[Math.floor(Math.random()*taunts.length)];$("#resultText").textContent=reason||"Riprova.";$("#resultBtn").textContent="riprova";$("#resultBtn").onclick=()=>{overlay.classList.remove("on");startLevel(level)};overlay.classList.add("on")}
function showFinal(){stop();screensOff();final.classList.add("on");localStorage.setItem("amelieUnlocked",6)}
function loop(t){if(!active)return;const dt=Math.min(.034,(t-last)/1000);last=t;ctx.clearRect(0,0,W,H);if(level===1)updateCatch(dt,t);else if(level===2)updateDodge(dt,t);else if(level===3)updateTiming(dt,t);else if(level===4)updateMemory(dt,t);else if(level===5)updateMaze(dt,t);else updateBoss(dt,t);raf=requestAnimationFrame(loop)}
function rr(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function txt(s,x,y,size=16,color="#fff",align="center",weight=800){ctx.fillStyle=color;ctx.font=weight+" "+size+"px -apple-system,system-ui,sans-serif";ctx.textAlign=align;ctx.textBaseline="middle";ctx.fillText(s,x,y)}
function heart(x,y,r,color="#ff78a7"){ctx.save();ctx.translate(x,y);ctx.scale(r/30,r/30);ctx.beginPath();ctx.moveTo(0,10);ctx.bezierCurveTo(-34,-12,-20,-34,0,-18);ctx.bezierCurveTo(20,-34,34,-12,0,22);ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.restore()}
function circle(x,y,r,c){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=c;ctx.fill()}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function pointerPos(e){const r=canvas.getBoundingClientRect(),p=e.touches?e.touches[0]:e;return{x:p.clientX-r.left,y:p.clientY-r.top}}
let canvasHandler=null;function setCanvasTap(fn){if(canvasHandler)canvas.removeEventListener("pointerdown",canvasHandler);canvasHandler=e=>{e.preventDefault();fn(pointerPos(e),e)};canvas.addEventListener("pointerdown",canvasHandler,{passive:false})}
