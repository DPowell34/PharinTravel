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
    items.append('<a href="../dashboard/login.html" class="employee-link">Employee Login</a>')
    return "\n      ".join(items)

def header(active):
    return f"""<header class="site-header">
  <div class="container nav-row">
    <a href="index.html" class="brand">
      <div class="logo-badge">D4D</div>
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
    </div>
    <div class="footer-bottom">
      <div>&copy; <span id="year"></span> Destined 4 Destinations. All rights reserved.</div>
      <div><a href="../dashboard/login.html">Employee Login</a></div>
    </div>
  </div>
</footer>
<script src="assets/site.js"></script>"""

def page(title, description, active, body):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{title} — Destined 4 Destinations</title>
<meta name="description" content="{description}" />
<link rel="stylesheet" href="assets/style.css" />
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
        <a href="terms.html" class="btn btn-outline">Terms &amp; Insurance Waiver</a>
      </div>
    </div>
    <div class="hero-card">
      <div class="logo-badge-lg">D4D</div>
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
        <h3>Vacation Quotes</h3>
        <ul>
          <li>Destination research</li>
          <li>Resort and cruise comparisons</li>
          <li>Budget-friendly package options</li>
          <li>Payment deadline reminders</li>
        </ul>
      </div>
      <div class="card">
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
      <div class="logo-badge-lg">D4D</div>
      <h3>Destined 4 Destinations</h3>
      <div class="tagline">Your Journey Begins Here</div>
    </div>
  </div>
</section>
"""

# ---------------------------------------------------------------- SERVICES
services_body = """
<section class="page-hero">
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
        <h3>Vacation Quotes</h3>
        <ul>
          <li>Destination research</li>
          <li>Resort and cruise comparisons</li>
          <li>Budget-friendly package options</li>
          <li>Payment deadline reminders</li>
        </ul>
      </div>
      <div class="card">
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
  <div class="container">
    <h1>Request a Travel Quote</h1>
    <p>Share a few details and we'll follow up with curated options within one business day.</p>
  </div>
</section>

<section>
  <div class="container">
    <div class="contact-card">
      <form id="quote-form">
        <label for="name">Name</label>
        <input id="name" type="text" name="name" placeholder="Your name" required />

        <label for="email">Email</label>
        <input id="email" type="email" name="email" placeholder="Email address" required />

        <label for="phone">Phone (optional)</label>
        <input id="phone" type="tel" name="phone" placeholder="Phone number" />

        <label for="destination">Destination Ideas</label>
        <input id="destination" type="text" name="destination" placeholder="Dream destination(s)" />

        <label for="dates">Travel Dates (optional)</label>
        <input id="dates" type="text" name="dates" placeholder="e.g. Late July 2026, flexible +/- 3 days" />

        <label for="travelers">Number of Travelers</label>
        <input id="travelers" type="number" name="travelers" min="1" placeholder="e.g. 4" />

        <label for="budget">Budget Range (optional)</label>
        <input id="budget" type="text" name="budget" placeholder="e.g. $3,000–$5,000 total" />

        <label for="message">Tell us about your trip</label>
        <textarea id="message" name="message" placeholder="Vacation style, occasion, must-haves..." required></textarea>

        <button type="submit">Send Request</button>
      </form>
      <div id="form-result" class="form-note" style="display:none;"></div>
      <div class="form-note">
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
        html = page(title, description, active, body)
        path = os.path.join(OUT_DIR, filename)
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"wrote {path}")

if __name__ == "__main__":
    main()
