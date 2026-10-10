import {ROOMS,sceneOf,nearRoomSpot} from './indoors.js?v=0.13.3';
import {REGIONS} from './regions.js?v=0.13.3';
import {residents} from './residents.js?v=0.13.3';
export const NEIGHBOR_ITEMS={applePastry:{name:'苹果小酥饼',color:'#dba357',sell:40,icon:'pie'}};
export const PIPES=['pipeInlet','pipeMiddle','pipeEnd'];
export const NEIGHBOR_ACTIONS=['neighborTalk','readBlueprint','inspectPipe','testPressure','sealPipe','taoenDinner','upgradeCan','wideWater','readClothPhoto','chooseCloth','placeCloth','curtains','readGuestbook','inviteLucyRest','lucyRest','bakePastry'];
export const newNeighborhood=()=>({taoen:0,pipe:0,mila:0,clothClue:false,clothChoice:null,lucy:0,restClue:false,waterCan:false,wideMode:false,curtain:null});
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
function at(s,id){const p=REGIONS[sceneOf(s)]?.spots.find(q=>q.id===id);need(nearRoomSpot(s,id)||p&&Math.hypot(s.player.x-p.stand.x,s.player.y-p.stand.y)<110,'请先走到这个位置');}
function person(s,id){const p=residents(s).find(p=>p.id===id);need(p&&p.scene===sceneOf(s)&&Math.hypot(s.player.x-p.stand.x,s.player.y-p.stand.y)<115,'请按手记中的当前位置找到这位朋友');return p;}
export function neighborhoodAction(s,type,p,{pay,note}){
 const n=s.neighborhood;need(s.town.flags.market,'公共夜市开幕后，才会听到这些新的心事');
 switch(type){
 case 'neighborTalk':{
  need(['taoen','mila','lucy'].includes(p.person),'请选择一位街坊');person(s,p.person);need(n[p.person]===0,'已经记下这件事了');n[p.person]=1;
  note(s,{taoen:'陶恩总是最后收工。这次，我想先读懂他的图纸，再邀他吃饭。',mila:'米菈有一块洗不掉旧颜色的桌布。她想先找回照片里的花纹。',lucy:'露西替所有人留了面包。夜市留言簿里，也许有一句写给她的话。'}[p.person]);return '新的街坊故事已记入手记';
 }
 case 'readBlueprint':at(s,'repairBlueprint');need(n.taoen===1,'先听陶恩说说水槽的事');n.taoen=2;return '检查顺序已记下：出水口 → 林间检修口 → 果树末端';
 case 'inspectPipe':at(s,p.id);need(n.taoen===2&&PIPES.includes(p.id),'先去修理屋读水槽图纸');need(PIPES[n.pipe]===p.id,'沿水流检查：① 出水口 → ② 检修口 → ③ 末端；重看不会扣费');pay(s,{energy:1,minutes:5});n.pipe++;return n.pipe===3?'三个接头已检查，回修理屋测试压力':`接头 ${n.pipe}/3 已检查`;
 case 'testPressure':at(s,'repairGauge');need(n.taoen===2&&n.pipe===3,'先按顺序检查三个接头');pay(s,{energy:2,minutes:10});n.taoen=3;return '压力下降很慢：问题是末端密封，不是水源污染';
 case 'sealPipe':at(s,'repairBench');need(n.taoen===3,'先用铜表确认漏点');pay(s,{need:{wood:2,resin:1},energy:3,minutes:15});n.taoen=4;note(s,'照着图纸换好密封件。今晚18:00至20:00，去会馆请陶恩坐下吃饭。');return '修补好了 · 晚上去会馆找陶恩';
 case 'taoenDinner':at(s,'hallTea');need(n.taoen===4,'先把检修做完');need(s.minute>=1080&&s.minute<1200,'18:00–20:00去会馆，明天再来也可以');need(residents(s).some(p=>p.id==='taoen'&&p.scene==='hall'&&!p.moving),'陶恩还在路上，稍等他进会馆');n.taoen=5;note(s,'陶恩终于吃上热饭。他留下宽口水壶的改造图，说下次也许能早点收工。');return '故事完成 · 解锁宽口水壶改造图';
 case 'upgradeCan':at(s,'repairBench');need(n.taoen===5&&!n.waterCan,'完成陶恩的故事后可改造一次');pay(s,{need:{wood:4,stone:2,resin:1},energy:5,minutes:20});n.waterCan=true;n.wideMode=true;return '水壶已改造 · 背包中可切换单格 / 2×2';
 case 'wideWater':need(n.waterCan,'先去修理屋改造水壶');n.wideMode=!n.wideMode;return n.wideMode?'改为 2×2 浇水，仅干燥的未成熟作物消耗体力':'改为单格浇水';
 case 'readClothPhoto':at(s,'laundryPhoto');need(n.mila>=1,'先和米菈聊聊旧桌布');n.clothClue=true;return '照片上的绿枝纹，来自米菈母亲画的样子';
 case 'chooseCloth':at(s,'laundryCloth');need(n.mila>=1&&n.clothClue,'先看看洗衣屋里的旧照片');need(['old','blue'].includes(p.choice),'请选择桌布颜色');n.clothChoice=p.choice;n.mila=Math.max(2,n.mila);return n.mila===3?'桌布和会馆的布置已换好，可随时再改':'桌布整理好了，带去会馆左侧桌边';
 case 'placeCloth':at(s,'hallCloth');need(n.mila===2,'先到洗衣屋选好桌布');n.mila=3;note(s,'米菈把桌布重新铺开：旧花纹不一定要被洗掉，新颜色也不用舍不得。她送来两套窗帘样式。');return '故事完成 · 家中纪念架可布置窗帘';
 case 'curtains':at(s,'keepsake');need(n.mila===3,'先完成米菈的桌布故事');need([null,'old','blue'].includes(p.choice),'请选择窗帘样式');n.curtain=p.choice;return p.choice?'窗边换上了米菈缝的窗帘':'收起窗帘，恢复原来的窗边';
 case 'readGuestbook':at(s,'marketGuestbook');need(n.lucy===1,'先听露西说说收摊后的事');n.restClue=true;return '一位孩子写道：“露西阿姨，你留给自己的那张椅子在哪？”';
 case 'inviteLucyRest':person(s,'lucy');need(n.lucy===1&&n.restClue,'先读会馆夜市留言簿');n.lucy=2;note(s,'约好18:00后在会馆歇一会儿。露西会留出时间，错过了明天也可以。');return '约好了 · 18:00–20:00会馆见';
 case 'lucyRest':at(s,'hallTea');need(n.lucy===2,'先去邀请露西休息');need(s.minute>=1080&&s.minute<1200,'18:00–20:00来会馆，不限日期');need(residents(s).some(p=>p.id==='lucy'&&p.scene==='hall'&&!p.moving),'露西正收拾东西，稍等她过来');n.lucy=3;note(s,'露西把围裙搭在椅背上。她教我苹果小酥饼，也答应雨夜把店门早关一会儿。');return '故事完成 · 学会苹果小酥饼';
 case 'bakePastry':at(s,'hallKitchen');need(n.lucy===3,'先完成露西的休息故事');pay(s,{need:{apple:1,flour:1,honey:1},give:{applePastry:1},energy:4,minutes:20});s.stats.crafted++;return '苹果小酥饼 ×1';
 default:throw Error('未知街坊操作');
 }
}
export const STORY_NAMES={taoen:'他总是最后一个收工',mila:'洗不掉的那块颜色',lucy:'给自己留一张椅子'};
export function neighborObjective(s,id){
 const n=s.neighborhood||newNeighborhood(),p=residents(s).find(p=>p.id===id),who={taoen:'陶恩',mila:'米菈',lucy:'露西'}[id];let target=p?.spotId||'hallRegister',body;
 if(!s.town.flags.market)body='先完成公共夜市，街坊会有新的心事。';
 else if(!p)body=who+'暂时在水渠调查中。故事会等他回来，不会过期。';
 else if(!n[id])body=`去${p.place}找${who}聊聊${p.moving?'，他正在路上':''}。`;
 else if(id==='taoen'){
  [body,target]=n.taoen===1?['到陶恩的修理屋读水槽图纸。','repairBlueprint']:n.taoen===2?n.pipe<3?[`按水流检查第 ${n.pipe+1} 个接头，已完成 ${n.pipe}/3。`,PIPES[n.pipe]]:['回修理屋，用铜制压力表测试。','repairGauge']:n.taoen===3?['木材2、松脂1。先补齐材料，再到工作台做好密封件。',s.inventory.wood<2?'wood':s.inventory.resin<1?'resinTree':'repairBench']:n.taoen===4?['18:00–20:00在会馆留座，等陶恩进屋后请他吃饭。','hallTea']:!n.waterCan?['故事已完成。木材4、石料2、松脂1，在修理屋改造水壶。',s.inventory.wood<4?'wood':s.inventory.stone<2?'stone':s.inventory.resin<1?'resinTree':'repairBench']:['故事已完成。背包中可切换水壶的单格与2×2模式。','repairBench'];
 }else if(id==='mila'){
  [body,target]=!n.clothClue?['去洗衣屋看旧照片。','laundryPhoto']:n.mila===1?['到洗衣台选择保留绿枝纹，或染成雨后蓝。','laundryCloth']:n.mila===2?['把桌布铺到会馆左侧桌边。','hallCloth']:['故事已完成。家中纪念架可换窗帘；洗衣台可免费更改桌布颜色。','keepsake'];
 }else [body,target]=n.lucy===1?!n.restClue?['去会馆翻夜市留言簿。','marketGuestbook']:['找到露西，约她收摊后歇一会儿。',p.spotId]:n.lucy===2?['18:00–20:00在会馆留座，等露西走到椅边。','hallTea']:['故事已完成。家中和会馆可做苹果小酥饼；雨夜也能去找露西聊天。',p.spotId];
 return {chapter:'街坊的一天 / '+who,title:STORY_NAMES[id],body,target,checks:[],complete:n[id]>=(id==='taoen'?5:3)};
}
export function readNeighborhood(raw,s){
 const n=newNeighborhood(),fail=()=>{throw Error('存档街坊故事进度无效');};if(raw===undefined)return n;
 if(!raw||typeof raw!=='object'||Array.isArray(raw))fail();
 for(const [key,max]of [['taoen',5],['pipe',3],['mila',3],['lucy',3]]){if(!Number.isInteger(raw[key])||raw[key]<0||raw[key]>max)fail();n[key]=raw[key];}
 for(const key of ['clothClue','restClue','waterCan','wideMode']){if(typeof raw[key]!=='boolean')fail();n[key]=raw[key];}
 for(const key of ['clothChoice','curtain']){if(![null,'old','blue'].includes(raw[key]))fail();n[key]=raw[key];}
 if((n.taoen||n.mila||n.lucy)&&!s.town.flags.market||n.pipe&&n.taoen<2||n.taoen>=3&&n.pipe!==3||n.clothClue&&!n.mila||n.mila>=2&&(!n.clothClue||!n.clothChoice)||n.clothChoice&&n.mila<2||n.restClue&&!n.lucy||n.lucy>=2&&!n.restClue||n.waterCan&&n.taoen!==5||n.wideMode&&!n.waterCan||n.curtain&&n.mila!==3)fail();return n;
}
