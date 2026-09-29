/* সহিহ কোরআন শিক্ষা — app.js */
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

/* ---------- ছোট সহায়ক ফাংশন ---------- */
const bnNum = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
const ar = t => `<span class="arabic" lang="ar" dir="rtl">${t}</span>`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const $ = id => document.getElementById(id);
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ---------- সেটিংস ---------- */
let speed = store.get('speed', 0.8);
let repeat = store.get('repeat', 1);
let toastTimer;
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

/* ---------- ডেটা: ২৯টি হরফ ---------- */
// [অক্ষর, নাম, বাংলা ভিত্তি (ব্যঞ্জন) বা null, মাখরাজ, মোটা হরফ?, বিশেষ উচ্চারণ [জবর,জের,পেশ]]
const L = [
  ['ا','আলিফ',null,'জাউফ (মুখ ও গলার ভেতরের শূন্যস্থান) থেকে; এটি টেনে পড়ার হরফ',0,['আ','ই','উ']],
  ['ب','বা','ব','দুই ঠোঁটের ভেজা অংশ থেকে'],
  ['ت','তা','ত','জিহ্বার ডগা উপরের সামনের দাঁতের গোড়ায় লাগিয়ে'],
  ['ث','ছা','ছ','জিহ্বার ডগা উপরের সামনের দাঁতের অগ্রভাগে লাগিয়ে'],
  ['ج','জীম','জ','জিহ্বার মাঝখান তালুর সাথে লাগিয়ে'],
  ['ح','হা (বড় হা)','হ','গলার মধ্যখান থেকে (চেপে)'],
  ['خ','খা','খ','গলার শেষ (মুখের কাছের) অংশ থেকে',1],
  ['د','দাল','দ','জিহ্বার ডগা উপরের সামনের দাঁতের গোড়ায় লাগিয়ে'],
  ['ذ','যাল','য','জিহ্বার ডগা উপরের সামনের দাঁতের অগ্রভাগে লাগিয়ে'],
  ['ر','রা','র','জিহ্বার ডগা (একটু উল্টে) উপরের তালুর সাথে লাগিয়ে'],
  ['ز','যা','য','জিহ্বার ডগা নিচের সামনের দাঁতের অগ্রভাগে (শিসের মতো আওয়াজ)'],
  ['س','সীন','স','জিহ্বার ডগা নিচের সামনের দাঁতের অগ্রভাগে (শিসের মতো আওয়াজ)'],
  ['ش','শীন','শ','জিহ্বার মাঝখান তালুর সাথে লাগিয়ে'],
  ['ص','সোয়াদ','স','জিহ্বার ডগা নিচের সামনের দাঁতের অগ্রভাগে (মোটা করে)',1],
  ['ض','দ্বোয়াদ','দ্ব','জিহ্বার গোড়ার কিনারা উপরের মাড়ির দাঁতে লাগিয়ে',1],
  ['ط','ত্বোয়া','ত্ব','জিহ্বার ডগা উপরের সামনের দাঁতের গোড়ায় (মোটা করে)',1],
  ['ظ','জ্বোয়া','জ্ব','জিহ্বার ডগা উপরের সামনের দাঁতের অগ্রভাগে (মোটা করে)',1],
  ['ع','আইন',null,'গলার মধ্যখান থেকে (গভীর, চাপা আওয়াজ)',0,['আ','ই','উ']],
  ['غ','গাইন','গ','গলার শেষ অংশ থেকে',1],
  ['ف','ফা','ফ','নিচের ঠোঁটের পেট উপরের সামনের দাঁতের অগ্রভাগে'],
  ['ق','ক্বাফ','ক্ব','জিহ্বার গোড়া তালুর সাথে (কাফের চেয়ে গভীর থেকে)',1],
  ['ك','কাফ','ক','জিহ্বার গোড়া থেকে একটু সামনে তালুর সাথে'],
  ['ل','লাম','ল','জিহ্বার ডগার কিনারা উপরের মাড়িতে লাগিয়ে'],
  ['م','মীম','ম','দুই ঠোঁটের শুকনো অংশ থেকে'],
  ['ن','নূন','ন','জিহ্বার ডগা উপরের সামনের দাঁতের মাড়িতে লাগিয়ে'],
  ['و','ওয়াও',null,'দুই ঠোঁট গোল করে',0,['ওয়া','ওয়ি','ওয়ু']],
  ['ه','হা (ছোট হা)','হ','গলার শুরু (সবচেয়ে গভীর) থেকে, হালকা করে'],
  ['ء','হামযাহ',null,'গলার শুরু থেকে (হঠাৎ থেমে যাওয়ার মতো)',0,['আ','ই','উ']],
  ['ي','ইয়া',null,'জিহ্বার মাঝখান তালুর সাথে লাগিয়ে',0,['ইয়া','ইয়ি','ইয়ু']]
].map((r, i) => {
  const [char, name, base, makhraj, heavy, sp] = r;
  const syl = sp || [base + 'া', base + 'ি', base + 'ু'];
  return { id: i + 1, char, name, makhraj, heavy: !!heavy, syl };
});

const SIMILAR = [
  ['ع ا ء','আইন গলার গভীর থেকে চাপা আওয়াজ দেয়; আলিফ/হামযাহ হালকা ও পরিষ্কার।'],
  ['ح ه','বড় হা গলার মাঝ থেকে চেপে বের হয়; ছোট হা গলার শুরু থেকে হালকা ফুঁ-এর মতো।'],
  ['ث س ص','ছা: জিহ্বা দাঁতের আগায় ছুঁয়ে; সীন: পাতলা শিস; সোয়াদ: মোটা শিস।'],
  ['ت ط','তা পাতলা; ত্বোয়া মোটা ও ভরাট আওয়াজ।'],
  ['د ض','দাল পাতলা; দ্বোয়াদ মোটা, জিহ্বার কিনারা থেকে।'],
  ['ذ ز ظ','যাল জিহ্বা দাঁতের আগায়; যা শিসের মতো; জ্বোয়া মোটা।'],
  ['ق ك','ক্বাফ গভীর ও মোটা; কাফ সামনে থেকে ও পাতলা।'],
  ['خ غ','দুটোই গলার শেষ থেকে; খা শুকনো ঘষার মতো, গাইন গড়গড়ানোর মতো।']
];

/* ---------- অডিও ---------- */
let player = null, seqToken = 0;
function stopAudio() {
  seqToken++;
  if (player) { try { player.pause(); } catch (e) {} player = null; }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  document.querySelectorAll('.playing').forEach(e => e.classList.remove('playing'));
}
function tts(text) {
  if (!('speechSynthesis' in window)) { toast('আপনার ডিভাইসে অডিও সাপোর্ট নেই।'); return; }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ar-SA'; u.rate = speed;
  const hasAr = speechSynthesis.getVoices().some(v => v.lang && v.lang.toLowerCase().startsWith('ar'));
  if (!hasAr && !tts.warned) { tts.warned = true; toast('ডিভাইসের আরবি ভয়েস নেই/অসম্পূর্ণ হতে পারে। শুদ্ধ উচ্চারণ উস্তাদের কাছ থেকে শুনে নিন।'); }
  speechSynthesis.speak(u);
}
function playOne(url) {
  return new Promise(res => {
    player = new Audio(url); player.playbackRate = speed;
    player.onended = res; player.onerror = () => res(false);
    player.play().catch(() => res(false));
  });
}
async function playSeq(items) { // items: [{url, el}]
  stopAudio(); const t = seqToken;
  for (const it of items) {
    if (it.el) it.el.classList.add('playing');
    for (let r = 0; r < repeat; r++) { if (t !== seqToken) return; await playOne(it.url); }
    if (it.el) it.el.classList.remove('playing');
  }
}
async function say(el) {
  const text = el.dataset.say, lid = el.dataset.lid, ref = el.dataset.ref;
  stopAudio(); const t = seqToken; el.classList.add('playing');
  setTimeout(() => el.classList.remove('playing'), 700);
  if (lid) { // নিজের রেকর্ড করা ফাইল থাকলে সেটা, না থাকলে ফোনের ভয়েস
    const f = `audio/letters/${String(lid).padStart(2, '0')}.mp3`;
    let done = false;
    const a = new Audio(f); player = a; a.playbackRate = speed;
    const fb = () => { if (!done && t === seqToken) { done = true; tts(text); } };
    a.onerror = fb; a.play().catch(fb); return;
  }
  if (ref) {
    try {
      const r = await fetch(`https://api.alquran.cloud/v1/ayah/${ref}/ar.alafasy`);
      const d = await r.json();
      if (t === seqToken) await playSeqSingle(d.data.audio);
      return;
    } catch (e) { toast('ইন্টারনেট লাগবে। ফোনের ভয়েসে শোনানো হচ্ছে।'); }
  }
  tts(text);
}
function playSeqSingle(url) { return playSeq([{ url, el: null }]); }

/* ---------- কুইজ ---------- */
function makeQuiz(box, gen) {
  let right = 0, total = 0;
  function next() {
    const q = gen();
    box.innerHTML = `<div class="q">${q.prompt}</div><div class="opts"></div><div class="score">সঠিক: ${bnNum(right)}/${bnNum(total)}</div>`;
    const o = box.querySelector('.opts');
    q.options.forEach(opt => {
      const b = document.createElement('button'); b.className = 'opt'; b.textContent = opt;
      b.onclick = () => {
        total++; const ok = opt === q.answer; if (ok) right++;
        b.classList.add(ok ? 'right' : 'wrong');
        o.querySelectorAll('.opt').forEach(x => { x.disabled = true; if (x.textContent === q.answer) x.classList.add('right'); });
        setTimeout(next, 1100);
      };
      o.appendChild(b);
    });
  }
  next();
}

/* ---------- ধাপ ১: বর্ণমালা ও মাখরাজ ---------- */
function buildStep1() {
  const s = $('step1');
  s.innerHTML = `
    <h2>ধাপ ১: ২৯টি আরবি হরফ ও মাখরাজ</h2>
    <p class="subtitle">হরফে ট্যাপ করে শুনুন। মাখরাজ মানে হরফ মুখের কোন জায়গা থেকে বের হয়।</p>
    <div class="note">🔊 নিখুঁত উচ্চারণের জন্য কোনো যোগ্য উস্তাদের কাছে শুনে মিলিয়ে নিন। অ্যাপের আওয়াজ সহায়ক মাত্র।</div>
    <div class="grid-container" id="letters-grid"></div>
    <h2 style="margin-top:22px">কাছাকাছি উচ্চারণের হরফ</h2>
    <p class="subtitle">এই হরফগুলো শুরুতেই আলাদা করে চিনে নিন:</p>
    <div id="similar"></div>
    <h2 style="margin-top:22px">কুইজ: হরফের নাম</h2>
    <div class="card quiz" id="quiz1"></div>`;
  $('letters-grid').innerHTML = L.map(x => `
    <div class="letter-card" data-say="${x.char === 'ا' ? 'أ' : x.char}" data-lid="${x.id}">
      ${ar(x.char)}<span class="bn-name">${x.name}</span>
      <span class="makhraj-info">${x.makhraj}</span>${x.heavy ? '<span class="badge">মোটা হরফ</span>' : ''}
    </div>`).join('');
  $('similar').innerHTML = SIMILAR.map(([chars, tip]) => `
    <div class="card"><div>${chars.split(' ').map(c => ar(c)).join(' &nbsp; ')}</div><p>${tip}</p></div>`).join('');
  makeQuiz($('quiz1'), () => {
    const c = pick(L);
    const opts = shuffle([c.name, ...shuffle(L.filter(x => x.name !== c.name)).slice(0, 3).map(x => x.name)]);
    return { prompt: `এই হরফটির নাম কী? ${ar(c.char)}`, options: opts, answer: c.name };
  });
}

/* ---------- ধাপ ২: হরকত, তানভীন ---------- */
const MARKS = {
  fatha: ['\u064E', 'জবর', 0, ''], kasra: ['\u0650', 'জের', 1, ''], damma: ['\u064F', 'পেশ', 2, ''],
  fathatan: ['\u064B', 'দুই জবর', 0, 'ন'], kasratan: ['\u064D', 'দুই জের', 1, 'ন'], dammatan: ['\u064C', 'দুই পেশ', 2, 'ন']
};
function withMark(x, m) { return (x.char === 'ا' ? 'أ' : x.char) + MARKS[m][0]; }
function sylOf(x, m) { return x.syl[MARKS[m][2]] + MARKS[m][3]; }

function buildStep2() {
  const s = $('step2');
  const B = L[1];
  const card = (t, txt) => `<div class="arabic-card" data-say="${t[0]}">${ar(t[0])}<span class="bn-name">${t[1]}</span></div>`;
  s.innerHTML = `
    <h2>ধাপ ২: হরকত, তানভীন, সুকুন ও তাশদীদ</h2>
    <div class="card"><h3>১. হরকত (জবর, জের, পেশ)</h3>
      <p>হরকতের উচ্চারণ না টেনে দ্রুত পড়তে হয়।</p>
      <div class="example-box">${['بَ:বা (জবর)','بِ:বি (জের)','بُ:বু (পেশ)'].map(t => { const [a, b] = t.split(':'); return card([a, b]); }).join('')}</div></div>
    <div class="card"><h3>২. তানভীন (দুই জবর, দুই জের, দুই পেশ)</h3>
      <p>তানভীনের উচ্চারণে একটি সাকিন 'নূন' (ন) লুকিয়ে থাকে।</p>
      <div class="example-box">${['بً:বান (দুই জবর)','بٍ:বিন (দুই জের)','بٌ:বুন (দুই পেশ)'].map(t => { const [a, b] = t.split(':'); return card([a, b]); }).join('')}</div></div>
    <div class="card"><h3>৩. সুকুন / জযম ( ْ ) ও তাশদীদ ( ّ )</h3>
      <p>সুকুনযুক্ত অক্ষর আগের হরকতের সাথে মিলিয়ে পড়া হয়। তাশদীদযুক্ত অক্ষর দুইবার উচ্চারিত হয়।</p>
      <div class="example-box">${['أَبْ:আব (সুকুন)','أَبَّ:আব্‌বা (তাশদীদ)'].map(t => { const [a, b] = t.split(':'); return card([a, b]); }).join('')}</div></div>
    <h2 style="margin-top:20px">অনুশীলন: সব হরফে হরকত</h2>
    <div class="tabs-mini" id="markTabs">${Object.keys(MARKS).map((k, i) => `<button class="chip${i ? '' : ' active'}" data-mark="${k}">${MARKS[k][1]}</button>`).join('')}</div>
    <div class="grid-container" id="mark-grid"></div>
    <h2 style="margin-top:22px">কুইজ: উচ্চারণ চিনুন</h2>
    <div class="card quiz" id="quiz2"></div>`;
  const draw = m => {
    $('mark-grid').innerHTML = L.filter(x => x.id !== 28).map(x => `
      <div class="letter-card" data-say="${withMark(x, m)}">${ar(withMark(x, m))}<span class="bn-name">${sylOf(x, m)}</span></div>`).join('');
  };
  draw('fatha');
  $('markTabs').onclick = e => {
    const b = e.target.closest('[data-mark]'); if (!b) return;
    $('markTabs').querySelectorAll('.chip').forEach(c => c.classList.remove('active')); b.classList.add('active'); draw(b.dataset.mark);
  };
  makeQuiz($('quiz2'), () => {
    const x = pick(L.filter(y => y.id !== 28)), m = pick(['fatha', 'kasra', 'damma']);
    const ans = sylOf(x, m);
    const opts = shuffle(['fatha', 'kasra', 'damma'].map(k => sylOf(x, k)));
    return { prompt: `এটি কীভাবে পড়বেন? ${ar(withMark(x, m))}`, options: opts, answer: ans };
  });
}

/* ---------- ধাপ ৩: মুরক্কাব ---------- */
const NOJOIN = 'ادذرزو';
const ZWJ = '\u200D';
const WORDS = [
  ['كَتَبَ', ['ك','ت','ب'], 'কাতাবা (লিখেছে)'],
  ['قَلَم', ['ق','ل','م'], 'ক্বালাম (কলম)'],
  ['عِلْم', ['ع','ل','م'], 'ইলম (জ্ঞান)'],
  ['رَحِيم', ['ر','ح','ي','م'], 'রাহীম (দয়ালু)'],
  ['يَهْدِي', ['ي','ه','د','ي'], 'ইয়াহদী (পথ দেখায়)'],
  ['مَسْجِد', ['م','س','ج','د'], 'মাসজিদ']
];
function buildStep3() {
  const s = $('step3');
  const letters = L.filter(x => x.char !== 'ء');
  const rows = letters.map(x => {
    const c = x.char, nj = NOJOIN.includes(c);
    return `<tr><td>${ar(c)}</td>
      <td>${nj ? '<span class="dim">যুক্ত হয় না</span>' : ar(c + ZWJ)}</td>
      <td>${nj ? '<span class="dim">—</span>' : ar(ZWJ + c + ZWJ)}</td>
      <td>${ar(ZWJ + c)}</td></tr>`;
  }).join('');
  s.innerHTML = `
    <h2>ধাপ ৩: মুরক্কাব (হরফ যুক্ত করার নিয়ম)</h2>
    <p class="subtitle">আরবি শব্দে হরফ শুরু, মাঝ ও শেষে আলাদা আকার নেয়। ৬টি হরফ (ا د ذ ر ز و) পরের হরফের সাথে যুক্ত হয় না।</p>
    <div class="card tbl-wrap"><table class="forms-table">
      <tr><th>আলাদা</th><th>শুরুতে</th><th>মাঝে</th><th>শেষে</th></tr>${rows}</table></div>
    <h2 style="margin-top:20px">শব্দ ভেঙে পড়া অনুশীলন</h2>
    <p class="subtitle">প্রথমে বিচ্ছিন্ন হরফ, তারপর যুক্ত শব্দ। শব্দে ট্যাপ করে শুনুন:</p>
    ${WORDS.map(w => `<div class="card" style="text-align:center" data-say="${w[0]}">
      <div style="color:#94a3b8;margin-bottom:4px">${w[1].map(c => ar(c)).join(' + ')}</div>
      ${ar(w[0])}<div style="font-weight:700">${w[2]}</div></div>`).join('')}
    <p class="subtitle">অনুশীলন: প্রথমে ২–৩ অক্ষরের শব্দ বানান করে পড়ুন, পরে বানান ছাড়া পড়ার চেষ্টা করুন।</p>`;
}

/* ---------- ধাপ ৪: তাজবীদ ---------- */
const TAJ = [
  { t: '১. মাদ্দ (টেনে পড়া)', p: 'মাদ্দের হরফ ৩টি: ا و ي। আলিফের আগে জবর, ওয়াও সাকিনের আগে পেশ, ইয়া সাকিনের আগে জের থাকলে টানতে হয়। ১ আলিফ = ২ হরকত (আঙুল বন্ধ থেকে খুলতে যতক্ষণ লাগে)। বড় মাদ্দে ৪–৫ হরকত, আর মাদ্দে লাযিমে ৬ হরকত (৩ আলিফ) টানা হয়। গণনার পদ্ধতি বইভেদে কিছুটা আলাদা হতে পারে, উস্তাদের কাছে মিলিয়ে নিন।',
    items: [['بَا','বা (১ আলিফ, মাদ্দে আসলী)'],['بُو','বূ (১ আলিফ)'],['بِي','বী (১ আলিফ)'],['جَاءَ','জাআ (মাদ্দে মুত্তাসিল, ৪–৫ হরকত)'],['قُوا أَنفُسَكُمْ','কূ আনফুসাকুম (মাদ্দে মুনফাসিল, ৪–৫ হরকত)'],['الضَّالِّينَ','আদ-দ্বোয়াল্লীন (মাদ্দে লাযিম, ৬ হরকত) — আয়াত শুনুন','1:7']] },
  { t: '২. গুন্নাহ', p: 'নূন (ن) ও মীম (م)-এ তাশদীদ থাকলে নাকের ভেতর থেকে আওয়াজ করে প্রায় ২ হরকত টানতে হয় (ওয়াজিব গুন্নাহ)।',
    items: [['إِنَّ','ইন্না'],['ثُمَّ','ছুম্মা'],['عَمَّ','আম্মা']] },
  { t: '৩. নূন সাকিন ও তানভীনের ৪ নিয়ম', p: '',
    sub: [
      ['ইযহার (স্পষ্ট করে)', 'গলার ৬ হরফ (ء ه ع ح غ خ) পরে এলে নূনের আওয়াজ পরিষ্কার পড়ুন।', [['أَنْعَمْتَ','আন-আমতা — আয়াত শুনুন','1:7']]],
      ['ইদগাম (মিলিয়ে পড়া)', 'ي ر م ل و ن পরে এলে মিলিয়ে ফেলুন। ي ن م و-তে গুন্নাহসহ, ل ر-তে গুন্নাহ ছাড়া।', [['مَنْ يَقُولُ','মাই ইয়াকূল (গুন্নাহসহ) — আয়াত শুনুন','2:8'],['مِنْ رَبِّهِمْ','মির রাব্বিহিম (গুন্নাহ ছাড়া) — আয়াত শুনুন','2:5']]],
      ['ইকলাব (বদলে ফেলা)', 'ب (বা) পরে এলে নূনের আওয়াজ মীমে বদলে ঠোঁট মিলিয়ে গুন্নাহসহ পড়ুন।', [['مِنْ بَعْدِ','মিম বা’দি']]],
      ['ইখফা (লুকিয়ে নাক দিয়ে)', 'বাকি ১৫ হরফ (ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك) পরে এলে নূনকে লুকিয়ে গুন্নাহসহ পড়ুন।', [['أَنْتُمْ','আন-তুম'],['مِنْ قَبْلُ','মিন ক্বাবলু']]]
    ] },
  { t: '৪. ওয়াকফ (থামার নিয়ম)', p: 'আয়াতের শেষে থামলে শেষ হরফ সাকিন (জযম) করে পড়ুন; জের/জবর/পেশ ও তানভীনের আওয়াজ ছেড়ে দিন। যেমন: الرَّحِيمِ থামলে "রাহীম"।',
    items: [['الرَّحِيمِ','আর-রাহীম (থামলে) — আয়াত শুনুন','1:3']],
    extra: 'থামার চিহ্ন: <b>م</b> অবশ্যই থামুন · <b>لا</b> থামবেন না · <b>ج</b> থামা যায়, না থামলেও চলে · <b>قلى</b> থামা ভালো · <b>صلى</b> না থামা ভালো।' }
];
function itemCard(it) {
  return `<div class="arabic-card" data-say="${it[0]}"${it[2] ? ` data-ref="${it[2]}"` : ''}>${ar(it[0])}<small>${it[1]}</small></div>`;
}
function buildStep4() {
  $('step4').innerHTML = `<h2>ধাপ ৪: মৌলিক তাজবীদের নিয়ম</h2>` + TAJ.map(x => `
    <div class="card"><h3>${x.t}</h3>${x.p ? `<p>${x.p}</p>` : ''}
      ${x.items ? `<div class="example-box">${x.items.map(itemCard).join('')}</div>` : ''}
      ${x.sub ? x.sub.map(s => `<p style="margin-top:12px"><b style="color:#f59e0b">${s[0]}:</b> ${s[1]}</p><div class="example-box">${s[2].map(itemCard).join('')}</div>`).join('') : ''}
      ${x.extra ? `<p style="margin-top:10px">${x.extra}</p>` : ''}
    </div>`).join('') + `<div class="note">"আয়াত শুনুন" লেখা কার্ডে ইন্টারনেট লাগে; সেখানে কারীর আসল তিলাওয়াত চলে।</div>`;
}

/* ---------- ধাপ ৫: তিলাওয়াত চর্চা ---------- */
const SURAHS = [[1,'আল-ফাতিহা'],[105,'আল-ফীল'],[106,'কুরাইশ'],[107,'আল-মাঊন'],[108,'আল-কাউসার'],[109,'আল-কাফিরূন'],[110,'আন-নাসর'],[111,'আল-লাহাব'],[112,'আল-ইখলাস'],[113,'আল-ফালাক'],[114,'আন-নাস']];
function buildStep5() {
  $('step5').innerHTML = `
    <h2>ধাপ ৫: শুনে শুনে তিলাওয়াত চর্চা</h2>
    <p class="subtitle">আয়াত দেখে দেখে কারীর সাথে মিলিয়ে পড়ুন। (ইন্টারনেট লাগবে; শেখ মিশারী আলাফাসীর তিলাওয়াত)</p>
    <div class="surah-selector"><select id="surahSelect">${SURAHS.map(s => `<option value="${s[0]}">${bnNum(s[0])}. সুরা ${s[1]}</option>`).join('')}</select></div>
    <div class="btn-row"><button class="btn" id="playAll">▶ সব আয়াত শুনুন</button></div>
    <div id="surah-content"></div>`;
  $('surahSelect').onchange = loadSurah;
  $('playAll').onclick = () => playSeq([...document.querySelectorAll('.ayah-box')].map(b => ({ url: b.dataset.url, el: b })));
  loadSurah();
}
async function loadSurah() {
  const id = $('surahSelect').value, box = $('surah-content');
  box.innerHTML = '<p style="text-align:center">সুরা লোড হচ্ছে...</p>';
  try {
    const r = await fetch(`https://api.alquran.cloud/v1/surah/${id}/ar.alafasy`);
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    box.innerHTML = '';
    d.data.ayahs.forEach(a => {
      const div = document.createElement('div'); div.className = 'ayah-box'; div.dataset.url = a.audio;
      const t = document.createElement('div'); t.className = 'ayah-text'; t.lang = 'ar'; t.dir = 'rtl';
      t.textContent = `${a.text} (${a.numberInSurah.toLocaleString('ar-EG')})`;
      const b = document.createElement('button'); b.className = 'ayah-audio-btn'; b.textContent = '▶ শুনুন';
      b.onclick = () => playSeq([{ url: a.audio, el: div }]);
      div.append(t, b); box.appendChild(div);
    });
  } catch (e) {
    box.innerHTML = '<p style="color:#fca5a5;text-align:center">লোড করতে সমস্যা হয়েছে। ইন্টারনেট কানেকশন চেক করে আবার চেষ্টা করুন।</p>';
  }
}

/* ---------- ট্যাব, অগ্রগতি ও শুরু ---------- */
let done = store.get('done', []);
function refreshProgress() {
  $('progressBar').style.width = (done.length / 5 * 100) + '%';
  $('progressText').textContent = `অগ্রগতি: ${bnNum(done.length)}/৫ ধাপ সম্পন্ন`;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('done', done.includes(+b.dataset.step)));
  document.querySelectorAll('.done-btn').forEach(b => {
    const d = done.includes(+b.dataset.step); b.classList.toggle('done', d);
    b.textContent = d ? '✓ এই ধাপ সম্পন্ন (আবার ট্যাপ করলে বাতিল)' : '✓ এই ধাপ সম্পন্ন করেছি';
  });
}
function addDoneButtons() {
  for (let i = 1; i <= 5; i++) {
    const b = document.createElement('button'); b.className = 'done-btn'; b.dataset.step = i;
    b.onclick = () => { done = done.includes(i) ? done.filter(x => x !== i) : [...done, i]; store.set('done', done); refreshProgress(); };
    $('step' + i).appendChild(b);
  }
}
function switchStep(n) {
  document.querySelectorAll('.step-content').forEach(e => e.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(e => e.classList.toggle('active', +e.dataset.step === n));
  $('step' + n).classList.add('active');
  store.set('lastStep', n); stopAudio(); window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('click', e => {
  const s = e.target.closest('[data-say]'); if (s) say(s);
});
window.addEventListener('DOMContentLoaded', () => {
  buildStep1(); buildStep2(); buildStep3(); buildStep4(); buildStep5(); addDoneButtons();
  $('tabs').onclick = e => { const b = e.target.closest('.tab-btn'); if (b) switchStep(+b.dataset.step); };
  $('speedSel').value = String(speed); $('repeatSel').value = String(repeat);
  $('speedSel').onchange = e => { speed = +e.target.value; store.set('speed', speed); };
  $('repeatSel').onchange = e => { repeat = +e.target.value; store.set('repeat', repeat); };
  $('stopBtn').onclick = stopAudio;
  if ('speechSynthesis' in window) speechSynthesis.getVoices();
  refreshProgress(); switchStep(store.get('lastStep', 1));
});
