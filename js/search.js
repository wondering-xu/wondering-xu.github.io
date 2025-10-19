(function(){
  'use strict';

  var input = null;
  var resultsEl = null;
  var emptyEl = null;
  var statsEl = null;
  var items = [];
  var activeIndex = -1;
  var currentResults = [];

  function $(id){ return document.getElementById(id); }

  function debounce(fn, wait){
    var t; return function(){
      var ctx = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function(){ fn.apply(ctx, args); }, wait);
    };
  }

  function normalize(str){
    if(!str) return '';
    var s = String(str).toLowerCase();
    // remove most punctuation but keep CJK intact
    s = s.replace(/[\u0000-\u002f\u003a-\u0040\u005b-\u0060\u007b-\u007e]/g, '');
    s = s.replace(/\s+/g, '');
    return s;
  }

  function tokenizeQuery(q){
    // For latin, split by spaces; for CJK, use the whole string
    q = q.trim();
    if(!q) return [];
    if(/[\u4E00-\u9FFF]/.test(q)){
      return [q];
    }
    return q.split(/\s+/).filter(Boolean);
  }

  function highlight(text, query){
    if(!text || !query) return escapeHtml(text || '');
    // For Latin queries possibly containing spaces, highlight each token
    var tokens = /[\u4E00-\u9FFF]/.test(query) ? [query] : query.split(/\s+/).filter(Boolean);
    var html = escapeHtml(text);
    tokens.forEach(function(tok){
      if(!tok) return;
      try {
        var re = new RegExp(escapeRegExp(tok), 'gi');
        html = html.replace(re, function(m){ return '<mark>' + m + '</mark>'; });
      } catch(e) {}
    });
    return html;
  }

  function escapeHtml(s){
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeRegExp(s){
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function renderResults(list, query){
    resultsEl.innerHTML = '';
    activeIndex = -1;
    currentResults = list;

    if(!list.length){
      emptyEl.style.display = 'block';
      statsEl.textContent = '';
      return;
    }

    emptyEl.style.display = 'none';

    var frag = document.createDocumentFragment();
    list.forEach(function(item, idx){
      var li = document.createElement('li');
      li.className = 'search-result';
      li.setAttribute('role', 'option');
      li.setAttribute('id', 'res-' + idx);
      li.addEventListener('mouseenter', function(){ setActive(idx); });
      li.addEventListener('mouseleave', function(){ setActive(-1); });
      li.addEventListener('click', function(){ window.location.assign(item.url); });

      var a = document.createElement('a');
      a.href = item.url;
      a.innerHTML = '<strong>' + highlight(item.title, query) + '</strong>';
      var p = document.createElement('p');
      p.className = 'mb-1';
      p.innerHTML = highlight(item.excerpt || '', query);
      var small = document.createElement('small');
      small.textContent = item.url;

      li.appendChild(a);
      if(item.excerpt){ li.appendChild(p); }
      li.appendChild(small);
      frag.appendChild(li);
    });
    resultsEl.appendChild(frag);
  }

  function setActive(i){
    var children = resultsEl.children;
    for(var j=0; j<children.length; j++){
      children[j].classList.toggle('active', j === i);
      children[j].setAttribute('aria-selected', j === i ? 'true' : 'false');
    }
    activeIndex = i;
  }

  function doSearch(q){
    var start = performance.now();
    var tokens = tokenizeQuery(q);
    if(!tokens.length){
      resultsEl.innerHTML = '';
      emptyEl.style.display = 'none';
      statsEl.textContent = '';
      currentResults = [];
      return;
    }

    var nqFull = normalize(q);

    var matches = [];
    for(var i=0;i<items.length;i++){
      var it = items[i];
      var titleN = it._titleN;
      var textN = it._textN;

      var score = 0;
      var ok = true;

      // Require all tokens
      for(var t=0;t<tokens.length;t++){
        var tok = normalize(tokens[t]);
        if(!tok) continue;
        if(titleN.indexOf(tok) === -1 && textN.indexOf(tok) === -1){
          ok = false; break;
        }
        if(titleN.indexOf(tok) !== -1) score += 5;
        if(textN.indexOf(tok) !== -1) score += 3;
      }
      // Bonus for full query substring
      if(nqFull && (titleN.indexOf(nqFull) !== -1)) score += 15;
      if(nqFull && (textN.indexOf(nqFull) !== -1)) score += 8;

      if(ok && score > 0){
        // small tie-breaker: shorter url later
        matches.push({ item: it, score: score, urlLen: (it.url||'').length });
      }
    }

    matches.sort(function(a,b){ return (b.score - a.score) || (a.urlLen - b.urlLen); });

    var out = matches.slice(0, 50).map(function(m){ return m.item; });

    renderResults(out, q);

    var dur = Math.max(1, Math.round(performance.now() - start));
    statsEl.textContent = '找到 ' + out.length + ' 条结果，用时 ' + dur + 'ms';
  }

  var debouncedSearch = debounce(doSearch, 80);

  function init(){
    input = $('search-input');
    resultsEl = $('search-results');
    emptyEl = $('search-empty');
    statsEl = $('search-stats');

    // Keyboard navigation
    input.addEventListener('keydown', function(e){
      if(e.key === 'ArrowDown'){
        e.preventDefault();
        if(!currentResults.length) return;
        var next = (activeIndex + 1) >= currentResults.length ? 0 : activeIndex + 1;
        setActive(next);
      } else if(e.key === 'ArrowUp'){
        e.preventDefault();
        if(!currentResults.length) return;
        var prev = (activeIndex - 1) < 0 ? currentResults.length - 1 : activeIndex - 1;
        setActive(prev);
      } else if(e.key === 'Enter'){
        if(currentResults.length){
          var idx = activeIndex >= 0 ? activeIndex : 0;
          var target = currentResults[idx];
          if(target && target.url){ window.location.assign(target.url); }
        }
      }
    });

    input.addEventListener('input', function(e){
      debouncedSearch(e.target.value || '');
    });

    // Load index.json on demand
    fetch('/search/index.json', { cache: 'no-store' })
      .then(function(r){ return r.json(); })
      .then(function(json){
        if(!json || !Array.isArray(json.items)) throw new Error('索引格式错误');
        items = json.items.map(function(it){
          var text = '';
          if(Array.isArray(it.tags)) text += ' ' + it.tags.join(' ');
          text += ' ' + (it.excerpt || '');
          return Object.assign({}, it, {
            _titleN: normalize(it.title || ''),
            _textN: normalize(text)
          });
        });
        // Auto search if input has value from history
        if(input.value){ doSearch(input.value); }
      })
      .catch(function(err){
        console.error(err);
        statsEl.textContent = '无法加载搜索索引';
      });

    // Focus input on load
    setTimeout(function(){ input && input.focus && input.focus(); }, 0);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
