// worker/tenant-db.ts
//
// TenantDB is the ONLY module in this codebase allowed to call
// `.prepare()` on the raw D1Database binding for tenant-scoped tables.
// Every method here injects `this.parishId` into its query. Route
// handlers receive a constructed TenantDB instance and never see the
// raw `env.DB` binding directly (see auth-context.ts).
//
// A lint rule + CI check (tracked separately, see architecture §8)
// should forbid `.prepare(` anywhere outside this file.

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
  // Notes
  // ---------------------------------------------------------------

  /**
   * Notes visible to `userId` for a given liturgical date within this
   * parish: all parish_public notes, plus this user's own private notes.
   */
  async listNotesForDate(date: string, userId: string) {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM liturgical_notes
         WHERE parish_id = ?1
           AND liturgical_date = ?2
           AND deleted_at IS NULL
           AND (visibility = 'parish_public'
                OR (visibility = 'private' AND author_user_id = ?3))
         ORDER BY updated_at DESC`,
      )
      .bind(this.parishId, date, userId)
      .all();
    return results;
  }

  async createNote(input: {
    id: string;
    authorUserId: string;
    visibility: "private" | "parish_public";
    liturgicalDate: string;
    title: string | null;
    body: string | null;
  }) {
    await this.db
      .prepare(
        `INSERT INTO liturgical_notes
           (id, parish_id, author_user_id, visibility, liturgical_date, title, body, version, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 1, datetime('now'))`,
      )
      .bind(
        input.id,
        this.parishId,
        input.authorUserId,
        input.visibility,
        input.liturgicalDate,
        input.title,
        input.body,
      )
      .run();
  }

  // ---------------------------------------------------------------
  // Membership (used by auth-context.ts to resolve/validate parish access)
  // ---------------------------------------------------------------

  /**
   * NOTE: this one method is intentionally NOT parish-scoped, because
   * its entire purpose is to discover which parish(es) a user belongs
   * to. It is only ever called from auth-context.ts, before a
   * parish_id — and therefore a TenantDB instance — exists yet. It is
   * not exposed as an instance method to avoid confusion with the
   * scoped methods above.
   */
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
