import { create } from "https://deno.land/x/djwt@v2.8/mod.ts";

const GITHUB_API = "https://api.github.com";

const getInstallationToken = async (): Promise<string> => {
  const appId = Deno.env.get('GITHUB_APP_ID')!;
  const privateKeyPem = Deno.env.get('GITHUB_APP_PRIVATE_KEY')!;
  const installationId = Deno.env.get('GITHUB_INSTALLATION_ID')!;

  console.log('PEM key length:', privateKeyPem?.length);
  console.log('PEM starts with:', privateKeyPem?.substring(0, 30));

  // Handle all possible storage formats
  const cleanPem = privateKeyPem
    .replace(/\\n/g, '\n')  // literal \n to real newline
    .replace(/\\r/g, '')    // remove any \r
    .trim();

  // Extract the base64 body between header/footer
  const pemLines = cleanPem.split('\n');
  const base64Lines = pemLines.filter(line =>
    !line.startsWith('-----') && line.trim().length > 0
  );
  const pemBody = base64Lines.join('');

  // Decode base64 to binary
  let binaryString: string;
  try {
    binaryString = atob(pemBody);
  } catch (e) {
    throw new Error(`PEM base64 decode failed. Key length: ${pemBody.length}, First 20 chars: ${pemBody.substring(0, 20)}`);
  }

  const binaryDer = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    binaryDer[i] = binaryString.charCodeAt(i);
  }

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Create JWT (valid 10 minutes, issued 60s ago for clock skew)
  const now = Math.floor(Date.now() / 1000);
  const jwt = await create(
    { alg: "RS256", typ: "JWT" },
    { iat: now - 60, exp: now + 600, iss: appId },
    privateKey
  );

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
