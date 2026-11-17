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
  async function flush(){
    const all = readPend(); if(!all.length) return;
    const left = [];
    for(const r of all){ try{ await send(r); }catch(e){ left.push(r); } }
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
  window.addEventListener('online', flush);
  document.addEventListener('visibilitychange', () => { if(!document.hidden) flush(); });
  flush();
})();
