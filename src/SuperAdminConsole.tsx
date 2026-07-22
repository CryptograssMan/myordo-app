// src/SuperAdminConsole.tsx
//
// Visible only when /api/me returns isSuperAdmin:true. Every endpoint it
// calls is independently gated server-side by requireSuperAdmin. Manages
// parishes, memberships, roles and subscription status; never shows note
// contents. Adds create-parish and invite-member (both seed 'invited' rows).

import { useEffect, useState } from "react";

interface ParishRow {
  id: string; name: string; slug: string | null;
  subscription_status: string; default_language: string; created_at: string;
  active_members: number; invited_members: number; note_count: number;
}
interface MemberRow {
  id: string; email: string; role: "admin" | "staff"; status: string;
  created_at: string; user_id: string | null; display_name: string | null;
  has_logged_in: number;
}
interface AuditRow {
  id: string; actor_email: string; action: string; target_type: string;
  target_id: string; created_at: string;
}

const SUBS = ["active", "past_due", "canceled"];
const STATUSES = ["invited", "active", "revoked"];

const s = {
  wrap: { padding: "1rem 1.25rem", maxWidth: 1000, margin: "0 auto" } as const,
  h: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" } as const,
  card: { border: "1px solid #e2e2e2", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "0.75rem" } as const,
  row: { display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" as const },
  muted: { color: "#777", fontSize: "0.85rem" } as const,
  link: { background: "none", border: "none", color: "#2a5", cursor: "pointer", padding: 0, font: "inherit", textDecoration: "underline" } as const,
  btn: { cursor: "pointer", padding: "0.2rem 0.55rem", borderRadius: 6, border: "1px solid #ccc", background: "#fafafa" } as const,
  input: { padding: "0.25rem 0.4rem", border: "1px solid #ccc", borderRadius: 6, font: "inherit" } as const,
};

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`/api/admin${path}`, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
  return res.json();
}

function CreateParishForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [lang, setLang] = useState<"en" | "tl">("en");
  const [adminEmail, setAdminEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null); setBusy(true);
    try {
      await api("/parishes", {
        method: "POST",
        body: JSON.stringify({ name, slug: slug || null, default_language: lang, admin_email: adminEmail }),
      });
      setName(""); setSlug(""); setAdminEmail(""); setLang("en"); setOpen(false);
      onCreated();
    } catch (e) { setErr(String((e as Error).message)); }
    finally { setBusy(false); }
  };

  if (!open) {
    return (
      <div style={{ marginBottom: "1rem" }}>
        <button style={s.btn} onClick={() => setOpen(true)}>+ Create parish</button>
      </div>
    );
  }
  return (
    <div style={{ ...s.card, background: "#fbfbf7" }}>
      <div style={{ ...s.row, marginBottom: "0.5rem" }}>
        <strong>New parish</strong>
        <button style={{ ...s.link, marginLeft: "auto" }} onClick={() => setOpen(false)}>cancel</button>
      </div>
      <div style={{ ...s.row, marginBottom: "0.5rem" }}>
        <input style={s.input} placeholder="Parish name" value={name} onChange={(e) => setName(e.target.value)} />
        <input style={s.input} placeholder="slug (optional)" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <label style={s.muted}>
          language:{" "}
          <select value={lang} onChange={(e) => setLang(e.target.value as "en" | "tl")}>
            <option value="en">en</option>
            <option value="tl">tl</option>
          </select>
        </label>
      </div>
      <div style={s.row}>
        <input style={{ ...s.input, minWidth: 260 }} placeholder="first admin email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
        <button style={s.btn} disabled={busy} onClick={submit}>{busy ? "Creating…" : "Create parish"}</button>
      </div>
      <p style={s.muted}>Seeds this parish with the admin as an invited member. Remember to add them as a Google OAuth test user too.</p>
      {err && <p style={{ color: "#c00" }}>{err}</p>}
    </div>
  );
}

function InviteMemberForm({ parishId, onInvited }: { parishId: string; onInvited: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null); setBusy(true);
    try {
      await api(`/parishes/${parishId}/members`, { method: "POST", body: JSON.stringify({ email, role }) });
      setEmail(""); setRole("staff");
      onInvited();
    } catch (e) { setErr(String((e as Error).message)); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ ...s.row, marginTop: "0.6rem", paddingTop: "0.6rem", borderTop: "1px solid #eee" }}>
      <input style={s.input} placeholder="invite email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <label style={s.muted}>
        role:{" "}
        <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "staff")}>
          <option value="staff">staff</option>
          <option value="admin">admin</option>
        </select>
      </label>
      <button style={s.btn} disabled={busy} onClick={submit}>{busy ? "Inviting…" : "Invite member"}</button>
      {err && <span style={{ color: "#c00" }}>{err}</span>}
    </div>
  );
}

export function SuperAdminConsole() {
  const [parishes, setParishes] = useState<ParishRow[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberRow[] | null>(null);
  const [audit, setAudit] = useState<AuditRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadParishes = () => api("/parishes").then(setParishes).catch((e) => setErr(String(e.message)));
  const loadMembers = (id: string) =>
    api(`/parishes/${id}`).then((d) => setMembers(d.members)).catch((e) => setErr(String(e.message)));

  useEffect(() => { loadParishes(); }, []);

  const toggleParish = (id: string) => {
    if (selected === id) {
      setSelected(null);
      setMembers(null);
    } else {
      setSelected(id);
      setMembers(null);
      loadMembers(id);
    }
  };

  const mutate = async (fn: () => Promise<unknown>) => {
    setErr(null); setBusy(true);
    try { await fn(); await loadParishes(); if (selected) await loadMembers(selected); }
    catch (e) { setErr(String((e as Error).message)); }
    finally { setBusy(false); }
  };

  return (
    <div style={s.wrap}>
      <div style={s.h}>
        <h2 style={{ margin: 0 }}>Super-admin console</h2>
        <a href="#" style={s.link} onClick={(e) => { e.preventDefault(); window.location.hash = ""; }}>
          ← Back to calendar
        </a>
      </div>

      {err && <p style={{ color: "#c00" }}>{err}</p>}

      <CreateParishForm onCreated={loadParishes} />

      {!parishes && <p style={s.muted}>Loading parishes…</p>}

      {parishes?.map((p) => (
        <div key={p.id} style={s.card}>
          <div style={s.row}>
            <strong>{p.name}</strong>
            <span style={s.muted}>{p.slug ?? "—"}</span>
            <span style={s.muted}>
              {p.active_members} active · {p.invited_members} invited · {p.note_count} notes
            </span>
            <label style={{ marginLeft: "auto", ...s.muted }}>
              subscription:{" "}
              <select
                value={p.subscription_status}
                disabled={busy}
                onChange={(e) =>
                  mutate(() =>
                    api(`/parishes/${p.id}/subscription`, {
                      method: "PATCH",
                      body: JSON.stringify({ subscription_status: e.target.value }),
                    }),
                  )
                }
              >
                {SUBS.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
            <button style={s.btn} onClick={() => toggleParish(p.id)}>
              {selected === p.id ? "Hide members" : "Manage members"}
            </button>
          </div>

          {selected === p.id && (
            <div style={{ marginTop: "0.75rem" }}>
              {!members && <p style={s.muted}>Loading members…</p>}
              {members?.map((m) => (
                <div key={m.id} style={{ ...s.row, padding: "0.35rem 0", borderTop: "1px solid #f0f0f0" }}>
                  <span>{m.email}</span>
                  {m.has_logged_in ? <span style={s.muted}>✓ logged in</span> : <span style={s.muted}>not yet logged in</span>}
                  <label style={{ marginLeft: "auto", ...s.muted }}>
                    role:{" "}
                    <select
                      value={m.role}
                      disabled={busy}
                      onChange={(e) =>
                        mutate(() =>
                          api(`/memberships/${m.id}/role`, { method: "PATCH", body: JSON.stringify({ role: e.target.value }) }),
                        )
                      }
                    >
                      <option value="admin">admin</option>
                      <option value="staff">staff</option>
                    </select>
                  </label>
                  <label style={s.muted}>
                    status:{" "}
                    <select
                      value={m.status}
                      disabled={busy}
                      onChange={(e) =>
                        mutate(() =>
                          api(`/memberships/${m.id}/status`, { method: "PATCH", body: JSON.stringify({ status: e.target.value }) }),
                        )
                      }
                    >
                      {STATUSES.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </label>
                </div>
              ))}
              <InviteMemberForm parishId={p.id} onInvited={() => { loadMembers(p.id); loadParishes(); }} />
            </div>
          )}
        </div>
      ))}

      <div style={{ marginTop: "1.5rem" }}>
        <button style={s.btn} onClick={() => api("/audit").then(setAudit).catch((e) => setErr(String(e.message)))}>
          {audit ? "Refresh audit log" : "Load audit log"}
        </button>
        {audit && (
          <div style={{ marginTop: "0.75rem" }}>
            {audit.length === 0 && <p style={s.muted}>No actions logged yet.</p>}
            {audit.map((a) => (
              <div key={a.id} style={{ ...s.muted, padding: "0.15rem 0" }}>
                {a.created_at} · {a.actor_email} · {a.action} · {a.target_type}:{a.target_id}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
