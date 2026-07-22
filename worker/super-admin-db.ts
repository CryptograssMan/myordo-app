// worker/super-admin-db.ts
//
// CROSS-TENANT privileged access for the super-admin console (§3.4). Uses
// .prepare() and is allowlisted in eslint.config.js. Never selects note
// title/body; every mutation batches its super_admin_audit row; no hard
// deletes (revoke / cancel instead).

export interface AdminActor {
  userId: string;
  email: string;
}

type MembershipRole = "admin" | "staff";
type MembershipStatus = "invited" | "active" | "revoked";
type SubscriptionStatus = "active" | "past_due" | "canceled";

export class SuperAdminDB {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async getUserById(userId: string) {
    return this.db
      .prepare(`SELECT id, email, display_name FROM users WHERE id = ?1`)
      .bind(userId)
      .first<{ id: string; email: string; display_name: string | null }>();
  }

  // ---------- READS (metadata + counts only) ----------

  async listParishes() {
    const { results } = await this.db
      .prepare(
        `SELECT
           p.id, p.name, p.slug, p.subscription_status,
           p.default_language, p.created_at,
           (SELECT COUNT(*) FROM parish_memberships m
              WHERE m.parish_id = p.id AND m.status = 'active')  AS active_members,
           (SELECT COUNT(*) FROM parish_memberships m
              WHERE m.parish_id = p.id AND m.status = 'invited') AS invited_members,
           (SELECT COUNT(*) FROM liturgical_notes n
              WHERE n.parish_id = p.id AND n.deleted_at IS NULL) AS note_count
         FROM parishes p
         ORDER BY p.created_at DESC`,
      )
      .all();
    return results;
  }

  async getParishDetail(parishId: string) {
    const parish = await this.db
      .prepare(
        `SELECT id, name, slug, subscription_status, default_language,
                banner_r2_key, created_at
           FROM parishes WHERE id = ?1`,
      )
      .bind(parishId)
      .first();
    if (!parish) return null;

    const { results: members } = await this.db
      .prepare(
        `SELECT m.id, m.email, m.role, m.status, m.created_at,
                u.id AS user_id, u.display_name,
                (u.google_sub IS NOT NULL) AS has_logged_in
           FROM parish_memberships m
           LEFT JOIN users u ON u.id = m.user_id
          WHERE m.parish_id = ?1
          ORDER BY m.role, m.email`,
      )
      .bind(parishId)
      .all();

    return { parish, members };
  }

  async listAuditLog(limit = 200) {
    const { results } = await this.db
      .prepare(
        `SELECT id, actor_email, action, target_type, target_id,
                before_json, after_json, created_at
           FROM super_admin_audit
          ORDER BY created_at DESC
          LIMIT ?1`,
      )
      .bind(limit)
      .all();
    return results;
  }

  // ---------- CREATE (each atomically writes its audit row) ----------

  // Manual parish creation (super-admin comp / seed). Deliberately bypasses
  // the PayMongo provisioning pipeline (§5), so it is only reachable from
  // this gated console. Seeds an initial 'invited' admin membership in the
  // same transaction -- a parish with no admin can't be logged into.
  async createParish(
    actor: AdminActor,
    input: { name: string; slug: string | null; defaultLanguage: "en" | "tl"; adminEmail: string },
  ) {
    const parishId = crypto.randomUUID();
    const membershipId = crypto.randomUUID();
    const parishAfter = {
      id: parishId,
      name: input.name,
      slug: input.slug,
      default_language: input.defaultLanguage,
      subscription_status: "active",
    };
    const memberAfter = {
      id: membershipId,
      parish_id: parishId,
      email: input.adminEmail,
      role: "admin",
      status: "invited",
    };
    await this.db.batch([
      this.db
        .prepare(
          `INSERT INTO parishes (id, name, slug, default_language, subscription_status)
           VALUES (?1, ?2, ?3, ?4, 'active')`,
        )
        .bind(parishId, input.name, input.slug, input.defaultLanguage),
      this.db
        .prepare(
          `INSERT INTO parish_memberships (id, parish_id, email, role, status)
           VALUES (?1, ?2, ?3, 'admin', 'invited')`,
        )
        .bind(membershipId, parishId, input.adminEmail),
      this.auditStmt(actor, "parish.create", "parish", parishId, null, parishAfter),
      this.auditStmt(actor, "membership.invite", "membership", membershipId, null, memberAfter),
    ]);
    return parishAfter;
  }

  // Invite a member to an existing parish (seed an 'invited' row; on first
  // Google login, google_sub binds and status flips to 'active', §5).
  async inviteMember(actor: AdminActor, parishId: string, email: string, role: MembershipRole) {
    const parish = await this.db
      .prepare(`SELECT id FROM parishes WHERE id = ?1`)
      .bind(parishId)
      .first();
    if (!parish) throw new Error("Parish not found");

    const membershipId = crypto.randomUUID();
    const after = { id: membershipId, parish_id: parishId, email, role, status: "invited" };
    await this.db.batch([
      this.db
        .prepare(
          `INSERT INTO parish_memberships (id, parish_id, email, role, status)
           VALUES (?1, ?2, ?3, ?4, 'invited')`,
        )
        .bind(membershipId, parishId, email, role),
      this.auditStmt(actor, "membership.invite", "membership", membershipId, null, after),
    ]);
    return after;
  }

  // ---------- MUTATIONS (each atomically writes its audit row) ----------

  async updateMembershipRole(actor: AdminActor, membershipId: string, newRole: MembershipRole) {
    const before = await this.db
      .prepare(`SELECT id, parish_id, email, role, status FROM parish_memberships WHERE id = ?1`)
      .bind(membershipId)
      .first();
    if (!before) throw new Error("Membership not found");
    const after = { ...before, role: newRole };
    await this.db.batch([
      this.db.prepare(`UPDATE parish_memberships SET role = ?2 WHERE id = ?1`).bind(membershipId, newRole),
      this.auditStmt(actor, "membership.role.update", "membership", membershipId, before, after),
    ]);
    return after;
  }

  async updateMembershipStatus(actor: AdminActor, membershipId: string, newStatus: MembershipStatus) {
    const before = await this.db
      .prepare(`SELECT id, parish_id, email, role, status FROM parish_memberships WHERE id = ?1`)
      .bind(membershipId)
      .first();
    if (!before) throw new Error("Membership not found");
    const after = { ...before, status: newStatus };
    await this.db.batch([
      this.db.prepare(`UPDATE parish_memberships SET status = ?2 WHERE id = ?1`).bind(membershipId, newStatus),
      this.auditStmt(actor, "membership.status.update", "membership", membershipId, before, after),
    ]);
    return after;
  }

  async updateParishSubscriptionStatus(actor: AdminActor, parishId: string, newStatus: SubscriptionStatus) {
    const before = await this.db
      .prepare(`SELECT id, name, subscription_status FROM parishes WHERE id = ?1`)
      .bind(parishId)
      .first();
    if (!before) throw new Error("Parish not found");
    const after = { ...before, subscription_status: newStatus };
    await this.db.batch([
      this.db.prepare(`UPDATE parishes SET subscription_status = ?2 WHERE id = ?1`).bind(parishId, newStatus),
      this.auditStmt(actor, "parish.subscription.update", "parish", parishId, before, after),
    ]);
    return after;
  }

  private auditStmt(
    actor: AdminActor,
    action: string,
    targetType: "parish" | "membership",
    targetId: string,
    before: unknown,
    after: unknown,
  ) {
    return this.db
      .prepare(
        `INSERT INTO super_admin_audit
           (id, actor_user_id, actor_email, action, target_type, target_id, before_json, after_json)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
      )
      .bind(
        crypto.randomUUID(),
        actor.userId,
        actor.email,
        action,
        targetType,
        targetId,
        before === null ? null : JSON.stringify(before),
        JSON.stringify(after),
      );
  }
}
