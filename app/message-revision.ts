// Build a viewer-specific fingerprint for deciding whether a conversation needs refreshing.
// The fingerprint must contain only records that the viewer is allowed to observe.
export async function messageRevision(
  store: D1Database,
  kind: "direct" | "circle",
  scope: string,
  viewer: string,
  historyAfter = 0,
  includeRequests = false,
) {
  // These identifiers come only from the closed kind union, never from request data.
  const table = kind === "direct" ? "messages" : "circle_messages";
  const column = kind === "direct" ? "connection" : "circle";
  const isCircle = kind === "circle";
  const visibleHistory = isCircle
    ? "AND m.rowid>? AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.actor=? AND b.target=m.sender) OR (b.actor=m.sender AND b.target=?))"
    : "";
  const messageBindings = isCircle
    ? [scope, historyAfter, viewer, viewer]
    : [scope];

  // A later join must not reveal edits to messages posted before that member arrived.
  const rows = await store
    .prepare(
      `SELECT m.rowid,m.id,m.sender,m.edit_count,m.deleted_at,m.reply_to,(m.audio_key<>'' OR m.attachment_key<>'') AS media,json_extract(p.data,'$.name') AS name FROM ${table} m LEFT JOIN profiles p ON p.id=m.sender WHERE m.${column}=? ${visibleHistory} ORDER BY m.rowid`,
    )
    .bind(...messageBindings)
    .all();

  // Reactions affect the fingerprint only when both the message and reactor are visible.
  const visibleReactions = isCircle
    ? await store
        .prepare(
          `SELECT r.message,r.member,r.emoji FROM message_reactions r WHERE r.kind=? AND r.scope=? AND EXISTS (SELECT 1 FROM circle_messages m WHERE m.id=r.message AND m.circle=? AND m.rowid>? AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.actor=? AND b.target=m.sender) OR (b.actor=m.sender AND b.target=?))) AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.actor=? AND b.target=r.member) OR (b.actor=r.member AND b.target=?)) ORDER BY r.message,r.member`,
        )
        .bind(kind, scope, scope, historyAfter, viewer, viewer, viewer, viewer)
        .all()
    : await store
        .prepare(
          "SELECT message,member,emoji FROM message_reactions WHERE kind=? AND scope=? ORDER BY message,member",
        )
        .bind(kind, scope)
        .all();

  // Viewer block relationships are part of the view because they hide people and messages.
  const blocks = await store
    .prepare(
      "SELECT actor,target FROM blocks WHERE actor=? OR target=? ORDER BY actor,target",
    )
    .bind(viewer, viewer)
    .all();

  // Non-host circle members cannot see pending join requests, so exclude them from their hash.
  const members = isCircle
    ? await store
        .prepare(
          "SELECT m.member,m.status,m.role,m.history_after,json_extract(p.data,'$.name') AS name FROM circle_members m LEFT JOIN profiles p ON p.id=m.member JOIN safety_accounts a ON a.id=m.member WHERE m.circle=? AND (m.status='accepted' OR (?=1 AND m.status='requested')) AND a.status='admitted' AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.actor=? AND b.target=m.member) OR (b.actor=m.member AND b.target=?)) ORDER BY m.member",
        )
        .bind(scope, includeRequests ? 1 : 0, viewer, viewer)
        .all()
    : { results: [] };

  // Hash structured, ordered data; callers receive no conversation text or roster details here.
  const bytes = new TextEncoder().encode(
    JSON.stringify([
      rows.results,
      visibleReactions.results,
      blocks.results,
      members.results,
    ]),
  );
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
}
