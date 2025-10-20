(function(){
  'use strict';

  var RAF = window.requestAnimationFrame || function(cb){ return setTimeout(cb, 16); };
  var CAF = window.cancelAnimationFrame || clearTimeout;

  var enabled = false;
  var follower = null;
  var rafId = null;
  var tx = 0, ty = 0; // target x/y
  var cx = 0, cy = 0; // current x/y (lerp)

  function canRun(){
    try {
      if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
      if(window.matchMedia) {
        var hoverOK = window.matchMedia('(hover: hover)').matches;
        var fineOK = window.matchMedia('(pointer: fine)').matches;
        if(!hoverOK || !fineOK) return false;
      }
      return true;
    } catch(e){
      return false;
    }
  }

  function wantEnabled(){
    try {
      if(document.body && (document.body.dataset.cursor === 'enhanced' || document.body.classList.contains('cursor-enhanced'))) return true;
      return window.localStorage && window.localStorage.getItem('cursorEnhanced') === '1';
    } catch(e){
      return false;
    }
  }

  function loop(){
    cx += (tx - cx) * 0.18;
    cy += (ty - cy) * 0.18;
    if(follower){
      follower.style.transform = 'translate3d(' + (cx - 8) + 'px,' + (cy - 8) + 'px,0)';
    }
    rafId = RAF(loop);
  }

  function onMove(e){
    tx = e.clientX; ty = e.clientY;
    if(follower) follower.classList.add('is-visible');
  }
  function onDown(){ if(follower) follower.classList.add('is-press'); }
  function onUp(){ if(follower) follower.classList.remove('is-press'); }
  function onLeave(){ if(follower) follower.classList.remove('is-visible'); }
  function onOver(e){
    if(!follower) return;
    var t = e.target;
    var tag = (t && t.tagName || '').toLowerCase();
    var clickable = tag === 'a' || tag === 'button' || t.getAttribute('role') === 'button' || t.closest && t.closest('a,button,[role="button"]');
    follower.style.backgroundColor = clickable ? 'rgba(0,0,0,0.06)' : 'transparent';
  }

  function enable(){
    if(enabled) return;
    enabled = true;
    follower = document.createElement('div');
    follower.className = 'cursor-follower';
    document.body.appendChild(follower);

    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mousedown', onDown, { passive: true });
    document.addEventListener('mouseup', onUp, { passive: true });
    document.addEventListener('mouseleave', onLeave, { passive: true });
    document.addEventListener('mouseover', onOver, { passive: true });

    rafId = RAF(loop);
  }

  function disable(){
    if(!enabled) return;
    enabled = false;
    try { CAF(rafId); } catch(e){}
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mousedown', onDown);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('mouseleave', onLeave);
    document.removeEventListener('mouseover', onOver);
    if(follower && follower.parentNode) follower.parentNode.removeChild(follower);
    follower = null;
  }

  function init(){ if(canRun() && wantEnabled()) enable(); }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.CursorUX = {
    enable: function(persist){ if(persist) try{ localStorage.setItem('cursorEnhanced','1'); }catch(e){} enable(); },
    disable: function(clear){ if(clear) try{ localStorage.removeItem('cursorEnhanced'); }catch(e){} disable(); },
    isEnabled: function(){ return enabled; }
  };
})();
