'use strict';
(function () {
  var lightbox = document.querySelector('.photo-lightbox');
  if (!lightbox) {
    return;
  }

  var body = document.body;
  var lightboxImage = lightbox.querySelector('.lightbox-image');
  var captionEl = lightbox.querySelector('.lightbox-caption');
  var closeBtn = lightbox.querySelector('[data-lightbox-close]');
  var lastFocused = null;

  function openLightbox(src, alt, caption) {
    if (!src) {
      return;
    }
    lastFocused = document.activeElement;
    lightboxImage.src = src;
    lightboxImage.alt = alt || '';

    if (caption && caption.length > 0) {
      captionEl.textContent = caption;
      captionEl.removeAttribute('hidden');
    } else {
      captionEl.textContent = '';
      captionEl.setAttribute('hidden', '');
    }

    lightbox.classList.add('is-visible');
    lightbox.setAttribute('aria-hidden', 'false');
    body.classList.add('lightbox-open');
    if (closeBtn) {
      closeBtn.focus();
    }
  }

  function closeLightbox() {
    if (!lightbox.classList.contains('is-visible')) {
      return;
    }
    lightbox.classList.remove('is-visible');
    lightbox.setAttribute('aria-hidden', 'true');
    body.classList.remove('lightbox-open');
    lightboxImage.src = '';
    lightboxImage.alt = '';
    if (captionEl) {
      captionEl.textContent = '';
      captionEl.setAttribute('hidden', '');
    }

    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  }

  function handleTrigger(event) {
    var trigger = event.target.closest('[data-lightbox-trigger]');
    if (!trigger) {
      return;
    }
    event.preventDefault();
    var img = trigger.querySelector('img');
    var datasetSrc = trigger.getAttribute('data-lightbox-src');
    var hrefSrc = trigger.getAttribute('href');
    var fullSrc = datasetSrc || (img && img.getAttribute('data-full')) || hrefSrc || (img && (img.currentSrc || img.src));
    var alt = (img && img.getAttribute('alt')) || trigger.getAttribute('aria-label') || '';
    var caption = '';
    var figure = trigger.closest('figure');
    if (figure) {
      var figcaption = figure.querySelector('figcaption');
      if (figcaption) {
        caption = figcaption.textContent.trim();
      }
    }
    openLightbox(fullSrc, alt, caption);
  }

  function handleDocumentClick(event) {
    if (event.target.closest('[data-lightbox-trigger]')) {
      handleTrigger(event);
      return;
    }

    if (event.target === lightbox || event.target.hasAttribute('data-lightbox-close')) {
      event.preventDefault();
      closeLightbox();
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' || event.key === 'Esc') {
      closeLightbox();
      return;
    }

    if ((event.key === 'Enter' || event.key === ' ') && event.target.closest && event.target.closest('[data-lightbox-trigger]')) {
      event.preventDefault();
      handleTrigger(event);
    }
  }

  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleKeydown);

  if (closeBtn) {
    closeBtn.addEventListener('click', function (event) {
      event.preventDefault();
      closeLightbox();
    });
  }
})();
