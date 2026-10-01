import { sourceSignal } from '../discovery/rss.mjs';

export const ORIGINALITY_INSTRUCTION = 'Do not reproduce source wording or structure. Generate an independent original article based on the topic and verified facts.';

export function scoreTopic(signal, keywords = []) {
  const text = `${signal.title} ${signal.excerpt}`.toLocaleLowerCase();
  const matchedTerms = keywords.filter((term) => text.includes(String(term).toLocaleLowerCase()));
  return { score: Math.min(10, 3 + matchedTerms.length * 2), matchedTerms };
}

export function createEditorialBrief(item, site) {
  const source = sourceSignal(item);
  const topic = scoreTopic(source, site.topicKeywords || []);
  return {
    status: 'candidate',
    sourcePolicy: 'Public RSS feeds are topic-discovery signals only. Source wording and structure must not be reproduced.',
    source,
    destination: { id: site.id, name: site.name, contentProfile: site.contentProfile },
    topic,
    modelInstruction: ORIGINALITY_INSTRUCTION,
    humanApprovalRequired: true
  };
}

export function demoDraft(brief) {
  return {
    status: 'needs_review',
    title: `A practical framework for ${brief.source.title.toLocaleLowerCase()}`,
    description: 'Demonstration draft. A human editor must approve it before publication.',
    sourcePolicy: brief.sourcePolicy,
    modelInstruction: brief.modelInstruction,
    source: brief.source,
    content: [
      { heading: 'Define the editorial decision', body: 'Use the source only to identify a topic. Build the article around an independent reader problem and verified facts.' },
      { heading: 'Add a review gate', body: 'Keep a review record before any remote publication is enabled.' }
    ]
  };
}
