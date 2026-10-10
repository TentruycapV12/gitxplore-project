/**
 * Nguồn tin cho mục NEWS.
 * Mỗi nguồn là 1 "adapter": fetch -> trả về mảng item chuẩn hoá:
 * { id, source, sourceLabel, kind, title, summary, url, image, author, date, meta }
 * kind: 'repo' | 'article' | 'social' | 'discussion'
 *
 * Muốn thêm nguồn mới: thêm 1 object vào SOURCES (hoặc 1 dòng vào EXTRA_FEEDS).
 */

// Thêm RSS tuỳ ý ở đây (blog, YouTube, và X / Instagram / TikTok / Facebook
// nếu bạn có RSSHub). Ví dụ:
//   { id: 'x-vercel', label: 'X · @vercel', kind: 'social',
//     url: 'https://YOUR-RSSHUB.example.com/twitter/user/vercel' },
export const EXTRA_FEEDS = [];

const DEFAULT_FEEDS = [
  { id: 'ghblog', label: 'GitHub Blog', kind: 'article', url: 'https://github.blog/open-source/feed/' },
  { id: 'opensourcecom', label: 'Opensource.com', kind: 'article', url: 'https://opensource.com/feed' },
  { id: 'itsfoss', label: "It's FOSS", kind: 'article', url: 'https://news.itsfoss.com/rss/' },
  { id: 'phoronix', label: 'Phoronix', kind: 'article', url: 'https://www.phoronix.com/rss.php' },
];

const TIMEOUT_MS = 10000;

const getJson = async (url, signal) => {
  const s = AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]);
  const res = await fetch(url, { signal: s, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const clip = (text = '', n = 220) => {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

const htmlToText = (html = '') => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

const isoDaysAgo = (d) => new Date(Date.now() - d * 864e5).toISOString().slice(0, 10);

/* ---------------- Adapters ---------------- */

const githubTrending = {
  id: 'github',
  label: 'GitHub',
  kind: 'repo',
  async fetch(signal) {
    const q = encodeURIComponent(`created:>${isoDaysAgo(7)} stars:>30`);
    const data = await getJson(
      `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=20`,
      signal
    );
    return data.items.map((r) => ({
      id: `github:${r.id}`,
      title: r.full_name,
      summary: clip(r.description || 'No description'),
      url: r.html_url,
      image: r.owner?.avatar_url,
      author: r.owner?.login,
      date: Date.parse(r.created_at),
      meta: `★ ${r.stargazers_count.toLocaleString()}${r.language ? ` · ${r.language}` : ''}`,
    }));
  },
};

const hackerNews = {
  id: 'hn',
  label: 'Hacker News',
  kind: 'discussion',
  async fetch(signal) {
    const data = await getJson(
      'https://hn.algolia.com/api/v1/search_by_date?query=open%20source&tags=story&numericFilters=points%3E5&hitsPerPage=25',
      signal
    );
    return data.hits
      .filter((h) => h.title)
      .map((h) => ({
        id: `hn:${h.objectID}`,
        title: h.title,
        summary: '',
        url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
        author: h.author,
        date: h.created_at_i * 1000,
        meta: `▲ ${h.points} · ${h.num_comments || 0} comments`,
      }));
  },
};

const reddit = {
  id: 'reddit',
  label: 'Reddit',
  kind: 'discussion',
  async fetch(signal) {
    const data = await getJson(
      'https://www.reddit.com/r/opensource+selfhosted+linux/top.json?t=day&limit=25&raw_json=1',
      signal
    );
    return data.data.children.map(({ data: d }) => ({
      id: `reddit:${d.id}`,
      title: d.title,
      summary: clip(d.selftext),
      url: `https://www.reddit.com${d.permalink}`,
      image: /^https?:/.test(d.thumbnail || '') ? d.thumbnail : undefined,
      author: `u/${d.author}`,
      date: d.created_utc * 1000,
      meta: `▲ ${d.score} · r/${d.subreddit}`,
    }));
  },
};

const devto = {
  id: 'devto',
  label: 'DEV',
  kind: 'article',
  async fetch(signal) {
    const data = await getJson('https://dev.to/api/articles?tag=opensource&per_page=25', signal);
    return data.map((a) => ({
      id: `devto:${a.id}`,
      title: a.title,
      summary: clip(a.description),
      url: a.url,
      image: a.cover_image || a.social_image,
      author: a.user?.name,
      date: Date.parse(a.published_at),
      meta: `♥ ${a.public_reactions_count}`,
    }));
  },
};

const mastodon = {
  id: 'mastodon',
  label: 'Mastodon',
  kind: 'social',
  async fetch(signal) {
    const data = await getJson('https://mastodon.social/api/v1/timelines/tag/opensource?limit=25', signal);
    return data
      .filter((p) => !p.reblog)
      .map((p) => {
        const text = htmlToText(p.content);
        return {
          id: `mastodon:${p.id}`,
          title: clip(text, 110) || 'Post',
          summary: text.length > 110 ? clip(text, 260) : '',
          url: p.url,
          image: p.media_attachments?.find((m) => m.type === 'image')?.preview_url,
          author: `@${p.account.acct}`,
          date: Date.parse(p.created_at),
          meta: `♥ ${p.favourites_count}`,
        };
      });
  },
};

/** Adapter RSS/Atom chung, đi qua rss2json (miễn phí, có CORS). */
const rssSource = ({ id, label, kind, url }) => ({
  id,
  label,
  kind,
  async fetch(signal) {
    const data = await getJson(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`, signal);
    if (data.status !== 'ok') throw new Error(data.message || 'RSS error');
    return data.items.slice(0, 15).map((it) => ({
      id: `${id}:${it.guid || it.link}`,
      title: it.title,
      summary: clip(htmlToText(it.description || it.content)),
      url: it.link,
      image: it.thumbnail || it.enclosure?.link || undefined,
      author: it.author || label,
      // rss2json trả "YYYY-MM-DD HH:mm:ss" theo UTC
      date: Date.parse(`${(it.pubDate || '').replace(' ', 'T')}Z`) || Date.now(),
      meta: '',
    }));
  },
});

export const SOURCES = [
  githubTrending,
  hackerNews,
  reddit,
  devto,
  mastodon,
  ...[...DEFAULT_FEEDS, ...EXTRA_FEEDS].map(rssSource),
];

export const KINDS = [
  { id: 'all', label: 'All' },
  { id: 'repo', label: 'Repositories' },
  { id: 'article', label: 'Articles' },
  { id: 'discussion', label: 'Discussions' },
  { id: 'social', label: 'Social' },
];

/* ---------------- Aggregator ---------------- */

const normUrl = (u = '') => {
  try {
    const x = new URL(u);
    return `${x.hostname.replace(/^www\./, '')}${x.pathname.replace(/\/$/, '')}`.toLowerCase();
  } catch {
    return u;
  }
};

export async function fetchAllNews(signal) {
  const results = await Promise.allSettled(SOURCES.map((s) => s.fetch(signal)));
  const errors = {};
  const all = [];

  results.forEach((r, i) => {
    const s = SOURCES[i];
    if (r.status === 'fulfilled') {
      r.value.forEach((it) => all.push({ ...it, source: s.id, sourceLabel: s.label, kind: s.kind }));
    } else {
      errors[s.id] = r.reason?.message || 'failed';
    }
  });

  const seen = new Set();
  const items = all
    .filter((it) => it.title && it.url && Number.isFinite(it.date))
    .filter((it) => {
      const key = normUrl(it.url);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.date - a.date);

  return { items, errors };
}