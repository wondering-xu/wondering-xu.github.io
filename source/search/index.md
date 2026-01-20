---
title: 站内搜索
layout: page
background: /assets/img/bg-search.webp
---

<style>
  .search-container{max-width:980px}
  .search-input{position:sticky;top:0;z-index:2}
  .search-empty{color:#6c757d}
  .search-result{padding:.75rem 0;border-bottom:1px solid rgba(0,0,0,.05)}
  .search-result:last-child{border-bottom:none}
  .search-result a{font-weight:700;color:#333}
  .search-snippet{color:#666;margin:.25rem 0}
  .search-meta{color:#999;font-size:.875rem}
  .search-active{background:rgba(0,0,0,.035);border-radius:.25rem}
  @media (max-width:576px){
    .search-input .form-control{font-size:1rem;padding:.6rem .75rem}
  }
</style>

<div class="row justify-content-center">
  <div class="col-12 col-lg-10 px-4 search-container">
    <div class="search-input mb-3">
      <input id="search-input" type="search" class="form-control form-control-lg" placeholder="输入关键词，支持中文 | 英文（实时搜索）" autofocus aria-label="站内搜索输入框">
    </div>
    <div id="search-stats" class="text-muted small mb-2"></div>
    <div id="search-empty" class="search-empty">在这里输入你要查找的内容，例如：Hello、摄影、留言墙…</div>
    <ul id="search-results" class="list-unstyled" role="listbox" aria-label="搜索结果"></ul>
    <noscript>
      <p class="text-muted mt-3">你的浏览器未启用 JavaScript，无法使用站内搜索。</p>
    </noscript>
  </div>
</div>

<script>window.__SEARCH_BUILD__='20251021'</script>
<script src="/search/search.js?v=20251021"></script>