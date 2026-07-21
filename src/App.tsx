import { MonthGrid } from "./MonthGrid";
import { useCurrentUser } from "./lib/useCurrentUser";
import "./MonthGrid.css";
import "./App.css";

function App() {
  const auth = useCurrentUser();

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
          <h1 className="signin__mark">myORDO</h1>
          <p className="signin__sub">The parish liturgical calendar.</p>
          <a className="signin__btn" href="/auth/google/login">
            Sign in with Google
          </a>
        </div>
      </div>
    );
  }

  // signed_in
  const emailPrefix = auth.user.email.split("@")[0] || "you";
  return (
    <div className="shell">
      <header className="topbar">
        <span className="topbar__mark">myORDO</span>
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
      <MonthGrid role={auth.user.role} />
    </div>
  );
}

export default App;
