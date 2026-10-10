import {sceneOf,nearRoomSpot} from './indoors.js?v=0.13.3';
import {REGIONS} from './regions.js?v=0.13.3';

export const TOWN_ITEMS={apple:{name:'果园苹果',color:'#c76b46',sell:8,icon:'apple'},jam:{name:'苹果蜜酱',color:'#ce9158',sell:30,icon:'jam'}};
export const TOWN_FLAGS=['started','metTaoen','metMila','sign','hall','letters','cleared','irrigation','firstHarvest','food','market'];
export const TOWN_RECIPES={sign:{name:'修好广场路牌',need:{wood:4,stone:2},energy:4,minutes:15},hall:{name:'修复会馆',need:{wood:6,stone:4},energy:6,minutes:20},irrigation:{name:'修好蓄水槽',need:{wood:2,stone:2,resin:2},energy:4,minutes:15}};
export function newTown(){return {flags:Object.fromEntries(TOWN_FLAGS.map(k=>[k,false])),invites:{lucy:false,taoen:false,mila:false},growth:0,tended:false,layout:null,marketDay:0,orderDay:0};}
export const waterAvailable=s=>!!s.water?.started||!!(s.town?.flags.market&&s.day>s.town.marketDay);
import {residents,residentSpots,lucyLocation,nearLucy,citizenHome} from './residents.js?v=0.13.3';
export {residents,residentSpots,lucyLocation,nearLucy,citizenHome};
function near(s,id){const p=REGIONS[s.expansion.region]?.spots.find(p=>p.id===id);return !s.life.room&&p&&Math.hypot(s.player.x-p.stand.x,s.player.y-p.stand.y)<112;}
const requireAt=(s,id)=>{if(!near(s,id)&&!nearRoomSpot(s,id))throw Error('请先走到这里再互动');};
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
export const TOWN_ACTIONS=['townStart','townTalk','townRepair','townLetters','townInvite','townClear','townTend','townHarvest','townLayout','townFood','townOpen','townCook','townOrder'];
export function townAction(s,type,p,{pay,note}){
 const t=s.town,f=t.flags,once=k=>need(!f[k],'这件事已经完成了');
 if(type==='townTalk'||type==='townInvite'){
  const who=residents(s).find(r=>r.id===p.person);need(who&&who.scene===sceneOf(s)&&Math.hypot(s.player.x-who.stand.x,s.player.y-who.stand.y)<115,'先去手记标注的位置找这位村民');
  if(type==='townTalk'){const key=p.person==='taoen'?'metTaoen':p.person==='mila'?'metMila':null;if(key&&!f[key]){f[key]=true;note(s,`认识了${who.name}。${key==='metTaoen'?'他说，果园的水槽修好，树就会记起结果。':'她把会馆旧桌布收好，说总有重新铺开的那一天。'}`);}return `和${who.name}聊了一会儿`;}
  need(f.letters,'先在会馆整理三封邀请');need(!t.invites[p.person],'邀请已经送到了');t.invites[p.person]=true;note(s,`${who.name}收下夜市邀请，答应带上自己的手艺。`);return '邀请已送达';
 }
 if(type==='townStart'){requireAt(s,'townBoard');need(s.expansion.flags.posted,'先恢复第二章邮路，再来接会馆的邀请');once('started');f.started=true;note(s,'第三章：小镇再次开门。露西把会馆旧钥匙夹在来信里，请我与陶恩、米菈重新摆起夜市。');return '接过会馆钥匙 · 第三章开启';}
 need(f.started,'先在镇心广场的告示板接过会馆钥匙');
 switch(type){
 case 'townRepair':{
  const r=TOWN_RECIPES[p.key];need(r,'请选择有效的修复项目');once(p.key);
  requireAt(s,{sign:'townBoard',hall:'hallDoor',irrigation:'basin'}[p.key]);
  need(p.key==='sign'||f.sign,'先修好广场路牌');need(p.key!=='irrigation'||f.cleared,'先清理果园');
  pay(s,r);f[p.key]=true;note(s,r.name+'完成。');return r.name+'完成';
 }
 case 'townLetters':requireAt(s,'hallRegister');need(f.hall,'先修复会馆');once('letters');need(p.lucy==='bread'&&p.taoen==='water'&&p.mila==='cloth','再读一读名册：面包师、取水工、洗衣人。选错不会消耗物品');f.letters=true;
  if(!citizenHome(s)){t.invites.taoen=true;t.invites.mila=true;f.metTaoen=true;f.metMila=true;note(s,'米菈留下的桌布和陶恩的水槽图仍在会馆。露西代收他们的邀请，夜市为他们留着位置。');}
  note(s,'三封邀请对应好了：露西准备面包，陶恩照料水槽，米菈整理桌布。');return '邀请已整理 · 去找三位熟人';
 case 'townClear':requireAt(s,'orchardTrees');once('cleared');need(f.hall,'先修复会馆，领取果园工具');pay(s,{energy:5,minutes:15});f.cleared=true;return '清理杂草 · 接下来修复蓄水槽';
 case 'townTend':requireAt(s,'orchardTrees');need(f.irrigation,'先修好蓄水槽');need(t.growth<2,'果子已经成熟，先采收吧');need(!t.tended&&s.weather!=='rain','今天的雨水或浇水已经照料果树');pay(s,{energy:3,minutes:10});t.tended=true;return '果树已浇水 · 过夜后生长';
 case 'townHarvest':requireAt(s,'orchardTrees');need(t.growth===2,'需要两个有照料的夜晚');s.inventory.apple+=4;t.growth=0;t.tended=false;f.firstHarvest=true;note(s,'旧果园结出了苹果。每次成熟固定采收4个，留一些做蜜酱。');return '采收苹果 ×4';
 case 'townLayout':requireAt(s,'marketStall');need(f.hall,'先修复会馆');need(['west','east'].includes(p.layout),'请选择摊位布置');need(!f.market,'夜市已开幕，布置已经留下');t.layout=p.layout;return '夜市摊位已安排';
 case 'townFood':requireAt(s,'marketStall');once('food');need(f.firstHarvest,'先收获第一批果园苹果');need(Number.isInteger(p.pie)&&p.pie>=0&&p.pie<=2,'请选择两份食物');pay(s,{need:{pie:p.pie,fishSoup:2-p.pie}});f.food=true;return '两份热食已备好，不会变质';
 case 'townOpen':requireAt(s,'marketBell');once('market');need(f.hall&&f.sign&&f.firstHarvest&&f.food&&t.layout&&Object.values(t.invites).every(Boolean),'先完成会馆、邀请、果园和夜市筹备');need(s.minute>=1080,'等到18:00后敲响开市钟');f.market=true;t.marketDay=s.day;s.coins+=80;note(s,'第一部生活主线完成。小镇公共夜市开张，获得80金币，会馆厨房与日常委托开放。明早留意露西的来信，调查可以慢慢决定。');return '小镇再次开门 · 生活主线完成 · 80金币';
 case 'townCook':requireAt(s,'hallKitchen');need(f.market,'公共夜市开幕后会馆厨房开放');pay(s,{need:{apple:2,honey:1},give:{jam:1},energy:3,minutes:15});s.stats.crafted++;return '苹果蜜酱 ×1';
 case 'townOrder':requireAt(s,'townBoard');need(f.market,'夜市开幕后日常委托开放');need(t.orderDay!==s.day,'今天的委托已经交付');pay(s,{need:{apple:2}});t.orderDay=s.day;s.coins+=20;return '街坊果篮送达 · 20金币，明天再来';
 default:throw Error('未知小镇操作');
 }
}
export function townSleep(s){const t=s.town;if(t.flags.irrigation&&t.growth<2&&(t.tended||s.weather==='rain'))t.growth++;t.tended=false;}
export function townObjective(s){const t=s.town||newTown(),f=t.flags,base=(title,body,target,checks=[])=>({chapter:'第三章 / 小镇再次开门',title,body,target,checks});
 if(!f.started)return base('广场上有你的来信','从庄园东侧路牌去镇心广场，在告示板接过会馆钥匙。','townBoard');
 if(!f.sign)return base('为回来的路立一块路牌','木材4、石料2。在广场告示板旁修复路牌。',s.inventory.wood<4?'wood':s.inventory.stone<2?'stone':'townBoard');
 if(!f.hall)return base('让会馆重新开门','木材6、石料4。到广场东侧的会馆门前修复。',s.inventory.wood<6?'wood':s.inventory.stone<4?'stone':'hallDoor');
 if(!f.letters)return base('三封邀请，各有去处','进入会馆，到右侧旧名册，将手艺与村民对应。','hallRegister');
 const missing=Object.keys(t.invites).filter(k=>!t.invites[k]);
 if(missing.length){const id=missing[0],p=residents(s).find(r=>r.id===id);return base('请熟人来摆起夜市',p?`${p.name}现在在${p.place}。点击人物递交邀请。`:'回会馆查看留下的邀请。',p?.spotId||'hallRegister',Object.entries(t.invites).map(([k,v])=>[({lucy:'露西',taoen:'陶恩',mila:'米菈'})[k]+'已收到邀请',v]));}
 if(!f.cleared)return base('让果树重新透透气','从广场北侧进入旧果园，清理树下的杂草。','orchardTrees');
 if(!f.irrigation)return base('接通果园蓄水槽','木材2、石料2、松脂2。到果园左上水槽修复。',s.inventory.wood<2?'wood':s.inventory.stone<2?'stone':s.inventory.resin<2?'resinTree':'basin');
 if(!f.firstHarvest)return base(t.growth===2?'果园的第一筐苹果':t.tended||s.weather==='rain'?'果树已经喝饱水':'给老果树浇水',`有照料的夜晚 ${t.growth}/2；成熟固定收获4个苹果。雨天自动照料，未浇水只暂停。`,t.growth===2||!t.tended&&s.weather!=='rain'?'orchardTrees':'home');
 if(!t.layout)return base('选一个热闹的摆摊方式','到广场摊位安排面包与果篮的位置。','marketStall');
 if(!f.food)return base('留两份热食给街坊','南瓜派与香草鱼汤任意组合，共2份，送到广场摊位。','marketStall');
 if(!f.market)return base('敲响公共夜市的钟','18:00后去广场敲钟。没有截止日期，准备好了再来。','marketBell');
 return {...base('灯亮着，小镇也醒着','生活主线已完成。果园、日常委托和会馆厨房继续开放；次日露西的调查来信可以自愿接取。','townBoard'),chapter:'生活主线 / 已完成'};
}
export function readTown(raw,s){
 const t=newTown(),fail=()=>{throw Error('存档小镇复兴进度无效');};
 if(raw===undefined)return t;
 if(!raw||typeof raw!=='object'||Array.isArray(raw))fail();
 for(const k of TOWN_FLAGS){if(typeof raw.flags?.[k]!=='boolean')fail();t.flags[k]=raw.flags[k];}
 for(const k of Object.keys(t.invites)){if(typeof raw.invites?.[k]!=='boolean')fail();t.invites[k]=raw.invites[k];}
 for(const [k,max]of [['growth',2],['marketDay',s.day],['orderDay',s.day]]){if(!Number.isInteger(raw[k])||raw[k]<0||raw[k]>max)fail();t[k]=raw[k];}
 if(typeof raw.tended!=='boolean'||![null,'west','east'].includes(raw.layout))fail();t.tended=raw.tended;t.layout=raw.layout;
 const f=t.flags;
 if(f.started&&!s.expansion.flags.posted||['sign','hall','letters','cleared','irrigation','firstHarvest','food','market'].some(k=>f[k]&&!f.started)||f.hall&&!f.sign||f.letters&&!f.hall||f.cleared&&!f.hall||f.irrigation&&!f.cleared||f.firstHarvest&&!f.irrigation||f.food&&!f.firstHarvest||Object.values(t.invites).some(Boolean)&&!f.letters||t.layout&&!f.hall||(t.growth||t.tended)&&!f.irrigation||f.market&&(!f.food||!t.layout||!Object.values(t.invites).every(Boolean)||!t.marketDay)||!f.market&&(t.marketDay||t.orderDay))fail();
 return t;
}
