/* Bright Little Eyes: one shared voice for the apps.
   Picks the most natural English voice on this device: a Premium voice first, then an Enhanced one,
   then a clear standard voice. Never the novelty voices (Bells, Bubbles, Zarvox, …).
   An app that already chose a voice (for example from its own voice menu) keeps its choice. */
(function(){
  if(!('speechSynthesis' in window)) return;
  /* <script src="../voice.js" data-only="joelle"> locks an app to one voice (Ruth's apps: Joelle).
     If that voice isn't on the device, it falls back to the best one so the app never goes quiet. */
  var me = document.currentScript, ONLY = ((me && me.dataset && me.dataset.only) || '').toLowerCase();
  var NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|pipe/i;
  var LIKE = ['joelle','ava','zoe','samantha','allison','nicky','susan','evan','nathan','noelle','tom','aaron','jenny','aria','google us english'];
  function score(v){
    var id = (v.name+' '+v.voiceURI).toLowerCase(), s = 25;
    if(!/^en[-_]/i.test(v.lang) || NOVELTY.test(v.name)) return -1;
    if(/premium/.test(id)) s += 300; else if(/enhanced/.test(id)) s += 200; else if(/siri/.test(id)) s += 150; else if(/compact/.test(id)) s -= 20;
    if(/^en[-_]us/i.test(v.lang)) s += 30;
    var i = LIKE.findIndex(function(n){ return id.indexOf(n) >= 0; }); if(i >= 0) s += 60 - i*3;
    if(/joelle/.test(id)) s += 150;   /* Mom's pick for Ruth: Joelle wins whenever she's installed */
    if(v.localService) s += 5;
    return s;
  }
  window.bleVoices = function(){
    var all = []; try{ all = speechSynthesis.getVoices() || []; }catch(e){}
    return all.map(function(v){ return {v:v, s:score(v)}; }).filter(function(x){ return x.s >= 0; })
      .sort(function(a,b){ return b.s - a.s; }).map(function(x){ return x.v; });
  };
  window.bleVoiceKind = function(v){ var id=(v.name+' '+v.voiceURI).toLowerCase(); return /premium/.test(id)?'Premium':/enhanced/.test(id)?'Enhanced':'Standard'; };
  window.bleOnlyVoice = function(){ if(!ONLY) return null; return window.bleVoices().find(function(v){ return (v.name+' '+v.voiceURI).toLowerCase().indexOf(ONLY) >= 0; }) || null; };
  window.bleBestVoice = function(){ return window.bleOnlyVoice() || window.bleVoices()[0] || null; };
  window.bleOnlyName = ONLY;
  try{ speechSynthesis.getVoices(); speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', function(){ speechSynthesis.getVoices(); }); }catch(e){}
  /* Any speech with no voice chosen gets the best one */
  var speak = speechSynthesis.speak.bind(speechSynthesis);
  speechSynthesis.speak = function(u){
    try{ var o = window.bleOnlyVoice();
      if(u && o){ u.voice = o; u.lang = o.lang; }                       /* locked voice always wins */
      else if(u && !u.voice){ var b = window.bleBestVoice(); if(b){ u.voice = b; u.lang = b.lang; } } }catch(e){}
    return speak(u);
  };
  /* With a locked voice, the apps' own voice menus are replaced by a short note */
  if(ONLY){
    var nice = ONLY.charAt(0).toUpperCase() + ONLY.slice(1);
    var swap = function(){ ['bleVSel','vsel'].forEach(function(id){ var el = document.getElementById(id); if(!el || el.dataset.bleLocked) return;
      el.dataset.bleLocked = '1'; var row = el.parentElement;
      var note = document.createElement('p'); note.className = 'note'; note.style.fontWeight = '700';
      note.textContent = 'Voice: ' + nice + ' (set for all of Ruth\'s apps).';
      row.parentElement.insertBefore(note, row); row.style.display = 'none';
      ['bleVNote','vnote'].forEach(function(n){ var x = document.getElementById(n); if(x) x.style.display = 'none'; }); }); };
    var start = function(){ swap(); try{ new MutationObserver(swap).observe(document.body, {childList:true, subtree:true}); }catch(e){} };
    document.body ? start() : document.addEventListener('DOMContentLoaded', start);
  }
})();
