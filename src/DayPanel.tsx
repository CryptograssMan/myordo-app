import { type LiturgicalDayView } from "./lib/liturgicalCalendar";
import { colorToken } from "./lib/liturgicalColors";

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
  onClose: () => void;
}

export function DayPanel({ isoDate, celebration, onClose }: DayPanelProps) {
  const open = isoDate !== null;
  const token = colorToken(celebration?.colors);

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
                    {celebration.rankName}
                    {celebration.seasonNames[0] ? ` · ${celebration.seasonNames[0]}` : ""}
                  </p>
                </>
              ) : (
                <h2 className="daypanel__feast daypanel__feast--muted">No celebration</h2>
              )}
            </header>

            <div className="daypanel__body">
              <p className="daypanel__placeholder">Notes coming soon.</p>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
