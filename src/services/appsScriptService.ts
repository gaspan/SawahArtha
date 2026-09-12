/**
 * AppsScriptService - Backup & Restore via Google Apps Script (Tier 4D Alternative)
 */

export async function uploadBackupToAppsScript(
  url: string,
  payload: string
): Promise<void> {
  if (!url || !url.startsWith('https://script.google.com/')) {
    throw new Error('URL Apps Script tidak valid.');
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain', // GAS Web Apps handle text/plain more predictably for raw payloads
    },
    body: payload,
  });

  if (!res.ok) {
    throw new Error(`Upload gagal (Status ${res.status})`);
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Terjadi kesalahan saat upload.');
  }
}

export async function downloadBackupFromAppsScript(
  url: string
): Promise<string> {
  if (!url || !url.startsWith('https://script.google.com/')) {
    throw new Error('URL Apps Script tidak valid.');
  }

  const res = await fetch(url, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error(`Download gagal (Status ${res.status})`);
  }

  const json = await res.json();
  
  // If the GAS script returns a success: false object for errors (like file not found)
  if (json && typeof json === 'object' && json.success === false) {
    throw new Error(json.error || 'Terjadi kesalahan saat download.');
  }

  // If it's a valid backup JSON, it will just return the JSON object, not a {success} wrapper.
  return JSON.stringify(json);
}
