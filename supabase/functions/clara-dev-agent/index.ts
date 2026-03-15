import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { readFile, writeFile, createBranch, createPR, listFiles, searchFiles } from './github.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;
const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const twilioFrom = Deno.env.get('TWILIO_WHATSAPP_FROM')!;
const adminNumber = Deno.env.get('ADMIN_WHATSAPP_NUMBER')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sendWhatsApp = async (to: string, body: string) => {
  const toAddr = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: toAddr, From: twilioFrom, Body: body }).toString(),
  });
  console.log('Dev agent WhatsApp send:', res.status, await res.text());
};

const interpretIntent = async (command: string): Promise<{intent: string, description: string, risk_level: string, confirmation_question: string}> => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are CLARA, the AI for LifeLink Sync. Lee (the owner) has sent a dev command via WhatsApp. Interpret it and respond in JSON only.

Command: "${command}"

Respond with JSON only:
{
  "intent": "one line technical description",
  "description": "plain English of what will change",
  "risk_level": "low|medium|high",
  "confirmation_question": "short confirmation message to send Lee, max 2 sentences"
}

Risk levels:
- low: text/style changes, copy updates
- medium: component changes, new features
- high: DB changes, auth changes, payment changes`
      }],
    }),
  });
  const data = await response.json();
  const text = data.content[0].text;
  return JSON.parse(text);
};

// ── CLAUDE CODE EXECUTION ─────────────────────────

interface FileEdit {
  file_path: string;
  action: 'replace' | 'prepend' | 'append' | 'create';
  search?: string;    // for replace only
  replace?: string;   // for replace only
  content?: string;   // for prepend/append/create
  description: string;
}

const getImplementationPlan = async (
  command: string,
  intent: string
): Promise<{
  title: string;
  summary: string;
  edits: FileEdit[];
}> => {
  // 1. Find likely files to edit based on capitalized words in the command
  const searchTerms = command.match(/\b[A-Z][a-zA-Z]+\b/g) || [];
  const filesToRead: Record<string, string> = {};

  for (const term of searchTerms.slice(0, 3)) {
    try {
      const found = await searchFiles(term, 'src');
      for (const path of found.slice(0, 2)) {
        if (!filesToRead[path]) {
          const content = await readFile(path);
          filesToRead[path] = content.substring(0, 3000);
        }
      }
    } catch { /* skip */ }
  }

  // Also try common patterns from the command
  const lowerCmd = command.toLowerCase();
  const commonFiles: Record<string, string> = {
    'pricing': 'src/components/Pricing.tsx',
    'homepage': 'src/pages/Index.tsx',
    'login': 'src/pages/AuthPage.tsx',
    'auth': 'src/pages/AuthPage.tsx',
    'dashboard': 'src/pages/Dashboard.tsx',
    'readme': 'README.md',
  };
  for (const [keyword, path] of Object.entries(commonFiles)) {
    if (lowerCmd.includes(keyword) && !filesToRead[path]) {
      try {
        const content = await readFile(path);
        filesToRead[path] = content.substring(0, 3000);
      } catch { /* skip */ }
    }
  }

  // 2. Fetch directory listings
  let srcDirs: string[] = [];
  let funcDirs: string[] = [];
  try {
    srcDirs = await listFiles('src/components');
    funcDirs = await listFiles('supabase/functions');
  } catch { /* skip */ }

  // 3. Build context with actual file contents
  const fileContext = Object.entries(filesToRead)
    .map(([path, content]) => `FILE: ${path}\n\`\`\`\n${content}\n\`\`\``)
    .join('\n\n');

  console.log('Files pre-loaded for plan:', Object.keys(filesToRead).join(', '));

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are making code changes to the LifeLink Sync repository (React + TypeScript + Tailwind + Supabase).

Command: "${command}"
Intent: "${intent}"

ACTUAL FILE CONTENTS (use these for exact search strings):
${fileContext || 'No files pre-loaded — use directory listings below.'}

Available directories:
src/components: ${srcDirs.join(', ') || 'unknown'}
supabase/functions: ${funcDirs.join(', ') || 'unknown'}

Generate a precise implementation plan. For "replace" actions, you MUST copy the search string CHARACTER FOR CHARACTER from the file contents shown above.

Edit actions:
1. "replace" - find EXACT text from file above and replace it
2. "prepend" - add content to top of file
3. "append" - add content to bottom of file
4. "create" - create a new file entirely

Respond with JSON only:
{
  "title": "Short PR title (max 70 chars)",
  "summary": "1-3 sentence description",
  "edits": [
    {
      "file_path": "exact/path/from/above.tsx",
      "action": "replace",
      "search": "EXACT string copied from file contents above",
      "replace": "new content",
      "description": "what this edit does"
    }
  ]
}

Rules:
- For replace: search strings MUST be exact copies from the file contents shown above
- Keep edits small — only change what the command asks for
- Never touch auth, payment, or emergency code unless explicitly asked
- Maximum 5 edits per command`
      }],
    }),
  });

  const data = await response.json();
  const text = data.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('CLARA returned no valid plan');
  return JSON.parse(jsonMatch[0]);
};

const runClaudeCode = async (
  command: string,
  intent: string,
  logId: string,
  fromNumber: string
) => {
  // 1. Get implementation plan from CLARA
  const plan = await getImplementationPlan(command, intent);
  console.log('Plan:', plan.title, '—', plan.edits.length, 'edits');

  // 2. Create branch
  const timestamp = Date.now();
  const slug = plan.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
  const branchName = `agent/${timestamp}-${slug}`;

  await createBranch(branchName);
  console.log('Branch created:', branchName);

  // 3. Apply each file edit
  const filesRead: string[] = [];
  const filesChanged: string[] = [];
  const editSummaries: string[] = [];

  for (const edit of plan.edits) {
    try {
      let newContent: string;
      const action = edit.action || 'replace'; // backward compat

      if (action === 'create') {
        // Create new file — no read needed
        newContent = edit.content || '';
      } else {
        // Read current file for replace/prepend/append
        let currentContent: string;
        let fileExists = true;
        try {
          currentContent = await readFile(edit.file_path);
          filesRead.push(edit.file_path);
        } catch (readErr) {
          fileExists = false;
          if (action === 'prepend' || action === 'append') {
            console.log(`File ${edit.file_path} not found — creating with ${action} content`);
            currentContent = '';
          } else {
            // replace on non-existent file — try auto-search
            const fileName = edit.file_path.split('/').pop() || '';
            console.warn(`File not found: ${edit.file_path} — searching for ${fileName}`);
            try {
              const foundPaths = await searchFiles(fileName, 'src');
              if (foundPaths.length > 0) {
                console.log(`Auto-found: ${foundPaths[0]}`);
                edit.file_path = foundPaths[0];
                currentContent = await readFile(edit.file_path);
                filesRead.push(edit.file_path);
                fileExists = true;
              } else {
                editSummaries.push(`⚠️ ${edit.file_path}: file not found anywhere`);
                continue;
              }
            } catch {
              editSummaries.push(`⚠️ ${edit.file_path}: file not found — cannot replace`);
              continue;
            }
          }
        }

        if (action === 'replace') {
          if (!edit.search || !currentContent.includes(edit.search)) {
            console.warn(`Search string not found in ${edit.file_path}, skipping`);
            editSummaries.push(`⚠️ ${edit.file_path}: search string not found, skipped`);
            continue;
          }
          newContent = currentContent.replace(edit.search, edit.replace || '');
        } else if (action === 'prepend') {
          newContent = (edit.content || '') + '\n\n' + currentContent;
        } else if (action === 'append') {
          newContent = currentContent + '\n\n' + (edit.content || '');
        } else {
          console.warn(`Unknown action "${action}" for ${edit.file_path}, skipping`);
          editSummaries.push(`⚠️ ${edit.file_path}: unknown action "${action}"`);
          continue;
        }
      }

      // Write file
      await writeFile(
        edit.file_path,
        newContent,
        branchName,
        `${edit.description}\n\nCo-Authored-By: CLARA Dev Agent <clara@lifelink-sync.com>`
      );

      filesChanged.push(edit.file_path);
      editSummaries.push(`✅ ${edit.file_path}: ${edit.description}`);
      console.log('Edit applied:', edit.file_path, `(${action})`);
    } catch (editError) {
      const msg = (editError as Error).message;
      console.error(`Edit failed for ${edit.file_path}:`, msg);
      editSummaries.push(`❌ ${edit.file_path}: ${msg.slice(0, 100)}`);
    }
  }

  // 4. Create PR (only if we changed at least one file)
  if (filesChanged.length === 0) {
    await supabase.from('dev_agent_log')
      .update({
        status: 'failed',
        error_message: 'No edits could be applied — search strings did not match current file content',
        branch_name: branchName,
        files_read: filesRead,
      })
      .eq('id', logId);

    const failedFiles = editSummaries.filter(s => s.startsWith('⚠️') || s.startsWith('❌')).map(s => s.split(':')[0]).join(', ');
    await sendWhatsApp(fromNumber,
      `⚠️ I couldn't apply the edits. ${failedFiles}\n\nTry being more specific: "Fix the [feature] in the [section] of the app" and I'll locate the right file.\n\nDetails:\n${editSummaries.join('\n')}`
    );
    return;
  }

  const prBody = `## Summary\n${plan.summary}\n\n## Changes\n${editSummaries.join('\n')}\n\n## Command\n> ${command}\n\n🤖 Generated by CLARA Dev Agent`;

  const pr = await createPR(branchName, plan.title, prBody);
  console.log('PR created:', pr.url);

  // 5. Update log
  await supabase.from('dev_agent_log')
    .update({
      status: 'completed',
      branch_name: branchName,
      pr_number: pr.number,
      pr_url: pr.url,
      files_read: filesRead,
      files_changed: filesChanged,
      diff_summary: editSummaries.join('\n'),
    })
    .eq('id', logId);

  // 6. Notify Lee
  const fileList = filesChanged.join(', ');
  await sendWhatsApp(fromNumber,
    `✅ Done — PR #${pr.number}: ${plan.title}\nFiles: ${fileList}\n${pr.url}\nLive ~2 mins after merge.`
  );
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse Twilio webhook (URL-encoded body)
    const rawText = await req.text();
    const params = new URLSearchParams(rawText);
    const fromNumber = params.get('From') ?? '';
    const messageBody = (params.get('Body') ?? '').trim();

    console.log('Dev agent received:', { fromNumber, bodyLength: messageBody.length });

    // ── HARD AUTH CHECK ──────────────────────────────
    const normalizedFrom = fromNumber.replace('whatsapp:', '').replace('+', '');
    const normalizedAdmin = adminNumber.replace('whatsapp:', '').replace('+', '');

    if (normalizedFrom !== normalizedAdmin) {
      console.log(`Rejected message from ${fromNumber} — not admin`);
      await supabase.from('security_audit_log').insert({
        event_type: 'dev_agent_rejected',
        metadata: { from: fromNumber, reason: 'not_admin' }
      });
      return new Response('', { status: 200 });
    }

    // ── MODE SWITCHING: /dev, /business, /status ─────
    const adminPhone = normalizedFrom;

    if (messageBody === '/dev') {
      await supabase.from('clara_admin_mode')
        .upsert({ admin_phone: adminPhone, current_mode: 'dev', mode_set_at: new Date().toISOString() }, { onConflict: 'admin_phone' });
      await sendWhatsApp(fromNumber, '🔧 DEV MODE ON\nAll messages treated as code/system commands.\nSend /business to return to normal mode.');
      return new Response('', { status: 200 });
    }

    if (messageBody === '/business' || messageBody === '/normal') {
      await supabase.from('clara_admin_mode')
        .upsert({ admin_phone: adminPhone, current_mode: 'business', mode_set_at: new Date().toISOString() }, { onConflict: 'admin_phone' });
      await sendWhatsApp(fromNumber, '💼 BUSINESS MODE ON\nBack to normal operations.\nSend /dev to switch to dev mode.');
      return new Response('', { status: 200 });
    }

    if (messageBody === '/status') {
      const { data: modeData } = await supabase
        .from('clara_admin_mode')
        .select('current_mode, mode_set_at')
        .eq('admin_phone', adminPhone)
        .maybeSingle();

      const { data: recentLogs } = await supabase
        .from('dev_agent_log')
        .select('command_text, status, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      const mode = modeData?.current_mode || 'business';
      const logs = recentLogs?.map((l: any) =>
        `• ${l.command_text.substring(0, 40)} — ${l.status}`
      ).join('\n') || 'No recent actions';

      await sendWhatsApp(fromNumber, `📊 CLARA STATUS\nMode: ${mode.toUpperCase()}\n\nLast 3 actions:\n${logs}`);
      return new Response('', { status: 200 });
    }

    // ── CHECK CURRENT MODE ─────────────────────────────
    const { data: adminMode } = await supabase
      .from('clara_admin_mode')
      .select('current_mode')
      .eq('admin_phone', adminPhone)
      .maybeSingle();

    const currentMode = adminMode?.current_mode || 'dev'; // default to dev for admin

    // If business mode — route to normal CLARA (not dev agent)
    if (currentMode === 'business') {
      try {
        const claraUrl = Deno.env.get('SUPABASE_URL') + '/functions/v1/whatsapp-inbound';
        // Remove admin routing flag to prevent infinite loop — call CLARA directly
        const claraBody = new URLSearchParams({
          From: fromNumber,
          Body: messageBody,
          MessageSid: params.get('MessageSid') ?? '',
          ProfileName: params.get('ProfileName') ?? '',
          _bypass_admin_route: '1',
        }).toString();

        await fetch(claraUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: claraBody,
        });
      } catch (e) {
        console.warn('Business mode CLARA forward failed:', e);
      }
      return new Response('', { status: 200 });
    }

    // ── DEV MODE: continue with dev agent logic ────────

    // ── RATE LIMIT: 20 commands per 24 hours ─────────
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('dev_agent_log')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo);

    if ((count ?? 0) >= 20) {
      await sendWhatsApp(fromNumber, "Daily limit reached (20 commands). Try again tomorrow.");
      return new Response('', { status: 200 });
    }

    // ── CHECK FOR PENDING SESSION ─────────────────────
    const { data: pendingSession } = await supabase
      .from('dev_agent_sessions')
      .select('*')
      .eq('status', 'awaiting_confirm')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (pendingSession) {
      const reply = messageBody?.toLowerCase();

      if (reply === 'yes' || reply === 'y') {
        // Confirmed — update session
        await supabase.from('dev_agent_sessions')
          .update({ status: 'confirmed' })
          .eq('id', pendingSession.id);

        await supabase.from('dev_agent_log')
          .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
          .eq('id', pendingSession.log_id);

        await sendWhatsApp(fromNumber,
          "On it 🛠️ I'll message you when the PR is ready. This usually takes 1-3 minutes."
        );

        // Execute the command via GitHub App
        try {
          await runClaudeCode(
            pendingSession.command_text,
            pendingSession.clara_intent,
            pendingSession.log_id,
            fromNumber
          );
        } catch (execError) {
          const errMsg = (execError as Error).message;
          console.error('Execution error:', errMsg);

          await supabase.from('dev_agent_log')
            .update({ status: 'failed', error_message: errMsg })
            .eq('id', pendingSession.log_id);

          const isGitHubMissing = errMsg.includes('GITHUB_APP_ID') ||
            errMsg.includes('token exchange') ||
            errMsg.includes('GitHub');

          await sendWhatsApp(fromNumber,
            isGitHubMissing
              ? "⚠️ GitHub App not configured yet. Add GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, GITHUB_INSTALLATION_ID secrets to Supabase to enable code execution."
              : `❌ Execution failed: ${errMsg.slice(0, 200)}`
          );
        }

      } else if (reply === 'no' || reply === 'cancel') {
        await supabase.from('dev_agent_sessions')
          .update({ status: 'cancelled' })
          .eq('id', pendingSession.id);
        await supabase.from('dev_agent_log')
          .update({ status: 'cancelled' })
          .eq('id', pendingSession.log_id);
        await sendWhatsApp(fromNumber, "Cancelled. What else can I help with?");

      } else {
        await sendWhatsApp(fromNumber,
          `You have a pending action: "${pendingSession.command_text}"\nReply YES to confirm or NO to cancel.`
        );
      }

      return new Response('', { status: 200 });
    }

    // ── QUERY MODE (read-only, no PR) ─────────────────
    const isQuery = /^(list|show|find|search|what files|what is in|where is|locate|read|cat|get)/i.test(messageBody.trim());

    if (isQuery) {
      // Detect find/search vs list/show
      const isFindQuery = /^(find|search|where is|locate)/i.test(messageBody.trim());

      if (isFindQuery) {
        // Recursive file search
        const termMatch = messageBody.match(/(?:find|search|where is|locate)\s+(.+)/i);
        const searchTerm = termMatch ? termMatch[1].trim() : messageBody;

        try {
          const found = await searchFiles(searchTerm, 'src');
          // Also search supabase/functions
          const funcFound = await searchFiles(searchTerm, 'supabase/functions');
          const allFound = [...found, ...funcFound];

          if (allFound.length === 0) {
            await sendWhatsApp(fromNumber, `🔍 No files matching "${searchTerm}" found in src/ or supabase/functions/`);
          } else {
            const display = allFound.length > 20
              ? allFound.slice(0, 20).join('\n') + `\n... and ${allFound.length - 20} more`
              : allFound.join('\n');
            await sendWhatsApp(fromNumber, `🔍 Files matching "${searchTerm}" (${allFound.length}):\n${display}`);
          }
        } catch (e) {
          await sendWhatsApp(fromNumber, `❌ Search failed: ${(e as Error).message}`);
        }
        return new Response('', { status: 200 });
      }

      // Directory listing
      const pathMatch = messageBody.match(/(src\/[\w\/\-\.]+|supabase\/[\w\/\-\.]+|public\/[\w\/\-\.]+)/i);
      const queryPath = pathMatch ? pathMatch[0].trim() : null;

      if (!queryPath) {
        await sendWhatsApp(fromNumber,
          `What path do you want to list? Try:\n• list src/components\n• list src/pages\n• find Pricing\n• search AuthPage`
        );
        return new Response('', { status: 200 });
      }

      try {
        const files = await listFiles(queryPath);
        if (files.length === 0) {
          await sendWhatsApp(fromNumber, `📁 ${queryPath} is empty or doesn't exist.`);
        } else {
          const display = files.length > 30
            ? files.slice(0, 30).join('\n') + `\n... and ${files.length - 30} more`
            : files.join('\n');
          await sendWhatsApp(fromNumber, `📁 ${queryPath}:\n${display}`);
        }
      } catch (e) {
        await sendWhatsApp(fromNumber, `❌ Could not read ${queryPath}: ${(e as Error).message}`);
      }
      return new Response('', { status: 200 });
    }

    // ── NEW COMMAND ───────────────────────────────────
    const { intent, description, risk_level, confirmation_question } =
      await interpretIntent(messageBody);

    // Create log entry
    const { data: logEntry } = await supabase
      .from('dev_agent_log')
      .insert({
        session_id: crypto.randomUUID(),
        command_text: messageBody,
        clara_intent: intent,
        status: 'pending_confirm',
      })
      .select()
      .single();

    // Create session
    await supabase.from('dev_agent_sessions').insert({
      command_text: messageBody,
      clara_intent: intent,
      status: 'awaiting_confirm',
      log_id: logEntry?.id,
    });

    // Send confirmation to Lee
    const riskEmoji = risk_level === 'high' ? '🔴' : risk_level === 'medium' ? '🟡' : '🟢';
    await sendWhatsApp(fromNumber,
      `${riskEmoji} ${confirmation_question}\n\nReply YES to proceed or NO to cancel.`
    );

    return new Response('', { status: 200 });

  } catch (error) {
    console.error('clara-dev-agent error:', error);
    return new Response('', { status: 200 });
  }
});
