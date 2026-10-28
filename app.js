/* ============================================================
   JOY TOWN — interactions
   ============================================================ */
(() => {
'use strict';

/* ---------- إعدادات السيرفر: غيّرها هنا ---------- */
const CONFIG = {
  // معرف السيرفر في FiveM (ضع كود cfx.re مثل cfx.re/join/xxxxxx أو اترك الـ IP)
  cfxId: '',                              // كود Cfx.re لجلب اللاعبين وحالة السيرفر فورياً
  server: 'joytown.roleplay.gg:30120',   // عنوان أو IP سيرفر FiveM
  
  // إعدادات الديسكورد وتوثيق الاختبار والرتب التلقائية
  discordClientId: '1564789731093389384',
  discordRoleId: '',
  streamerRoleId: '1564621532683046983', // رتبة الستريمر
  discordBotToken: '',                    // (اختياري) بوت توكن ديسكورد لمنح الرتبة مباشرة عبر Discord API
  discordGuildId: '1564620473990516788',
  discord: 'https://discord.gg/joytown',  // رابط دعوة الديسكورد
  store: 'https://joytown.store',         // رابط المتجر
  discordWebhook: 'https://discord.com/api/webhooks/1564635174518526013/DMLhIEXjiDb4lmJM_o5f_-tuHfb4_FKq4vpWzunsl46PH_iU6a87ULe6JP5pWOQxgzv6', // رابط Webhook استلام التقديمات والقصص
  // حالة السيرفر وعدد اللاعبين:
  serverStatus: {
    status: 'offline',     // الحالة: 'offline' (مغلق) | 'online' (يعمل) | 'restarting' (ريستارت)
    players: 0,           // عدد اللاعبين الحالي (يبدأ بـ 0 ويتحدث حقيقياً)
    maxPlayers: 64,       // الحد الأقصى للاعبين
    autoFetch: true,       // فحص وتحديث تلقائي من السيرفر
    refreshInterval: 15000 // فحص وتحديث تلقائي كل 15 ثانية
  },
  // قائمة صناع المحتوى والستريمرز في السيرفر (فارغة حتى تضيف صناع المحتوى المعتمدين)
  streamers: []
};

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad3 = n => String(Math.round(n)).padStart(3, '0');

const showToast = msg => {
  const toast = $('.toast');
  if (!toast) return;
  toast.hidden = false;
  toast.textContent = msg;
  requestAnimationFrame(() => toast.classList.add('show'));
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toast.hidden = true; }, 400);
  }, 2400);
};
/* ============================================================
   1) روابط الإعدادات
   ============================================================ */
function applyConfig() {
  $$('[data-server-link]').forEach(el => { el.href = `fivem://connect/${CONFIG.server}`; });
  $$('[data-server-ip]').forEach(el => { el.textContent = CONFIG.server; });
  $$('[data-discord]').forEach(el => { el.href = CONFIG.discord; });
  $$('[data-store]').forEach(el => { el.href = CONFIG.store; });
}

/* ============================================================
   2) شاشة الافتتاح (Intro)
   ============================================================ */
function runIntro() {
  const intro = $('#intro');
  if (!intro) return;
  const bar      = $('.intro-loading-line span', intro);
  const barWrap  = $('.intro-loading-line', intro);
  const percent  = $('.intro-percent', intro);
  const status   = $('.intro-load-status', intro);
  const titles   = $$('.intro-title', intro);
  const skipBtn  = $('.intro-skip', intro);

  const stages = [
    [0,   'PAVING THE STREETS'],
    [30,  'TURNING ON THE LIGHTS'],
    [60,  'WAKING THE CITY'],
    [85,  'OPENING THE GATES']
  ];
  let finished = false;
  let timers = [];

  const finish = () => {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    document.body.classList.remove('intro-active');
    document.body.classList.add('intro-done');
    window.scrollTo({ top: 0, behavior: 'auto' });
    setTimeout(() => { intro.style.display = 'none'; }, 1400);
  };

  if (reduced) { finish(); return; }

  const DURATION = 1500;
  const start = performance.now();

  const tick = now => {
    const p = Math.min(1, (now - start) / DURATION);
    const eased = 1 - Math.pow(1 - p, 2.2);
    const value = eased * 100;
    bar.style.width = value + '%';
    percent.textContent = pad3(value);
    barWrap.setAttribute('aria-valuenow', Math.round(value));
    for (const [th, label] of stages) {
      if (value >= th) status.textContent = label;
    }
    if (p < 1 && !finished) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // بعد اكتمال التحميل: يختفي الشعار وتظهر العناوين بالتتابع
  timers.push(setTimeout(() => intro.classList.add('phase-titles'), 1550));

  titles.forEach((t, i) => {
    const cueIn = 1750 + i * 390;
    timers.push(setTimeout(() => {
      t.classList.remove('cue-out');
      t.classList.add('cue-in');
    }, cueIn));
    timers.push(setTimeout(() => {
      t.classList.remove('cue-in');
      t.classList.add('cue-out');
    }, cueIn + 560));
  });

  timers.push(setTimeout(finish, 4050));
  skipBtn.addEventListener('click', finish);
}

/* ============================================================
   3) القائمة + الهيدر
   ============================================================ */
function initNav() {
  const toggle = $('.menu-toggle');
  const nav = $('#site-nav');
  const backdrop = $('.menu-backdrop');
  if (!toggle || !nav) return;

  const setOpen = open => {
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
    backdrop.setAttribute('aria-hidden', String(!open));
    nav.setAttribute('aria-hidden', String(!open && window.innerWidth <= 980));
  };

  toggle.addEventListener('click', () => setOpen(!document.body.classList.contains('nav-open')));
  backdrop.addEventListener('click', () => setOpen(false));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });

  const header = $('.site-header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ============================================================
   4) الهيرو: تبادل الشخصيات + تشغيل تلقائي
   ============================================================ */
const SCENES = [
  { name: 'POLICE',   tag: 'THE LAW',   ar: 'القانون هنا ليس اقتراحاً.',        desc: 'ارتدِ الزي، احمِ الشوارع، وكن الخط الأخير بين المدينة والفوضى.' },
  { name: 'MEDIC',    tag: 'THE HOPE',  ar: 'كل ثانية قد تغيّر مصير أحدهم.',    desc: 'من الإسعاف الميداني إلى غرف العمليات، أنت من يمنحهم وقتاً إضافياً.' },
  { name: 'CRIMINAL', tag: 'THE RISK',  ar: 'كل قرار له ثمن.',                 desc: 'حياة سريعة، اختيارات ثقيلة، وسمعة تُبنى خطوةً خطوة أو تُهدم.' },
  { name: 'CITIZEN',  tag: 'THE DREAM', ar: 'المدينة تحتاج إلى أحلامك.',        desc: 'ابدأ بسيارتك الصغيرة، افتح مشروعاً، واكتب اسمك في شوارعها.' }
];

function initHero() {
  const choices = $$('.character-choice');
  const layers = $$('.character-layer');
  const progress = $('.chapter-progress span');
  const currentEl = $('.chapter-current');
  const statusEl = $('.scene-status');
  const arEl = $('[data-scene-arabic]');
  const descEl = $('[data-scene-description]');
  const story = $('.hero-story');
  const idName = $('[data-identity-name]');
  const idTag = $('[data-identity-tag]');
  const numEl = $('[data-scene-number]');
  if (!choices.length) return;

  let index = 0;
  let playing = !reduced;
  let startTime = performance.now();
  const PERIOD = 6200;

  const apply = (i, announce = true) => {
    index = (i + SCENES.length) % SCENES.length;
    const s = SCENES[index];

    choices.forEach((b, k) => {
      b.classList.toggle('active', k === index);
      b.setAttribute('aria-pressed', String(k === index));
    });
    layers.forEach((l, k) => l.classList.toggle('is-active', k === index));
    currentEl.textContent = String(index + 1).padStart(2, '0');

    story.classList.add('switching');
    idName.classList.add('switching');
    numEl.classList.add('switching');
    setTimeout(() => {
      arEl.textContent = s.ar;
      descEl.textContent = s.desc;
      idName.textContent = s.name;
      idTag.textContent = s.tag;
      numEl.textContent = String(index + 1).padStart(2, '0');
      story.classList.remove('switching');
      idName.classList.remove('switching');
      numEl.classList.remove('switching');
    }, 260);

    if (announce && statusEl) statusEl.textContent = `الشخصية ${index + 1} من ${SCENES.length}: ${s.name}`;
    startTime = performance.now();
  };

  choices.forEach((b, k) => b.addEventListener('click', () => apply(k)));

  const loop = now => {
    if (playing) {
      const p = Math.min(1, (now - startTime) / PERIOD);
      progress.style.transform = `scaleX(${p})`;
      if (p >= 1) apply(index + 1);
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) playing = false;
    else if (!reduced) { playing = true; startTime = performance.now(); }
  });

  // محاكاة المؤشر داخل الهيرو
  const hero = $('.hero');
  if (hero && !reduced) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - .5) * 26;
      const y = ((e.clientY - r.top) / r.height - .5) * 18;
      hero.style.setProperty('--pointer-x', x.toFixed(1) + 'px');
      hero.style.setProperty('--pointer-y', y.toFixed(1) + 'px');
    });
    hero.addEventListener('pointerleave', () => {
      hero.style.setProperty('--pointer-x', '0px');
      hero.style.setProperty('--pointer-y', '0px');
    });
  }
}

/* ============================================================
   5) كشف العناصر عند التمرير + عدّادات الأرقام
   ============================================================ */
function initReveal() {
  const items = $$('[data-reveal]');
  const counters = $$('[data-count]');

  if (!('IntersectionObserver' in window) || reduced) {
    items.forEach(el => el.classList.add('is-visible'));
    counters.forEach(el => { el.textContent = el.dataset.count + (el.dataset.suffix || ''); });
    return;
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-visible');
      io.unobserve(en.target);
    });
  }, { threshold: .16, rootMargin: '0px 0px -60px' });
  items.forEach(el => io.observe(el));

  const countIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      countIO.unobserve(el);
      const target = +el.dataset.count;
      const suffix = el.dataset.suffix || '';
      if (!target || target <= 0) {
        el.textContent = '0' + suffix;
        return;
      }
      const dur = 1500;
      const t0 = performance.now();
      const step = now => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: .5 });
  counters.forEach(el => countIO.observe(el));
}

/* ============================================================
   6) بطاقة القصة (Dialog)
   ============================================================ */
const STORY_DATA = {
  police: {
    title: 'POLICE',
    eyebrow: 'PROTECT THE CITY',
    desc: 'قسم الشرطة في JOY TOWN هو الخط الأول لحفظ النظام: دوريات ليلية، تحقيقات، ومطاردات تُكتب في سجل المدينة. ارتقِ من كاديت إلى قائد، وخُذ قرارات تحسم مصير شوارعها.',
    paths: ['سجّل في أكاديمية الشرطة', 'اجتز امتحان الرخصة والتدريب', 'انضم لوحدة الدوريات الليلية']
  },
  medic: {
    title: 'MEDIC',
    eyebrow: 'EVERY BREATH MATTERS',
    desc: 'الفريق الطبي هو من يوقف عقارب الوقت حين تشتد المخاطر: إسعاف ميداني، غرف عمليات، وإدارة مستشفى المدينة. كل نداء استجابة تصنع فرقاً حقيقياً في حياة اللاعبين.',
    paths: ['قدّم طلب التحاق بالطوارئ', 'تدرّب على الإسعاف الميداني', 'اعمل في غرف العمليات']
  },
  criminal: {
    title: 'CRIMINAL',
    eyebrow: 'RISK EVERYTHING',
    desc: 'الطريق الآخر في المدينة يبدأ بخطوة صغيرة وينتهي بسمعة يتناقلها الجميع: اجمع فريقك، خطّط لعملياتك، واعرف متى تنسحب. القوانين هنا ثقيلة، لكن المخاطرة أغلى.',
    paths: ['اجمع فريقاً تثق به', 'ابدأ بالمهام الصغيرة لبناء السمعة', 'ارتقِ في عالم الجريمة المنظمة']
  },
  citizen: {
    title: 'CITIZEN',
    eyebrow: 'BUILD FROM ZERO',
    desc: 'إن لم تكن شرطياً ولا طبيباً ولا مجرماً، فالبلد ما زال يناديك: افتح محلاً، أسّس شركة، امتلك بيتاً وسيارة، وابنِ حياة يسجلها الآخرون قصصاً. فرص لا تنتهي لمن يصنعها.',
    paths: ['اختر وظيفتك وابدأ العمل', 'افتح مشروعاً الخاص بك', 'اشترِ بيتك واكتب حكايتك']
  }
};

function initStoryDialog() {
  const dlg = $('.story-dialog');
  if (!dlg) return;
  const titleEl = $('#story-detail-title');
  const descEl = $('#story-detail-description');
  const eyebrowEl = $('.story-detail-eyebrow', dlg);
  const pathsEl = $('[data-story-paths]', dlg);
  const ctaBtn = $('[data-story-cta]', dlg);
  const closeBtn = $('.story-close', dlg);

  let lastFocus = null;

  const open = key => {
    const data = STORY_DATA[key];
    if (!data) return;
    lastFocus = document.activeElement;
    titleEl.textContent = data.title;
    eyebrowEl.textContent = data.eyebrow;
    descEl.textContent = data.desc;

    pathsEl.innerHTML = '';
    (data.paths || []).forEach((p, i) => {
      const li = document.createElement('li');
      const b = document.createElement('b');
      b.textContent = '0' + (i + 1);
      const span = document.createElement('span');
      span.textContent = p;
      li.append(b, span);
      pathsEl.appendChild(li);
    });

    dlg.classList.remove('flipped');
    dlg.showModal();
    requestAnimationFrame(() => dlg.classList.add('open-anim'));
  };

  const close = () => {
    dlg.classList.remove('open-anim');
    dlg.close();
    if (lastFocus) lastFocus.focus();
  };

  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      close();
      const applySec = $('#apply');
      if (applySec) {
        setTimeout(() => applySec.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }), 140);
      }
    });
  }

  $$('[data-story]').forEach(btn => btn.addEventListener('click', () => open(btn.dataset.story)));
  $$('[data-story-open]').forEach(btn => btn.addEventListener('click', () => open(btn.dataset.storyOpen)));
  closeBtn.addEventListener('click', close);
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
}

/* ============================================================
   7) الاختبار الالكتروني: تسجيل الدخول بديسكورد + تأكيد القوانين + التقديم والرتبة
   ============================================================ */
function initApplyForm() {
  const card = $('.apply-card');
  if (!card) return;
  const form = $('.story-form', card);
  const errorEl = $('[data-form-error]', card);
  const successEl = $('[data-form-success]', card);
  const submitBtn = $('.form-submit', card);
  const submitLabel = $('[data-submit-label]', card);
  const doneBtn = $('.form-done', card);

  // حالة المستخدم في ديسكورد
  let currentDiscordUser = null;
  let isRulesConfirmed = false;
  const STORAGE_KEY = 'joytown_discord_user';

  // استرجاع الحساب المحفوظ مسبقاً
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) currentDiscordUser = JSON.parse(saved);
  } catch (_) {}

// تحديث حالة القفل والضبابية لكل خطوة
  const updateStepPanes = () => {
    const pane1 = $('[data-step-pane="1"]', card);
    const pane2 = $('[data-step-pane="2"]', card);
    const pane3 = $('[data-step-pane="3"]', card);

    const status1 = $('[data-step-status="1"]', card);
    const status2 = $('[data-step-status="2"]', card);
    const status3 = $('[data-step-status="3"]', card);

    const lockIcon = '<svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>';
    const checkIcon = '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
    const dotIcon = '<svg viewBox="0 0 24 24" width="8" height="8" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="5"/></svg>';

    // الخطوة 1
    if (currentDiscordUser) {
      if (pane1) { pane1.classList.remove('is-active', 'is-locked'); pane1.classList.add('is-completed'); }
      if (status1) { status1.className = 'step-pane-status is-completed'; status1.innerHTML = `${checkIcon} <span>مكتملة</span>`; }
    } else {
      if (pane1) { pane1.classList.remove('is-completed', 'is-locked'); pane1.classList.add('is-active'); }
      if (status1) { status1.className = 'step-pane-status is-active'; status1.innerHTML = `${dotIcon} <span>الخطوة الحالية</span>`; }
    }

    // الخطوة 2
    if (!currentDiscordUser) {
      if (pane2) { pane2.classList.remove('is-active', 'is-completed'); pane2.classList.add('is-locked'); }
      if (status2) { status2.className = 'step-pane-status is-locked'; status2.innerHTML = `${lockIcon} <span>مقفلة</span>`; }
    } else if (isRulesConfirmed) {
      if (pane2) { pane2.classList.remove('is-active', 'is-locked'); pane2.classList.add('is-completed'); }
      if (status2) { status2.className = 'step-pane-status is-completed'; status2.innerHTML = `${checkIcon} <span>تم تأكيد القوانين</span>`; }
    } else {
      if (pane2) { pane2.classList.remove('is-locked', 'is-completed'); pane2.classList.add('is-active'); }
      if (status2) { status2.className = 'step-pane-status is-active'; status2.innerHTML = `${dotIcon} <span>الخطوة الحالية</span>`; }
    }

    // الخطوة 3
    if (!currentDiscordUser || !isRulesConfirmed) {
      if (pane3) { pane3.classList.remove('is-active', 'is-completed'); pane3.classList.add('is-locked'); }
      if (status3) { status3.className = 'step-pane-status is-locked'; status3.innerHTML = `${lockIcon} <span>مقفلة</span>`; }
    } else {
      if (pane3) { pane3.classList.remove('is-locked', 'is-completed'); pane3.classList.add('is-active'); }
      if (status3) { status3.className = 'step-pane-status is-active'; status3.innerHTML = `${dotIcon} <span>الخطوة الحالية</span>`; }
    }

    // تحديث شريط التوجيه العلوي
    $$('[data-step-indicator]', card).forEach(ind => {
      const s = parseInt(ind.dataset.stepIndicator, 10);
      ind.classList.remove('is-active', 'is-completed', 'is-locked');
      if (s === 1) {
        if (currentDiscordUser) ind.classList.add('is-completed'); else ind.classList.add('is-active');
      } else if (s === 2) {
        if (!currentDiscordUser) ind.classList.add('is-locked');
        else if (isRulesConfirmed) ind.classList.add('is-completed');
        else ind.classList.add('is-active');
      } else if (s === 3) {
        if (!currentDiscordUser || !isRulesConfirmed) ind.classList.add('is-locked');
        else ind.classList.add('is-active');
      }
    });
  };

// تحديث واجهة حساب الديسكورد
  const updateDiscordUI = () => {
    const guestBox = $('[data-discord-guest]', card);
    const userCard = $('[data-discord-user-card]', card);

    if (currentDiscordUser) {
      if (guestBox) guestBox.hidden = true;
      if (userCard) userCard.hidden = false;

      $$('[data-user-avatar]').forEach(img => { img.src = currentDiscordUser.avatar || 'LOGO.png'; });
      $$('[data-user-name]').forEach(el => { el.textContent = currentDiscordUser.name || currentDiscordUser.username; });
      $$('[data-user-tag]').forEach(el => { el.textContent = `@${currentDiscordUser.username} (ID: ${currentDiscordUser.id})`; });
    } else {
      if (guestBox) guestBox.hidden = false;
      if (userCard) userCard.hidden = true;
    }
    updateStepPanes();
  };

  // معالجة العودة من تسجيل دخول ديسكورد (Discord OAuth2 Implicit Grant)
  const handleDiscordOAuthHash = async () => {
    if (!window.location.hash || !window.location.hash.includes('access_token=')) return;
    try {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get('access_token');
      if (token) {
        const res = await fetch('https://discord.com/api/users/@me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const u = await res.json();
          const avatarUrl = u.avatar
            ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=256`
            : `https://cdn.discordapp.com/embed/avatars/${(parseInt(u.discriminator || '0', 10) || 0) % 5}.png`;
          
          currentDiscordUser = {
            id: u.id,
            username: u.username,
            name: u.global_name || u.username,
            avatar: avatarUrl
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(currentDiscordUser));
          history.replaceState(null, null, window.location.pathname + window.location.search);
          updateDiscordUI();
          if (typeof showToast === 'function') showToast(`مرحباً بك يا ${currentDiscordUser.name}! تم تسجيل الدخول بنجاح`);
          const pane2 = $('[data-step-pane="2"]', card);
          if (pane2) pane2.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    } catch (e) {
      console.warn('Discord OAuth error:', e);
    }
  };

  // تسجيل الدخول المباشر بالديسكورد الرسمي
  const loginBtn = $('[data-action-discord-login]', card);
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      const cid = (CONFIG.discordClientId || '').trim();
      if (!cid) {
        alert('لم يتم ضبط discordClientId في ملف app.js');
        return;
      }
      const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
      const authUrl = `https://discord.com/oauth2/authorize?client_id=${cid}&redirect_uri=${redirectUri}&response_type=token&scope=identify`;
      window.location.href = authUrl;
    });
  }

  // تأكيد القوانين وفتح الخطوة الثالثة
  const confirmRulesBtn = $('[data-btn-confirm-rules]', card);
  if (confirmRulesBtn) {
    confirmRulesBtn.addEventListener('click', () => {
      const checkboxes = $$('.rule-checkbox-item input', card);
      const allChecked = checkboxes.length && checkboxes.every(cb => cb.checked);
      if (!allChecked) {
        alert('يجب قراءة والموافقة على جميع بنود القوانين لتفعيل الخطوة الثالثة!');
        return;
      }
      isRulesConfirmed = true;
      updateStepPanes();
      if (typeof showToast === 'function') showToast('تم تأكيد القوانين وفتح الخطوة الثالثة');
      const pane3 = $('[data-step-pane="3"]', card);
      if (pane3) pane3.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  // تسجيل خروج وتبديل الحساب
  const logoutDiscord = () => {
    currentDiscordUser = null;
    isRulesConfirmed = false;
    localStorage.removeItem(STORAGE_KEY);
    updateDiscordUI();
    if (typeof showToast === 'function') showToast('تم تسجيل الخروج من حساب ديسكورد');
  };

  const logoutBtn = $('[data-action-discord-logout]', card);
  if (logoutBtn) logoutBtn.addEventListener('click', logoutDiscord);

  handleDiscordOAuthHash().then(() => {
    updateDiscordUI();
  });

  const showError = msg => {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  };
  const clearError = () => { errorEl.hidden = true; errorEl.textContent = ''; };

  const markField = (input, bad) => {
    const field = input.closest('.field');
    if (!field) return;
    field.classList.toggle('invalid', bad);
    if (bad) {
      field.classList.remove('shake');
      void field.offsetWidth;
      field.classList.add('shake');
    }
  };

  const validate = () => {
    const get = n => form.elements[n];
    const playerName = get('playerName').value.trim();
    const playerAge = parseInt(get('playerAge').value, 10);
    const charName = get('charName').value.trim();
    const charAge = parseInt(get('charAge').value, 10);
    const story = get('story').value.trim();

    const checks = [
      [get('playerName'), playerName.length >= 2, 'اكتب اسمك الكامل (حرفان على الأقل).'],
      [get('playerAge'), Number.isFinite(playerAge) && playerAge >= 13 && playerAge <= 99, 'عمرك يجب أن يكون بين 13 و 99.'],
      [get('charName'), charName.length >= 2, 'اكتب اسم الشخصية في السيرفر (حرفان على الأقل).'],
      [get('charAge'), Number.isFinite(charAge) && charAge >= 18 && charAge <= 99, 'عمر الشخصية يجب أن يكون بين 18 و 99.'],
      [get('story'), story.length >= 40, 'اكتب قصة الشخصية من سطرين على الأقل (40 حرفاً فأكثر).']
    ];

    let firstBad = null;
    checks.forEach(([input, ok, msg]) => {
      markField(input, !ok);
      if (!ok && !firstBad) firstBad = [input, msg];
    });

    if (firstBad) {
      showError(firstBad[1]);
      firstBad[0].focus();
      return null;
    }
    clearError();
    return { playerName, playerAge, charName, charAge, story };
  };

  /* ---- رسم صورة التقديم الفائقة وتضمين صورة واسم المتقدم بالديسكورد ---- */
  const renderApplicationShot = (data, discordUser) => new Promise(resolve => {
    try {
      const W = 920, PAD = 54;
      const cv = document.createElement('canvas');
      const ctx = cv.getContext('2d');
      if (!ctx) return resolve(null);

      const font = (weight, size) => `${weight} ${size}px "Segoe UI", Tahoma, Arial, sans-serif`;
      const accent = '#eeb71a';

      // تقسيم نص القصة لأسطر متناسقة
      ctx.font = font(400, 23);
      const textW = W - PAD * 2;
      const wrap = text => {
        const words = String(text).split(/\s+/);
        const lines = [];
        let line = '';
        for (const w of words) {
          const t = line ? line + ' ' + w : w;
          if (ctx.measureText(t).width > textW && line) { lines.push(line); line = w; }
          else line = t;
        }
        if (line) lines.push(line);
        return lines;
      };
      const storyLines = wrap(data.story);

      const H = 640 + storyLines.length * 38;
      const S = 2; // دقة مضاعفة فائقة الجودة
      cv.width = W * S;
      cv.height = H * S;
      ctx.scale(S, S);

      // الخلفية
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#151512');
      bg.addColorStop(1, '#0c0c09');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // الشريط الذهبي
      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, 8, H);

      const drawCard = (avatarImg) => {
        // بطاقة المتقدم في أعلى الصورة
        ctx.fillStyle = '#1c1c17';
        ctx.fillRect(PAD, 40, W - PAD * 2, 110);
        ctx.strokeStyle = '#2e2e24';
        ctx.lineWidth = 1;
        ctx.strokeRect(PAD, 40, W - PAD * 2, 110);

        // رسم صورة المتقدم الحقيقية (Avatar)
        const avX = W - PAD - 95, avY = 55, avR = 40;
        ctx.save();
        ctx.beginPath();
        ctx.arc(avX + avR, avY + avR, avR, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        if (avatarImg) {
          ctx.drawImage(avatarImg, avX, avY, avR * 2, avR * 2);
        } else {
          ctx.fillStyle = '#5865f2';
          ctx.fillRect(avX, avY, avR * 2, avR * 2);
        }
        ctx.restore();

        // إطار حول الصورة
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(avX + avR, avY + avR, avR, 0, Math.PI * 2);
        ctx.stroke();

        // اسم وحساب المتقدم بالديسكورد
        ctx.direction = 'rtl';
        ctx.textAlign = 'right';
        ctx.font = font(700, 24);
        ctx.fillStyle = '#f4f2ea';
        ctx.fillText(discordUser ? (discordUser.name || discordUser.username) : data.playerName, avX - 16, 88);

        ctx.font = font(600, 15);
        ctx.fillStyle = accent;
        ctx.fillText(`حساب ديسكورد: @${discordUser ? discordUser.username : 'applicant'} (ID: ${discordUser ? discordUser.id : 'N/A'})`, avX - 16, 118);

        // شارة اعتماد الرتبة
        ctx.fillStyle = 'rgba(16,185,129,0.15)';
        ctx.fillRect(PAD + 16, 68, 220, 36);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1;
        ctx.strokeRect(PAD + 16, 68, 220, 36);
        ctx.font = font(700, 14);
        ctx.fillStyle = '#10b981';
        ctx.textAlign = 'center';
        ctx.fillText('تم منح رتبة المواطن تلقائياً', PAD + 126, 91);

        // جدول بيانات التقديم
        ctx.direction = 'rtl';
        ctx.textAlign = 'right';
        let y = 196;
        ctx.font = font(700, 20);
        ctx.fillStyle = accent;
        ctx.fillText('بيانات الشخصية وملف التقديم', W - PAD, y);

        const rows = [
          ['اسم الشخصية في السيرفر', data.charName],
          ['عمر الشخصية', `${data.charAge} سنة`],
          ['اسم وعمر المتقدم الحقيقي', `${data.playerName} (${data.playerAge} سنة)`],
          ['قراءة وتأكيد القوانين', 'تمت الموافقة والتعهد بكافة القوانين والضوابط ']
        ];

        y += 44;
        rows.forEach(([label, value]) => {
          ctx.font = font(600, 18);
          ctx.fillStyle = '#8d8d95';
          ctx.fillText(label, W - PAD, y);
          ctx.font = font(700, 22);
          ctx.fillStyle = '#f4f2ea';
          ctx.fillText(value, W - PAD - 260, y);
          y += 50;
        });

        // خط فاصل
        ctx.beginPath();
        ctx.strokeStyle = '#2a2a20';
        ctx.moveTo(PAD, y);
        ctx.lineTo(W - PAD, y);
        ctx.stroke();

        // قصة الشخصية
        y += 34;
        ctx.font = font(700, 20);
        ctx.fillStyle = accent;
        ctx.fillText('قصة حياة الشخصية وخلفيتها', W - PAD, y);

        ctx.font = font(400, 22);
        ctx.fillStyle = '#d7d5cc';
        let sy = y + 42;
        storyLines.forEach(ln => {
          ctx.fillText(ln, W - PAD, sy);
          sy += 38;
        });

        // تذييل الصورة
        ctx.font = font(600, 14);
        ctx.fillStyle = '#6b6b60';
        ctx.fillText('JOY TOWN ROLEPLAY • OFFICIAL CITIZEN APPLICATION • ' + new Date().toLocaleDateString('ar-EG'), W - PAD, H - 30);

        cv.toBlob(b => resolve(b), 'image/png');
      };

      if (discordUser && discordUser.avatar) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => drawCard(img);
        img.onerror = () => drawCard(null);
        img.src = discordUser.avatar;
      } else {
        drawCard(null);
      }
    } catch (_) {
      resolve(null);
    }
  });

  const sendToDiscord = async (payload, shot) => {
    if (!CONFIG.discordWebhook) {
      throw new Error('لم يُضبط رابط الديسكورد بعد — أضِف CONFIG.discordWebhook في ملف app.js');
    }
    const fd = new FormData();
    fd.append('payload_json', JSON.stringify(payload));
    if (shot) fd.append('files[0]', shot, 'joytown-application.png');
    const res = await fetch(CONFIG.discordWebhook, { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Discord responded with ' + res.status);
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!currentDiscordUser) {
      alert('يجب تسجيل الدخول بحساب ديسكورد أولاً!');
      const pane1 = $('[data-step-pane="1"]', card);
      if (pane1) pane1.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!isRulesConfirmed) {
      alert('يجب تأكيد وقبول القوانين في الخطوة الثانية أولاً!');
      const pane2 = $('[data-step-pane="2"]', card);
      if (pane2) pane2.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const data = validate();
    if (!data) return;

    const roleMention = CONFIG.discordRoleId ? `<@&${CONFIG.discordRoleId}>` : '`[مواطن معتمد / Whitelisted]`';

    /* تجهيز رسالة الديسكورد والامبيد الغني بالصورة والاسم والحساب والرتبة */
    const payload = {
      username: 'JOY TOWN — نظام التقديم والرتب',
      content: `**تقديم شخصية جديد ومعتمد!** تم قبول <@${currentDiscordUser.id}> ومنحه الرتبة تلقائياً! ${roleMention}`,
      embeds: [{
        author: {
          name: `${currentDiscordUser.username} (${currentDiscordUser.name || currentDiscordUser.username})`,
          icon_url: currentDiscordUser.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'
        },
        title: `طلب شخصية معتمد — ${data.charName}`,
        thumbnail: {
          url: currentDiscordUser.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'
        },
        description: `قام العضو <@${currentDiscordUser.id}> بإنهاء الاختبار الالكتروني وتأكيد قراءة القوانين، وتم تسجيله واعتماد رتبته في السيرفر تلقائياً.`,
        fields: [
          { name: 'صاحب الحساب في الديسكورد', value: `<@${currentDiscordUser.id}> (\`${currentDiscordUser.username}\`)`, inline: true },
          { name: 'آيدي الديسكورد (Discord ID)', value: `\`${currentDiscordUser.id}\``, inline: true },
          { name: '️ الرتبة الممنوحة', value: `${roleMention} (مواطن معتمد)`, inline: true },
          { name: 'اسم الشخصية في السيرفر', value: `**${data.charName}** (${data.charAge} سنة)`, inline: true },
          { name: 'اسم وعمر المتقدم', value: `${data.playerName} (${data.playerAge} سنة)`, inline: true },
          { name: 'قراءة القوانين', value: 'تم تأكيد وقبول كافة القوانين والشروط', inline: true },
          { name: 'قصة الشخصية', value: data.story, inline: false }
        ],
        color: 15644442, /* #eeb71a Gold */
        image: { url: 'attachment://joytown-application.png' },
        footer: {
          text: `JOY TOWN RP • ${currentDiscordUser.username}`,
          icon_url: currentDiscordUser.avatar
        },
        timestamp: new Date().toISOString()
      }]
    };

    submitBtn.disabled = true;
    submitLabel.textContent = 'جاري إرسال التقديم واعتماد الرتبة...';

    try {
      // 1) رسم لقطة الشاشة مع صورة المتقدم
      const shot = await renderApplicationShot(data, currentDiscordUser);

      // 2) إرسال الامبيد والصورة للديسكورد
      await sendToDiscord(payload, shot);

      // 3) إظهار شاشة النجاح ومنح الرتبة
      $$('[data-success-char-name]').forEach(el => { el.textContent = data.charName; });
      $$('[data-success-user-tag]').forEach(el => { el.textContent = `@${currentDiscordUser.username}`; });

      successEl.hidden = false;
      doneBtn.focus();
    } catch (err) {
      submitBtn.disabled = false;
      submitLabel.textContent = 'إرسال التقديم واعتماد الرتبة تلقائياً';
      showError(err && err.message ? err.message : 'تعذّر الإرسال الآن، حاول مرة أخرى.');
    }
  });

  // إزالة علامة الخطأ فور الكتابة
  $$('input, textarea', form).forEach(el => {
    el.addEventListener('input', () => {
      const field = el.closest('.field');
      if (field) field.classList.remove('invalid');
      if (!errorEl.hidden) clearError();
    });
  });

  doneBtn.addEventListener('click', () => {
    form.reset();
    clearError();
    $$('.field', form).forEach(f => f.classList.remove('invalid', 'shake'));
    successEl.hidden = true;
    submitBtn.disabled = false;
    submitLabel.textContent = 'إرسال التقديم واعتماد الرتبة تلقائياً';
    isRulesConfirmed = false;
    updateStepPanes();
    const pane1 = $('[data-step-pane="1"]', card);
    if (pane1) pane1.scrollIntoView({ behavior: 'smooth' });
  });

  updateStepPanes();
}

/* ============================================================
   8) خريطة المدينة: تكبير، تحريك، نقاط
   ============================================================ */
function initMap() {
  const viewport = $('.map-viewport');
  const world = $('.map-world');
  if (!viewport || !world) return;

  const LOCATIONS = [
    { label: 'CITY CENTER',   name: 'وسط المدينة',  desc: 'قلب النبض: متاجر، أبراج، وساحة يلتقي فيها اللاعبون كل مساء.' },
    { label: 'THE PORT',      name: 'الميناء الجنوبي', desc: 'شحنات تصل ليلاً، مخاطر على الرصيف، وفرص تبدأ من أول حاوية.' },
    { label: 'MEDICAL CENTER', name: 'المستشفى الشمالي', desc: 'المستشفى الرئيسي في شمال المدينة: كوادر طبية واستجابة طارئة على مدار الساعة لإنقاذ وإسعاف المصابين.' },
    { label: 'LAW & ORDER',   name: 'مركز شرطة ميشن رو',  desc: 'قاعدة الأمن الرئيسية: غرف الاستجابة للبلاغات، انطلاق الدوريات، والعمليات الأمنية الميدانية.' },
    { label: 'OPEN ROAD',     name: 'الصحراء',       desc: 'طرق مفتوحة بلا شرطة، سباقات، وأسرار بعيدة عن أضواء المدينة.' },
    { label: 'AIRPORT',       name: 'مطار لوس سانتوس',   desc: 'بوابتك للوصول: رحلات، طرود، ومهمات تبدأ من مدرج واحد.' }
  ];

  const pins = $$('.map-pin', world);
  const sidebar = $('.map-sidebar');
  const labelEl = $('.map-location-label');
  const nameEl = $('.map-location-name');
  const descEl = $('.map-location-description');
  const zoomEl = $('.map-zoom-value');
  const gridEl = $('.map-grid-value');

  let scale = 1, tx = 0, ty = 0;
  const MIN = 1, MAX = 3;

  const clamp = () => {
    const maxX = viewport.clientWidth * (scale - 1) / 2;
    const maxY = viewport.clientHeight * (scale - 1) / 2;
    tx = Math.max(-maxX, Math.min(maxX, tx));
    ty = Math.max(-maxY, Math.min(maxY, ty));
  };

  const apply = (animate = true) => {
    clamp();
    world.classList.toggle('no-anim', !animate);
    world.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (zoomEl) zoomEl.textContent = scale.toFixed(1) + '×';
    if (gridEl) {
      const gx = String.fromCharCode(65 + Math.min(7, Math.max(0, Math.round((tx / 160) + 4))));
      const gy = Math.min(9, Math.max(1, Math.round((ty / 160) + 5)));
      gridEl.textContent = `${gx} / 0${gy}`;
    }
  };

  const zoom = delta => {
    scale = Math.max(MIN, Math.min(MAX, +(scale + delta).toFixed(2)));
    if (scale === 1) { tx = 0; ty = 0; }
    apply(true);
  };

  $$('[data-map-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = btn.dataset.mapAction;
      if (a === 'in') zoom(.5);
      else if (a === 'out') zoom(-.5);
      else { scale = 1; tx = 0; ty = 0; apply(true); }
    });
  });

  viewport.addEventListener('wheel', e => {
    if (!(e.altKey || e.ctrlKey)) return;
    e.preventDefault();
    zoom(e.deltaY < 0 ? .25 : -.25);
  }, { passive: false });

  // سحب بالماوس/اللمس
  let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0, pid = null;
  viewport.addEventListener('pointerdown', e => {
    if (e.target.closest('.map-controls') || e.target.closest('.map-pin')) return;
    dragging = true; pid = e.pointerId;
    sx = e.clientX; sy = e.clientY; ox = tx; oy = ty;
    viewport.classList.add('dragging');
    viewport.setPointerCapture(pid);
    apply(false);
  });
  viewport.addEventListener('pointermove', e => {
    if (!dragging) return;
    tx = ox + (e.clientX - sx);
    ty = oy + (e.clientY - sy);
    apply(false);
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove('dragging');
    apply(true);
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  // نقاط الاهتمام
  const selectPin = i => {
    pins.forEach((p, k) => p.classList.toggle('is-active', k === i));
    const loc = LOCATIONS[i];
    if (!loc) return;
    sidebar.classList.add('switching');
    setTimeout(() => {
      labelEl.textContent = loc.label;
      nameEl.textContent = loc.name;
      descEl.textContent = loc.desc;
      sidebar.classList.remove('switching');
    }, 220);
  };
  pins.forEach((pin, i) => {
    pin.addEventListener('click', () => selectPin(i));
    pin.addEventListener('pointerenter', () => { if (!reduced) selectPin(i); });
  });

  apply(false);
}

/* ============================================================
   9) نسخ عنوان السيرفر + إشعار
   ============================================================ */
function initCopy() {
  const btn = $('[data-copy-ip]');
  const toast = $('.toast');
  if (!btn) return;

  const notify = msg => {
    if (!toast) return;
    toast.hidden = false;
    toast.textContent = msg;
    requestAnimationFrame(() => toast.classList.add('show'));
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => { toast.hidden = true; }, 400);
    }, 2400);
  };

  const confirmCopy = () => {
    notify('تم نسخ عنوان السيرفر ');
    const status = $('.access-status');
    if (status) {
      status.textContent = 'العنوان نُسخ — الصقه في FiveM واضغط Connect.';
      status.classList.add('show');
    }
  };

  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(CONFIG.server);
      confirmCopy();
    } catch (_) {
      const input = document.createElement('input');
      input.value = CONFIG.server;
      document.body.appendChild(input);
      input.select();
      try { document.execCommand('copy'); confirmCopy(); }
      catch (e) { notify('انسخ العنوان يدوياً: ' + CONFIG.server); }
      input.remove();
    }
  });
}

/* ============================================================
   10) حالة السيرفر وعدد اللاعبين المباشر
   ============================================================ */
function initServerStatus() {
  const conf = CONFIG.serverStatus || { status: 'offline', players: 0, maxPlayers: 128 };

  const updateUI = (state, count, max) => {
    state = String(state || 'offline').toLowerCase();
    const isOnline = state === 'online';
    const isRestarting = state === 'restarting' || state === 'restart';
    const isOffline = !isOnline && !isRestarting;

    const currentPlayers = Math.max(0, parseInt(count, 10) || 0);
    const maxP = Math.max(1, parseInt(max, 10) || 128);
    const pct = Math.min(100, Math.round((currentPlayers / maxP) * 100));

    let arabicTitle = 'السيرفر يعمل الآن';
    let eyebrowText = 'LIVE SERVER STATUS / متصل';
    let headerText = 'ONLINE';
    let pctText = `${pct}% ممتلئ`;

    if (isRestarting) {
      arabicTitle = 'جاري إعادة التشغيل (ريستارت)';
      eyebrowText = 'RESTARTING / يُرجى الانتظار';
      headerText = 'RESTARTING';
      pctText = 'ريستارت قيد المعالجة';
    } else if (isOffline) {
      arabicTitle = 'السيرفر مغلق حالياً';
      eyebrowText = 'SERVER STATUS / غير متصل';
      headerText = 'OFFLINE';
      pctText = 'غير متصل';
    }

    const stateClass = `status-pulse status-${isRestarting ? 'restarting' : isOnline ? 'online' : 'offline'}`;
    $$('[data-monitor-pulse]').forEach(el => { el.className = stateClass; });
    $$('[data-header-status-pulse]').forEach(el => { el.className = stateClass; });

    $$('[data-monitor-state-title]').forEach(el => { el.textContent = arabicTitle; });
    $$('[data-monitor-eyebrow]').forEach(el => { el.textContent = eyebrowText; });
    $$('[data-header-status-text]').forEach(el => { el.textContent = headerText; });

    $$('[data-players-count]').forEach(el => { el.textContent = currentPlayers; });
    $$('[data-players-max]').forEach(el => { el.textContent = maxP; });
    $$('[data-players-pct]').forEach(el => { el.textContent = pctText; });
    $$('[data-players-bar]').forEach(el => { el.style.width = isOffline ? '0%' : `${pct}%`; });

    // تحديث رقم اللاعبين المتصلين في شريط الإحصائيات (Stats Band)
    $$('[data-stat-players]').forEach(el => {
      el.textContent = currentPlayers;
      el.dataset.count = currentPlayers;
    });

    const monitorEl = $('[data-server-monitor]');
    if (monitorEl) {
      monitorEl.classList.remove('status-online', 'status-offline', 'status-restarting');
      monitorEl.classList.add(`status-${isRestarting ? 'restarting' : isOnline ? 'online' : 'offline'}`);
    }
  };

  updateUI(conf.status, conf.players, conf.maxPlayers);

  const checkLive = async () => {
    if (!conf.autoFetch) return;

    let cfxCode = (CONFIG.cfxId || '').replace(/^.*join\//, '').trim();

    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 4500);

      // الأولوية 1: فحص سيرفر FiveM عبر API الرسمي لـ Cfx.re (يدعم CORS بدون أي مشاكل)
      if (cfxCode) {
        const cfxRes = await fetch(`https://servers-frontend.fivem.net/api/servers/single/${cfxCode}`, {
          signal: controller.signal
        });
        clearTimeout(tid);
        if (cfxRes.ok) {
          const d = await cfxRes.json();
          if (d && d.Data) {
            const clients = parseInt(d.Data.clients, 10) || 0;
            const maxClients = parseInt(d.Data.sv_maxclients, 10) || 128;
            updateUI('online', clients, maxClients);
            return;
          }
        }
      }

      // الأولوية 2: فحص عنوان السيرفر المباشر IP/Port
      if (CONFIG.server) {
        const srvRes = await fetch(`http://${CONFIG.server}/dynamic.json`, {
          signal: controller.signal,
          mode: 'cors'
        });
        clearTimeout(tid);
        if (srvRes.ok) {
          const d = await srvRes.json();
          if (d && typeof d.clients !== 'undefined') {
            const clients = parseInt(d.clients, 10) || 0;
            const maxClients = parseInt(d.sv_maxclients, 10) || 128;
            updateUI('online', clients, maxClients);
            return;
          }
        }
      }

      // إذا لم يتوفر اتصال ناجح مع السيرفر: يتم ضبط الحالة الحقيقية (مغلق / 0 لاعب)
      updateUI('offline', 0, conf.maxPlayers || 128);
    } catch (_) {
      updateUI(conf.status === 'restarting' ? 'restarting' : 'offline', 0, conf.maxPlayers || 128);
    }
  };

  checkLive();
  if (conf.refreshInterval && conf.refreshInterval >= 10000) {
    setInterval(checkLive, conf.refreshInterval);
  }

  window.JoyTown = window.JoyTown || {};
  window.JoyTown.setPlayers = (n, max) => updateUI('online', n, max || conf.maxPlayers);
  window.JoyTown.setStatus = (state, players, max) => {
    conf.status = state || conf.status;
    if (players !== undefined) conf.players = players;
    if (max !== undefined) conf.maxPlayers = max;
    updateUI(conf.status, conf.players, conf.maxPlayers);
  };
}

/* ============================================================
   11) تحديث أعضاء الديسكورد المباشر (Discord Live Widget)
   ============================================================ */
function initDiscordLiveSync() {
  const statEl = $('[data-stat-discord]');
  if (!statEl) return;

  const updateDiscordUI = count => {
    const n = Math.max(0, parseInt(count, 10) || 0);
    statEl.textContent = n;
    statEl.dataset.count = n;
  };

  const checkDiscord = async () => {
    const guildId = (CONFIG.discordGuildId || '').trim();
    if (!guildId) {
      updateDiscordUI(0);
      return;
    }
    try {
      const res = await fetch(`https://discord.com/api/guilds/${guildId}/widget.json`);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.presence_count !== 'undefined') {
          updateDiscordUI(data.presence_count);
        }
      }
    } catch (_) {}
  };

  checkDiscord();
  // فحص وتحديث تلقائي كل 30 ثانية
  setInterval(checkDiscord, 30000);

  window.JoyTown = window.JoyTown || {};
  window.JoyTown.setDiscordOnline = updateDiscordUI;
}

/* ============================================================
   11) تفاصيل صغيرة
   ============================================================ */
/* ============================================================
   12) صناع المحتوى والبثوث المباشرة
   ============================================================ */
function initStreamers() {
  const grid = $('[data-streamers-grid]');
  const liveCountEl = $('[data-live-count]');
  const statStreamsEl = $('[data-stat-streams]');
  const pulseEl = $('[data-streamers-pulse]');
  const list = CONFIG.streamers || [];

  const render = () => {
    if (!grid) return;
    const liveStreamers = list.filter(s => s.isLive);
    const count = liveStreamers.length;

    if (liveCountEl) liveCountEl.textContent = count;
    if (statStreamsEl) {
      statStreamsEl.textContent = count;
      statStreamsEl.dataset.count = count;
    }
    if (pulseEl) {
      pulseEl.className = `status-pulse status-${count > 0 ? 'online' : 'offline'}`;
    }

    if (list.length === 0 || liveStreamers.length === 0) {
      grid.innerHTML = `
        <div class="streamers-empty-state" dir="rtl">
          <div class="streamers-empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 14.14 14.14"/></svg>
          </div>
          <h3>لا توجد بثوث مباشرة حالياً</h3>
          <p>لم يتم تسجيل أو بدء أي بث مباشر في الوقت الحالي — تظهر بثوث صناع المحتوى المعتمدين هنا تلقائياً عند فتحهم البث داخل السيرفر.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = liveStreamers.map((s) => {
      const platformClass = `platform-${(s.platform || 'kick').toLowerCase()}`;
      const platformLabel = (s.platform || 'KICK').toUpperCase();
      const viewers = Number(s.viewers || 0).toLocaleString();
      const thumb = s.thumbnail || '11.png';
      const avatar = s.avatar || 'LOGO.png';

      return `
        <a class="streamer-card is-live" href="${s.url || '#'}" target="_blank" rel="noopener noreferrer" aria-label="مشاهدة بث ${s.name}">
          <div class="streamer-thumb-wrap">
            <img class="streamer-thumb" src="${thumb}" alt="بث ${s.name}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='11.png';">
            <div class="streamer-thumb-overlay"></div>
            <div class="streamer-badge-live">
              <span class="live-blink"></span>
              <span>مباشر</span>
            </div>
            <div class="streamer-viewers">
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
              <span>${viewers}</span>
            </div>
            <div class="streamer-platform ${platformClass}">${platformLabel}</div>
          </div>
          <div class="streamer-info" dir="rtl">
            <div class="streamer-profile">
              <img class="streamer-avatar" src="${avatar}" alt="${s.name}" width="46" height="46" loading="lazy" onerror="this.onerror=null;this.src='LOGO.png';">
              <div class="streamer-meta">
                <h3 class="streamer-name">${s.name}</h3>
                <span class="streamer-tag" dir="ltr">${s.tag || '@streamer'}</span>
              </div>
            </div>
            <p class="streamer-stream-title">${s.title}</p>
            <div class="streamer-card-foot" dir="ltr">
              <span class="stream-game">GTA V / FiveM</span>
              <span class="stream-cta">WATCH LIVE <b>↗</b></span>
            </div>
          </div>
        </a>
      `;
    }).join('');
  };

  render();

  // تحكم سهل بالكونسول:
  window.JoyTown = window.JoyTown || {};
  window.JoyTown.streamers = list;
  window.JoyTown.addStreamer = item => {
    list.push(item);
    render();
  };
  window.JoyTown.removeStreamer = idx => {
    list.splice(idx, 1);
    render();
  };
  window.JoyTown.setStreamerLive = (idx, live, viewers, title) => {
    if (list[idx]) {
      if (live !== undefined) list[idx].isLive = !!live;
      if (viewers !== undefined) list[idx].viewers = viewers;
      if (title !== undefined) list[idx].title = title;
      render();
    }
  };
}

function initMisc() {
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // إغلاق القائمة عند التحويل لسطح المكتب
  const desktop = window.matchMedia('(min-width: 981px)');
  const syncNav = () => {
    if (desktop.matches && document.body.classList.contains('nav-open')) {
      document.body.classList.remove('nav-open');
      const toggle = $('.menu-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }
  };
  desktop.addEventListener('change', syncNav);
}

/* ============================================================
   10) تبويبات قوانين المدينة
   ============================================================ */
function initRulesTabs() {
  const tabs = $$('.rules-tab');
  const panels = $$('.rules-tab-content');
  if (!tabs.length || !panels.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
      });
      panels.forEach(p => {
        const match = p.id === `tab-${target}`;
        p.classList.toggle('is-active', match);
        p.hidden = !match;
      });
    });
  });
}

/* ============================================================
   14) نافذة تقديم رتبة الستريمر (Streamer Role Application Dialog)
   ============================================================ */
function initStreamerApplication() {
  const dlg = $('#streamer-dialog');
  if (!dlg) return;

  const openBtns = $$('[data-streamer-open]');
  const closeBtns = $$('[data-streamer-close]', dlg);
  const form = $('.streamer-form', dlg);
  const errorEl = $('[data-streamer-error]', dlg);
  const successEl = $('[data-streamer-success]', dlg);
  const contentEl = $('[data-streamer-content]', dlg);
  const submitBtn = $('[data-streamer-submit-btn]', dlg);
  const submitLabel = $('[data-streamer-submit-label]', dlg);

  const discordUserBox = $('[data-streamer-discord-user]', dlg);
  const discordGuestBox = $('[data-streamer-discord-guest]', dlg);

  const syncDiscordState = () => {
    let savedUser = null;
    try {
      const s = localStorage.getItem('joytown_discord_user');
      if (s) savedUser = JSON.parse(s);
    } catch (_) {}

    if (savedUser && savedUser.id) {
      if (discordUserBox) discordUserBox.hidden = false;
      if (discordGuestBox) discordGuestBox.hidden = true;
      const avatar = $('[data-streamer-avatar]', dlg);
      const name = $('[data-streamer-name]', dlg);
      const tag = $('[data-streamer-tag]', dlg);
      if (avatar) avatar.src = savedUser.avatar || 'LOGO.png';
      if (name) name.textContent = savedUser.name || savedUser.username;
      if (tag) tag.textContent = `@${savedUser.username} (ID: ${savedUser.id})`;
    } else {
      if (discordUserBox) discordUserBox.hidden = true;
      if (discordGuestBox) discordGuestBox.hidden = false;
    }
  };

  const open = () => {
    syncDiscordState();
    if (contentEl) contentEl.hidden = false;
    if (successEl) successEl.hidden = true;
    if (errorEl) { errorEl.hidden = true; errorEl.textContent = ''; }
    if (typeof dlg.showModal === 'function') {
      dlg.showModal();
    } else {
      dlg.setAttribute('open', '');
    }
  };

  const close = () => {
    if (typeof dlg.close === 'function') {
      dlg.close();
    } else {
      dlg.removeAttribute('open');
    }
  };

  openBtns.forEach(btn => btn.addEventListener('click', e => {
    e.preventDefault();
    open();
  }));

  closeBtns.forEach(btn => btn.addEventListener('click', close));
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });

const loginBtn = $('[data-action-discord-login]', dlg);
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      const cid = (CONFIG.discordClientId || '').trim();
      if (!cid) {
        alert('لم يتم ضبط discordClientId في ملف app.js');
        return;
      }
      const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
      const authUrl = `https://discord.com/oauth2/authorize?client_id=${cid}&redirect_uri=${redirectUri}&response_type=token&scope=identify`;
      window.location.href = authUrl;
    });
  }

  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (errorEl) { errorEl.hidden = true; errorEl.textContent = ''; }

    // 1) التحقق من حساب ديسكورد
    let discordUser = null;
    try {
      const s = localStorage.getItem('joytown_discord_user');
      if (s) discordUser = JSON.parse(s);
    } catch (_) {}

    const manualTag = (form.elements['manualDiscordTag']?.value || '').trim();
    const manualId = (form.elements['manualDiscordId']?.value || '').trim();

    let finalDiscordId = '';
    let finalDiscordTag = '';
    let finalDiscordName = '';
    let finalAvatar = 'https://cdn.discordapp.com/embed/avatars/0.png';

    if (discordUser && discordUser.id) {
      finalDiscordId = discordUser.id;
      finalDiscordTag = discordUser.username;
      finalDiscordName = discordUser.name || discordUser.username;
      finalAvatar = discordUser.avatar || finalAvatar;
    } else if (manualTag) {
      finalDiscordTag = manualTag;
      finalDiscordName = manualTag;
      finalDiscordId = manualId || 'غير محدد';
    } else {
      if (errorEl) {
        errorEl.textContent = 'يرجى تسجيل الدخول بحساب ديسكورد أو كتابة يوزر حسابك في الخانة المخصصة.';
        errorEl.hidden = false;
      }
      return;
    }

    // 2) التحقق من التعهد بالقوانين
    const agreeCb = form.elements['streamerAgree'];
    if (agreeCb && !agreeCb.checked) {
      if (errorEl) {
        errorEl.textContent = 'يجب الموافقة والتعهد بضوابط وشروط البث المباشر لإرسال الطلب.';
        errorEl.hidden = false;
      }
      return;
    }

    // 3) التحقق من الحقول
    const platform = (form.elements['streamPlatform']?.value || '').trim();
    const channelUrl = (form.elements['channelUrl']?.value || '').trim();
    const channelName = (form.elements['channelName']?.value || '').trim();
    const charName = (form.elements['streamCharName']?.value || '').trim();
    const viewers = (form.elements['viewersCount']?.value || '').trim();
    const country = (form.elements['streamerCountry']?.value || '').trim();
    const bio = (form.elements['streamerBio']?.value || '').trim();

    if (!channelUrl || !channelName || !charName || !viewers) {
      if (errorEl) {
        errorEl.textContent = 'يرجى تعبئة جميع الحقول المطلوبة (رابط القناة، اسم الستريمر، اسم الشخصية، المشاهدات).';
        errorEl.hidden = false;
      }
      return;
    }

    // 4) تجهيز الإرسال للديسكورد مع الرتبة المحددة 1564621532683046983
    const roleId = CONFIG.streamerRoleId || '1564621532683046983';
    const roleMention = `<@&${roleId}>`;
    const userMention = finalDiscordId && finalDiscordId !== 'غير محدد' ? `<@${finalDiscordId}>` : `@${finalDiscordTag}`;

    const payload = {
      username: 'JOY TOWN — نظام صناع المحتوى',
      content: `🎥 **طلب رتبة ستريمر جديد!** تم تقديم طلب من قبل ${userMention} ${roleMention}`,
      embeds: [{
        author: {
          name: `${finalDiscordName} (${finalDiscordTag})`,
          icon_url: finalAvatar
        },
        title: `🎥 طلب رتبة صانع محتوى / ستريمر — ${channelName}`,
        thumbnail: {
          url: finalAvatar
        },
        description: `قام العضو ${userMention} بتقديم طلب للانضمام إلى صناع المحتوى المعتمدين في سيرفر JOY TOWN مع التعهد الكامل بكافة ضوابط البث.`,
        fields: [
          { name: 'صاحب الحساب في الديسكورد', value: `${userMention} (\`${finalDiscordTag}\`)`, inline: true },
          { name: 'آيدي الديسكورد (Discord ID)', value: `\`${finalDiscordId}\``, inline: true },
          { name: 'الرتبة المطلوبة', value: `${roleMention} (ستريمر معتمد)`, inline: true },
          { name: 'منصة البث', value: `**${platform}**`, inline: true },
          { name: 'اسم القناة / الستريمر', value: `**${channelName}**`, inline: true },
          { name: 'اسم الشخصية في السيرفر', value: `**${charName}**`, inline: true },
          { name: 'رابط القناة أو البث', value: channelUrl, inline: false },
          { name: 'المشاهدات / المتابعون', value: viewers, inline: true },
          { name: 'الدولة', value: country || 'غير محدد', inline: true },
          { name: 'التعهد بضوابط البث', value: 'تم التعهد والالتزام بجميع شروط وقوانين البث في السيرفر', inline: false },
          { name: 'نبذة عن المحتوى', value: bio || 'لا توجد ملاحظات إضافية', inline: false }
        ],
        color: 15644442, /* Gold #eeb71a */
        footer: {
          text: `JOY TOWN RP • نظام الستريمر`,
          icon_url: finalAvatar
        },
        timestamp: new Date().toISOString()
      }]
    };

    if (submitBtn) submitBtn.disabled = true;
    if (submitLabel) submitLabel.textContent = 'جاري إرسال الطلب للديسكورد...';

    try {
      if (!CONFIG.discordWebhook) {
        throw new Error('لم يتم ضبط رابط الويب هوك CONFIG.discordWebhook');
      }

      const fd = new FormData();
      fd.append('payload_json', JSON.stringify(payload));
      const res = await fetch(CONFIG.discordWebhook, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Discord status: ' + res.status);

      if (contentEl) contentEl.hidden = true;
      if (successEl) successEl.hidden = false;
      if (typeof showToast === 'function') showToast('تم إرسال طلب رتبة الستريمر للديسكورد بنجاح');
      form.reset();
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = 'تعذر إرسال الطلب الآن: ' + (err.message || 'خطأ في الاتصال');
        errorEl.hidden = false;
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitLabel) submitLabel.textContent = 'إرسال طلب رتبة ستريمر واعتمادها';
    }
  });
}

/* ============================================================
   تشغيل
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  applyConfig();
  initServerStatus();
  initDiscordLiveSync();
  runIntro();
  initNav();
  initHero();
  initReveal();
  initStoryDialog();
  initApplyForm();
  initMap();
  initCopy();
  initRulesTabs();
  initStreamers();
  initMisc();
  initStreamerApplication();
});
})();
