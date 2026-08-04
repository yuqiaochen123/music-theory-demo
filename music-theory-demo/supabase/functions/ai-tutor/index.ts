import {
  buildOpenAIRequest,
  createRateLimiter,
  extractTutorResult,
  formatSafetyIdentifier,
  validateTutorRequest,
} from './tutor-core.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const limiter = createRateLimiter({ limit: 12, windowMs: 60_000 });

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

function publishableKey() {
  const modern = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');
  if (modern) {
    try {
      const keys = JSON.parse(modern);
      if (typeof keys.default === 'string') return keys.default;
    } catch {
      // Fall through to the legacy key for local and older hosted projects.
    }
  }
  return Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY');
}

async function authenticatedUserId(request: Request) {
  const authorization = request.headers.get('Authorization');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const apiKey = publishableKey();
  if (!authorization?.startsWith('Bearer ') || !supabaseUrl || !apiKey) return null;

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: authorization, apikey: apiKey },
    signal: AbortSignal.timeout(4_000),
  });
  if (!response.ok) return null;
  const user = await response.json();
  return typeof user?.id === 'string' && user.id ? user.id : null;
}

async function safetyIdentifier(userId: string) {
  const data = new TextEncoder().encode(`listening-desk:${userId}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const hexDigest = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return formatSafetyIdentifier(hexDigest);
}

async function handler(request: Request) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const userId = await authenticatedUserId(request);
    if (!userId) return json({ error: 'Authentication required' }, 401);
    if (!limiter.allow(userId)) return json({ error: 'Please wait before requesting another explanation' }, 429);

    const input = validateTutorRequest(await request.json());
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) return json({ error: 'Tutor is unavailable' }, 503);

    const body = buildOpenAIRequest(input, {
      model: Deno.env.get('OPENAI_TUTOR_MODEL') ?? 'gpt-5.6-terra',
      safetyIdentifier: await safetyIdentifier(userId),
    });
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(9_000),
    });
    if (!response.ok) return json({ error: 'Tutor is unavailable' }, 502);

    return json(extractTutorResult(await response.json()));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (error instanceof SyntaxError || /Invalid|Unexpected/.test(message)) {
      return json({ error: 'Invalid tutor request' }, 400);
    }
    return json({ error: 'Tutor is unavailable' }, 503);
  }
}

export default { fetch: handler };
