// 若需修改水印文案，请编辑页面底部的 <footer class="site-watermark"> 区块。
// 切换统计方案：如需仅使用 CountAPI，可注释 loadBusuanzi() 调用并改为 loadCountAPI()。
(function () {
  function initWatermark() {
    var sitePV = document.getElementById('site-pv');
    if (!sitePV) {
      return;
    }

    var busuanziSpan = document.getElementById('busuanzi_value_site_pv');
    if (!busuanziSpan) {
      busuanziSpan = document.createElement('span');
      busuanziSpan.id = 'busuanzi_value_site_pv';
      busuanziSpan.setAttribute('aria-hidden', 'true');
      busuanziSpan.style.display = 'none';
      sitePV.parentNode.insertBefore(busuanziSpan, sitePV.nextSibling);
    }

    var observer = null;
    var hasBusuanziValue = false;

    function formatCount(value) {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      var number = Number(value);
      if (Number.isFinite(number)) {
        try {
          return number.toLocaleString('zh-CN');
        } catch (err) {
          return String(number);
        }
      }
      return String(value);
    }

    function render(value) {
      var formatted = formatCount(value);
      if (formatted) {
        sitePV.textContent = formatted;
      }
    }

    function handleBusuanziValue() {
      var text = busuanziSpan.textContent;
      if (text) {
        hasBusuanziValue = true;
        render(text);
        if (observer) {
          observer.disconnect();
          observer = null;
        }
        return true;
      }
      return false;
    }

    function observeBusuanzi() {
      if ('MutationObserver' in window && typeof window.MutationObserver === 'function') {
        observer = new window.MutationObserver(handleBusuanziValue);
        observer.observe(busuanziSpan, {
          childList: true,
          subtree: true,
          characterData: true
        });
      }
    }

    function loadCountAPI() {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      // CountAPI 命名示例：https://api.countapi.xyz/hit/<namespace>/<key>
      // 当前使用 feifei-site/global，可替换为站点域名，例如：https://api.countapi.xyz/hit/your-domain.com/visits
      fetch('https://api.countapi.xyz/hit/feifei-site/global')
        .then(function (response) {
          if (!response.ok) {
            throw new Error('CountAPI request failed');
          }
          return response.json();
        })
        .then(function (data) {
          if (data && typeof data.value !== 'undefined') {
            render(data.value);
            busuanziSpan.textContent = String(data.value);
          }
        })
        .catch(function () {
          // 保留回退占位符“--”
        });
    }

    function loadBusuanzi() {
      observeBusuanzi();

      var script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.src = '//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
      script.onerror = function () {
        loadCountAPI();
      };
      script.onload = function () {
        if (window.busuanzi && typeof window.busuanzi.getValue === 'function') {
          try {
            window.busuanzi.getValue('site_pv', function (count) {
              if (typeof count !== 'undefined') {
                hasBusuanziValue = true;
                render(count);
              }
            });
          } catch (err) {
            // 忽略异常，继续监听 DOM 变化
          }
        }

        var attempt = 0;
        var timer = window.setInterval(function () {
          attempt += 1;
          if (handleBusuanziValue()) {
            window.clearInterval(timer);
          } else if (attempt > 12) {
            window.clearInterval(timer);
            loadCountAPI();
          }
        }, 300);
      };
      document.body.appendChild(script);
    }

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(loadBusuanzi, { timeout: 2000 });
    } else if ('requestAnimationFrame' in window) {
      window.requestAnimationFrame(loadBusuanzi);
    } else {
      window.setTimeout(loadBusuanzi, 0);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWatermark);
  } else {
    initWatermark();
  }
})();
