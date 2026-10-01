import { ORIGINALITY_INSTRUCTION } from '../editorial/planner.mjs';

export function responsesPayload({ model = 'gpt-5.6-terra', brief }) {
  return {
    model,
    input: [
      { role: 'system', content: 'You are an editorial planner. Prioritise factual precision, reader value and independent writing.' },
      { role: 'user', content: `${ORIGINALITY_INSTRUCTION}\n\nTopic signal only:\n${JSON.stringify(brief.source)}\n\nReturn JSON with title, description and content sections.` }
    ],
    reasoning: { effort: 'medium' },
    text: { format: { type: 'json_object' }, verbosity: 'medium' },
    max_output_tokens: 4000
  };
}

export async function requestWithRetry(request, { retries = 3, delayMs = 50, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try { return await request(); } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(delayMs * attempt);
    }
  }
  throw lastError;
}

export async function generateArticle({ brief, fetchImpl = fetch, env = process.env }) {
  if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required for live model generation. Use the demo draft otherwise.');
  const response = await requestWithRetry(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);
    try {
      const result = await fetchImpl('https://api.openai.com/v1/responses', {
        method: 'POST', signal: controller.signal,
        headers: { 'content-type': 'application/json', authorization: `Bearer ${env.OPENAI_API_KEY}` },
        body: JSON.stringify(responsesPayload({ model: env.OPENAI_MODEL || 'gpt-5.6-terra', brief }))
      });
      if (!result.ok) throw new Error(`OpenAI Responses API returned ${result.status}`);
      return result.json();
    } finally { clearTimeout(timeout); }
  });
  return response.output_text || '';
}
