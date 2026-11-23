/* Bright Little Eyes: one shared voice for the apps.
   Picks the most natural English voice on this device: a Premium voice first, then an Enhanced one,
   then a clear standard voice. Never the novelty voices (Bells, Bubbles, Zarvox, …).
   An app that already chose a voice (for example from its own voice menu) keeps its choice. */
(function(){
  if(!('speechSynthesis' in window)) return;
  var NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|pipe/i;
  var LIKE = ['ava','zoe','joelle','samantha','allison','nicky','susan','evan','nathan','noelle','tom','aaron','jenny','aria','google us english'];
  function score(v){
    var id = (v.name+' '+v.voiceURI).toLowerCase(), s = 25;
    if(!/^en[-_]/i.test(v.lang) || NOVELTY.test(v.name)) return -1;
    if(/premium/.test(id)) s += 300; else if(/enhanced/.test(id)) s += 200; else if(/siri/.test(id)) s += 150; else if(/compact/.test(id)) s -= 20;
    if(/^en[-_]us/i.test(v.lang)) s += 30;
    var i = LIKE.findIndex(function(n){ return id.indexOf(n) >= 0; }); if(i >= 0) s += 60 - i*3;
    if(v.localService) s += 5;
    return s;
  }
  window.bleVoices = function(){
    var all = []; try{ all = speechSynthesis.getVoices() || []; }catch(e){}
    return all.map(function(v){ return {v:v, s:score(v)}; }).filter(function(x){ return x.s >= 0; })
      .sort(function(a,b){ return b.s - a.s; }).map(function(x){ return x.v; });
  };
  window.bleVoiceKind = function(v){ var id=(v.name+' '+v.voiceURI).toLowerCase(); return /premium/.test(id)?'Premium':/enhanced/.test(id)?'Enhanced':'Standard'; };
  window.bleBestVoice = function(){ return window.bleVoices()[0] || null; };
  try{ speechSynthesis.getVoices(); speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', function(){ speechSynthesis.getVoices(); }); }catch(e){}
  /* Any speech with no voice chosen gets the best one */
  var speak = speechSynthesis.speak.bind(speechSynthesis);
  speechSynthesis.speak = function(u){
    try{ if(u && !u.voice){ var b = window.bleBestVoice(); if(b){ u.voice = b; u.lang = b.lang; } } }catch(e){}
    return speak(u);
  };
})();
