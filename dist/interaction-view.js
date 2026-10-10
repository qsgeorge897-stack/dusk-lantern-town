import {HILL_ART} from './assets/hill-atlas.js?v=0.13.3';
import {REGIONS} from './regions.js?v=0.13.3';
import {ROOMS,DOORS} from './indoors.js?v=0.13.3';
import {CROPS,isRipe} from './rules.js?v=0.13.3';

// Presentation only: availability is derived from the same saved counters as gathering.
export function resourceView(p,s){
  const key=p.resource||(['wood','stone','honey'].includes(p.id)?p.id:null);
  if(key){
    const limit={wood:3,stone:3,honey:1,herb:3,resin:2}[key];
    if(!limit)return null;
    const used=(p.resource?s.expansion.daily:s.daily)[key]||0,remaining=Math.max(0,limit-used);
    const name={wood:'木材',stone:'石料',honey:'蜂蜜',herb:'月露草',resin:'松脂'}[key];
    return {icon:key,ready:remaining>0,remaining,limit,title:remaining?`采集${name}`:`${name} · 今日已采完`,detail:remaining?`今日还可采 ${remaining} 次`:'睡到明天后恢复'};
  }
  if(p.id==='orchardTrees'){
    const t=s.town,ready=t.growth===2;
    return {icon:'apple',ready,title:ready?'采收苹果':!t.flags.cleared?'清理果树':!t.flags.irrigation?'果树 · 等待灌溉':t.tended||s.weather==='rain'?'果树 · 今日已照料':'照料果树',detail:ready?'苹果已经成熟':!t.flags.cleared?'先清理树下的杂草':!t.flags.irrigation?'先修复蓄水槽':`成长 ${t.growth}/2 夜`};
  }
  if(/^greenBed[01]$/.test(p.id)){
    const i=Number(p.id.at(-1)),b=s.hill.beds[i],name=i?'薄荷':'番茄',ready=!!b.crop&&b.growth===2;
    return {icon:i?'mint':'tomato',ready,title:!s.hill.light?`${name}床 · 待修复`:!b.crop?`种下${name}`:ready?`采收${name}`:b.tended||s.weather==='rain'?`${name} · 今日已照料`:`照料${name}`,detail:!s.hill.light?'先修复温室水路与光路':!b.crop?'在这里开始种植':ready?'作物已经成熟':`成长 ${b.growth}/2 夜`};
  }
  if(p.index!==undefined){
    const b=s.plots[p.index];if(!b?.crop)return null;
    return {icon:b.crop,ready:isRipe(b),title:isRipe(b)?`收获${CROPS[b.crop].name}`:b.watered?`${CROPS[b.crop].name} · 已浇水`:`为${CROPS[b.crop].name}浇水`,detail:isRipe(b)?'作物已经成熟':`还需 ${CROPS[b.crop].days-b.growth} 夜`};
  }
  return null;
}

export function interactionView(p,s){
  if(!p)return {kind:'idle',category:'',title:'',detail:''};
  if(p.to){
    const locked=!s.flags.metLucy?'先和露西打声招呼':p.to==='oldworks'&&!s.archive.started?'先读广场封存清单':p.to==='hillside'&&!s.hill.started?'先读广场温室来信':p.to==='waterworks'&&(!s.water.started||!s.water.gear)?'先完成水源调查准备':'';
    return {kind:'travel',category:'前往',title:REGIONS[p.to].name,detail:locked||'切换区域',locked:!!locked};
  }
  if(p.exitRoom)return {kind:'travel',category:'出门',title:REGIONS[ROOMS[s.life.room].parent].name,detail:'返回门外',locked:false};
  const door=Object.values(DOORS).find(d=>d.id===p.id)||(p.id==='lucy'&&s.flags.metLucy?DOORS.shop:null);
  if(door)return {kind:'door',category:'进入',title:door.name,detail:p.subtitle};
  const resource=resourceView(p,s);
  if(resource)return {kind:'resource',category:'资源',...resource};
  if(p.index!==undefined)return {kind:'resource',category:'耕地',title:'空地 · 播种',detail:'选择种子后种植'};
  if(p.resident||['lucy','indoorLucy','indoorVera','vera','infected','infectedMila','patroller'].includes(p.id))return {kind:'talk',category:'交谈',title:p.name,detail:p.subtitle};
  return {kind:'inspect',category:'查看',title:p.name,detail:p.subtitle};
}

function travelLabel(p,view,unit){
 const q=p.stand||p,text=p.exitRoom?'出门 ↓':`${view.title} ${p.arrow||'→'}`;
 return {text,x:q.x,y:p.exitRoom?p.y+36:q.y+26,width:(text.length*12+16)*unit,height:24*unit};
}

// The shop entrance sits beside the existing hanging wheat sign. The plaque is
// always visible; the quiet ground corners appear only when the keeper is near.
export const SHOP_ENTRY={plaque:{x:211,y:214,w:116,h:28},zone:{x:147,y:252,w:100,h:68},near:155};

function atShop(s,w){return !s.life?.room&&s.expansion?.region==='farm'&&!w.combat&&!w.fishing&&!w.paused;}
function shopNearby(s){return Math.hypot(s.player.x-197,s.player.y-286)<SHOP_ENTRY.near;}

export function drawShopEntryGround(c,s,w){
  if(!atShop(s,w))return;
  if(shopNearby(s)){
    const {x,y,w:width,h:height}=SHOP_ENTRY.zone;
    c.save();c.fillStyle='rgba(237,204,126,.09)';c.fillRect(x+3,y+3,width-6,height-12);
    c.strokeStyle='rgba(250,220,151,.83)';c.lineWidth=2.5;c.beginPath();
    for(const [sx,sy,dx,dy] of [
      [x,y+19,0,-15],[x,y,18,0],[x+width-18,y,18,0],[x+width,y,0,19],
      [x,y+height-22,0,16],[x,y+height-6,23,0],
      [x+width-23,y+height-6,23,0],[x+width,y+height-22,0,16],
    ]){c.moveTo(sx,sy);c.lineTo(sx+dx,sy+dy);}c.stroke();
    c.fillStyle='#f6df9f';for(const side of [x,x+width]){c.beginPath();c.arc(side,y+height/2,2.4,0,Math.PI*2);c.fill();}
    c.restore();
  }
  drawShopPlaque(c,Math.max(1,Math.min(1.65,1/(w.scale||1))));
}

function drawShopPlaque(c,unit){
  const {x,y,w,h}=SHOP_ENTRY.plaque;
  c.save();c.translate(x+w/2,y+h/2);c.scale(unit,unit);const width=w,height=h;
  c.strokeStyle='#775838';c.lineWidth=1.5;c.beginPath();for(const px of [-19,19]){c.moveTo(px,-height/2-8);c.lineTo(px,-height/2);}c.stroke();
  c.fillStyle='#4d3729';c.fillRect(-width/2,-height/2,width,height);
  c.strokeStyle='#c09b65';c.strokeRect(-width/2+.75,-height/2+.75,width-1.5,height-1.5);
  c.strokeStyle='#806348';c.strokeRect(-width/2+3.5,-height/2+3.5,width-7,height-7);
  c.fillStyle='#e7c788';for(const px of [-width/2+9,width/2-9])c.fillRect(px-1,-1,2,2);
  c.font='600 12px "PingFang SC",sans-serif';c.textAlign='center';c.fillStyle='#f1dda8';c.fillText('露西杂货屋',0,4);
  c.restore();
}

export function drawInteractionMarkers(c,s,w){
  if(w.combat||w.fishing||w.paused)return;
  const spots=w.spots(),hover=spots.find(p=>p.id===w.hover?.id)||w.plots().find(p=>p.id===w.hover?.id);
  const near=w.nearest(),focus=hover||near,unit=Math.max(1,Math.min(1.65,1/(w.scale||1)));
  for(const p of [...spots,...w.plots()]){
    const active=focus?.id===p.id,view=interactionView(p,s),q=p.stand||p;
    if(view.kind==='travel'){
      // Restore the quiet destination labels; one label per exit, no oversized sign.
      const {text,x,y,width,height}=travelLabel(p,view,unit);
      c.save();c.font=`500 ${12*unit}px "PingFang SC",sans-serif`;c.textAlign='center';
      c.fillStyle='rgba(20,34,29,.84)';c.fillRect(x-width/2,y-height/2,width,height);
      c.fillStyle=view.locked?'#d4c6a5':'#f3d58e';c.fillText(text,x,y+4*unit);c.restore();
    }else if(view.kind==='resource'&&view.icon){
      // No marker on growing field crops: their own growth art remains the primary cue.
      if(p.index!==undefined&&!view.ready)continue;
      const rx=p.index!==undefined?32:Math.min(p.radius||40,43),y=p.index!==undefined?p.y:p.y+17;
      c.save();c.strokeStyle=view.ready?'#e4ebaf':'#99947a';c.lineWidth=2*unit;
      if(view.ready){
        c.beginPath();for(const side of [-1,1]){c.moveTo(p.x+side*(rx-9),y+7);c.lineTo(p.x+side*rx,y+7);c.lineTo(p.x+side*rx,y-1);}c.stroke();
      }
      c.translate(p.x+rx-3,y-20);c.scale(unit,unit);c.fillStyle=view.ready?'#334b30':'#373c32';c.strokeStyle=view.ready?'#d6dfa0':'#99947a';
      c.beginPath();c.arc(0,0,13,0,Math.PI*2);c.fill();c.stroke();
      const art=w.art?.props?.[view.icon];c.globalAlpha=view.ready?1:.45;if(art?.complete)c.drawImage(art,-9,-9,18,18);else if(HILL_ART.boxes[view.icon]&&w.hillArt?.complete)c.drawImage(w.hillArt,...HILL_ART.boxes[view.icon],-9,-9,18,18);c.globalAlpha=1;
      if(!view.ready){c.strokeStyle='#d1c5a6';c.beginPath();if(view.remaining===0){c.moveTo(-5,0);c.lineTo(-1,4);c.lineTo(6,-4);}else{c.moveTo(-5,4);c.lineTo(5,4);}c.stroke();}
      if(view.ready){c.fillStyle='#f4edbe';c.fillRect(-20,-6,3,3);c.fillRect(-19,-7,1,5);}c.restore();
    }
    if(active){
      c.save();c.strokeStyle=view.kind==='travel'||view.kind==='door'?'#f3ce83':view.kind==='resource'?'#e4ebaf':'#f2d294';c.lineWidth=2*unit;
      c.beginPath();c.ellipse(q.x,q.y+4,23,9,0,0,Math.PI*2);c.stroke();c.restore();
    }
  }
  // One nearby/hovered label, never a map full of resource counters.
  if(hover&&hover.id!==near?.id&&hover.id!=='lucy'&&interactionView(hover,s).kind!=='travel'){
    const v=interactionView(hover,s),text=`${v.category} · ${v.title}`,q=focus.stand||focus;
    c.save();c.font=`600 ${13*unit}px "PingFang SC",sans-serif`;c.textAlign='center';
    const width=c.measureText(text).width+20*unit;
    const left=Math.max(8,(8-w.ox)/(w.scale||1)),right=Math.min(1664,(w.vw-8-w.ox)/(w.scale||1));
    const x=Math.max(left+width/2,Math.min(right-width/2,focus.x));
    const y=Math.max(28*unit,(v.kind==='travel'?q.y-25:focus.y-(focus.radius||30)-12));
    c.fillStyle=v.kind==='travel'||v.kind==='door'?'#533b29f2':'#203a2bf2';c.fillRect(x-width/2,y-17*unit,width,27*unit);c.fillStyle='#fff0cb';c.fillText(text,x,y+2*unit);c.restore();
  }
}

export function markerHit(p,s,x,y,scale=1){
 const v=interactionView(p,s),u=Math.max(1,Math.min(1.65,1/scale)),q=p.stand||p;
 if(p.id==='lucy'&&!s.life?.room&&s.expansion?.region==='farm'){
  const a=SHOP_ENTRY.plaque,z=SHOP_ENTRY.zone;
  return x>=a.x+a.w/2-a.w*u/2&&x<=a.x+a.w/2+a.w*u/2&&y>=a.y+a.h/2-a.h*u/2&&y<=a.y+a.h/2+a.h*u/2||
    x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.h;
 }
 if(v.kind==='travel'){const label=travelLabel(p,v,u);return Math.abs(x-label.x)<=label.width/2&&Math.abs(y-label.y)<=label.height/2;}
 if(v.kind==='resource'&&v.icon&&(p.index===undefined||v.ready)){
  const rx=p.index!==undefined?32:Math.min(p.radius||40,43),py=p.index!==undefined?p.y:p.y+17;
  return Math.hypot(x-(p.x+rx-3),y-(py-20))<14*u;
 }
 return false;
}
