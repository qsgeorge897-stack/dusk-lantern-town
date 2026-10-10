import {waterAvailable,nearLucy} from './town.js?v=0.13.3';
import {REGIONS,regionOf} from './regions.js?v=0.13.3';
import {nearRoomSpot} from './indoors.js?v=0.13.3';
export const WATER_FLAGS=['started','sample','trail','gear','ledger','rescued','sluice','filter','reinforced','clean','reported'];
export const WATER_EPILOGUE_FLAGS=['bossAccepted','bossDefeated'];
export const WATER_RECIPES={gear:{name:'巡查装备',need:{wood:4,stone:2,resin:1}},filter:{name:'净水滤芯',need:{herb:4,stone:4,resin:2}},reinforced:{name:'加固护衣与泵架',need:{wood:4,stone:2}},tacticsKit:{name:'防线工具箱',need:{wood:8,stone:6,resin:2}}};
export function newWater(){return {...Object.fromEntries([...WATER_FLAGS,...WATER_EPILOGUE_FLAGS].map(k=>[k,false])),tacticsKit:false,supplies:false,trained:false,assist:false,serial:0,pending:null};}
export const WATER_ACTIONS=['waterStart','waterSupplies','waterTraining','waterSample','waterTrail','waterCraft','waterLedger','waterAssist','waterFight','waterFinish','waterRetreat','waterReport','waterBossAccept','waterDrill'];
function need(ok,msg){if(!ok)throw Error(msg);}
function once(w,k){need(!w[k],'这项调查已经完成');}
function at(s,id){const spot=Object.values(REGIONS).flatMap(r=>r.spots).find(p=>p.id===id),region=Object.keys(REGIONS).find(k=>REGIONS[k].spots.includes(spot)),p=spot?.stand||spot;need(!s.life.room&&regionOf(s)===region&&p&&Math.hypot(s.player.x-p.x,s.player.y-p.y)<112,'请先走到调查点旁');}
function lucy(s){need(nearLucy(s),'请先到手记标注的位置找露西');}
export function nextEncounter(w){return !w.rescued?'rescue':!w.sluice?'sluice':!w.clean?'defend':w.bossAccepted&&!w.bossDefeated?'boss':null;}
export function waterAction(s,type,p,{note}){
 const w=s.water;
 if(type==='waterStart'){lucy(s);need(s.flags.metLucy,'先认识露西');need(waterAvailable(s),'先完成公共夜市，次日再自愿接取调查');once(w,'started');w.started=true;note(s,'露西说村井的水变苦了。取水工陶恩和洗衣人米菈失去神志；先去渡口取水样，再查雾松林排水沟。');return '调查委托开启 · 不再清澈的河';}
 need(w.started,'先向露西打听水源异状');
 switch(type){
 case 'waterSupplies':{
  if(nearLucy(s))lucy(s);else at(s,'waterCamp');need(w.sample&&w.trail,'先查明两处水源线索');once(w,'supplies');need(!w.gear||!w.filter,'基础战备已经备齐');
  for(const key of ['gear','filter'])if(!w[key])for(const[k,n]of Object.entries(WATER_RECIPES[key].need))s.inventory[k]+=n;
  w.supplies=true;note(s,'露西借出一份基础战备材料，足够制作尚缺的巡查装备和滤芯。强化仍由自己选择。');return '基础战备材料已领取 · 仅一次';
 }
 case 'waterTraining':at(s,'waterCamp');need(w.gear&&w.ledger,'先备好装备并查阅账册');need(!w.trained,'练习已经完成，可继续调查');need(!w.pending,'先结束当前战斗');w.serial++;w.pending={id:w.serial,encounter:'lesson'};s.player={x:720,y:600};s.minute=Math.min(1320,s.minute+10);return '巡查练习 · 一团黑苔，试试走位、挥剑和提灯';

 case 'waterSample':at(s,'waterSample');once(w,'sample');w.sample=true;note(s,'旧取水桶里有紫黑色苔丝。污染进入村井支渠，主河捕鱼水路与它分开。');return '水样已封存 · 沿支渠追查';
 case 'waterTrail':at(s,'discharge');once(w,'trail');w.trail=true;note(s,'雾松林排水沟有染料残渣。痕迹指向旧水渠的北闸。');return '找到排污痕迹 · 回露西处准备装备';
 case 'waterCraft':{
  if(nearLucy(s))lucy(s);else at(s,'waterCamp');const r=WATER_RECIPES[p.recipe];need(r,'未知巡查配方');need(w.sample&&w.trail,'先收集水样和排水痕迹');once(w,p.recipe);
  for(const[k,n]of Object.entries(r.need))need(s.inventory[k]>=n,'材料不足，请查看配方差额');
  for(const[k,n]of Object.entries(r.need))s.inventory[k]-=n;w[p.recipe]=true;s.minute=Math.min(1320,s.minute+15);note(s,r.name+'制作完成，永久保留。');return r.name+'已备好';
 }
 case 'waterLedger':at(s,'dyeLedger');need(w.gear,'先准备巡查装备');once(w,'ledger');w.ledger=true;note(s,'旧染坊账册写着：为省清运费，把封存桶留在北闸。雨水冲破木桶，黑苔孢子混入村井。陶恩和米菈还有呼吸，必须救他们。');return '锁定污染源 · 先救回取水人';
 case 'waterAssist':w.assist=!w.assist;return '战斗辅助'+(w.assist?'开启':'关闭')+' · 奖励相同';
 case 'waterBossAccept':at(s,'sluice');need(w.reported,'先向露西报告水源已经安全');once(w,'bossAccepted');w.bossAccepted=true;note(s,'北闸封闭层里还有残存母核。陶恩请求我清理残根；这是自愿巡查，清水和已获救的人不会倒退。');return '尾声 · 北闸余响';
 case 'waterDrill':at(s,'waterCamp');need(w.gear&&w.ledger,'先备好装备并阅读账册');need(!w.pending,'这场战斗已经开始');w.serial++;w.pending={id:w.serial,encounter:'drill'};s.player={x:825,y:600};s.minute=Math.min(1320,s.minute+10);return '防守演练 · 不改变剧情，不发材料与金币';
 case 'waterFight':{
  const encounter=nextEncounter(w);need(encounter,'水渠已经恢复安全');need(p.encounter===encounter,'先完成前一段调查');at(s,encounter==='rescue'?'infected':['sluice','boss'].includes(encounter)?'sluice':'purifier');need(w.gear&&w.ledger,'先备好装备并阅读账册');need(encounter!=='defend'||w.filter,'先制作净水滤芯');need(!w.pending,'这场战斗已经开始');w.serial++;w.pending={id:w.serial,encounter};s.player={x:720,y:600};s.minute=Math.min(1320,s.minute+10);return '进入战斗 · 时间暂时停止';
 }
 case 'waterFinish':{
  const q=w.pending;need(q&&q.id===p.id&&q.encounter===p.encounter,'战斗凭据已失效');need(regionOf(s)==='waterworks'&&!s.life.room,'需要在旧水渠结算');need(p.won===true,'尚未取得胜利');
  if(q.encounter==='lesson'){w.pending=null;w.trained=true;note(s,'学会了巡查的第一课：先离开落点，再用剑和提灯还击。');return '巡查练习完成 · 可以回镇休息，也可以继续救人';}
  if(q.encounter==='drill'){w.pending=null;return '六波演练完成 · 调查进度与财物保持原样';}
  if(q.encounter==='boss'){once(w,'bossDefeated');w.bossDefeated=true;w.pending=null;s.coins+=60;note(s,'黑苔母核破碎，北闸残根封存。陶恩与米菈赠予60金币和守泉铜牌；水渠终于只剩水声。');return '北闸已封存 · 获得60金币与守泉铜牌';}
  w[q.encounter==='rescue'?'rescued':q.encounter==='sluice'?'sluice':'clean']=true;w.pending=null;
  note(s,q.encounter==='rescue'?'提灯照散孢子，陶恩与米菈恢复片刻清醒，被安置到营地。':q.encounter==='sluice'?'污染闸已经关闭，黑苔不再流入村井支渠。':'净水泵完成过滤。水渠恢复清澈，陶恩与米菈终于认出了回家的路。');return q.encounter==='rescue'?'两位村民已获救':q.encounter==='sluice'?'污染源已切断':'水源净化完成 · 回去告诉露西';
 }
 case 'waterRetreat':need(w.pending,'没有正在进行的战斗');w.pending=null;s.player={...REGIONS.waterworks.entry};return '返回营地 · 材料、金币与调查进度保留';
 case 'waterReport':lucy(s);need(w.clean,'先让水源恢复清澈');once(w,'reported');w.reported=true;s.coins+=100;note(s,'水源调查结案。露西把第一壶干净的水放在窗边；村民赠予100金币，并接手水渠维护。');return '水源调查结案 · 获得100金币';
 default:throw Error('未知水源调查操作');
 }
}
export function waterObjective(s){const w=s.water||newWater(),base=(title,body,target)=>({chapter:'调查委托 / 不再清澈的河',title,body,target,checks:[['采水样与追查排污',w.sample&&w.trail],['准备巡查装备',w.gear],['找到污染源并救人',w.ledger&&w.rescued],['关闸并净化水源',w.clean],['回露西处报告',w.reported]]});
 if(!w.started&&!waterAvailable(s))return base('先把小镇的灯点亮','生活主线完成、公共夜市开张后，次日露西会寄来一封可自愿接取的调查委托。','townBoard');
 if(!w.started)return base('露西的调查来信','去找露西，决定是否接取水源调查。可以稍后再来。','lucy');
 if(!w.sample)return base('取一份异常水样','旧渡口，栈桥左侧的旧取水桶。','waterSample');
 if(!w.trail)return base('沿着支渠往上游走','雾松林排水沟的紫黑色沉淀。','discharge');
 if(!w.gear)return base('先把自己保护好','露西柜台制作巡查装备：木材4、石料2、松脂1。','lucy');
 if(!w.ledger)return base('是谁打开了北闸？','雾松林北渠岔路进入旧水渠，调查旧染坊账册。','dyeLedger');
 if(!w.trained&&!w.rescued)return base('先练习，再靠近他们','旧水渠营地提供低压力练习：一团黑苔，熟悉走位、挥剑与提灯。可跳过直接救援。','waterCamp');
 if(!w.rescued)return base('他们还记得自己的名字','压制两名感染村民，让提灯驱散附着的孢子。','infected');
 if(!w.sluice)return base('先关掉污染源','击退闸底的黑苔，关闭污染闸。','sluice');
 if(!w.filter)return base('做一枚新的滤芯','在营地用草药4、石料4、松脂2制作净水滤芯。','waterCamp');
 if(!w.clean)return base('守住最后一泵清水','布置防线、指挥两支巡队，守住六波45名敌人并夺回两面旗。','purifier');
 if(!w.reported)return base('把好消息带回家','回杂货屋，告诉露西：村民和水都回来了。','lucy');
 if(w.bossAccepted&&!w.bossDefeated)return {...base('北闸下，还有一声回响','到旧水渠北闸封存黑苔母核。灯光可打开根壳；环形震荡的内圈安全。','sluice'),chapter:'尾声 / 北闸余响'};
 if(w.bossDefeated)return {...base('北闸只剩水声','守泉铜牌已记入手记。陶恩与米菈继续维护清水。','infected'),chapter:'尾声 / 已完成'};
 return base('这一次，水里只有倒影','水渠安全了。可选尾声：前往北闸封存残根；陶恩和米菈在营地维护清水。','sluice');
}
export function readWater(raw,s){
 const w=newWater(),fail=()=>{throw Error('存档水源调查或战斗进度无效');};
 if(raw===undefined){if(s.expansion.visited.waterworks||s.expansion.region==='waterworks')fail();return w;}
 if(!raw||typeof raw!=='object'||Array.isArray(raw))fail();for(const k of [...WATER_FLAGS,'assist']){if(typeof raw[k]!=='boolean')fail();w[k]=raw[k];}
 for(const k of WATER_EPILOGUE_FLAGS){if(raw[k]===undefined){w[k]=false;continue;}if(typeof raw[k]!=='boolean')fail();w[k]=raw[k];}if(w.bossAccepted&&!w.reported||w.bossDefeated&&!w.bossAccepted)fail();
 for(const k of ['supplies','trained']){if(raw[k]!==undefined&&typeof raw[k]!=='boolean')fail();w[k]=raw[k]??false;}if(w.supplies&&!(w.sample&&w.trail)||w.trained&&!w.ledger)fail();
 if(raw.tacticsKit!==undefined&&typeof raw.tacticsKit!=='boolean')fail();w.tacticsKit=raw.tacticsKit??false;if(w.tacticsKit&&!(w.started&&w.sample&&w.trail))fail();
 if(!Number.isInteger(raw.serial)||raw.serial<0||raw.serial>1e8)fail();w.serial=raw.serial;
 if(w.started&&!s.flags.metLucy||WATER_FLAGS.slice(1).some(k=>w[k]&&!w.started)||w.gear&&!(w.sample&&w.trail)||w.ledger&&!w.gear||w.rescued&&!w.ledger||w.sluice&&!w.rescued||w.clean&&!(w.sluice&&w.filter)||w.reported&&!w.clean||(w.filter||w.reinforced)&&!(w.sample&&w.trail)||s.expansion.visited.waterworks&&!w.gear||w.ledger&&!s.expansion.visited.waterworks)fail();
 if(raw.pending!==null){const q=raw.pending;if(!q||q.id!==w.serial||w.serial<1||(!['drill','lesson'].includes(q.encounter)&&q.encounter!==nextEncounter(w))||q.encounter==='lesson'&&w.trained||!w.gear||!w.ledger||q.encounter==='defend'&&!w.filter||s.expansion.region!=='waterworks'||s.life.room)fail();s.player={...REGIONS.waterworks.entry};}
 return w;
}
