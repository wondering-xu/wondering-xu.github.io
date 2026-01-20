(function () {
  'use strict';

  var DEFAULT_COVER = '/assets/img/bg-post.webp';
  var cards = document.querySelectorAll('.post-card');

  if (!cards.length) {
    return;
  }

  Array.prototype.forEach.call(cards, function (card) {
    var coverEl = card.querySelector('.post-cover');

    if (!coverEl) {
      return;
    }

    var coverUrl = card.getAttribute('data-cover');

    if (coverUrl) {
      coverUrl = coverUrl.trim();
    }

    if (!coverUrl) {
      coverUrl = DEFAULT_COVER;
    }

    var sanitized = coverUrl.replace(/"/g, '\\"');
    coverEl.style.setProperty('--post-cover-image', 'url("' + sanitized + '")');
  });
})();
