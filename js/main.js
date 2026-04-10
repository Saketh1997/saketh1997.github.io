/* ============================================================
   main.js — Section loader + dynamic content renderer
   ============================================================ */

   const SECTIONS = ['hero','about','research','projects','homelab','experience','skills','contact'];

   /* ---- Utilities ------------------------------------------- */
   const h = (tag, cls, inner='', attrs={}) => {
     const el = document.createElement(tag);
     if (cls) el.className = cls;
     if (inner) el.innerHTML = inner;
     Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k,v));
     return el;
   };
   
   /* ---- Loader ---------------------------------------------- */
   function hideLoader() {
     const loader = document.getElementById('page-loader');
     if (loader) {
       setTimeout(() => loader.classList.add('hidden'), 1300);
     }
   }
   
   /* ---- Section loader -------------------------------------- */
   async function loadSections() {
     const main = document.getElementById('main-content');
     const promises = SECTIONS.map(name =>
       fetch(`/sections/${name}.html`)
         .then(r => r.text())
         .catch(() => `<section id="${name}" class="sec"><p style="color:var(--muted)">Section failed to load.</p></section>`)
     );
     const htmls = await Promise.all(promises);
     htmls.forEach(html => {
       const wrapper = document.createElement('div');
       wrapper.innerHTML = html;
       main.appendChild(wrapper.firstElementChild || wrapper);
     });
   }
   
   /* ---- Content renderer ------------------------------------ */
   async function loadContent() {
     let data;
     try {
       const res = await fetch('/api/content');
       data = await res.json();
     } catch(e) {
       console.error('Failed to fetch content:', e);
       return;
     }
   
     renderHeroStats(data.meta?.stats);
     renderChips(data.about?.chips);
     renderInfoRows(data.about);
     renderResearch(data.research);
     renderProjects(data.projects);
     renderHomelab(data.homelab);
     renderExperience(data.experience);
     renderSkills(data.skills);
   }
   
   function renderHeroStats(stats) {
     const aside = document.querySelector('.hero-aside');
     if (!aside || !stats) return;
     aside.innerHTML = stats.map(s => `
       <div class="aside-stat">
         <span class="aside-num">${s.num}</span>
         <div class="aside-label">${s.label}</div>
       </div>`).join('');
   }
   
   function renderChips(chips) {
     const el = document.querySelector('.chips');
     if (!el || !chips) return;
     el.innerHTML = chips.map(c =>
       `<span class="chip${c.hi?' hi':''}">${c.label}</span>`
     ).join('');
   }
   
   function renderInfoRows(about) {
     const stack = document.querySelector('.info-stack');
     if (!stack || !about) return;
     const rows = [
       { k: 'Institution', v: about.institution },
       { k: 'Degree',      v: about.degree },
       { k: 'TA Roles',    v: about.ta },
       { k: 'Target Roles',v: about.targets },
       { k: 'Interests',   v: about.interests }
     ];
     stack.innerHTML = rows.map(r => `
       <div class="info-row">
         <div class="info-key">${r.k}</div>
         <div class="info-val">${r.v}</div>
       </div>`).join('');
   }
   
   function renderResearch(research) {
     if (!research) return;
   
     const dsRow = document.querySelector('.dataset-row');
     if (dsRow) {
       dsRow.innerHTML = research.datasets.map(d => `
         <div class="ds-card">
           <div class="ds-k">${d.key}</div>
           <div class="ds-v">${d.val}</div>
           <div class="ds-sub">${d.sub}</div>
         </div>`).join('');
     }
   
     const constBlock = document.querySelector('.const-block');
     if (constBlock) {
       constBlock.innerHTML =
         `<div style="font-family:var(--mono);font-size:10px;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:.3rem">Tunable Constants</div>` +
         research.constants.map(c => `<div class="const-item">${c}</div>`).join('');
     }
   
     const methodGrid = document.querySelector('.method-grid');
     if (methodGrid) {
       methodGrid.innerHTML = research.methods.map(m => `
         <div class="method-row">
           <span class="method-num">${m.num}</span>
           <span class="method-name">${m.name}</span>
           <span class="method-status ${m.cls}">${m.status}</span>
         </div>`).join('');
       // staggered reveal
       setTimeout(() => {
         methodGrid.querySelectorAll('.method-row').forEach((row, i) => {
           setTimeout(() => row.classList.add('visible'), i * 80);
         });
       }, 400);
     }
   }
   
   function renderProjects(projects) {
     const grid = document.querySelector('.projects-grid');
     if (!grid || !projects) return;
     grid.innerHTML = projects.map(p => `
       <div class="p-card">
         <div class="card-top">
           <span class="c-tag">${p.tag}</span>
           <span class="badge ${p.badgeCls}">${p.badge}</span>
         </div>
         <div class="p-title">${p.title}</div>
         <div class="p-body">${p.body}</div>
         <div class="p-tags">${p.tags.map(t=>`<span class="p-tag">${t}</span>`).join('')}</div>
       </div>`).join('');
   }
   
   function renderHomelab(hl) {
     if (!hl) return;
   
     const access = document.querySelector('.hl-access');
     if (access) {
       access.innerHTML = hl.access.map(a =>
         `<div class="access-pill ${a.cls}">
           ${a.pulse ? `<div class="pulse" style="animation-delay:${a.delay}s"></div>` : ''}
           ${a.label}
         </div>`
       ).join('');
     }
   
     const nodes = document.querySelector('.hl-nodes');
     if (nodes) {
       nodes.innerHTML = hl.nodes.map(n => `
         <div class="node">
           <div class="node-hd">
             <div class="dot ${n.dotCls}"></div>
             <span class="node-nm ${n.nameCls}">${n.name}</span>
             <span class="node-ip">${n.ip}</span>
           </div>
           <div class="node-bd">
             ${n.specs.map(s => `
               <div class="spec">
                 <span class="spec-k ${n.dotCls}">${s.k}</span>
                 <span class="spec-v">${s.v}</span>
               </div>`).join('')}
             <div class="svc-list">
               ${n.services.map(s=>`<span class="svc">${s}</span>`).join('')}
             </div>
           </div>
         </div>`).join('');
     }
   
     const storage = document.querySelector('.hl-storage');
     if (storage) {
       storage.innerHTML = hl.storage.map(s => `
         <div class="st-cell">
           <div class="st-k">${s.k}</div>
           <div class="st-v">${s.v}</div>
           <div class="st-sub">${s.sub}</div>
         </div>`).join('');
     }
   
     const stackGrid = document.querySelector('.stack-grid');
     if (stackGrid && hl.stack) {
       const { infra, media, other } = hl.stack;
       stackGrid.innerHTML = [
         ...infra.map(s=>`<span class="stack-chip a">${s}</span>`),
         ...media.map(s=>`<span class="stack-chip b">${s}</span>`),
         ...other.map(s=>`<span class="stack-chip">${s}</span>`)
       ].join('');
     }
   }
   
   function renderExperience(exp) {
     if (!exp) return;
   
     const swEl = document.querySelector('.exp-software');
     if (swEl) {
       swEl.innerHTML = exp.software.map(e => `
         <div class="exp-card">
           <div class="exp-card-head">
             <span class="exp-role">${e.role}</span>
             <span class="exp-org">${e.org}</span>
             <span class="exp-period">${e.period}</span>
           </div>
           <p class="exp-summary">${e.summary}</p>
           <div class="exp-stack">
             ${e.stack.map(s => `<span class="exp-stack-chip">${s}</span>`).join('')}
           </div>
           <div class="exp-contributions">
             ${e.contributions.map(c =>
               `<div class="exp-contrib"><strong>${c.title}:</strong> ${c.body}</div>`
             ).join('')}
           </div>
         </div>`).join('');
     }
   
     const unEl = document.querySelector('.exp-unrelated');
     if (unEl) {
       unEl.innerHTML = exp.unrelated.map(e => `
         <div class="exp-card prior">
           <div class="exp-card-head">
             <span class="exp-role">${e.role}</span>
             <span class="exp-org">${e.org}</span>
             <span class="exp-period">${e.period}</span>
           </div>
           <p class="exp-summary">${e.body}</p>
         </div>`).join('');
     }
   }
   
   function renderSkills(skills) {
     const grid = document.querySelector('.skills-grid');
     if (!grid || !skills) return;
     grid.innerHTML = skills.map(cat => `
       <div class="sg">
         <div class="sg-title">${cat.title}</div>
         <ul class="sg-list">
           ${cat.items.map(i=>`<li>${i}</li>`).join('')}
         </ul>
       </div>`).join('');
   }
   
   /* ---- Scroll reveal --------------------------------------- */
   function initReveal() {
     const io = new IntersectionObserver(entries => {
       entries.forEach(e => {
         if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); }
       });
     }, { threshold: 0.07 });
     document.querySelectorAll('.reveal').forEach(el => io.observe(el));
   }
   
   /* ---- Active nav ------------------------------------------ */
   function initNav() {
     const nav = document.querySelector('nav');
     const links = document.querySelectorAll('.nav-links a');
   
     window.addEventListener('scroll', () => {
       nav.classList.toggle('scrolled', window.scrollY > 60);
   
       // highlight active section
       let current = '';
       document.querySelectorAll('section[id]').forEach(sec => {
         if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
       });
       links.forEach(a => {
         const href = a.getAttribute('href').replace('#','');
         a.classList.toggle('active', href === current);
       });
     });
   }
   
   /* ---- Toast helper ---------------------------------------- */
   window.toast = function(msg) {
     let t = document.querySelector('.toast');
     if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
     t.textContent = msg;
     t.classList.add('show');
     setTimeout(() => t.classList.remove('show'), 2400);
   };
   
   /* ---- Boot ------------------------------------------------ */
   async function boot() {
     await loadSections();
     await loadContent();
     initReveal();
     initNav();
     hideLoader();
   }
   
   document.addEventListener('DOMContentLoaded', boot);