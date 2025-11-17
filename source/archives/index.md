---
title: 归档
layout: archive
background: /assets/img/bg-archives.webp
---

<h1>随心记 · 归档</h1>
<div class="post-grid">
  <% page.posts.each(function(post) { %>
    <a class="post-card" href="<%- url_for(post.path) %>" data-cover="<%= post.cover || '/assets/img/bg-post.webp' %>">
      <div class="post-cover">
        <div class="post-meta">
          <h3><%= post.title %></h3>
          <time datetime="<%= date(post.date, 'YYYY-MM-DD') %>"><%= date(post.date, 'YYYY-MM-DD') %></time>
        </div>
      </div>
    </a>
  <% }); %>
</div>