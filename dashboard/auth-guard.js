// Auth guard for the CRM dashboard. Redirects to login.html unless the
// current browser tab has an active session flag set by login.js.
// See the note in login.js — this blocks casual access, not determined access.
(function () {
  if (sessionStorage.getItem("d4d_crm_authed") !== "1") {
    window.location.href = "login.html";
  }
})();
