import {safePosition} from './navigation.js?v=0.13.3';
import {interactionView} from './interaction-view.js?v=0.13.3';
import {createArchiveUI} from './archive-ui.js?v=0.13.3';
import {archiveObjective} from './archive.js?v=0.13.3';
import {createHillUI} from './hill-ui.js?v=0.13.3';
import {HILL_RECIPES} from './hill.js?v=0.13.3';
import {createNeighborhoodUI} from './neighborhood-ui.js?v=0.13.3';
import {neighborObjective} from './neighborhood.js?v=0.13.3';
import {createTownUI} from './town-ui.js?v=0.13.3';
import {waterAvailable,lucyLocation,townObjective} from './town.js?v=0.13.3';
import {createWaterUI} from './water-ui.js?v=0.13.3';
import {waterObjective} from './water.js?v=0.13.3';
import {ROOMS,sceneOf} from './indoors.js?v=0.13.3';
import {createLifeUI} from './life-ui.js?v=0.13.3';
import {SAVE_KEY,ITEMS,CROPS,RECIPES,createState,act,isNight,isRipe,clockText,objective,canPay,parseSave} from './rules.js?v=0.13.3';
import {World,SPOTS,PLOTS,walkable} from './world.js?v=0.13.3';
import {icon} from './icons.js?v=0.13.3';
import {itemArt} from './item-art.js?v=0.13.3';
import {TOOLS,assignQuickItem} from './quickbar.js?v=0.13.3';
import {REGIONS,REGION_ORDER,regionOf,regionForTarget,nextExit} from './regions.js?v=0.13.3';
import {expansionObjective,EXPANSION_RECIPES} from './expansion.js?v=0.13.3';
import {portraitMarkup} from './characters.js?v=0.13.3';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state=createState(),storageOK=true,loadMessage='',hasSave=false;
try{const saved=localStorage.getItem(SAVE_KEY);if(saved){state=parseSave(saved);hasSave=true;}}catch(e){loadMessage=`读取旧进度失败：${e.message}。已进入新庄园，旧文件不会被主动删除。`;storageOK=false;}
state.player=safePosition(state.player,sceneOf(state));
let tool='hand',seed='wheat',modalKind='',actionMap=new Map(),nextAction=0,lastFocus=null,lastQuest='',uiElapsed=0,saveElapsed=0,audioContext=null,guideActive=false,lateNotified=false;
let tracking='main',destinationRegion=null,neighborId='taoen';
const currentObjective=()=>tracking==='archive'?archiveObjective(state):tracking==='neighbor'?neighborObjective(state,neighborId):tracking==='water'?waterObjective(state):tracking==='postal'?expansionObjective(state):objective(state);
const world=new World($('#world'),()=>state,interact,message=>toast(message,'error'));
const lifeUI=createLifeUI({getState:()=>state,world,run,openModal,closeModal,button,mini,dialogue,toast,chime,showHome,showLucy,showVera,showShop,showJournal,ITEMS,hillRecipes:again=>hillUI.recipeHTML(again)});
const waterUI=createWaterUI({getState:()=>state,world,run,openModal,closeModal,button,toast,ITEMS,playSound:combatSound,mark:()=>{tracking='water';destinationRegion=null;guideActive=true;world.guide=waterObjective(state).target;refresh();}});
const neighborUI=createNeighborhoodUI({getState:()=>state,world,run,openModal,closeModal,button,showJournal,canPay,mark:id=>{neighborId=id;tracking='neighbor';destinationRegion=null;guideActive=true;world.guide=neighborObjective(state,id).target;refresh();}});
const townUI=createTownUI({getState:()=>state,world,run,openModal,closeModal,button,showLucy,showJournal,ITEMS,neighborPerson:neighborUI.person,hillBoard:()=>hillUI.board(),archiveBoard:()=>archiveUI.board(),hillRecipes:again=>hillUI.recipeHTML(again),mark:()=>{tracking='main';destinationRegion=null;guideActive=true;world.guide=objective(state).target;refresh();}});
const hillUI=createHillUI({getState:()=>state,world,run,openModal,closeModal,button,showJournal,canPay,ITEMS,mark:()=>{tracking='main';destinationRegion=null;guideActive=true;world.guide=objective(state).target;refresh();}});
const archiveUI=createArchiveUI({getState:()=>state,world,run,openModal,closeModal,button,waterUI,mark:()=>{tracking='archive';destinationRegion=null;guideActive=true;world.guide=archiveObjective(state).target;refresh();}});
let selectedSlot=0,quickbarStamp='',heldStamp='',wheelAt=0;
const itemName=k=>TOOLS[k]?.name||ITEMS[k]?.name||'空手';
function heldTip(key){if(['tomatoSeed','mintSeed'].includes(key))return '温室专用种子 · 点击对应育苗床播种';if(key==='water'&&state.neighborhood.waterCan)return state.neighborhood.wideMode?'2×2 浇水 · 仅需水的作物消耗体力 · B 切换':'单格浇水 · B 可切换 2×2';return TOOLS[key]?.tip||(key.endsWith('Seed')?`点击空田播种 · ${key==='wheatSeed'?'浇水 1 夜成熟':'浇水 2 夜成熟'}`:'制作与交付会使用背包里的物品');}
function setSlot(index,toggle=false){
  if(modalKind||lifeUI.active||waterUI.active)return;
  const key=state.quickbar[index],wasSelected=index===selectedSlot;selectedSlot=index;
  tool=key==='water'?'water':key.endsWith('Seed')?'seed':key==='lantern'?'lantern':key==='rod'?'rod':'hand';
  if(tool==='seed')seed=key==='wheatSeed'?'wheat':'pumpkin';world.tool=tool;
  if(toggle&&wasSelected&&key==='lantern')run('lantern');
  refresh();
}
function renderQuickbar(){
  const key=state.quickbar[selectedSlot];
  const stamp=JSON.stringify([state.quickbar,state.inventory,selectedSlot,state.lantern]);
  if(stamp!==quickbarStamp){
    const focused=document.activeElement?.dataset.slot;
    $('#quickbar').innerHTML=state.quickbar.map((k,i)=>`<button class="item-slot ${i===selectedSlot?'selected':''} ${ITEMS[k]&&state.inventory[k]===0?'empty':''}" data-slot="${i}" aria-pressed="${i===selectedSlot}" aria-label="快捷格 ${i===9?0:i+1}：${itemName(k)}${ITEMS[k]?`，数量 ${state.inventory[k]}`:''}" title="${itemName(k)} · ${heldTip(k)}"><kbd>${(i+1)%10}</kbd>${itemArt(k)}${ITEMS[k]?`<b class="quantity">${state.inventory[k]}</b>`:''}${k==='lantern'?`<i class="lamp-dot ${state.lantern?'on':''}"></i>`:''}</button>`).join('');
    if(focused!==undefined)$(`#quickbar [data-slot="${focused}"]`)?.focus({preventScroll:true});
    quickbarStamp=stamp;
  }
  const description=`<strong>${itemName(key)}</strong><span>${key==='lantern'?`${state.lantern?'已点亮':'未点亮'} · 按 L 开关` : heldTip(key)}</span>`;
  if(description!==heldStamp){$('#held-item').innerHTML=description;heldStamp=description;}
}

function toast(text,kind='success'){const el=document.createElement('div');el.className=`toast ${kind==='error'?'error':''}`;el.textContent=text;$('#toasts').append(el);while($('#toasts').children.length>3)$('#toasts').firstElementChild.remove();setTimeout(()=>{el.classList.add('fade');setTimeout(()=>el.remove(),350);},4300);}
function save(){
  if(!storageOK){$('#save-status').textContent='请导出存档备份';return;}
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));$('#save-status').textContent='已自动保存';}catch{storageOK=false;$('#save-status').textContent='请导出存档备份';toast('浏览器无法保存进度，请在设置里导出存档备份','error');}
}
function combatSound(kind){
 if(!state.settings.sound)return;
 try{audioContext||=new (window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume();const spec={sword:[260,90,.10,'triangle'],stab:[190,100,.07,'triangle'],arrow:[900,270,.08,'triangle'],light:[540,960,.16,'sine'],block:[1400,350,.08,'square'],charge:[180,440,.15,'sine'],pulse:[660,130,.3,'sine']}[kind];if(!spec)return;const [from,to,duration,type]=spec,now=audioContext.currentTime,osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type=type;osc.frequency.setValueAtTime(from,now);osc.frequency.exponentialRampToValueAtTime(to,now+duration);gain.gain.setValueAtTime(.0001,now);gain.gain.linearRampToValueAtTime(kind==='block'?.009:.022,now+.01);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);osc.connect(gain);gain.connect(audioContext.destination);osc.start(now);osc.stop(now+duration+.02);}catch{state.settings.sound=false;}
}
function chime(kind='success'){
  if(!state.settings.sound)return;
  try{audioContext||=new (window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume();const now=audioContext.currentTime;const notes=kind==='error'?[174]:kind==='sleep'?[330,440,523,659]:[523,659];notes.forEach((f,i)=>{const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='sine';osc.frequency.value=f;gain.gain.setValueAtTime(0,now+i*.08);gain.gain.linearRampToValueAtTime(.035,now+i*.08+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+i*.08+.4);osc.connect(gain);gain.connect(audioContext.destination);osc.start(now+i*.08);osc.stop(now+i*.08+.42);});}catch{toast('当前浏览器暂不支持音效','error');state.settings.sound=false;}
}
function run(type,payload={}){
  const crop=payload.crop||state.plots[payload.index]?.crop;
  const result=act(state,type,payload);if(result.ok){state=result.state;if(['travel','sleep','enterRoom','exitRoom','waterFight','waterRetreat'].includes(type)){world.visitor=false;world.travelReset();if(regionOf(state)===destinationRegion)destinationRegion=null;}save();refresh();if(result.kind!=='quiet'){world.performAction(type,{...payload,crop});world.burst(state.player.x,state.player.y,type==='gather'?`+${payload.resource==='honey'?1:2} ${ITEMS[payload.resource].name}`:type==='harvest'?'收获！':type==='water'?'已浇水':type==='plant'?'已种下':'完成');}}
  if(result.kind!=='quiet')toast(result.message,result.kind);chime(result.ok?(type==='sleep'?'sleep':'success'):'error');return result.ok;
}
function refreshHint(){
 const target=world.nearest(),view=interactionView(target,state),hint=$('#interaction-hint');
 hint.dataset.kind=view.kind;hint.hidden=!target;document.body.classList.toggle('has-interaction',!!target);
 $('#interaction-category').textContent=view.category;
 let title=view.title;if(target?.index!==undefined&&!state.plots[target.index].crop)title=`种下${CROPS[seed].name}`;
 $('#interaction-text').textContent=title;
 $('#interaction-detail').textContent=view.detail||'';
 // Keep the keyboard target truthful; hovering another object never changes E's action.
 $('#touch-interact').textContent=target?(view.kind==='resource'&&view.ready?'采集':view.category):'互动';
}
function refresh(){
  const held=state.quickbar[selectedSlot];tool=held==='water'?'water':['wheatSeed','pumpkinSeed'].includes(held)?'seed':held==='lantern'?'lantern':held==='rod'?'rod':'hand';if(tool==='seed')seed=held==='wheatSeed'?'wheat':'pumpkin';world.tool=tool;
  $('#date').textContent=`秋 ${state.day} 日`;$('#time').textContent=clockText(state);$('#weather').textContent=state.weather==='rain'?'雨':isNight(state)?'夜':'晴';$('#weather-icon').innerHTML=icon(state.weather==='rain'?'rain':isNight(state)?'moon':'sun');$('#energy').textContent=`${state.energy} / 100`;$('#energy-fill').style.width=`${state.energy}%`;$('#energy-fill').style.background=state.energy<20?'#d09f74':'#a1bb87';$('.energy-track').setAttribute('aria-valuenow',state.energy);$('#coins').textContent=state.coins;
  const q=currentObjective();$('#quest-title').textContent=destinationRegion?'前往'+REGIONS[destinationRegion].name:q.title;$('#region-name').textContent=(ROOMS[sceneOf(state)]||REGIONS[regionOf(state)]).name;$('#world').setAttribute('aria-label',(ROOMS[sceneOf(state)]||REGIONS[regionOf(state)]).name+'，WASD 移动，E 交互，M 区域图');
  if(lastQuest&&lastQuest!==q.chapter){chime();$('#journal-button').classList.add('has-news');}lastQuest=q.chapter;
  if(guideActive)world.guide=destinationRegion?nextExit(regionOf(state),destinationRegion)?.id:q.target;
  renderQuickbar();refreshHint();
  document.body.classList.toggle('reduced',state.settings.reducedMotion);document.body.classList.toggle('indoors',!!state.life.room);
}
function button(label,fn,{primary=false,disabled='',small=''}={}){const id=String(++nextAction);actionMap.set(id,fn);return `<button class="action-button ${primary?'primary':''}" data-action="${id}" ${disabled?'disabled':''}><span>${esc(label)}${small||disabled?`<br><small>${esc(disabled||small)}</small>`:''}</span><span class="arr">${disabled?'—':'→'}</span></button>`;}
function mini(label,fn,disabled=false){const id=String(++nextAction);actionMap.set(id,fn);return `<button class="mini-button" data-action="${id}" ${disabled?'disabled':''}>${esc(label)}</button>`;}
function openModal(kind,kicker,title,body){
  if(lifeUI.active||waterUI.active)return;
  if($('#modal-overlay').classList.contains('hidden'))lastFocus=document.activeElement;
  modalKind=kind;actionMap=new Map();world.paused=true;world.path=[];world.pending=null;world.keys.clear();world.talkingTo=['lucy','shop','festival'].includes(kind)?'lucy':kind==='grave'?'oren':kind==='vera'?'vera':null;
  const content=body();
  const layout=['home','lucy','score','grave','table','festival','plot','vera','ledger','travel','bench','townTalk'].includes(kind)&&!content.includes('workbench')?'dialogue':'panel';
  const titles={home:'要休息了吗？',bag:'随身背包',journal:'守灯人手记',settings:'设置与存档',shop:state.life.room==='shop'?'露西杂货屋':'露西的摊位',oven:'石砌烤炉',mill:'旧磨坊'};
  $('#modal-overlay').dataset.layout=layout;$('#modal-overlay').dataset.kind=kind;
  $('#modal-body').innerHTML=`<h2 id="modal-title">${esc(titles[kind]||title)}</h2>${content}<div class="dialogue-controls">↑ ↓ 选择 · Enter 确定 · Esc 返回</div>`;
  $('#modal-overlay').classList.remove('hidden');document.body.classList.add('modal-open');$('#modal').scrollTop=0;
  for(const el of $('#game').children)if(el.id!=='modal-overlay'&&el.id!=='import-file')el.inert=true;
  requestAnimationFrame(()=>($('#modal .primary:not(:disabled)')||$('#modal .inventory-item.selected')||$('#modal .tabs .active')||$('#modal-close')).focus());
}
function closeModal(){world.hillGathering=false;lifeUI.releaseVisit();modalKind='';$('#modal-overlay').classList.add('hidden');document.body.classList.remove('modal-open');world.paused=false;world.talkingTo=null;world.keys.clear();for(const el of $('#game').children)el.inert=false;if(lastFocus?.isConnected&&!lastFocus.closest('[hidden],.hidden'))lastFocus.focus({preventScroll:true});else $('#world').focus({preventScroll:true});}
function recipeHTML(key){
  const r=RECIPES[key];
  return `<div class="workbench"><div class="recipe-result">${ITEMS[key]?itemArt(key):icon(key==='beacon'?'lantern':key==='postbox'?'postbox':key==='feast'?'pie':'mill')}<strong>${esc(r.name)}</strong><span>${r.give?'产出 ×1':r.region?'邮路修复':'庄园建设'}</span></div><div class="recipe-materials"><h3>所需材料</h3><div class="ingredient-grid">${Object.entries(r.need).map(([k,n])=>`<div class="ingredient ${state.inventory[k]>=n?'enough':'missing'}">${itemArt(k)}<span>${esc(ITEMS[k].name)}</span><b>${state.inventory[k]} / ${n}</b><small>${state.inventory[k]>=n?'材料齐全':`还缺 ${n-state.inventory[k]}`}</small></div>`).join('')}</div><div class="recipe-cost"><span>体力 ${r.energy}</span><span>耗时 ${r.minutes} 分钟</span></div></div></div>`;
}
function recipeButton(key,then){const r=RECIPES[key];return button(r.name,()=>{if(run('craft',{recipe:key}))then?.();},{primary:true,disabled:canPay(state,r),small:r.give?`得到${ITEMS[key].name} ×1`:''});}
function dialogue(name,role,quote,ghost=false){return `<div class="character-dialogue"><div class="dialogue-portrait ${ghost?'spirit-portrait':''}">${portraitMarkup(name==='薇拉'?'vera':ghost?'oren':'lucy',name)}</div><div class="dialogue-copy"><div class="dialogue-head ${ghost?'ghost':''}"><strong>${esc(name)}</strong><span>${esc(role)}</span></div><p class="quote">${esc(quote)}</p></div></div>`;}

function interact(target){
  world.face(target);if(archiveUI.handle(target))return;if(hillUI.handle(target))return;if(neighborUI.handle(target))return;if(townUI.handle(target))return;if(waterUI.handle(target))return;if(lifeUI.handle(target))return;if(target.to){showRoute(target);return;}if(regionOf(state)!=='farm'){if(target.resource){run('forage',{resource:target.resource});return;}({ledger:showLedger,kettle:showKettle,beacon:showBeacon,postbox:showPostbox,vera:showVera,bench:showRiverBench}[target.id]||(()=>{}))();return;}
  if(target.index!==undefined){const p=state.plots[target.index];if(tool==='seed'){run('plant',{index:target.index,crop:seed});return;}if(tool==='water'){run('water',{index:target.index});return;}if(isRipe(p)){run('harvest',{index:target.index});return;}showPlot(target.index);return;}
  const id=target.id;if(['wood','stone','honey'].includes(id)){run('gather',{resource:id});return;}
  ({lucy:showLucy,home:showHome,mill:showMill,oven:showOven,grave:showGrave,table:showTable}[id]||(()=>{}))();
}
function showPlot(index){const p=state.plots[index];openModal('plot','GARDEN / 一块小小的土地',p.crop?`${CROPS[p.crop].name} · ${isRipe(p)?'成熟了':'正在生长'}`:'把一个秋天种下去',()=>{
  if(p.crop)return `<p class="modal-copy">${p.watered?'今天已经浇过水了。回家睡一觉，它就能继续长大。':'泥土有些干。浇过水的作物才会在夜里生长。'}还需要 <strong>${Math.max(0,CROPS[p.crop].days-p.growth)} 个浇水的夜晚</strong>。</p><div class="action-list">${button('为它浇水',()=>{if(run('water',{index}))closeModal();},{primary:true,disabled:p.watered?'今天已经浇过水':state.energy<2?'体力不足':''})}${button('先去做别的事',closeModal)}</div>`;
  return `<p class="modal-copy">选择一种种子。播种后记得浇水，未浇水的作物只会停长，不会枯萎。</p><div class="action-list">${Object.entries(CROPS).map(([k,c])=>button(`种下${c.name}`,()=>{selectedSlot=state.quickbar.indexOf(c.seed);if(selectedSlot<0){state.quickbar=assignQuickItem(state.quickbar,c.seed,2);selectedSlot=2;}seed=k;tool='seed';world.tool=tool;if(run('plant',{index,crop:k}))closeModal();},{primary:k===seed,disabled:state.inventory[c.seed]<1?'没有这种种子':state.energy<2?'体力不足':'',small:`种子 ${state.inventory[c.seed]} · ${c.days} 个已浇水夜晚 · 收获 ${c.yield}` })).join('')}</div><p class="small-note">想连续播种：用数字键或滚轮选中种子，再点击不同地块。快捷格可在背包里调整。画面里的每块田都能耕种。</p>`;
});}
function showLucy(){
  if(state.expansion.flags.ledger&&!state.expansion.flags.reply){showPostalLucy();return;}
  if(!state.flags.metLucy){openModal('lucy','A LETTER IN AUTUMN / 秋日来信','你就是新来的守灯人？',()=>`${dialogue('露西','街角面包师','磨坊停了以后，这里安静得有些过分。爷爷以前总说，面包闻起来像什么，家就是什么样子。')}<p>帮我修好磨坊吧。需要木材 6、石料 4。我把他的南瓜派配方留给你——他嘴上说太甜，每次却都会偷偷拿一块。</p><div class="action-list">${button('接过配方，试着让磨坊转起来',()=>{if(run('meet'))showLucy();},{primary:true,small:'学会南瓜派 · 小麦种子 ×2'})}</div>`);return;}
  if(state.flags.score&&!state.flags.scoreGiven){openModal('lucy','A SONG KEPT SAFE / 留在纸上的话','这首曲子，他一直留着？',()=>`${dialogue('露西','街角面包师','背面还有字……“露西的派比我的好。下次丰收节，要当着大家的面告诉她。”')}<p>有些鼓励绕了很远的路，还是到达了。露西想重新摆起长桌，让这支曲子再响一次。</p><div class="action-list">${button('把乐谱与信交给露西',()=>{if(run('giveScore'))showLucy();},{primary:true})}</div>`);return;}
  openModal('lucy','LUCY’S CORNER / 露西的小摊','今天想带些什么？',()=>`${dialogue('露西','街角面包师',state.flags.departed?'他走前还在叮嘱我少放糖。这次，我觉得那是句喜欢。':state.flags.scoreGiven?'长桌修好后，摆上两份南瓜派。天黑时，我们一起开席。':'小麦一夜，南瓜两夜。种田急不来，但好吃的总值得等。')}<div class="action-list">${button('买种子 / 卖出收成',()=>showShop('buy'),{primary:true,small:`钱包：${state.coins} 金币`})}${button('聊聊河边的晚餐',lifeUI.dinner)}${waterAvailable(state)?button(state.water.started?'水源调查 · 查看进度':'露西的来信 · 水源调查（自愿）',waterUI.lucy):''}${state.town.flags.started?button('聊聊公共夜市',()=>townUI.person('lucy')):''}${state.town.flags.market?button('露西的故事 · 给自己留一张椅子',()=>neighborUI.person('lucy')):''}${button('看看南瓜派配方',()=>showJournal('recipes'))}${button('我先去庄园转转',closeModal)}</div>`);
}
function showShop(tab='buy'){openModal('shop','LUCY’S CORNER / 街角交易','露西的种子与收成',()=>{
  const tabs=`<div class="tabs">${mini('买种子',()=>showShop('buy'))}${mini('卖收成',()=>showShop('sell'))}</div>`;
  const rows=Object.entries(ITEMS).filter(([,i])=>tab==='buy'?i.buy:i.sell).map(([k,i])=>`<div class="shop-row">${itemArt(k)}<div><p>${esc(i.name)}</p><small>拥有 ${state.inventory[k]} · ${tab==='buy'?`买入 ${i.buy}`:`售出 ${i.sell}`} 金币</small></div>${mini(tab==='buy'?'买 1 份':'卖 1 份',()=>{if(run(tab==='buy'?'buy':'sell',{item:k}))showShop(tab);},tab==='buy'?state.coins<i.buy:state.inventory[k]<1)}</div>`).join('');
  const relief=state.coins<4&&state.inventory.wheatSeed+state.inventory.pumpkinSeed===0&&!state.plots.some(p=>p.crop)&&!state.daily.relief;
  return `<p>钱包 <strong>${state.coins} 金币</strong>。重要的乐谱与传承物不能出售。</p>${tabs}${rows}${relief?`<div class="action-list">${button('向露西借两份小麦种子',()=>{if(run('relief'))showShop(tab);},{primary:true})}</div>`:''}<p class="small-note">首章需要三份南瓜派：一份给奥伦，两份留给丰收节。出售前记得留足材料。</p>`;
});}
function showHome(){
  const dry=state.plots.filter(p=>p.crop&&!p.watered&&!isRipe(p)).length;
  openModal('home','','要休息了吗？',()=>`<p>${state.energy<20?'忙了一天，炉火替你暖好了房间。':'炉火还温着。明天，又是适合播种的一天。'}</p><div class="action-list">${button('睡到明天早上',()=>{if(run('sleep')){lateNotified=false;closeModal();}},{primary:true,small:'恢复体力，作物生长，磨坊结算'})}${button('等到傍晚 18:00',()=>{if(run('wait'))closeModal();},{disabled:isNight(state)?'已经入夜':'',small:isNight(state)?'':'当天等待，作物不会提前生长'})}${button('再做点别的',closeModal)}</div>${dry?`<p class="sleep-note">还有 ${dry} 格作物没浇水，今晚会暂停生长。</p>`:''}`);
}
function showMill(){
  if(!state.flags.mill){openModal('mill','THE OLD MILL / 旧磨坊','让风重新转起来',()=>`<p>磨轮卡住了，几块木板和石料就能让它重新运作。材料不够时不会扣除任何东西。</p>${recipeHTML('mill')}<div class="action-list">${recipeButton('mill',showMill)}${button('先去找材料',closeModal)}</div>`);return;}
  openModal('mill','THE OLD MILL / 小麦的另一种模样',state.flags.departed?'手艺留在了磨轮里':'磨坊又有了声音',()=>{
    const helper=state.flags.awakened?`<div class="recipe-card"><div class="recipe-title">${icon(state.flags.departed?'mill':'ghost')}<strong>${state.flags.departed?'传承磨轮':'奥伦的帮工'}</strong></div><p>${state.flags.departed?'他留下的磨轮会延续同样的手艺。':'“你可以叫它传承，别在我面前叫它免人工。”'}</p><p class="small-note">每次睡觉，最多将背包内的小麦 4 磨成面粉 2。原料不够就少做，关闭后不消耗原料。</p>${button(state.helper?'暂停自动加工':'开启自动加工',()=>{if(run('helper'))showMill();},{small:`现在：${state.helper?'开启':'暂停'}`})}</div>`:'';
    return `<p>把庄园里的小麦磨成面粉。每批小麦 2 → 面粉 1。</p>${recipeHTML('flour')}<div class="action-list">${recipeButton('flour',showMill)}${state.flags.awakened&&!state.flags.score?button('调查磨坊的旧抽屉',()=>{if(run('findScore'))showScore();},{primary:true,small:'奥伦说，轻敲左侧第三块木板'}):''}</div>${helper}`;
  });
}
function showScore(){openModal('score','THE HARVEST WALTZ / 丰收圆舞曲','一张留了很久的乐谱',()=>`<p class="quote">“露西的南瓜派比我的好。下次丰收节，要当着大家的面告诉她。”</p><p>字迹有些歪，旁边还画了一个小小的南瓜。你小心地把它收进手记。</p><div class="action-list">${button('去把它交给露西',()=>{closeModal();guideActive=true;world.guide='lucy';},{primary:true})}</div>`);}
function showOven(){openModal('oven','THE STONE OVEN / 石砌烤炉','烤一份记忆里的味道',()=>`<p>南瓜、小麦磨出的面粉，再加一点蜂蜜。香气会顺着晚风，飘到一个等待了很久的人身边。</p>${recipeHTML('pie')}<div class="action-list">${state.flags.metLucy?recipeButton('pie',showOven):button('还没有学会配方',()=>{},{disabled:'先到街角与露西交谈'})}${button('把火留着，等会儿再来',closeModal)}</div><p class="small-note">南瓜：种植后累计浇水两夜。面粉：修复磨坊后加工。蜂蜜：每日从蜂箱收取。</p>`);}
function showGrave(){
  if(!state.flags.grave){openModal('grave','THE MEMORY GARDEN / 记忆花园','奥伦 · 磨坊主',()=>`<p class="quote">“他坚信面包会记得做它的人。”</p><p>清理石缝、修好边缘，再挂一串木风铃。他生前喜欢磨坊转动的声音。</p>${recipeHTML('grave')}<div class="action-list">${recipeButton('grave',showGrave)}</div>`);return;}
  if(state.flags.departed){openModal('grave','WHAT REMAINS / 留下来的事','风铃响了，像一句早安',()=>`<p class="quote">“磨坊还会转。你们记得吃早饭就好。”</p><p>墓前的花开得很好。奥伦已经远行，他的手艺留在磨轮里，继续照料小镇的早晨。</p><div class="action-list">${button('在这里坐一小会儿',closeModal,{primary:true})}</div>`);return;}
  if(!isNight(state)||!state.lantern){openModal('grave','THE MEMORY GARDEN / 等灯亮的时候','风铃轻轻响了一声',()=>`<p class="modal-copy">${!isNight(state)?'白天，墓园只有风声。等到 18:00，带一盏提灯再来。':'已经入夜了。点亮提灯，也许能看见风声来自哪里。'}</p><div class="action-list">${isNight(state)?button('点亮提灯',()=>{if(run('lantern'))showGrave();},{primary:true}):button('先回家等到傍晚',()=>{closeModal();world.go(SPOTS.find(p=>p.id==='home'));},{primary:true})}${button('晚一点再来',closeModal)}</div>`);return;}
  if(!state.flags.awakened){openModal('grave','A TASTE REMEMBERED / 他记得的味道','有个模糊的身影站在风里',()=>`${dialogue('奥伦','还没有想起自己的磨坊主','这个味道……我是不是，答应过谁一件事？',true)}<p>用一份南瓜派，把他与小镇相连的记忆唤回来。</p><div class="recipe-card"><div class="ingredient-row"><span>南瓜派</span><span class="${state.inventory.pie?'need':'lack'}">拥有 ${state.inventory.pie} / 需要 1</span></div></div><div class="action-list">${button('留下一份南瓜派',()=>{if(run('awaken'))showAwakened();},{primary:true,disabled:!state.flags.mill?'先修复磨坊':!state.flags.metLucy?'先向露西打听奥伦':state.inventory.pie<1?'还缺南瓜派 1':''})}</div>`);return;}
  if(state.flags.festival){openModal('grave','UNTIL THE NEXT MORNING / 手艺留下','这一次，好好说再见',()=>`${dialogue('奥伦','终于说出那句话的人','我听见露西笑了。比我记忆里的还响亮。磨坊有她，也有你……我想，我可以放心了。',true)}<p>奥伦留下了传承磨轮。它会继续自动加工，不会因为这场告别停下来。</p><div class="action-list">${button('准备好告别了',()=>{if(run('depart'))showComplete();},{primary:true,small:'永久保留自动加工能力'})}${button('再陪我们一阵',closeModal,{small:'可以之后再来，不会失去任何奖励'})}</div>`);return;}
  showAwakened();
}
function showAwakened(){openModal('grave','OREN / 磨坊里还有一盏灯','我想起来了，是露西',()=>`${dialogue('奥伦','磨坊主 · 暂住的幽灵','我没说不喜欢。我只是……总觉得好话可以下次再说。磨坊里有张乐谱，抽屉的机关在左边第三块木板。你能替我找来吗？',true)}<p>奥伦会在你休息时照看磨坊：每夜最多消耗小麦 4，产出面粉 2。你也可以到磨坊暂停帮工。</p><div class="action-list">${button(state.flags.score?'我会把心意送到':'去磨坊找找那张乐谱',()=>{closeModal();guideActive=true;world.guide=state.flags.score?'lucy':'mill';},{primary:true})}</div>`);}
function showTable(){
  if(!state.flags.awakened){openModal('table','THE LONG TABLE / 节庆长桌','落叶铺满了旧长桌',()=>`<p>很久以前，大家曾在这里分面包、唱歌。先完成奥伦的心愿，也许就有了重新开席的理由。</p><div class="action-list">${button('记住这个地方',closeModal,{primary:true})}</div>`);return;}
  if(!state.flags.table){openModal('table','A PLACE FOR EVERYONE / 再摆一次长桌','让大家有地方坐下来',()=>`<p>修好桌腿与石基。好消息是，幽灵不占椅子。</p>${recipeHTML('table')}<div class="action-list">${recipeButton('table',showTable)}</div>`);return;}
  if(!state.flags.feast){openModal('table','THE HARVEST TABLE / 留给丰收节的味道','两份南瓜派，一首旧曲子',()=>`<p>把食物摆上桌之前，先把乐谱交给露西。交付食物会留存在桌上，不会过夜消失。</p>${recipeHTML('feast')}<div class="action-list">${state.flags.scoreGiven?recipeButton('feast',showTable):button('先把乐谱交给露西',()=>{closeModal();world.go(SPOTS.find(p=>p.id==='lucy'));},{primary:true})}</div>`);return;}
  if(!state.flags.festival){openModal('table','LIGHTS AT DUSK / 灯亮了，就开席','大家都在等这一刻',()=>`<p>两份南瓜派已经准备好了。天黑以后，长桌上的灯火会代替落日。</p><div class="action-list">${button('开始丰收节',()=>{if(run('celebrate'))showFestival();},{primary:true,disabled:!isNight(state)?'18:00 后开席':'',small:'恢复小镇的丰收聚会'})}${!isNight(state)?button('回家等到傍晚',()=>{closeModal();world.go(SPOTS.find(p=>p.id==='home'));}):''}</div>`);return;}
  openModal('table','THE HARVEST TABLE / 丰收节之后','长桌又成了小镇的日常',()=>`<p>这里留下了蜂蜜的香气和新近的笑声。明年，大家还会在这里见面。</p><div class="action-list">${button('回去照料我的庄园',closeModal,{primary:true})}</div>`);
}
function showFestival(){openModal('festival','THE HARVEST WALTZ / 迟到的丰收节','这一晚，镇上又响起了音乐',()=>`${dialogue('露西','终于收到那封信的孙女','他以前总站在最后面。我一直以为他不想来。原来，是怕大家看见他偷偷多拿一块派。')}<p>奥伦站在灯火的边缘，认真地说了一句：<strong>“这次的，也很好吃。”</strong></p><p class="small-note">丰收节已恢复 · 获得 60 金币。夜晚提灯到墓园，可以与奥伦好好告别。</p><div class="action-list">${button('再听一会儿，晚些去墓园',closeModal,{primary:true})}</div>`);}
function showComplete(){openModal('complete','CHAPTER ONE / 第一章完成','手艺留下，人可以远行',()=>`<div class="chapter-complete">${icon('lantern')}<p>种下的东西会长大，<br>说出口的话会留下。<br>暮灯镇，又有了一个值得回来的早晨。</p></div><div class="recipe-card"><div class="ingredient-row"><span>永久传承</span><strong>传承磨轮</strong></div><p class="small-note">每次睡觉仍可自动将小麦 4 磨成面粉 2。庄园可以继续经营。</p></div><div class="action-list">${button('继续我的庄园生活',closeModal,{primary:true})}${button('翻开这一段旅程的手记',()=>showJournal('notes'))}</div>`);}

function showBag(selected=null){
  openModal('bag','','随身背包',()=>{
    const all=[...Object.keys(TOOLS).filter(k=>k!=='rod'||state.life.rod),...Object.keys(ITEMS)];
    const slots=all.map(k=>{const id=String(++nextAction);actionMap.set(id,()=>showBag(k));return `<button class="inventory-item ${selected===k?'selected':''} ${ITEMS[k]&&state.inventory[k]===0?'empty':''}" data-action="${id}" aria-label="查看${itemName(k)}"><span class="inventory-art">${itemArt(k)}${ITEMS[k]?`<b>${state.inventory[k]}</b>`:''}</span><span>${itemName(k)}</span></button>`;}).join('');
    const detail=selected?`<div class="item-details"><strong>${itemName(selected)}</strong><p>${heldTip(selected)}</p><span>放入快捷格（已有物品会交换位置）</span><div class="slot-picker">${state.quickbar.map((k,i)=>{const id=String(++nextAction);actionMap.set(id,()=>{state.quickbar=assignQuickItem(state.quickbar,selected,i);save();refresh();showBag(selected);});return `<button data-action="${id}" class="item-slot ${k===selected?'selected':''}" aria-label="将${itemName(selected)}放入快捷格 ${(i+1)%10}"><kbd>${(i+1)%10}</kbd>${itemArt(k)}</button>`;}).join('')}</div></div>`:'<p class="bag-tip">点选物品，查看用途或安排快捷格。物品会自动堆叠。</p>';
    return `<div class="keeper-profile"><div class="dialogue-portrait">${portraitMarkup('keeper','守灯人')}</div><div><strong>守灯人</strong><p>暮灯庄园 · 秋 ${state.day} 日</p></div></div><div class="bag-meta"><span>随身工具与物品</span><strong>${state.coins} 金币</strong></div><div class="inventory-grid">${slots}</div>${detail}${state.neighborhood.waterCan?`<div class="action-list">${button(state.neighborhood.wideMode?'水壶：2×2 → 切换单格':'水壶：单格 → 切换2×2',()=>{if(run('wideWater'))showBag(selected);})}</div>`:''}${state.flags.score?'<p class="small-note">纪念物：《丰收圆舞曲》与奥伦的信 · 收录在旅途记录里</p>':''}`;
  });
}
function showJournal(tab='tasks'){
  openModal('journal','THE KEEPER’S JOURNAL / 守灯人手记','把值得记住的事留下',()=>{
    const tabs=`<div class="tabs">${['tasks','town','hill','people','postal','farm','recipes','notes','river','water','archive'].map((k,i)=>{const id=String(++nextAction);actionMap.set(id,()=>k==='river'?lifeUI.fishJournal():showJournal(k));return `<button class="${tab===k?'active':''}" data-action="${id}">${['生活主线','小镇复兴','山坡上的灯','人物故事','邮路','庄园','配方','旅途记录','鱼类笔记','水源调查','封存库'][i]}</button>`;}).join('')}</div>`;
    if(tab==='archive')return tabs+archiveUI.journalHTML();
    if(tab==='hill')return tabs+hillUI.journalHTML();
    if(tab==='town')return tabs+townUI.journalHTML();
    if(tab==='people')return tabs+neighborUI.journalHTML()+`<div class="current-wish"><h3>告别由你决定</h3><p>奥伦：${state.flags.departed?'已经远行，传承磨轮接替帮工。':state.flags.festival?'丰收节后可在夜晚持灯告别，也可以继续陪伴。':'先恢复庄园丰收节。'}</p><p>薇拉：${state.expansion.flags.veraDeparted?'已经远行，晾草架继续运转。':state.expansion.flags.posted?'回信已送达，可以晚些再告别。':'先完成邮路故事。'}</p><p>两位亡者的告别都不阻挡生活主线。</p></div>`;
    if(tab==='water')return tabs+waterUI.journalHTML();
    if(tab==='postal')return tabs+postalJournal();
    if(tab==='farm')return `${tabs}<div class="farm-record"><div><span>今天的体力</span><strong>${state.energy} / 100</strong></div><div><span>已浇水的生长中作物</span><strong>${state.plots.filter(p=>p.crop&&p.watered&&!isRipe(p)).length} 格</strong></div><div><span>未浇水的生长中作物</span><strong>${state.plots.filter(p=>p.crop&&!p.watered&&!isRipe(p)).length} 格</strong></div><div><span>可以收获</span><strong>${state.plots.filter(isRipe).length} 格</strong></div><div><span>夜间磨粉</span><strong>${state.flags.awakened&&state.helper?'已开启':'未开启'}</strong></div><div><span>夜间晾草（草药 2 → 干香草 1）</span><strong>${state.expansion.drying?'已开启':'未开启'}</strong></div></div><p class="small-note">${state.flags.awakened?'每次睡觉最多将小麦 4 磨成面粉 2，可到磨坊开关。':'帮奥伦找回记忆后，他会在你休息时照看磨坊。'}未浇水只暂停生长，雨天自动浇水。</p>`;
    if(tab==='recipes')return tabs+(state.hill.light?Object.values(HILL_RECIPES).map(r=>`<div class="recipe-card"><h3>${r.name}</h3><p>${Object.entries(r.need).map(([k,n])=>ITEMS[k].name+n).join('、')} · 体力${r.energy} · ${r.minutes}分钟。在家、会馆和温室制作。</p></div>`).join(''):'')+(state.neighborhood.lucy===3?'<div class="recipe-card"><h3>苹果小酥饼</h3><p>苹果1、面粉1、蜂蜜1 · 体力4 · 20分钟。家中灶台与会馆厨房制作。</p></div>':'')+'<div class="recipe-card"><h3>家中厨房 · 香草鱼汤</h3><p>银尾小鱼或河鲫共 2 条 + 干香草 1 · 体力 4 · 15 分钟。可使用家中储物箱。</p></div>'+Object.keys(RECIPES).map(k=>recipeHTML(k)).join('')+'<p class="small-note">制作需要走到对应工作台。手记只用于查看，不会远程消耗材料。</p>';
    if(tab==='notes')return tabs+`<div class="stat-line"><span>在镇上 ${state.day} 天</span><span>收获 ${state.stats.harvests} 次</span><span>制作 ${state.stats.crafted} 份</span></div><div class="journal-list">${state.journal.map(x=>`<div class="journal-entry">${esc(x)}</div>`).join('')}</div>`;
    const riverWish=`<div class="current-wish"><h3>河上的第一顿晚餐</h3><p>${state.life.dinner?'✓ 河边已经摆好餐布和碗，家中餐桌可邀请露西。':state.life.invited?'家中灶台：普通鱼 2 + 干香草 1 煮汤，再带去旧渡口河岸长椅。':state.life.catches?'到露西杂货屋，和她约好河边晚餐。':'旧渡口栈桥领取免费鱼竿，近水钓普通鱼。'}</p></div>`;
    const tasks=[['认识露西，接过南瓜派配方',state.flags.metLucy],['让旧磨坊重新运转',state.flags.mill],['整理墓位，献上南瓜派唤醒奥伦',state.flags.awakened],['找到乐谱，交给露西',state.flags.scoreGiven],['修复长桌，准备两份南瓜派',state.flags.feast],['夜晚在长桌开始丰收节',state.flags.festival],['邮路恢复，回信送达',state.expansion.flags.posted],['公共夜市开张，生活主线完成',state.town.flags.market]];
    if(state.town.flags.market)return tabs+hillUI.journalHTML()+riverWish;
    if(state.expansion.flags.posted)return tabs+townUI.journalHTML()+riverWish;
    return `${tabs}${riverWish}<div class="current-wish"><h3>${esc(objective(state).title)}</h3><p>${esc(objective(state).body)}</p><ul>${objective(state).checks.map(([text,done])=>`<li class="${done?'done':''}">${done?'✓':'□'} ${esc(text)}</li>`).join('')}</ul></div>${tasks.map(([text,done],i)=>`<div class="journal-task ${done?'done':''}"><b>${done?'✓':String(i+1).padStart(2,'0')}</b><span>${esc(text)}</span></div>`).join('')}<div class="action-list">${button('标记当前目标，继续旅程',()=>{closeModal();tracking='main';destinationRegion=null;guideActive=true;world.guide=objective(state).target;},{primary:true})}</div>`;
  });
}
function showSettings(){openModal('settings','A QUIET MOMENT / 设置与存档','按自己的节奏生活',()=>{
  const toggle=(key,title,detail)=>{const id=String(++nextAction);actionMap.set(id,()=>{state.settings[key]=!state.settings[key];refresh();save();if(key==='sound')chime();showSettings();});return `<div class="settings-row"><div>${esc(title)}<small>${esc(detail)}</small></div><button class="switch ${state.settings[key]?'on':''}" role="switch" aria-label="${esc(title)}" aria-checked="${state.settings[key]}" data-action="${id}"></button></div>`;};
  const ex=String(++nextAction);actionMap.set(ex,exportSave);const im=String(++nextAction);actionMap.set(im,()=>$('#import-file').click());const reset=String(++nextAction);actionMap.set(reset,confirmReset);
  return `${toggle('sound','轻柔音效','默认静音；开启后播放采集、制作、剑击与战斗提示音')}${toggle('bright','较明亮的夜晚','减轻夜色遮罩，让场景更容易看清')}${toggle('reducedMotion','减少环境动画','关闭雨丝、萤火与漂浮，保留必要反馈')}<div class="save-actions"><button class="mini-button" data-action="${ex}">导出存档</button><button class="mini-button" data-action="${im}">导入存档</button></div><p class="small-note">${storageOK?'进度已保存在这台设备的当前浏览器。':'浏览器存储目前不可用，请导出文件保存进度。'}换设备或清理浏览器前，建议导出备份。没有联网账户。</p><button class="danger-link" data-action="${reset}">重新开始一个庄园</button>`;
});}
function exportSave(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`暮灯镇-秋${state.day}日.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('存档已经导出');}
function confirmReset(){openModal('reset','A NEW BEGINNING / 重新开始','要重新开始这座庄园吗？',()=>`<p class="modal-copy">当前进度会被新的第一天替换。可以先导出存档，把这段生活留一份备份。</p><div class="action-list">${button('取消，保留现在的庄园',showSettings,{primary:true})}${button('先导出当前存档',exportSave)}${button('确认重新开始',()=>{state=createState();tracking='main';destinationRegion=null;world.travelReset();storageOK=true;tool='hand';selectedSlot=0;world.tool=tool;seed='wheat';guideActive=false;world.guide=null;world.path=[];world.pending=null;world.resetAppearance();lateNotified=false;save();refresh();closeModal();toast('秋日的来信，又一次到了');})}</div>`);}
function showHelp(){openModal('help','WELCOME TO DUSK LANTERN TOWN / 住下来吧','先过好这一天',()=>`<p>v0.13《封存库的回声》：公共夜市与水源报告完成后，在广场接清单；旧水渠北路开放外渠、仓库和机房。救回岑禾、选择安全取证或清理仓库，最后守住装置并走近依次关阀。每段可撤退，旧结局保留。<br>v0.12：夜市后在广场读温室来信，从旧果园北阶前往风铃山坡。找笔记、修水槽与光路、照料番茄和薄荷，完成山坡点灯后开放新订单与家居纪念。陶恩修理屋、米菈洗衣屋与三条街坊故事仍可体验。NPC会步行往返并在雨天回屋工作，手记的人物故事可追踪。先让庄园、邮路和小镇重新亮起来。新镇心广场、旧果园与会馆已开放探索；恢复邮路后接第三章，修会馆、送邀请、种果树、开夜市。生活主线不要求告别幽灵，也不要求参加战斗。夜市结束次日，露西提供自愿接取的水源调查。旧调查进度继续保留。钓鱼、房屋、六波守备和首领尾声仍在。</p><p>箭头木牌通往新地点；圆形物品标识表示资源，亮角标表示可采，淡色勾记表示今日已采完，短横线表示尚未成熟。靠近或指向物件才展开名称，底部 E 提示对应身边的目标。</p><p>先去左上方街角找露西。点击左上角的心愿提示，或按 J 打开手记。</p><div class="help-grid"><kbd>WASD / 方向键</kbd><span>在庄园中行走</span><kbd>鼠标点击</kbd><span>自动走到物件旁并交互</span><kbd>E</kbd><span>与附近目标交互</span><kbd>1–0 / 鼠标滚轮</kbd><span>选择快捷格里的物品</span><kbd>B → 点选物品</kbd><span>查看用途，重新安排快捷格</span><kbd>L / B / J / M</kbd><span>提灯、背包、手记、区域图</span><kbd>Esc</kbd><span>关闭当前窗口</span></div><p>种下作物后浇水，再回家睡觉。夜晚 18:00 后，点亮提灯才能看见亡者。打开窗口或切到其他页面时，游戏时间暂停。</p><p class="small-note">认识露西后可沿庄园南桥前往雾松林与旧渡口；丰收节后开启幽灵邮差故事。M 查看路线，邮路恢复后可快速旅行。主角挥剑、提灯震退和巡队布防在调查支线中逐步学习。</p><div class="action-list">${button('明白了，去见见露西',()=>{closeModal();tracking='main';destinationRegion=null;guideActive=true;world.guide=objective(state).target;},{primary:true})}</div>`);}

$('#modal').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b&&!b.disabled)actionMap.get(b.dataset.action)?.();});$('#modal-close').onclick=closeModal;
$('#modal-overlay').addEventListener('click',e=>{if(e.target===$('#modal-overlay'))closeModal();});
$('#journal-button').onclick=()=>{showJournal();$('#journal-button').classList.remove('has-news');};$('#bag-button').onclick=()=>showBag();$('#settings-button').onclick=showSettings;$('#map-button').onclick=showMap;$('#help-button').onclick=showHelp;$('#quest-pin').onclick=()=>showJournal();
$('#quickbar').onclick=e=>{const b=e.target.closest('[data-slot]');if(b)setSlot(Number(b.dataset.slot),true);};
$('#world').addEventListener('wheel',e=>{if(modalKind||lifeUI.active||waterUI.active)return;e.preventDefault();if(performance.now()-wheelAt<100)return;wheelAt=performance.now();setSlot((selectedSlot+(e.deltaY>0?1:9))%10);},{passive:false});
$('#quickbar').addEventListener('wheel',e=>{if(modalKind||lifeUI.active||waterUI.active)return;e.preventDefault();if(performance.now()-wheelAt<100)return;wheelAt=performance.now();setSlot((selectedSlot+(e.deltaY>0?1:9))%10);},{passive:false});
$('#map-button').innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16M15 5v16"/></svg><kbd>M</kbd>';
$('#energy-icon').innerHTML=icon('seed');$('#journal-button').innerHTML=icon('book')+'<kbd>J</kbd>';$('#bag-button').innerHTML=icon('bag')+'<kbd>B</kbd>';$('#settings-button').innerHTML=icon('settings');
$('#import-file').addEventListener('change',async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;try{if(file.size>1e6)throw Error('文件过大，请选择游戏导出的 JSON 存档');const imported=parseSave(await file.text());openModal('import','IMPORT A MEMORY / 导入存档','接着这段日子继续？',()=>`<p class="modal-copy">这份存档是秋 ${imported.day} 日，${clockText(imported)}，拥有 ${imported.coins} 金币。导入会替换当前进度。</p><div class="action-list">${button('取消，保留当前进度',showSettings,{primary:true})}${button('确认导入这份存档',()=>{state=imported;tracking='main';destinationRegion=null;world.travelReset();selectedSlot=0;tool=state.quickbar[0]==='water'?'water':state.quickbar[0].endsWith('Seed')?'seed':state.quickbar[0]==='lantern'?'lantern':'hand';seed=state.quickbar[0]==='pumpkinSeed'?'pumpkin':'wheat';world.tool=tool;state.player=safePosition(state.player,sceneOf(state));storageOK=true;save();refresh();closeModal();toast('进度已恢复，欢迎回到暮灯镇');})}</div>`);}catch(err){toast(err.message,'error');}});
window.addEventListener('keydown',e=>{
  if(waterUI.key(e))return;
  if(lifeUI.key(e))return;
  if(modalKind){if(['ArrowUp','ArrowDown'].includes(e.key)&&$('#modal-overlay').dataset.layout==='dialogue'){e.preventDefault();const choices=$$('#modal .action-button:not(:disabled)'),at=choices.indexOf(document.activeElement);choices[(at+(e.key==='ArrowDown'?1:choices.length-1)+choices.length)%choices.length]?.focus();return;}if(e.key==='Escape'){e.preventDefault();closeModal();return;}if(e.key==='Tab'){const focusable=$$('#modal button:not(:disabled),#modal input,#modal select'),first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}return;}
  if(['INPUT','TEXTAREA'].includes(e.target.tagName))return;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(e.key)){e.preventDefault();world.keys.add(e.key);return;}
  if(e.repeat)return;const k=e.key.toLowerCase();if(/^[0-9]$/.test(k)){e.preventDefault();setSlot((Number(k)+9)%10);}else if(k==='l')run('lantern');else if(k==='e'){e.preventDefault();const target=world.nearest();if(target)interact(target);else toast('靠近田地、建筑或人物，再按 E');}else if(k==='b')showBag();else if(k==='j')showJournal();else if(k==='m')showMap();else if(k==='escape'){world.path=[];world.pending=null;}
});
window.addEventListener('keyup',e=>world.keys.delete(e.key));window.addEventListener('blur',()=>{world.keys.clear();save();});document.addEventListener('visibilitychange',()=>{world.keys.clear();if(document.hidden)save();});window.addEventListener('beforeunload',save);
$$('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(!modalKind)world.keys.add(b.dataset.key);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>world.keys.delete(b.dataset.key));});$('#touch-interact').onclick=()=>{const t=world.nearest();if(t)interact(t);else toast('再靠近一点，就能交互了');};

let previous=performance.now();function frame(now){const dt=Math.min(.05,(now-previous)/1000);previous=now;if(!document.hidden){world.update(dt);lifeUI.frame(dt);waterUI.frame(dt);if(!modalKind&&!lifeUI.active&&!waterUI.active){saveElapsed+=dt;state.minute=Math.min(1320,state.minute+dt*2);if(state.minute>=1320&&!lateNotified){lateNotified=true;toast('夜已经深了。随时可以回家睡觉，庄园会等着你。');}if(saveElapsed>12){saveElapsed=0;save();}}uiElapsed+=dt;if(uiElapsed>.25){uiElapsed=0;refresh();}world.draw();}requestAnimationFrame(frame);}
setSlot(0);world.ready.then(()=>{$('#loading').style.opacity='0';setTimeout(()=>$('#loading').remove(),750);guideActive=!hasSave;world.guide=guideActive?objective(state).target:null;if(loadMessage)toast(loadMessage,'error');else if(!hasSave)setTimeout(()=>toast('欢迎住进暮灯镇。左上方街角的露西，正等着与你见面。'),1100);else setTimeout(()=>toast(`欢迎回来，秋 ${state.day} 日的庄园还在等你。`),900);requestAnimationFrame(frame);}).catch(e=>{$('#loading-text').textContent=e.message;const b=document.createElement('button');b.className='mini-button';b.style.marginTop='20px';b.textContent='重新加载';b.onclick=()=>location.reload();$('#loading').append(b);});

function markPostal(){tracking='postal';destinationRegion=null;guideActive=true;world.guide=expansionObjective(state).target;closeModal();refresh();}
function showRoute(target){openModal('travel','','路的另一边',()=>`<p>沿这条路前往<strong>${REGIONS[target.to].name}</strong>。${REGIONS[target.to].subtitle}。</p><p class="small-note">路途 10 分钟，不消耗体力。可以沿原路返回；跨区不会刷新材料或结算作物。</p><div class="action-list">${button('前往'+REGIONS[target.to].name,()=>{if(run('travel',{region:target.to}))closeModal();},{primary:true,disabled:!state.flags.metLucy?'先和露西打声招呼':target.to==='oldworks'&&!state.archive.started?'先读广场封存清单':target.to==='waterworks'&&!state.water.started?'夜市开幕后，自愿接取调查':target.to==='waterworks'&&!state.water.gear?'先准备巡查装备':''})}${button('先看看区域图',showMap)}${button('暂时留下',closeModal)}</div>`);}
function showMap(){
 if(state.life.room){openModal('map','','屋外的路',()=>`<p>现在在${ROOMS[state.life.room].name}。先走到门口出门，再使用区域旅行。</p><div class="action-list">${button('走到出口',()=>{closeModal();world.go(ROOMS[state.life.room].spots.find(p=>p.id==='roomExit'));},{primary:true})}</div>`);return;}
 openModal('map','','暮灯镇 · 区域图',()=>{
  const current=regionOf(state),e=state.expansion;
  return `<p>现在位于 <strong>${REGIONS[current].name}</strong>。${e.flags.posted?'邮路已经恢复，可以快速前往已发现区域。':'沿路牌步行发现新区域；寄出村民回信后开放快速旅行。'}</p><div class="route-thread" aria-label="道路连接">风铃山坡 ↔ 旧果园 ↔ 镇心广场 ↔ 暮灯庄园 ↔ 雾松林 ↔ 旧渡口<br>雾松林支路 → 旧水渠 → 旧染坊外渠（可选巡查）</div><div class="region-cards">${REGION_ORDER.map(id=>`<section class="region-card ${id===current?'current':''}"><img src="${REGIONS[id].file}" alt="${REGIONS[id].name}地貌" width="1672" height="941"><div class="region-copy"><span class="region-status">${id===current?'当前位置':e.visited[id]?'已经发现':'尚未到访'}</span><h3>${REGIONS[id].name}</h3><p>${REGIONS[id].subtitle}</p>${id===current?'<p class="small-note">可以在附近探索</p>':button(e.flags.posted&&e.visited[id]?'快速前往':'标记步行路线',()=>{if(e.flags.posted&&e.visited[id]){if(run('travel',{region:id,fast:true}))closeModal();}else{destinationRegion=id;guideActive=true;world.guide=nextExit(current,id).id;closeModal();refresh();toast('已标记通往'+REGIONS[id].name+'的路牌');}},{primary:true,disabled:id==='oldworks'&&!state.archive.started?'先读广场封存清单':id==='hillside'&&!state.hill.started?'夜市后，先读广场温室来信':id==='waterworks'&&!state.water.started?'生活主线完成后，自愿接取调查':id==='waterworks'&&!state.water.gear?'先收集线索并准备装备':'',small:e.flags.posted&&e.visited[id]?'路途 10 分钟 · 不扣体力':'沿画面中的路牌出发'})}</div></section>`).join('')}</div><div class="action-list">${button('查看第二章邮路心愿',()=>showJournal('postal'))}${button('收起区域图',closeModal)}</div>`;
 });
}
function postalJournal(){
 const f=state.expansion.flags,q=expansionObjective(state),steps=[['发现林间旧邮路',f.trail],['修复渡口引航灯',f.beacon],['丰收节后，用花茶唤回薇拉',f.metVera],['取回旧邮册，向露西收集回信',f.reply],['修好信箱，恢复邮路',f.posted],['与薇拉告别，留下晾草手艺',f.veraDeparted]];
 return `<div class="current-wish"><h3>${q.title}</h3><p>${q.body}</p><p class="small-note">下一站：${REGIONS[regionForTarget(q.target)||'farm'].name} · 不要求先与奥伦告别</p><ul>${q.checks.map(([label,done])=>`<li class="${done?'done':''}">${done?'✓':'□'} ${label}</li>`).join('')}</ul></div>${steps.map(([label,done],i)=>`<div class="journal-task ${done?'done':''}"><b>${done?'✓':i+1}</b><span>${label}</span></div>`).join('')}<div class="action-list">${button('标记邮路下一步',markPostal,{primary:true})}${button('查看区域路线',showMap)}</div>`;
}
function showLedger(){
 const f=state.expansion.flags;
 if(!f.trail){openModal('ledger','','一枚褪色的铜燕子',()=>`<p>木箱里夹着一张邮路图。纸上的河道仍然清楚，渡口旁画着一盏没有火光的灯。箱底刻着一句话：</p><p class="quote">“信总得有人接。送信的人，也一样。”</p><div class="action-list">${button('记下通往渡口的路',()=>{if(run('trail'))showLedger();},{primary:true})}</div>`);return;}
 if(f.metVera&&!f.ledger){openModal('ledger','','回程邮册的最后一页',()=>`<p>按照薇拉说的位置，你压下底板。夹层里的邮册没有一封标着“未送达”。最后一袋信的收件人，全都写着同一个名字：薇拉。</p><p class="quote">“路上慢一些。河边的花开了，回来一起吃饭。”</p><div class="action-list">${button('取出邮册，去找露西',()=>{if(run('ledger')){markPostal();}},{primary:true})}</div>`);return;}
 openModal('ledger','','邮路还记得她',()=>`<p>${f.ledger?'邮册已经收进旅途记录。露西会知道该怎么把大家的话送到河边。':'木箱已经空了。侧面似乎还有暗格，但需要熟悉这条邮路的人告诉你机关。'}</p><div class="action-list">${button('查看邮路下一步',()=>showJournal('postal'),{primary:true})}${button('继续探索',closeModal)}</div>`);
}
function showKettle(){
 const e=state.expansion;
 openModal('kettle','','林间灶与晾草架',()=>`<p>把月露草晾成干香草，再添一勺庄园蜂蜜。这里做出的茶，总带着林间雨后的味道。</p><div class="kettle-recipes">${['driedHerb','tea'].map(key=>`<section>${recipeHTML(key)}<div class="action-list">${recipeButton(key,showKettle)}</div></section>`).join('')}</div>${e.flags.metVera?`<div class="recipe-card"><h3>${e.flags.veraDeparted?'燕羽晾草架':'薇拉的晾草手艺'}</h3><p>每次睡觉最多消耗月露草 2，产出干香草 1。材料不足时不加工，告别后能力保留。</p><div class="action-list">${button(e.drying?'暂停夜间晾草':'开启夜间晾草',()=>{if(run('drying'))showKettle();})}</div></div>`:'<p class="small-note">照料邮差的心愿后，可以获得夜间晾草帮工。</p>'}`);
}
function showBeacon(){
 const f=state.expansion.flags;
 if(f.beacon){openModal('beacon','','引航灯重新亮了',()=>`<p>铜罩擦去锈迹，松脂的香味留在风里。入夜后，这盏灯会照亮渡口。</p><p>${state.flags.festival?'河岸边偶尔传来翻动信纸的声音。夜晚带着提灯和林间花茶，再去看看。':'丰收节的歌声还没有传到这里。先回庄园，让长桌重新热闹起来。'}</p><div class="action-list">${button('看看邮路心愿',()=>showJournal('postal'),{primary:true})}${button('继续走走',closeModal)}</div>`);return;}
 openModal('beacon','','为归来的人点一盏灯',()=>`<p>灯座还牢固，只需要补上石基、木撑和新的松脂。它曾为最后一班渡船照路。</p>${recipeHTML('beacon')}<div class="action-list">${!f.trail?button('先调查林间邮册箱',markPostal,{primary:true}):recipeButton('beacon',showBeacon)}</div>`);
}
function showPostbox(){
 const f=state.expansion.flags;
 if(!f.metVera){openModal('postbox','','一个等着回信的地方',()=>`<p>信箱上的铜燕子生了锈。等引航灯重新亮起，也许有人会告诉你它在等谁。</p><div class="action-list">${button('先去点亮引航灯',markPostal,{primary:true})}</div>`);return;}
 if(!f.postbox){openModal('postbox','','让回信有地方停下来',()=>`<p>补好箱门和支架，让信件免受河雾与雨水侵扰。恢复后的信箱，会重新连接三片区域。</p>${recipeHTML('postbox')}<div class="action-list">${recipeButton('postbox',showPostbox)}</div>`);return;}
 if(!f.posted){openModal('postbox','','这次，收件人是薇拉',()=>`<p>没有退信，也没有迟到罚单。这里只有一封来自小镇的新邀请。</p><div class="action-list">${button('寄出村民回信',()=>{if(run('postReply'))showPostbox();},{primary:true,disabled:!f.reply?'先到庄园找露西收集回信':'',small:'恢复邮路 · 奖励 80 金币 · 开放快速旅行'})}${button('等准备好再寄',closeModal)}</div>`);return;}
 openModal('postbox','','邮路重新通了',()=>`<p>旗子在风里轻轻摆动。庄园、林地和渡口，又连成了有人往来的路。</p><p class="small-note">M 打开区域图，可快速前往已发现的区域。每次路途 10 分钟。奖励已领取，不会重复发放。</p><div class="action-list">${button('去听听薇拉的回信',()=>{closeModal();world.go(REGIONS.wharf.spots.find(p=>p.id==='vera'));},{primary:true})}${button('打开区域图',showMap)}</div>`);
}
function showPostalLucy(){openModal('lucy','','这些信，原来是写给她的',()=>`${dialogue('露西','替小镇写回信的人',state.flags.departed?'爷爷说过，她总把自己的饭留到送完信之后。怎么送了那么久，偏偏忘了签收自己的那一封。':'等会儿我去问问爷爷还有什么想说。想请她一起吃饭的人，肯定不止我一个。')}<p>露西找来纸笔。有人画了一束河边的花，有人写了新的门牌号；最后大家只留了一句共同的话：“回来的路上，不用跑。”</p><div class="action-list">${button('收好回信，送往旧渡口',()=>{if(run('reply')){tracking='postal';destinationRegion=null;showLucy();}},{primary:true})}</div>`);}
function showVera(){
 const f=state.expansion.flags;
 if(f.veraDeparted){openModal('vera','','她终于走完了回程',()=>`<p>河边留下了一枚铜燕子。燕羽晾草架继续照看林间的草药，信箱每天仍有人使用。</p><div class="action-list">${button('继续我的庄园生活',closeModal,{primary:true})}${button('看看这段邮路的记录',()=>showJournal('notes'))}</div>`);return;}
 if(!f.beacon||!state.flags.festival||!isNight(state)||!state.lantern){openModal('vera','','河雾里有纸张翻动的声音',()=>`<p>${!f.beacon?'先修复引航灯，让河岸重新有可以认出的光。':!state.flags.festival?'她还听不见小镇的声音。先恢复庄园的丰收节，让音乐沿河传过来。':!isNight(state)?'邮差的身影只在夜晚出现。可以在河岸长椅等到 18:00。':'先点亮随身提灯，河雾里的身影才会清晰。'}</p><div class="action-list">${button(!f.beacon||!state.flags.festival?'标记下一步':!isNight(state)?'去长椅等到傍晚':'点亮提灯',()=>{if(!f.beacon||!state.flags.festival){markPostal();}else if(!isNight(state)){closeModal();world.go(REGIONS.wharf.spots.find(p=>p.id==='bench'));}else if(!state.lantern){run('lantern');showVera();}else markPostal();},{primary:true})}${button('先去做别的事',closeModal)}</div>`);return;}
 if(!f.metVera){openModal('vera','','最后一袋信，还没有签收',()=>`${dialogue('薇拉','河岸的幽灵邮差','我记得这条路，也记得每一家的门牌。可他们是不是已经不等我了？',true)}<p>林间花茶的香味，让她想起过去送信途中短暂的休息。</p><div class="action-list">${button('递给她一杯林间花茶',()=>{if(run('meetVera'))showVera();},{primary:true,disabled:state.inventory.tea<1?'还缺林间花茶 1':'',small:'花茶 ×1 · 唤回记忆并开启夜间晾草'})}${button('查看花茶配方',showKettleHint)}</div>`);return;}
 if(!f.posted){openModal('vera','','原来我也在收件人那一栏',()=>`${dialogue('薇拉','还没有读到自己那封信的邮差',f.ledger?'所以，不是没有送完……而是我一直没把自己的名字念出来。':'林间的邮册箱，底板左边有个缺口。回程的事，我都记在那里。',true)}<p>她把空邮包抱在胸前，认真补了一句：“我可以帮你晾草。这个不收邮费。”</p><div class="action-list">${button('我会把大家的回信送到',markPostal,{primary:true})}${button('再陪她坐一会儿',closeModal)}</div>`);return;}
 openModal('vera','','回来的路上，不用跑',()=>`${dialogue('薇拉','终于读到回信的邮差','原来他们等的，不只是信。那我这次……可以慢一点走了。',true)}<p>薇拉留下铜燕子扣针，把晾草的方法仔细写在灶边。她离开以后，燕羽晾草架会继续工作。</p><div class="action-list">${button('好好道别，愿你一路平安',()=>{if(run('departVera'))showVera();},{primary:true,small:'第二章完成 · 永久保留晾草能力'})}${button('再留一阵，明天也有人等你',closeModal,{small:'没有期限，也不会失去奖励'})}</div>`);
}
function showKettleHint(){openModal('recipe','','林间花茶',()=>`<p>在雾松林的灶台制作：先将月露草 2 晾成干香草 1，再配蜂蜜 1 煮成茶。</p>${recipeHTML('tea')}<div class="action-list">${button('标记林间灶路线',()=>{destinationRegion='forest';guideActive=true;closeModal();refresh();},{primary:true})}</div>`);}
function showRiverBench(){openModal('bench','','坐一会儿，信不会催你',()=>`<p>河面上偶尔有小小的涟漪。等到傍晚不消耗体力，也不刷新材料或推进作物成长。</p><div class="action-list">${lifeUI.benchExtra()}${button('等到 18:00',()=>{if(run('wait'))closeModal();},{primary:true,disabled:isNight(state)?'现在已经是夜晚':''})}${button('我想回庄园休息',()=>{destinationRegion='farm';guideActive=true;closeModal();refresh();})}${button('继续在河岸走走',closeModal)}</div>`);}
