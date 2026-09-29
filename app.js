// Service Worker Registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// ২৯টি আরবি বর্ণমালা এবং মাখরাজের ডেটা
const arabicLetters = [
  { char: 'أ', name: 'আলিফ', makhraj: 'হলকের (গলার) শুরু হতে' },
  { char: 'ب', name: 'বা', makhraj: 'দুই ঠোঁট ভিজা স্থান হতে' },
  { char: 'ت', name: 'তা', makhraj: 'জিহবার ডগা উপরের দাতের গোড়া' },
  { char: 'ث', name: 'ছা', makhraj: 'জিহবার ডগা উপরের দাতের অগ্রভাগ' },
  { char: 'ج', name: 'জীম', makhraj: 'জিহবার মধ্যখান বরাবর উপরের তালু' },
  { char: 'ح', name: 'হা', makhraj: 'হলকের (গলার) মধ্যখান হতে' },
  { char: 'خ', name: 'খা', makhraj: 'হলকের (গলার) শেষ হতে' },
  { char: 'د', name: 'দাল', makhraj: 'জিহবার ডগা উপরের দাতের গোড়া' },
  { char: 'ذ', name: 'যাল', makhraj: 'জিহবার ডগা উপরের দাতের অগ্রভাগ' },
  { char: 'ر', name: 'রা', makhraj: 'জিহবার ডগার পিঠ পিঠের সাথে তালু' },
  { char: 'ز', name: 'যা', makhraj: 'জিহবার ডগা নিচের দাতের অগ্রভাগ' },
  { char: 'س', name: 'সীন', makhraj: 'জিহবার ডগা নিচের দাতের অগ্রভাগ' },
  { char: 'ش', name: 'শীন', makhraj: 'জিহবার মধ্যখান বরাবর উপরের তালু' },
  { char: 'ص', name: 'সোয়াদ', makhraj: 'জিহবার ডগা নিচের দাতের অগ্রভাগ' },
  { char: 'ض', name: 'দ hisাদ/দ্বাদ', makhraj: 'জিহবার গোড়ার কিনারা উপরের মাড়ির দাত' },
  { char: 'ط', name: 'ত্বা', makhraj: 'জিহবার ডগা উপরের দাতের গোড়া' },
  { char: 'ظ', name: 'জ্বা', makhraj: 'জিহবার ডগা উপরের দাতের অগ্রভাগ' },
  { char: 'ع', name: '‘আইন', makhraj: 'হলকের (গলার) মধ্যখান হতে' },
  { char: 'غ', name: 'গাইন', makhraj: 'হলকের (গলার) শেষ হতে' },
  { char: 'ف', name: 'ফা', makhraj: 'নিচের ঠোঁটের পেট উপরের দাতের অগ্রভাগ' },
  { char: 'ق', name: 'ক্বাফ', makhraj: 'জিহবার গোড়া বরাবর উপরের তালু' },
  { char: 'ك', name: 'কাফ', makhraj: 'জিহবার গোড়া থেকে একটু আগে' },
  { char: 'ل', name: 'লাম', makhraj: 'জিহবার ডগার কিনারা উপরের মাড়ি' },
  { char: 'م', name: 'মীম', makhraj: 'দুই ঠোঁট শুকনো স্থান হতে' },
  { char: 'ن', name: 'নূন', makhraj: 'জিহবার ডগা বরাবর উপরের তালু' },
  { char: 'و', name: 'ওয়াও', makhraj: 'দুই ঠোঁট গোল করে' },
  { char: 'هـ', name: 'হা', makhraj: 'হলকের (গলার) শুরু হতে' },
  { char: 'ء', name: 'হামযাহ', makhraj: 'হলকের (গলার) শুরু হতে' },
  { char: 'ي', name: 'ইয়া', makhraj: 'জিহবার মধ্যখান বরাবর উপরের তালু' }
];

// মুরক্কাব (যুক্ত হরফ) ডেটা
const murakkabData = [
  { isolated: 'ب + ل', joint: 'بل', name: 'বা + লাম = বাল' },
  { isolated: 'ك + ت + ب', joint: 'كتب', name: 'কাফ + তা + বা = কাতাবা' },
  { isolated: 'ع + ل + م', joint: 'علم', name: 'আইন + লাম + মীম = আলিমা' },
  { isolated: 'ي + هـ + د + ي', joint: 'يهدي', name: 'ইয়া + হা + দাল + ইয়া = ইয়াহদী' }
];

// ধাপ পরিবর্তন ফাংশন
function switchStep(stepNumber) {
  document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  
  document.getElementById(`step${stepNumber}`).classList.add('active');
  event.target.classList.add('active');
}

// ধাপ ১: বর্ণমালা লোড
function loadStep1() {
  const container = document.getElementById('letters-grid');
  container.innerHTML = '';
  arabicLetters.forEach(item => {
    const card = document.createElement('div');
    card.className = 'letter-card';
    card.onclick = () => speakArabic(item.char);
    card.innerHTML = `
      <span class="arabic">${item.char}</span>
      <span class="bn-name">${item.name}</span>
      <span class="makhraj-info">${item.makhraj}</span>
    `;
    container.appendChild(card);
  });
}

// ধাপ ৩: মুরক্কাব লোড
function loadStep3() {
  const container = document.getElementById('murakkab-container');
  container.innerHTML = '';
  murakkabData.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.textAlign = 'center';
    card.onclick = () => speakArabic(item.joint);
    card.innerHTML = `
      <div style="font-size: 18px; color: #94a3b8; margin-bottom: 5px;">বিচ্ছিন্ন রূপ: ${item.isolated}</div>
      <div class="arabic" style="color: #f59e0b;">${item.joint}</div>
      <div style="margin-top: 5px; font-weight: bold;">উচ্চারণ: ${item.name}</div>
    `;
    container.appendChild(card);
  });
}

// স্পিচ সিন্থেসিস বা অডিও প্লেয়ার
function speakArabic(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.7; // ধীর উচ্চারণের জন্য
    window.speechSynthesis.speak(utterance);
  } else {
    alert('আপনার ব্রাউজারে স্পিচ সাপোর্ট নেই।');
  }
}

// ধাপ ৫: সুরা তিলাওয়াত লোড (Alquran Cloud API থেকে)
async function loadSurah() {
  const surahId = document.getElementById('surahSelect').value;
  const container = document.getElementById('surah-content');
  container.innerHTML = '<p style="text-align:center;">সুরা লোড হচ্ছে...</p>';

  try {
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/ar.alafasy`);
    const data = await response.json();
    
    container.innerHTML = '';
    data.data.ayahs.forEach(ayah => {
      const box = document.createElement('div');
      box.className = 'ayah-box';
      box.innerHTML = `
        <div class="ayah-text">${ayah.text} (${ayah.numberInSurah.toLocaleString('ar-EG')})</div>
        <button class="ayah-audio-btn" onclick="playAudio('${ayah.audio}')">▶ শুনুন</button>
        <div style="clear:both;"></div>
      `;
      container.appendChild(box);
    });
  } catch (error) {
    container.innerHTML = '<p style="color:red; text-align:center;">অডিও লোড করতে সমস্যা হয়েছে। ইন্টারনেট কানেকশন চেক করুন।</p>';
  }
}

function playAudio(url) {
  const audio = new Audio(url);
  audio.play();
}

// প্রাথমিক লোড
window.onload = () => {
  loadStep1();
  loadStep3();
  loadSurah();
};
