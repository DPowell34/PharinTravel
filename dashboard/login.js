// Placeholder employee login for the Destined 4 Destinations CRM dashboard.
//
// IMPORTANT: this is intentionally simple. It is enough to keep casual/public
// visitors from landing on the CRM tables, but it is NOT real authentication —
// the credentials below are visible to anyone who views this file's source.
// Do not store real client PII behind this alone. When ready for production,
// replace this with Netlify Identity, Auth0, or a login endpoint backed by the
// bridge server in server/ that issues a real session token.
//
// To add or change employee logins, edit the list below -- one entry per
// person who should have access.
const EMPLOYEES = [
  { username: "DPowell11", password: "DeadPool1128" },
  { username: "destined4destinations@gmail.com", password: "Agent1038@@@" },
];

const SESSION_KEY = "d4d_crm_authed";

document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("login-error");

  const match = EMPLOYEES.some(
    (u) => u.username === username && u.password === password
  );

  if (match) {
    sessionStorage.setItem(SESSION_KEY, "1");
    window.location.href = "index.html";
  } else {
    errorEl.style.display = "block";
  }
});
