'use strict';
const R=window.Roof, $=q=>document.querySelector(q), main=$('#main'), dlg=$('#sheet');
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const yen=n=>'¥'+Math.round(n).toLocaleString('ja-JP');
const dateLabel=d=>new Intl.DateTimeFormat('ja-JP',{month:'long',day:'numeric',weekday:'short',timeZone:'Asia/Tokyo'}).format(new Date(d+'T12:00:00+09:00'));
const ico=(n,s=19)=>`<svg class="ico" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="./media/icons.svg#${n}"/></svg>`;
const monogram=`<svg class="crest" width="37" height="37" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true"><path d="m3 25 21-13 21 13M8 28l16-10 16 10M14 31l10-6 10 6M5 36h38"/></svg>`;
const brand=`${monogram}<span class="wordmark">THE ROOF<small>KITASHINCHI</small></span>`;
const link=(route,label,cls='')=>`<a href="#${route}" class="${cls}">${label}</a>`;
const btn=(act,label,cls='',data='')=>`<button type="button" data-action="${act}" ${data} class="${cls}">${label}</button>`;
const arrow=()=>ico('arrow-right',17);
const pill=s=>`<span class="pill">${safe(s)}</span>`;
const opt=(val,label,selected)=>`<option value="${safe(val)}" ${String(selected)===String(val)?'selected':''}>${safe(label)}</option>`;
const field=(label,input)=>`<label class="field"><span>${label}</span>${input}</label>`;
const sel=(name,opts,selected,extra='')=>`<select name="${name}" ${extra}>${opts.map(o=>Array.isArray(o)?opt(o[0],o[1],selected):opt(o,o,selected)).join('')}</select>`;
const grid=(items)=>`<div class="form-grid">${items.join('')}</div>`;
const kv=(pairs)=>`<dl class="facts">${pairs.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
const empty=(s)=>`<p class="empty">${s}</p>`;
const section=(en,ja,aside='')=>`<div class="section-head"><div><div class="overline">${en}</div><h2>${ja}</h2></div>${aside}</div>`;
const submit=(label)=>`<button class="primary" type="submit">${label} ${arrow()}</button>`;
const page=(en,ja,body,intro='')=>`<div class="container inner"><div class="page-heading"><p class="overline">${en}</p><h1>${ja}</h1>${intro?`<p>${intro}</p>`:''}</div>${body}</div>`;
const form=(id,inner)=>`<form data-form="${id}">${inner}<p class="error" data-error role="alert"></p></form>`;
const activeMember='M-0248';
let afterRender=null;
let statementDate=R.now();
let person='P-014',slide=0,bookDraft=null,deskTab='reservations',partnerTab='overview',statementPeriod='month',listScope='coming',toastTimer,chatLog=[],previousFocus;
const isDesk=r=>r==='desk'||r==='master'||r==='metrics',isPartner=r=>r==='partner';
const route=()=>location.hash.slice(1).split('?')[0]||'line';
const navTo=r=>{if(dlg.open)dlg.close();if(route()===r)render();else location.hash=r;};
const toast=t=>{const e=$('#toast');e.textContent=t;e.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('visible'),3000)};
function persist(message){const worked=R.save();if(message)toast(worked?message:message+'（このタブ内のみ）')}
function modal(en,title,body){if(!dlg.open)previousFocus=document.activeElement;$('#sheet-body').innerHTML=`<p class="overline">${en}</p><h2 id="modal-title">${title}</h2>${body}`;dlg.setAttribute('aria-labelledby','modal-title');if(!dlg.open)dlg.showModal();dlg.scrollTop=0;dlg.querySelector('.dialog-box').scrollTop=0;}
function row(icon,title,sub,action,klass=''){return `<div class="line-row ${klass}"><span class="row-icon">${ico(icon,22)}</span><div class="row-text"><strong>${title}</strong><small>${sub}</small></div>${action}</div>`}
function tabs(key,items,current){return `<div class="tabs" aria-label="表示切替">${items.map(([id,l])=>btn(key,l,id===current?'selected':'',`data-id="${id}" aria-pressed="${id===current}"`)).join('')}</div>`}
function head(){
 const r=route(),role=isDesk(r)?'店舗運営':isPartner(r)?'パートナー':'会員';
 const nav=[['line','公式LINE'],['salon','サロン'],['bookings','ご予約'],['card','会員証'],['contact','コンシェルジュ']];
 $('#mast').innerHTML=`<div class="mast-inner"><a class="brand" href="#line" aria-label="THE ROOF ホーム">${brand}</a><nav class="desktop-nav" aria-label="メインメニュー">${nav.map(([id,l])=>link(id,l,(r===id||id==='bookings'&&r==='book')?'active':'')).join('')}</nav><div class="head-acts">${btn('roles',ico('layers',16)+` <span>${role}ビュー</span> `+ico('chevron-down',13),'role-switch')}${btn('menu',ico('menu',22),'icon-btn', 'aria-label="全メニューを開く"')}</div></div>`;
 $('#mobile').innerHTML=[['line','message-circle','公式LINE'],['bookings','calendar-days','予約'],['card','qr-code','会員証'],['mypage','user-round','マイページ']].map(([id,i,l])=>link(id,ico(i)+`<span>${l}</span>`,(r===id||id==='bookings'&&r==='book')?'on':'')).join('')+btn('menu',ico('menu')+'<span>メニュー</span>');
 $('#foot').innerHTML=`<div class="footerinner"><a href="#line" class="footbrand">THE ROOF <small>KITASHINCHI</small></a><span>体験版 ｜ 架空データ・端末内保存</span>${btn('roles','体験する役割を変更 '+ico('chevron-right',14),'footlink')}</div>`;
}
const heroScenes=[{pic:'hero',en:'Terrace Lounge',caption:'テラスラウンジ'},{pic:'vip',en:'Private Suite',caption:'プライベートスイート'},{pic:'counter',en:'The Counter',caption:'バーカウンター'}];
function hero(){const sc=heroScenes[slide];return `<section class="hero"><img class="hero-photo" src="./media/${sc.pic}.webp" alt="${sc.caption}の空間イメージ"><div class="shade"></div><div class="hero-body"><div class="hero-loc">${ico('map-pin',14)} OSAKA &nbsp;/&nbsp; KITASHINCHI</div><div class="hero-copy"><span class="gold-rule"></span><p class="hero-kicker">PRIVATE MEMBERS’ SALON</p><h1>The Roof<span class="hero-dot">.</span></h1><p class="hero-ja">北新地、最上階のプライベートサロン。</p>${btn('reserve',ico('calendar-days',17)+' お席を予約する '+arrow(),'ivory')}</div><div class="hero-bottom"><span>${sc.en}</span><div class="slider"><span>0${slide+1} / 03</span>${btn('slideback',ico('chevron-left',15),'', 'aria-label="前の空間"')}${btn('slidenext',ico('chevron-right',15),'','aria-label="次の空間"')}</div></div></div></section>`}
function passPanel(){return `<aside class="pass-panel"><div class="pass-top"><span class="overline">MEMBERSHIP</span>${ico('credit-card',20)}</div><div class="pass-card"><div>${monogram}<b>THE ROOF</b><small>KITASHINCHI</small></div><div class="card-line"></div><span>MEMBER <i>№</i> 0248</span></div><div class="pass-label"><div><small>MEMBER SERVICES</small><h2>${safe(R.s.member.alias)} 様</h2></div>${btn('card',ico('qr-code',23),'square', 'aria-label="会員証のQRを表示"')}</div>${link('card','会員証を表示 '+arrow(),'panel-link')}</aside>`}
function quick(id,icon,ja,en){return link(id,`<span class="quick-ic">${ico(icon,22)}</span><div><strong>${ja}</strong><small>${en}</small></div>${ico('chevron-right',16)}`,'quick')}
function roomsSection(){return `<section class="rooms-section">${section('THE SPACES','サロンのお席',link('spaces','すべてのお席 '+arrow(),'text-link'))}<div class="room-grid">${R.rooms.slice(0,3).map(roomTile).join('')}</div></section>`}
function roomTile(r){return `<button class="room-tile" data-action="room" data-id="${r.id}"><div class="room-photo"><img loading="lazy" src="./media/${r.img}.webp" alt="${r.name}の空間イメージ"><span>${ico('users',13)} ${r.min}–${r.max} 名</span></div><div class="room-foot"><div><strong>${r.en}</strong><small>${r.name}</small></div>${ico('arrow-up-right',19)}</div></button>`}
function home(){return `<div class="container home"><div class="intro-line"><div class="overline"><span class="tinyline"></span> MEMBERS’ LOUNGE</div><span class="today">${dateLabel(R.now())}</span></div><div class="hero-grid">${hero()}${passPanel()}</div><div class="quick-grid">${quick('bookings','calendar-check','予約を確認','MY RESERVATIONS')}${quick('invite','ticket','ゲストを招待','GUEST INVITATION')}${quick('contact','message-circle','コンシェルジュ','CONCIERGE')}</div>${roomsSection()}<div class="lower-grid"><section>${section('AT THE SALON','サロンの楽しみ')}${row('wine','サロンイベント','ワイン会・テイスティング',link('events','イベントを見る '+arrow(),'text-link'))}${row('glass-water','ボトルキープ','お預かりしているボトル',link('bottles','ボトルを見る '+arrow(),'text-link'))}</section><section>${section('DEMO ACCESS','体験ビュー')}${row('handshake','紹介パートナー','ご紹介・実績・支払明細',link('partner','開く '+arrow(),'text-link'))}${row('store','店舗運営','予約台帳・会計・支払承認',link('desk','開く '+arrow(),'text-link'))}</section></div></div>`}
function roleMenu(){modal('EXPERIENCE','体験する役割',`<p class="muted">同じ架空の予約を、役割ごとの画面で確認できます。</p>${[['salon','user-round','会員','お席の予約・会員証・招待'],['partner','handshake','紹介パートナー','顧客のご紹介・日次明細・支払実績'],['desk','store','店舗運営','予約受付・売上確定・報酬計算・承認']].map(([id,i,t,s])=>link(id,row(i,t,s,arrow()),'role-row')).join('')}`)}
function menu(){modal('SALON DIRECTORY','メニュー',`<div class="menu-list">${[['line','公式LINEトーク'],['salon','サロンホーム'],['spaces','空間・営業時間'],['book','新しい予約'],['bookings','予約一覧'],['card','デジタル会員証'],['mypage','マイページ'],['invite','紹介・入会体験'],['events','イベント'],['bottles','ボトルキープ'],['contact','コンシェルジュ'],['line','LINEメニュー体験'],['partner','紹介パートナー'],['desk','店舗運営']].map(([id,l])=>link(id,l+ico('chevron-right',15))).join('')}</div>${btn('reset','体験データを初期化','quiet')}`)}
function spaces(){return page('THE SPACES','空間と営業時間',`<div class="periods">${R.periods.map(p=>`<article><small>${p.hours}</small><h3>${p.en}</h3><p>${p.name}</p></article>`).join('')}</div><div class="room-grid all-rooms">${R.rooms.map(roomTile).join('')}</div>`)}
function roomInfo(id){const r=R.room(id);modal('THE SPACES',r.en,`<img class="dialog-img" src="./media/${r.img}.webp" alt="${r.name}の空間イメージ"><h3>${r.name}</h3><p>${r.desc}</p>${kv([['ご利用人数',`${r.min}〜${r.max}名`],['予約枠',r.id==='mama'?'紹介パートナー専用':'会員・ご紹介ゲスト']])}${btn('start-room','このお席を予約 '+arrow(),'primary',`data-id="${id}"`)}`)}

function startBook(id='terrace',context='member',existing=null){
 const r=R.room(id);bookDraft=existing?{...existing,context,editing:existing.id,step:1}:{room:r.id,date:R.shift(R.now(),1),people:r.min,period:'dinner',time:'18:00',ref:context==='partner'?person:'P-014',source:context==='staff'?'電話':'LINE',route:R.routes[0],guest:context==='member'?activeMember:'G-DEMO',context,step:1};
 if(existing)bookDraft.period=R.periods.find(p=>p.times.includes(existing.time))?.id||'dinner';navTo('book');
}
function bookingPage(){
 if(!bookDraft){bookDraft={room:'terrace',date:R.shift(R.now(),1),people:4,period:'dinner',time:'18:00',ref:'P-014',source:'LINE',route:R.routes[0],guest:activeMember,context:'member',step:1};}
 const d=bookDraft,r=R.room(d.room),p=R.periods.find(i=>i.id===d.period)||R.periods[0];
 const progress=`<div class="progress"><span class="${d.step===1?'current':''}">1 日時・お席</span><i></i><span class="${d.step===2?'current':''}">2 内容確認</span><i></i><span>3 受付完了</span></div>`;
 const detail=kv([['営業日',dateLabel(d.date)],['開始時刻',safe(d.time)],['お席',r.name],['ご人数',`${Number(d.people)} 名`],['ご紹介',safe(R.partner(d.ref)?.alias||d.ref)]]);
 let content=d.step===2?`<h2>予約内容の確認</h2>${detail}${kv([['受付経路',safe(d.source)],['ご紹介経路',safe(d.route)]])}<div class="action-group">${btn('book-back','戻って変更','outline')}${btn('book-confirm',d.editing?'変更を確定':'デモ予約を確定','primary')}</div>`:form('booking',`<h2>日時とお席を選択</h2>${grid([
 field('ご利用の営業日',`<input type="date" name="date" value="${safe(d.date)}" min="${R.shift(R.now(),-1)}" required>`),
 field('時間帯',sel('period',R.periods.map(x=>[x.id,x.name+' '+x.hours]),p.id,'data-refresh="booking"')),
 field('お席',sel('room',R.rooms.filter(x=>x.id!=='mama'||d.context!=='member').map(x=>[x.id,x.name]),d.room,'data-refresh="booking"')),
 field('ご人数',sel('people',Array.from({length:r.max-r.min+1},(_,i)=>[String(r.min+i),(r.min+i)+' 名']),d.people)),
 field('開始時刻',sel('time',p.times,d.time)),field('紹介者ID',sel('ref',R.s.partners.filter(x=>x.active).map(x=>[x.id,x.id+' ｜ '+x.alias]),d.ref))
 ])}<p class="help">24時以降は選択した営業日の翌日です。</p>${d.context==='staff'?grid([field('受付経路',sel('source',['電話','台帳','LINE'],d.source)),field('紹介経路',sel('route',R.routes,d.route)),field('追加の紹介者',sel('second',[['','なし'],...R.s.partners.filter(x=>x.active).map(x=>[x.id,x.alias])],d.second)),field('重複時の扱い',sel('duplicate',['先着優先','同時・折半'],d.duplicate))]):''}${submit('予約内容を確認')}`);
 return page('RESERVATIONS',d.editing?'ご予約の変更':'お席のご予約',`${progress}<div class="booking-layout"><section class="surface">${content}</section><aside class="room-summary"><img src="./media/${r.img}.webp" alt="${r.name}"><div><p class="overline">SELECTED SPACE</p><h2>${r.en}</h2><p>${r.name} · ${r.min}–${r.max}名</p><p>${r.desc}</p></div></aside></div>`)}
function formData(f){return Object.fromEntries(new FormData(f))}
function collectBooking(f){const input=formData(f),d=bookDraft;const changed=d.room!==input.room;Object.assign(d,input);const r=R.room(d.room);if(changed&&!R.capacity(r,d.people))d.people=r.min;const p=R.periods.find(x=>x.id===d.period);if(p&&!p.times.includes(d.time))d.time=p.times[0];d.people=Number(d.people)}
function confirmBook(){
 const d=bookDraft;if(!d||d.step!==2)return;
 const error=R.validateBooking(d,d.editing);if(error){d.step=1;render();toast(error);return}
 const {context,editing}=d;const values=Object.fromEntries(Object.entries(d).filter(([key])=>!['context','editing','step','period'].includes(key)));const original=editing?R.booking(editing):null;
 if(editing&&original?.status!=='予約済'){toast('この予約は変更できません。');return}
 const b=original||{id:R.id('R'),status:'予約済'};Object.assign(b,values);if(!original)R.s.bookings.unshift(b);bookDraft=null;persist();
 afterRender=()=>modal('RESERVATION COMPLETE',editing?'変更を承りました':'ご予約を承りました',`${pill('デモ受付完了')}${kv([['受付番号',safe(b.id)],['日時',dateLabel(b.date)+' '+b.time],['お席',R.room(b.room).name+' ／ '+b.people+'名']])}<button class="primary" data-close>閉じる</button>`);
 navTo(context==='member'?'bookings':context==='partner'?'partner':'desk');
}
function bookingList(){const all=R.s.bookings.filter(b=>b.guest===activeMember);const rows=all.filter(b=>listScope==='all'||b.status==='予約済'||b.status==='来店済');return page('MY RESERVATIONS','ご予約一覧',`<div class="toolbar">${tabs('list-scope',[['coming','受付中'],['all','すべての履歴']],listScope)}${btn('reserve','新しく予約 '+ico('calendar-plus'),'primary')}</div><div class="stack">${rows.map(b=>`<article class="res-card"><img src="./media/${R.room(b.room).img}.webp" alt="${R.room(b.room).name}"><div><p class="overline">${safe(b.id)}</p><h3>${dateLabel(b.date)} ${safe(b.time)}</h3><p>${R.room(b.room).name} · ${b.people}名 ${pill(b.status)}</p></div>${btn('details','詳細 '+arrow(),'outline',`data-id="${b.id}"`)}</article>`).join('')||empty('予約はまだありません。')}</div>`)}
function showBooking(id){const b=R.booking(id);if(!b)return;modal('RESERVATION',`ご予約 ${safe(b.id)}`,`${pill(b.status)}${kv([['営業日',dateLabel(b.date)],['時間',safe(b.time)],['お席',R.room(b.room).name],['人数',b.people+' 名'],['紹介者ID',safe(b.ref)]])}${b.status==='予約済'?`<div class="action-group">${btn('edit-book','予約を変更','primary',`data-id="${b.id}"`)}${btn('cancel-ask','予約を取り消す','quiet',`data-id="${b.id}"`)}</div>`:''}`)}
function memberCard(){return page('MEMBER PASS','デジタル会員証',`<div class="two-col"><section class="id-pass"><p class="overline">PRIVATE MEMBERSHIP</p>${monogram}<h2>THE ROOF</h2><p>KITASHINCHI</p><div class="qr"><img src="./media/pass.svg" width="154" height="154" alt="デモ会員番号のQRコード"></div><strong>MEMBER № 0248</strong><small>体験用会員証</small></section><section class="surface"><h2>フロントでご提示ください</h2>${kv([['会員',safe(R.s.member.alias)],['会員番号','M-0248'],['ご利用区分','紹介会員（デモ）'],['年会費・ランク','将来の会員制度として検討中']])}<p class="help">QRには架空の会員番号が入っています。</p>${link('bookings','ご予約を確認 '+arrow(),'outline')}</section></div>`)}
function myPage(){return page('MY PAGE','マイページ',`<div class="two-col"><section class="surface"><h2>会員プロフィール</h2>${form('profile',grid([field('表示名（架空のニックネーム）',`<input name="alias" maxlength="20" required value="${safe(R.s.member.alias)}">`),field('お席の希望',sel('preference',['おまかせ','窓際','静かな個室','カウンター'],R.s.member.preference))])+submit('プロフィールを保存'))}</section><section class="surface"><h2>会員サービス</h2>${[['card','credit-card','会員証'],['bookings','calendar-days','ご予約履歴'],['invite','ticket','紹介・招待'],['events','wine','イベント'],['bottles','glass-water','ボトルキープ'],['line','message-circle','LINEメニュー体験']].map(([id,ic,l])=>link(id,row(ic,l,'',arrow()),'role-row')).join('')}</section></div>`)}
function invite(){return page('GUEST INVITATIONS','ゲストをご紹介',`<div class="two-col"><section class="surface"><h2>招待状を作成</h2>${form('invite',grid([field('紹介経路',sel('route',R.routes,R.routes[1])),field('ゲスト（架空）',sel('guest',['ゲスト A','ゲスト B','ゲスト C']))])+submit('デモ招待状を発行'))}</section><section class="surface"><h2>発行済みの招待状</h2>${R.s.invites.map(i=>row('ticket',safe(i.guest),safe(i.id)+' · '+safe(i.route),i.accepted?pill('入会体験済'):btn('join-invite','入会を体験','outline',`data-id="${i.id}"`))).join('')||empty('招待状を発行すると、ゲストの入会手続きを体験できます。')}</section></div>`)}
const eventList=[['E1','Wine Salon','ワインテイスティング',7,'counter'],['E2','Champagne Night','シャンパーニュの夕べ',14,'terrace'],['E3','Chef’s Table','季節の試食会',21,'vip']];
function events(){return page('SALON EVENTS','サロンイベント',`<div class="room-grid">${eventList.map(([id,en,n,days,img])=>`<article class="event-card"><img src="./media/${img}.webp" alt=""><div><p class="overline">${dateLabel(R.shift(R.now(),days))}</p><h2>${en}</h2><p>${n}</p>${btn('event',R.s.events.includes(id)?'参加を取り消す':'参加を申し込む',R.s.events.includes(id)?'outline':'primary',`data-id="${id}"`)}</div></article>`).join('')}</div>`)}
function bottles(){return page('BOTTLE KEEP','ボトルキープ',`<section class="surface"><h2>お預かりボトル</h2>${R.s.bottles.map(b=>row('wine',safe(b.name),`残り目安 ${b.left} 杯`,btn('bottle',b.left?'提供を依頼':'提供終了','outline',`data-id="${b.id}" ${b.left?'':'disabled'}`))).join('')}</section>`)}
function contact(){return page('CONCIERGE','コンシェルジュ',`<div class="two-col"><section class="surface"><h2>お問い合わせ</h2>${form('contact',field('ご相談内容',sel('topic',['予約について','会員証について','ゲストの紹介','その他']))+field('メッセージ（デモ用）','<textarea maxlength="180" name="message" required placeholder="例：静かな席を希望します。実際の個人情報は入力しないでください。"></textarea>')+submit('デモで送信'))}</section><section class="surface"><h2>やり取り</h2>${R.s.contacts.map(x=>row('message-circle',safe(x.topic),safe(x.message),pill(x.reply?'返信あり':'受付済'))+(x.reply?`<p class="reply">${safe(x.reply)}</p>`:'')).join('')||empty('この端末で受け付けたご相談が表示されます。')}</section></div>`)}
const richLinks=[['mypage','user-round','マイページ'],['card','qr-code','会員証'],['book','calendar-days','予約'],['contact','message-circle','お問い合わせ']];

const talk=window.createRoofTalk({R,monogram,ico,btn,link,safe,modal,row,empty,richLinks,persist,render,toast,dateLabel,getPerson:()=>person,getChatLog:()=>chatLog});
function metricsTiles(items){return `<div class="metric-grid">${items.map(([a,b])=>`<div class="metric"><span>${a}</span><strong>${b}</strong></div>`).join('')}</div>`}
const sum=(rows,fn)=>rows.reduce((a,b)=>a+fn(b),0);
const terminal=b=>b.status!=='売掛';
function ledgerRows(pid){
 return R.s.bills.filter(b=>b.shares.some(([id])=>id===pid)&&terminal(b)).map(b=>({b,v:R.forPartner(b,pid)}));
}
function partnerView(){
 const p=R.partner(person)||R.s.partners[0],list=ledgerRows(p.id),month=R.now().slice(0,7),year=R.now().slice(0,4);
 const mine=R.s.bookings.filter(b=>b.ref===p.id||b.second===p.id&&b.duplicate==='同時・折半'),monthRows=list.filter(x=>x.b.date.startsWith(month));
 const selected=list.filter(x=>statementPeriod==='day'?x.b.date===statementDate:statementPeriod==='month'?x.b.date.startsWith(statementDate.slice(0,7)):x.b.date.startsWith(statementDate.slice(0,4)));
 const tabsBar=tabs('partner-tab',[['overview','実績'],['ledger','報酬明細'],['offers','提携・特典'],['profile','登録情報']],partnerTab);
 let body='';
 if(partnerTab==='overview')body=metricsTiles([['今月の紹介予約',mine.filter(b=>b.date.startsWith(month)&&b.status!=='取消済').length+' 組'],['今月の報酬基準額',yen(sum(monthRows,x=>x.v.entitlement))],['今年の振込記録',yen(sum(list.filter(x=>x.b.date.startsWith(year)&&x.b.status==='支払済'),x=>x.b.paidLines?.[p.id]??x.v.net))]])+`<section class="surface"><div class="section-head"><h2>ご紹介の受付状況</h2>${btn('partner-reserve','新しい紹介予約 '+arrow(),'primary')}</div>${mine.map(b=>row('ticket',`紹介受付 ${b.id}`,`${dateLabel(b.date)} · ${R.room(b.room).name} · ${b.people}名`,pill(b.status))).join('')||empty('この紹介者の予約はまだありません。')}</section>`;
 if(partnerTab==='ledger')body=`<section class="surface"><div class="toolbar">${tabs('period',[['day','日次'],['month','月間'],['year','年間']],statementPeriod)}${btn('statement','年間支払明細を出力','outline')}</div><h2>${statementPeriod==='day'?dateLabel(statementDate):statementPeriod==='month'?statementDate.slice(0,7):statementDate.slice(0,4)+'年'}の明細</h2>${field('集計の対象日',`<input name="statement-date" type="date" value="${statementDate}">`)}${metricsTiles([['報酬（基準額）',yen(sum(selected,x=>x.v.entitlement))],['源泉控除（デモ）',yen(sum(selected,x=>x.v.tax))],['未相殺の調整額',yen(R.s.offsets[p.id]||0)]])}${selected.map(({b,v})=>row('receipt',`${safe(b.id)} ${yen(v.net)}`,`${b.date} 確定 ／ ${b.due} 振込予定`,btn('partner-bill',b.status+' ›','outline',`data-id="${b.id}"`))).join('')||empty('この期間に確定した紹介報酬はありません。')}</section>`;
 if(partnerTab==='ledger'&&(R.s.claims||[]).some(c=>c.pid===p.id))body+=`<section class="surface"><h2>返還請求の記録</h2>${R.s.claims.filter(c=>c.pid===p.id).map(c=>row('receipt',safe(c.id),yen(c.amount),pill(c.closed?'返還済':'返還待ち'))).join('')}</section>`;
 if(partnerTab==='profile')body=`<section class="surface"><h2>${safe(p.alias)}</h2>${partnerFacts(p)}<p class="help">この体験では架空の登録状態のみを表示します。</p></section>`;
 if(partnerTab==='offers')body=`<section class="surface"><h2>パートナープログラム</h2>${[['points','紹介実績ポイント','ポイント台帳のサンプル'],['event','イベント協力','テイスティング会の協力申込'],['ambassador','アンバサダー','企画・ブランド協力に関心を登録'],['benefit','体験特典','サロンパートナー向けの優待体験']].map(([id,n,s])=>row('sparkles',n,s,btn('benefit',id==='points'?'台帳を見る':R.s.benefits.includes(p.id+id)?'申込済み':'詳細・申込','outline',`data-id="${id}"`))).join('')}</section>`;
 return page('PARTNER PORTAL','紹介パートナー',`<div class="rolebar"><span>${ico('handshake')} ${safe(p.alias)} ／ ${safe(p.id)}</span>${sel('partner-view',R.s.partners.filter(x=>x.active).map(x=>[x.id,x.alias]),p.id,'aria-label="体験する紹介者"')}</div>${tabsBar}${body}`);
}
function partnerFacts(p){return kv([['紹介者ID',safe(p.id)],['所属',safe(p.club)],['本人確認',p.kyc?'デモ確認済':'確認待ち'],['本人名義口座',p.bank?'デモ口座・名義照合済':'未登録'],['インボイス登録番号',p.invoice?'T-DEMO-'+safe(p.id):'未登録'],['源泉区分',safe(p.tax)],['契約日',safe(p.contract||'未締結')],['状態',p.active?'紹介受付中':'審査中']])}
function showBill(id,pid){const b=R.s.bills.find(x=>x.id===id);if(!b)return;const a=pid?R.forPartner(b,pid):R.amounts(b);if(!a)return;
 modal('SETTLEMENT DETAIL','伝票明細',`${pill(b.status)}${kv([['伝票番号',safe(b.id)],...['飲食','酒類','室料','サービス料'].map((n,i)=>[n,yen(b.parts[i])]),['値引き',yen(b.discount)],['返金',yen(b.refund||0)],['対象売上（税抜）',yen(a.base)],['紹介報酬基準額',yen(a.entitlement)],...(pid?[['加算税額（デモ）',yen(a.vat)],['源泉控除（デモ）',yen(a.tax)],['差引報酬額',yen(a.net)],['振込記録',b.paidLines?yen(b.paidLines[pid]||0):b.status==='支払済'?yen(a.net):'未処理']]:[['振込前の差引合計',yen(R.payout(b))]]),['振込予定',safe(b.due||'入金確認後')]])}`)}
const deskTabs=[['reservations','予約台帳'],['pos','会計・売掛'],['pay','報酬・振込'],['master','紹介者台帳'],['metrics','経営指標'],['messages','問合せ']];
function desk(){
 let body='';
 if(deskTab==='reservations')body=`<section class="surface"><div class="section-head"><h2>予約台帳</h2>${btn('staff-reserve',ico('calendar-plus')+' 予約を登録','primary')}</div>${R.s.bookings.map(b=>row('calendar-days',`<b>${safe(b.id)}</b> ${dateLabel(b.date)} ${safe(b.time)}`,`${R.room(b.room).name} ／ ${b.people}名 ／ ${safe(b.ref)} ／ ${safe(b.source)} ${pill(b.status)}`,b.status==='予約済'?btn('checkin','来店受付','outline',`data-id="${b.id}"`):b.status==='来店済'?btn('checkout','会計へ','outline',`data-id="${b.id}"`):btn('details','詳細','outline',`data-id="${b.id}"`))).join('')}</section>`;
 if(deskTab==='pos')body=`<section class="surface"><h2>来店中・未会計</h2>${R.s.bookings.filter(b=>b.status==='来店済').map(b=>row('utensils',b.id,R.room(b.room).name+' ／ '+b.people+' 名',btn('checkout','伝票を作成','primary',`data-id="${b.id}"`))).join('')||empty('来店受付後の予約が表示されます。')}<h2>売上伝票</h2>${R.s.bills.map(b=>row('receipt',b.id+' '+yen(R.amounts(b).base),safe(b.booking)+' ／ '+b.status,`<div class="action-group compact">${btn('bill','詳細','outline',`data-id="${b.id}"`)}${b.status==='売掛'?btn('settle-ar','入金確認','primary',`data-id="${b.id}"`):btn('refund','返金調整','outline',`data-id="${b.id}"`)}</div>`)).join('')}</section>`;
 if(deskTab==='pay')body=`<section class="surface"><div class="section-head"><div><p class="overline">PAYOUT DESK</p><h2>報酬と振込</h2></div>${btn('batch','翌朝計算を体験','primary')}</div><p class="muted">売上確定 → 報酬計算 → 担当確認 → 責任者承認 → 振込記録の順に体験できます。</p>${R.s.bills.filter(terminal).map(b=>{const next={'計算待ち':['batch','報酬計算'],'未確認':['review','担当確認'],'担当確認済':['approve','責任者承認'],'承認済':['pay-demo','振込を記録']}[b.status];return row('banknote',b.id+' '+yen(R.payout(b)),`${safe(b.due)} 予定 ${pill(b.status)}`,next?btn(next[0],next[1],'outline',`data-id="${b.id}"`):btn('bill','明細','outline',`data-id="${b.id}"`))}).join('')}${btn('export-pay','振込データ見本を出力','outline')} ${btn('calendar','銀行休業日の設定','quiet')}<p class="help">振込データはダミーの全銀形式見本です。銀行への送信はできません。</p><h2>未相殺額・返還請求</h2>${Object.entries(R.s.offsets).filter(([,value])=>value>0).map(([pid,value])=>row('wallet',safe(pid),yen(value)+' 未相殺',btn('claim','返還請求を記録','outline',`data-id="${safe(pid)}"`))).join('')||empty('未相殺の残高はありません。')}${(R.s.claims||[]).map(c=>row('receipt',safe(c.id)+' ／ '+safe(c.pid),yen(c.amount),c.closed?pill('返還済'):btn('claim-paid','返還を確認','outline',`data-id="${c.id}"`))).join('')}</section>`;
 if(deskTab==='master')body=`<section class="surface"><div class="section-head"><h2>紹介者マスタ</h2>${btn('add-partner','架空の紹介者を登録','primary')}</div>${R.s.partners.map(p=>row('users',safe(p.alias),`${safe(p.id)} · ${safe(p.club)} · ${p.active?'有効':'審査中'}`,btn('open-partner','詳細・編集','outline',`data-id="${p.id}"`))).join('')}</section>`;
 if(deskTab==='metrics')body=metricsView();
 if(deskTab==='messages')body=`<section class="surface"><h2>相談受付</h2>${R.s.contacts.map(x=>row('mail',safe(x.topic),safe(x.message),x.reply?pill('返信済'):btn('reply','デモ返信','outline',`data-id="${x.id}"`))).join('')||empty('会員画面から相談すると、ここに届きます。')}</section>`;
 return page('SALON OPERATIONS','店舗運営',`${tabs('desk-tab',deskTabs,deskTab)}${body}`);
}
function metricsView(){
 const month=R.now().slice(0,7),bills=R.s.bills.filter(b=>terminal(b)&&b.date.startsWith(month));
 const visits=R.s.bookings.filter(b=>b.date.startsWith(month)&&['来店済','精算済','売掛'].includes(b.status));
 const total=sum(bills,b=>R.amounts(b).base),reward=sum(bills,b=>sum(b.shares,([id])=>R.forPartner(b,id).entitlement));
 const guests=new Set(visits.map(b=>b.guest)), repeat=[...guests].filter(g=>R.s.bookings.filter(b=>b.guest===g&&['来店済','精算済','売掛'].includes(b.status)).length>1);
 const pct=(n,d)=>d?Math.round(n/d*100)+'%':'—';
 const vip=visits.filter(b=>['suite','terrace','private'].includes(b.room)),after=visits.filter(b=>Number(b.time.split(':')[0])>=25);
 const mamaVisits=visits.filter(b=>b.route===R.routes[0]);const activeP=new Set(mamaVisits.map(b=>b.ref));const mamaCustomers=new Set(mamaVisits.map(b=>b.ref+'|'+b.guest));
 return `<section class="surface"><div class="section-head"><h2>月次ダッシュボード</h2>${pill(month)}</div>${metricsTiles([['来店につながったママ数',activeP.size+' 人'],['登録パートナー',R.s.partners.filter(p=>p.active).length+' 人'],['紹介顧客数',guests.size+' 人'],['月間VIP顧客',new Set(vip.map(b=>b.guest)).size+' 人'],['再来率',pct(repeat.length,guests.size)],['確定売上／組',bills.length?yen(total/bills.length):'—'],['紹介経由売上比率',pct(sum(bills.filter(b=>b.shares.length),b=>R.amounts(b).base),total)],['紹介報酬率',pct(reward,total)],['VIP利用率',pct(vip.length,visits.length)],['アフター利用率',pct(after.length,visits.length)],['源泉控除の合計',yen(sum(bills,b=>sum(b.shares,([id])=>R.forPartner(b,id).tax)))],['シャンパン売上',yen(sum(bills,b=>b.champagne||0))],['ボトル売上',yen(sum(bills,b=>b.bottle||0))],['ママ1人の紹介顧客',activeP.size?(mamaCustomers.size/activeP.size).toFixed(1)+' 人':'—']])}<h2>クラブ・紹介者別</h2>${R.s.partners.map(p=>{const own=bills.filter(b=>b.shares.some(x=>x[0]===p.id));const v=visits.filter(b=>R.shares(b).some(x=>x[0]===p.id));const customers=new Set(v.map(b=>b.guest));const returning=[...customers].filter(g=>R.s.bookings.filter(b=>b.guest===g&&['来店済','精算済','売掛'].includes(b.status)&&R.shares(b).some(x=>x[0]===p.id)).length>1);return row('users',safe(p.club)+' ／ '+safe(p.alias),`${v.length} 組 · 客単価 ${own.length?yen(sum(own,b=>R.amounts(b).base)/own.length):'—'} · 再来率 ${pct(returning.length,customers.size)}`,pill(customers.size+' 人'))}).join('')}</section>`;
}
function checkout(id){
 const b=R.booking(id);if(b?.status!=='来店済')return;
 const nums=[['food','飲食'],['drink','酒類'],['room','室料'],['service','サービス料'],['discount','値引き'],['champagne','うちシャンパン'],['bottle','うちボトル売上']];
 modal('POINT OF SALE','会計を確定',`<p class="muted">${b.id} ／ ${R.room(b.room).name} ／ 税抜金額</p>${form('checkout',`<input type="hidden" name="id" value="${b.id}">${grid(nums.map(([k,l],i)=>field(l,`<input type="number" name="${k}" min="0" max="99999999" step="1" value="${[28000,44000,30000,8000,0,16000,0][i]}" required>`)).concat([field('紹介者（会計前まで変更可）',sel('ref',R.s.partners.filter(x=>x.active).map(x=>[x.id,x.alias]),b.ref)),field('追加の紹介者',sel('second',[['','なし'],...R.s.partners.filter(x=>x.active).map(x=>[x.id,x.alias])],b.second)),field('重複の扱い',sel('duplicate',['先着優先','同時・折半'],b.duplicate)),field('回収方法',sel('collect',['決済完了','売掛（後日入金）'])),field('報酬の消費税（デモ）',sel('mode',['内包','別加算','登録別'])),field('源泉・グロスアップ（試算）',sel('tax',['控除なし','一律率で試算','手取保証を試算'])),field('端数処理',sel('round',['切捨て','四捨五入']))]))}<p class="help">対象売上は飲食・酒類・室料・サービス料の値引後合計。デモ報酬率10%、源泉シミュレーション率10.21%。実際の契約・税額の判定には使えません。</p>${submit('デモ伝票を確定')}`)}`)}
function editPartner(id){
 const p=R.partner(id)||{id:'',alias:'パートナー '+String.fromCharCode(65+R.s.partners.length),club:'クラブ C',contract:R.now(),tax:'なし'};
 modal('PARTNER REGISTRY',p.id?'紹介者登録を編集':'紹介者を登録',form('partner-profile',`<input type="hidden" name="id" value="${safe(p.id)}">${grid([field('表示名（架空）',`<input name="alias" required maxlength="24" value="${safe(p.alias)}">`),field('所属クラブ（架空）',`<input name="club" maxlength="24" required value="${safe(p.club)}">`),field('契約日',`<input type="date" name="contract" required value="${safe(p.contract)}">`),field('源泉区分（デモ）',sel('tax',['なし','区分A','区分B'],p.tax)),field('本人確認',sel('kyc',['確認済','未確認'],p.kyc?'確認済':'未確認')),field('本人名義口座',sel('bank',['登録済','未登録'],p.bank?'登録済':'未登録')),field('インボイス登録番号（架空）',sel('invoice',['サンプル登録あり','登録なし'],p.invoice?'サンプル登録あり':'登録なし'))])}<p class="help">本人確認・本人名義口座・契約日が揃うと紹介受付を体験できます。実際の書類・口座番号は収集しません。</p>${submit('登録を保存')}`))}

function billBy(id){return R.s.bills.find(b=>b.id===id)}
function csv(rows){return '\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n')}
function download(name,data,type){const a=document.createElement('a'),u=URL.createObjectURL(new Blob([data],{type}));a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1200)}
function emitStatement(){const year=statementDate.slice(0,4),items=ledgerRows(person).filter(({b})=>b.date.startsWith(year));download(`DEMO-statement-${person}-${year}.csv`,csv([['デモ年間支払明細','紹介者ID','確定日','伝票','報酬','消費税加算','源泉控除','差引','振込記録'],...items.map(({b,v})=>[year,person,b.date,b.id,v.commission,v.vat,v.tax,v.net,b.status==='支払済'?(b.paidLines?.[person]??v.net):0]),['年計',person,'','',sum(items,x=>x.v.commission),sum(items,x=>x.v.vat),sum(items,x=>x.v.tax),sum(items,x=>x.v.net),sum(items.filter(x=>x.b.status==='支払済'),x=>x.b.paidLines?.[person]??x.v.net)]]),'text/csv;charset=utf-8');toast('デモ年間明細を出力しました')}
function paymentLines(b,remaining,apply=false){return Object.fromEntries(b.shares.map(([pid])=>{const net=R.forPartner(b,pid).net,offset=Math.min(net,remaining[pid]||0);if(apply)remaining[pid]=(remaining[pid]||0)-offset;return [pid,net-offset]}))}
function exportPay(){
 const list=R.s.bills.filter(b=>b.status==='承認済');if(!list.length){toast('責任者承認済の伝票が必要です。');return}
 const n=(v,size)=>String(Math.round(v)).padStart(size,'0'),s=(v,len)=>String(v).slice(0,len).padEnd(len,' '),rows=[];
 const remaining={...R.s.offsets};for(const b of list){for(const [id,amt] of Object.entries(paymentLines(b,remaining,true)))if(amt>0)rows.push({id,amt})}
 if(!rows.length){toast('相殺後の振込対象額は0円です。');return}
 const header=('1210'+'0000000000'+s('DEMO ONLY',40)+list[0].due.slice(5).replace('-','')+'0000'+s('DEMO',15)+'000'+s('DEMO',15)+'1'+'0000000').padEnd(120);
 const details=rows.map(({id,amt})=>('2'+'0000'+s('DEMO',15)+'000'+s('DEMO',15)+'0000'+'1'+'0000000'+s('DEMO '+id,30)+n(amt,10)+'0'+s('',10)+s('',10)+'7'+' ').padEnd(120));
 const trailer=('8'+n(rows.length,6)+n(sum(rows,x=>x.amt),12)).padEnd(120);
 download('DEMO-ONLY-zengin.txt',[header,...details,trailer,'9'.padEnd(120)].join('\r\n')+'\r\n','text/plain');toast('全銀形式のダミーデータを出力しました')
}
function render(){
 const r=route();
 document.body.classList.toggle('in-talk', r==='line'||r==='home');
 if(dlg.open)dlg.close();
 if(r==='access'){const q=new URLSearchParams(location.hash.split('?')[1]||''),id=q.get('id');let token;try{token=JSON.parse(sessionStorage.getItem('roof-link'))}catch{ /* Storage may be disabled in private browsing. */ }if(token&&token.id===id&&token.exp>Date.now()&&richLinks.some(x=>x[0]===token.target)){location.replace('#'+token.target);return}head();main.innerHTML=page('MEMBER ACCESS','リンクの有効期限が切れました',`<div class="surface"><p>LINEメニューから新しいリンクを発行できます。</p>${link('line','再発行する '+arrow(),'primary')}</div>`);return}
 const renderers={home:talk.page,salon:home,spaces,book:bookingPage,bookings:bookingList,card:memberCard,mypage:myPage,invite,events,bottles,contact,line:talk.page,partner:partnerView,desk};
 head();main.innerHTML=(renderers[r]||talk.page)();if(document.body.classList.contains('in-talk'))talk.position();document.title=(main.querySelector('h1')?.innerText||'サロン')+' ｜ THE ROOF KITASHINCHI';if(afterRender){const next=afterRender;afterRender=null;next()}}
function runAction(action,id){
 const s=R.s,b=id?R.booking(id):null,t=id?billBy(id):null;
 if(action.startsWith('talk-')){talk.action(action,id);return}
 switch(action){
 case 'menu':menu();break;case 'roles':roleMenu();break;
 case 'reserve':startBook();break;case 'start-room':startBook(id,id==='mama'?'partner':'member');break;case 'partner-reserve':startBook('mama','partner');break;case 'staff-reserve':startBook('counter','staff');break;
 case 'room':roomInfo(id);break;case 'card':navTo('card');break;
 case 'slidenext':case 'slideback':slide=(slide+(action==='slidenext'?1:2))%3;$('.hero').outerHTML=hero();document.querySelector(`[data-action="${action}"]`)?.focus({preventScroll:true});break;
 case 'book-back':bookDraft.step=1;render();break;case 'book-confirm':confirmBook();break;
 case 'list-scope':listScope=id;render();break;case 'details':showBooking(id);break;case 'edit-book':if(b?.status==='予約済')startBook(b.room,b.quickTalk?'partner':'member',b);break;
 case 'cancel-ask':modal('CANCEL RESERVATION','予約を取り消しますか',`<p>${safe(id)} のデモ予約を取り消します。</p><div class="action-group">${btn('cancel-confirm','取り消しを確定','primary',`data-id="${safe(id)}"`)}<button class="outline" data-close>戻る</button></div>`);break;
 case 'cancel-confirm':if(b?.status==='予約済'){b.status='取消済';if(b.guest===activeMember)listScope='all';persist('予約を取り消しました');render()}break;
 case 'join-invite':modal('GUEST ENROLLMENT','招待からの入会',form('enroll',`<input type="hidden" name="id" value="${safe(id)}"><p>架空のゲストとして招待状を受け取り、入会を体験します。</p><label class="check"><input type="checkbox" required> デモ会員として登録する</label>${submit('入会手続きを完了')}`));break;
 case 'event':{const i=s.events.indexOf(id);if(i>=0)s.events.splice(i,1);else s.events.push(id);persist(i<0?'イベント参加を受け付けました':'参加を取り消しました');render();break}
 case 'bottle':{const item=s.bottles.find(x=>x.id===id);if(item?.left){item.left--;persist('1杯分のデモ提供を記録しました');render()}break}
 case 'issue-token':{const item=richLinks.find(x=>x[0]===id);if(!item)break;const token={id:R.id('L')+'-'+Math.random().toString(36).slice(2,8),target:id,exp:Date.now()+300000};try{sessionStorage.setItem('roof-link',JSON.stringify(token))}catch{ /* Storage may be disabled in private browsing. */ }chatLog.push({label:item[2],id:token.id,at:Date.now()});talk.closeMenu();persist();render();break}
 case 'partner-tab':partnerTab=id;render();break;case 'period':statementPeriod=id;render();break;case 'statement':emitStatement();break;
 case 'benefit':if(id==='points'){const points=ledgerRows(person).length*100;modal('PARTNER POINTS','紹介ポイント台帳',kv([['サンプルポイント',points+' pt'],['付与の例','確定した紹介伝票1件につき100 pt']]))}else if(!s.benefits.includes(person+id)){modal('PARTNER ALLIANCE','提携・特典の申込',`<p>${safe({event:'イベント協力',ambassador:'アンバサダー',benefit:'体験特典'}[id])}の希望をデモ登録します。</p>${btn('apply-offer','希望を登録','primary',`data-id="${safe(id)}"`)}`)}else toast('申込を受け付けています');break;
 case 'apply-offer':if(!s.benefits.includes(person+id))s.benefits.push(person+id);persist('希望を登録しました');render();break;
 case 'desk-tab':deskTab=id;render();break;case 'checkin':if(b?.status==='予約済'){b.status='来店済';persist('来店を記録しました');render()}break;
 case 'checkout':checkout(id);break;case 'bill':showBill(id);break;case 'partner-bill':showBill(id,person);break;
 case 'settle-ar':if(t?.status==='売掛'){t.status='計算待ち';t.date=R.now();t.due=R.nextWorking(t.date,s.closures);R.booking(t.booking).status='精算済';persist('入金を確認しました');render()}break;
 case 'batch':{const pending=s.bills.filter(x=>x.status==='計算待ち'&&(!id||x.id===id));for(const x of pending)x.status='未確認';persist(pending.length?pending.length+' 件の報酬を計算しました':'計算待ちの伝票はありません');render();break}
 case 'review':if(t?.status==='未確認'){t.status='担当確認済';persist('担当者の確認を記録しました');render()}break;
 case 'approve':if(t?.status==='担当確認済'){modal('SECOND APPROVAL','責任者の確認',`${kv([['伝票',safe(t.id)],['差引報酬合計',yen(R.payout(t))]])}${btn('approve-confirm','責任者としてデモ承認','primary',`data-id="${t.id}"`)}`)}break;
 case 'approve-confirm':if(t?.status==='担当確認済'){t.status='承認済';persist('責任者の承認を記録しました');render()}break;
 case 'pay-demo':if(t?.status==='承認済'){t.paidLines=paymentLines(t,s.offsets,true);t.paid=sum(Object.values(t.paidLines),x=>x);t.status='支払済';persist('架空の振込記録を作成しました');render()}break;
 case 'claim':{const value=s.offsets[id]||0;if(value>0)modal('REPAYMENT','返還請求の記録',`<p>${safe(id)} の未相殺額 ${yen(value)} をデモ請求に振り替えます。</p>${btn('claim-ok','請求を記録','primary',`data-id="${safe(id)}"`)}`);break}
 case 'claim-ok':{const value=s.offsets[id]||0;if(value>0){(s.claims??=[]).unshift({id:R.id('CR'),pid:id,amount:value,closed:false});s.offsets[id]=0;persist('返還請求を記録しました');render()}break}
 case 'claim-paid':{const c=(s.claims||[]).find(x=>x.id===id);if(c&&!c.closed){c.closed=true;persist('返還を記録しました');render()}break}
 case 'export-pay':exportPay();break;
 case 'refund':if(t){const max=R.amounts(t).base;if(!max){toast('調整可能額は0円です。');break}modal('CREDIT ADJUSTMENT','返金・取消の調整',form('refund',`<input type="hidden" name="id" value="${t.id}">${field('返金する対象売上（税抜円）',`<input required name="amount" type="number" step="1" min="1" max="${max}">`)}<p class="help">支払済の差額は次回の報酬から相殺します。未相殺額は紹介者の明細に表示されます。</p>${submit('調整を記録')}`))}break;
 case 'calendar':modal('BANK CALENDAR','休業日設定',form('calendar',`${field('休業日を追加','<input type="date" name="day" required>')}<p class="help">土日・年末年始・登録日を繰り越します。登録済み：${s.closures.map(safe).join('、')||'なし'}</p>${submit('登録する')}`));break;
 case 'add-partner':editPartner();break;case 'open-partner':editPartner(id);break;
 case 'reply':modal('CONCIERGE REPLY','相談に返信',form('reply',`<input type="hidden" name="id" value="${safe(id)}">${field('デモ返信','<textarea name="text" maxlength="180" required>ご相談を承りました。担当よりご案内いたします。</textarea>')}${submit('返信を記録')}`));break;
 case 'reset':modal('RESET DEMO','体験データを初期化',`<p>このブラウザで作成した架空の予約・明細を初期サンプルに戻します。</p>${btn('reset-ok','初期状態に戻す','primary')}`);break;
 case 'reset-ok':R.reset();chatLog=[];talk.reset();try{sessionStorage.removeItem('roof-link')}catch{ /* Storage may be disabled in private browsing. */ }bookDraft=null;person='P-014';deskTab='reservations';partnerTab='overview';navTo('home');toast('初期状態に戻しました');break;
 }}
document.addEventListener('click',e=>{
 const close=e.target.closest('[data-close]');if(close){dlg.close();return}
 if(e.target===dlg){dlg.close();return}
 const a=e.target.closest('[data-action]');if(a&&!a.disabled){runAction(a.dataset.action,a.dataset.id);return}
 const l=e.target.closest('a[href^="#"]');if(l&&l.hash===location.hash&&dlg.open)dlg.close();
});
dlg.addEventListener('close',()=>{if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true})});
document.addEventListener('change',e=>{
 const t=e.target;if(t.matches('[data-refresh="booking"]')){collectBooking(t.form);render()}else if(t.name==='statement-date'&&t.value){statementDate=t.value;render()}else if(t.name==='partner-view'){person=t.value;render()}
});
document.addEventListener('submit',e=>{
 const f=e.target.closest('form[data-form]');if(!f)return;e.preventDefault();const d=formData(f),s=R.s;
 const err=msg=>{f.querySelector('[data-error]').textContent=msg};
 switch(f.dataset.form){
 case 'booking':collectBooking(f);{const issue=R.validateBooking(bookDraft,bookDraft.editing);if(issue){err(issue);return}}bookDraft.step=2;render();return;
 case 'profile':if(!d.alias.trim()){err('表示名を入力してください。');return}s.member.alias=d.alias.trim();s.member.preference=d.preference;break;
 case 'invite':s.invites.unshift({id:R.id('INV'),route:d.route,guest:d.guest,accepted:false});break;
 case 'enroll':{const inv=s.invites.find(i=>i.id===d.id);if(inv&&!inv.accepted){inv.accepted=true;inv.memberId=R.id('M')}break}
 case 'contact':if(!d.message.trim()){err('内容を入力してください。');return}s.contacts.unshift({id:R.id('C'),topic:d.topic,message:d.message.trim()});break;
 case 'reply':{const msg=s.contacts.find(it=>it.id===d.id);if(msg)msg.reply=d.text.trim();break}
 case 'checkout':{
  const b=R.booking(d.id);if(b?.status!=='来店済'||s.bills.some(x=>x.booking===d.id)){err('この予約は会計済みです。');return}
  const parts=[d.food,d.drink,d.room,d.service].map(Number),discount=Number(d.discount);
  if(discount>sum(parts,x=>x)||Number(d.champagne)+Number(d.bottle)>parts[1]){err('値引きまたは酒類内訳が対象合計を超えています。');return}
  if(d.ref===d.second||!R.partner(d.ref)?.active){err('有効な異なる紹介者を選択してください。');return}
  Object.assign(b,{ref:d.ref,second:d.second,duplicate:d.duplicate,status:d.collect==='決済完了'?'精算済':'売掛'});
  s.bills.unshift({id:R.id('T'),booking:b.id,parts,discount,champagne:Number(d.champagne),bottle:Number(d.bottle),refund:0,adjustments:[],status:b.status==='売掛'?'売掛':'計算待ち',date:R.now(),due:b.status==='売掛'?'':R.nextWorking(R.now(),s.closures),shares:R.shares(b),mode:d.mode,invoiceAtSale:Object.fromEntries(s.partners.map(p=>[p.id,p.invoice])),withheld:d.tax!=='控除なし',gross:d.tax==='手取保証を試算',round:d.round});deskTab='pay';if(b.status==='売掛')deskTab='pos';break;
 }
 case 'refund':{const b=billBy(d.id),value=Number(d.amount);if(!b||!Number.isInteger(value)||value<1||value>R.amounts(b).base){err('調整可能額を確認してください。');return}
  const old=Object.fromEntries(b.shares.map(([pid])=>[pid,R.forPartner(b,pid).net]));
  if(b.status==='支払済'&&!b.paidLines)b.paidLines={...old};
  b.refund=(b.refund||0)+value;b.adjustments.push({amount:value,date:R.now()});
  if(b.status==='支払済')for(const [pid] of b.shares)s.offsets[pid]=(s.offsets[pid]||0)+old[pid]-R.forPartner(b,pid).net;
  else if(b.status!=='売掛')b.status='計算待ち';break;
 }
 case 'calendar':if(!s.closures.includes(d.day))s.closures.push(d.day);for(const b of s.bills)if(!['支払済','売掛'].includes(b.status))b.due=R.nextWorking(b.date,s.closures);break;
 case 'partner-profile':{const p=R.partner(d.id)||{id:R.id('P')};Object.assign(p,{alias:d.alias.trim(),club:d.club.trim(),contract:d.contract,kyc:d.kyc==='確認済',bank:d.bank==='登録済',invoice:d.invoice==='サンプル登録あり',tax:d.tax});p.active=Boolean(p.kyc&&p.bank&&p.contract&&p.contract<=R.now());if(!d.id)s.partners.push(p);break}
 }
 persist('デモに保存しました');render();
});
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);main.focus({preventScroll:true})});
render();
