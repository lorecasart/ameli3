"use strict";
const $=s=>document.querySelector(s), canvas=$("#gameCanvas"), ctx=canvas.getContext("2d");
const home=$("#home"), intro=$("#introLevel"), game=$("#game"), hud=$("#hud"), overlay=$("#resultOverlay"), final=$("#final");
const metric=$("#metric"), livesEl=$("#lives"), stageTitle=$("#stageTitle"), tip=$("#tip"), joy=$("#joy"), stick=$("#stick"), action=$("#action");
let W=0,H=0,DPR=1, raf=0, active=false, level=1, state=null, last=0;
let unlocked=Math.max(1,Math.min(6,+localStorage.getItem("amelieUnlocked")||1));
const taunts=["Prestazione rivedibile.","Musino si aspettava qualcosina in più.","Tentativo registrato. Preferiremmo dimenticarlo.","Okay. Questa non era fortissima.","Il sistema suggerisce: riprovare.","Amelie, abbiamo margine.","Non è successo niente. Nessuno ha visto.","Statisticamente poteva andare meglio."];
const info={
1:{title:"Caccia al bacino",desc:"Prendi i bersagli giusti, evita quelli sbagliati e costruisci una combo. Toccare a caso qui costa vite.",rules:[["♥","3 vite"],["◎","14 punti per vincere"],["💔","bersaglio sbagliato = vita persa"]]},
2:{title:"Schiva i bacini",desc:"Muoviti col joystick e resisti 18 secondi. I bacini arrivano dai bordi e diventano sempre meno educati.",rules:[["◉","joystick a destra"],["18s","resisti fino alla fine"],["♥","3 colpi e si ricomincia"]]},
3:{title:"Tempismo perfetto",desc:"Tocca quando l'indicatore entra nella zona rosa. Servono cinque centri prima di tre errori.",rules:[["TOCCA","tocca lo schermo"],["5×","cinque centri"],["×3","tre errori e perdi"]]},
4:{title:"Memoria",desc:"Guarda la sequenza e ripetila. Ora sono sette round, la sequenza si allunga e accelera.",rules:[["4","quattro simboli"],["7","sette round"],["♥","3 errori totali"]]},
5:{title:"Labirinto del cuore",desc:"Porta il cuore fino all'uscita col joystick. Il percorso è più stretto, gli ostacoli si muovono e il tempo è meno generoso.",rules:[["◉","joystick a destra"],["20s","tempo limite"],["♥","3 collisioni"]]},
6:{title:"Cuore di Musino",desc:"Tre fasi. Schiva gli attacchi, raccogli tre ✦ dorate e poi premi COLPISCI. Il joystick è a destra, il colpo a sinistra.",rules:[["3","tre fasi"],["✦","raccogline 3"],["COLPISCI","premi solo quando si illumina"]]}
};
function resize(){DPR=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;canvas.width=Math.floor(W*DPR);canvas.height=Math.floor(H*DPR);canvas.style.width=W+"px";canvas.style.height=H+"px";ctx.setTransform(DPR,0,0,DPR,0,0)}
addEventListener("resize",resize);resize();
function screensOff(){document.querySelectorAll(".screen").forEach(x=>x.classList.remove("on"))}
function showHome(){stop();screensOff();home.classList.add("on");renderMap()}
function renderMap(){const m=$("#homeMap");m.innerHTML="";for(let i=1;i<=6;i++){let p=document.createElement("div");p.className="pip"+(i<unlocked?" done":i===unlocked?" now":"");m.appendChild(p)}$("#startBtn").textContent=unlocked>1?"continua":"inizia"}
function introLevel(n){stop();level=n;screensOff();intro.classList.add("on");$("#bigNum").textContent=n===6?"BOSS":String(n).padStart(2,"0");$("#introBrand").textContent=n===6?"SFIDA FINALE":"LIVELLO "+String(n).padStart(2,"0");$("#introTitle").textContent=info[n].title;$("#introDesc").textContent=info[n].desc;const r=$("#introRules");r.innerHTML="";info[n].rules.forEach(([a,b])=>{let d=document.createElement("div");d.className="rule";d.innerHTML='<div class="icon">'+a+'</div><div><b>'+b+'</b><br><span>'+ruleSub(a,b)+'</span></div>';r.appendChild(d)})}
function ruleSub(a,b){if(b.includes("vite"))return "Quando finiscono, riparti da questo livello.";if(b.includes("joystick"))return "Tieni il pollice destro sul controllo.";if(b.includes("tempo"))return "Il cronometro non aspetta.";if(b.includes("round"))return "Ogni giro diventa più difficile.";if(b.includes("raccogline"))return "Servono per caricare il colpo.";return "Niente scorciatoie."}
$("#startBtn").onclick=()=>introLevel(unlocked);$("#resetBtn").onclick=()=>{localStorage.removeItem("amelieUnlocked");localStorage.removeItem("amelieBest");unlocked=1;renderMap()};$("#playBtn").onclick=()=>startLevel(level);
function setHUD(title,m=""){stageTitle.textContent=title;metric.textContent=m;hud.classList.add("on")}
function setLives(n){livesEl.textContent="♥".repeat(Math.max(0,n))+"♡".repeat(Math.max(0,3-n))}
function startLevel(n){screensOff();overlay.classList.remove("on");game.classList.add("on");level=n;active=true;last=performance.now();action.classList.remove("on","ready");joy.classList.remove("on");tip.textContent="";resetJoy();if(n===1)initCatch();if(n===2)initDodge();if(n===3)initTiming();if(n===4)initMemory();if(n===5)initMaze();if(n===6)initBoss();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}
function stop(){active=false;cancelAnimationFrame(raf);game.classList.remove("on");hud.classList.remove("on");joy.classList.remove("on");action.classList.remove("on","ready");resetJoy()}
function win(extra=""){active=false;cancelAnimationFrame(raf);const next=Math.min(7,level+1);if(level<6&&unlocked<next){unlocked=next;localStorage.setItem("amelieUnlocked",unlocked)}$("#resultStatus").textContent="LIVELLO SUPERATO";$("#resultTitle").textContent=level===6?"Boss sconfitto. Più o meno.":"Fatto.";$("#resultText").textContent=extra||["Combo accettabile. Musino approva.","Sei sopravvissuta ai bacini. Per ora.","Tempismo sorprendentemente competente.","Memoria promossa.","Cuore consegnato quasi intero."][level-1];$("#resultBtn").textContent=level===6?"vedi il finale":"continua";$("#resultBtn").onclick=()=>{overlay.classList.remove("on");if(level===6)showFinal();else introLevel(level+1)};overlay.classList.add("on")}
function lose(reason=""){active=false;cancelAnimationFrame(raf);$("#resultStatus").textContent="HAI PERSO";$("#resultTitle").textContent=taunts[Math.floor(Math.random()*taunts.length)];$("#resultText").textContent=reason||"Riprova.";$("#resultBtn").textContent="riprova";$("#resultBtn").onclick=()=>{overlay.classList.remove("on");startLevel(level)};overlay.classList.add("on")}
function showFinal(){stop();screensOff();final.classList.add("on");localStorage.setItem("amelieUnlocked",6)}
function loop(t){if(!active)return;const dt=Math.min(.034,(t-last)/1000);last=t;ctx.clearRect(0,0,W,H);if(level===1)updateCatch(dt,t);else if(level===2)updateDodge(dt,t);else if(level===3)updateTiming(dt,t);else if(level===4)updateMemory(dt,t);else if(level===5)updateMaze(dt,t);else updateBoss(dt,t);raf=requestAnimationFrame(loop)}
function rr(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function txt(s,x,y,size=16,color="#fff",align="center",weight=800){ctx.fillStyle=color;ctx.font=weight+" "+size+"px -apple-system,system-ui,sans-serif";ctx.textAlign=align;ctx.textBaseline="middle";ctx.fillText(s,x,y)}
function emoji(s,x,y,size=42){ctx.save();ctx.font=size+'px "Apple Color Emoji","Segoe UI Emoji",sans-serif';ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(s,x,y);ctx.restore()}
function heart(x,y,r,color="#ff78a7"){ctx.save();ctx.translate(x,y);ctx.scale(r/30,r/30);ctx.beginPath();ctx.moveTo(0,10);ctx.bezierCurveTo(-34,-12,-20,-34,0,-18);ctx.bezierCurveTo(20,-34,34,-12,0,22);ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.restore()}
function circle(x,y,r,c){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=c;ctx.fill()}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function pointerPos(e){const r=canvas.getBoundingClientRect(),p=e.touches?e.touches[0]:e;return{x:p.clientX-r.left,y:p.clientY-r.top}}
let canvasHandler=null;function setCanvasTap(fn){if(canvasHandler)canvas.removeEventListener("pointerdown",canvasHandler);canvasHandler=e=>{e.preventDefault();fn(pointerPos(e),e)};canvas.addEventListener("pointerdown",canvasHandler,{passive:false})}
