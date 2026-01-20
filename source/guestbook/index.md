---
title: 留言墙
layout: page
background: /assets/img/bg-guestbook.webp
---

<h1>可以说悄悄话的地方📬</h1>
<p>😄 留个言让我知道你还在这儿～<br>💌 别害羞，说点什么吧～<br>✏️ 留言会发财，多多益善</p>

<div id="msg-success" class="alert alert-success" role="alert" style="display:none;">
  感恩♥祝你有美好的一天，记得要开心😊
</div>

<form action="https://formsubmit.co/wonderingxu@gmail.com" method="POST">
  <!-- honeypot -->
  <input type="text" name="_honey" style="display:none">
  <!-- disable captcha -->
  <input type="hidden" name="_captcha" value="false">
  <!-- redirect after submit -->
  <input type="hidden" name="_next" value="https://wondering-xu.github.io/guestbook/?sent=1">
  <input type="hidden" name="_subject" value="网站留言">

  <div class="form-group">
    <label for="name">大侠贵姓Nickname</label>
    <input id="name" name="name" type="text" class="form-control" placeholder="好事要留名" required>
  </div>

  <div class="form-group">
    <label for="email">留个联系email</label>
    <input id="email" name="email" type="email" class="form-control" placeholder="可能有惊喜哦（可选）">
  </div>

  <div class="form-group">
    <label for="message">想说的话，就写在这里what's up</label>
    <textarea id="message" name="message" class="form-control" rows="5" placeholder="童言无忌，想说就说…" required></textarea>
  </div>

  <button type="submit" class="btn btn-light">发财（送）🧧按钮</button>
</form>

<noscript>
  <p class="text-muted mt-3">你的浏览器未启用 JavaScript，提交后会跳转到确认页。</p>
</noscript>

<script>
  (function(){
    try {
      var params = new URLSearchParams(window.location.search);
      if (params.get('sent') === '1') {
        var el = document.getElementById('msg-success');
        if (el) { el.style.display = 'block'; }
      }
    } catch(e) {}
  })();
</script>