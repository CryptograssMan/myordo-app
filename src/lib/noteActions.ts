// src/lib/noteActions.ts
//
// Thin client for the note write endpoints. Each returns { ok } or an
// error message. Server enforces the real permission matrix (route +
// TenantDB); these are just typed fetch wrappers for the UI.

export interface SaveResult {
  ok: boolean;
  error?: string;
}

async function readError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string };
    return j.error ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function createNote(input: {
  visibility: "private" | "parish_public";
  liturgicalDate: string;
  title: string | null;
  note: string | null;
}): Promise<SaveResult> {
  const res = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.ok ? { ok: true } : { ok: false, error: await readError(res) };
}

export async function updateNote(
  id: string,
  input: { title: string | null; note: string | null },
): Promise<SaveResult> {
  const res = await fetch(`/api/notes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.ok ? { ok: true } : { ok: false, error: await readError(res) };
}

export async function deleteNote(id: string): Promise<SaveResult> {
  const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
  return res.ok ? { ok: true } : { ok: false, error: await readError(res) };
}
