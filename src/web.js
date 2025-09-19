import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { DateTime } from 'luxon';
import { parseISO, isAfter, subDays, isEqual } from 'date-fns';
import fs from 'fs';
import { OpenAI } from 'openai';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(process.cwd(), 'uscis_news_data.json');

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Data persistence functions
function loadSavedNews() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading saved news:', error);
  }
  return { articles: [], lastScraped: null, summaries: {} };
}

function saveNews(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log(`Saved ${data.articles.length} articles to ${DATA_FILE}`);
  } catch (error) {
    console.error('Error saving news:', error);
  }
}

function addNewArticles(existingArticles, newArticles) {
  const existingUrls = new Set(existingArticles.map(a => a.url));
  const trulyNew = newArticles.filter(article => !existingUrls.has(article.url));
  
  // Combine and sort by date (newest first)
  const allArticles = [...existingArticles, ...trulyNew];
  allArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return { newCount: trulyNew.length, allArticles };
}

const USER_AGENT = 'USCIS-Weekly-News-Summarizer/1.0 (+contact: your-email@example.com)';
const SITES = [
  'https://www.uscis.gov/newsroom/news-releases',
  'https://www.uscis.gov/newsroom/alerts',
  'https://www.uscis.gov/newsroom/news-releases?page=1',
  'https://www.uscis.gov/newsroom/news-releases?page=2',
  'https://www.uscis.gov/newsroom/news-releases?page=3',
  'https://www.uscis.gov/newsroom/news-releases?page=4',
  'https://www.uscis.gov/newsroom/news-releases?page=5',
  'https://www.uscis.gov/newsroom/alerts?page=1',
  'https://www.uscis.gov/newsroom/alerts?page=2',
  'https://www.uscis.gov/newsroom/alerts?page=3'
];

// Country detection and flag mapping
const COUNTRY_FLAGS = {
  'China': '🇨🇳',
  'India': '🇮🇳', 
  'Mexico': '🇲🇽',
  'Philippines': '🇵🇭',
  'Vietnam': '🇻🇳',
  'Brazil': '🇧🇷',
  'Canada': '🇨🇦',
  'Japan': '🇯🇵',
  'South Korea': '🇰🇷',
  'Taiwan': '🇹🇼',
  'Thailand': '🇹🇭',
  'Germany': '🇩🇪',
  'France': '🇫🇷',
  'Italy': '🇮🇹',
  'Spain': '🇪🇸',
  'United Kingdom': '🇬🇧',
  'Nigeria': '🇳🇬',
  'Egypt': '🇪🇬',
  'Ethiopia': '🇪🇹',
  'Kenya': '🇰🇪',
  'Ghana': '🇬🇭',
  'Russia': '🇷🇺',
  'Ukraine': '🇺🇦',
  'Poland': '🇵🇱',
  'Romania': '🇷🇴',
  'Bulgaria': '🇧🇬',
  'Turkey': '🇹🇷',
  'Iran': '🇮🇷',
  'Iraq': '🇮🇶',
  'Afghanistan': '🇦🇫',
  'Pakistan': '🇵🇰',
  'Bangladesh': '🇧🇩',
  'Sri Lanka': '🇱🇰',
  'Nepal': '🇳🇵',
  'Myanmar': '🇲🇲',
  'Cambodia': '🇰🇭',
  'Laos': '🇱🇦',
  'Malaysia': '🇲🇾',
  'Singapore': '🇸🇬',
  'Indonesia': '🇮🇩',
  'Australia': '🇦🇺',
  'New Zealand': '🇳🇿',
  'South Africa': '🇿🇦',
  'Morocco': '🇲🇦',
  'Tunisia': '🇹🇳',
  'Algeria': '🇩🇿',
  'Libya': '🇱🇾',
  'Sudan': '🇸🇩',
  'Eritrea': '🇪🇷',
  'Somalia': '🇸🇴',
  'Yemen': '🇾🇪',
  'Saudi Arabia': '🇸🇦',
  'United Arab Emirates': '🇦🇪',
  'Jordan': '🇯🇴',
  'Lebanon': '🇱🇧',
  'Syria': '🇸🇾',
  'Israel': '🇮🇱',
  'Palestine': '🇵🇸',
  'Colombia': '🇨🇴',
  'Venezuela': '🇻🇪',
  'Peru': '🇵🇪',
  'Ecuador': '🇪🇨',
  'Bolivia': '🇧🇴',
  'Chile': '🇨🇱',
  'Argentina': '🇦🇷',
  'Uruguay': '🇺🇾',
  'Paraguay': '🇵🇾',
  'Guyana': '🇬🇾',
  'Suriname': '🇸🇷',
  'French Guiana': '🇬🇫',
  'Cuba': '🇨🇺',
  'Haiti': '🇭🇹',
  'Dominican Republic': '🇩🇴',
  'Jamaica': '🇯🇲',
  'Trinidad and Tobago': '🇹🇹',
  'Barbados': '🇧🇧',
  'Grenada': '🇬🇩',
  'Saint Lucia': '🇱🇨',
  'Saint Vincent and the Grenadines': '🇻🇨',
  'Antigua and Barbuda': '🇦🇬',
  'Saint Kitts and Nevis': '🇰🇳',
  'Dominica': '🇩🇲',
  'Belize': '🇧🇿',
  'Guatemala': '🇬🇹',
  'Honduras': '🇭🇳',
  'El Salvador': '🇸🇻',
  'Nicaragua': '🇳🇮',
  'Costa Rica': '🇨🇷',
  'Panama': '🇵🇦'
};

function detectCountries(text) {
  const countries = [];
  const countryNames = Object.keys(COUNTRY_FLAGS);
  
  for (const country of countryNames) {
    if (text.toLowerCase().includes(country.toLowerCase())) {
      countries.push(country);
    }
  }
  
  return countries;
}

function analyzeSentimentForInternationalStudents(text) {
  const lowerText = text.toLowerCase();
  
  // Good news keywords for F1 visa process (easier to get F1 visa)
  const positiveKeywords = [
    // F1 visa process improvements
    'streamlined f1', 'expedited f1', 'faster f1 processing', 'simplified f1', 'easier f1',
    'f1 extension', 'extended f1', 'additional f1 time', 'more f1 opportunities',
    'improved f1', 'enhanced f1', 'better f1', 'f1 support', 'f1 assistance',
    'flexible f1', 'f1 accommodation', 'f1 benefit', 'f1 advantage',
    'f1 success', 'f1 approval', 'approved f1', 'granted f1', 'permitted f1',
    'f1 reform', 'f1 modernization', 'f1 update', 'f1 advancement',
    
    // General process improvements that make F1 easier
    'streamlined processing', 'expedited processing', 'faster processing', 'simplified process',
    'reduced wait time', 'shorter processing time', 'improved efficiency',
    'digital processing', 'online application', 'electronic filing',
    'more flexible', 'less restrictive', 'easier requirements', 'simplified requirements',
    'additional options', 'more opportunities', 'expanded eligibility',
    'fee reduction', 'lower fees', 'reduced costs', 'cost savings',
    'extension', 'extend', 'expanded', 'increase', 'improve', 'enhance', 'streamline',
    'faster', 'quicker', 'reduced', 'lower', 'affordable', 'accessible', 'support',
    'benefit', 'opportunity', 'flexible', 'accommodate', 'facilitate', 'enable',
    'new policy', 'updated guidelines', 'modernize', 'simplify', 'ease', 'relief',
    'positive', 'favorable', 'welcoming', 'inclusive', 'progressive', 'reform',
    'student-friendly', 'immigration-friendly', 'work authorization', 'opt extension',
    'stem', 'cap increase', 'processing time', 'efficient', 'digital', 'online'
  ];
  
  // Bad news keywords for F1 visa process (harder to get F1 visa)
  const negativeKeywords = [
    // F1 visa process difficulties
    'f1 restriction', 'limited f1', 'reduced f1', 'cut f1', 'slash f1',
    'f1 denial', 'denied f1', 'rejected f1', 'refused f1', 'suspended f1',
    'f1 delay', 'delayed f1', 'postponed f1', 'f1 backlog', 'f1 waiting',
    'difficult f1', 'harder f1', 'complex f1', 'complicated f1', 'f1 burden',
    'f1 fee increase', 'higher f1 cost', 'expensive f1', 'costly f1',
    'stricter f1', 'f1 requirement', 'mandatory f1', 'f1 must', 'required f1',
    
    // General process difficulties that make F1 harder
    'restriction', 'limit', 'cap', 'reduce', 'decrease', 'tighten', 'stricter',
    'deny', 'reject', 'ban', 'prohibit', 'suspend', 'terminate', 'cancel',
    'difficult', 'harder', 'complex', 'burdensome', 'expensive', 'costly',
    'delay', 'backlog', 'wait', 'uncertainty', 'risk', 'threat', 'concern',
    'challenge', 'obstacle', 'barrier', 'hurdle', 'complication', 'problem',
    'crackdown', 'enforcement', 'penalty', 'fine', 'violation', 'fraud',
    'investigation', 'arrest', 'conviction', 'criminal', 'illegal', 'unauthorized',
    'deportation', 'removal', 'detention', 'custody', 'arrest', 'charge',
    'additional documentation', 'more paperwork', 'extensive review',
    'longer processing', 'extended wait', 'increased scrutiny',
    'fee increase', 'higher cost', 'additional fees', 'mandatory fees'
  ];
  
  // Count positive and negative keywords
  let positiveScore = 0;
  let negativeScore = 0;
  
  positiveKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      positiveScore++;
    }
  });
  
  negativeKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      negativeScore++;
    }
  });
  
  // Determine sentiment
  if (positiveScore > negativeScore && positiveScore > 0) {
    return 'positive';
  } else if (negativeScore > positiveScore && negativeScore > 0) {
    return 'negative';
  } else {
    return 'neutral';
  }
}

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

    // Keep all articles for historical data - filtering happens in frontend

    // Detect countries mentioned in the article
    const fullText = title + ' ' + $('body').text();
    const countries = detectCountries(fullText);
    
    // Analyze sentiment for international students
    const sentiment = analyzeSentimentForInternationalStudents(fullText);

    // Minimal sanity checks
    if (!title) return null;

    return { title, date, url: canonical, countries, sentiment };
  } catch (e) {
    console.error('Failed to parse', url, e.message);
    return null;
  }
}

function sinceTrumpElection(d) {
  if (!d) return false;
  // Start from Trump's election: January 20, 2025
  const trumpElectionDate = new Date('2025-01-20');
  return isAfter(d, trumpElectionDate) || isEqual(d, trumpElectionDate);
}

function isF1Relevant(article) {
  if (!article || !article.title) return false;
  
  const text = (article.title + ' ' + (article.summary || '')).toLowerCase();
  
  // F1 and student visa keywords
  const f1Keywords = [
    'f1', 'f-1', 'student visa', 'student', 'international student',
    'opt', 'optional practical training', 'stem opt', 'curricular practical training', 'cpt',
    'sevis', 'i-20', 'ds-2019', 'j-1', 'j1', 'exchange visitor',
    'h-1b', 'h1b', 'h-1b cap', 'work visa', 'employment authorization',
    'naturalization', 'citizenship', 'green card', 'permanent resident',
    'immigration', 'visa', 'border', 'asylum', 'refugee',
    'uscis', 'department of homeland security', 'dhs',
    'fee', 'processing time', 'policy', 'regulation', 'guidance'
  ];
  
  // Check if article contains F1-relevant keywords
  return f1Keywords.some(keyword => text.includes(keyword));
}

async function getRecentNews() {
  console.log('🔍 Starting to scrape news...');
  const itemUrls = new Set();

  for (const site of SITES) {
    try {
      console.log(`📋 Extracting links from: ${site}`);
      const links = await extractListingLinks(site);
      console.log(`✅ Found ${links.length} links from ${site}`);
      links.forEach(l => itemUrls.add(l));
      await sleep(100); // Reduced delay
    } catch (e) {
      console.error('❌ Listing error:', site, e.message);
    }
  }

  console.log(`📝 Total unique URLs found: ${itemUrls.size}`);
  const items = [];
  
  // Process URLs in batches of 10 for faster processing
  const urlsArray = Array.from(itemUrls);
  const batchSize = 10;
  
  for (let i = 0; i < urlsArray.length; i += batchSize) {
    const batch = urlsArray.slice(i, i + batchSize);
    console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(urlsArray.length/batchSize)} (${batch.length} articles)`);
    
    // Process batch in parallel
    const batchPromises = batch.map(async (url) => {
      try {
        const article = await extractArticle(url);
        if (article && sinceTrumpElection(article.date) && isF1Relevant(article)) {
          return article;
        }
        return null;
      } catch (e) {
        console.error('❌ Article error:', url, e.message);
        return null;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    const validArticles = batchResults.filter(article => article !== null);
    items.push(...validArticles);
    
    console.log(`✅ Batch complete: ${validArticles.length} valid articles added`);
    
    // Small delay between batches to be respectful
    if (i + batchSize < urlsArray.length) {
      await sleep(200);
    }
  }

  console.log(`🎯 Final result: ${items.length} articles since Trump election (Jan 20, 2025)`);
  // Sort newest first
  items.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
  return items;
}

async function summarizeWithOpenAI(items, existingSummaries = {}) {
  if (!process.env.OPENAI_API_KEY) {
    return existingSummaries;
  }
  
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  // Only summarize new items that don't already have summaries
  const newItems = items.filter(item => !existingSummaries[item.url]);
  
  if (newItems.length === 0) {
    return existingSummaries;
  }

  const bullets = newItems.map(it => {
    const d = DateTime.fromJSDate(it.date).setZone('America/New_York').toFormat('yyyy-LL-dd');
    return `${d} | ${it.title} | ${it.url}`;
    }).join('\n');

  const system = `You are a USCIS policy analyst specializing in F1 student visa implications. Format summaries for international students.`;
  const user = `
Analyze these NEW USCIS newsroom items for F1 students.

For each item, output EXACTLY in this format:
📅 [Date] | [Title] | [URL]
📝 Summary - 1 sentence.
🔍 What happened and how it ended - 1 sentence.
🎓 Potential causes for F1 students - 1 sentence.

Choose appropriate emoji (📅📝🔍🎓) based on content type.

Items:
${bullets}
`;

  try {
    const resp = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    });

    const text = resp.choices[0]?.message?.content?.trim() || '';
    
    // Parse individual summaries and add to existing ones
    const newSummaries = { ...existingSummaries };
    const lines = text.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      // Try to match URL from the line
      const urlMatch = line.match(/https:\/\/www\.uscis\.gov\/[^\s)]+/);
      if (urlMatch) {
        newSummaries[urlMatch[0]] = line;
      }
    });
    
    return newSummaries;
  } catch (e) {
    console.error('OpenAI error:', e.message);
    return existingSummaries;
  }
}

// Routes
app.get('/', (req, res) => {
  const savedData = loadSavedNews();
  const articlesJson = JSON.stringify(savedData.articles || []);
  const summariesJson = JSON.stringify(savedData.summaries || {});
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>USCIS Weekly News Summarizer</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        body {
            font-family: 'Press Start 2P', monospace;
            background: #000000;
            color: #ffffff;
            min-height: 100vh;
            padding: 20px;
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            position: relative;
        }
        
        .timeline {
            position: relative;
            margin: 40px 0;
        }
        
        .timeline-line {
            position: absolute;
            left: 200px;
            top: 0;
            bottom: 0;
            width: 4px;
            background: #ffffff;
        }
        
        .timeline-line-right {
            position: absolute;
            right: 200px;
            top: 0;
            bottom: 0;
            width: 4px;
            background: #ffffff;
        }
        
        .timeline-item {
            position: relative;
            display: flex;
            align-items: center;
            border-bottom: 1px dashed #ffffff;
            padding-bottom: 40px;
            padding-top: 20px;
            z-index: 1;
            /* Margin is set dynamically by JavaScript based on time differences */
        }
        
        .timeline-item:last-child {
            border-bottom: none;
        }
        
        .timeline-dot {
            position: absolute;
            left: 200px;
            width: 16px;
            height: 16px;
            background: #ffffff;
            border: 3px solid #000000;
            border-radius: 50%;
            transform: translateX(-50%);
            z-index: 10;
        }
        
        .timeline-date {
            position: absolute;
            left: 80px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 0.7rem;
            color: #ffffff !important;
            line-height: 1.4;
            font-weight: bold;
            z-index: 20;
            background: rgba(0, 0, 0, 0.8);
            padding: 5px 10px;
            border-radius: 4px;
            white-space: nowrap;
        }
        
        .timeline-content {
            position: absolute;
            left: 220px;
            right: 260px;
            padding-left: 20px;
            z-index: 0;
        }
        
        .timeline-rectangle {
            background: #000000;
            padding: 25px;
            position: relative;
        }
        
        .timeline-clickable {
            text-decoration: none;
            display: block;
            transition: background-color 0.3s ease;
        }
        
        .timeline-clickable:hover {
            background-color: #333333;
        }
        
        .timeline-flags {
            position: absolute;
            right: 100px;
            top: 50%;
            transform: translateY(-50%);
            background: transparent;
            padding: 2px 5px;
            font-size: 0.5rem;
            display: flex;
            gap: 3px;
            align-items: center;
            color: #ffffff;
            z-index: 10;
            white-space: nowrap;
        }
        
        .timeline-title {
            font-size: 0.7rem;
            margin-bottom: 10px;
            line-height: 1.4;
            color: #ffffff;
            font-weight: bold;
        }
        
        .timeline-summary {
            font-size: 0.6rem;
            line-height: 1.3;
            color: #cccccc;
            margin-top: 5px;
            white-space: pre-line;
        }
        
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            border: 3px solid #ffffff;
            background: #000000;
            padding: 20px;
        }
        
        .header h1 {
            font-size: 1.8rem;
            margin-bottom: 15px;
            color: #ffffff;
            letter-spacing: 2px;
        }
        
        .header p {
            font-size: 0.8rem;
            color: #ffffff;
            line-height: 1.8;
        }
        
        .controls {
            display: flex;
            gap: 20px;
            justify-content: center;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        
        .btn {
            background: linear-gradient(45deg, #00ff88, #00d4ff);
            color: #000;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 255, 136, 0.4);
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .status {
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .loading {
            display: none;
            text-align: center;
            margin: 20px 0;
        }
        
        .spinner {
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid #00ff88;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .results {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 30px;
            margin-top: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
        }
        
        .article {
            background: #001100;
            border: 3px solid #00ff00;
            padding: 20px;
            margin-bottom: 15px;
            box-shadow: 0 0 8px #00ff00;
            transition: all 0.3s ease;
            image-rendering: pixelated;
        }
        
        .article:hover {
            background: #002200;
            transform: translateX(5px);
            box-shadow: 0 0 15px #00ff00;
        }
        
        .article-date {
            color: #88ff88;
            font-family: 'Press Start 2P', monospace;
            font-size: 0.6rem;
            margin-bottom: 12px;
            text-shadow: 1px 1px 0px #008800;
        }
        
        .article-title {
            font-family: 'Press Start 2P', monospace;
            font-size: 0.8rem;
            margin-bottom: 15px;
            line-height: 1.6;
            color: #00ff00;
            text-shadow: 1px 1px 0px #008800;
        }
        
        .article-link {
            color: #88ff88;
            text-decoration: none;
            font-family: 'Press Start 2P', monospace;
            font-size: 0.6rem;
            border: 2px solid #88ff88;
            padding: 8px 12px;
            background: #000000;
            box-shadow: 0 0 5px #88ff88;
        }
        
        .article-link:hover {
            background: #88ff88;
            color: #000000;
            box-shadow: 0 0 10px #88ff88;
        }
        
        .summary {
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid #00ff88;
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
        }
        
        .summary h3 {
            color: #00ff88;
            margin-bottom: 15px;
        }
        
        .no-news {
            text-align: center;
            padding: 40px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            border: 2px dashed rgba(255, 255, 255, 0.3);
        }
        
        .no-news-icon {
            font-size: 3rem;
            margin-bottom: 20px;
            opacity: 0.6;
        }
        
        .error {
            background: rgba(255, 0, 0, 0.1);
            border: 1px solid #ff4444;
            color: #ffaaaa;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
        }
        
        .footer-note {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 20px;
            margin-top: 30px;
            text-align: center;
            font-style: italic;
            opacity: 0.8;
        }
        
        .country-filter {
            background: #000000;
            border: 3px solid #ffffff;
            padding: 20px;
            margin-bottom: 20px;
            text-align: center;
        }
        
        #country-select {
            background: #000000;
            color: #ffffff;
            border: 3px solid #ffffff;
            padding: 12px 15px;
            font-family: 'Press Start 2P', monospace;
            font-size: 0.7rem;
            width: 100%;
            max-width: 300px;
        }
        
        #country-select option {
            background: #1e3c72;
            color: white;
        }
        
        .country-flags {
            display: flex;
            gap: 8px;
            margin-top: 12px;
            flex-wrap: wrap;
        }
        
        .country-flag {
            background: #000000;
            border: 2px solid #00ff00;
            padding: 6px 10px;
            font-family: 'Press Start 2P', monospace;
            font-size: 0.6rem;
            display: flex;
            align-items: center;
            gap: 6px;
            color: #00ff00;
            text-shadow: 1px 1px 0px #008800;
            box-shadow: 0 0 5px #00ff00;
            image-rendering: pixelated;
        }
        
        .sentiment-counter {
            position: fixed !important;
            background: #000000;
            border: 4px solid;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: 'Press Start 2P', monospace;
            font-size: 1rem;
            font-weight: bold;
            z-index: 1000 !important;
            pointer-events: none !important;
            opacity: 0;
            transition: opacity 0.3s ease;
            transform: none !important;
            margin: 0 !important;
            box-shadow: 0 0 15px currentColor;
            image-rendering: pixelated;
        }
        
        .sentiment-counter.visible {
            opacity: 1;
        }
        
        .sad-counter {
            top: 20px !important;
            left: 20px !important;
            border-color: #ff4444;
            color: #ff4444;
        }
        
        .happy-counter {
            top: 20px !important;
            right: 20px !important;
            border-color: #00ff88;
            color: #00ff88;
        }
    </style>
</head>
<body>
    
    <div class="container">
        <div class="header">
            <h1>🎮 F1 NEWS TERMINAL 🎮</h1>
            <p>RETRO IMMIGRATION DATA STREAM<br/>SINCE TRUMP ELECTION: JAN 20, 2025<br/>LOADING F1 STUDENT INTEL...</p>
        </div>
        
        <div class="country-filter">
            <label for="country-select" style="color: #ffffff; font-family: 'Press Start 2P', monospace; font-size: 0.7rem; margin-bottom: 15px; display: block;">SELECT COUNTRY:</label>
            <select id="country-select" onchange="filterByCountry()">
                <option value="">All Countries</option>
            </select>
        </div>
        
        <div class="timeline">
            <div class="timeline-line"></div>
            <div class="timeline-line-right"></div>
            <div id="timeline-content"></div>
        </div>
        
        <div class="footer-note">
            This is it for now. The app is still developing and one day the section before Sept 16 will be available.
        </div>
    </div>

    <script>
        let currentNews = ${articlesJson};
        let allCountries = new Set();
        
        // Make newsData globally available for summary access
        window.newsData = {
            articles: currentNews,
            summaries: ${summariesJson}
        };
        
        // Country flags mapping (same as backend)
        const COUNTRY_FLAGS = {
            'China': '🇨🇳', 'India': '🇮🇳', 'Mexico': '🇲🇽', 'Philippines': '🇵🇭', 'Vietnam': '🇻🇳',
            'Brazil': '🇧🇷', 'Canada': '🇨🇦', 'Japan': '🇯🇵', 'South Korea': '🇰🇷', 'Taiwan': '🇹🇼',
            'Thailand': '🇹🇭', 'Germany': '🇩🇪', 'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸',
            'United Kingdom': '🇬🇧', 'Nigeria': '🇳🇬', 'Egypt': '🇪🇬', 'Ethiopia': '🇪🇹', 'Kenya': '🇰🇪',
            'Ghana': '🇬🇭', 'Russia': '🇷🇺', 'Ukraine': '🇺🇦', 'Poland': '🇵🇱', 'Romania': '🇷🇴',
            'Bulgaria': '🇧🇬', 'Turkey': '🇹🇷', 'Iran': '🇮🇷', 'Iraq': '🇮🇶', 'Afghanistan': '🇦🇫',
            'Pakistan': '🇵🇰', 'Bangladesh': '🇧🇩', 'Sri Lanka': '🇱🇰', 'Nepal': '🇳🇵', 'Myanmar': '🇲🇲',
            'Cambodia': '🇰🇭', 'Laos': '🇱🇦', 'Malaysia': '🇲🇾', 'Singapore': '🇸🇬', 'Indonesia': '🇮🇩',
            'Australia': '🇦🇺', 'New Zealand': '🇳🇿', 'South Africa': '🇿🇦', 'Morocco': '🇲🇦', 'Tunisia': '🇹🇳',
            'Algeria': '🇩🇿', 'Libya': '🇱🇾', 'Sudan': '🇸🇩', 'Eritrea': '🇪🇷', 'Somalia': '🇸🇴',
            'Yemen': '🇾🇪', 'Saudi Arabia': '🇸🇦', 'United Arab Emirates': '🇦🇪', 'Jordan': '🇯🇴',
            'Lebanon': '🇱🇧', 'Syria': '🇸🇾', 'Israel': '🇮🇱', 'Palestine': '🇵🇸', 'Colombia': '🇨🇴',
            'Venezuela': '🇻🇪', 'Peru': '🇵🇪', 'Ecuador': '🇪🇨', 'Bolivia': '🇧🇴', 'Chile': '🇨🇱',
            'Argentina': '🇦🇷', 'Uruguay': '🇺🇾', 'Paraguay': '🇵🇾', 'Guyana': '🇬🇾', 'Suriname': '🇸🇷',
            'French Guiana': '🇬🇫', 'Cuba': '🇨🇺', 'Haiti': '🇭🇹', 'Dominican Republic': '🇩🇴',
            'Jamaica': '🇯🇲', 'Trinidad and Tobago': '🇹🇹', 'Barbados': '🇧🇧', 'Grenada': '🇬🇩',
            'Saint Lucia': '🇱🇨', 'Saint Vincent and the Grenadines': '🇻🇨', 'Antigua and Barbuda': '🇦🇬',
            'Saint Kitts and Nevis': '🇰🇳', 'Dominica': '🇩🇲', 'Belize': '🇧🇿', 'Guatemala': '🇬🇹',
            'Honduras': '🇭🇳', 'El Salvador': '🇸🇻', 'Nicaragua': '🇳🇮', 'Costa Rica': '🇨🇷', 'Panama': '🇵🇦'
        };
        
        // Load saved news on page load
        document.addEventListener('DOMContentLoaded', function() {
            populateCountryFilter();
            displayResults(currentNews);
        });
        
        
        function updateSentimentCounters() {
            let happyCount = 0;
            let sadCount = 0;
            
            currentNews.forEach(article => {
                if (article.sentiment === 'positive') {
                    happyCount++;
                } else if (article.sentiment === 'negative') {
                    sadCount++;
                }
            });
            
            document.getElementById('happy-count').textContent = happyCount;
            document.getElementById('sad-count').textContent = sadCount;
        }
        
        function populateCountryFilter() {
            // Collect all unique countries from articles
            currentNews.forEach(article => {
                if (article.countries) {
                    article.countries.forEach(country => allCountries.add(country));
                }
            });
            
            // Populate country dropdown
            const select = document.getElementById('country-select');
            const sortedCountries = Array.from(allCountries).sort();
            
            sortedCountries.forEach(country => {
                const option = document.createElement('option');
                option.value = country;
                option.textContent = \`\${COUNTRY_FLAGS[country] || '🏳️'} \${country}\`;
                select.appendChild(option);
            });
        }
        
        function filterByCountry() {
            const selectedCountry = document.getElementById('country-select').value;
            let filteredNews = currentNews;
            
            if (selectedCountry) {
                filteredNews = currentNews.filter(article => 
                    article.countries && article.countries.includes(selectedCountry)
                );
            }
            
            displayResults(filteredNews);
        }
        
        function getSentimentEmoji(sentiment) {
            switch(sentiment) {
                case 'positive': return '😊';
                case 'negative': return '😢';
                default: return '😐';
            }
        }
        
        function getArticleSummary(article) {
            // Check if we have a structured summary for this article
            if (window.newsData && window.newsData.summaries && window.newsData.summaries[article.url]) {
                return window.newsData.summaries[article.url];
            }
            
            // Fallback: Generate basic structured format without OpenAI
            const dateStr = new Date(article.date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                timeZone: 'America/New_York'
            });
            
            // Basic F1-relevant keywords detection
            const title = article.title.toLowerCase();
            const isF1Related = title.includes('f1') || title.includes('student') || title.includes('visa') || 
                               title.includes('international') || title.includes('immigration');
            
            const emoji = isF1Related ? '🎓' : '📋';
            
            return \`\${emoji} \${dateStr} | \${article.title}
🎓 Potential causes for F1 students - \${isF1Related ? 'May impact F1 visa processing and student status requirements.' : 'General immigration policy change that may indirectly affect student visa holders.'}\`;
        }
        
        function displayResults(articles) {
            const timelineContent = document.getElementById('timeline-content');
            
            // Filter out useless category pages
            const uselessTitles = ['All News', 'News Releases', 'Alerts', 'Speeches, Statements, Testimony'];
            const filteredArticles = articles.filter(article => !uselessTitles.includes(article.title));
            
            if (filteredArticles.length === 0) {
                timelineContent.innerHTML = \`
                    <div style="text-align: center; padding: 40px; color: #ffffff;">
                        <h3>No Recent News</h3>
                        <p>No articles found since Trump election (Jan 20, 2025)</p>
                    </div>
                \`;
            } else {
                // Calculate dynamic spacing based on time differences
                const timelineItems = filteredArticles.map((article, index) => {
                    const flagsHtml = article.countries && article.countries.length > 0 
                        ? article.countries.map(country => 
                            \`\${COUNTRY_FLAGS[country] || '🏳️'} \${country}\`
                        ).join(' ')
                        : '🌍 General';
                    
                    const dateStr = new Date(article.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        timeZone: 'America/New_York'
                    });
                    
                    // Calculate spacing based on time difference from previous article
                    let marginTop = 80; // Default minimum spacing for first article
                    if (index > 0) {
                        const currentDate = new Date(article.date);
                        const previousDate = new Date(filteredArticles[index - 1].date);
                        const timeDiff = Math.abs(currentDate - previousDate);
                        
                        // Convert time difference to appropriate spacing
                        const daysDiff = timeDiff / (1000 * 60 * 60 * 24); // Convert to days
                        
                        // Scale spacing: 1 day = 25px, with minimum 80px and maximum 200px
                        marginTop = Math.max(80, Math.min(200, 80 + (daysDiff * 25)));
                    }
                    
                    return \`
                        <div class="timeline-item" style="margin-top: \${marginTop}px;">
                            <div class="timeline-dot"></div>
                            <div class="timeline-date">\${dateStr}</div>
                            <div class="timeline-content">
                                <a href="\${article.url}" target="_blank" class="timeline-rectangle timeline-clickable">
                                    <div class="timeline-title">\${article.title}</div>
                                    <div class="timeline-summary">\${getArticleSummary(article)}</div>
                                </a>
                            </div>
                            <div class="timeline-flags">\${flagsHtml}</div>
                        </div>
                    \`;
                }).join('');
                
                timelineContent.innerHTML = timelineItems;
            }
        }
    </script>
</body>
</html>
  `;
  
  res.send(html);
});

app.get('/api/scrape', async (req, res) => {
  try {
    // Load existing data
    const savedData = loadSavedNews();
    const existingArticles = savedData.articles || [];
    
    // Scrape new articles
    const scrapedArticles = await getRecentNews();
    
    // Add only new articles
    const { newCount, allArticles } = addNewArticles(existingArticles, scrapedArticles);
    
    // Save updated data
    const updatedData = {
      articles: allArticles,
      lastScraped: new Date().toISOString(),
      summaries: savedData.summaries || {}
    };
    saveNews(updatedData);
    
    res.json({ 
      articles: allArticles, 
      count: allArticles.length,
      newCount: newCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/news', (req, res) => {
  try {
    const savedData = loadSavedNews();
    res.json({ articles: savedData.articles || [], summaries: savedData.summaries || {} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/summarize', async (req, res) => {
  try {
    const savedData = loadSavedNews();
    const existingSummaries = savedData.summaries || {};
    
    const newSummaries = await summarizeWithOpenAI(savedData.articles, existingSummaries);
    
    // Save updated summaries
    const updatedData = {
      ...savedData,
      summaries: newSummaries
    };
    saveNews(updatedData);
    
    res.json({ summaries: newSummaries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auto-scrape on startup
async function startupScrape() {
  try {
    console.log('🔄 Starting initial scrape...');
    const savedData = loadSavedNews();
    const existingArticles = savedData.articles || [];
    
    const scrapedArticles = await getRecentNews();
    const { newCount, allArticles } = addNewArticles(existingArticles, scrapedArticles);
    
    const updatedData = {
      articles: allArticles,
      lastScraped: new Date().toISOString(),
      summaries: savedData.summaries || {}
    };
    saveNews(updatedData);
    
    console.log(`✅ Scraped ${scrapedArticles.length} articles, ${newCount} new`);
    console.log(`📁 Saved ${allArticles.length} total articles to uscis_news_data.json`);
  } catch (error) {
    console.error('❌ Startup scrape failed:', error.message);
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 USCIS News Web App running at http://localhost:${PORT}`);
  console.log(`📰 Scraping: ${SITES.join(', ')}`);
  console.log(`🤖 OpenAI: ${process.env.OPENAI_API_KEY ? 'Enabled' : 'Disabled'}`);
  
  // Start scraping in background
  startupScrape();
});
