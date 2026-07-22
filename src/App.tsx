import { useEffect, useState } from "react";
import { MonthGrid } from "./MonthGrid";
import { SuperAdminConsole } from "./SuperAdminConsole";
import { useCurrentUser } from "./lib/useCurrentUser";
import { detectInAppBrowser } from "./lib/inAppBrowser";
import "./MonthGrid.css";
import "./App.css";

function useHash() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

function App() {
  const auth = useCurrentUser();
  const hash = useHash();

  if (auth.status === "loading") {
    return (
      <div className="shell shell--center">
        <p className="shell__muted">Loading…</p>
      </div>
    );
  }

  if (auth.status === "signed_out") {
    return (
      <div className="shell shell--center">
        <div className="signin">
          <img
            className="signin__banner"
            src="/brand/myordo-og-banner.svg"
            alt="myORDO — The liturgical calendar, personalized for your parish."
          />
          {(() => {
            const inApp = detectInAppBrowser();
            if (!inApp) return null;
            const url = "https://myordo.cenaclelabs.com";
            return (
              <div className="signin__notice" role="alert">
                <p className="signin__notice-title">
                  Please open myORDO in your browser
                </p>
                <p className="signin__notice-body">
                  You&rsquo;re viewing this inside {inApp}, where Google sign-in is
                  blocked for security. Tap the menu icon and choose
                  &ldquo;Open in Safari&rdquo; or &ldquo;Open in Chrome&rdquo; &mdash; or
                  copy the link below and paste it into your browser.
                </p>
                <button
                  type="button"
                  className="signin__copy"
                  onClick={() => {
                    navigator.clipboard?.writeText(url).then(
                      () => {
                        const el = document.getElementById("copied");
                        if (el) el.style.opacity = "1";
                      },
                      () => {},
                    );
                  }}
                >
                  Copy link
                </button>
                <span id="copied" className="signin__copied">Copied!</span>
              </div>
            );
          })()}
          <a className="signin__btn" href="/auth/google/login">
            Sign in with Google
          </a>
        </div>
      </div>
    );
  }

  // signed_in
  const emailPrefix = auth.user.email.split("@")[0] || "you";
  const showAdmin = auth.user.isSuperAdmin && hash === "#admin";
  return (
    <div className="shell">
      <header className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <img className="topbar__logo" src="/brand/myordo-logo-horizontal.svg" alt="myORDO" />
          {auth.user.isSuperAdmin && (
            <a
              className="topbar__logout"
              href={showAdmin ? "#" : "#admin"}
              style={{ textDecoration: "none", textTransform: "uppercase" }}
            >
              {showAdmin ? "Calendar" : "Console"}
            </a>
          )}
        </div>
        <div className="topbar__right">
          <span className="topbar__who">
            <span className="topbar__name">{emailPrefix}</span>
            {auth.user.parishName && (
              <span className="topbar__parish"> · {auth.user.parishName}</span>
            )}
          </span>
          <span className="topbar__role" data-role={auth.user.role}>
            {auth.user.role === "admin" ? "Admin" : "Staff"}
          </span>
          <form method="post" action="/auth/logout" className="topbar__logout-form">
            <button className="topbar__logout" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>
      {showAdmin ? <SuperAdminConsole /> : <MonthGrid role={auth.user.role} />}
    </div>
  );
}

export default App;
