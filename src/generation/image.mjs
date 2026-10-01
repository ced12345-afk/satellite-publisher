import { requestWithRetry } from './openai.mjs';

export async function generateImage({ prompt, fetchImpl = fetch, env = process.env }) {
  if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required for image generation.');
  return requestWithRetry(async () => {
    const response = await fetchImpl('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: env.OPENAI_IMAGE_MODEL || 'gpt-image-2',
        prompt,
        n: 1,
        size: '1536x1024',
        quality: 'auto',
        output_format: 'webp',
        background: 'opaque'
      })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error?.message || `OpenAI Images API returned ${response.status}`);
    if (!body.data?.[0]?.b64_json) throw new Error('OpenAI Images API returned no usable image.');
    return body.data[0].b64_json;
  });
}
