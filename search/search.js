(function(){
  'use strict';

  var VERSION = (window.__SEARCH_BUILD__ || Date.now()) + '';
  var INDEX_URL = '/search/index.json?v=' + encodeURIComponent(VERSION);

  var $input = document.getElementById('search-input');
  var $results = document.getElementById('search-results');
  var $empty = document.getElementById('search-empty');
  var $stats = document.getElementById('search-stats');

  var docs = [];
  var ready = false;
  var activeIndex = -1;

  function debounce(fn, wait){
    var t; return function(){
      var ctx=this, args=arguments;
      clearTimeout(t); t=setTimeout(function(){ fn.apply(ctx,args); }, wait||200);
    };
  }

  function normalize(str){
    if (!str) return '';
    try{
      return (str+"")
        .toLowerCase()
        .replace(/\s+/g,' ')
        .replace(/[\u0000-\u001f]/g,'')
        .trim();
    }catch(e){return ''}
  }

  function isCJK(ch){
    var code = ch.charCodeAt(0);
    // Basic CJK Unified Ideographs
    return (code >= 0x4E00 && code <= 0x9FFF) ||
           (code >= 0x3400 && code <= 0x4DBF) ||
           (code >= 0xF900 && code <= 0xFAFF);
  }

  function splitRuns(str){
    var runs = [], cur = '', isC = null;
    for (var i=0;i<str.length;i++){
      var ch = str[i];
      var cjk = isCJK(ch);
      if (isC === null){ isC = cjk; cur = ch; }
      else if (cjk === isC){ cur += ch; }
      else { runs.push({cjk:isC, text:cur}); isC=cjk; cur=ch; }
    }
    if (cur) runs.push({cjk:isC, text:cur});
    return runs;
  }

  function asciiWords(str){
    var words = str.split(/[^a-z0-9]+/i).filter(Boolean);
    return words;
  }

  function ngrams(text, minN, maxN){
    var arr = [];
    var Nmin = minN||2, Nmax = maxN||3;
    if (!text) return arr;
    for (var n=Nmin; n<=Nmax; n++){
      for (var i=0; i<=text.length - n; i++){
        arr.push(text.slice(i, i+n));
      }
    }
    return arr;
  }

  function queryTokens(q){
    q = normalize(q);
    if (!q) return [];
    var tokens = [];
    var runs = splitRuns(q);
    for (var i=0;i<runs.length;i++){
      var r = runs[i];
      if (r.cjk){
        if (r.text.length === 1){ tokens.push(r.text); }
        else { tokens = tokens.concat(ngrams(r.text, 2, Math.min(3, r.text.length))); }
      } else {
        asciiWords(r.text).forEach(function(w){
          if (!w) return;
          w = w.toLowerCase();
          tokens.push(w);
          // add some prefixes for fuzzy/prefix match
          for (var len=2; len<=Math.min(10, w.length); len++){
            tokens.push(w.slice(0,len));
          }
        });
      }
    }
    // unique
    var seen = Object.create(null);
    var out = [];
    for (var j=0;j<tokens.length;j++){
      var t = tokens[j];
      if (!seen[t]){ seen[t]=1; out.push(t); }
    }
    return out;
  }

  function textFromDoc(doc){
    var title = normalize(doc.title || '');
    var excerpt = normalize(doc.excerpt || '');
    var tags = Array.isArray(doc.tags) ? doc.tags.join(' ') : (doc.tags || '');
    tags = normalize(tags);
    return { title: title, body: (title + ' ' + excerpt + ' ' + tags).trim() };
  }

  function scoreDoc(doc, q, tokens){
    var t = textFromDoc(doc);
    var score = 0;

    if (!t.title && !t.body) return 0;

    if (q){
      if (t.title.indexOf(q) !== -1) score += 10;
      if (t.body.indexOf(q) !== -1) score += 4;
    }

    if (tokens && tokens.length){
      for (var i=0;i<tokens.length;i++){
        var tok = tokens[i];
        if (!tok) continue;
        if (t.title.indexOf(tok) !== -1) score += 3;
        if (t.body.indexOf(tok) !== -1) score += 1;
      }
    }

    return score;
  }

  function parseDate(str){
    if (!str) return 0;
    var t = Date.parse(str);
    return isNaN(t) ? 0 : t;
  }

  function formatDate(str){
    if (!str) return '';
    try{
      var d = new Date(str);
      if (isNaN(d.getTime())) return str;
      var y=d.getFullYear(); var m=('0'+(d.getMonth()+1)).slice(-2); var da=('0'+d.getDate()).slice(-2);
      return y+'-'+m+'-'+da;
    }catch(e){ return str; }
  }

  function highlight(text, q){
    if (!text || !q) return text || '';
    try{
      var idx = text.toLowerCase().indexOf(q.toLowerCase());
      if (idx === -1) return text;
      return text.slice(0, idx) + '<mark>' + text.slice(idx, idx+q.length) + '</mark>' + text.slice(idx+q.length);
    }catch(e){ return text; }
  }

  function makeSnippet(doc, q){
    var raw = (doc.excerpt || '');
    var text = raw.replace(/\s+/g,' ').trim();
    if (!text){
      text = doc.title || '';
    }
    if (!text) return '';
    var lower = text.toLowerCase();
    var pos = q ? lower.indexOf(q.toLowerCase()) : -1;
    var start = Math.max(0, pos - 24);
    var end = Math.min(text.length, (pos === -1 ? 80 : pos + q.length + 24));
    var snippet = text.slice(start, end);
    if (start>0) snippet = '…' + snippet;
    if (end<text.length) snippet = snippet + '…';
    return highlight(snippet, q);
  }

  function render(results, q){
    $results.innerHTML='';
    activeIndex = -1;

    if (!q){
      $empty.style.display='block';
      $stats.textContent='';
      return;
    }

    if (!results.length){
      $empty.style.display='block';
      $empty.textContent='没有找到匹配的内容，换个关键词试试？';
      $stats.textContent='0 条结果';
      return;
    }

    $empty.style.display='none';
    $stats.textContent = results.length + ' 条结果';

    var frag = document.createDocumentFragment();
    results.forEach(function(r, idx){
      var li = document.createElement('li');
      li.className = 'search-result px-2 py-2';
      li.setAttribute('role', 'option');
      li.setAttribute('data-index', idx);

      var a = document.createElement('a');
      a.href = r.url;
      a.innerHTML = (r.title || r.url);
      a.className = 'd-block';

      var snippet = document.createElement('div');
      snippet.className = 'search-snippet';
      snippet.innerHTML = makeSnippet(r, q);

      var meta = document.createElement('div');
      meta.className = 'search-meta';
      var parts = [];
      if (r.date) parts.push(formatDate(r.date));
      if (Array.isArray(r.tags) && r.tags.length) parts.push('#'+r.tags.join(' #'));
      meta.textContent = parts.join(' · ');

      li.appendChild(a);
      if (snippet.textContent) li.appendChild(snippet);
      if (meta.textContent) li.appendChild(meta);

      li.addEventListener('mousemove', function(){ setActive(idx); });
      li.addEventListener('click', function(){ window.location.href = r.url; });

      frag.appendChild(li);
    });
    $results.appendChild(frag);
  }

  function setActive(i){
    var items = $results.querySelectorAll('.search-result');
    items.forEach(function(el){ el.classList.remove('search-active'); });
    if (i>=0 && i<items.length){
      items[i].classList.add('search-active');
      activeIndex = i;
    }else{
      activeIndex = -1;
    }
  }

  function onKeyDown(e){
    var items = $results.querySelectorAll('.search-result');
    if (!items.length) return;
    if (e.key === 'ArrowDown' || e.keyCode === 40){
      e.preventDefault();
      var next = (activeIndex + 1) % items.length;
      setActive(next);
      ensureVisible(items[next]);
    } else if (e.key === 'ArrowUp' || e.keyCode === 38){
      e.preventDefault();
      var prev = (activeIndex - 1 + items.length) % items.length;
      setActive(prev);
      ensureVisible(items[prev]);
    } else if (e.key === 'Enter' || e.keyCode === 13){
      if (activeIndex >= 0){
        var link = items[activeIndex].querySelector('a');
        if (link) window.location.href = link.href;
      } else if (items[0]){
        var first = items[0].querySelector('a');
        if (first) window.location.href = first.href;
      }
    }
  }

  function ensureVisible(el){
    if (!el) return;
    var rect = el.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > (window.innerHeight || document.documentElement.clientHeight)){
      el.scrollIntoView({block:'nearest'});
    }
  }

  var doSearch = debounce(function(){
    var qraw = ($input.value || '').trim();
    var q = normalize(qraw);

    if (!q){
      render([], q);
      return;
    }

    if (!ready){
      $stats.textContent = '正在加载索引…';
      return;
    }

    var tokens = queryTokens(qraw);

    var items = [];
    for (var i=0;i<docs.length;i++){
      var d = docs[i];
      var s = scoreDoc(d, q, tokens);
      if (s > 0){
        items.push({score:s, date: parseDate(d.date), doc: d});
      }
    }

    items.sort(function(a,b){
      if (b.score !== a.score) return b.score - a.score;
      return (b.date||0) - (a.date||0);
    });

    var results = items.map(function(x){return x.doc;});
    render(results, qraw);
  }, 120);

  function tryLoadMiniSearch(callback){
    // Optional: if MiniSearch is available via CDN, use it; otherwise fall back to local n-gram search.
    var url = 'https://cdn.jsdelivr.net/npm/minisearch@6.3.0/dist/umd/index.min.js';
    var s = document.createElement('script');
    var done = false;
    s.src = url;
    s.async = true;
    s.onload = function(){ if (!done){ done=true; callback(true); } };
    s.onerror = function(){ if (!done){ done=true; callback(false); } };
    document.head.appendChild(s);
  }

  function buildWithMiniSearch(){
    try{
      if (!window.MiniSearch) return false;
      var mini = new window.MiniSearch({
        fields: ['title','excerpt','tags'],
        storeFields: ['title','excerpt','tags','url','date'],
        searchOptions: { prefix: true, fuzzy: 0.2 }
      });
      mini.addAll(docs.map(function(d){ return {
        id: d.id || d.url,
        title: d.title || '',
        excerpt: d.excerpt || '',
        tags: Array.isArray(d.tags) ? d.tags.join(' ') : (d.tags||''),
        url: d.url,
        date: d.date
      }; }));
      // Replace doSearch to use MiniSearch
      var oldDoSearch = doSearch;
      doSearch = debounce(function(){
        var qraw = ($input.value || '').trim();
        if (!qraw){ render([], ''); return; }
        var results = mini.search(qraw, { prefix:true, fuzzy:0.2 }).map(function(r){
          var d = docs.find(function(x){ return (x.id || x.url) === r.id; }) || { url: r.id };
          return d;
        });
        render(results, qraw);
      }, 120);
      return true;
    }catch(e){ return false; }
  }

  function loadIndex(){
    $stats.textContent = '正在加载索引…';
    fetch(INDEX_URL, { credentials: 'same-origin' })
      .then(function(res){ return res.json(); })
      .then(function(list){ docs = Array.isArray(list) ? list : []; ready = true; $stats.textContent=''; doSearch(); })
      .catch(function(){
        $stats.textContent = '索引加载失败，请刷新重试。';
      });
  }

  function init(){
    if (!$input || !$results) return;
    $input.addEventListener('input', doSearch);
    document.addEventListener('keydown', onKeyDown);
    loadIndex();

    // Try to upgrade to MiniSearch if online
    tryLoadMiniSearch(function(ok){
      if (ok){ buildWithMiniSearch(); }
    });
  }

  init();
})();
