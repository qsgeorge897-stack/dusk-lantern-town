import {newArchive,ARCHIVE_ACTIONS,archiveAction,readArchive} from './archive.js?v=0.13.3';
import {newHill,HILL_ITEMS,HILL_ACTIONS,hillAction,hillSleep,hillObjective,readHill} from './hill.js?v=0.13.3';
import {newNeighborhood,NEIGHBOR_ITEMS,NEIGHBOR_ACTIONS,neighborhoodAction,readNeighborhood} from './neighborhood.js?v=0.13.3';
import {newTown,TOWN_ITEMS,TOWN_ACTIONS,townAction,townSleep,townObjective,readTown,nearLucy} from './town.js?v=0.13.3';
import {newWater,readWater,waterAction,WATER_ACTIONS} from './water.js?v=0.13.3';
import {FISH_ITEMS} from './fishing.js?v=0.13.3';
import {newLife,lifeAction,LIFE_ACTIONS,readLife} from './life.js?v=0.13.3';
import {nearRoomSpot} from './indoors.js?v=0.13.3';
import {DEFAULT_QUICKBAR,normalizeQuickbar} from './quickbar.js?v=0.13.3';
import {EXPANSION_ITEMS,EXPANSION_RECIPES,newExpansion,expansionCraft,expansionAction,expansionObjective,readExpansion} from './expansion.js?v=0.13.3';
import {regionOf} from './regions.js?v=0.13.3';
export const VERSION = 1;
export const SAVE_KEY = 'dusk-lantern-town-v1';
export const ITEMS = {
  ...EXPANSION_ITEMS,...FISH_ITEMS,...TOWN_ITEMS,...NEIGHBOR_ITEMS,...HILL_ITEMS,
  wheatSeed:{name:'小麦种子',color:'#c7b57a',buy:4,icon:'seed'},
  pumpkinSeed:{name:'南瓜种子',color:'#dca66b',buy:8,icon:'seed'},
  wheat:{name:'小麦',color:'#ddc477',sell:5,icon:'wheat'},
  pumpkin:{name:'南瓜',color:'#dc9653',sell:18,icon:'pumpkin'},
  wood:{name:'木材',color:'#ba9270',icon:'wood'},
  stone:{name:'石料',color:'#afb4ad',icon:'stone'},
  honey:{name:'蜂蜜',color:'#e2b45f',sell:12,icon:'honey'},
  flour:{name:'面粉',color:'#ddd2ad',sell:14,icon:'flour'},
  pie:{name:'南瓜派',color:'#e3a566',sell:40,icon:'pie'},
};
export const CROPS = {
  wheat:{name:'小麦',seed:'wheatSeed',days:1,yield:2},
  pumpkin:{name:'南瓜',seed:'pumpkinSeed',days:2,yield:1},
};
export const RECIPES = {
  ...EXPANSION_RECIPES,
  mill:{name:'修复磨坊',need:{wood:6,stone:4},energy:10,minutes:30},
  flour:{name:'研磨面粉',need:{wheat:2},give:{flour:1},energy:3,minutes:15},
  pie:{name:'烘烤南瓜派',need:{pumpkin:1,flour:1,honey:1},give:{pie:1},energy:4,minutes:20},
  grave:{name:'整理墓位',need:{wood:2,stone:2},energy:5,minutes:15},
  table:{name:'修复节庆长桌',need:{wood:4,stone:2},energy:8,minutes:30},
  feast:{name:'准备节庆食物',need:{pie:2},energy:0,minutes:0},
};
const FLAG_KEYS=['metLucy','mill','grave','awakened','score','scoreGiven','table','feast','festival','departed'];
export const isNight=s=>s.minute>=1080;
export const isRipe=p=>!!p.crop&&p.growth>=CROPS[p.crop].days;
export const clockText=s=>`${String(Math.floor(s.minute/60)).padStart(2,'0')}:${String(Math.floor(s.minute%60)).padStart(2,'0')}`;
export function createState(){
  const plots=Array.from({length:16},()=>({crop:null,growth:0,watered:false}));
  plots[0]={crop:'pumpkin',growth:1,watered:false};
  return {version:VERSION,day:1,minute:540,energy:100,coins:40,weather:'clear',
    archive:newArchive(),hill:newHill(),neighborhood:newNeighborhood(),town:newTown(),water:newWater(),life:newLife(),expansion:newExpansion(),player:{x:739,y:549},inventory:Object.fromEntries(Object.keys(ITEMS).map(k=>[k,k==='wheatSeed'?6:k==='pumpkinSeed'?4:0])),
    plots,flags:Object.fromEntries(FLAG_KEYS.map(k=>[k,false])),
    daily:{wood:0,stone:0,honey:0,relief:false},helper:false,lantern:false,quickbar:[...DEFAULT_QUICKBAR],
    settings:{sound:false,bright:false,reducedMotion:false},journal:['秋 1 日 · 抵达暮灯镇。先去街角找露西。'],stats:{harvests:0,crafted:0}};
}
export function missing(s,need){return Object.entries(need).filter(([k,n])=>s.inventory[k]<n).map(([k,n])=>`${ITEMS[k].name} ${n-s.inventory[k]}`);}
export function canPay(s,recipe){
  const m=missing(s,recipe.need||{});if(m.length)return `还缺${m.join('、')}`;
  if(s.energy<(recipe.energy||0))return '体力不足，回家睡一觉吧';return '';
}
function pay(s,r){const reason=canPay(s,r);if(reason)throw Error(reason);for(const [k,n]of Object.entries(r.need||{}))s.inventory[k]-=n;for(const [k,n]of Object.entries(r.give||{}))s.inventory[k]+=n;s.energy-=r.energy||0;s.minute=Math.min(1320,s.minute+(r.minutes||0));}
function note(s,text){s.journal.unshift(`秋 ${s.day} 日 · ${text}`);s.journal=s.journal.slice(0,60);}
function requireFlag(s,key,message){if(!s.flags[key])throw Error(message);}
function once(s,key){if(s.flags[key])throw Error('这件事已经完成了');}
function ghostReady(s){if(!isNight(s))throw Error('等到 18:00 后再来，亡者会循灯而至');if(!s.lantern)throw Error('先点亮提灯，按 L 或选择提灯工具');}

// All successful actions return a new state. A rejected action leaves its input untouched.
export function act(input,type,payload={}){
  const s=structuredClone(input);let message='';let kind='success';
  try{
    if(s.archive?.pending&&!['archiveFinish','archiveRetreat'].includes(type))throw Error('先结束或撤离当前巡查');
    if(s.water?.pending&&!['waterFinish','waterRetreat'].includes(type))throw Error('先结束或撤离当前战斗');
    if(s.life.pending&&!['finishCast','cancelCast'].includes(type))throw Error('先收起鱼竿');
    if(ARCHIVE_ACTIONS.includes(type)){message=archiveAction(s,type,payload,{note});return {ok:true,state:s,message,kind:'success'};}
    if(HILL_ACTIONS.includes(type)){message=hillAction(s,type,payload,{pay,note});return {ok:true,state:s,message,kind:'success'};}
    if(NEIGHBOR_ACTIONS.includes(type)){message=neighborhoodAction(s,type,payload,{pay,note});return {ok:true,state:s,message,kind:'success'};}
    if(TOWN_ACTIONS.includes(type)){message=townAction(s,type,payload,{pay,note});return {ok:true,state:s,message,kind:'success'};}
    if(WATER_ACTIONS.includes(type)){message=waterAction(s,type,payload,{note});return {ok:true,state:s,message,kind:'success'};}
    if(LIFE_ACTIONS.includes(type)){message=lifeAction(s,type,payload,{note,ITEMS});return {ok:true,state:s,message,kind:'success'};}
    if(s.life.room){
      const allowed=['lantern','wait',...(nearLucy(s)?['buy','sell','relief']:[]),...(s.life.room==='home'?['sleep']:[]),...(s.life.room==='shop'?['meet','giveScore','buy','sell','relief','reply']:[]),...(s.life.room==='post'?['departVera']:[])];
      if(!allowed.includes(type))throw Error('先出门，再使用户外设施');
      if(type==='sleep'&&!nearRoomSpot(s,'bed'))throw Error('请先走到床边');
      if(['meet','giveScore','buy','sell','relief'].includes(type)&&!nearLucy(s))throw Error('请先走到柜台前');
    }
    if(regionOf(s)!=='farm'&&!(nearLucy(s)&&['buy','sell','relief'].includes(type))&&['plant','water','harvest','gather','meet','awaken','findScore','giveScore','celebrate','depart','helper','buy','sell','relief'].includes(type))throw Error('这项操作需要回到暮灯庄园');
    switch(type){
      case 'meet':
        once(s,'metLucy');s.flags.metLucy=true;s.inventory.wheatSeed+=2;message='学会南瓜派配方，得到小麦种子 ×2';note(s,'露西把爷爷的南瓜派配方交给了我。');break;
      case 'plant':{
        const p=s.plots[payload.index],c=CROPS[payload.crop];if(!p||!c)throw Error('请选择有效的土地与种子');if(p.crop)throw Error('这块地已经种下了作物');
        pay(s,{need:{[c.seed]:1},energy:2,minutes:5});p.crop=payload.crop;p.growth=0;p.watered=s.weather==='rain';message=`种下${c.name}，${p.watered?'雨水会照料它':'记得浇水'}`;break;
      }
      case 'water':{
        const i=payload.index,p=s.plots[i];if(!Number.isInteger(i)||!p)throw Error('请选择一块土地');
        const indices=s.neighborhood.waterCan&&s.neighborhood.wideMode?[i,...(i%4<3?[i+1]:[]),...(i<12?[i+4,...(i%4<3?[i+5]:[])]:[])]:[i];
        const dry=indices.map(k=>s.plots[k]).filter(p=>p.crop&&!isRipe(p)&&!p.watered);
        if(!dry.length)throw Error('这片土地没有需要浇水的作物');
        pay(s,{energy:2*dry.length,minutes:5});dry.forEach(p=>p.watered=true);message=`浇好 ${dry.length} 格作物 · 体力 −${dry.length*2}`;break;
      }
      case 'harvest':{
        const p=s.plots[payload.index];if(!p||!isRipe(p))throw Error('还没成熟，浇水后等到明天');
        pay(s,{energy:2,minutes:5});const c=CROPS[p.crop];s.inventory[p.crop]+=c.yield;s.stats.harvests++;message=`收获${c.name} ×${c.yield}`;p.crop=null;p.growth=0;p.watered=false;break;
      }
      case 'gather':{
        const k=payload.resource;if(!['wood','stone','honey'].includes(k))throw Error('这里没有可收集的材料');
        const limit=k==='honey'?1:3;if(s.daily[k]>=limit)throw Error('今天已经取完了，明天会有新的');
        pay(s,{energy:k==='honey'?0:k==='wood'?4:5,minutes:5});s.daily[k]++;const n=k==='honey'?1:2;s.inventory[k]+=n;message=`获得${ITEMS[k].name} ×${n}`;break;
      }
      case 'craft':{
        const key=payload.recipe,r=RECIPES[key];if(!r)throw Error('还没有这份配方');
        if(Object.hasOwn(EXPANSION_RECIPES,key)){message=expansionCraft(s,key,pay,note);break;}
        if(regionOf(s)!=='farm')throw Error('请回庄园使用这座工作台');
        if(['mill','grave','table','feast'].includes(key))once(s,key);
        if(key==='flour')requireFlag(s,'mill','先修好磨坊');
        if(key==='pie')requireFlag(s,'metLucy','先去找露西，了解南瓜派的配方');
        if(key==='table')requireFlag(s,'awakened','先听听奥伦的心愿');
        if(key==='feast'){requireFlag(s,'table','先修复长桌');requireFlag(s,'scoreGiven','先把乐谱交给露西');}
        pay(s,r);if(['mill','grave','table','feast'].includes(key)){s.flags[key]=true;note(s,`${r.name}完成。`);}else s.stats.crafted++;
        message=key==='mill'?'磨坊重新转动了。现在可以把小麦磨成面粉':key==='grave'?'墓位已整理好，风铃轻轻响了一声':key==='feast'?'两份南瓜派已经摆上长桌，等到夜晚就开席':`${r.name}完成`;break;
      }
      case 'awaken':
        once(s,'awakened');requireFlag(s,'grave','先整理这处墓位');requireFlag(s,'mill','先修好磨坊');requireFlag(s,'metLucy','先向露西打听奥伦');ghostReady(s);pay(s,{need:{pie:1}});s.flags.awakened=true;s.helper=true;
        message='奥伦记起了南瓜派的味道，愿意帮你照看磨坊';note(s,'奥伦回来了。他想找到丰收节的旧乐谱。幽灵帮工已开启。');break;
      case 'findScore':
        requireFlag(s,'awakened','旧抽屉锁着，需要奥伦告诉你机关');once(s,'score');s.flags.score=true;message='找到《丰收圆舞曲》，边角写着“给露西”';note(s,'在磨坊的旧抽屉里找到乐谱，背面写着给露西的话。');break;
      case 'giveScore':
        requireFlag(s,'score','先去磨坊找回乐谱');once(s,'scoreGiven');s.flags.scoreGiven=true;message='露西决定重新举办丰收节';note(s,'露西读到了爷爷留下的鼓励。我们要重新摆起长桌。');break;
      case 'celebrate':
        requireFlag(s,'feast','先把两份南瓜派摆上长桌');requireFlag(s,'scoreGiven','露西还没有收到乐谱');once(s,'festival');if(!isNight(s))throw Error('等到 18:00，灯亮了就开席');
        s.flags.festival=true;s.coins+=60;message='丰收节回来了 · 小镇赠礼 60 金币';note(s,'灯下响起丰收圆舞曲。露西终于明白爷爷一直为她骄傲。');break;
      case 'depart':
        requireFlag(s,'festival','奥伦想再听一次丰收节的音乐');once(s,'departed');ghostReady(s);s.flags.departed=true;message='奥伦安心远行，留下传承磨轮；自动加工能力保留';note(s,'奥伦远行了。手艺留在磨轮里，长桌还会有人来。第一章完成。');break;
      case 'helper':
        requireFlag(s,'awakened','先唤醒奥伦');s.helper=!s.helper;message=`${s.flags.departed?'传承磨轮':'奥伦帮工'}已${s.helper?'开启':'暂停'}`;break;
      case 'buy':{
        const item=ITEMS[payload.item];if(!item?.buy)throw Error('这里没有这种种子');if(s.coins<item.buy)throw Error('金币不足，可以卖出一些收成');s.coins-=item.buy;s.inventory[payload.item]++;message=`购买${item.name} ×1`;break;
      }
      case 'sell':{
        const item=ITEMS[payload.item];if(!item?.sell)throw Error('这件物品不能出售');if(s.inventory[payload.item]<1)throw Error('背包里没有这件物品');s.inventory[payload.item]--;s.coins+=item.sell;message=`卖出${item.name}，获得 ${item.sell} 金币`;break;
      }
      case 'relief':
        if(s.daily.relief||s.coins>=4||s.inventory.wheatSeed+s.inventory.pumpkinSeed>0||s.plots.some(p=>p.crop))throw Error('先使用现有的种子或收成吧');s.inventory.wheatSeed+=2;s.daily.relief=true;message='露西借给你小麦种子 ×2，重新开始吧';break;
      case 'lantern':s.lantern=!s.lantern;message=s.lantern?'提灯已点亮，夜晚可看见亡者':'提灯已收起';kind='quiet';break;
      case 'wait':
        if(isNight(s))throw Error('已经入夜了');s.minute=1080;message='傍晚的钟声响起了';break;
      case 'sleep':{
        townSleep(s);hillSleep(s);
        let grown=0;for(const p of s.plots){if(p.crop&&!isRipe(p)&&p.watered){p.growth++;if(isRipe(p))grown++;}p.watered=false;}
        let batches=0;if(s.flags.awakened&&s.helper){batches=Math.min(2,Math.floor(s.inventory.wheat/2));s.inventory.wheat-=batches*2;s.inventory.flour+=batches;}
        s.day++;s.minute=480;s.energy=100;s.weather=s.day%3===0?'rain':'clear';if(s.weather==='rain')for(const p of s.plots)if(p.crop)p.watered=true;
        let herbsDried=0;if(s.expansion.flags.metVera&&s.expansion.drying&&s.inventory.herb>=2){s.inventory.herb-=2;s.inventory.driedHerb++;herbsDried=1;}s.expansion.daily={herb:0,resin:0};s.expansion.region='farm';
        s.daily={wood:0,stone:0,honey:0,relief:false};s.lantern=false;s.player=s.life.room==='home'?{x:1120,y:468}:{x:756,y:445};
        message=`秋 ${s.day} 日 · ${s.weather==='rain'?'雨水已经浇过田地':'晴朗的一天'}${grown?` · ${grown} 格作物成熟`:''}${batches?` · 自动磨粉 ×${batches}`:''}`;if(herbsDried)message+=' · 自动晾草 ×1';note(s,message.replace(/^秋 \d+ 日 · /,''));break;
      }
      default:message=expansionAction(s,type,payload,{pay,note,ghostReady});
    }
    return {ok:true,state:s,message,kind};
  }catch(e){return {ok:false,state:input,message:e.message,kind:'error'};}
}

export function objective(s){
  const f=s.flags;
  if(!f.metLucy)return {chapter:'01 / 一封迟到的邀请',title:'去见见露西',body:'街角的面包师似乎认识这座庄园。',target:'lucy',checks:[['与露西交谈',false],['学会南瓜派',false]]};
  if(!f.mill)return {chapter:'02 / 让风重新转起来',title:'修好旧磨坊',body:'拾些木材与石料，让停下的风车重新转动。',target:s.inventory.wood<6?'wood':s.inventory.stone<4?'stone':'mill',checks:[[`木材 ${s.inventory.wood}/6`,s.inventory.wood>=6],[`石料 ${s.inventory.stone}/4`,s.inventory.stone>=4]]};
  if(!f.awakened){
    const noPie=s.inventory.pie<1;
    let target=!f.grave?'grave':!noPie?(isNight(s)?'grave':'home'):s.inventory.pumpkin<1?'farm':s.inventory.flour<1?(s.inventory.wheat<2?'farm':'mill'):s.inventory.honey<1?'honey':'oven';
    return {chapter:'03 / 他记得的味道',title:'为奥伦留一份南瓜派',body:'做一份派，整理墓位。18:00 后提灯前往墓园。',target,checks:[['整理墓位',f.grave],[`南瓜派 ${Math.min(s.inventory.pie,1)}/1`,!noPie],['夜晚 · 提灯',isNight(s)&&s.lantern]]};
  }
  if(!f.score)return {chapter:'04 / 少了一段旋律',title:'寻找旧乐谱',body:'奥伦说，磨坊的抽屉有一个藏得很好的机关。',target:'mill',checks:[['唤回奥伦的记忆',true],['调查磨坊旧抽屉',false]]};
  if(!f.scoreGiven)return {chapter:'04 / 少了一段旋律',title:'把乐谱交给露西',body:'纸的背面，留着一封没有送出的信。',target:'lucy',checks:[['找到《丰收圆舞曲》',true],['交给露西',false]]};
  if(!f.table)return {chapter:'05 / 再摆一次长桌',title:'修复节庆长桌',body:'木材 4、石料 2。我们要在这里重新开席。',target:s.inventory.wood<4?'wood':s.inventory.stone<2?'stone':'table',checks:[[`木材 ${s.inventory.wood}/4`,s.inventory.wood>=4],[`石料 ${s.inventory.stone}/2`,s.inventory.stone>=2]]};
  if(!f.feast)return {chapter:'05 / 再摆一次长桌',title:'为丰收节准备两份派',body:'小麦可以交给奥伦磨粉，别忘了收集蜂蜜。',target:s.inventory.pie>=2?'table':s.inventory.pumpkin<1?'farm':s.inventory.flour<1?(s.inventory.wheat<2?'farm':'mill'):s.inventory.honey<1?'honey':'oven',checks:[['修复长桌',true],[`南瓜派 ${Math.min(s.inventory.pie,2)}/2`,s.inventory.pie>=2]]};
  if(!f.festival)return {chapter:'05 / 再摆一次长桌',title:'灯亮了，就开席',body:'18:00 后，到长桌旁开始丰收节。',target:isNight(s)?'table':'home',checks:[['准备好食物',true],['暮色已至',isNight(s)]]};
  if(!s.expansion.flags.posted)return expansionObjective(s);
  return s.town.flags.market?hillObjective(s):townObjective(s);
}

export function parseSave(text){
  let o;try{o=JSON.parse(text);}catch{throw Error('存档不是有效的 JSON 文件');}
  if(!o||o.version!==VERSION)throw Error('不支持这个存档版本');
  const s=createState();const num=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
  if(!num(o.day,1,99999)||!Number.isInteger(o.day)||!num(o.minute,480,1320)||!num(o.energy,0,100)||!num(o.coins,0,1e8))throw Error('存档中的日期、体力或金币无效');
  for(const k of ['day','minute','energy','coins'])s[k]=o[k];
  if(!['clear','rain'].includes(o.weather))throw Error('存档天气无效');s.weather=o.weather;
  if(!o.player||!num(o.player.x,0,1672)||!num(o.player.y,0,941))throw Error('存档位置无效');s.player={x:o.player.x,y:o.player.y};
  for(const k of Object.keys(ITEMS)){const v=(Object.hasOwn(EXPANSION_ITEMS,k)||Object.hasOwn(FISH_ITEMS,k)||Object.hasOwn(TOWN_ITEMS,k)||Object.hasOwn(NEIGHBOR_ITEMS,k)||Object.hasOwn(HILL_ITEMS,k))&&o.inventory?.[k]===undefined?0:o.inventory?.[k];if(!num(v,0,1e6)||!Number.isInteger(v))throw Error('存档物品数量无效');s.inventory[k]=v;}
  if(!Array.isArray(o.plots)||o.plots.length!==16)throw Error('存档土地数量无效');
  s.plots=o.plots.map(p=>{if(!p||!(p.crop===null||Object.hasOwn(CROPS,p.crop))||!num(p.growth,0,2)||!Number.isInteger(p.growth)||typeof p.watered!=='boolean')throw Error('存档作物状态无效');return {crop:p.crop,growth:p.growth,watered:p.watered};});
  for(const k of FLAG_KEYS){if(typeof o.flags?.[k]!=='boolean')throw Error('存档任务状态无效');s.flags[k]=o.flags[k];}
  if(s.flags.departed&&!s.flags.festival||s.flags.festival&&!s.flags.feast||s.flags.feast&&(!s.flags.table||!s.flags.scoreGiven)||s.flags.scoreGiven&&!s.flags.score||s.flags.score&&!s.flags.awakened||s.flags.awakened&&(!s.flags.grave||!s.flags.mill||!s.flags.metLucy))throw Error('存档任务进度不完整');
  for(const k of ['wood','stone','honey']){if(!num(o.daily?.[k],0,k==='honey'?1:3)||!Number.isInteger(o.daily[k]))throw Error('存档采集状态无效');s.daily[k]=o.daily[k];}
  for(const k of ['helper','lantern']){if(typeof o[k]!=='boolean')throw Error('存档状态无效');s[k]=o[k];}
  s.daily.relief=!!o.daily.relief;
  if(o.settings)for(const k of Object.keys(s.settings))s.settings[k]=!!o.settings[k];
  s.journal=Array.isArray(o.journal)?o.journal.filter(x=>typeof x==='string').map(x=>x.slice(0,250)).slice(0,60):s.journal;
  if(o.stats)for(const k of Object.keys(s.stats))s.stats[k]=num(o.stats[k],0,1e8)?Math.floor(o.stats[k]):0;
  if([o.water?.pending,o.archive?.pending,o.life?.pending].filter(Boolean).length>1)throw Error('存档同时存在多个未完成活动');
  s.expansion=readExpansion(o.expansion,s,num);s.quickbar=normalizeQuickbar(o.quickbar);s.life=readLife(o.life,s);s.water=readWater(o.water,s);s.town=readTown(o.town,s);s.neighborhood=readNeighborhood(o.neighborhood,s);s.hill=readHill(o.hill,s);s.archive=readArchive(o.archive,s);
  return s;
}
