import jwt from 'jsonwebtoken';

function getEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing environment variable: ${key}`);
  return val;
}

function getSheetId() { return getEnv('SHEET_ID'); }
function getSaEmail() { return getEnv('SA_EMAIL'); }
function getSaPrivateKey() { return getEnv('SA_PRIVATE_KEY').replace(/\\n/g, '\n'); }

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now < tokenExpiry - 60) {
    return cachedToken;
  }

  const token = jwt.sign(
    {
      iss: getSaEmail(),
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    },
    getSaPrivateKey(),
    { algorithm: 'RS256' }
  );

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${token}`,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || `Token request failed: HTTP ${res.status}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = now + data.expires_in;
  return cachedToken!;
}

export async function sheetsGet(range: string, options?: { valueRenderOption?: string; dateTimeRenderOption?: string }) {
  const token = await getAccessToken();
  const searchParams = new URLSearchParams();
  if (options?.valueRenderOption) searchParams.set('valueRenderOption', options.valueRenderOption);
  if (options?.dateTimeRenderOption) searchParams.set('dateTimeRenderOption', options.dateTimeRenderOption);
  const qs = searchParams.toString();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${getSheetId()}/values/${range}${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function sheetsAppend(range: string, values: (string | number)[][]) {
  const token = await getAccessToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${getSheetId()}/values/${range}:append?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function sheetsUpdate(range: string, values: (string | number)[][]) {
  const token = await getAccessToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${getSheetId()}/values/${range}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}
