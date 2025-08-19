// ====== Enhanced Medical Preloader ======
class MedicalPreloader {
  constructor() {
    this.overlay = document.getElementById('preloader-overlay');
    this.canvas = document.getElementById('preloader-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.startTime = null;
    this.duration = 5000; // 5 seconds
    this.capsules = [
      { colorA: '#e63946', colorB: '#fff', x: -90, y: 0, angle: 0, open: false }, // red/white
      { colorA: '#457b9d', colorB: '#fff', x: 90, y: 0, angle: 0, open: false }  // blue/white
    ];
    this.particles = [];
    this.sparks = [];
    this.orb = { x: 0, y: 0, r: 0, pulse: 0, active: false };
    this.phase = 0;
    this.fadeStarted = false;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  animate(ts) {
    if (!this.startTime) this.startTime = ts;
    const elapsed = ts - this.startTime;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // Background moving gradient
    this.drawBackground(elapsed);
    // Capsules logic
    let centerX = this.canvas.width/2, centerY = this.canvas.height/2;
    // 1. Float & rotate
    let t = Math.min(elapsed/1200, 1);
    this.capsules[0].x = centerX - (90 - 60*t);
    this.capsules[1].x = centerX + (90 - 60*t);
    this.capsules[0].y = centerY + Math.sin(elapsed/800)*10;
    this.capsules[1].y = centerY + Math.cos(elapsed/900)*10;
    this.capsules[0].angle = Math.sin(elapsed/1000)*0.15 + (t>0.95 ? -0.5 : 0);
    this.capsules[1].angle = Math.cos(elapsed/1000)*0.15 + (t>0.95 ? 0.5 : 0);
    // 2. Approach & open
    if (elapsed > 1400 && elapsed < 2000) {
      let openT = Math.min((elapsed-1400)/400, 1);
      this.capsules[0].angle -= openT*1.1;
      this.capsules[1].angle += openT*1.1;
      if (openT > 0.8) { this.capsules[0].open = this.capsules[1].open = true; }
    }
    // Draw capsules
    this.capsules.forEach((c, i) => this.drawCapsule(c, i));
    // 3. Emit particles & sparks
    if (elapsed > 1800 && elapsed < 3000) {
      if (Math.random() < 0.18) this.spawnParticle(centerX, centerY+10);
      if (Math.random() < 0.08) this.spawnSpark(centerX, centerY+10);
    }
    // 4. Animate particles
    this.particles = this.particles.filter(p => this.animateParticle(p));
    this.sparks = this.sparks.filter(s => this.animateSpark(s));
    // 5. Orb swirl and pulse
    if (elapsed > 2800) {
      this.orb.active = true;
      this.orb.r = 30 + Math.sin(elapsed/180)*4;
      this.orb.pulse = 1 + Math.sin(elapsed/150)*0.08;
      this.drawOrb(centerX, centerY, this.orb.r, this.orb.pulse);
    }
    // 6. Fade out overlay
    if (elapsed > this.duration-800 && !this.fadeStarted) {
      this.overlay.classList.add('fade-out');
      this.fadeStarted = true;
      setTimeout(() => {
        this.overlay.remove();
        document.body.style.overflow = '';
      }, 800);
    }
    if (elapsed < this.duration) requestAnimationFrame(this.animate);
  }
  drawBackground(elapsed) {
    // Soft moving radial gradient
    let g = this.ctx.createRadialGradient(
      this.canvas.width/2 + Math.sin(elapsed/1400)*60,
      this.canvas.height/2 + Math.cos(elapsed/1700)*60,
      80,
      this.canvas.width/2, this.canvas.height/2, Math.max(this.canvas.width, this.canvas.height)/1.2
    );
    g.addColorStop(0, '#16204a');
    g.addColorStop(0.5, '#0a0f1c');
    g.addColorStop(1, '#101a3c');
    this.ctx.fillStyle = g;
    this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    // Faint hexagons (already in CSS bg, but add a few animated ones)
    for (let i=0; i<3; i++) {
      let x = this.canvas.width/2 + Math.cos(elapsed/1300+i)*180;
      let y = this.canvas.height/2 + Math.sin(elapsed/1100+i)*120;
      this.ctx.save();
      this.ctx.globalAlpha = 0.08;
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 1.2;
      this.drawHexagon(x, y, 48 + Math.sin(elapsed/800+i)*8);
      this.ctx.restore();
    }
  }
  drawCapsule(c, idx) {
    this.ctx.save();
    this.ctx.translate(c.x, c.y);
    this.ctx.rotate(c.angle);
    // Capsule body
    let grad = this.ctx.createLinearGradient(-40,0,40,0);
    grad.addColorStop(0, c.colorA);
    grad.addColorStop(0.5, '#fff');
    grad.addColorStop(1, c.colorB);
    this.ctx.fillStyle = grad;
    this.ctx.shadowColor = c.colorA;
    this.ctx.shadowBlur = 18;
    this.roundRect(-40,-18,80,36,18);
    this.ctx.fill();
    // Glossy reflection
    this.ctx.globalAlpha = 0.25;
    this.ctx.fillStyle = '#fff';
    this.roundRect(-25,-16,50,10,8);
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
    // If open, split halves
    if (c.open) {
      this.ctx.save();
      this.ctx.translate(-20,0);
      this.ctx.rotate(-0.8);
      this.ctx.fillStyle = c.colorA;
      this.roundRect(-20,-18,40,36,16);
      this.ctx.fill();
      this.ctx.restore();
      this.ctx.save();
      this.ctx.translate(20,0);
      this.ctx.rotate(0.8);
      this.ctx.fillStyle = c.colorB;
      this.roundRect(-20,-18,40,36,16);
      this.ctx.fill();
      this.ctx.restore();
    }
    this.ctx.restore();
  }
  roundRect(x, y, w, h, r) {
    this.ctx.beginPath();
    this.ctx.moveTo(x+r, y);
    this.ctx.arcTo(x+w, y, x+w, y+h, r);
    this.ctx.arcTo(x+w, y+h, x, y+h, r);
    this.ctx.arcTo(x, y+h, x, y, r);
    this.ctx.arcTo(x, y, x+w, y, r);
    this.ctx.closePath();
  }
  drawHexagon(x, y, r) {
    this.ctx.beginPath();
    for (let i=0; i<6; i++) {
      let angle = Math.PI/3*i;
      let px = x + r * Math.cos(angle);
      let py = y + r * Math.sin(angle);
      if (i === 0) this.ctx.moveTo(px, py);
      else this.ctx.lineTo(px, py);
    }
    this.ctx.closePath();
    this.ctx.stroke();
  }
  spawnParticle(x, y) {
    let angle = Math.random()*2*Math.PI;
    let speed = 1.3 + Math.random()*1.5;
    let clr = [ '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b' ][Math.floor(Math.random()*5)];
    this.particles.push({ x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, r: 7+Math.random()*4, color: clr, life: 0 });
  }
  animateParticle(p) {
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.life++;
    this.ctx.save();
    this.ctx.globalAlpha = 1-Math.min(p.life/60,1);
    let g = this.ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.r);
    g.addColorStop(0, '#fff');
    g.addColorStop(0.3, p.color);
    g.addColorStop(1, 'transparent');
    this.ctx.fillStyle = g;
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.r, 0, 2*Math.PI);
    this.ctx.fill();
    this.ctx.restore();
    return p.life < 60;
  }
  spawnSpark(x, y) {
    let angle = Math.random()*Math.PI - Math.PI/2;
    let speed = 4 + Math.random()*2;
    this.sparks.push({ x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, life: 0 });
  }
  animateSpark(s) {
    s.x += s.vx;
    s.y += s.vy;
    s.vx *= 0.96;
    s.vy += 0.2;
    s.life++;
    this.ctx.save();
    this.ctx.globalAlpha = 0.7-Math.min(s.life/20,0.7);
    this.ctx.strokeStyle = '#fffbe9';
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();
    this.ctx.moveTo(s.x, s.y);
    this.ctx.lineTo(s.x-s.vx*2, s.y-s.vy*2);
    this.ctx.stroke();
    this.ctx.restore();
    return s.life < 20;
  }
  drawOrb(x, y, r, pulse) {
    this.ctx.save();
    this.ctx.globalAlpha = 0.88;
    let g = this.ctx.createRadialGradient(x, y, r*0.3, x, y, r*pulse);
    g.addColorStop(0, '#fff');
    g.addColorStop(0.5, '#4ecdc4');
    g.addColorStop(1, 'transparent');
    this.ctx.beginPath();
    this.ctx.arc(x, y, r*pulse, 0, 2*Math.PI);
    this.ctx.fillStyle = g;
    this.ctx.shadowColor = '#4ecdc4';
    this.ctx.shadowBlur = 40;
    this.ctx.fill();
    this.ctx.restore();
  }
}
// Initialize preloader on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('preloader-overlay')) {
    document.body.style.overflow = 'hidden';
    new MedicalPreloader();
  }
});


// ====== Enhanced Mobile Navigation ======
class MobileNavigation {
  constructor() {
    this.navToggle = document.getElementById('navToggle');
    this.siteNav = document.querySelector('.site-nav');
    this.navLinks = document.querySelectorAll('.site-nav a');
    this.isOpen = false;
    
    this.init();
  }
  
  init() {
    if (!this.navToggle || !this.siteNav) return;
    
    this.navToggle.addEventListener('click', () => this.toggle());
    
    // Close nav when clicking on links
    this.navLinks.forEach(link => {
      link.addEventListener('click', () => this.close());
    });
    
    // Close nav when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.siteNav.contains(e.target)) {
        this.close();
      }
    });
    
    // Close nav on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }
  
  toggle() {
    this.isOpen ? this.close() : this.open();
  }
  
  open() {
    this.isOpen = true;
    this.siteNav.classList.add('open');
    this.navToggle.classList.add('active');
    this.navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  
  close() {
    this.isOpen = false;
    this.siteNav.classList.remove('open');
    this.navToggle.classList.remove('active');
    this.navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
}

// ====== Enhanced Active Link Management ======
class ActiveLinkManager {
  constructor() {
    this.currentPath = location.pathname.split('/').pop() || 'index.html';
    this.navLinks = document.querySelectorAll('#siteNavMenu a');
    this.init();
  }
  
  init() {
    this.highlightActiveLink();
    this.addHoverEffects();
  }
  
  highlightActiveLink() {
    this.navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === this.currentPath) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }
  
  addHoverEffects() {
    this.navLinks.forEach(link => {
      link.addEventListener('mouseenter', () => {
        if (!link.classList.contains('active')) {
          link.style.transform = 'translateY(-2px)';
        }
      });
      
      link.addEventListener('mouseleave', () => {
        if (!link.classList.contains('active')) {
          link.style.transform = '';
        }
      });
    });
  }
}

// ====== Enhanced Header Effects ======
class HeaderEffects {
  constructor() {
    this.header = document.querySelector('.site-header');
    this.scrollProgress = this.createScrollProgress();
    this.lastScrollY = 0;
    this.ticking = false;
    
    this.init();
  }
  
  init() {
    if (!this.header) return;
    
    window.addEventListener('scroll', () => this.requestTick());
    window.addEventListener('resize', () => this.updateScrollProgress());
  }
  
  createScrollProgress() {
    const progress = document.createElement('div');
    progress.className = 'scroll-progress';
    document.body.appendChild(progress);
    return progress;
  }
  
  requestTick() {
    if (!this.ticking) {
      requestAnimationFrame(() => this.updateHeader());
      this.ticking = true;
    }
  }
  
  updateHeader() {
    const currentScrollY = window.scrollY;
    
    // Add scrolled class for enhanced styling
    if (currentScrollY > 10) {
      this.header.classList.add('scrolled');
    } else {
      this.header.classList.remove('scrolled');
    }
    
    // Update scroll progress
    this.updateScrollProgress();
    
    this.lastScrollY = currentScrollY;
    this.ticking = false;
  }
  
  updateScrollProgress() {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = (window.scrollY / scrollHeight) * 100;
    this.scrollProgress.style.width = `${Math.min(scrolled, 100)}%`;
  }
}

// ====== Enhanced Back to Top ======
class BackToTop {
  constructor() {
    this.button = document.getElementById('toTop');
    this.threshold = 400;
    this.init();
  }
  
  init() {
    if (!this.button) return;
    
    window.addEventListener('scroll', () => this.toggleVisibility());
    this.button.addEventListener('click', () => this.scrollToTop());
  }
  
  toggleVisibility() {
    if (window.scrollY > this.threshold) {
      this.button.classList.add('show');
    } else {
      this.button.classList.remove('show');
    }
  }
  
  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Add click animation
    this.button.style.transform = 'translateY(-3px) scale(0.95)';
    setTimeout(() => {
      this.button.style.transform = '';
    }, 150);
  }
}

// --- Scroll reveal (auto apply to .reveal and .card) ---
(function(){
  const els = Array.from(document.querySelectorAll('.reveal, .card'));
  if(!('IntersectionObserver' in window)){ els.forEach(e=>e.classList.add('show')); return; }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting){ en.target.classList.add('show'); io.unobserve(en.target); }
    });
  }, {threshold:.12});
  els.forEach(e=> io.observe(e));
})();

// --- Card tilt effect (subtle) ---
(function(){
  const cards = document.querySelectorAll('.card');
  const max = 10;
  cards.forEach(card=>{
    card.addEventListener('mousemove', (e)=>{
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const rx = ((y/r.height)-.5)*-max;
      const ry = ((x/r.width)-.5)*max;
      card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    card.addEventListener('mouseleave', ()=> card.style.transform='');
  });
})();

// --- Existing demo data & features (kept from your file) ---
const NEWS = [
  { slug:'welcome-2025', title:'ترحيب بالعام الأكاديمي 2025/2026', excerpt:'بدء استقبال طلبات الالتحاق ببرامج الدراسات العليا...', date:'2025-08-10' },
  { slug:'alumni-day', title:'يوم الخريجين بكلية الصيدلة', excerpt:'دعوة لحضور يوم الخريجين والتواصل مع الزملاء...', date:'2025-07-22' },
  { slug:'grants', title:'منح بحثية لطلاب الدراسات العليا', excerpt:'إتاحة التقديم لمنح بحثية في مجالات متعددة...', date:'2025-06-30' },
  { slug:'seminar', title:'سيمينار: منهجية البحث العلمي', excerpt:'محاضرة تفاعلية مع خبراء.', date:'2025-06-15' },
];
const PUBS = [
  { title:'Outcomes of Eltrombopag in Pediatric SAA', journal:'Minia Pharm Journal', year:2024, keywords:['Hematology','SAA','TRAs'] },
  { title:'Metformin and Rectal Cancer Response', journal:'Oncology Letters', year:2023, keywords:['Metformin','pCR','CRT'] },
  { title:'Clinical Pharmacy Interventions in ICU', journal:'Egyptian J Clin Pharm', year:2022, keywords:['ICU','Medication Safety'] },
  { title:'Novel Drug Delivery Systems', journal:'PharmTech', year:2025, keywords:['Delivery','Nanotech'] },
];
const EVENTS = [
  { title:'ندوة مستجدات علاج الأورام', body:'جلسات مع خبراء محليين ودوليين.', start:'2025-10-15', location:'قاعة المؤتمرات' },
  { title:'ورشة كتابة البحث العلمي', body:'أساسيات تصميم الدراسات وكتابة الأوراق.', start:'2025-09-05', location:'معمل مهارات البحث' },
];
const GRADS = [
  { name:'د. أحمد سامي', cohort:2021, specialty:'صيدلة إكلينيكية', email:'ahmed.samy@example.com' },
  { name:'د. سارة محمد', cohort:2022, specialty:'صيدلة سريرية', email:'sara.mohamed@example.com' },
  { name:'د. علي مصطفى', cohort:2020, specialty:'تحليل دوائي', email:'ali.mostafa@example.com' },
  { name:'د. يارا عبد الله', cohort:2023, specialty:'صيدلة صناعية', email:'yara.abdallah@example.com' },
];

function cardNews(n){
  return `<article class="card">
    <div class="meta">${new Date(n.date).toLocaleDateString('ar-EG')}</div>
    <div class="title">${n.title}</div>
    <p class="muted">${n.excerpt}</p>
    <a class="btn" href="#">قراءة المزيد</a>
  </article>`
}
function cardPub(p){
  return `<div class="card">
    <div class="meta">${p.journal} · ${p.year}</div>
    <div class="title">${p.title}</div>
    <div class="row"> ${(p.keywords||[]).slice(0,4).map(k=>`<span class="badge">${k}</span>`).join('')} </div>
  </div>`
}
function cardEvent(e){
  return `<div class="card">
    <div class="meta">${new Date(e.start).toLocaleDateString('ar-EG')} — ${e.location||'المنيا'}</div>
    <div class="title">${e.title}</div>
    <p class="muted">${e.body}</p>
  </div>`
}
function cardGrad(g){
  return `<div class="card">
    <div class="meta">دفعة ${g.cohort} · ${g.specialty||''}</div>
    <div class="title">${g.name}</div>
    <div class="muted tiny">${g.email||'—'}</div>
  </div>`
}

// Home: inject latest items
const latestNews = document.getElementById('latestNews');
if(latestNews){ latestNews.innerHTML = NEWS.slice(0,3).map(cardNews).join(''); }
const latestPubs = document.getElementById('latestPubs');
if(latestPubs){ latestPubs.innerHTML = PUBS.slice(0,3).map(cardPub).join(''); }
const latestEvents = document.getElementById('latestEvents');
if(latestEvents){ latestEvents.innerHTML = EVENTS.slice(0,2).map(cardEvent).join(''); }

// News page: search
const newsList = document.getElementById('newsList');
const newsSearch = document.getElementById('newsSearch');
if(newsList){
  const render = (q='')=>{
    const ql = q.trim().toLowerCase();
    const data = NEWS.filter(n => !ql || n.title.toLowerCase().includes(ql) || n.excerpt.toLowerCase().includes(ql));
    newsList.innerHTML = data.map(cardNews).join('') || '<p class="muted">لا نتائج.</p>';
  };
  render();
  newsSearch?.addEventListener('input', e => render(e.target.value));
}

// Publications page: filter + search
const pubList = document.getElementById('pubList');
const yearFilter = document.getElementById('yearFilter');
const pubSearch = document.getElementById('pubSearch');
if(pubList){
  const render = ()=>{
    const year = yearFilter?.value || '';
    const q = (pubSearch?.value || '').trim().toLowerCase();
    let data = PUBS.slice();
    if(year) data = data.filter(p => String(p.year) === year);
    if(q) data = data.filter(p => p.title.toLowerCase().includes(q) || (p.keywords||[]).join(' ').toLowerCase().includes(q));
    pubList.innerHTML = data.map(cardPub).join('') || '<p class="muted">لا نتائج.</p>';
  };
  yearFilter?.addEventListener('change', render);
  pubSearch?.addEventListener('input', render);
  render();
}

// Graduates page: build cohort options + search
const gradList = document.getElementById('gradList');
const cohortFilter = document.getElementById('cohortFilter');
const gradSearch = document.getElementById('gradSearch');
if(gradList){
  const cohorts = Array.from(new Set(GRADS.map(g => g.cohort))).sort((a,b)=>b-a);
  if(cohortFilter){
    cohortFilter.innerHTML = '<option value="">كل الدفعات</option>' + cohorts.map(c=>`<option>${c}</option>`).join('');
  }
  const render = ()=>{
    const cohort = cohortFilter?.value || '';
    const q = (gradSearch?.value || '').trim().toLowerCase();
    let data = GRADS.slice();
    if(cohort) data = data.filter(g => String(g.cohort) === cohort);
    if(q) data = data.filter(g => g.name.toLowerCase().includes(q) || (g.specialty||'').toLowerCase().includes(q));
    gradList.innerHTML = data.map(cardGrad).join('') || '<p class="muted">لا نتائج.</p>';
  };
  cohortFilter?.addEventListener('change', render);
  gradSearch?.addEventListener('input', render);
  render();
}

// Contact form (demo)
const contactForm = document.getElementById('contactForm');
const contactMsg = document.getElementById('contactMsg');
if(contactForm){
  contactForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    setTimeout(()=>{
      contactMsg.hidden = false;
      contactForm.reset();
      window.scrollTo({ top: contactForm.offsetTop - 100, behavior:'smooth' });
    }, 400);
  });
}

// Initialize mobile navigation
new MobileNavigation();
