// Indoor coordinates share the 1672 × 941 world space. Outdoors remains the travel region.
const spot=(id,name,x,y,sx,sy,subtitle='走近后按 E 互动')=>({id,name,x,y,stand:{x:sx,y:sy},radius:58,subtitle});
export const DOORS={
 archiveRoom:{id:'archiveDoor',name:'封存仓库',parent:'oldworks',x:465,y:160,stand:{x:465,y:300},radius:65},
 sealRoom:{id:'sealDoor',name:'封存机房',parent:'oldworks',x:1260,y:160,stand:{x:1260,y:300},radius:65},
 greenhouse:{id:'greenDoor',name:'山坡温室',parent:'hillside',x:1275,y:276,stand:{x:1280,y:365},radius:60},
 repair:{id:'repairDoor',name:'陶恩的修理屋',parent:'town',x:218,y:143,stand:{x:249,y:205},radius:52},
 laundry:{id:'laundryDoor',name:'米菈的洗衣屋',parent:'town',x:1580,y:410,stand:{x:1575,y:480},radius:48},
 hall:{id:'hallDoor',name:'小镇会馆',parent:'town',x:1375,y:396,stand:{x:1375,y:541},radius:65},
 home:{id:'home',name:'守灯人之家',parent:'farm',x:754,y:389,stand:{x:755,y:441},radius:64},
 shop:{id:'shopDoor',name:'露西杂货屋',parent:'farm',x:180,y:254,stand:{x:197,y:286},radius:58},
 post:{id:'postDoor',name:'渡口邮驿',parent:'wharf',x:596,y:299,stand:{x:596,y:380},radius:62},
};
const exit=()=>({...spot('roomExit','出门',836,719,836,699,'返回门外 · 不消耗时间'),exitRoom:true});
// The home window aisle is floor; table and chairs block only their own footprints.
export const ROOMS={
 archiveRoom:{name:'封存仓库',file:'./assets/interiors/archive-room-v2.png',entry:{x:836,y:740},parent:'oldworks',bounds:[280,1390,285,750],obstacles:[],lights:[[436,64,90],[1515,62,90]],spots:[exit(),spot('archiveWindow','① 东通风窗',1538,275,1370,330,'先让封存间透透气'),spot('archiveShelf','② 北货架',1110,147,1100,295,'对齐旧货签'),spot('archiveLatch','③ 西锁扣',285,330,325,370,'拉开账桌侧面的锁扣'),spot('archiveLedgerSpot','封存账册',817,118,817,295,'安全路线或清理完成后取证'),spot('archiveCache','被黑苔包住的货箱',435,625,490,640,'可选两批清理 · 额外附录，无金币')]},
 sealRoom:{name:'封存机房',file:'./assets/interiors/seal-room-v1.png',entry:{x:836,y:740},parent:'oldworks',bounds:[280,1390,295,750],obstacles:[],lights:[[174,206,100],[1493,224,100]],spots:[exit(),spot('sealConsole','便携封存装置',850,410,850,525,'启动前确认路线与撤退方式')]},

 greenhouse:{name:'山坡温室',file:'./assets/interiors/greenhouse-room-v1.png',entry:{x:836,y:718},parent:'hillside',bounds:[235,1440,282,755],obstacles:[[306,323,726,480],[946,323,1370,480],[0,365,218,551],[1350,604,1660,755]],lights:[[108,241,85],[1560,240,85]],spots:[exit(),spot('greenBench','温室工作台',135,449,255,520,'整理笔记、补种与烹饪'),spot('greenVines','窗前枯藤',216,113,278,304,'把日光请进来'),spot('greenWater','集雨槽铜管',1424,164,1415,303,'接通屋顶收集的雨水'),...[469,667,1007].map((x,i)=>({...spot('greenMirror'+i,'反光板 '+(i+1),x,115,x,303,'转动铜镜，让光路连通'),radius:34})),spot('greenBed0','左床 · 番茄',518,408,518,532,'播种、照料与采收'),spot('greenBed1','右床 · 薄荷',1156,408,1156,532,'播种、照料与采收'),spot('greenLamp','山坡的铜灯',836,64,836,290,'18:00后，给晚归的人留一盏灯')]},
 repair:{name:'陶恩的修理屋',file:'./assets/interiors/repair-room-v1.png',entry:{x:836,y:718},parent:'town',bounds:[220,1440,340,755],obstacles:[[110,145,329,393],[360,0,650,327],[1300,316,1375,381],[1068,0,1450,345],[1450,220,1672,941],[0,0,220,941]],lights:[[640,130,105],[1360,150,105]],spots:[exit(),spot('repairBlueprint','水槽图纸',560,252,620,390,'图纸上有三个编号'),spot('repairGauge','铜制压力表',1220,228,1190,410,'检查水流是否通畅'),spot('repairBench','修理工作台',1380,290,1320,410,'封住接缝与改造水壶')]},
 laundry:{name:'米菈的洗衣屋',file:'./assets/interiors/laundry-room-v1.png',entry:{x:836,y:718},parent:'town',bounds:[270,1440,335,755],obstacles:[[180,100,465,315],[545,0,1050,312],[1110,100,1455,336],[1270,270,1372,364],[0,330,282,710],[270,564,328,668],[1430,340,1672,780]],lights:[[986,60,100],[1135,738,95]],spots:[exit(),spot('laundryPhoto','旧照片',303,65,440,380,'照片里的桌布，和现在不一样'),spot('laundryCloth','洗衣与染布台',223,416,372,460,'留住旧花纹，或染成雨后蓝'),spot('laundrySewing','窗边缝纫台',1320,246,1175,402,'米菈总在这里收好最后一根线')]},

 hall:{name:'小镇会馆',file:'./assets/interiors/hall-v1.png',entry:{x:836,y:718},parent:'town',bounds:[165,1490,405,750],obstacles:[[595,0,1074,394],[190,255,567,376],[175,345,351,501],[1095,0,1440,409],[1412,497,1540,655],[1450,629,1590,729],[90,594,180,720],[140,717,710,850],[960,717,1570,850]],lights:[[169,294,115],[637,187,115],[1037,183,115],[1490,325,110]],spots:[exit(),spot('hallKitchen','会馆厨房',438,321,490,452,'夜市开幕后制作苹果蜜酱'),spot('hallRegister','会馆旧名册',1282,290,1260,463,'整理三封邀请'),spot('hallCloth','会馆桌布',266,417,407,520,'给旧桌布一个新位置'),spot('hallTea','给朋友留的椅子',1095,560,1000,575,'18:00以后，一起歇一会儿'),spot('marketGuestbook','夜市留言簿',1280,312,1240,470,'也听听忙碌的人想说什么'),spot('hallPhotos','旧照片与留言',1360,177,1370,466,'磨坊、邮路与未说完的话')]},
 home:{name:'守灯人之家',file:'./assets/interiors/home-v1.png',entry:{x:836,y:718},parent:'farm',bounds:[303,1360,282,753],obstacles:[[303,190,349,341],[349,248,691,345],[1100,212,1318,429],[314,436,438,557],[777,370,920,501],[714,419,763,491],[933,419,981,491],[1332,468,1400,678]],spots:[exit(),spot('bed','床',1240,331,1120,468,'睡到明早'),spot('stove','家中灶台',502,262,527,394,'烤派与煮鱼汤'),spot('chest','储物箱',377,495,450,571,'存放与取出物品'),spot('dining','餐桌',846,421,841,555,'吃饭与邀请朋友'),spot('keepsake','纪念架',1360,563,1280,602,'那些留下来的事物')]},
 shop:{name:'露西杂货屋',file:'./assets/interiors/shop-v2.png',entry:{x:836,y:718},parent:'farm',bounds:[303,1410,304,745],
  obstacles:[[378,266,508,648],[303,247,352,301],[277,479,343,571],[1272,126,1458,331],[1412,330,1510,645],[1185,421,1309,548],[1120,466,1175,535],[1322,466,1374,535],[1414,671,1520,768]],
  npcs:{lucy:{x:344,y:405}},seats:{keeper:{x:1148,y:518},lucy:{x:1347,y:518}},seatForeground:[[1120,511,58,26],[1321,511,58,26]],lights:[[1380,185,100],[451,405,80]],
  spots:[exit(),spot('indoorLucy','露西',344,405,548,430,'柜台后聊天、交付与买卖'),spot('counter','侧边柜台',453,447,548,450,'种子与收成'),spot('teaTable','圆茶桌',1248,462,1256,599,'坐下来聊聊'),spot('orders','柜台委托簿',457,308,548,338,'河上的第一顿晚餐')]},
 post:{name:'渡口邮驿',file:'./assets/interiors/post-v2.png',entry:{x:836,y:718},parent:'wharf',bounds:[280,1370,320,742],
  obstacles:[[281,219,467,315],[689,200,1010,310],[1204,220,1307,317],[1300,304,1470,696],[1254,535,1299,604],[260,319,356,429],[215,431,327,591],[150,589,269,756],[690,721,734,900],[897,721,943,900]],
  npcs:{vera:{x:1170,y:570}},sortedLetters:{x:1350,y:470},lights:[[320,316,75],[1350,287,65],[1400,560,95]],
  spots:[exit(),spot('sortMail','沿墙分拣台',1360,510,1206,510,'替回信找到位置'),spot('archive','邮路档案格',1410,240,1230,380,'邮路的往事'),spot('guestbook','等候区留言簿',316,349,424,404,'后来的人留下的话'),spot('indoorVera','薇拉的座位',1170,570,1080,582,'夜晚持灯，与薇拉交谈')]},
};
export const sceneOf=s=>s.life?.room||s.expansion?.region||'farm';
export function roomWalkable(id,x,y){const room=ROOMS[id];if(!room)return false;const [left,right,top,bottom]=room.bounds||[303,1360,351,753];if(x<left||x>right||y<top||y>bottom)return false;return !room.obstacles.some(([l,t,r,b])=>x>l-12&&x<r+12&&y>t-5&&y<b+12);}
export function nearRoomSpot(s,id){const p=ROOMS[s.life?.room]?.spots.find(p=>p.id===id)?.stand;return !!p&&Math.hypot(s.player.x-p.x,s.player.y-p.y)<115;}
