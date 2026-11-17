/* Tells the Daily Rhythm board that a lesson was finished in one of the school apps.
   The board then checks off that subject by itself (she can't check it off by hand).
   It writes one small mark into today's day record: apps.<app> = the time she finished. */
(function(){
  const URL = 'https://firestore.googleapis.com/v1/projects/survivor51-league/databases/(default)/documents/rhythm_days/';
  const PEND = 'rhythm:pendingReports';
  const pad = n => String(n).padStart(2,'0');
  const dayKey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const readPend = () => { try{ return JSON.parse(localStorage.getItem(PEND)||'[]')||[]; }catch(e){ return []; } };
  const writePend = a => { try{ a.length ? localStorage.setItem(PEND, JSON.stringify(a.slice(-40))) : localStorage.removeItem(PEND); }catch(e){} };
  async function send(r){
    const body = {fields:{apps:{mapValue:{fields:{[r.app]:{stringValue:r.at}}}}}};
    const res = await fetch(URL + r.day + '?updateMask.fieldPaths=' + encodeURIComponent('apps.'+r.app),
      {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body), keepalive:true});
    if(!res.ok) throw new Error('rhythm report ' + res.status);
  }
  /* A small note at the bottom of the app, so she (and Mom) can see it reached the board */
  function note(text, ok){
    const show = () => { let n = document.getElementById('rhythmNote');
      if(!n){ n = document.createElement('div'); n.id = 'rhythmNote'; n.setAttribute('role','status');
        n.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:99999;max-width:90vw;padding:12px 18px;border-radius:14px;font:600 16px/1.3 system-ui,-apple-system,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.18);text-align:center';
        document.body.appendChild(n); }
      n.style.background = ok ? '#E6F5EC' : '#FFF4E0'; n.style.color = ok ? '#14532D' : '#7A4A00';
      n.textContent = text; n.hidden = false; clearTimeout(n._t); n._t = setTimeout(() => { n.hidden = true; }, 6000); };
    document.body ? show() : document.addEventListener('DOMContentLoaded', show);
  }
  const sentKey = r => 'rhythm:sent:' + r.app + ':' + r.day;
  async function flush(){
    const all = readPend(); if(!all.length) return;
    const left = [];
    for(const r of all){ try{ await send(r); try{ localStorage.setItem(sentKey(r), '1'); }catch(e){}
        if(r.day === dayKey(new Date())) note('✓ Checked off on your rhythm board!', true); }
      catch(e){ left.push(r); note('Couldn\'t reach your rhythm board yet. It will try again when you\'re online.', false); } }
    const newer = readPend().filter(r => !all.some(x => x.app===r.app && x.day===r.day && x.at===r.at));
    writePend([...left, ...newer]);
  }
  /* app: a short name like "science6". Only letters and numbers. */
  window.rhythmReport = function(app){
    if(!/^[a-z0-9]+$/i.test(app||'')) return;
    const now = new Date(), r = {app, day:dayKey(now), at:now.toISOString()};
    writePend([...readPend().filter(x => !(x.app===app && x.day===r.day)), r]);
    flush();
  };
  /* When the app opens: if a lesson was already finished today (for example in an older version of
     the app that didn't send it), send it now. times: finish times (ms or date strings). */
  window.rhythmCatchUp = function(app, times){
    const k = dayKey(new Date());
    let sent = false; try{ sent = !!localStorage.getItem('rhythm:sent:' + app + ':' + k); }catch(e){}
    if(!sent && (times||[]).some(t => t && !isNaN(new Date(t)) && dayKey(new Date(t))===k)) window.rhythmReport(app);
  };
  window.addEventListener('online', flush);
  document.addEventListener('visibilitychange', () => { if(!document.hidden) flush(); });
  flush();
})();
