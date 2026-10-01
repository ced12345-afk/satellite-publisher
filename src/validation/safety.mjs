function words(text = '') { return String(text).toLocaleLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || []; }

export function similarityRatio(source = '', generated = '') {
  const left = new Set(words(source));
  const right = new Set(words(generated));
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const word of left) if (right.has(word)) shared += 1;
  return shared / Math.min(left.size, right.size);
}

export function validateDraft({ draft = {}, source = {}, threshold = 0.55 }) {
  const text = [draft.title, draft.description, ...(draft.content || []).flatMap((part) => [part.heading, part.body])].filter(Boolean).join(' ');
  if (!text.trim()) return { status: 'needs_review', approved: false, reasons: ['Article is empty.'] };
  const ratio = similarityRatio(source.excerpt || '', text);
  if (ratio > threshold) return { status: 'needs_review', approved: false, similarity: ratio, reasons: ['Generated content is too close to the source signal.'] };
  return { status: 'needs_review', approved: false, similarity: ratio, reasons: ['Human approval is required before remote publication.'] };
}
