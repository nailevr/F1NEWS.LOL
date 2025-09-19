import 'dotenv/config';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { DateTime } from 'luxon';
import { parseISO, isAfter, subDays } from 'date-fns';
import fs from 'fs';
import { OpenAI } from 'openai';

const USER_AGENT = 'USCIS-Weekly-News-Summarizer/1.0 (+contact: your-email@example.com)';
const SITES = [
  'https://www.uscis.gov/newsroom/news-releases',
  'https://www.uscis.gov/newsroom/alerts'
];

// Helpers
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchHTML(url) {
  const res = await axios.get(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html,application/xhtml+xml' },
    timeout: 20000
  });
  return res.data;
}

function tryParseDate($, url, html) {
  // 1) <time datetime="..."> or <time>Month DD, YYYY</time>
  let iso = $('time[datetime]').attr('datetime');
  if (iso) {
    try { return parseISO(iso); } catch {}
  }
  const timeText = $('time').first().text()?.trim();
  if (timeText) {
    const dt = DateTime.fromFormat(timeText, 'LLLL d, yyyy', { zone: 'America/New_York' });
    if (dt.isValid) return dt.toJSDate();
  }

  // 2) OpenGraph / meta
  const og = $('meta[property="article:published_time"]').attr('content') ||
             $('meta[name="pubdate"]').attr('content') ||
             $('meta[name="publication_date"]').attr('content');
  if (og) {
    try { return parseISO(og); } catch {}
  }

  // 3) Regex scan for Month DD, YYYY
  const match = html.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/);
  if (match) {
    const dt = DateTime.fromFormat(match[0], 'LLLL d, yyyy', { zone: 'America/New_York' });
    if (dt.isValid) return dt.toJSDate();
  }

  // 4) Fallback: null
  return null;
}

function normalizeUrl(href) {
  if (!href) return null;
  if (href.startsWith('http')) return href;
  if (href.startsWith('/')) return `https://www.uscis.gov${href}`;
  return null;
}

async function extractListingLinks(listingUrl) {
  const html = await fetchHTML(listingUrl);
  const $ = cheerio.load(html);
  const links = new Set();

  // Heuristic: collect links under newsroom paths
  $('a[href]').each((_, a) => {
    const href = $(a).attr('href');
    const url = normalizeUrl(href);
    if (url && /https:\/\/www\.uscis\.gov\/newsroom\/.+/.test(url)) {
      links.add(url);
    }
  });

  // Some listings might include pagination or extra nav; we dedupe later
  return Array.from(links);
}

async function extractArticle(url) {
  try {
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('h1').first().text().trim() ||
      $('title').text().trim();

    const date = tryParseDate($, url, html);

    // Canonical URL
    const canonical = $('link[rel="canonical"]').attr('href') || url;

    // Minimal sanity checks
    if (!title) return null;

    return { title, date, url: canonical };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to parse', url, e.message);
    return null;
  }
}

function withinLast7Days(d) {
  if (!d) return false;
  const cutoff = subDays(new Date(), 7);
  return isAfter(d, cutoff);
}

async function getRecentNews() {
  const itemUrls = new Set();

  for (const site of SITES) {
    try {
      const links = await extractListingLinks(site);
      links.forEach(l => itemUrls.add(l));
      await sleep(600 + Math.floor(Math.random() * 300));
    } catch (e) {
      console.error('Listing error:', site, e.message);
    }
  }

  const items = [];
  for (const url of itemUrls) {
    const article = await extractArticle(url);
    if (article && withinLast7Days(article.date)) {
      items.push(article);
    }
    await sleep(600 + Math.floor(Math.random() * 300));
  }

  // Sort newest first
  items.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
  return items;
}

function toMarkdown(items) {
  const fmt = (d) => DateTime.fromJSDate(d).setZone('America/New_York').toFormat('yyyy-LL-dd');
  const lines = [];
  lines.push(`# USCIS News – Past 7 Days\n`);
  const now = DateTime.now().setZone('America/New_York').toFormat('yyyy-LL-dd HH:mm z');
  lines.push(`_Generated on ${now}_\n`);
  if (!items.length) {
    lines.push('No newsroom items detected in the past 7 days.');
    return lines.join('\n');
  }
  for (const it of items) {
    lines.push(`- **${fmt(it.date)}** — [${it.title}](${it.url})`);
  }
  return lines.join('\n');
}

async function summarizeWithOpenAI(items) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('No OPENAI_API_KEY found; skipping model summary.');
    return null;
  }
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const bullets = items.map(it => {
    const d = DateTime.fromJSDate(it.date).setZone('America/New_York').toFormat('yyyy-LL-dd');
    return `${d} | ${it.title} | ${it.url}`;
    }).join('\n');

  const system = `You are a concise policy news analyst. Output clear, factual summaries.`;
  const user = `
Summarize these USCIS newsroom items from the past 7 days.

For each item, output:
- Date – short headline – one-sentence takeaway – link

Then add a short "What changed this week" (2–3 sentences).

Items:
${bullets}
`;

  // Using Chat Completions API for stability
  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ]
  });

  const text = resp.choices[0]?.message?.content?.trim() || '';
  return text;
}

async function main() {
  try {
    const items = await getRecentNews();
    const md = toMarkdown(items);
    const summary = await summarizeWithOpenAI(items);

    const finalMd = [
      md,
      '',
      summary ? '## Summary' : '',
      summary || ''
    ].join('\n');

    fs.writeFileSync('uscis_news_summary.md', finalMd, 'utf-8');
    console.log(finalMd);
  } catch (e) {
    console.error('Fatal error:', e);
    process.exit(1);
  }
}

main();

