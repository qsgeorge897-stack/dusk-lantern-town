// Temporary encounter state; persistent milestones live in archive.js.
export const OP_WAVES={canalRescue:[['carrier','runner','moss'],['runner','carrier','moss']],storeClear:[['carrier','carrier','runner','moss'],['runner','runner','moss','carrier']],sealDevice:[['carrier','runner','carrier','moss'],['moss','carrier','runner','moss'],['runner','moss','carrier','runner']]};
export const SEAL_VALVES=[{name:'西阀',x:470,y:450},{name:'南阀',x:850,y:660},{name:'东阀',x:1200,y:450}];
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function newOperation(ticket){return {kind:ticket.encounter,practice:ticket.practice===true,wave:0,queue:[],warning:0,spawnTimer:0,spawned:0,panelOpen:false,repairs:3,channel:null,valves:SEAL_VALVES.map(v=>({...v,closed:false})),closed:0};}
function wave(op){op.queue=OP_WAVES[op.kind][op.wave].map((type,i)=>({type,lane:i%2?'east':'west',index:i}));op.wave++;op.warning=2;op.spawnTimer=0;}
export function tickOperation(b,dt,spawn){const op=b.operation;if(!op)return;if(op.wave===0)wave(op);if(op.warning>0){op.warning=Math.max(0,op.warning-dt);return;}op.spawnTimer-=dt;if(op.queue.length&&op.spawnTimer<=0){const next=op.queue.shift();op.spawned++;spawn(next,op.spawned);op.spawnTimer=.65;}}
function message(b,text){b.notice=text;b.noticeUntil=b.time+2;}
export function cancelChannel(b,text='操作已中断 · 靠近当前阀门按 E 重试'){if(b.operation?.channel){b.operation.channel=null;message(b,text);}}
export function operationCommand(b,p,command){const op=b.operation;if(!op||b.paused||b.status!=='active'||op.kind!=='sealDevice')return false;
 if(command==='operationRepair'){if(op.repairs<=0||b.pump.hp>=b.pump.max){message(b,op.repairs?'装置完好，无须修理':'修理材料已经用完');return false;}op.repairs--;b.pump.hp=Math.min(b.pump.max,b.pump.hp+45);message(b,'装置修理 +45 · 剩余 '+op.repairs+'次');return true;}
 if(command!=='interact')return false;const v=op.valves[op.closed];if(!v)return false;
 if(distance(p,v)>60){message(b,'先靠近'+v.name+'，站稳后按 E');return false;}
 if(op.wave===0||op.warning>0||op.queue.length){message(b,'泄漏仍在涌出 · 本批到齐后开始关阀');return false;}
 if(b.swing||b.pulseWave||b.dash>0){message(b,'先收稳剑和提灯，再操作阀门');return false;}
 if(!op.channel){op.channel={index:op.closed,age:0,x:p.x,y:p.y,hp:b.hp};message(b,'正在关闭'+v.name+' · 保持静止2秒');}return true;
}
export function operationTarget(b,p,e){return b.operation?.kind==='sealDevice'&&e.pressure?b.pump:p;}
export function finishOperation(b,p,dt){const op=b.operation;if(!op)return false;
 if(op.kind==='sealDevice'){
  const q=op.channel;if(q){if(distance(q,p)>14||b.hp<q.hp){cancelChannel(b);return false;}q.age+=dt;if(q.age>=2){op.valves[q.index].closed=true;op.closed++;op.channel=null;if(op.closed<3){wave(op);message(b,'阀门归位 · 下一批将至，前往'+op.valves[op.closed].name);}else{b.projectiles=[];for(const e of b.enemies)e.hp=0;return true;}}}return false;
 }
 if(op.warning>0||op.queue.length||b.enemies.some(e=>e.hp>0))return false;
 if(op.wave<OP_WAVES[op.kind].length){wave(op);message(b,'下一批即将抵达 · 注意两侧来向');return false;}return true;
}
export function operationSummary(b){const op=b.operation;if(!op)return '';return op.kind==='sealDevice'?`关阀 ${op.closed}/3 · ${op.channel?'操作中 '+Math.min(100,Math.floor(op.channel.age/2*100))+'%':'下一处：'+(op.valves[op.closed]?.name||'完成')} · 装置 ${Math.ceil(b.pump.hp)}/${b.pump.max}`:`第 ${Math.max(1,op.wave)}/2 批 · 剩余 ${b.enemies.filter(e=>e.hp>0).length+op.queue.length}${op.warning>0?' · 即将抵达':''}`;}
