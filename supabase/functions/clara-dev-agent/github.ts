import { SignJWT, importPKCS8 } from "https://deno.land/x/jose@v5.2.0/index.ts";

const GITHUB_API = "https://api.github.com";

const getInstallationToken = async (): Promise<string> => {
  const appId = Deno.env.get('GITHUB_APP_ID')!;
  const privateKeyPem = Deno.env.get('GITHUB_APP_PRIVATE_KEY')!;
  const installationId = Deno.env.get('GITHUB_INSTALLATION_ID')!;

  console.log('PEM key length:', privateKeyPem?.length);
  console.log('PEM starts with:', privateKeyPem?.substring(0, 30));

  // Clean PEM — handle literal \n from env vars
  const cleanPem = privateKeyPem
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .trim();

  // Convert PKCS#1 (RSA PRIVATE KEY) to PKCS#8 format for jose
  // jose's importPKCS8 needs "BEGIN PRIVATE KEY" not "BEGIN RSA PRIVATE KEY"
  let pkcs8Pem = cleanPem;
  if (cleanPem.includes('BEGIN RSA PRIVATE KEY')) {
    // Use openssl-style conversion via manual ASN.1 wrapping
    // Extract base64 body
    const lines = cleanPem.split('\n').filter(l => !l.startsWith('-----') && l.trim());
    const base64Body = lines.join('');
    const binaryStr = atob(base64Body);
    const pkcs1 = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) pkcs1[i] = binaryStr.charCodeAt(i);

    // PKCS#8 wrapping for RSA key
    // Prefix: SEQUENCE { INTEGER(0), SEQUENCE { OID(rsaEncryption), NULL }, OCTET STRING { pkcs1 } }
    const oid = [0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00];
    const algSeq = [0x30, oid.length, ...oid];
    const version = [0x02, 0x01, 0x00];

    // OCTET STRING wrapping for pkcs1
    const octetLen = pkcs1.length;
    const octetHeader = octetLen < 128
      ? [0x04, octetLen]
      : octetLen < 256
        ? [0x04, 0x81, octetLen]
        : [0x04, 0x82, (octetLen >> 8) & 0xff, octetLen & 0xff];

    const innerBytes = [...version, ...algSeq, ...octetHeader];
    const innerLen = innerBytes.length + pkcs1.length;
    const outerHeader = innerLen < 128
      ? [0x30, innerLen]
      : innerLen < 256
        ? [0x30, 0x81, innerLen]
        : [0x30, 0x82, (innerLen >> 8) & 0xff, innerLen & 0xff];

    const pkcs8Der = new Uint8Array(outerHeader.length + innerBytes.length + pkcs1.length);
    pkcs8Der.set(outerHeader, 0);
    pkcs8Der.set(new Uint8Array(innerBytes), outerHeader.length);
    pkcs8Der.set(pkcs1, outerHeader.length + innerBytes.length);

    // Convert back to PEM with PKCS#8 headers
    const b64 = btoa(String.fromCharCode(...pkcs8Der));
    const b64Lines = b64.match(/.{1,64}/g) || [];
    pkcs8Pem = `-----BEGIN PRIVATE KEY-----\n${b64Lines.join('\n')}\n-----END PRIVATE KEY-----`;
  }

  console.log('PEM format:', pkcs8Pem.substring(0, 30));

  const privateKey = await importPKCS8(pkcs8Pem, 'RS256');

  // Create JWT (valid 10 minutes, issued 60s ago for clock skew)
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({ iss: appId })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt(now - 60)
    .setExpirationTime(now + 600)
    .sign(privateKey);

  // Exchange JWT for installation access token
  const response = await fetch(
    `${GITHUB_API}/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GitHub token exchange failed: ${err}`);
  }

  const data = await response.json();
  return data.token;
};

export const githubApi = async (
  path: string,
  method = 'GET',
  body?: unknown
) => {
  const token = await getInstallationToken();
  const response = await fetch(`${GITHUB_API}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GitHub API ${method} ${path}: ${err}`);
  }

  return response.json();
};

const REPO_OWNER = Deno.env.get('GITHUB_REPO_OWNER') || 'LeeSpain';
const REPO_NAME = Deno.env.get('GITHUB_REPO_NAME') || 'lifelink-sync';
const repo = () => `/repos/${REPO_OWNER}/${REPO_NAME}`;

export const readFile = async (filePath: string): Promise<string> => {
  const data = await githubApi(`${repo()}/contents/${filePath}`);
  return atob(data.content.replace(/\n/g, ''));
};

export const getFileSha = async (
  filePath: string
): Promise<string | null> => {
  try {
    const data = await githubApi(`${repo()}/contents/${filePath}`);
    return data.sha;
  } catch {
    return null;
  }
};

export const writeFile = async (
  filePath: string,
  content: string,
  branch: string,
  commitMessage: string
): Promise<void> => {
  const sha = await getFileSha(filePath);
  await githubApi(
    `${repo()}/contents/${filePath}`,
    'PUT',
    {
      message: commitMessage,
      content: btoa(content),
      branch,
      ...(sha ? { sha } : {}),
    }
  );
};

export const createBranch = async (branchName: string): Promise<void> => {
  const ref = await githubApi(`${repo()}/git/ref/heads/main`);
  const sha = ref.object.sha;
  await githubApi(`${repo()}/git/refs`, 'POST', {
    ref: `refs/heads/${branchName}`,
    sha,
  });
};

export const createPR = async (
  branch: string,
  title: string,
  body: string
): Promise<{ number: number; url: string }> => {
  const pr = await githubApi(`${repo()}/pulls`, 'POST', {
    title,
    body,
    head: branch,
    base: 'main',
  });
  return { number: pr.number, url: pr.html_url };
};

export const listFiles = async (dirPath: string): Promise<string[]> => {
  const data = await githubApi(`${repo()}/contents/${dirPath}`);
  return Array.isArray(data)
    ? data.map((f: { name: string }) => f.name)
    : [];
};
