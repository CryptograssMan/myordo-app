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

// ---------------------------------------------------------------------
// Offline sync types (offline-pwa spec §3)
// ---------------------------------------------------------------------

export interface SyncMutation {
  mutationId: string;
  type: "create" | "update" | "delete";
  noteId: string;
  baseVersion: number;
  payload: {
    title?: string | null;
    body?: string | null;
    visibility?: "private" | "parish_public";
    liturgicalDate?: string;
  } | null;
}

export type MutationResult =
  | { status: "applied"; mutationId: string; noteId: string; newVersion: number; updatedAt: string }
  | {
      status: "conflict";
      mutationId: string;
      noteId: string;
      serverVersion: number;
      serverTitle: string | null;
      serverBody: string | null;
      serverUpdatedAt: string;
    }
  | { status: "rejected"; mutationId: string; noteId: string; reason: string };

export interface PulledNote {
  id: string;
  visibility: "private" | "parish_public";
  liturgical_date: string;
  title: string | null;
  body: string | null;
  version: number;
  updated_at: string;
  deleted_at: string | null;
  author_user_id: string;
  attribution: string | null;
}

export interface PullPage {
  changes: PulledNote[];
  nextSince: number;
  hasMore: boolean;
}

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
    // Atomic: note insert + change-feed append (spec §3.2 — every write
    // to liturgical_notes appends one note_changes row in the same batch).
    await this.db.batch([
      this.db
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
        ),
      this.appendChangeStmt(input.id),
    ]);
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

    // Atomic: preserve the superseded body as a revision (spec: no edit
    // is ever destroyed), apply the update, append to the change feed.
    await this.db.batch([
      this.revisionStmt(note.id, note.author_user_id, note.body),
      this.db
        .prepare(
          `UPDATE liturgical_notes
           SET title = ?1, body = ?2, last_edited_by_user_id = ?3,
               version = version + 1, updated_at = datetime('now')
           WHERE id = ?4 AND parish_id = ?5 AND deleted_at IS NULL`,
        )
        .bind(input.title, input.body, input.userId, input.noteId, this.parishId),
      this.appendChangeStmt(input.noteId),
    ]);
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

    // Atomic: tombstone + change feed (pull replicates the tombstone so
    // other devices delete locally too).
    await this.db.batch([
      this.db
        .prepare(
          `UPDATE liturgical_notes
           SET deleted_at = datetime('now'), version = version + 1,
               updated_at = datetime('now')
           WHERE id = ?1 AND parish_id = ?2`,
        )
        .bind(input.noteId, this.parishId),
      this.appendChangeStmt(input.noteId),
    ]);
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
  // Offline sync (offline-pwa spec §3) — the server half of the
  // push/pull protocol. All statements remain parish-scoped.
  // ---------------------------------------------------------------

  /** Prepared statement: append one change-feed row for a note. */
  private appendChangeStmt(noteId: string): D1PreparedStatement {
    return this.db
      .prepare(
        `INSERT INTO note_changes (parish_id, note_id, created_at)
         VALUES (?1, ?2, datetime('now'))`,
      )
      .bind(this.parishId, noteId);
  }

  /** Prepared statement: preserve a body as an append-only revision. */
  private revisionStmt(
    noteId: string,
    authorUserId: string,
    body: string | null,
  ): D1PreparedStatement {
    return this.db
      .prepare(
        `INSERT INTO note_revisions (id, note_id, parish_id, author_user_id, body, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))`,
      )
      .bind(crypto.randomUUID(), noteId, this.parishId, authorUserId, body);
  }

  /** Prepared statement: record a mutation outcome in the idempotency ledger. */
  private ledgerStmt(
    m: SyncMutation,
    userId: string,
    result: "applied" | "conflict" | "rejected",
    newVersion: number | null,
    reason: string | null,
  ): D1PreparedStatement {
    return this.db
      .prepare(
        `INSERT INTO sync_mutations
           (mutation_id, parish_id, user_id, note_id, result, new_version, reason, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'))`,
      )
      .bind(m.mutationId, this.parishId, userId, m.noteId, result, newVersion, reason);
  }

  /** Look up a previously recorded outcome for a mutation id (dedupe). */
  private async recordedResult(m: SyncMutation): Promise<MutationResult | null> {
    const row = await this.db
      .prepare(
        `SELECT result, new_version, reason FROM sync_mutations
         WHERE mutation_id = ?1 AND parish_id = ?2`,
      )
      .bind(m.mutationId, this.parishId)
      .first<{ result: string; new_version: number | null; reason: string | null }>();
    if (!row) return null;
    if (row.result === "applied") {
      // Re-read current state so the replayed client converges anyway.
      const note = await this.getNoteAny(m.noteId);
      return {
        status: "applied",
        mutationId: m.mutationId,
        noteId: m.noteId,
        newVersion: row.new_version ?? note?.version ?? 0,
        updatedAt: note?.updated_at ?? "",
      };
    }
    if (row.result === "conflict") {
      const note = await this.getNoteAny(m.noteId);
      return {
        status: "conflict",
        mutationId: m.mutationId,
        noteId: m.noteId,
        serverVersion: note?.version ?? 0,
        serverTitle: note?.title ?? null,
        serverBody: note?.body ?? null,
        serverUpdatedAt: note?.updated_at ?? "",
      };
    }
    return {
      status: "rejected",
      mutationId: m.mutationId,
      noteId: m.noteId,
      reason: row.reason ?? "rejected",
    };
  }

  /** Like getNote but includes tombstoned rows (sync needs to see them). */
  private async getNoteAny(noteId: string): Promise<(NoteRow & { deleted_at: string | null }) | null> {
    const row = await this.db
      .prepare(
        `SELECT * FROM liturgical_notes WHERE id = ?1 AND parish_id = ?2`,
      )
      .bind(noteId, this.parishId)
      .first<NoteRow & { deleted_at: string | null }>();
    return row ?? null;
  }

  /**
   * Apply one offline mutation (spec §3.3). Idempotent on mutationId.
   * Conflict policy (architecture §6):
   *  - version == baseVersion  → apply.
   *  - version >  baseVersion:
   *      private       → latest-received wins; superseded server body is
   *                      preserved as a revision (recoverable, never lost).
   *      parish_public → NOT applied; the incoming body is preserved as a
   *                      revision and the caller gets both versions back.
   * Permission matrix is identical to the online routes: parish_public
   * writes are admin-only; private notes are author-only.
   */
  async applyMutation(input: {
    mutation: SyncMutation;
    userId: string;
    role: Role;
  }): Promise<MutationResult> {
    const { mutation: m, userId, role } = input;

    // 1. Dedupe (safe retry).
    const prior = await this.recordedResult(m);
    if (prior) return prior;

    const reject = async (reason: string): Promise<MutationResult> => {
      await this.db.batch([this.ledgerStmt(m, userId, "rejected", null, reason)]);
      return { status: "rejected", mutationId: m.mutationId, noteId: m.noteId, reason };
    };

    // 2. CREATE ------------------------------------------------------
    if (m.type === "create") {
      const p = m.payload;
      if (!p?.visibility || !p.liturgicalDate) return reject("invalid_payload");
      if (p.visibility === "parish_public" && role !== "admin") {
        return reject("public_notes_admin_only");
      }
      const existing = await this.getNoteAny(m.noteId);
      if (existing) {
        // Same note id created twice without a ledger row (e.g. ledger
        // lost) — treat as replay if it's this author's note.
        if (existing.author_user_id === userId) {
          await this.db.batch([
            this.ledgerStmt(m, userId, "applied", existing.version, null),
          ]);
          return {
            status: "applied",
            mutationId: m.mutationId,
            noteId: m.noteId,
            newVersion: existing.version,
            updatedAt: existing.updated_at,
          };
        }
        return reject("note_id_taken");
      }
      await this.db.batch([
        this.db
          .prepare(
            `INSERT INTO liturgical_notes
               (id, parish_id, author_user_id, visibility, liturgical_date,
                title, body, version, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 1, datetime('now'))`,
          )
          .bind(
            m.noteId,
            this.parishId,
            userId,
            p.visibility,
            p.liturgicalDate,
            p.title ?? null,
            p.body ?? null,
          ),
        this.appendChangeStmt(m.noteId),
        this.ledgerStmt(m, userId, "applied", 1, null),
      ]);
      const created = await this.getNoteAny(m.noteId);
      return {
        status: "applied",
        mutationId: m.mutationId,
        noteId: m.noteId,
        newVersion: 1,
        updatedAt: created?.updated_at ?? "",
      };
    }

    // 3. UPDATE / DELETE ---------------------------------------------
    const note = await this.getNoteAny(m.noteId);
    if (!note) return reject("not_found");

    // Permission matrix (same as online routes).
    if (note.visibility === "parish_public") {
      if (role !== "admin") return reject("public_notes_admin_only");
    } else if (note.author_user_id !== userId) {
      return reject("private_notes_author_only");
    }

    if (note.deleted_at !== null) {
      if (m.type === "delete") {
        // Deleting an already-deleted note: converged, report applied.
        await this.db.batch([
          this.ledgerStmt(m, userId, "applied", note.version, null),
        ]);
        return {
          status: "applied",
          mutationId: m.mutationId,
          noteId: m.noteId,
          newVersion: note.version,
          updatedAt: note.updated_at,
        };
      }
      // Editing a note someone else deleted → surface as conflict so the
      // body is never silently discarded.
      await this.db.batch([
        this.revisionStmt(note.id, userId, m.payload?.body ?? null),
        this.ledgerStmt(m, userId, "conflict", null, null),
      ]);
      return {
        status: "conflict",
        mutationId: m.mutationId,
        noteId: m.noteId,
        serverVersion: note.version,
        serverTitle: note.title,
        serverBody: note.body,
        serverUpdatedAt: note.updated_at,
      };
    }

    const isStale = note.version > m.baseVersion;

    if (m.type === "delete") {
      if (isStale && note.visibility === "parish_public") {
        // Someone edited while this device was offline — don't delete
        // their work; surface the conflict instead.
        await this.db.batch([this.ledgerStmt(m, userId, "conflict", null, null)]);
        return {
          status: "conflict",
          mutationId: m.mutationId,
          noteId: m.noteId,
          serverVersion: note.version,
          serverTitle: note.title,
          serverBody: note.body,
          serverUpdatedAt: note.updated_at,
        };
      }
      const newVersion = note.version + 1;
      await this.db.batch([
        this.db
          .prepare(
            `UPDATE liturgical_notes
             SET deleted_at = datetime('now'), version = version + 1,
                 updated_at = datetime('now')
             WHERE id = ?1 AND parish_id = ?2`,
          )
          .bind(m.noteId, this.parishId),
        this.appendChangeStmt(m.noteId),
        this.ledgerStmt(m, userId, "applied", newVersion, null),
      ]);
      const after = await this.getNoteAny(m.noteId);
      return {
        status: "applied",
        mutationId: m.mutationId,
        noteId: m.noteId,
        newVersion,
        updatedAt: after?.updated_at ?? "",
      };
    }

    // UPDATE
    const p = m.payload ?? {};
    if (isStale && note.visibility === "parish_public") {
      // Parish-public conflict: do NOT apply. Preserve the incoming body
      // as a revision so it can never be lost, and return both versions.
      await this.db.batch([
        this.revisionStmt(note.id, userId, p.body ?? null),
        this.ledgerStmt(m, userId, "conflict", null, null),
      ]);
      return {
        status: "conflict",
        mutationId: m.mutationId,
        noteId: m.noteId,
        serverVersion: note.version,
        serverTitle: note.title,
        serverBody: note.body,
        serverUpdatedAt: note.updated_at,
      };
    }

    // Fresh write, or stale write to a PRIVATE note (latest-received
    // wins; the superseded server body is preserved as a revision).
    const newVersion = note.version + 1;
    await this.db.batch([
      this.revisionStmt(note.id, note.author_user_id, note.body),
      this.db
        .prepare(
          `UPDATE liturgical_notes
           SET title = ?1, body = ?2, last_edited_by_user_id = ?3,
               version = version + 1, updated_at = datetime('now')
           WHERE id = ?4 AND parish_id = ?5 AND deleted_at IS NULL`,
        )
        .bind(p.title ?? null, p.body ?? null, userId, m.noteId, this.parishId),
      this.appendChangeStmt(m.noteId),
      this.ledgerStmt(m, userId, "applied", newVersion, null),
    ]);
    const after = await this.getNoteAny(m.noteId);
    return {
      status: "applied",
      mutationId: m.mutationId,
      noteId: m.noteId,
      newVersion,
      updatedAt: after?.updated_at ?? "",
    };
  }

  /**
   * Pull a page of changed notes since a cursor (spec §3.3). The cursor
   * is note_changes.seq — monotonic and clock-skew-proof. Visibility is
   * filtered server-side exactly like listNotesForDate: parish-public,
   * plus the caller's own private notes. Tombstones ARE included so
   * other devices delete locally. since=0 is the full bootstrap.
   */
  async pullChanges(input: {
    sinceSeq: number;
    limit: number;
    userId: string;
  }): Promise<PullPage> {
    const limit = Math.max(1, Math.min(input.limit, 200));
    const { results } = await this.db
      .prepare(
        `SELECT c.seq, n.id, n.visibility, n.liturgical_date, n.title, n.body,
                n.version, n.updated_at, n.deleted_at, n.author_user_id,
                CASE WHEN n.visibility = 'parish_public'
                     THEN substr(
                            COALESCE(editor.email, author.email),
                            1,
                            instr(COALESCE(editor.email, author.email), '@') - 1
                          )
                     ELSE NULL
                END AS attribution
         FROM note_changes c
         JOIN liturgical_notes n ON n.id = c.note_id AND n.parish_id = c.parish_id
         JOIN users author ON author.id = n.author_user_id
         LEFT JOIN users editor ON editor.id = n.last_edited_by_user_id
         WHERE c.parish_id = ?1
           AND c.seq > ?2
           AND (n.visibility = 'parish_public'
                OR (n.visibility = 'private' AND n.author_user_id = ?3))
         ORDER BY c.seq ASC
         LIMIT ?4`,
      )
      .bind(this.parishId, input.sinceSeq, input.userId, limit + 1)
      .all<PulledNote & { seq: number }>();

    const hasMore = results.length > limit;
    const page = hasMore ? results.slice(0, limit) : results;
    const nextSince = page.length > 0 ? page[page.length - 1].seq : input.sinceSeq;

    // Dedupe: a note edited 5 times since the cursor appears 5 times in
    // the feed; the client only needs the latest row once.
    const byId = new Map<string, PulledNote>();
    for (const row of page) {
      const { seq, ...note } = row;
      void seq;
      byId.set(note.id, note);
    }

    return { changes: [...byId.values()], nextSince, hasMore };
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

  /**
   * Identity snapshot for offline session continuation (spec §1.1): the
   * user's profile plus every ACTIVE membership with its parish's display
   * fields. Like findMembershipsForUser, this runs before a single-parish
   * TenantDB exists — its job is to enumerate the user's own parishes.
   * Revoked/invited memberships are never included, so a revoked device
   * loses the parish from its snapshot on the next refresh (spec §1.5).
   */
  static async identitySnapshotForUser(db: D1Database, userId: string) {
    const user = await db
      .prepare(
        `SELECT id, email, display_name, preferred_language FROM users WHERE id = ?1`,
      )
      .bind(userId)
      .first<{
        id: string;
        email: string;
        display_name: string | null;
        preferred_language: "en" | "tl" | null;
      }>();
    const { results: memberships } = await db
      .prepare(
        `SELECT m.parish_id, m.role, p.name AS parish_name,
                p.default_language, p.subscription_status
         FROM parish_memberships m
         JOIN parishes p ON p.id = m.parish_id
         WHERE m.user_id = ?1 AND m.status = 'active'`,
      )
      .bind(userId)
      .all<{
        parish_id: string;
        role: Role;
        parish_name: string;
        default_language: "en" | "tl";
        subscription_status: "active" | "past_due" | "canceled";
      }>();
    return { user, memberships };
  }
}
