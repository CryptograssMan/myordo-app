import { useState } from "react";
import { type LiturgicalDayView } from "./lib/liturgicalCalendar";
import { colorToken } from "./lib/liturgicalColors";
import { useDayNotes, type Note } from "./lib/useDayNotes";
import { createNote, updateNote, deleteNote } from "./lib/noteActions";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[m - 1]} ${d}, ${y}`;
}

interface DayPanelProps {
  isoDate: string | null;
  celebration: LiturgicalDayView | null;
  role: "admin" | "staff";
  onClose: () => void;
}

// Inline editor for creating or editing a note.
function NoteEditor({
  initialTitle,
  initialBody,
  onSave,
  onCancel,
}: {
  initialTitle: string;
  initialBody: string;
  onSave: (title: string, body: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave() {
    if (!body.trim() && !title.trim()) {
      setErr("Write something first.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await onSave(title.trim(), body.trim());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save.");
      setSaving(false);
    }
  }

  return (
    <div className="editor">
      <input
        className="editor__title"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="editor__body"
        placeholder="Write your note…"
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      {err && <p className="editor__err">{err}</p>}
      <div className="editor__actions">
        <button className="btn btn--ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button className="btn btn--solid" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function NoteCard({
  note,
  showAttribution,
  canManage,
  onEdit,
  onDelete,
}: {
  note: Note;
  showAttribution: boolean;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="note">
      {note.title && <h4 className="note__title">{note.title}</h4>}
      {note.body && <p className="note__body">{note.body}</p>}
      <div className="note__foot">
        {showAttribution && note.attribution && (
          <span className="note__by">— {note.attribution}</span>
        )}
        {canManage && (
          <span className="note__actions">
            <button className="linkbtn" onClick={onEdit}>Edit</button>
            <button className="linkbtn linkbtn--danger" onClick={onDelete}>Delete</button>
          </span>
        )}
      </div>
    </article>
  );
}

export function DayPanel({ isoDate, celebration, role, onClose }: DayPanelProps) {
  const open = isoDate !== null;
  const token = colorToken(celebration?.colors);
  const { loading, error, publicNotes, privateNotes, refetch } = useDayNotes(isoDate);

  // Which editor is open: 'new-private' | 'new-public' | note id | null
  const [editing, setEditing] = useState<string | null>(null);

  function closeEditor() {
    setEditing(null);
  }

  async function handleCreate(
    visibility: "private" | "parish_public",
    title: string,
    body: string,
  ) {
    const r = await createNote({
      visibility,
      liturgicalDate: isoDate!,
      title: title || null,
      note: body || null,
    });
    if (!r.ok) throw new Error(r.error);
    closeEditor();
    refetch();
  }

  async function handleUpdate(id: string, title: string, body: string) {
    const r = await updateNote(id, { title: title || null, note: body || null });
    if (!r.ok) throw new Error(r.error);
    closeEditor();
    refetch();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this note?")) return;
    const r = await deleteNote(id);
    if (!r.ok) {
      alert(r.error ?? "Could not delete.");
      return;
    }
    refetch();
  }

  return (
    <>
      <div
        className={`daypanel__scrim${open ? " is-open" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`daypanel${open ? " is-open" : ""}`}
        aria-hidden={!open}
        aria-label="Day details"
      >
        {open && (
          <>
            <div className="daypanel__band" style={{ background: token.spine }} />
            <header className="daypanel__head">
              <button className="daypanel__close" onClick={onClose} aria-label="Close">
                &times;
              </button>
              <p className="daypanel__date">{longDate(isoDate!)}</p>
              {celebration ? (
                <>
                  <h2 className="daypanel__feast">{celebration.name}</h2>
                  <p className="daypanel__meta">
                    <span className="daypanel__dot" style={{ background: token.spine }} />
                    <span className="daypanel__rank">{celebration.rankName}</span>
                    {celebration.seasonNames[0] ? ` · ${celebration.seasonNames[0]}` : ""}
                  </p>
                </>
              ) : (
                <h2 className="daypanel__feast daypanel__feast--muted">No celebration</h2>
              )}
            </header>

            <div className="daypanel__body">
              {loading && <p className="daypanel__muted">Loading notes…</p>}
              {error && <p className="daypanel__error">{error}</p>}

              {!loading && !error && (
                <>
                  {/* Parish notes — admins can write; everyone reads */}
                  <section className="notesec">
                    <div className="notesec__head">
                      <h3 className="notesec__title">Parish notes</h3>
                      {role === "admin" && editing !== "new-public" && (
                        <button className="linkbtn" onClick={() => setEditing("new-public")}>
                          + Add
                        </button>
                      )}
                    </div>
                    {editing === "new-public" && (
                      <NoteEditor
                        initialTitle=""
                        initialBody=""
                        onSave={(t, b) => handleCreate("parish_public", t, b)}
                        onCancel={closeEditor}
                      />
                    )}
                    {publicNotes.length === 0 && editing !== "new-public" ? (
                      <p className="daypanel__muted">No parish notes for this day.</p>
                    ) : (
                      publicNotes.map((n) =>
                        editing === n.id ? (
                          <NoteEditor
                            key={n.id}
                            initialTitle={n.title ?? ""}
                            initialBody={n.body ?? ""}
                            onSave={(t, b) => handleUpdate(n.id, t, b)}
                            onCancel={closeEditor}
                          />
                        ) : (
                          <NoteCard
                            key={n.id}
                            note={n}
                            showAttribution
                            canManage={role === "admin"}
                            onEdit={() => setEditing(n.id)}
                            onDelete={() => handleDelete(n.id)}
                          />
                        ),
                      )
                    )}
                  </section>

                  {/* Private note — both roles; author-only */}
                  <section className="notesec">
                    <div className="notesec__head">
                      <h3 className="notesec__title">My private note</h3>
                      {editing !== "new-private" && (
                        <button className="linkbtn" onClick={() => setEditing("new-private")}>
                          + Add
                        </button>
                      )}
                    </div>
                    {editing === "new-private" && (
                      <NoteEditor
                        initialTitle=""
                        initialBody=""
                        onSave={(t, b) => handleCreate("private", t, b)}
                        onCancel={closeEditor}
                      />
                    )}
                    {privateNotes.length === 0 && editing !== "new-private" ? (
                      <p className="daypanel__muted">No private note yet.</p>
                    ) : (
                      privateNotes.map((n) =>
                        editing === n.id ? (
                          <NoteEditor
                            key={n.id}
                            initialTitle={n.title ?? ""}
                            initialBody={n.body ?? ""}
                            onSave={(t, b) => handleUpdate(n.id, t, b)}
                            onCancel={closeEditor}
                          />
                        ) : (
                          <NoteCard
                            key={n.id}
                            note={n}
                            showAttribution={false}
                            canManage
                            onEdit={() => setEditing(n.id)}
                            onDelete={() => handleDelete(n.id)}
                          />
                        ),
                      )
                    )}
                  </section>
                </>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
