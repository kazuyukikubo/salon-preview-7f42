'use strict';

window.createRoofTalk = function ({R,monogram,ico,btn,link,safe,modal,row,empty,richLinks,persist,render,toast,dateLabel,getPerson,getChatLog}) {
// The public demo signs in as the same fictional host as the partner portal.
let talkMenuOpen = false;
let talkChoosingAgain = false;
let talkPeople = 2;
let talkSlotIndex = 0;
let talkSheetOffers = [];
let talkQuickOffers = new Map();
let talkSaving = false;
const talkStamp = at => new Intl.DateTimeFormat('ja-JP', {hour:'2-digit', minute:'2-digit', timeZone:'Asia/Tokyo', hourCycle:'h23'}).format(at);
const talkAvatar = () => '<span class="talk-avatar" aria-hidden="true">'+monogram+'</span>';

function talkSlotLabel(offer) {
  const at = new Date(R.visitTime(offer.date,offer.time));
  const day = new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(at);
  const date = day === R.now() ? '今日' : day === R.shift(R.now(),1) ? '明日' : dateLabel(day);
  return date+' '+talkStamp(at);
}

// Use the previous operating date for times such as 25:30, which fall after midnight.
function talkOffers(people,limit=1) {
  if (!R.partner(getPerson())?.active) return [];
  const roomIds = ['mama','counter','suite','terrace','private'].filter(id=>R.capacity(R.room(id),people));
  const offers=[];
  const now=Date.now();
  for (const offset of [-1,0,1]) {
    const date=R.shift(R.now(),offset);
    for (const period of R.periods) {
      for (const time of period.times) {
        if (R.visitTime(date,time)<now) continue;
        const room=roomIds.find(id=>R.available(date,time,id));
        if (!room) continue;
        offers.push({date,time,room,people});
        if (offers.length===limit) return offers;
      }
    }
  }
  return offers;
}
function talkTickets() { return R.s.bookings.filter(b=>b.quickTalk&&b.ref===getPerson()); }
function currentTalkTicket() {
  return talkTickets().find(b=>b.status==='予約済' && R.visitTime(b.date,b.time)+3600000>Date.now());
}
function resetTalk() { talkMenuOpen=false; talkChoosingAgain=false; talkPeople=2; talkSlotIndex=0; }
function talkIntro() {
  return '<div class="talk-in">'+talkAvatar()+'<div class="talk-entry"><span class="talk-author">THE ROOF 北新地</span><article class="talk-guide">'+
    '<div class="talk-photo"><img src="./media/hero.webp" alt="北新地のテラスラウンジ"><div><small>PRIVATE MEMBERS’ SALON</small><b>The Roof<span>.</span></b><em>KITASHINCHI</em></div></div>'+
    '<div class="talk-guide-text"><h2>今夜のお席、こちらから。</h2><p>画面下の人数をタップすると、表示時刻のお席がその場で確定します。</p></div>'+
    link('spaces',ico('armchair',17)+' お席・営業時間を見る '+ico('chevron-right',14),'talk-guide-link')+'</article></div></div>';
}
function talkReceipt(b) {
  const canceled=b.status==='取消済';
  return '<div class="talk-sent"><span>既読<br>'+talkStamp(b.quickTalk.at)+'</span><p>'+safe(talkSlotLabel(b))+'・'+b.people+'名で予約</p></div>'+
    '<div class="talk-in">'+talkAvatar()+'<div class="talk-entry"><span class="talk-author">THE ROOF 北新地</span><div class="talk-ticket" role="status"><span class="ticket-state">'+ico(canceled?'rotate-ccw':'circle-check',17)+' '+safe(b.status)+'</span><h2>'+(canceled?'予約を取り消しました':'お席を確保しました')+'</h2><strong>'+safe(talkSlotLabel(b))+' ／ '+b.people+'名</strong><p>'+safe(R.room(b.room).name)+' · '+safe(b.id)+'</p>'+
    (b.status==='予約済'?btn('cancel-ask','この予約を取り消す','talk-cancel','data-id="'+safe(b.id)+'"'):'')+'</div></div></div>';
}
function talkToken(item) {
  return '<div class="talk-sent"><span>既読<br>'+talkStamp(item.at)+'</span><p>'+safe(item.label)+'</p></div><div class="talk-in">'+talkAvatar()+'<div class="talk-msg">'+link('access?id='+encodeURIComponent(item.id),safe(item.label)+'を開く '+ico('chevron-right',14))+'<small>発行から5分間有効</small></div></div>';
}
function talkRichMenu() {
  return '<div class="talk-rich">'+btn('talk-history',ico('calendar-check')+'予約履歴')+
    richLinks.filter(x=>x[0]!=='book').map(([id,ic,label])=>btn('issue-token',ico(ic)+label,'','data-id="'+id+'"')).join('')+
    btn('issue-token',ico('calendar-plus')+'日時を指定して予約','','data-id="book"')+
    link('partner',ico('handshake')+'紹介パートナー')+
    link('desk',ico('store')+'店舗運営')+link('salon',ico('house')+'サロンホーム')+'</div>';
}
function talkDock() {
  const active=currentTalkTicket();
  if (talkMenuOpen) return talkRichMenu();
  if (active&&!talkChoosingAgain) return '<div class="talk-done"><span>'+ico('circle-check',20)+' 予約が確定しています</span>'+btn('talk-again','別の予約を作る '+ico('chevron-right',14))+'</div>';
  talkQuickOffers=new Map([2,3,4].map(n=>[n,talkOffers(n)[0]]));
  return '<div class="talk-quick"><div class="talk-quick-title"><h2>'+ico('calendar-check',20)+' 最短で予約</h2>'+btn('talk-options','人数・時間を選ぶ '+ico('chevron-right',13))+'</div><div class="talk-counts">'+[2,3,4].map(n=>{
    const offer=talkQuickOffers.get(n);
    return btn('talk-book','<strong>'+n+'<i>名</i></strong><small>'+(offer?safe(talkSlotLabel(offer)):'空席なし')+'</small>',n===2?'prime':'','data-id="'+n+'" '+(offer?'aria-label="'+n+'名 '+safe(talkSlotLabel(offer))+'で予約"':'disabled'));
  }).join('')+'</div></div>';
}
function talkPage() {
  const history=[...talkTickets().map(b=>({at:b.quickTalk.at,html:()=>talkReceipt(b)})),...getChatLog().map(item=>({at:item.at,html:()=>talkToken(item)}))].sort((a,b)=>a.at-b.at);
  return '<div class="talk-window"><aside class="talk-sidebar"><div class="talk-side-head"><span class="talk-line-logo">LINE</span><strong>トーク</strong></div><div class="talk-side-selected">'+talkAvatar()+'<div><strong>THE ROOF 北新地</strong><small>公式アカウント</small></div></div><div class="talk-side-bottom">ブラウザ体験版</div></aside>'+
    '<div class="talk-room"><header class="talk-header">'+talkAvatar()+'<div class="talk-name"><div><h1>THE ROOF 北新地</h1>'+ico('badge-check',17)+'</div><small>公式アカウント <span>・</span> 体験版</small></div>'+btn('talk-menu',ico('menu',23),'talk-head-menu','aria-label="トークメニュー" aria-expanded="'+talkMenuOpen+'"')+'</header>'+
    '<section class="talk-scroll" aria-label="トーク履歴"><div class="talk-stream"><div class="talk-date">'+safe(dateLabel(R.now()))+'</div>'+talkIntro()+history.map(x=>x.html()).join('')+'</div></section>'+
    '<div class="talk-dock">'+talkDock()+btn('talk-menu',ico(talkMenuOpen?'chevron-down':'menu',16)+(talkMenuOpen?'クイック予約に戻る':'メニュー'),'talk-menu-toggle','aria-expanded="'+talkMenuOpen+'"')+'</div></div></div>';
}
function positionTalk() {
  const stream=document.querySelector('.talk-scroll');
  if (stream && (talkTickets().length||getChatLog().length)) stream.scrollTop=stream.scrollHeight;
}
function talkOptions() {
  talkSheetOffers=talkOffers(talkPeople,8);
  talkSlotIndex=Math.min(talkSlotIndex,Math.max(0,talkSheetOffers.length-1));
  const sizes=[2,3,4,5,6,7,8,9,10,11,12];
  const pick=(action,id,label,selected)=>btn(action,safe(label),selected?'chosen':'','data-id="'+id+'" aria-pressed="'+selected+'"');
  const offer=talkSheetOffers[talkSlotIndex];
  modal('QUICK RESERVATION','人数・時間を選ぶ','<div class="talk-options"><h3>人数</h3><div class="talk-picks">'+sizes.map(n=>pick('talk-size',n,n+'名',n===talkPeople)).join('')+'</div><h3>空いている時間</h3><div class="talk-picks">'+talkSheetOffers.map((o,i)=>pick('talk-time',i,talkSlotLabel(o),i===talkSlotIndex)).join('')+'</div>'+
    (offer?btn('talk-submit',safe(talkSlotLabel(offer))+'・'+talkPeople+'名で予約する','talk-submit'):'<p>この人数の空席は見つかりませんでした。</p>')+link('book','別の日を指定して予約 '+ico('chevron-right',14),'talk-guide-link')+'</div>');
}
async function reserveTalk(offer) {
  if (!offer||talkSaving) return;
  talkSaving=true;
  const commit=()=>{
    R.refresh();
    if (currentTalkTicket()&&!talkChoosingAgain) {render();return}
    const data={...offer,source:'LINE',ref:getPerson(),guest:'G-DEMO',route:R.routes[0]};
    const error=R.validateBooking(data);
    if(error){render();toast('空席情報が変わりました。表示時刻をご確認ください。');return}
    R.s.bookings.unshift({...data,id:R.id('R'),status:'予約済',quickTalk:{at:Date.now()}});
    talkChoosingAgain=false;talkMenuOpen=false;persist('予約を確定しました');render();
  };
  try {
    if(navigator.locks) await navigator.locks.request('roof-demo-talk-booking',commit);
    else commit();
  } finally {talkSaving=false}
}
function talkAction(action,id) {
  switch(action) {
    case 'talk-menu':talkMenuOpen=!talkMenuOpen;render();break;
    case 'talk-book':void reserveTalk(talkQuickOffers.get(Number(id)));break;
    case 'talk-options':talkPeople=2;talkSlotIndex=0;talkOptions();break;
    case 'talk-size':talkPeople=Number(id);talkSlotIndex=0;talkOptions();break;
    case 'talk-time':talkSlotIndex=Number(id);talkOptions();break;
    case 'talk-submit':void reserveTalk(talkSheetOffers[talkSlotIndex]);break;
    case 'talk-again':talkChoosingAgain=true;render();break;
    case 'talk-history':modal('RESERVATIONS','LINE予約履歴',talkTickets().map(b=>row('calendar-check',safe(talkSlotLabel(b))+' ／ '+b.people+'名',safe(b.id)+' · '+safe(b.status),btn('details','詳細','outline','data-id="'+safe(b.id)+'"'))).join('')||empty('このトークからの予約はまだありません。'));break;
  }
}

return {page:talkPage,position:positionTalk,action:talkAction,reset:resetTalk,closeMenu(){talkMenuOpen=false}};
};
