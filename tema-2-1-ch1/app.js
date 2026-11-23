'use strict';

// Interactions intentionally run entirely in the browser.
// The page collects no student data and makes no network requests for quiz answers.
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

(function initReadingProgress() {
  const bar = $('#readingProgress');
  const fill = $('#sideFill');
  const percent = $('#sidePercent');
  let ticking = false;
  const update = () => {
    const total = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const value = Math.round(Math.max(0, Math.min(100, window.scrollY / total * 100)));
    bar.style.width = value + '%';
    fill.style.width = value + '%';
    percent.textContent = value + '%';
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
  const nav = $$('.navlink');
  const byId = new Map(nav.map(link => [link.getAttribute('href').slice(1), link]));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const candidates = entries.filter(entry => entry.isIntersecting);
      if (!candidates.length) return;
      candidates.sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top);
      const chosen = byId.get(candidates[0].target.id);
      if (!chosen) return;
      nav.forEach(link => {
        const active = link === chosen;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-12% 0px -70% 0px', threshold: 0 });
    $$('main section[id]').forEach(section => observer.observe(section));
  }
})();

(function initLayoutControls() {
  const menuButton = $('#menuToggle');
  const sidebar = $('#sidebar');
  const closeMenu = () => {
    sidebar.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  };
  menuButton.addEventListener('click', () => {
    const willOpen = !sidebar.classList.contains('open');
    sidebar.classList.toggle('open', willOpen);
    menuButton.setAttribute('aria-expanded', String(willOpen));
  });
  $$('.navlink').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') closeMenu(); });
  const mode = $('#teacherMode');
  mode.addEventListener('click', () => {
    const enabled = document.body.classList.toggle('projector');
    mode.setAttribute('aria-pressed', String(enabled));
    mode.title = enabled ? 'Повернути звичайний розмір тексту' : 'Збільшити текст для демонстрації';
  });
  $('#printLecture').addEventListener('click', () => window.print());
})();

(function initRasterVectorDemo() {
  const canvas = $('#pixelCanvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    for (let y = 0; y < 48; y++) {
      for (let x = 0; x < 48; x++) {
        const dx = x - 23.5, dy = y - 23.5;
        const r = Math.hypot(dx,dy);
        const a = Math.atan2(dy,dx);
        const starBoundary = 15 + 5.8 * Math.cos(8 * a);
        const ringBoundary = 4.1 + .35 * Math.sin(a * 9);
        let color;
        if (r < ringBoundary) color = '#132019';
        else if (r < starBoundary) {
          const g = Math.floor(220 + (x/48) * 28);
          color = 'rgb(' + Math.floor(187+(x/48)*38) + ',' + g + ',' + Math.floor(101+(y/48)*22) + ')';
        } else {
          const shade = Math.floor(24 + (x+y) / 96 * 37);
          color = 'rgb(' + shade + ',' + (shade+18) + ',' + shade + ')';
        }
        ctx.fillStyle = color;
        ctx.fillRect(x,y,1,1);
      }
    }
  }
  const slider = $('#zoomRange');
  const render = () => {
    const value = Number(slider.value);
    $('#zoomValue').textContent = value.toLocaleString('uk-UA') + '×';
    const scale = 'scale(' + value + ')';
    canvas.style.transform = scale;
    $('#vectorDemo').style.transform = scale;
  };
  slider.addEventListener('input', render);
  render();
})();

(function initResolutionCalculator() {
  const width = $('#imgWidth'), height = $('#imgHeight'), ppi = $('#imgPpi');
  const number = n => new Intl.NumberFormat('uk-UA',{maximumFractionDigits:1}).format(n);
  const gcd = (a,b) => { while (b) [a,b] = [b,a%b]; return a; };
  const calculate = () => {
    const w = Number(width.value), h = Number(height.value), density = Number(ppi.value);
    if (!(w > 0 && h > 0 && density > 0 && Number.isInteger(w) && Number.isInteger(h))) {
      $('#calcMp').textContent = '—';
      $('#calcSize').textContent = '—';
      $('#calcRatio').textContent = '—';
      $('.calc-decor').innerHTML = '—<span>MP</span>';
      return;
    }
    const mp = (w*h)/1000000;
    const divisor = gcd(w,h);
    $('#calcMp').textContent = number(mp) + ' Мп';
    $('#calcSize').textContent = number(w/density*2.54) + ' × ' + number(h/density*2.54) + ' см';
    $('#calcRatio').textContent = (w/divisor) + ' : ' + (h/divisor);
    $('.calc-decor').innerHTML = number(mp) + '<span>MP</span>';
  };
  [width,height,ppi].forEach(input => input.addEventListener('input',calculate));
  calculate();
})();

(function initColorLab() {
  const input = $('#colorPicker'), sample = $('#colorSample');
  const render = () => {
    const hex = input.value.toUpperCase();
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    sample.style.backgroundColor = hex;
    const luminance = [r,g,b].map(v => {
      const c = v/255;
      return c <= .04045 ? c/12.92 : Math.pow((c+.055)/1.055,2.4);
    });
    const L = luminance[0]*.2126 + luminance[1]*.7152 + luminance[2]*.0722;
    sample.style.color = L > .18 ? '#141a14' : '#fff';
    $('#colorHex').textContent = hex;
    $('#colorRgb').textContent = 'RGB(' + r + ', ' + g + ', ' + b + ')';
  };
  input.addEventListener('input',render);
  render();
})();

(function initPhotoEditor() {
  const sliders = [
    {id:'brightnessRange', out:'brightnessOut', name:'brightness'},
    {id:'contrastRange',out:'contrastOut',name:'contrast'},
    {id:'saturationRange',out:'saturationOut',name:'saturate'}
  ];
  const preview = $('#photoPreview');
  const update = () => {
    const rules = sliders.map(item => {
      const val = $('#' + item.id).value;
      $('#' + item.out).textContent = val + '%';
      return item.name + '(' + val + '%)';
    });
    preview.style.filter = rules.join(' ');
  };
  sliders.forEach(item => $('#' + item.id).addEventListener('input', update));
  $('#photoReset').addEventListener('click', () => {
    sliders.forEach(item => { $('#' + item.id).value = '100'; });
    update();
  });
  update();
  const thirds = $('#thirdsToggle');
  thirds.addEventListener('change', () => {
    $('#thirdsGrid').classList.toggle('is-hidden', !thirds.checked);
  });
})();

(function initCases() {
  $$('.case-card').forEach(card => {
    const button = $('.reveal-button',card);
    const answer = $('.case-answer',card);
    button.addEventListener('click', () => {
      const opening = answer.hidden;
      answer.hidden = !opening;
      button.setAttribute('aria-expanded',String(opening));
      $('span',button).textContent = opening ? '−' : '+';
    });
  });
})();

(function initQuiz() {
  const questions = [
    {
      q:'Що є основою растрового зображення?',
      options:['Криві Безьє','Піксельна сітка','Лише текстові символи','Аудіодоріжки'],
      answer:1,
      why:'Растрове зображення складається із пікселів, кожен із яких містить інформацію про колір.'
    },
    {
      q:'Який тип графіки зазвичай найзручніший для масштабованого логотипу?',
      options:['Векторний','Растровий JPG','Скан у низькій роздільності','Будь-який, якщо змінити розширення'],
      answer:0,
      why:'Векторні контури перераховуються при масштабуванні й зберігають точність геометрії.'
    },
    {
      q:'Скільки мегапікселів має зображення 3000 × 2000 px?',
      options:['3 Мп','5 Мп','6 Мп','12 Мп'],
      answer:2,
      why:'3000 × 2000 = 6 000 000 пікселів, тобто 6 мегапікселів.'
    },
    {
      q:'Що найточніше означає PPI?',
      options:['Кількість кольорів у знімку','Щільність пікселів на дюйм','Розмір файлу в мегабайтах','Швидкість експорту'],
      answer:1,
      why:'PPI — pixels per inch; для друку воно описує розміщення пікселів зображення на одному дюймі.'
    },
    {
      q:'Яку модель найчастіше застосовують для відображення кольорів на екрані?',
      options:['CMYK','Pantone як єдиний варіант','RGB','Лише градації сірого'],
      answer:2,
      why:'Екран формує колір світлом — поєднанням червоного, зеленого й синього каналів.'
    },
    {
      q:'Який формат найчастіше доречний для скриншота з дрібним текстом?',
      options:['PNG','MP3','JPG із максимальним стисненням','DOCX'],
      answer:0,
      why:'PNG використовує безвтратне стиснення, що допомагає зберігати чіткі контури тексту.'
    },
    {
      q:'Чи можна автоматично отримати вектор із JPG, просто перейменувавши файл на .svg?',
      options:['Так, завжди','Так, якщо JPG великий','Ні, потрібен геометричний опис або трасування','Так, якщо зображення кольорове'],
      answer:2,
      why:'Перейменування розширення не змінює внутрішню структуру растрових даних на векторні контури.'
    },
    {
      q:'У чому перевага неруйнівного редагування фотографій?',
      options:['Воно завжди зменшує файл до 1 КБ','Дає змогу змінювати корекції та повертатися до оригіналу','Забороняє використання масок','Автоматично виправляє всі помилки'],
      answer:1,
      why:'Коригувальні шари, маски й параметричні налаштування дозволяють редагувати без незворотної зміни вихідних пікселів.'
    },
    {
      q:'Що слід зробити перед підготовкою фотографії до професійного друку?',
      options:['Лише поміняти розширення на TIFF','Поставити будь-яке значення 300 DPI в метаданих','Ігнорувати колірний профіль','З’ясувати вимоги друкарні щодо розміру, щільності й профілю'],
      answer:3,
      why:'Якісний друк потребує відповідної кількості пікселів, узгоджених розмірів і параметрів кольору.'
    },
    {
      q:'Як відповідально використати чужу фотографію у своєму проєкті?',
      options:['Взяти будь-яку без посилання, якщо вона в інтернеті','Видалити водяний знак','Перевірити ліцензію, умови використання й потрібну атрибуцію','Змінити контраст, щоб авторство зникло'],
      answer:2,
      why:'Знаходження зображення у відкритому доступі не дорівнює дозволу на будь-яке використання.'
    }
  ];

  const list = $('#quizList'), counter = $('#quizCounter'), result = $('#quizResult');
  const elements = [];
  questions.forEach((question,index) => {
    const outer = document.createElement('article');
    outer.className = 'quiz-question';
    const title = document.createElement('h4');
    const num = document.createElement('span');
    num.textContent = String(index+1).padStart(2,'0') + '.';
    title.append(num, document.createTextNode(question.q));
    outer.append(title);
    const options = document.createElement('div');
    options.className = 'quiz-options';
    question.options.forEach((answerText,answerIndex) => {
      const label = document.createElement('label');
      label.className = 'quiz-option';
      const input = document.createElement('input');
      input.type='radio';
      input.name='quiz-'+index;
      input.value=String(answerIndex);
      input.addEventListener('change',updateCounter);
      label.append(input,document.createTextNode(answerText));
      options.append(label);
    });
    const explanation = document.createElement('div');
    explanation.className = 'quiz-feedback';
    explanation.hidden = true;
    outer.append(options,explanation);
    list.append(outer);
    elements.push({outer,explanation});
  });

  function updateCounter() {
    const answered = questions.reduce((n,q,i) => n + (list.querySelector('input[name="quiz-'+i+'"]:checked') ? 1 : 0), 0);
    counter.textContent = answered + ' / ' + questions.length;
  }

  $('#checkQuiz').addEventListener('click',() => {
    let score=0, answered=0;
    questions.forEach((question,index) => {
      const chosen = list.querySelector('input[name="quiz-'+index+'"]:checked');
      if (chosen) answered++;
      const correct = chosen && Number(chosen.value) === question.answer;
      if (correct) score++;
      const explanation = elements[index].explanation;
      explanation.hidden = false;
      explanation.className = 'quiz-feedback ' + (correct ? 'correct' : 'incorrect');
      explanation.replaceChildren();
      const heading = document.createElement('strong');
      heading.textContent = correct ? '✓ Правильно' : (chosen ? '✕ Неправильно' : '○ Відповідь не вибрано');
      const detail = document.createElement('span');
      detail.textContent = 'Правильна відповідь: ' + question.options[question.answer] + '. ' + question.why;
      explanation.append(heading,detail);
    });
    const partial = answered < questions.length ? ' Ви відповіли на ' + answered + ' із ' + questions.length + ' запитань.' : '';
    result.textContent = 'Результат: ' + score + ' / ' + questions.length + '.' + partial + (score===questions.length ? ' Відмінно — усі відповіді правильні!' : ' Перегляньте пояснення та спробуйте ще раз.');
    result.className = 'quiz-result ' + (score === questions.length ? 'good' : 'review');
    result.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
  });

  $('#resetQuiz').addEventListener('click',() => {
    $$('input[type=radio]',list).forEach(input => {input.checked=false;});
    elements.forEach(item => {item.explanation.hidden=true;item.explanation.textContent='';});
    result.textContent='';
    result.className='quiz-result';
    updateCounter();
    $('#quiz').scrollIntoView({behavior:'smooth',block:'start'});
  });
  updateCounter();
})();
