import { type LiturgicalDayView } from "./lib/liturgicalCalendar";
import { colorToken } from "./lib/liturgicalColors";
import { useDayNotes, type Note } from "./lib/useDayNotes";

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

function NoteCard({ note, showAttribution }: { note: Note; showAttribution: boolean }) {
  return (
    <article className="note">
      {note.title && <h4 className="note__title">{note.title}</h4>}
      {note.body && <p className="note__body">{note.body}</p>}
      {showAttribution && note.attribution && (
        <p className="note__by">— {note.attribution}</p>
      )}
    </article>
  );
}

export function DayPanel({ isoDate, celebration, role, onClose }: DayPanelProps) {
  const open = isoDate !== null;
  const token = colorToken(celebration?.colors);
  const { loading, error, publicNotes, privateNotes } = useDayNotes(isoDate);

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
                  <section className="notesec">
                    <div className="notesec__head">
                      <h3 className="notesec__title">Parish notes</h3>
                    </div>
                    {publicNotes.length === 0 ? (
                      <p className="daypanel__muted">No parish notes for this day.</p>
                    ) : (
                      publicNotes.map((n) => (
                        <NoteCard key={n.id} note={n} showAttribution />
                      ))
                    )}
                  </section>

                  <section className="notesec">
                    <div className="notesec__head">
                      <h3 className="notesec__title">My private note</h3>
                    </div>
                    {privateNotes.length === 0 ? (
                      <p className="daypanel__muted">No private note yet.</p>
                    ) : (
                      privateNotes.map((n) => (
                        <NoteCard key={n.id} note={n} showAttribution={false} />
                      ))
                    )}
                  </section>

                  {/* role is used by write controls in stage 3 */}
                  <p className="daypanel__hint" data-role={role}>
                    {role === "admin"
                      ? "You can post parish notes and keep a private journal."
                      : "You can keep a private journal for this day."}
                  </p>
                </>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
