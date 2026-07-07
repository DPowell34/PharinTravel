// Destined 4 Destinations — shared site behavior
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var form = document.getElementById('quote-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var name = data.get('name') || 'there';
      var noteEl = document.getElementById('form-result');
      if (noteEl) {
        noteEl.textContent =
          'Thanks, ' + name + '! Your request has been noted locally. ' +
          'To actually receive these submissions, wire this form to an email service ' +
          '(e.g. Formspree) or POST it to the bridge server\'s webhook endpoint — see README.md.';
        noteEl.style.display = 'block';
      }
      form.reset();
    });
  }
});
