"use strict";
const $=s=>document.querySelector(s), canvas=$("#gameCanvas"), ctx=canvas.getContext("2d");
const home=$("#home"), intro=$("#introLevel"), game=$("#game"), hud=$("#hud"), overlay=$("#resultOverlay"), final=$("#final");
const metric=$("#metric"), livesEl=$("#lives"), stageTitle=$("#stageTitle"), tip=$("#tip"), joy=$("#joy"), stick=$("#stick"), action=$("#action");
let W=0,H=0,DPR=1,raf=0,active=false,level=1,state=null,last=0;
let unlocked=Math.max(1,Math.min(6,+localStorage.getItem("amelieUnlockedV2")||1));
const taunts=["Questa la rifacciamo.","Amelie… quasi.","Musino ha visto tutto, ma resta diplomatico.","Era molto più vicina di quanto sembri.","Riprova, questa la prendi.","Okay, il gioco si è montato un po’ la testa.","Un altro giro e ci siamo."];
const info={
1:{title:"Bacino al volo",desc:"Ogni 💋 ti indica una direzione. Fai lo swipe giusto prima di pensare troppo.",rules:[["👆","scorri il dito"],["9×","nove swipe corretti"],["❤️","3 errori"]]},
2:{title:"Il mazzo",desc:"Trascina il cestino, raccogli le 🌹 e lascia cadere le 🥀. Semplice finché non accelera.",rules:[["🧺","trascina il cestino"],["🌹","raccogline 10"],["❤️","3 errori"]]},
3:{title:"Filo rosa",desc:"Tieni il dito sullo schermo e collega i ❤️ nell’ordine giusto senza passare sui 💔.",rules:[["☝️","tieni premuto"],["1→6","segui l’ordine"],["💔","non toccarli"]]},
4:{title:"A tempo",desc:"Tre corsie, simboli che scendono e una linea rosa. Tocca la corsia giusta quando arrivano lì.",rules:[["🎵","segui il ritmo"],["14×","quattordici colpi"],["❤️","3 errori"]]},
5:{title:"Torre di rose",desc:"Il blocco si muove da solo. Tocca per farlo cadere e costruisci una torre di 🌹 senza farla crollare.",rules:[["👆","tocca per lasciare"],["7","sette piani"],["❤️","3 cadute"]]},
6:{title:"Il Portone",desc:"Niente fight. Tre serrature, tre prove diverse. Apri il portone e arrivi al finale.",rules:[["🗝️","trova le chiavi"],["↔️","segui gli swipe"],["🚪","apri la porta"]]}
};
function resize(){DPR=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;canvas.width=Math.floor(W*DPR);canvas.height=Math.floor(H*DPR);canvas.style.width=W+"px";canvas.style.height=H+"px";ctx.setTransform(DPR,0,0,DPR,0,0)}
addEventListener("resize",resize);resize();
function screensOff(){document.querySelectorAll(".screen").forEach(x=>x.classList.remove("on"))}
function showHome(){stop();screensOff();home.classList.add("on");renderMap()}
function renderMap(){const m=$("#homeMap");m.innerHTML="";for(let i=1;i<=6;i++){let p=document.createElement("div");p.className="pip"+(i<unlocked?" done":i===unlocked?" now":"");m.appendChild(p)}$("#startBtn").textContent=unlocked>1?"continua":"inizia"}
function introLevel(n){stop();level=n;screensOff();intro.classList.add("on");$("#bigNum").textContent=n===6?"BOSS":String(n).padStart(2,"0");$("#introBrand").textContent=n===6?"SFIDA FINALE":"LIVELLO "+String(n).padStart(2,"0");$("#introTitle").textContent=info[n].title;$("#introDesc").textContent=info[n].desc;const r=$("#introRules");r.innerHTML="";info[n].rules.forEach(([a,b])=>{let d=document.createElement("div");d.className="rule";let cls="icon"+(String(a).length>3?" long":"");d.innerHTML='<div class="'+cls+'">'+a+'</div><div><b>'+b+'</b><br><span>'+ruleSub(b)+'</span></div>';r.appendChild(d)})}
function ruleSub(b){if(b.includes("errori")||b.includes("cadute"))return "Se finiscono, riparti da questo livello.";if(b.includes("nove")||b.includes("dieci")||b.includes("quattordici")||b.includes("sette"))return "Completa l’obiettivo e passi avanti.";if(b.includes("chiavi"))return "Quelle dorate sono quelle giuste.";if(b.includes("swipe"))return "La seconda serratura vuole precisione.";if(b.includes("porta"))return "L’ultima non si apre da sola.";return "Regola semplice."}
$("#startBtn").onclick=()=>introLevel(unlocked);$("#resetBtn").onclick=()=>{localStorage.removeItem("amelieUnlockedV2");unlocked=1;renderMap()};$("#playBtn").onclick=()=>startLevel(level);
function setHUD(title,m=""){stageTitle.textContent=title;metric.textContent=m;hud.classList.add("on")}
function setLives(n){livesEl.textContent="♥".repeat(Math.max(0,n))+"♡".repeat(Math.max(0,3-n))}
function startLevel(n){screensOff();overlay.classList.remove("on");game.classList.add("on");level=n;active=true;last=performance.now();joy.classList.remove("on");action.classList.remove("on","ready");tip.textContent="";if(typeof clearGestures==='function')clearGestures();if(n===1)initSwipe();if(n===2)initBouquet();if(n===3)initLink();if(n===4)initRhythm();if(n===5)initStack();if(n===6)initPortone();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}
function stop(){active=false;cancelAnimationFrame(raf);game.classList.remove("on");hud.classList.remove("on");joy.classList.remove("on");action.classList.remove("on","ready");if(typeof clearGestures==='function')clearGestures()}
function win(extra=""){active=false;cancelAnimationFrame(raf);if(typeof clearGestures==='function')clearGestures();const next=Math.min(7,level+1);if(level<6&&unlocked<next){unlocked=next;localStorage.setItem("amelieUnlockedV2",unlocked)}$("#resultStatus").textContent=level===6?"PORTONE APERTO":"LIVELLO SUPERATO";$("#resultTitle").textContent=level===6?"Ce l’hai fatta ❤️":"Brava, Amelie.";$("#resultText").textContent=extra||"Fatto.";$("#resultBtn").textContent=level===6?"vedi il finale":"continua";$("#resultBtn").onclick=()=>{overlay.classList.remove("on");if(level===6)showFinal();else introLevel(level+1)};overlay.classList.add("on")}
function lose(reason=""){active=false;cancelAnimationFrame(raf);if(typeof clearGestures==='function')clearGestures();$("#resultStatus").textContent="RIPROVA";$("#resultTitle").textContent=taunts[Math.floor(Math.random()*taunts.length)];$("#resultText").textContent=reason||"Facciamone un’altra.";$("#resultBtn").textContent="riprova";$("#resultBtn").onclick=()=>{overlay.classList.remove("on");startLevel(level)};overlay.classList.add("on")}
function showFinal(){stop();screensOff();final.classList.add("on");localStorage.setItem("amelieUnlockedV2",6)}
function loop(t){if(!active)return;const dt=Math.min(.034,(t-last)/1000);last=t;ctx.clearRect(0,0,W,H);if(level===1)updateSwipe(dt,t);else if(level===2)updateBouquet(dt,t);else if(level===3)updateLink(dt,t);else if(level===4)updateRhythm(dt,t);else if(level===5)updateStack(dt,t);else updatePortone(dt,t);raf=requestAnimationFrame(loop)}
function rr(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function txt(s,x,y,size=16,color="#fff",align="center",weight=800){ctx.fillStyle=color;ctx.font=weight+" "+size+"px -apple-system,system-ui,sans-serif";ctx.textAlign=align;ctx.textBaseline="middle";ctx.fillText(s,x,y)}
function emoji(s,x,y,size=42){ctx.save();ctx.font=size+'px "Apple Color Emoji","Segoe UI Emoji",sans-serif';ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(s,x,y);ctx.restore()}
function circle(x,y,r,c){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=c;ctx.fill()}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
let canvasHandler=null;
