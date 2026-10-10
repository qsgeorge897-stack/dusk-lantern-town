import {REGIONS,regionOf} from './regions.js?v=0.13.3';
import {ROOMS,nearRoomSpot,sceneOf} from './indoors.js?v=0.13.3';
export const ARCHIVE_ENCOUNTERS={canalRescue:{name:'外渠救援',scene:'oldworks',spot:'patroller',flag:'rescued'},storeClear:{name:'仓库清理',scene:'archiveRoom',spot:'archiveCache',flag:'cleared'},sealDevice:{name:'封存装置',scene:'sealRoom',spot:'sealConsole',flag:'sealed'}};
export const ARCHIVE_LOADOUTS={balanced:{name:'均衡巡查',text:'短剑24伤害，提灯半径200、消耗35、冷却5秒'},lined:{name:'加衬护衣',text:'额外减伤2；提灯冷却6秒'},wick:{name:'长芯提灯',text:'提灯半径235、消耗28；短剑伤害20'}};
export const ARCHIVE_ACTIONS=['archiveStart','archiveBrief','archiveRoute','archiveLedger','archiveFight','archiveFinish','archiveRetreat','archiveReport','archiveLoadout'];
export const newArchive=()=>({started:false,briefed:false,rescued:false,routeStep:0,ledger:false,cleared:false,sealed:false,reported:false,loadout:'balanced',serial:0,pending:null});
export const archiveAvailable=s=>!!(s.town.flags.market&&s.water.reported);
const need=(ok,message)=>{if(!ok)throw Error(message);};
function at(s,id){const spot=REGIONS[sceneOf(s)]?.spots.find(p=>p.id===id),p=spot?.stand||spot;need(nearRoomSpot(s,id)||p&&Math.hypot(s.player.x-p.x,s.player.y-p.y)<105,'先走到这个调查点旁');}
function canFight(s,encounter,practice){const a=s.archive;need(Object.hasOwn(ARCHIVE_ENCOUNTERS,encounter),'未知巡查遭遇');need(a.briefed,'先读外渠工具箱的巡查记录');if(practice){need(encounter==='sealDevice'&&a.reported,'结案后可进行机房演练');return;}need(!a[ARCHIVE_ENCOUNTERS[encounter].flag],'这一段已经完成');if(encounter!=='canalRescue')need(a.rescued,'先救回外渠巡查员');if(encounter==='sealDevice')need(a.ledger,'先带上封存账册');}
export function archiveAction(s,type,p,{note}){const a=s.archive;
 if(type==='archiveStart'){at(s,'townBoard');need(archiveAvailable(s),'先完成公共夜市，并交回旧水源调查报告');need(!a.started,'已经收好这份清单');a.started=true;note(s,'陶恩与米菈合署的封存清单：村井仍然安全，另一个旧库却有敲击声。巡查员岑禾尚未回来。旧水渠沿渠北路可以通往旧染坊外渠。');return '封存库的回声 · 旧水渠北路开放';}
 need(a.started,'先读广场告示板的封存清单');
 switch(type){
 case 'archiveBrief':at(s,'archiveCamp');need(!a.briefed,'巡查记录已记下');a.briefed=true;note(s,'外渠工具箱留着岑禾的记录：先救人，仓库通风窗连着北货架和西锁扣。机房封存装置可以把残余孢子重新隔离。');return '巡查记录已收好 · 靠近岑禾开始救援';
 case 'archiveRoute':{need(a.rescued,'先救回岑禾');need(Number.isInteger(p.index)&&p.index>=0&&p.index<3,'请选择安全路线节点');at(s,['archiveWindow','archiveShelf','archiveLatch'][p.index]);need(a.routeStep<3,'侧路已经打开');if(p.index!==a.routeStep){a.routeStep=0;return '顺序不对，回到东通风窗重试 · 不扣材料';}a.routeStep++;return a.routeStep===3?'侧路已通 · 可以取账册':'已检查 '+a.routeStep+'/3 · 东窗 → 北架 → 西扣';}
 case 'archiveLedger':at(s,'archiveLedgerSpot');need(a.rescued&&(a.routeStep===3||a.cleared),'先走通侧路，或清理仓库');need(!a.ledger,'账册已收进手记');a.ledger=true;note(s,'封存账册证实：北闸只是暂存点，旧库没有完成转运。机房必须按西、南、东关闭泄漏阀，再把清运责任记到每个人的名字下。');return '取得封存账册 · 机房可进入';
 case 'archiveFight':{need(typeof p.practice==='boolean'||p.practice===undefined,'演练参数无效');const practice=p.practice===true;canFight(s,p.encounter,practice);const meta=ARCHIVE_ENCOUNTERS[p.encounter];need(sceneOf(s)===meta.scene,'请到对应地点开始');at(s,meta.spot);need(!a.pending&&!s.water.pending,'先结束当前战斗');a.serial++;a.pending={id:a.serial,encounter:p.encounter,practice};s.player={x:825,y:650};s.minute=Math.min(1320,s.minute+10);return (practice?'无奖演练':'进入'+meta.name)+' · 自然时间暂停';}
 case 'archiveFinish':{const q=a.pending;need(q&&q.id===p.id&&q.encounter===p.encounter&&p.won===true,'巡查凭据无效或已经结算');need(sceneOf(s)===ARCHIVE_ENCOUNTERS[q.encounter].scene,'请在当前遭遇结算');a.pending=null;if(q.practice)return '演练完成 · 金币、记录与纪念保持原样';a[ARCHIVE_ENCOUNTERS[q.encounter].flag]=true;const text=q.encounter==='canalRescue'?'岑禾醒了。她说自己不是在等英雄，只是在等一个记得点人数的人。仓库和安全侧路都可以调查了。':q.encounter==='storeClear'?'仓库的附着物消散。清运附录写着一笔从未兑现的工钱；这页补充记录不会阻挡结案。':'三个泄漏阀归位，封存装置重新稳定。把账册带回广场，给这份清单一个有名字的结尾。';note(s,text);return text;}
 case 'archiveRetreat':need(a.pending,'当前没有巡查战斗');{const scene=ARCHIVE_ENCOUNTERS[a.pending.encounter].scene;a.pending=null;s.player={...(ROOMS[scene]||REGIONS[scene]).entry};}return '退回安全入口 · 财物与已完成节点保留';
 case 'archiveReport':at(s,'townBoard');need(a.sealed&&!a.reported,'先完成封存；奖励只领取一次');a.reported=true;s.coins+=80;note(s,'封存清单交回。陶恩写上复查日期，米菈写上清运名单，岑禾终于能回家吃饭。获得80金币与巡查徽记；新巡查配置和无奖演练开放。');return '封存库的回声 · 结案 · 80金币与巡查徽记';
 case 'archiveLoadout':at(s,'archiveCamp');need(a.reported,'结案后开放巡查配置');need(Object.hasOwn(ARCHIVE_LOADOUTS,p.key),'请选择巡查配置');a.loadout=p.key;return '下次巡查采用：'+ARCHIVE_LOADOUTS[p.key].name;
 default:throw Error('未知封存调查操作');
 }
}
export function archiveObjective(s){const a=s.archive||newArchive(),base=(title,body,target)=>({chapter:'可选巡查 / 封存库的回声',title,body,target,checks:[['读取外渠记录',a.briefed],['救回岑禾',a.rescued],['取得封存账册',a.ledger],['关闭三处泄漏阀',a.sealed],['回广场交回清单',a.reported]]});
 if(!a.started)return base('一份未签完的清单',archiveAvailable(s)?'广场告示板上，陶恩和米菈留下另一份封存记录。自愿接取，没有期限。':'公共夜市与旧水源调查报告完成后开放。温室与农场可照常经营。','townBoard');
 if(!a.briefed)return base('岑禾留下的记录','从旧水渠北路进入旧染坊外渠，先读入口旁工具箱。','archiveCamp');
 if(!a.rescued)return base('先把点名簿上的人带回来','外渠的岑禾被黑苔围住；准备好再开始两批救援。','patroller');
 if(!a.ledger)return base('账册没有写完的那一页','进入左侧封存仓库：沿东窗、北架、西扣安全取证，或主动清理附着物。','archiveLedgerSpot');
 if(!a.sealed)return base('把回声留在铜管里','进入右侧机房，保护装置，依次关西阀、南阀、东阀；走近按E，保持2秒。','sealConsole');
 if(!a.reported)return base('清单上，每个人都有名字','回广场告示板交回封存清单。奖励只领取一次。','townBoard');
 return {...base('这次，记得点齐人数','巡查徽记已记下。外渠工具箱可免费换配置，机房可无奖演练。','archiveCamp'),complete:true};
}
export function readArchive(raw,s){const a=newArchive(),bad=()=>{throw Error('存档封存库调查进度无效');};if(raw===undefined){if(s.expansion.visited.oldworks||['archiveRoom','sealRoom'].includes(s.life.room))bad();return a;}if(!raw||Array.isArray(raw)||typeof raw!=='object')bad();
 for(const k of ['started','briefed','rescued','ledger','cleared','sealed','reported']){if(typeof raw[k]!=='boolean')bad();a[k]=raw[k];}
 for(const [k,max]of [['routeStep',3],['serial',1e8]]){if(!Number.isInteger(raw[k])||raw[k]<0||raw[k]>max)bad();a[k]=raw[k];}if(!Object.hasOwn(ARCHIVE_LOADOUTS,raw.loadout))bad();a.loadout=raw.loadout;
 if(a.started&&!archiveAvailable(s)||!a.started&&(a.briefed||s.expansion.visited.oldworks)||a.briefed&&!s.expansion.visited.oldworks||a.rescued&&!a.briefed||(a.routeStep||a.cleared)&&!a.rescued||a.ledger&&!(a.routeStep===3||a.cleared)||a.sealed&&!a.ledger||a.reported&&!a.sealed||a.loadout!=='balanced'&&!a.reported||s.life.room==='archiveRoom'&&!a.rescued||s.life.room==='sealRoom'&&!a.ledger)bad();
 if(raw.pending!==null){const q=raw.pending;if(!q||q.id!==a.serial||a.serial<1||!Object.hasOwn(ARCHIVE_ENCOUNTERS,q.encounter)||typeof q.practice!=='boolean'||s.water.pending||sceneOf(s)!==ARCHIVE_ENCOUNTERS[q.encounter].scene)bad();try{canFight({...s,archive:a},q.encounter,q.practice);}catch{bad();}const scene=ARCHIVE_ENCOUNTERS[q.encounter].scene;s.player={...(ROOMS[scene]||REGIONS[scene]).entry};}return a;
}
