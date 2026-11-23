'use strict';

/* GRAPHIC LAB / Practical work #4
   All answers and screenshots are processed in the student's browser.
   Text is autosaved locally; screenshots are kept in memory unless a draft is exported.
   No server-side student submissions, tracking, or uploads.
*/
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const STORAGE_KEY = 'tkoi-practical-4-canva-v1';
const THEME = 'Дослідження інструментарію графічних редакторів та їх використання для базової візуальної комунікації.';
const AIM = 'Ознайомитися з основними інструментами Canva; набути навичок кадрування та корекції фотографій, роботи з текстом, формами, кольором і композицією; навчитися експортувати графічні матеріали й документувати виконання роботи.';
const keys = ['studentName','studentGroup','studentDate','note1','note2','note3','note4','conclusion'];
const screenshotKeys = ['shot1','shot2','shot3','shot4','shot5','shot6'];
const screenshotLabels = {
  shot1:'Скриншот 1. Інтерфейс Canva та перші елементи',
  shot2:'Скриншот 2. Оригінальна фотографія до обробки',
  shot3:'Скриншот 3. Фотографія після обробки',
  shot4:'Скриншот 4. Процес створення афіші',
  shot5:'Скриншот 5. Готова афіша',
  shot6:'Скриншот 6. Налаштування експорту PNG у Canva'
};
const stages = [
  {
    name:'Етап 1. Дослідження інструментів Canva',
    narrative:'Створено новий графічний дизайн розміром 1080 × 1350 px. Досліджено інструменти додавання тексту, геометричних фігур, власних зображень і засоби редагування елементів.',
    note:'note1',
    shots:['shot1']
  },
  {
    name:'Етап 2. Обробка фотографії',
    narrative:'Додано початкове зображення. Виконано кадрування та налаштування яскравості, контрасту й насиченості. Порівняно результат до та після редагування.',
    note:'note2',
    shots:['shot2','shot3']
  },
  {
    name:'Етап 3. Створення інформаційної афіші',
    narrative:'Розроблено афішу «Цифрова грамотність: навички майбутнього» з текстовою ієрархією, інформаційними блоками, відредагованою фотографією, фігурами й узгодженою палітрою.',
    note:'note3',
    shots:['shot4']
  },
  {
    name:'Етап 4. Експорт і аналіз графічного продукту',
    narrative:'Перевірено розмір, читабельність та візуальну композицію. Завершену афішу експортовано у форматі PNG і перевірено результат.',
    note:'note4',
    shots:['shot5','shot6']
  }
];
const state = {shots:{}, fileNames:{}};
let lastFocus = null;

function safeStorageRead(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'); }
  catch (_) { return null; }
}
function safeStorageWrite(){
  const fields={};
  keys.forEach(k => fields[k]=$('[data-field="'+k+'"]').value);
  const checks={};
  $$('[data-task]').forEach(box=>checks[box.dataset.task]=box.checked);
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify({fields,checks})); } catch (_) {}
}
function fieldValue(key){return ($('[data-field="'+key+'"]')?.value||'').trim();}
function todayLocal(){
  const d = new Date();
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
  return y+'-'+m+'-'+day;
}
function niceDate(iso){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return 'Не зазначено';
  const [y,m,d] = iso.split('-');
  return d+'.'+m+'.'+y;
}
function restoreText(){
  const saved=safeStorageRead();
  if(saved && saved.fields && typeof saved.fields==='object'){
    keys.forEach(k=>{if(typeof saved.fields[k]==='string')$('[data-field="'+k+'"]').value=saved.fields[k].slice(0,15000);});
    if(saved.checks && typeof saved.checks==='object') $$('[data-task]').forEach(box=>{box.checked=saved.checks[box.dataset.task]===true;});
  }
  if(!fieldValue('studentDate')) $('[data-field="studentDate"]').value=todayLocal();
}

function status(){
  const needed=[
    ['ПІБ',Boolean(fieldValue('studentName'))],
    ['дата',Boolean(fieldValue('studentDate'))],
    ['опис етапу 1',Boolean(fieldValue('note1'))],
    ['опис етапу 2',Boolean(fieldValue('note2'))],
    ['опис етапу 3',Boolean(fieldValue('note3'))],
    ['опис етапу 4',Boolean(fieldValue('note4'))],
    ['висновок',Boolean(fieldValue('conclusion'))],
    ...screenshotKeys.map((key,index)=>['скриншот '+(index+1),Boolean(state.shots[key])])
  ];
  const done=needed.filter(v=>v[1]).length;
  return {done, total:needed.length, missing:needed.filter(v=>!v[1]).map(v=>v[0])};
}
function updateProgress(){
  const {done,total,missing}=status();
  const percent=Math.round(100*done/total);
  $('#readyCount').textContent=done+' / '+total;
  $('#readyText').textContent=done===total?'Звіт повністю готовий':'Заповнено '+done+' з '+total+' обов’язкових елементів';
  $('#overallPercent').textContent=percent+'%';
  $('#overallFill').style.width=percent+'%';
  $('#completeFill').style.width=percent+'%';
  $('#missingList').textContent=missing.length ? 'Залишилося: '+missing.join(', ')+'.' : 'Усі описи, дані та шість скриншотів додані. Можна зберігати PDF.';
  $('#miniName').textContent=fieldValue('studentName') || '_________________';
  $('#miniDate').textContent=fieldValue('studentDate')?niceDate(fieldValue('studentDate')):'_________________';
}

function reportNotification(message,type='warn'){
  const node=$('#validationMessage');
  node.textContent=message;
  node.className='validation-message '+type;
}

async function resizeFile(file){
  if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Дозволені лише PNG, JPG та WebP.');
  if(file.size>18*1024*1024)throw new Error('Файл завеликий. Використайте скриншот до 18 МБ.');
  const url=URL.createObjectURL(file);
  try{
    const image=await new Promise((resolve,reject)=>{
      const im=new Image();
      im.onload=()=>resolve(im);
      im.onerror=()=>reject(new Error('Не вдалося відкрити зображення.'));
      im.src=url;
    });
    const naturalW=image.naturalWidth, naturalH=image.naturalHeight;
    if(!naturalW || !naturalH || naturalW*naturalH>65000000)throw new Error('Завелика роздільність зображення.');
    const scale=Math.min(1,1900/Math.max(naturalW,naturalH));
    const width=Math.max(1,Math.round(naturalW*scale));
    const height=Math.max(1,Math.round(naturalH*scale));
    const canvas=document.createElement('canvas');
    canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d');
    if(!ctx)throw new Error('Браузер не зміг обробити файл.');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(image,0,0,width,height);
    return canvas.toDataURL('image/jpeg',0.91);
  }finally{
    URL.revokeObjectURL(url);
  }
}
function showScreenshot(key){
  const preview=$('#preview-'+key);
  preview.replaceChildren();
  if(!state.shots[key]){
    preview.hidden=true;
    return;
  }
  preview.hidden=false;
  const img=document.createElement('img');
  img.src=state.shots[key];
  img.alt=screenshotLabels[key];
  const footer=document.createElement('div');
  footer.className='upload-preview-footer';
  const filename=document.createElement('span');
  filename.textContent=state.fileNames[key]||'Зображення додано';
  const remove=document.createElement('button');
  remove.type='button';remove.className='upload-remove';remove.textContent='Видалити';
  remove.setAttribute('aria-label','Видалити '+screenshotLabels[key]);
  remove.addEventListener('click',()=>{
    delete state.shots[key];delete state.fileNames[key];
    const input=$('[data-shot="'+key+'"]');input.value='';
    showScreenshot(key);updateProgress();
  });
  footer.append(filename,remove);
  preview.append(img,footer);
}
function handleImages(){
  $$('[data-shot]').forEach(input=>{
    input.addEventListener('change',async()=>{
      const file=input.files&&input.files[0];
      if(!file)return;
      const key=input.dataset.shot;
      const label=input.closest('.upload-block');
      let error=$('.upload-error',label);
      if(error)error.remove();
      try{
        const data=await resizeFile(file);
        state.shots[key]=data;
        state.fileNames[key]=file.name;
        showScreenshot(key);
        updateProgress();
      }catch(err){
        error=document.createElement('p');
        error.className='upload-error';
        error.textContent=err instanceof Error ? err.message : 'Не вдалося обробити скриншот.';
        label.append(error);
      }
    });
  });
}
function downloadFile(filename,blob){
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=filename;a.style.display='none';
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
}
function safeFilename(name){
  return (name||'Студент').trim().replace(/[\\/:*?"<>|]/g,'').replace(/\s+/g,'_').slice(0,60);
}
function draftIO(){
  $('#saveDraft').addEventListener('click',()=>{
    const fields={};
    keys.forEach(k=>fields[k]=$('[data-field="'+k+'"]').value);
    const checks={};
    $$('[data-task]').forEach(box=>checks[box.dataset.task]=box.checked);
    const payload={kind:'TKOI-PRACTICAL-4-CANVA',version:1,saved:new Date().toISOString(),fields,checks,shots:state.shots,fileNames:state.fileNames};
    downloadFile('Практична_4_чернетка_'+safeFilename(fieldValue('studentName'))+'.json',
      new Blob([JSON.stringify(payload)],{type:'application/json;charset=utf-8'}));
    reportNotification('Чернетку збережено. Зберігайте JSON-файл до завершення роботи: він містить текст і додані скриншоти.','success');
  });
  $('#loadDraft').addEventListener('change',async e=>{
    const file=e.target.files?.[0];
    if(!file)return;
    try{
      if(file.size>30*1024*1024)throw new Error('Чернетка завелика.');
      const obj=JSON.parse(await file.text());
      if(!obj || obj.kind!=='TKOI-PRACTICAL-4-CANVA' || obj.version!==1)throw new Error('Це не чернетка практичної роботи №4.');
      if(!obj.fields || typeof obj.fields!=='object')throw new Error('У чернетці відсутні дані студента.');
      keys.forEach(k=>{
        if(typeof obj.fields[k]==='string')$('[data-field="'+k+'"]').value=obj.fields[k].slice(0,15000);
      });
      if(obj.checks && typeof obj.checks==='object')$$('[data-task]').forEach(box=>{box.checked=obj.checks[box.dataset.task]===true;});
      const incoming=obj.shots && typeof obj.shots==='object'?obj.shots:{};
      const names=obj.fileNames && typeof obj.fileNames==='object'?obj.fileNames:{};
      screenshotKeys.forEach(key=>{
        if(typeof incoming[key]==='string' && incoming[key].length<12000000 && /^data:image\/(?:jpeg|png|webp);base64,[\w+/=]+$/.test(incoming[key])){
          state.shots[key]=incoming[key];
          state.fileNames[key]=typeof names[key]==='string'?names[key].slice(0,120):'Відновлене зображення';
        }else{
          delete state.shots[key];delete state.fileNames[key];
        }
        showScreenshot(key);
      });
      safeStorageWrite();
      updateProgress();
      reportNotification('Чернетку успішно відновлено разом зі скриншотами.','success');
    }catch(err){
      reportNotification(err instanceof Error?err.message:'Не вдалося імпортувати файл.', 'warn');
    }finally{
      e.target.value='';
    }
  });
}
function node(tag,cls,text){
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  if(text!==undefined)el.textContent=text;
  return el;
}
function paragraph(label,value){
  const p=node('p','doc-field');
  const strong=node('strong','',label+' ');
  p.append(strong,document.createTextNode(value||'Не заповнено'));
  return p;
}
function buildReport(){
  const doc=$('#reportDocument');
  doc.replaceChildren();
  const header=node('header','doc-header');
  header.append(node('span','doc-kicker','ТКОІ · ГРАФІЧНІ РЕДАКТОРИ · CANVA'));
  header.append(node('h1','','ПРАКТИЧНА РОБОТА № 4'));
  header.append(node('h2','',THEME));
  doc.append(header);
  doc.append(paragraph('Тема:',THEME));
  doc.append(paragraph('Мета:',AIM));
  const student=node('div','doc-student');
  student.append(paragraph('Студент:',fieldValue('studentName')));
  student.append(paragraph('Група:',fieldValue('studentGroup')||'Не зазначено'));
  student.append(paragraph('Дата виконання:',fieldValue('studentDate')?niceDate(fieldValue('studentDate')):'Не зазначено'));
  doc.append(student);
  doc.append(node('h2','doc-section-title','ХІД ВИКОНАННЯ РОБОТИ'));
  stages.forEach(stage=>{
    const wrap=node('section','doc-stage');
    wrap.append(node('h3','',stage.name));
    wrap.append(node('p','doc-fixed-desc',stage.narrative));
    const detail=node('p','');
    detail.append(node('strong','','Опис виконаних дій: '),document.createTextNode(fieldValue(stage.note)||'Опис не додано.'));
    wrap.append(detail);
    const gallery=node('div','doc-images');
    if(stage.shots.length===1)gallery.classList.add('one-column');
    stage.shots.forEach(key=>{
      const figure=node('figure','doc-image');
      if(state.shots[key]){
        const image=document.createElement('img');
        image.src=state.shots[key];
        image.alt=screenshotLabels[key];
        figure.append(image);
      }else{
        figure.append(node('div','doc-missing','Зображення не додано.'));
      }
      figure.append(node('figcaption','',screenshotLabels[key]));
      gallery.append(figure);
    });
    wrap.append(gallery);
    doc.append(wrap);
  });
  doc.append(node('h2','doc-section-title','ВИСНОВОК'));
  doc.append(node('p','doc-conclusion',fieldValue('conclusion')||'Висновок не заповнено.'));
  const foot=node('div','doc-footer');
  foot.append(node('span','','Практична робота №4 · ТКОІ'));
  foot.append(node('span','','Canva · Графічний контент'));
  doc.append(foot);
}
async function waitForImages(root){
  await Promise.all($$('img',root).map(async img=>{
    if(img.complete)return;
    try{await img.decode();}catch(_){}
  }));
}
function reportModal(){
  const modal=$('#reportModal');
  function close(){
    modal.hidden=true;document.body.classList.remove('modal-open');
    if(lastFocus && typeof lastFocus.focus==='function')lastFocus.focus();
  }
  $('#generateReport').addEventListener('click',()=>{
    const s=status();
    buildReport();
    lastFocus=document.activeElement;
    modal.hidden=false;document.body.classList.add('modal-open');
    $('#modalTitle').textContent=s.missing.length?
      'Попередній перегляд · бракує '+s.missing.length+' елементів':
      'Звіт готовий до збереження';
    const print=$('#printReport');
    print.disabled=s.missing.length>0;
    print.title=s.missing.length?
      'Заповніть усі обов’язкові поля та додайте всі 6 скриншотів, щоб зберегти PDF.':'Відкрити діалог друку та вибрати «Зберегти як PDF»';
    print.style.opacity=s.missing.length?'.45':'1';
    print.style.cursor=s.missing.length?'not-allowed':'pointer';
    $('#closeReport').focus();
    if(s.missing.length){
      reportNotification('Звіт можна переглянути, але PDF стане доступним, коли додасте: '+s.missing.join(', ')+'.');
    }else{
      $('#validationMessage').textContent='';
      $('#validationMessage').className='validation-message';
    }
  });
  $('#closeReport').addEventListener('click',close);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape' && !modal.hidden)close();
  });
  $('#printReport').addEventListener('click',async()=>{
    const s=status();
    if(s.missing.length)return;
    buildReport();
    await waitForImages($('#reportDocument'));
    window.print();
  });
}
function initNavigation(){
  const btn=$('#menuButton'), nav=$('#siteNav');
  btn.addEventListener('click',()=>{
    const open=nav.classList.toggle('open');
    btn.setAttribute('aria-expanded',String(open));
  });
  $$('.nav-item').forEach(link=>link.addEventListener('click',()=>{
    nav.classList.remove('open');
    btn.setAttribute('aria-expanded','false');
  }));
  const line=$('#readingLine');
  let scheduled=false;
  function update(){
    const max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
    line.style.width=(Math.min(100,Math.max(0,window.scrollY/max*100)))+'%';
    scheduled=false;
  }
  window.addEventListener('scroll',()=>{
    if(!scheduled){scheduled=true;requestAnimationFrame(update);}
  },{passive:true});
  window.addEventListener('resize',update);
  update();
  if('IntersectionObserver' in window){
    const links=$$('.nav-item');
    const obs=new IntersectionObserver(entries=>{
      const entry=entries.filter(x=>x.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];
      if(!entry)return;
      links.forEach(link=>{
        const match=link.getAttribute('href')==='#'+entry.target.id;
        link.classList.toggle('active',match);
        if(match)link.setAttribute('aria-current','location');
        else link.removeAttribute('aria-current');
      });
    },{rootMargin:'-15% 0px -65% 0px'});
    $$('main [id]').filter(el=>['intro','brief','stage-1','stage-2','stage-3','stage-4','report','rubric'].includes(el.id)).forEach(el=>obs.observe(el));
  }
}
function initialize(){
  restoreText();
  keys.forEach(key=>{
    const el=$('[data-field="'+key+'"]');
    el.addEventListener('input',()=>{safeStorageWrite();updateProgress();});
    el.addEventListener('change',()=>{safeStorageWrite();updateProgress();});
  });
  $$('[data-task]').forEach(input=>input.addEventListener('change',safeStorageWrite));
  handleImages();
  draftIO();
  reportModal();
  initNavigation();
  safeStorageWrite();
  updateProgress();
}
document.addEventListener('DOMContentLoaded',initialize);
