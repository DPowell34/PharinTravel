#!/usr/bin/env python3
"""Generates the static Destined 4 Destinations site pages.

Run with: python3 build_site.py
Outputs finished .html files into site/ next to assets/.
This is a plain generator (no framework) — the output is committed as
static HTML so the site needs zero build step to deploy.
"""
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "site")

NAV_LINKS = [
    ("index.html", "Home"),
    ("about.html", "About Us"),
    ("services.html", "Our Services"),
    ("resources.html", "Travel Resources"),
    ("passport-visa.html", "Passport & Visa"),
    ("terms.html", "Terms & Waiver"),
    ("contact.html", "Contact"),
]

def render_nav(active):
    items = []
    for href, label in NAV_LINKS:
        cls = ' class="active"' if href == active else ""
        items.append(f'<a href="{href}"{cls}>{label}</a>')
    # Primary CTA + employee login always appended
    items.append('<a href="quote.html" class="cta">Request a Quote</a>')
    items.append('<a href="https://d4dtravel.app/login.html" class="employee-link">Employee Login</a>')
    return "\n      ".join(items)

def header(active):
    return f"""<header class="site-header">
  <div class="container nav-row">
    <a href="index.html" class="brand">
      <img src="assets/img/logo.png" alt="Destined 4 Destinations logo" class="logo-badge" width="46" height="46" />
      <div class="brand-name">Destined 4 Destinations<small>Your Journey Begins Here</small></div>
    </a>
    <button id="nav-toggle" class="nav-toggle" aria-label="Toggle menu">&#9776;</button>
    <nav class="main-nav" id="main-nav">
      {render_nav(active)}
    </nav>
  </div>
</header>"""

FOOTER = """<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <img src="assets/img/logo.png" alt="Destined 4 Destinations logo" class="footer-logo" width="56" height="56" />
        <h4>Destined 4 Destinations</h4>
        <p>Organized, beautiful, stress-free vacation planning for families, couples, groups, and solo travelers — cruises, resorts, Disney &amp; Universal, honeymoons, and more.</p>
      </div>
      <div>
        <h4>Explore</h4>
        <ul>
          <li><a href="about.html">About Us</a></li>
          <li><a href="services.html">Our Services</a></li>
          <li><a href="resources.html">Travel Resources</a></li>
          <li><a href="passport-visa.html">Passport &amp; Visa</a></li>
          <li><a href="terms.html">Terms &amp; Insurance Waiver</a></li>
        </ul>
      </div>
      <div>
        <h4>Get In Touch</h4>
        <ul>
          <li><a href="mailto:Destined4Destinations@gmail.com">Destined4Destinations@gmail.com</a></li>
          <li><a href="sms:13052066598">Text 305-206-6598</a></li>
          <li><a href="quote.html">Request a Travel Quote</a></li>
        </ul>
      </div>
      <div>
        <h4>Follow Us</h4>
        <div class="social-links">
          <a href="https://www.facebook.com/Destined4Destinations" target="_blank" rel="noopener" class="social-link" aria-label="Destined 4 Destinations on Facebook">
            <span class="social-icon">
              <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
                <circle cx="12" cy="12" r="12" fill="currentColor"/>
                <path d="M13.6 8.7h1.6V6.2c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.1H6.9v2.8h2.2V19h2.8v-6.1h2.3l.3-2.8h-2.6V10.3c0-.8.2-1.6 1.7-1.6z" fill="#0b3d6b"/>
              </svg>
            </span>
            <span>@Destined4Destinations</span>
          </a>
          <a href="https://www.instagram.com/destined4destinations" target="_blank" rel="noopener" class="social-link" aria-label="Destined 4 Destinations on Instagram">
            <span class="social-icon">
              <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
                <circle cx="12" cy="12" r="12" fill="currentColor"/>
                <rect x="7" y="7" width="10" height="10" rx="3" fill="none" stroke="#0b3d6b" stroke-width="1.4"/>
                <circle cx="12" cy="12" r="2.6" fill="none" stroke="#0b3d6b" stroke-width="1.4"/>
                <circle cx="15.3" cy="8.7" r="0.7" fill="#0b3d6b"/>
              </svg>
            </span>
            <span>@destined4destinations</span>
          </a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <div>&copy; <span id="year"></span> Destined 4 Destinations. All rights reserved.</div>
      <div><a href="https://d4dtravel.app/login.html">Employee Login</a></div>
    </div>
  </div>
</footer>
<script src="assets/site.js?v=2"></script>"""

def page(title, description, active, body, filename="index.html"):
    canonical_path = "" if filename == "index.html" else filename
    canonical_url = f"https://d4dtravel.com/{canonical_path}"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-T2THZ9D0D6"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());

  gtag('config', 'G-T2THZ9D0D6');
</script>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{title} — Destined 4 Destinations</title>
<meta name="description" content="{description}" />
<link rel="canonical" href="{canonical_url}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Destined 4 Destinations" />
<meta property="og:title" content="{title} — Destined 4 Destinations" />
<meta property="og:description" content="{description}" />
<meta property="og:url" content="{canonical_url}" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="{title} — Destined 4 Destinations" />
<meta name="twitter:description" content="{description}" />
<link rel="icon" href="/favicon.ico?v=2" sizes="any" />
<link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2" />
<meta property="og:image" content="https://d4dtravel.com/assets/img/og-image.jpg" />
<meta name="twitter:image" content="https://d4dtravel.com/assets/img/og-image.jpg" />
<link rel="stylesheet" href="assets/style.css?v=7" />
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  "name": "Destined 4 Destinations",
  "url": "https://d4dtravel.com/",
  "email": "Destined4Destinations@gmail.com",
  "telephone": "+1-305-206-6598",
  "logo": "https://d4dtravel.com/assets/img/logo.png",
  "image": "https://d4dtravel.com/assets/img/og-image.jpg",
  "description": "{description}",
  "areaServed": "US",
  "sameAs": [
    "https://www.facebook.com/Destined4Destinations",
    "https://www.instagram.com/destined4destinations"
  ]
}}
</script>
</head>
<body>
{header(active)}
{body}
{FOOTER}
</body>
</html>
"""

# ---------------------------------------------------------------- HOME
home_body = """
<section class="home-hero">
  <video class="hero-video-bg" autoplay muted loop playsinline poster="assets/img/hero/ocean-poster.jpg"><source src="assets/video/hero-loop-v2.mp4" type="video/mp4"></video>
  <div class="container home-hero-grid">
    <div>
      <div class="eyebrow">Luxury Travel Planning &middot; Cruises &middot; Resorts &middot; Groups</div>
      <h1>Your journey begins here.</h1>
      <p class="lead">Destined 4 Destinations creates organized, beautiful, stress-free vacation
        experiences for families, couples, solo travelers, and groups — cruises, Disney &amp;
        Universal, all-inclusive resorts, honeymoons, and custom getaways.</p>
      <div class="btn-row">
        <a href="quote.html" class="btn btn-primary">Request a Travel Quote</a>
        <a href="services.html" class="btn btn-secondary">Our Services</a>
      </div>
      <a href="terms.html" class="hero-subtext-link">Terms &amp; Insurance Waiver</a>
    </div>
    <div class="hero-card">
      <img src="assets/img/logo.png" alt="Destined 4 Destinations logo" class="logo-badge-lg" width="96" height="96" />
      <h3>Destined 4 Destinations</h3>
      <div class="tagline">Your Journey Begins Here</div>
      <div class="contact-line">Destined4Destinations@gmail.com</div>
      <div class="contact-line">Text 305-206-6598</div>
    </div>
  </div>
</section>

<section id="services">
  <div class="container">
    <div class="section-title">
      <h2>What We Plan</h2>
      <p>Every trip is built around you — destination research, resort and cruise comparisons,
         and detailed next steps from quote to takeoff.</p>
    </div>
    <div class="grid-3">
      <div class="card">
        <div class="card-icon">'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/></svg>'</div>
        <h3>Vacation Quotes</h3>
        <ul>
          <li>Destination research</li>
          <li>Resort and cruise comparisons</li>
          <li>Budget-friendly package options</li>
          <li>Payment deadline reminders</li>
        </ul>
      </div>
      <div class="card">
        <div class="card-icon">'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.2 19.2c0-3.4 2.5-5.6 5.8-5.6s5.8 2.2 5.8 5.6"/><circle cx="17.3" cy="9.2" r="2.5"/><path d="M14.9 13.7c2.6.2 4.7 2.3 4.7 5.5"/></svg>'</div>
        <h3>Group Travel</h3>
        <ul>
          <li>Birthday trips</li>
          <li>Family reunions</li>
          <li>Girls trips</li>
          <li>School and class reunions</li>
          <li>Hosted group getaways</li>
        </ul>
      </div>
      <div class="card">
        <div class="card-icon">'<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2.5l2.1 6.9 6.9 2.1-6.9 2.1L12 21.5l-2.1-6.9L3 12.5l6.9-2.1z"/></svg>'</div>
        <h3>Specialty Travel</h3>
        <ul>
          <li>Disney and Universal vacations</li>
          <li>All-inclusive resorts</li>
          <li>Caribbean cruises</li>
          <li>Honeymoons and couples getaways</li>
          <li>Family vacations</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<section style="background:white;">
  <div class="container">
    <div class="section-title">
      <h2>How It Works</h2>
      <p>Three simple steps from dream to departure.</p>
    </div>
    <div class="steps">
      <div class="step">
        <div class="num">1</div>
        <h3>Tell us about your trip</h3>
        <p>Share dates, travelers, budget, destination ideas, passport status, and vacation style.</p>
      </div>
      <div class="step">
        <div class="num">2</div>
        <h3>Get curated options</h3>
        <p>Receive curated choices and guidance based on your travel needs.</p>
      </div>
      <div class="step">
        <div class="num">3</div>
        <h3>Approve &amp; travel</h3>
        <p>Approve your quote, review policies, submit payment, and prepare to travel.</p>
      </div>
    </div>
  </div>
</section>


<section id="reviews" style="background:white;">
  <div class="container">
    <div class="section-title">
      <h2>What Travelers Are Saying</h2>
      <p>Real feedback from the families, couples, and groups we've helped plan trips for.</p>
    </div>
    <div id="reviews-summary" class="reviews-summary"></div>
    <div id="reviews-list" class="reviews-list"></div>
    <div class="contact-card review-form-card">
      <h3>Leave a Review</h3>
      <p>Traveled with us? Share your experience.</p>
      <form id="review-form">
        <label for="review-name">Name</label>
        <input type="text" id="review-name" name="name" maxlength="80" required />
        <label>Rating</label>
        <div class="star-input" id="star-input">
          <span class="star" data-value="1"><svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true"><path fill="currentColor" d="M12 2.5l2.98 6.44 7.02.7-5.25 4.9 1.5 6.96L12 17.9l-6.25 3.6 1.5-6.96L2 9.64l7.02-.7z"/></svg></span>
          <span class="star" data-value="2"><svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true"><path fill="currentColor" d="M12 2.5l2.98 6.44 7.02.7-5.25 4.9 1.5 6.96L12 17.9l-6.25 3.6 1.5-6.96L2 9.64l7.02-.7z"/></svg></span>
          <span class="star" data-value="3"><svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true"><path fill="currentColor" d="M12 2.5l2.98 6.44 7.02.7-5.25 4.9 1.5 6.96L12 17.9l-6.25 3.6 1.5-6.96L2 9.64l7.02-.7z"/></svg></span>
          <span class="star" data-value="4"><svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true"><path fill="currentColor" d="M12 2.5l2.98 6.44 7.02.7-5.25 4.9 1.5 6.96L12 17.9l-6.25 3.6 1.5-6.96L2 9.64l7.02-.7z"/></svg></span>
          <span class="star" data-value="5"><svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true"><path fill="currentColor" d="M12 2.5l2.98 6.44 7.02.7-5.25 4.9 1.5 6.96L12 17.9l-6.25 3.6 1.5-6.96L2 9.64l7.02-.7z"/></svg></span>
        </div>
        <input type="hidden" id="review-rating" name="rating" value="0" required />
        <label for="review-text">Your Review</label>
        <textarea id="review-text" name="text" maxlength="1000" required></textarea>
        <button type="submit">Submit Review</button>
      </form>
      <div id="review-form-result" class="form-note" style="display:none;"></div>
    </div>
  </div>
</section>

<div class="cta-band">
  <div class="container">
    <h2>Ready to start planning?</h2>
    <p>Tell us a bit about what you have in mind and we'll follow up with a custom quote.</p>
    <a href="quote.html" class="btn btn-primary">Request a Travel Quote</a>
  </div>
</div>
"""

# ---------------------------------------------------------------- ABOUT
about_body = """
<section class="page-hero">
  <video class="hero-video-bg" autoplay muted loop playsinline poster="assets/img/hero/ocean-poster.jpg"><source src="assets/video/hero-loop-v2.mp4" type="video/mp4"></video>
  <div class="container">
    <h1>About Us</h1>
    <p>Destined 4 Destinations helps travelers turn vacation dreams into organized, bookable travel plans.</p>
  </div>
</section>

<section class="about-band">
  <div class="container about-grid">
    <div>
      <h2>Travel planning with care</h2>
      <p>Whether you are planning a family vacation, cruise, birthday trip, romantic getaway,
         Disney vacation, or group celebration, Destined 4 Destinations provides personalized
         quote support and travel guidance.</p>
      <p>Our goal is simple: make your trip easier to plan, easier to understand, and easier to enjoy.</p>
      <p>We handle destination research, supplier links, TravelJoy forms, travel protection
         reminders, and terms and conditions, so you can focus on the excitement of the trip
         itself — not the paperwork.</p>
      <a href="quote.html" class="btn btn-primary" style="margin-top:8px;">Request a Quote</a>
    </div>
    <div class="hero-card" style="box-shadow:0 20px 45px rgba(8,42,74,0.15);">
      <img src="assets/img/logo.png" alt="Destined 4 Destinations logo" class="logo-badge-lg" width="96" height="96" />
      <h3>Destined 4 Destinations</h3>
      <div class="tagline">Your Journey Begins Here</div>
    </div>
  </div>
</section>

<section class="agent-band">
  <div class="container">
    <div class="section-title">
      <h2>Meet Your Travel Agent</h2>
      <p>Personal, hands-on planning from a dedicated agent \u2014 not a call center.</p>
    </div>
    <div class="agent-card-frame">
      <img src="assets/img/business-card.jpg" alt="Pharin Walker, Owner and Travel Agent, Destined 4 Destinations \u2014 305-206-6598, Destined4Destinations@gmail.com" class="agent-card-img" loading="lazy" />
    </div>
  </div>
</section>
"""

# ---------------------------------------------------------------- SERVICES
services_body = """
<section class="page-hero hero-services">
  <video class="hero-video-bg" autoplay muted loop playsinline poster="assets/img/hero/ocean-poster.jpg"><source src="assets/video/hero-loop-v2.mp4" type="video/mp4"></video>
  <div class="container">
    <h1>Our Services</h1>
    <p>Detailed travel planning services for cruises, resorts, theme parks, groups, families,
       couples, and custom vacations.</p>
  </div>
</section>

<section>
  <div class="container">
    <div class="grid-3">
      <div class="card">
        <div class="card-icon">'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/></svg>'</div>
        <h3>Vacation Quotes</h3>
        <ul>
          <li>Destination research</li>
          <li>Resort and cruise comparisons</li>
          <li>Budget-friendly package options</li>
          <li>Payment deadline reminders</li>
        </ul>
      </div>
      <div class="card">
        <div class="card-icon">'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.2 19.2c0-3.4 2.5-5.6 5.8-5.6s5.8 2.2 5.8 5.6"/><circle cx="17.3" cy="9.2" r="2.5"/><path d="M14.9 13.7c2.6.2 4.7 2.3 4.7 5.5"/></svg>'</div>
        <h3>Group Travel</h3>
        <ul>
          <li>Birthday trips</li>
          <li>Family reunions</li>
          <li>Girls trips</li>
          <li>School and class reunions</li>
          <li>Hosted group getaways</li>
        </ul>
      </div>
      <div class="card">
        <div class="card-icon">'<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2.5l2.1 6.9 6.9 2.1-6.9 2.1L12 21.5l-2.1-6.9L3 12.5l6.9-2.1z"/></svg>'</div>
        <h3>Specialty Travel</h3>
        <ul>
          <li>Disney and Universal vacations</li>
          <li>All-inclusive resorts</li>
          <li>Caribbean cruises</li>
          <li>Honeymoons and couples getaways</li>
          <li>Family vacations</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<div class="cta-band">
  <div class="container">
    <h2>Not sure where to start?</h2>
    <p>Request a quote and we'll help you narrow it down.</p>
    <a href="quote.html" class="btn btn-primary">Request a Travel Quote</a>
  </div>
</div>
"""

# ---------------------------------------------------------------- RESOURCES
resources_body = """
<section class="page-hero">
  <video class="hero-video-bg" autoplay muted loop playsinline poster="assets/img/hero/ocean-poster.jpg"><source src="assets/video/hero-loop-v2.mp4" type="video/mp4"></video>
  <div class="container">
    <h1>Travel Resources</h1>
    <p>Helpful reminders and links to keep your trip on track from booking to boarding.</p>
  </div>
</section>

<section>
  <div class="container">
    <div class="info-block">
      <h3>Before You Book</h3>
      <ul>
        <li>Confirm passport validity (see our Passport &amp; Visa page)</li>
        <li>Decide on a budget range and preferred travel dates</li>
        <li>List everyone traveling, including ages of any children</li>
      </ul>
    </div>
    <div class="info-block">
      <h3>After You Book</h3>
      <ul>
        <li>Watch for payment deadline reminders from your advisor</li>
        <li>Review your travel protection / insurance options</li>
        <li>Save supplier confirmation numbers and TravelJoy documents</li>
      </ul>
    </div>
    <div class="info-block">
      <h3>Before You Fly</h3>
      <ul>
        <li>Check current airline carry-on and baggage rules (see Airline Rules)</li>
        <li>Check in online 24 hours before your flight when possible</li>
        <li>Arrive at the airport with enough buffer for security and customs</li>
      </ul>
    </div>
  </div>
</section>
"""

# ---------------------------------------------------------------- PASSPORT & VISA
passport_body = """
<section class="page-hero">
  <video class="hero-video-bg" autoplay muted loop playsinline poster="assets/img/hero/ocean-poster.jpg"><source src="assets/video/hero-loop-v2.mp4" type="video/mp4"></video>
  <div class="container">
    <h1>Passport &amp; Visa</h1>
    <p>Entry requirements vary by destination and change over time — always verify directly
       with official sources before you travel.</p>
  </div>
</section>

<section>
  <div class="container">
    <div class="info-block">
      <h3>Passport Validity</h3>
      <p>Many countries require your passport to be valid for at least six months beyond your
         return date. Renew early if your passport is close to expiring.</p>
    </div>
    <div class="info-block">
      <h3>Visa Requirements</h3>
      <p>Visa requirements depend on your citizenship and destination. We'll flag anything
         relevant to your itinerary when we build your quote, but you should also confirm
         requirements with the destination country's official government or embassy website.</p>
    </div>
    <div class="info-block">
      <h3>Official Resources</h3>
      <ul>
        <li><a href="https://travel.state.gov" target="_blank" rel="noopener">U.S. Department of State — Travel.State.gov</a></li>
        <li><a href="https://www.cbp.gov" target="_blank" rel="noopener">U.S. Customs and Border Protection</a></li>
      </ul>
    </div>
  </div>
</section>
"""

# ---------------------------------------------------------------- AIRLINE RULES (linked from resources; add to nav minimally via footer only)
airline_body = """
<section class="page-hero">
  <video class="hero-video-bg" autoplay muted loop playsinline poster="assets/img/hero/ocean-poster.jpg"><source src="assets/video/hero-loop-v2.mp4" type="video/mp4"></video>
  <div class="container">
    <h1>Airline Rules</h1>
    <p>Baggage, check-in, and carry-on policies vary by airline and fare class — always confirm
       with your specific carrier before departure.</p>
  </div>
</section>

<section>
  <div class="container">
    <div class="info-block">
      <h3>Carry-On &amp; Baggage</h3>
      <p>Size limits, weight limits, and included-bag allowances differ by airline and ticket
         type (basic economy vs. standard fares often have different rules). Check your airline's
         website using your confirmation number for the exact allowance on your booking.</p>
    </div>
    <div class="info-block">
      <h3>Check-In Windows</h3>
      <p>Most airlines open online check-in 24 hours before departure. International flights
         often require arriving at the airport 3 hours early; domestic flights, about 2 hours.</p>
    </div>
    <div class="info-block">
      <h3>Names &amp; Documents</h3>
      <p>Make sure the name on your ticket matches your passport or government ID exactly.
         Contact us right away if you notice a mismatch — corrections get harder (and pricier)
         closer to departure.</p>
    </div>
  </div>
</section>
"""

# ---------------------------------------------------------------- TERMS
terms_body = """
<section class="page-hero">
  <video class="hero-video-bg" autoplay muted loop playsinline poster="assets/img/hero/ocean-poster.jpg"><source src="assets/video/hero-loop-v2.mp4" type="video/mp4"></video>
  <div class="container">
    <h1>Terms &amp; Insurance Waiver</h1>
    <p>Please review before booking. Contact us with any questions.</p>
  </div>
</section>

<section>
  <div class="container">
    <div class="info-block">
      <h3>Travel Protection</h3>
      <p>We strongly recommend travel protection / travel insurance for every trip. Travel
         insurance can help cover trip cancellation, medical emergencies, delays, and lost
         luggage. If you choose to decline coverage, you acknowledge that Destined 4
         Destinations is not responsible for losses that insurance would have covered.</p>
    </div>
    <div class="info-block">
      <h3>Booking &amp; Payment Terms</h3>
      <ul>
        <li>Quotes are subject to change until a deposit is paid and the booking is confirmed with the supplier.</li>
        <li>Payment deadlines are set by the supplier (resort, cruise line, tour operator) — missed deadlines can result in cancellation of your reservation.</li>
        <li>Cancellation policies are set by each individual supplier, not by Destined 4 Destinations.</li>
      </ul>
    </div>
    <div class="info-block">
      <h3>Waiver of Liability</h3>
      <p>Destined 4 Destinations acts as a travel advisor connecting you with third-party
         suppliers (airlines, hotels, cruise lines, tour operators). We are not liable for
         acts, errors, omissions, or delays caused by those third parties, or for events
         outside our control (weather, strikes, government actions, health advisories, etc.).</p>
    </div>
  </div>
</section>
"""

# ---------------------------------------------------------------- CONTACT
contact_body = """
<section class="page-hero">
  <video class="hero-video-bg" autoplay muted loop playsinline poster="assets/img/hero/ocean-poster.jpg"><source src="assets/video/hero-loop-v2.mp4" type="video/mp4"></video>
  <div class="container">
    <h1>Contact</h1>
    <p>We'll follow up within one business day.</p>
  </div>
</section>

<section>
  <div class="container">
    <div class="contact-card">
      <div class="info-block" style="box-shadow:none; padding:0; margin-bottom:24px; text-align:center;">
        <h3>Destined 4 Destinations</h3>
        <p><a href="mailto:Destined4Destinations@gmail.com">Destined4Destinations@gmail.com</a></p>
        <p><a href="sms:13052066598">Text 305-206-6598</a></p>
      </div>
      <a href="quote.html" class="btn btn-primary" style="width:100%; text-align:center;">Request a Travel Quote</a>
    </div>
  </div>
</section>
"""

# ---------------------------------------------------------------- QUOTE FORM
quote_body = """
<section class="page-hero">
  <video class="hero-video-bg" autoplay muted loop playsinline poster="assets/img/hero/ocean-poster.jpg"><source src="assets/video/hero-loop-v2.mp4" type="video/mp4"></video>
  <div class="container">
    <h1>Request a Travel Quote</h1>
    <p>Share a few details and we'll follow up with curated options within one business day.</p>
  </div>
</section>

<section>
  <div class="container">
    <div class="contact-card" style="text-align:center;">
      <h3 style="margin-bottom:10px;">Ready to start planning?</h3>
      <p style="color:var(--muted); max-width:480px; margin:0 auto 24px;">
        Click below to fill out our secure travel quote form. It only takes a
        few minutes, and we&rsquo;ll follow up with curated options within one
        business day.
      </p>
      <a href="https://traveljoy.com/groups/rN3y8uGYi3cjcXTApbN551uz/forms/zFdh1g6Ycf5KadT7bXh3qDay" target="_blank" rel="noopener" class="btn btn-primary" style="display:inline-block;">Continue to Quote Form</a>
      <div class="form-note" style="margin-top:26px;">
        Prefer email or text? Reach us at
        <strong>Destined4Destinations@gmail.com</strong> &middot; <strong>Text 305-206-6598</strong>
      </div>
    </div>
  </div>
</section>
"""

PAGES = [
    ("index.html", "Home", "Luxury travel planning, cruises, resorts, family vacations and group getaways.", "index.html", home_body),
    ("about.html", "About Us", "Destined 4 Destinations helps travelers turn vacation dreams into organized, bookable travel plans.", "about.html", about_body),
    ("services.html", "Our Services", "Detailed travel planning services for cruises, resorts, theme parks, groups, families, couples, and custom vacations.", "services.html", services_body),
    ("resources.html", "Travel Resources", "Helpful reminders and links to keep your trip on track from booking to boarding.", "resources.html", resources_body),
    ("passport-visa.html", "Passport & Visa", "Passport validity and visa requirement guidance for your trip.", "passport-visa.html", passport_body),
    ("airline-rules.html", "Airline Rules", "Baggage, check-in, and carry-on policy guidance.", "resources.html", airline_body),
    ("terms.html", "Terms & Insurance Waiver", "Travel protection, booking terms, and liability waiver for Destined 4 Destinations.", "terms.html", terms_body),
    ("contact.html", "Contact", "Get in touch with Destined 4 Destinations.", "contact.html", contact_body),
    ("quote.html", "Request a Travel Quote", "Request a custom travel quote from Destined 4 Destinations.", "quote.html", quote_body),
]

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for filename, title, description, active, body in PAGES:
        html = page(title, description, active, body, filename)
        path = os.path.join(OUT_DIR, filename)
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"wrote {path}")

    # ---- robots.txt ----
    robots_txt = "User-agent: *\nAllow: /\n\nSitemap: https://d4dtravel.com/sitemap.xml\n"
    with open(os.path.join(OUT_DIR, "robots.txt"), "w", encoding="utf-8") as f:
        f.write(robots_txt)
    print("wrote robots.txt")

    # ---- sitemap.xml ----
    from datetime import date
    today = date.today().isoformat()
    urls = []
    for filename, title, description, active, body in PAGES:
        loc = "https://d4dtravel.com/" if filename == "index.html" else f"https://d4dtravel.com/{filename}"
        priority = "1.0" if filename == "index.html" else "0.7"
        urls.append(f"  <url>\n    <loc>{loc}</loc>\n    <lastmod>{today}</lastmod>\n    <priority>{priority}</priority>\n  </url>")
    sitemap_xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls) + "\n</urlset>\n"
    )
    with open(os.path.join(OUT_DIR, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write(sitemap_xml)
    print("wrote sitemap.xml")

if __name__ == "__main__":
    main()
