
(() => {
  'use strict';
  const pages = [
    ['index.html','الرئيسية'], ['products.html','إدارة الأصناف'],
    ['point-valuation.html','ترميز النقاط'], ['barcode-batches.html','دفعات الباركود'],
    ['installation-claims.html','طلبات التركيب'], ['technicians.html','الفنيون'],
    ['loyalty-tiers.html','مستويات الولاء']
  ];
  const aliases = {
    'الرئيسية':'index.html','لوحة الإدارة الرئيسية':'index.html',
    'الأصناف والماركات':'products.html','إدارة الأصناف':'products.html',
    'ترميز النقاط':'point-valuation.html','دفعات الباركود':'barcode-batches.html',
    'طلبات التركيب':'installation-claims.html','الفنيون':'technicians.html',
    'مستويات الولاء':'loyalty-tiers.html'
  };
  const path = location.pathname.split('/').pop() || 'index.html';
  const ix = Math.max(0, pages.findIndex(p => p[0] === path));
  let noticeTimer;
  function toast(message) {
    let el = document.querySelector('.mk-tour-notice');
    if(!el){el=document.createElement('div');el.className='mk-tour-notice';el.setAttribute('role','status');document.body.appendChild(el)}
    el.textContent = message;el.hidden=false;
    clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>el.hidden=true,4500);
  }
  function go(href){ location.assign(href); }
  function navFor(text){
    const normalized = (text||'').trim().replace(/\s+\d+\s*$/,'').replace(/\s+/g,' ');
    return aliases[normalized] || null;
  }
  // Add reliable navigation to every original sidebar button without altering its original CSS.
  const sidebar = document.querySelector('#sidebar');
  if (sidebar) {
    sidebar.querySelectorAll('button').forEach(b => {
      const t=(b.querySelector('.flex-1')?.textContent||b.textContent||'').trim();
      const target=navFor(t);
      if(target) {
        b.setAttribute('title','انتقل إلى: '+t);
        if(target !== path) {
          b.removeAttribute('aria-current');
          b.classList.remove('bg-accent','text-primary','border-r-4','border-primary');
          b.addEventListener('click',()=>go(target));
        } else {
          b.setAttribute('aria-current','page');
          b.classList.add('bg-accent','text-primary','border-r-4','border-primary');
        }
      } else if(t && !['MK KASHIYAMA'].includes(t)) {
        b.addEventListener('click',()=>toast('قسم «'+t+'» خارج نطاق الشاشات السبع المتاحة حاليًا في هذا العرض.'));
      }
    });
  }
  const widget=document.createElement('nav');
  widget.className='mk-tour';widget.setAttribute('aria-label','التنقل بين شاشات النموذج التجريبي');
  widget.innerHTML = `<button type="button" class="mk-tour-trigger" aria-expanded="false" aria-controls="mk-tour-panel"><span>☰</span><span>جولة النظام</span><span style="font-family:monospace;opacity:.8;direction:ltr">${ix+1}/7</span></button><div class="mk-tour-panel" id="mk-tour-panel" hidden><div class="mk-tour-heading">MK KASHIYAMA <span style="font-size:10px;color:#64748b">CLIENT DEMO</span></div><p class="mk-tour-sub">عرض تفاعلي تجريبي باستخدام بيانات عينة، دون الاتصال بخادم أو تنفيذ معاملات مالية حقيقية.</p>${pages.map((p,i)=>`<a class="mk-tour-link" href="${p[0]}" ${p[0]===path?'aria-current="page"':''}><span class="mk-tour-no">${String(i+1).padStart(2,'0')}</span><span>${p[1]}</span></a>`).join('')}<a class="mk-tour-home" href="../index.html">↗ العودة إلى مراحل المشروع</a><div class="mk-tour-bar"><button type="button" data-tour="prev">السابق</button><button type="button" data-tour="next">التالي</button></div></div>`;
  document.body.appendChild(widget);
  const trigger=widget.querySelector('.mk-tour-trigger'); const panel=widget.querySelector('.mk-tour-panel');
  trigger.addEventListener('click',()=>{panel.hidden=!panel.hidden;trigger.setAttribute('aria-expanded',String(!panel.hidden))});
  widget.querySelector('[data-tour=prev]').addEventListener('click',()=>go(pages[(ix+6)%7][0]));
  widget.querySelector('[data-tour=next]').addEventListener('click',()=>go(pages[(ix+1)%7][0]));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){panel.hidden=true;trigger.setAttribute('aria-expanded','false')}});
  document.addEventListener('click',e=>{if(!widget.contains(e.target)&&!panel.hidden){panel.hidden=true;trigger.setAttribute('aria-expanded','false')}});
  const w=document.createElement('div');w.className='mk-demo-watermark';w.textContent='نسخة عرض تجريبية · بيانات عينة';document.body.appendChild(w);
  // Semantic context links that would otherwise only show non-actionable toasts.
  if(path==='technicians.html'){
    ['btn-claims'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>go('installation-claims.html')));
    document.getElementById('btn-tiers')?.addEventListener('click',()=>go('loyalty-tiers.html'));
    document.addEventListener('click',e=>{const t=e.target.closest('[data-go]');if(!t)return;const v=t.getAttribute('data-go');if(v==='claims')go('installation-claims.html');if(v==='tiers')go('loyalty-tiers.html')},true);
  }
  // Dashboard supports opening the real claims workspace and product catalog.
  if(path==='index.html'){
    const buttons=[...document.querySelectorAll('main button, #main-column button')];
    for(const b of buttons){const t=(b.textContent||'').trim();
      if(/^(اعتماد الطلب|رفض مع سبب|مراجعة طلبات|متابعة مراجعة الطلبات|فتح قائمة المراجعة)$/.test(t))b.addEventListener('click',()=>go('installation-claims.html'));
      if(t==='إضافة صنف جديد')b.addEventListener('click',()=>go('products.html'));
    }
  }
  // CSV export is a genuinely working demonstration for selected overview screens.
  function csvFile(name,arr){
    const q=v=>'"'+String(v??'').replaceAll('"','""')+'"';
    const body='\uFEFF'+arr.map(row=>row.map(q).join(',')).join('\r\n');
    const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([body],{type:'text/csv;charset=utf-8'}));link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),2000)
  }
  // Keep original design interactions on all pages; avoid pretending demo actions touch a live server.
  window.MKDemo={toast,go,csvFile};
})();
