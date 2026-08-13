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


// ---- Reviews (homepage) ----
document.addEventListener('DOMContentLoaded', function () {
  var REVIEWS_API = 'https://d4dtravel.app/api/reviews';
  var reviewsSummaryEl = document.getElementById('reviews-summary');
  var reviewsListEl = document.getElementById('reviews-list');

  function renderStars(rating) {
    var full = Math.round(rating);
    var filled = '<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true"><path fill="currentColor" d="M12 2.5l2.98 6.44 7.02.7-5.25 4.9 1.5 6.96L12 17.9l-6.25 3.6 1.5-6.96L2 9.64l7.02-.7z"/></svg>';
    var empty = '<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.5" d="M12 2.5l2.98 6.44 7.02.7-5.25 4.9 1.5 6.96L12 17.9l-6.25 3.6 1.5-6.96L2 9.64l7.02-.7z"/></svg>';
    var out = '';
    for (var i = 1; i <= 5; i++) {
      out += i <= full ? filled : empty;
    }
    return out;
  }

  function injectReviewSchema(data) {
    var existing = document.getElementById('reviews-jsonld');
    if (existing) existing.remove();
    var reviews = data.reviews || [];
    if (!reviews.length) return;

    var schema = {
      "@context": "https://schema.org",
      "@type": "TravelAgency",
      "name": "Destined 4 Destinations",
      "url": "https://d4dtravel.com/",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": data.average,
        "reviewCount": data.count
      },
      "review": reviews.slice(0, 20).map(function (r) {
        return {
          "@type": "Review",
          "author": { "@type": "Person", "name": r.name },
          "datePublished": r.date,
          "reviewBody": r.text,
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": r.rating,
            "bestRating": 5,
            "worstRating": 1
          }
        };
      })
    };

    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'reviews-jsonld';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  function renderReviews(data) {
    if (!reviewsSummaryEl || !reviewsListEl) return;
    injectReviewSchema(data);
    var reviews = data.reviews || [];
    if (reviews.length === 0) {
      reviewsSummaryEl.innerHTML = '';
      reviewsListEl.innerHTML = '<p class="reviews-empty">No reviews yet \u2014 be the first to share your experience!</p>';
      return;
    }
    reviewsSummaryEl.innerHTML =
      '<div class="avg-score">' + data.average.toFixed(1) + '</div>' +
      '<div class="stars">' + renderStars(data.average) + '</div>' +
      '<div class="review-count">Based on ' + data.count + (data.count === 1 ? ' review' : ' reviews') + '</div>';

    reviewsListEl.innerHTML = '';
    reviews.slice(0, 9).forEach(function (r) {
      var card = document.createElement('div');
      card.className = 'review-card';

      var starsEl = document.createElement('span');
      starsEl.className = 'stars';
      starsEl.innerHTML = renderStars(r.rating);

      var nameEl = document.createElement('div');
      nameEl.className = 'review-name';
      nameEl.textContent = r.name;

      var dateEl = document.createElement('div');
      dateEl.className = 'review-date';
      dateEl.textContent = new Date(r.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

      var textEl = document.createElement('div');
      textEl.className = 'review-text';
      textEl.textContent = r.text;

      card.appendChild(starsEl);
      card.appendChild(nameEl);
      card.appendChild(dateEl);
      card.appendChild(textEl);
      reviewsListEl.appendChild(card);
    });
  }

  function loadReviews() {
    if (!reviewsListEl) return;
    fetch(REVIEWS_API)
      .then(function (r) { return r.json(); })
      .then(renderReviews)
      .catch(function () {
        reviewsListEl.innerHTML = '<p class="reviews-empty">Reviews are temporarily unavailable.</p>';
      });
  }
  loadReviews();

  var starInput = document.getElementById('star-input');
  var ratingField = document.getElementById('review-rating');
  var stars = starInput ? starInput.querySelectorAll('.star') : [];
  if (starInput && ratingField) {
    stars.forEach(function (star) {
      star.addEventListener('click', function () {
        var value = parseInt(star.getAttribute('data-value'), 10);
        ratingField.value = value;
        stars.forEach(function (s) {
          s.classList.toggle('active', parseInt(s.getAttribute('data-value'), 10) <= value);
        });
      });
    });
  }

  var reviewForm = document.getElementById('review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var resultEl = document.getElementById('review-form-result');
      var name = document.getElementById('review-name').value.trim();
      var text = document.getElementById('review-text').value.trim();
      var rating = parseInt(ratingField.value, 10);

      if (!rating) {
        if (resultEl) {
          resultEl.textContent = 'Please select a star rating before submitting.';
          resultEl.style.display = 'block';
        }
        return;
      }

      fetch(REVIEWS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, rating: rating, text: text })
      })
        .then(function (r) {
          return r.json().then(function (data) { return { status: r.status, data: data }; });
        })
        .then(function (result) {
          if (result.data && result.data.ok) {
            reviewForm.reset();
            ratingField.value = 0;
            stars.forEach(function (s) { s.classList.remove('active'); });
            if (resultEl) {
              resultEl.textContent = 'Thanks for your review!';
              resultEl.style.display = 'block';
            }
            loadReviews();
          } else {
            if (resultEl) {
              resultEl.textContent = (result.data && result.data.error) || 'Something went wrong. Please try again.';
              resultEl.style.display = 'block';
            }
          }
        })
        .catch(function () {
          if (resultEl) {
            resultEl.textContent = 'Something went wrong. Please try again.';
            resultEl.style.display = 'block';
          }
        });
    });
  }
});
