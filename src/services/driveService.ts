/**
 * Google Drive backup sync (Tier 4D)
 * Uses expo-auth-session (authorization-code + PKCE, refresh token in SecureStore).
 *
 * Prerequisites (see readme Tier 4D):
 *  - Google Cloud project with OAuth client (Android/iOS/web)
 *  - Client ID(s) configured in app.json extra.googleDriveClientIds
 */
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TOKEN_KEY = 'sawahartha_drive_token';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const MIME_JSON = 'application/json';
const APP_FOLDER_NAME = 'SawahArtha Backups';

interface StoredToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

function clientIds(): { android?: string; ios?: string; web?: string } {
  return Constants.expoConfig?.extra?.googleDriveClientIds ?? {};
}

function makeDiscovery(): AuthSession.DiscoveryDocument {
  return {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  };
}

export function hasDriveClientId(): boolean {
  const ids = clientIds();
  if (Platform.OS === 'android') return !!ids.android;
  if (Platform.OS === 'ios') return !!ids.ios;
  return !!ids.web;
}

function platformClientId(): string | undefined {
  const ids = clientIds();
  if (Platform.OS === 'android') return ids.android;
  if (Platform.OS === 'ios') return ids.ios;
  return ids.web;
}

/**
 * Redirect URI for installed apps.
 * Google auto-accepts `<package-name>:/oauthredirect` for Android/iOS OAuth
 * clients (same pattern as expo-auth-session's own Google provider), so it
 * needs no redirect entry in Google Cloud Console. A custom scheme such as
 * `sawahartha://` is rejected with redirect_uri_mismatch.
 * The package name must also be listed in app.json `scheme`.
 */
export function driveRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    native: `${Application.applicationId}:/oauthredirect`,
  });
}

export function useDriveAuthRequest() {
  return AuthSession.useAuthRequest(
    {
      clientId: platformClientId() ?? '',
      scopes: SCOPES,
      redirectUri: driveRedirectUri(),
      extraParams: { access_type: 'offline', prompt: 'consent' },
    },
    makeDiscovery()
  );
}

/**
 * Exchange the authorization code for tokens (PKCE, no client secret).
 * `useAuthRequest` defaults to responseType=code on installed apps, so the
 * prompt result carries `params.code` and `authentication` stays null —
 * this exchange is required to obtain access/refresh tokens.
 */
export async function exchangeDriveCode(
  code: string,
  codeVerifier: string | undefined
): Promise<StoredToken> {
  const token = await AuthSession.exchangeCodeAsync(
    {
      clientId: platformClientId() ?? '',
      code,
      redirectUri: driveRedirectUri(),
      extraParams: codeVerifier ? { code_verifier: codeVerifier } : undefined,
    },
    makeDiscovery()
  );

  return {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
    expiresAt: token.issuedAt
      ? (token.issuedAt + (token.expiresIn ?? 3600)) * 1000
      : Date.now() + (token.expiresIn ?? 3600) * 1000,
  };
}

async function saveToken(token: StoredToken): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(token));
}

async function loadToken(): Promise<StoredToken | null> {
  const raw = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredToken;
  } catch {
    return null;
  }
}

export async function saveAuthToken(token: StoredToken): Promise<void> {
  await saveToken(token);
}

export async function clearDriveToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function validAccessToken(): Promise<string | null> {
  const token = await loadToken();
  if (!token?.accessToken) return null;
  if (token.expiresAt && token.expiresAt > Date.now()) return token.accessToken;

  // Try refresh
  if (token.refreshToken) {
    try {
      const clientId = platformClientId();
      const resp = await fetch(makeDiscovery().tokenEndpoint!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken,
          client_id: clientId ?? '',
        }).toString(),
      });
      const data = await resp.json();
      if (data.access_token) {
        const refreshed: StoredToken = {
          accessToken: data.access_token,
          refreshToken: token.refreshToken,
          expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
        };
        await saveToken(refreshed);
        return refreshed.accessToken;
      }
    } catch {
      // fall through to null
    }
  }
  return null;
}

async function apiFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const token = await validAccessToken();
  if (!token) throw new Error('Tidak terautentikasi dengan Google Drive.');
  return fetch(`${DRIVE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

async function ensureAppFolder(): Promise<string> {
  const query = encodeURIComponent(
    `name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const resp = await apiFetch(`/files?q=${query}&fields=files(id,name)`);
  const data = await resp.json();
  if (data.files?.length) return data.files[0].id;

  const create = await apiFetch('/files', {
    method: 'POST',
    body: JSON.stringify({
      name: APP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });
  const created = await create.json();
  return created.id;
}

export async function uploadBackupToDrive(
  fileName: string,
  jsonContent: string
): Promise<string> {
  const folderId = await ensureAppFolder();
  const search = encodeURIComponent(
    `name='${fileName}' and '${folderId}' in parents and trashed=false`
  );
  const list = await apiFetch(`/files?q=${search}&fields=files(id)`);
  const listData = await list.json();
  const existing = listData.files?.[0]?.id;

  const meta = JSON.stringify({
    name: fileName,
    parents: [folderId],
    mimeType: MIME_JSON,
  });

  const boundary = `sawahartha${Date.now()}`;
  const body = [
    `--${boundary}`,
    `Content-Type: application/json; charset=UTF-8`,
    '',
    meta,
    `--${boundary}`,
    `Content-Type: ${MIME_JSON}`,
    '',
    jsonContent,
    `--${boundary}--`,
    '',
  ].join('\r\n');

  const uploadUrl = existing
    ? `${DRIVE_API}/files/${existing}?uploadType=multipart`
    : `${DRIVE_API}/files?uploadType=multipart`;
  const method = existing ? 'PATCH' : 'POST';

  const token = await validAccessToken();
  if (!token) throw new Error('Tidak terautentikasi dengan Google Drive.');

  const resp = await fetch(uploadUrl, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!resp.ok) {
    throw new Error(`Gagal upload ke Google Drive (HTTP ${resp.status}).`);
  }
  const data = await resp.json();
  return data.id;
}

export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
}

export async function listDriveBackups(): Promise<DriveBackupFile[]> {
  const folderId = await ensureAppFolder();
  const query = encodeURIComponent(
    `'${folderId}' in parents and mimeType='${MIME_JSON}' and trashed=false`
  );
  const resp = await apiFetch(
    `/files?q=${query}&fields=files(id,name,createdTime)&orderBy=createdTime desc`
  );
  const data = await resp.json();
  return (data.files ?? []).map((f: DriveBackupFile) => f);
}

export async function downloadBackupFromDrive(
  fileId: string
): Promise<string> {
  const resp = await apiFetch(`/files/${fileId}?alt=media`);
  if (!resp.ok) {
    throw new Error(`Gagal unduh backup dari Drive (HTTP ${resp.status}).`);
  }
  return resp.text();
}
