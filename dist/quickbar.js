// A quick slot points to the real inventory; arranging it never transfers items.
export const TOOLS = {
  rod:{name:'旧鱼竿',tip:'渡口栈桥按 E，或持竿点击左侧水面'},
  hand:{name:'空手',tip:'点击成熟作物收获，或与人物、建筑交互'},
  water:{name:'浇水壶',tip:'点击已播种的田地浇水 · 每格体力 2'},
  lantern:{name:'提灯',tip:'按 L 开关灯 · 入夜后照见亡者'},
};
export const DEFAULT_QUICKBAR = ['hand','water','wheatSeed','pumpkinSeed','lantern','wheat','pumpkin','honey','flour','pie'];
const ITEM_KEYS = ['tomatoSeed','mintSeed','tomato','mint','tomatoSoup','mintTea','applePastry','apple','jam','silver','carp','bass','eel','fishSoup','herb','resin','driedHerb','tea','wheatSeed','pumpkinSeed','wheat','pumpkin','wood','stone','honey','flour','pie'];
export function validQuickItem(key){return Object.hasOwn(TOOLS,key)||ITEM_KEYS.includes(key);}
export function normalizeQuickbar(value){
  return Array.isArray(value)&&value.length===10&&value.every(validQuickItem)&&new Set(value).size===10 ? [...value] : [...DEFAULT_QUICKBAR];
}
export function assignQuickItem(slots,item,index){
  const next=normalizeQuickbar(slots);
  if(!validQuickItem(item)||!Number.isInteger(index)||index<0||index>=10)return next;
  const old=next.indexOf(item);
  if(old>=0)next[old]=next[index];
  next[index]=item;
  return next;
}
