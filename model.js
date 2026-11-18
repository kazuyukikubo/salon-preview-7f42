/* Shared exclusively by the browser demonstration. All records are fictional. */
'use strict';
window.Roof = (() => {
  const key = 'the-roof-browser-demo-v1';
  const rooms = [
    {id:'terrace', en:'Terrace VIP', name:'テラスVIP', min:4,max:6,img:'terrace', desc:'植栽と炎を囲む、空の下のプライベートシート。'},
    {id:'suite', en:'VIP Suite', name:'VIP個室', min:4,max:8,img:'vip', desc:'柔らかな灯りと深いソファで過ごす、静かな個室。'},
    {id:'counter', en:'Bar Counter', name:'バーカウンター', min:2,max:4,img:'counter', desc:'バーテンダーの手元を眺めながら、ゆっくりと一杯。'},
    {id:'private', en:'Private Room', name:'貸切個室', min:8,max:12,img:'vip', desc:'会食や小さな集いのための、ゆとりある貸切空間。'},
    {id:'mama', en:"Mama’s Table", name:'ママズテーブル', min:2,max:6,img:'hero', desc:'パートナーが大切なゲストを迎えるための専用予約枠。'}
  ];
  const periods=[
    {id:'dinner',en:'Dining',name:'ダイニング',hours:'17:30 – 21:00',times:['17:30','18:00','18:30','19:00','19:30','20:00','20:30']},
    {id:'social',en:'Social Lounge',name:'ソーシャルラウンジ',hours:'21:00 – 25:00',times:['21:00','21:30','22:00','22:30','23:00','23:30','24:00','24:30']},
    {id:'after',en:'After Lounge',name:'アフターラウンジ',hours:'25:00 –',times:['25:00','25:30','26:00','26:30']}
  ];
  const routes=['クラブのママ','既存会員','ビル入居クラブ','特別招待'];
  const iso=(d=new Date())=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
  function shift(value,days){let d=new Date(value+'T12:00:00+09:00');d.setUTCDate(d.getUTCDate()+days);return iso(d)}
  const now=()=>iso();
  function visitTime(day,time){const [h,m]=time.split(':').map(Number);return Date.parse(day+'T00:00:00+09:00')+(h*60+m)*60000}
  function nextWorking(day,closures=[]){let d=day;do{d=shift(d,1)}while([0,6].includes(new Date(d+'T12:00:00+09:00').getUTCDay())||closures.includes(d)||['12-31','01-01','01-02','01-03'].includes(d.slice(5)));return d}
  function seed(){
    const day=now(), prior=shift(day,-3);
    return {v:1,member:{alias:'サロン会員',preference:'おまかせ',enrolled:true},partners:[
      {id:'P-014',alias:'パートナー A',club:'クラブ A',kyc:true,bank:true,contract:shift(day,-65),invoice:true,tax:'なし',active:true},
      {id:'P-028',alias:'パートナー B',club:'クラブ B',kyc:true,bank:true,contract:shift(day,-40),invoice:false,tax:'なし',active:true}
    ],bookings:[
      {id:'R-1024',date:shift(day,3),time:'18:30',room:'terrace',people:4,source:'LINE',ref:'P-014',route:routes[0],guest:'M-0248',status:'予約済'},
      {id:'R-1019',date:day,time:'21:00',room:'suite',people:6,source:'電話',ref:'P-014',route:routes[0],guest:'G-1002',status:'来店済'},
      {id:'R-1012',date:prior,time:'22:00',room:'suite',people:4,source:'台帳',ref:'P-014',route:routes[0],guest:'M-0248',status:'精算済'}
    ],bills:[{id:'T-5001',booking:'R-1012',parts:[28000,44000,30000,8000],discount:0,refund:0,adjustments:[],status:'支払済',date:prior,due:nextWorking(prior),shares:[['P-014',1]],mode:'内包',withheld:false,gross:false,round:'切捨て',paid:11000}],
    invites:[], events:[], messages:[], alerts:[], benefits:[], bottles:[{id:'B-01',name:'シングルモルト',left:4}],contacts:[],closures:[],offsets:{},seq:1200};
  }
  function read(){try{const s=JSON.parse(localStorage.getItem(key));if(s?.v===1&&Array.isArray(s.bookings))return s}catch{ /* Storage may be disabled in private browsing. */ }return null}
  let s=read()||seed();
  const refresh=()=>{const current=read();if(current)s=current};
  const save=()=>{try{localStorage.setItem(key,JSON.stringify(s));return true}catch{return false}};
  const id=(prefix)=>prefix+'-'+(++s.seq);
  const reset=()=>{s=seed();save();return s};
  const room=(id)=>rooms.find(r=>r.id===id)||rooms[0];
  const partner=(id)=>s.partners.find(p=>p.id===id);
  const booking=(id)=>s.bookings.find(b=>b.id===id);
  const shares=b=>b.second&&b.duplicate==='同時・折半'?[[b.ref,.5],[b.second,.5]]:[[b.ref,1]];
  function capacity(r,n){return Number.isInteger(Number(n))&&Number(n)>=r.min&&Number(n)<=r.max}
  function available(date,time,r,except){return !s.bookings.some(b=>b.id!==except&&b.date===date&&b.time===time&&b.room===r&&b.status!=='取消済')}
  function amounts(bill,share=1){
    const base=Math.max(0,bill.parts.reduce((a,b)=>a+b,0)-bill.discount-(bill.refund||0));
    const round=bill.round==='四捨五入'?Math.round:Math.floor;
    const entitlement=round(base*.10*share);
    const commission=bill.withheld&&bill.gross?Math.ceil(entitlement/(1-.1021)):entitlement;
    const vat=bill.mode==='別加算'?round(commission*.1):0;
    const tax=bill.withheld?Math.floor(commission*.1021):0;
    return {base,entitlement,commission,vat,tax,net:Math.max(0,commission+vat-tax)};
  }
  function forPartner(bill,pid){
    const share=bill.shares.find(([id])=>id===pid)?.[1]||0;
    return share?amounts({...bill,mode:bill.mode==='登録別'?((bill.invoiceAtSale?.[pid]??partner(pid)?.invoice)?'別加算':'内包'):bill.mode},share):null;
  }
  function payout(bill){return bill.shares.reduce((n,[pid])=>n+(forPartner(bill,pid)?.net||0),0)}
  function validateBooking(b,except){
    if(!periods.some(p=>p.times.includes(b.time))||!b.date||!Number.isFinite(visitTime(b.date,b.time))||visitTime(b.date,b.time)<Date.now())return '未来の営業日と時間を選択してください。';
    if(!capacity(room(b.room),b.people))return '選択したお席の定員に合わせてください。';
    if(!partner(b.ref)?.active)return '登録済みの紹介者を選んでください。';
    if(!available(b.date,b.time,b.room,except))return 'この時間のお席は予約済みです。別の時間を選んでください。';
    if(b.ref===b.second)return '重複紹介は異なる紹介者をお選びください。';
    return '';
  }
  return {get s(){return s},rooms,periods,routes,now,shift,nextWorking,visitTime,room,partner,booking,capacity,available,shares,amounts,forPartner,payout,validateBooking,refresh,save,reset,id};
})();
