// worker/tenant-db.ts
//
// TenantDB is the ONLY module allowed to call .prepare() on the raw
// D1Database for tenant-scoped tables. Every method injects this.parishId.
// Route handlers get a constructed TenantDB and never touch env.DB.
// (Lint rule + CI forbid .prepare() elsewhere; see eslint.config.js.)
//
// TenantDB's single responsibility is TENANT SCOPING (the parish_id
// boundary). Role-based authorization is primarily enforced in the route
// handlers. However, public-note writes ALSO carry a role backstop here
// (throwing on parish_public + non-admin) as defense-in-depth, so a future
// route that forgets the check still cannot create an unauthorized note.

export type Role = "admin" | "staff";

export class NotePermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotePermissionError";
  }
}

export interface NoteRow {
  id: string;
  parish_id: string;
  author_user_id: string;
  last_edited_by_user_id: string | null;
  visibility: "private" | "parish_public";
  liturgical_date: string;
  title: string | null;
  body: string | null;
  version: number;
  updated_at: string;
  // Derived: email prefix of the last editor (or author if never edited),
  // for public-note attribution. Only meaningful for parish_public notes.
  attribution: string | null;
}

export class TenantDB {
  private readonly db: D1Database;
  private readonly parishId: string;

  constructor(db: D1Database, parishId: string) {
    if (!parishId) {
      throw new Error("TenantDB requires a non-empty parishId");
    }
    this.db = db;
    this.parishId = parishId;
  }

  // ---------------------------------------------------------------
  // Reads
  // ---------------------------------------------------------------

  /**
   * Notes visible to `userId` for a date: all parish_public notes, plus
   * this user's own private notes. Public notes include an `attribution`
   * (email prefix of last editor, or author if never edited).
   */
  async listNotesForDate(date: string, userId: string): Promise<NoteRow[]> {
    const { results } = await this.db
      .prepare(
        `SELECT n.*,
                CASE WHEN n.visibility = 'parish_public'
                     THEN substr(
                            COALESCE(editor.email, author.email),
                            1,
                            instr(COALESCE(editor.email, author.email), '@') - 1
                          )
                     ELSE NULL
                END AS attribution
         FROM liturgical_notes n
         JOIN users author ON author.id = n.author_user_id
         LEFT JOIN users editor ON editor.id = n.last_edited_by_user_id
         WHERE n.parish_id = ?1
           AND n.liturgical_date = ?2
           AND n.deleted_at IS NULL
           AND (n.visibility = 'parish_public'
                OR (n.visibility = 'private' AND n.author_user_id = ?3))
         ORDER BY n.visibility DESC, n.updated_at DESC`,
      )
      .bind(this.parishId, date, userId)
      .all<NoteRow>();
    return results;
  }

  /**
   * Parish-public notes across an inclusive date range, for the month view.
   * Public-only by design — private notes appear only in the day panel.
   */
  async listPublicNotesForMonth(
    startDate: string,
    endDate: string,
  ): Promise<NoteRow[]> {
    const { results } = await this.db
      .prepare(
        `SELECT n.*,
                substr(
                  COALESCE(editor.email, author.email),
                  1,
                  instr(COALESCE(editor.email, author.email), '@') - 1
                ) AS attribution
         FROM liturgical_notes n
         JOIN users author ON author.id = n.author_user_id
         LEFT JOIN users editor ON editor.id = n.last_edited_by_user_id
         WHERE n.parish_id = ?1
           AND n.liturgical_date >= ?2
           AND n.liturgical_date <= ?3
           AND n.deleted_at IS NULL
           AND n.visibility = 'parish_public'
         ORDER BY n.liturgical_date ASC, n.updated_at DESC`,
      )
      .bind(this.parishId, startDate, endDate)
      .all<NoteRow>();
    return results;
  }

  /** Fetch a single note by id, parish-scoped. Null if not in this parish. */
  private async getNote(noteId: string): Promise<NoteRow | null> {
    const row = await this.db
      .prepare(
        `SELECT * FROM liturgical_notes
         WHERE id = ?1 AND parish_id = ?2 AND deleted_at IS NULL`,
      )
      .bind(noteId, this.parishId)
      .first<NoteRow>();
    return row ?? null;
  }

  // ---------------------------------------------------------------
  // Writes (each carries the caller's role for the backstop)
  // ---------------------------------------------------------------

  async createNote(input: {
    id: string;
    userId: string;
    role: Role;
    visibility: "private" | "parish_public";
    liturgicalDate: string;
    title: string | null;
    body: string | null;
  }): Promise<void> {
    // BACKSTOP: only admins may create parish-public notes.
    if (input.visibility === "parish_public" && input.role !== "admin") {
      throw new NotePermissionError(
        "Only admins can create parish-public notes",
      );
    }
    await this.db
      .prepare(
        `INSERT INTO liturgical_notes
           (id, parish_id, author_user_id, visibility, liturgical_date,
            title, body, version, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 1, datetime('now'))`,
      )
      .bind(
        input.id,
        this.parishId,
        input.userId,
        input.visibility,
        input.liturgicalDate,
        input.title,
        input.body,
      )
      .run();
  }

  /**
   * Edit a note's title/body. Authorization:
   *  - private: only the author may edit (enforced by the WHERE clause).
   *  - parish_public: any admin may edit (staff blocked by backstop).
   * Records last_edited_by_user_id for attribution and bumps version.
   */
  async updateNote(input: {
    noteId: string;
    userId: string;
    role: Role;
    title: string | null;
    body: string | null;
  }): Promise<void> {
    const note = await this.getNote(input.noteId);
    if (!note) throw new NotePermissionError("Note not found in this parish");

    if (note.visibility === "parish_public") {
      if (input.role !== "admin") {
        throw new NotePermissionError("Only admins can edit parish-public notes");
      }
    } else {
      // private: author only
      if (note.author_user_id !== input.userId) {
        throw new NotePermissionError("You can only edit your own private notes");
      }
    }

    await this.db
      .prepare(
        `UPDATE liturgical_notes
         SET title = ?1, body = ?2, last_edited_by_user_id = ?3,
             version = version + 1, updated_at = datetime('now')
         WHERE id = ?4 AND parish_id = ?5 AND deleted_at IS NULL`,
      )
      .bind(input.title, input.body, input.userId, input.noteId, this.parishId)
      .run();
  }

  /**
   * Soft-delete a note (sets deleted_at; row retained per §6). Same
   * authorization rules as updateNote.
   */
  async deleteNote(input: {
    noteId: string;
    userId: string;
    role: Role;
  }): Promise<void> {
    const note = await this.getNote(input.noteId);
    if (!note) throw new NotePermissionError("Note not found in this parish");

    if (note.visibility === "parish_public") {
      if (input.role !== "admin") {
        throw new NotePermissionError("Only admins can delete parish-public notes");
      }
    } else {
      if (note.author_user_id !== input.userId) {
        throw new NotePermissionError("You can only delete your own private notes");
      }
    }

    await this.db
      .prepare(
        `UPDATE liturgical_notes
         SET deleted_at = datetime('now')
         WHERE id = ?1 AND parish_id = ?2`,
      )
      .bind(input.noteId, this.parishId)
      .run();
  }

  /**
   * Display info for headers/UI: the parish name and this user's email.
   * Parish-scoped (parish name comes from this.parishId).
   */
  async displayInfo(userId: string): Promise<{ parishName: string; email: string } | null> {
    const row = await this.db
      .prepare(
        `SELECT p.name AS parish_name, u.email AS email
         FROM parishes p, users u
         WHERE p.id = ?1 AND u.id = ?2`,
      )
      .bind(this.parishId, userId)
      .first<{ parish_name: string; email: string }>();
    return row ? { parishName: row.parish_name, email: row.email } : null;
  }

  // ---------------------------------------------------------------
  // Membership (called from auth-context.ts before a TenantDB exists;
  // intentionally NOT parish-scoped — its job is to discover the parish)
  // ---------------------------------------------------------------

  static async findMembershipsForUser(db: D1Database, userId: string) {
    return db
      .prepare(
        `SELECT * FROM parish_memberships
         WHERE user_id = ?1 AND status = 'active'`,
      )
      .bind(userId)
      .all();
  }
}
