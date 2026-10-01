const MAX_SOURCE_EXCERPT = 700;

export function normalizeUrl(value = '') {
  try {
    const url = new URL(String(value).trim());
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid)/i.test(key)) url.searchParams.delete(key);
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return String(value).trim();
  }
}

export function normalizeTitle(value = '') {
  return String(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLocaleLowerCase();
}

export function stripHtml(value = '') {
  return String(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function sourceSignal(item = {}) {
  return {
    title: stripHtml(item.title),
    url: normalizeUrl(item.url),
    author: stripHtml(item.author || ''),
    publishedAt: item.publishedAt || null,
    // A source is a signal, not a prompt-sized article. This hard limit is
    // intentionally enforced in the public implementation.
    excerpt: stripHtml(item.excerpt || '').slice(0, MAX_SOURCE_EXCERPT)
  };
}

export function parseRss(xml = '') {
  if (!/<(?:rss|feed|channel|item|entry)\b/i.test(xml)) throw new Error('Invalid RSS or Atom payload.');
  const nodes = xml.match(/<item\b[\s\S]*?<\/item>|<entry\b[\s\S]*?<\/entry>/gi) || [];
  if (!nodes.length) throw new Error('No RSS or Atom entries found.');
  return nodes.map((node) => {
    const tag = (name) => {
      const found = node.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'));
      return found ? found[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '') : '';
    };
    const link = tag('link') || node.match(/<link\b[^>]*href=["']([^"']+)/i)?.[1] || tag('guid');
    return sourceSignal({
      title: tag('title'),
      url: link,
      author: tag('author') || tag('dc:creator'),
      publishedAt: tag('pubDate') || tag('published') || tag('updated'),
      excerpt: tag('description') || tag('summary') || tag('content:encoded') || tag('content')
    });
  }).filter((item) => item.title && item.url);
}

export function deduplicate(items = [], seen = new Set()) {
  const titles = new Set();
  const output = [];
  for (const item of items) {
    const url = normalizeUrl(item.url);
    const title = normalizeTitle(item.title);
    if (!url || !title || seen.has(url) || titles.has(title)) continue;
    seen.add(url);
    titles.add(title);
    output.push({ ...item, url });
  }
  return output;
}
