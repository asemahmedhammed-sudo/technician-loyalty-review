/* MK KASHIYAMA — client-review simulation. Uses the original exported preview DOM.
   No UX Pilot runtime, external data service, authorization, or financial transaction. */
(() => {
  'use strict';
  const $ = (q, parent=document) => parent.querySelector(q);
  const $$ = (q, parent=document) => [...parent.querySelectorAll(q)];
  const sidebar = $('aside'); if(sidebar) sidebar.id='sidebar';
  const queue = $('ul[aria-label="قائمة طلبات الاسترداد"]');
  const panel = $('main article');
  if(!queue || !panel) return;
  const panelTemplate = panel.innerHTML;
  const listButtons = $$('button[id^="queue-row-"]', queue);
  const rows = listButtons.map((btn,index) => {
    const code = btn.id.replace('queue-row-','');
    const name = $('p.truncate',btn)?.textContent.trim() || '';
    const status = btn.children[0]?.querySelector('span')?.textContent.trim() || 'طلب جديد';
    const date = btn.querySelector('.mt-2 .inline-flex')?.textContent.trim() || '';
    const attention = btn.textContent.includes('يحتاج انتباه');
    return {btn,index,code,name,status,date,attention};
  });
  const sample = {
    'RR-26-0423':{balance:420, tier:1480,tech:'FN-10391'},
    'RR-26-0419':{balance:750, tier:1650,tech:'FN-10392'},
    'RR-26-0418':{balance:900, tier:4620,tech:'FN-10393'},
    'RR-26-0417':{balance:3120,tier:2450,tech:'FN-10394'},
    'RR-26-0421':{balance:680, tier:1260,tech:'FN-10395'},
    'RR-26-0409':{balance:1300,tier:3200,tech:'FN-10396'},
    'RR-26-0414':{balance:240, tier:780,tech:'FN-10397'},
    'RR-26-0396':{balance:920, tier:4200,tech:'FN-10398'}
  };
  let selected = rows[0]; let filter = 'الكل'; let attentionOnly = false; let query = ''; let reverse = false; let toastTimer;
  const queueSection = queue.closest('section');
  const queueHeader = queueSection.querySelector('header');
  const tabBar = $$('.flex.flex-wrap.gap-1\\.5',queueHeader).find(el=>el.querySelectorAll('button').length>=6) || queueHeader.querySelector('div.flex.flex-wrap:last-child');
  const tabs = tabBar ? $$('button',tabBar) : [];
  const statusText = row=>row.status;
  const isFinal = row=> ['مرفوض','قيد الصرف','مكتمل الصرف','معتمد للمعالجة المالية'].includes(row.status);
  const stamp = ()=>new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium',timeStyle:'short'}).format(new Date());
  function showNote(message){
    let el=$('.mk-note');if(!el){el=document.createElement('div');el.className='mk-note';el.setAttribute('role','status');document.body.appendChild(el)}
    el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,4300);
  }
  function updateTabs(){
    tabs.forEach(btn=>{
      const label=btn.dataset.label || (btn.dataset.label=btn.querySelector('span > span:first-child')?.textContent.trim() || btn.textContent.trim().replace(/\s*\d+$/,''));
      const count=label==='الكل'?rows.length:rows.filter(r=>r.status===label).length;
      const countLabel=btn.querySelector('span[dir="ltr"].font-mono');
      if(countLabel)countLabel.textContent=String(count);
      btn.classList.toggle('mk-is-active',label===filter);
      btn.setAttribute('aria-pressed',String(label===filter));
    });
  }
  function applyFilter(){
    const matches=rows.filter(r=>(filter==='الكل'||r.status===filter)&&(!attentionOnly||r.attention)&&(!query||r.code.toLowerCase().includes(query)||r.name.toLowerCase().includes(query)||sample[r.code]?.tech.toLowerCase().includes(query)));
    const order=reverse?[...matches].reverse():matches;
    order.forEach(r=>queue.appendChild(r.btn.parentElement));
    rows.forEach(r=>{r.btn.parentElement.hidden=!matches.includes(r);});
    const hdr=queueHeader.querySelector('.text-muted-foreground');
    const m=$$('span,p',queueHeader).find(n=>n.children.length===0 && /\d+\s+من\s+\d+/.test(n.textContent));
    if(m)m.textContent=`${matches.length} من ${rows.length}`;
    let empty=$('#mk-rewards-empty');
    if(!matches.length){if(!empty){empty=document.createElement('li');empty.id='mk-rewards-empty';empty.className='p-5 text-center text-sm text-muted-foreground';empty.textContent='لا توجد طلبات تطابق البحث أو التصفية.';queue.appendChild(empty)}}else{empty?.remove()}
    if(matches.length && !matches.includes(selected)) selectRow(matches[0]);
    updateTabs();
  }
  function patchPanel(r){
    const data=sample[r.code]||sample[rows[0].code];
    const enough = data.balance >= 500;
    const index=rows.indexOf(r);
    // The snapshot is the approved UI. Reuse the same structure for selected demo records.
    let html=panelTemplate;
    html=html.replaceAll('RR-26-0423',r.code).replaceAll('ماجد الشهري',r.name).replaceAll('FN-10391',data.tech);
    html=html.replaceAll('14 مايو 2026 · 11:20',r.date).replaceAll('14 مايو · 11:20',r.date);
    html=html.replaceAll('1 من 8',`${index+1} من 8`);
    html=html.replaceAll('1,480',data.tier.toLocaleString('en-US'));
    html=html.replace(/(?<![\d,])420(?!\d)/g,String(data.balance));
    if(r.status!=='طلب جديد') html=html.replaceAll('طلب جديد',r.status);
    if(enough){
      html=html.replaceAll('الرصيد الممكن لا يكفي هدف الاسترداد','الرصيد المتاح يفي بهدف الاسترداد');
      html=html.replaceAll('الرصيد المتاح لا يكفي الهدف المُعد. يمكن رفض الطلب بسبب واضح، ولا يمكن اعتماده في هذه الحالة.','الرصيد المتاح يفي بالهدف المحدد في بيانات العرض. يجوز إصدار قرار إداري بعد مراجعة الأهلية.');
      html=html.replaceAll('لم تستوفِ شروط الاسترداد','مستوفية مبدئيًا من حيث الرصيد');
      html=html.replaceAll('الرصيد المتاح أقل من الهدف المُعد','الرصيد المتاح يفي بالهدف المُعد');
      html=html.replaceAll('الرصيد الممكن أقل من الهدف المُعد','الرصيد الممكن يفي بالهدف المُعد');
      html=html.replaceAll('الاعتماد غير متاح لأن الرصيد الممكن لهذا الطلب أقل من الهدف المُعد.','هذه بيانات محاكاة. الاعتماد لا ينفّذ عملية دفع فعلية.');
    }
    panel.innerHTML=html;
    const header=$('section[aria-labelledby="request-title"]',panel);
    const n=header?.querySelector('.me-1 .font-mono'); if(n)n.textContent=String(index+1);
    const back=panel.querySelector('button[aria-label="الطلب السابق في القائمة"]');
    const next=panel.querySelector('button[aria-label="الطلب التالي في القائمة"]');
    if(back)back.disabled=index===0;if(next)next.disabled=index===rows.length-1;
    const decision=$('section[aria-labelledby="decision-title"]',panel);
    const buttons=$$('button',decision||panel);
    const yes=buttons.find(b=>b.textContent.includes('اعتماد للمعالجة المالية'));
    const no=buttons.find(b=>b.textContent.includes('رفض الطلب'));
    if(yes)yes.disabled=!enough||isFinal(r);
    if(no)no.disabled=isFinal(r);
    const alert=decision?.querySelector('[role="alert"]');
    if(alert){
      if(enough){
        alert.classList.remove('bg-red-50','border-red-200','text-red-950');
        alert.classList.add('bg-success-subtle','border-success/30','text-success');
        const title=alert.querySelector('h5');
        if(title){title.classList.remove('text-red-900');title.classList.add('text-success');}
        const ico=alert.querySelector('svg');if(ico){ico.innerHTML='<path d="m5 12 4 4L19 6" stroke-linecap="round" stroke-linejoin="round" />';}
      }
      if(isFinal(r)){
        const title=alert.querySelector('h5'); if(title) title.textContent='تم تسجيل حالة الطلب: '+r.status;
        const info=alert.querySelector('div.text-sm.opacity-90');if(info)info.textContent='هذا الطلب لا يقبل قرار اعتماد أو رفض جديد ضمن بيانات هذا العرض.';
      }
    }
    $$('.mk-selected-marker').forEach(x=>x.classList.remove('mk-selected-marker'));
    rows.forEach(x=>{x.btn.setAttribute('aria-pressed',String(x===r));x.btn.classList.toggle('mk-is-active',x===r);});
    const bottom=$('main > p:last-child');
    if(bottom){bottom.textContent=`هذه الشاشة نموذج عرض تجريبي دون اتصال بخادم أو إجراء صرف مالي. الطلب المحدد: ${r.code} · ${r.name} · الرصيد التوضيحي: ${data.balance.toLocaleString('en-US')} نقطة. الأرقام عينة وليست سجلات فعلية.`;}
  }
  function selectRow(row){selected=row;patchPanel(row);}
  function updateDecision(type, reason=''){
    if(isFinal(selected)) return;
    if(type==='approve' && (sample[selected.code]?.balance||0)<500){showNote('لا يمكن اعتماد الطلب: الرصيد المتاح أقل من الهدف.');return;}
    selected.status=type==='approve'?'معتمد للمعالجة المالية':'مرفوض';selected.attention=false;
    const badge=selected.btn.children[0]?.querySelector('span > span:last-child');if(badge)badge.textContent=selected.status;
    const notice=selected.btn.querySelector('.mt-2 > span:last-child');if(notice?.textContent.includes('يحتاج انتباه'))notice.remove();
    selectRow(selected);applyFilter();
    showNote(type==='approve'?'تمت محاكاة اعتماد الطلب للمعالجة المالية. لم تتم أي عملية صرف.':`تمت محاكاة رفض الطلب. ${reason?'السبب: '+reason:''} لا توجد تغييرات محفوظة على الخادم.`);
  }
  function showDialog(type){
    const confirm=type==='approve';
    const overlay=document.createElement('div');overlay.className='mk-dialog-overlay'; overlay.setAttribute('role','presentation');
    overlay.innerHTML=`<div class="mk-dialog" role="dialog" aria-modal="true" aria-labelledby="mk-dialog-title"><h2 id="mk-dialog-title">${confirm?'تأكيد الاعتماد الإداري':'رفض طلب المكافأة'}</h2><p>${confirm?'تأكيد تحويل الطلب إلى مرحلة المعالجة المالية فقط. لن يتم صرف أي مبلغ في هذا العرض التجريبي.':'اذكر سبب الرفض ليظهر كتوضيح ضمن المحاكاة. لن يتم حفظ القرار في قاعدة بيانات.'}</p>${confirm?'':'<label for="mk-reason" style="font-size:13px;font-weight:600;display:block;margin-bottom:8px">سبب الرفض <span style="color:#e72125">*</span></label><textarea id="mk-reason" placeholder="مثال: الرصيد غير كافٍ أو نقص في المتطلبات" maxlength="500"></textarea><p id="mk-reason-error" style="color:#c4181c" hidden>يرجى كتابة سبب للرفض.</p>'}<div class="actions"><button type="button" class="${confirm?'primary':'danger'}" data-action="submit">${confirm?'تأكيد الاعتماد':'تأكيد الرفض'}</button><button type="button" data-action="cancel">إلغاء</button></div></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('[data-action="cancel"]').addEventListener('click',()=>overlay.remove());
    overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});
    const esc=e=>{if(e.key==='Escape'){overlay.remove();document.removeEventListener('keydown',esc)}};document.addEventListener('keydown',esc);
    overlay.querySelector('[data-action="submit"]').addEventListener('click',()=>{
      const reason=overlay.querySelector('textarea')?.value.trim()||'';
      if(!confirm && reason.length<3){overlay.querySelector('#mk-reason-error').hidden=false;return;}
      overlay.remove();document.removeEventListener('keydown',esc);updateDecision(confirm?'approve':'reject',reason);
    });
    (overlay.querySelector('textarea')||overlay.querySelector('[data-action="submit"]')).focus();
  }
  // Search and filters
  const search=$('input[placeholder^="ابحث برقم الطلب"]');
  search?.addEventListener('input',e=>{query=e.target.value.trim().toLowerCase();applyFilter()});
  const only=$('input[type="checkbox"]',queueHeader);
  only?.addEventListener('change',e=>{attentionOnly=e.target.checked;applyFilter()});
  tabs.forEach(btn=>btn.addEventListener('click',()=>{filter=btn.dataset.label||btn.textContent.trim().replace(/\s+\d+$/,'');applyFilter()}));
  const sort=$('button[aria-label="ترتيب الطلبات"]');
  sort?.addEventListener('click',()=>{reverse=!reverse;const spans=$$('span',sort);const label=spans.find(n=>!n.querySelector('*')&&n.textContent.trim());if(label)label.textContent=reverse?'الأقدم أولًا':'الأولوية ثم الأحدث';applyFilter();});
  const role=$('button[aria-label="الصلاحية المعروضة في الشاشة"]');
  role?.addEventListener('click',()=>showNote('دور العرض: مراجع مكافآت. لا تتوفر صلاحيات فعلية في النموذج التجريبي.'));
  queue.addEventListener('click',e=>{const btn=e.target.closest('button[id^="queue-row-"]');const row=rows.find(r=>r.btn===btn);if(row)selectRow(row)});
  panel.addEventListener('click',e=>{
    const btn=e.target.closest('button');if(!btn)return;
    if(btn.getAttribute('aria-label')==='الطلب السابق في القائمة' && !btn.disabled){selectRow(rows[Math.max(0,rows.indexOf(selected)-1)]);return;}
    if(btn.getAttribute('aria-label')==='الطلب التالي في القائمة' && !btn.disabled){selectRow(rows[Math.min(rows.length-1,rows.indexOf(selected)+1)]);return;}
    const label=btn.textContent.trim();
    if(label.includes('اعتماد للمعالجة المالية')&&!btn.disabled){showDialog('approve');return;}
    if(label.includes('رفض الطلب')&&!btn.disabled){showDialog('reject');return;}
    if(label.includes('فتح الصرف اليدوي')||label.includes('فتح العهدة المالية'))showNote('هذه وحدة مستقلة لم تُدرج ضمن الشاشات المتاحة حاليًا في العرض. لا تُنفَّذ أي تحويلات مالية.');
  });
  // Preserve initial detail DOM exactly as exported. Only set up filtering / interactions.
  rows.forEach(r=>r.btn.setAttribute('data-status',r.status));
  updateTabs();
})();
