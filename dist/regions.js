// Region geometry is shared by rules, pathfinding, map UI and save validation.
export const REGION_ORDER=['farm','forest','wharf','town','orchard','hillside','waterworks','oldworks'];
export const regionOf=s=>s.expansion?.region||'farm';
export const FARM_EXIT={id:'toForest',name:'南桥 · 前往雾松林',subtitle:'离开庄园，沿旧邮路探索',x:756,y:737,stand:{x:756,y:727},radius:38,to:'forest',arrow:'↓'};
export const REGIONS={
 farm:{name:'暮灯庄园',subtitle:'农田、磨坊与记忆花园',file:'./assets/world.png',entry:{x:756,y:709},entryFrom:{town:{x:1460,y:749}},neighbors:['forest','town'],spots:[FARM_EXIT,{id:'toTown',name:'东路 · 镇心广场',subtitle:'会馆、夜市与果园',x:1475,y:748,stand:{x:1460,y:749},radius:35,to:'town',arrow:'→'}],color:'#648458'},
 forest:{name:'雾松林',subtitle:'草药、松脂与旧邮路',file:'./assets/regions/forest-v1.png',entry:{x:160,y:535},entryFrom:{wharf:{x:1485,y:535},waterworks:{x:825,y:555}},neighbors:['farm','wharf','waterworks'],color:'#789579',spots:[
  {id:'toFarm',name:'西路 · 返回庄园',subtitle:'沿南桥回家',x:110,y:535,stand:{x:145,y:535},radius:45,to:'farm',arrow:'←'},
  {id:'herbs',name:'月露草丛',subtitle:'采集草药 · 每日 3 次',x:460,y:345,stand:{x:460,y:418},radius:75,resource:'herb'},
  {id:'resinTree',name:'取脂松树',subtitle:'收集松脂 · 每日 2 次',x:1340,y:325,stand:{x:1320,y:415},radius:85,resource:'resin'},
  {id:'ledger',name:'旧邮册箱',subtitle:'一条不再有人走的邮路',x:690,y:325,stand:{x:690,y:390},radius:52},
  {id:'kettle',name:'林间灶与晾草架',subtitle:'制作干香草、花茶与管理帮工',x:1060,y:321,stand:{x:1060,y:392},radius:60},
  {id:'toWaterworks',name:'北渠岔路 · 旧水渠',subtitle:'调查废弃取水口',x:825,y:575,stand:{x:825,y:555},radius:36,to:'waterworks',arrow:'↑'},
  {id:'discharge',name:'排水沟痕迹',subtitle:'紫黑色沉淀顺着支渠流下',x:970,y:596,stand:{x:970,y:555},radius:35},
  {id:'toWharf',name:'东路 · 前往旧渡口',subtitle:'沿河寻找引航灯',x:1530,y:535,stand:{x:1485,y:535},radius:50,to:'wharf',arrow:'→'},
 ]},
 wharf:{name:'旧渡口',subtitle:'引航灯、回信与河岸长椅',file:'./assets/regions/wharf-v1.png',entry:{x:160,y:420},neighbors:['forest'],color:'#638b92',spots:[
  {id:'toForest',name:'岸路 · 返回雾松林',subtitle:'沿林间小路回庄园',x:105,y:417,stand:{x:150,y:420},radius:48,to:'forest',arrow:'←'},
  {id:'waterSample',name:'旧取水桶',subtitle:'调查村井支渠的水样',x:950,y:533,stand:{x:963,y:524},radius:28},
  {id:'bench',name:'河岸长椅',subtitle:'坐到傍晚，听听水声',x:356,y:294,stand:{x:356,y:368},radius:48},
  {id:'postbox',name:'旧邮局信箱',subtitle:'修复与寄出村民回信',x:770,y:273,stand:{x:770,y:365},radius:58},
  {id:'beacon',name:'引航灯',subtitle:'用松脂让河岸重新亮起',x:1195,y:259,stand:{x:1195,y:394},radius:95},
  {id:'vera',name:'河边的邮差',subtitle:'夜晚提灯，听见迟到的回音',x:944,y:490,stand:{x:938,y:451},radius:58},
 ]},
 town:{name:'镇心广场',subtitle:'会馆、街坊与公共夜市',file:'./assets/regions/town-v2.png',entry:{x:105,y:657},entryFrom:{orchard:{x:821,y:352}},neighbors:['farm','orchard'],color:'#ad9864',lights:[[211,241,90],[846,90,90],[1260,350,105],[1447,355,110],[1215,676,100]],spots:[
  {id:'townToFarm',name:'西路 · 返回庄园',subtitle:'回家照料田地',x:83,y:651,stand:{x:108,y:657},radius:35,to:'farm',arrow:'←'},
  {id:'toOrchard',name:'北路 · 旧果园',subtitle:'从石阶走进果树间',x:821,y:285,stand:{x:821,y:328},radius:40,to:'orchard',arrow:'↑'},
  {id:'repairDoor',name:'陶恩的修理屋',subtitle:'工具、图纸与炉边的晚饭',x:218,y:143,stand:{x:249,y:205},radius:52},
  {id:'laundryDoor',name:'米菈的洗衣屋',subtitle:'旧照片、染布与针线',x:1580,y:410,stand:{x:1575,y:480},radius:48},
  {id:'townBoard',name:'广场告示板',subtitle:'会馆来信、路牌与街坊委托',x:476,y:224,stand:{x:477,y:336},radius:66},
  {id:'hallDoor',name:'小镇会馆',subtitle:'修复与进入会馆',x:1375,y:396,stand:{x:1375,y:541},radius:65},
  {id:'marketStall',name:'夜市摊位',subtitle:'安排布置与准备两份热食',x:272,y:544,stand:{x:464,y:577},radius:76},
  {id:'marketBell',name:'公共夜市的钟',subtitle:'准备完毕后，晚间开市',x:1215,y:676,stand:{x:1116,y:687},radius:48},
 ]},
 orchard:{name:'旧果园',subtitle:'苹果、蓄水槽与慢慢长大的日子',file:'./assets/regions/orchard-v2.png',entry:{x:828,y:705},entryFrom:{hillside:{x:825,y:166}},neighbors:['town','hillside'],color:'#8a9a55',spots:[
  {id:'toHillside',name:'北阶 · 风铃山坡',subtitle:'夜市之后，温室来信中的山路',x:825,y:84,stand:{x:825,y:152},radius:43,to:'hillside',arrow:'↑'},
  {id:'orchardToTown',name:'南路 · 返回广场',subtitle:'穿过矮石墙回镇上',x:828,y:746,stand:{x:828,y:705},radius:40,to:'town',arrow:'↓'},
  {id:'orchardTrees',name:'果园苹果树',subtitle:'清理、照料与收获',x:833,y:318,stand:{x:828,y:529},radius:72},
  {id:'basin',name:'旧蓄水槽',subtitle:'修复果园的灌溉设施',x:152,y:210,stand:{x:306,y:282},radius:70},
  {id:'pipeInlet',name:'① 水槽出水口',subtitle:'检查铜管接头',x:312,y:315,stand:{x:350,y:338},radius:32},
  {id:'pipeMiddle',name:'② 林间检修口',subtitle:'听听支管里的水声',x:650,y:432,stand:{x:660,y:472},radius:32},
  {id:'pipeEnd',name:'③ 果树末端',subtitle:'查看末端是否通水',x:1080,y:544,stand:{x:1080,y:585},radius:32},
  {id:'orchardBench',name:'果园长椅',subtitle:'坐到傍晚，听树叶响',x:1388,y:684,stand:{x:1230,y:658},radius:60},
 ]},
 hillside:{name:'风铃山坡',subtitle:'风铃、观景台与公共育苗屋',file:'./assets/regions/hillside-v1.png',entry:{x:836,y:747},neighbors:['orchard'],color:'#859a56',lights:[[740,737,90],[955,737,90],[1218,238,90],[1316,244,90],[155,226,75]],spots:[
  {id:'hillToOrchard',name:'南阶 · 旧果园',subtitle:'下山回到苹果树间',x:836,y:785,stand:{x:836,y:747},radius:45,to:'orchard',arrow:'↓'},
  {id:'greenDoor',name:'山坡温室',subtitle:'笔记、光路与两床幼苗',x:1275,y:276,stand:{x:1280,y:365},radius:60},
  {id:'hillChime',name:'风铃树下',subtitle:'铜铃旁夹着一页纸',x:640,y:279,stand:{x:610,y:393},radius:66},
  {id:'hillLookout',name:'观景台',subtitle:'长椅下留着一张折页',x:254,y:331,stand:{x:257,y:293},radius:55},
  {id:'hillPlaque',name:'旧石牌',subtitle:'石牌背面的种植记录',x:451,y:562,stand:{x:548,y:601},radius:52}
 ]},
 oldworks:{name:'旧染坊外渠',subtitle:'封存清单、巡查员与两扇旧门',file:'./assets/regions/oldworks-v1.png',entry:{x:836,y:770},neighbors:['waterworks'],color:'#8e977c',lights:[[714,704,80],[956,706,80],[379,94,80],[1330,100,80]],spots:[
 {id:'oldworksExit',name:'南阶 · 返回旧水渠',subtitle:'沿清水回镇，调查没有期限',x:836,y:810,stand:{x:836,y:770},radius:42,to:'waterworks',arrow:'↓'},
 {id:'archiveDoor',name:'封存仓库',subtitle:'左门 · 账册与未清运的货物',x:465,y:160,stand:{x:465,y:300},radius:65},
 {id:'sealDoor',name:'封存机房',subtitle:'右门 · 三处泄漏阀与封存装置',x:1260,y:160,stand:{x:1260,y:300},radius:65},
 {id:'archiveCamp',name:'外渠工具箱',subtitle:'巡查记录、准备与配置',x:1080,y:680,stand:{x:1080,y:640},radius:40},
 {id:'patroller',name:'巡查员 · 岑禾',subtitle:'先救人，再整理那份清单',x:620,y:365,stand:{x:620,y:440},radius:45}
 ]},
 waterworks:{name:'旧水渠',subtitle:'污染调查、感染村民与净水泵',file:'./assets/regions/waterworks-v1.png',entry:{x:320,y:580},entryFrom:{oldworks:{x:1260,y:350}},neighbors:['forest','oldworks'],color:'#668e89',spots:[
  {id:'toOldworks',name:'沿渠北路 · 旧染坊外渠',subtitle:'封存库的回声 · 先读广场清单',x:1260,y:280,stand:{x:1260,y:350},radius:40,to:'oldworks',arrow:'↑'},
  {id:'waterExit',name:'林口 · 返回雾松林',subtitle:'随时返回安全的小路',x:195,y:540,stand:{x:280,y:540},radius:45,to:'forest',arrow:'←'},
  {id:'waterCamp',name:'巡查营地',subtitle:'装备、滤芯、战前准备',x:350,y:765,stand:{x:350,y:690},radius:52},
  {id:'dyeLedger',name:'旧染坊账册',subtitle:'调查泄漏源头',x:311,y:173,stand:{x:340,y:325},radius:50},
  {id:'infected',name:'失控的取水人',subtitle:'两名村民还在水渠中',x:710,y:480,stand:{x:740,y:555},radius:45},
  {id:'sluice',name:'污染闸阀',subtitle:'阻断黑苔流入支渠',x:1440,y:90,stand:{x:1360,y:345},radius:65},
  {id:'purifier',name:'净水泵',subtitle:'安装滤芯并保护净化过程',x:850,y:175,stand:{x:850,y:330},radius:65},
 ]},
};
// New plates have authored open paths and closed decorative borders.
export function regionWalkable(region,x,y){
 if(region==='town'){
  if(x>=220&&x<=410&&y>=190&&y<=225||x>=373&&x<=430&&y>=210&&y<=349||x>=1518&&x<=1620&&y>=466&&y<=572||x>=1450&&x<=1550&&y>=505&&y<=580)return true;
  const ground=x>=413&&x<=1490&&y>=314&&y<=748||x>=74&&x<=460&&y>=635&&y<=674||x>=775&&x<=877&&y>=274&&y<=355||x>=575&&x<=1060&&y>=730&&y<=824;
  if(!ground)return false;
  return ![[965,0,1672,496],[430,0,548,290],[585,0,711,300],[1164,610,1285,770]].some(([l,t,r,b])=>x>l-8&&x<r+8&&y>t-5&&y<b+8);
 }
 if(region==='orchard'){
  if(!(x>=264&&x<=1435&&y>=140&&y<=717||x>=753&&x<=906&&y>=698&&y<=866))return false;
  return ![[414,417,548,513],[782,279,894,360],[1168,428,1298,518],[1322,626,1490,710]].some(([l,t,r,b])=>x>l-12&&x<r+12&&y>t-7&&y<b+12);
 }
 if(region==='hillside'){
  const floor=x>=407&&x<=1450&&y>=342&&y<=706||x>=745&&x<=942&&y>=156&&y<=370||x>=124&&x<=351&&y>=272&&y<=322||x>=323&&x<=480&&y>=297&&y<=441||x>=765&&x<=923&&y>=690&&y<=832;
  if(!floor)return false;return ![[450,150,753,373],[727,413,1100,600],[1028,0,1610,333],[1355,318,1560,398],[178,321,318,375],[415,525,502,588]].some(([l,t,r,b])=>x>l-8&&x<r+8&&y>t-5&&y<b+8);
 }
 if(region==='oldworks')return x>=280&&x<=1390&&y>=285&&y<=715||x>=770&&x<=915&&y>=700&&y<=820;
 if(region==='waterworks')return x>=260&&x<=1410&&y>=310&&y<=715;
 if(region==='forest'){
  if(x<78||x>1590||y<355||y>680)return false;
  for(const [l,t,r,b] of [[718,0,1035,335],[363,275,599,384],[659,287,749,358],[1018,250,1147,359],[1238,0,1430,383],[0,580,290,941],[1110,626,1672,941],[518,627,655,735],[0,0,197,477],[1507,0,1672,490],[285,613,369,710],[847,625,950,695],[1425,555,1672,941],[0,535,125,941]])if(x>l-8&&x<r+8&&y>t-5&&y<b+8)return false;
  return true;
 }
 if(region==='wharf'){
  if(!(x>=77&&x<=1510&&y>=348&&y<=495||x>=915&&x<=1060&&y>=490&&y<=556||x>=995&&x<=1170&&y>=548&&y<=610||x>=1040&&x<=1170&&y>=600&&y<=726))return false;
  for(const [l,t,r,b]of [[470,0,713,331],[736,204,797,329],[1142,0,1255,349],[284,247,425,336],[1073,474,1281,538]])if(x>l-7&&x<r+7&&y>t-5&&y<b+8)return false;
  return true;
 }
 return false;
}
export function regionForTarget(id){if(['hallKitchen','hallRegister','hallPhotos','townLucy','townTaoen','townMila'].includes(id))return 'town';if(id==='indoorLucy')return 'farm';if(['farm','lucy','home','wood','stone','honey','mill','oven','grave','table'].includes(id)||id?.startsWith('plot'))return 'farm';return REGION_ORDER.find(k=>REGIONS[k].spots.some(p=>p.id===id));}
export function nextExit(from,to){
 if(from===to)return null;
 const queue=[[from]],seen=new Set([from]);
 while(queue.length){const path=queue.shift(),last=path.at(-1);for(const next of REGIONS[last]?.neighbors||[]){if(seen.has(next))continue;const route=[...path,next];if(next===to)return REGIONS[from].spots.find(p=>p.to===route[1]);seen.add(next);queue.push(route);}}
 return null;
}
