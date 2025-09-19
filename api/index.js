import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// USCIS sites to scrape
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

// Country flag mapping
const COUNTRY_FLAGS = {
  'china': '🇨🇳',
  'india': '🇮🇳',
  'mexico': '🇲🇽',
  'philippines': '🇵🇭',
  'vietnam': '🇻🇳',
  'south korea': '🇰🇷',
  'japan': '🇯🇵',
  'thailand': '🇹🇭',
  'indonesia': '🇮🇩',
  'bangladesh': '🇧🇩',
  'pakistan': '🇵🇰',
  'iran': '🇮🇷',
  'turkey': '🇹🇷',
  'egypt': '🇪🇬',
  'nigeria': '🇳🇬',
  'ethiopia': '🇪🇹',
  'kenya': '🇰🇪',
  'ghana': '🇬🇭',
  'brazil': '🇧🇷',
  'colombia': '🇨🇴',
  'peru': '🇵🇪',
  'venezuela': '🇻🇪',
  'ecuador': '🇪🇨',
  'argentina': '🇦🇷',
  'chile': '🇨🇱',
  'ukraine': '🇺🇦',
  'russia': '🇷🇺',
  'poland': '🇵🇱',
  'romania': '🇷🇴',
  'bulgaria': '🇧🇬',
  'croatia': '🇭🇷',
  'serbia': '🇷🇸',
  'bosnia': '🇧🇦',
  'albania': '🇦🇱',
  'moldova': '🇲🇩',
  'belarus': '🇧🇾',
  'lithuania': '🇱🇹',
  'latvia': '🇱🇻',
  'estonia': '🇪🇪',
  'czech republic': '🇨🇿',
  'slovakia': '🇸🇰',
  'hungary': '🇭🇺',
  'slovenia': '🇸🇮',
  'spain': '🇪🇸',
  'portugal': '🇵🇹',
  'france': '🇫🇷',
  'italy': '🇮🇹',
  'germany': '🇩🇪',
  'netherlands': '🇳🇱',
  'belgium': '🇧🇪',
  'austria': '🇦🇹',
  'switzerland': '🇨🇭',
  'united kingdom': '🇬🇧',
  'ireland': '🇮🇪',
  'denmark': '🇩🇰',
  'sweden': '🇸🇪',
  'norway': '🇳🇴',
  'finland': '🇫🇮',
  'iceland': '🇮🇸',
  'greece': '🇬🇷',
  'cyprus': '🇨🇾',
  'malta': '🇲🇹',
  'canada': '🇨🇦',
  'australia': '🇦🇺',
  'new zealand': '🇳🇿',
  'south africa': '🇿🇦',
  'israel': '🇮🇱',
  'lebanon': '🇱🇧',
  'jordan': '🇯🇴',
  'syria': '🇸🇾',
  'iraq': '🇮🇶',
  'afghanistan': '🇦🇫',
  'nepal': '🇳🇵',
  'sri lanka': '🇱🇰',
  'myanmar': '🇲🇲',
  'cambodia': '🇰🇭',
  'laos': '🇱🇦',
  'mongolia': '🇲🇳',
  'taiwan': '🇹🇼',
  'hong kong': '🇭🇰',
  'singapore': '🇸🇬',
  'malaysia': '🇲🇾',
  'brunei': '🇧🇳'
};

// Load existing data
function loadData() {
  try {
    const data = fs.readFileSync('uscis_news_data.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { articles: [], summaries: {} };
  }
}

// Save data
function saveData(data) {
  fs.writeFileSync('uscis_news_data.json', JSON.stringify(data, null, 2));
}

// Detect countries in text
function detectCountries(text) {
  const countries = [];
  const lowerText = text.toLowerCase();
  
  for (const [country, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (lowerText.includes(country)) {
      countries.push({ name: country, flag });
    }
  }
  
  return countries;
}

// Summarize with OpenAI
async function summarizeWithOpenAI(articles) {
  if (!process.env.OPENAI_API_KEY) {
    console.log('🤖 OpenAI: Disabled');
    return {};
  }
  
  try {
    const bullets = articles.map(article => 
      `• ${article.date} | ${article.title} | ${article.url}`
    ).join('\n');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a USCIS policy analyst specializing in F1 student visa implications. Format summaries for international students.'
        },
        {
          role: 'user',
          content: `Analyze these NEW USCIS newsroom items for F1 students.

For each item, output EXACTLY in this format:
📅 [Date] | [Title] | [URL]
📝 Summary - 1 sentence.
🔍 What happened and how it ended - 1 sentence.
🎓 Potential causes for F1 students - 1 sentence.

Choose appropriate emoji (📅📝🔍🎓) based on content type.

Items:
${bullets}`
        }
      ],
      temperature: 0.3
    });
    
    const summaries = {};
    const content = response.choices[0].message.content;
    const lines = content.split('\n');
    
    for (const article of articles) {
      const articleKey = `${article.date} | ${article.title}`;
      const summaryLines = [];
      let found = false;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(articleKey)) {
          found = true;
          // Collect the next few lines for this article
          for (let j = i; j < Math.min(i + 5, lines.length); j++) {
            if (lines[j].trim()) {
              summaryLines.push(lines[j]);
            }
          }
          break;
        }
      }
      
      if (found && summaryLines.length > 0) {
        summaries[article.url] = summaryLines.join('\n');
      }
    }
    
    console.log('✅ Generated summaries for', Object.keys(summaries).length, 'articles');
    return summaries;
    
  } catch (error) {
    console.error('❌ OpenAI summarization failed:', error.message);
    return {};
  }
}

// Scrape USCIS news
async function scrapeNews() {
  console.log('🔍 Starting to scrape news...');
  const allLinks = new Set();
  
  // Extract links from all sites
  for (const site of SITES) {
    try {
      console.log(`📋 Extracting links from: ${site}`);
      const response = await axios.get(site, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      const links = [];
      
      $('a[href*="/newsroom/"]').each((i, element) => {
        const href = $(element).attr('href');
        if (href && href.includes('/newsroom/') && !href.includes('?page=')) {
          const fullUrl = href.startsWith('http') ? href : `https://www.uscis.gov${href}`;
          links.push(fullUrl);
        }
      });
      
      allLinks.add(...links);
      console.log(`✅ Found ${links.length} links from ${site}`);
      
    } catch (error) {
      console.error(`❌ Failed to scrape ${site}:`, error.message);
    }
  }
  
  console.log(`📝 Total unique URLs found: ${allLinks.size}`);
  
  // Process articles in batches
  const savedData = loadData();
  const existingUrls = new Set(savedData.articles.map(a => a.url));
  const newArticles = [];
  
  const urlsArray = Array.from(allLinks);
  const batchSize = 10;
  
  for (let i = 0; i < urlsArray.length; i += batchSize) {
    const batch = urlsArray.slice(i, i + batchSize);
    console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(urlsArray.length/batchSize)} (${batch.length} articles)`);
    
    const promises = batch.map(async (url) => {
      if (existingUrls.has(url)) {
        return null; // Skip existing articles
      }
      
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 15000
        });
        
        const $ = cheerio.load(response.data);
        
        // Extract article details
        const title = $('h1').first().text().trim() || 
                     $('.field--name-title').text().trim() ||
                     $('title').text().trim();
        
        const dateText = $('.field--name-created').text().trim() ||
                        $('.date-display-single').text().trim() ||
                        $('time').attr('datetime') ||
                        '';
        
        const content = $('.field--name-body').text().trim() ||
                       $('.content').text().trim() ||
                       $('article').text().trim() ||
                       '';
        
        if (!title || title.length < 10) {
          return null; // Skip articles without proper titles
        }
        
        // Parse date
        let date;
        if (dateText) {
          const parsed = new Date(dateText);
          if (!isNaN(parsed.getTime())) {
            date = parsed.toISOString();
          }
        }
        
        if (!date) {
          // Try to extract from URL or use current date
          const urlMatch = url.match(/(\d{4})-(\d{2})-(\d{2})/);
          if (urlMatch) {
            date = new Date(urlMatch[1], urlMatch[2] - 1, urlMatch[3]).toISOString();
          } else {
            date = new Date().toISOString();
          }
        }
        
        // Filter for Trump election date (Jan 20, 2025) onwards
        const trumpElectionDate = new Date('2025-01-20');
        const articleDate = new Date(date);
        if (articleDate < trumpElectionDate) {
          return null;
        }
        
        // Detect countries
        const countries = detectCountries(title + ' ' + content);
        
        return {
          title,
          url,
          date,
          content: content.substring(0, 1000), // Limit content length
          countries
        };
        
      } catch (error) {
        console.error(`❌ Failed to process ${url}:`, error.message);
        return null;
      }
    });
    
    const batchResults = await Promise.all(promises);
    const validArticles = batchResults.filter(article => article !== null);
    newArticles.push(...validArticles);
    
    console.log(`✅ Batch complete: ${validArticles.length} valid articles added`);
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`🎯 Final result: ${newArticles.length} articles since Trump election (Jan 20, 2025)`);
  
  // Update saved data
  const updatedArticles = [...savedData.articles, ...newArticles];
  const updatedSummaries = { ...savedData.summaries };
  
  // Generate summaries for new articles if OpenAI is available
  if (newArticles.length > 0 && process.env.OPENAI_API_KEY) {
    console.log('🤖 Generating summaries for new articles...');
    const newSummaries = await summarizeWithOpenAI(newArticles);
    Object.assign(updatedSummaries, newSummaries);
  }
  
  const finalData = {
    articles: updatedArticles,
    summaries: updatedSummaries,
    lastUpdated: new Date().toISOString()
  };
  
  saveData(finalData);
  console.log(`📁 Saved ${updatedArticles.length} total articles to uscis_news_data.json`);
  
  return finalData;
}

// Generate HTML template
function generateHTML(newsData) {
  const currentNews = newsData.articles || [];
  const summariesJson = JSON.stringify(newsData.summaries || {});
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>F1 News - USCIS Timeline</title>
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
            overflow-x: hidden;
        }
        
        .header {
            text-align: center;
            padding: 20px;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1);
            background-size: 300% 300%;
            animation: gradientShift 3s ease infinite;
        }
        
        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .header h1 {
            font-size: 1.2rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        
        .header p {
            font-size: 0.6rem;
            opacity: 0.9;
        }
        
        .controls {
            padding: 20px;
            text-align: center;
            background: #111111;
            border-bottom: 2px solid #333333;
        }
        
        .controls button {
            background: #333333;
            color: #ffffff;
            border: 2px solid #ffffff;
            padding: 10px 20px;
            margin: 5px;
            font-family: 'Press Start 2P', monospace;
            font-size: 0.5rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .controls button:hover {
            background: #ffffff;
            color: #000000;
        }
        
        .controls button.active {
            background: #00ff00;
            color: #000000;
        }
        
        .timeline {
            position: relative;
            padding: 40px 0;
            margin: 0 auto;
            max-width: 1400px;
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
        
        .timeline-dot {
            position: absolute;
            left: 200px;
            width: 12px;
            height: 12px;
            background: #00ff00;
            border: 3px solid #ffffff;
            border-radius: 50%;
            transform: translateX(-50%);
            z-index: 10;
        }
        
        .timeline-date {
            position: absolute;
            left: 80px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 0.8rem;
            font-weight: bold;
            color: #ffffff;
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
            border-radius: 8px;
            margin-bottom: 10px;
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
            padding: 4px 8px;
            font-size: 0.8rem;
            display: flex;
            gap: 6px;
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
        }
        
        .timeline-summary {
            font-size: 0.6rem;
            line-height: 1.3;
            color: #cccccc;
            margin-top: 5px;
            white-space: pre-line;
        }
        
        .timeline-item {
            position: relative;
            margin-top: 80px;
            padding-bottom: 40px;
            padding-top: 20px;
            border-bottom: 1px dashed #ffffff;
            z-index: 1;
        }
        
        .timeline-item:last-child {
            border-bottom: none;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            font-size: 0.8rem;
            color: #00ff00;
        }
        
        .error {
            text-align: center;
            padding: 40px;
            font-size: 0.8rem;
            color: #ff6b6b;
        }
        
        .stats {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border-radius: 8px;
            font-size: 0.5rem;
            z-index: 1000;
        }
        
        @media (max-width: 768px) {
            .timeline-line {
                left: 50px;
            }
            
            .timeline-line-right {
                right: 50px;
            }
            
            .timeline-dot {
                left: 50px;
            }
            
            .timeline-date {
                left: 10px;
                font-size: 0.6rem;
            }
            
            .timeline-content {
                left: 70px;
                right: 100px;
            }
            
            .timeline-flags {
                right: 60px;
                font-size: 0.6rem;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>F1 NEWS.LOL</h1>
        <p>USCIS Immigration News Timeline for F1 Students</p>
    </div>
    
    <div class="controls">
        <button onclick="filterNews('all')" class="active" id="btn-all">All News</button>
        <button onclick="filterNews('today')" id="btn-today">Today</button>
        <button onclick="filterNews('week')" id="btn-week">Last 7 Days</button>
        <button onclick="filterNews('f1')" id="btn-f1">F1 Related</button>
        <button onclick="refreshData()" id="btn-refresh">🔄 Refresh</button>
    </div>
    
    <div class="timeline">
        <div class="timeline-line"></div>
        <div class="timeline-line-right"></div>
        <div id="timeline-content"></div>
    </div>
    
    <div class="stats" id="stats">
        Loading...
    </div>

    <script>
        let currentNews = ${JSON.stringify(currentNews)};
        let currentFilter = 'all';
        
        window.newsData = {
            articles: currentNews,
            summaries: ${summariesJson}
        };
        
        function getArticleSummary(article) {
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
            const title = article.title.toLowerCase();
            const isF1Related = title.includes('f1') || title.includes('student') || title.includes('visa') ||
                               title.includes('international') || title.includes('immigration');
            const emoji = isF1Related ? '🎓' : '📋';
            return \`\${emoji} \${dateStr} | \${article.title}
🎓 Potential causes for F1 students - \${isF1Related ? 'May impact F1 visa processing and student status requirements.' : 'General immigration policy change that may indirectly affect student visa holders.'}\`;
        }
        
        function formatDate(dateStr) {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                timeZone: 'America/New_York'
            });
        }
        
        function filterNews(type) {
            currentFilter = type;
            
            // Update button states
            document.querySelectorAll('.controls button').forEach(btn => btn.classList.remove('active'));
            document.getElementById(\`btn-\${type}\`).classList.add('active');
            
            let filteredNews = currentNews;
            const now = new Date();
            
            switch(type) {
                case 'today':
                    const today = now.toDateString();
                    filteredNews = currentNews.filter(article => 
                        new Date(article.date).toDateString() === today
                    );
                    break;
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    filteredNews = currentNews.filter(article => 
                        new Date(article.date) >= weekAgo
                    );
                    break;
                case 'f1':
                    filteredNews = currentNews.filter(article => {
                        const title = article.title.toLowerCase();
                        return title.includes('f1') || title.includes('student') || 
                               title.includes('visa') || title.includes('international') ||
                               title.includes('immigration');
                    });
                    break;
            }
            
            displayResults(filteredNews);
            updateStats(filteredNews);
        }
        
        function displayResults(articles) {
            const container = document.getElementById('timeline-content');
            
            if (articles.length === 0) {
                container.innerHTML = '<div class="loading">No articles found for the selected filter.</div>';
                return;
            }
            
            // Sort articles by date (newest first)
            articles.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            let html = '';
            
            articles.forEach((article, index) => {
                const flagsHtml = article.countries && article.countries.length > 0 
                    ? article.countries.map(country => country.flag).join(' ')
                    : '';
                
                html += \`
                    <div class="timeline-item" style="margin-top: \${index === 0 ? '20px' : '80px'}">
                        <div class="timeline-dot"></div>
                        <div class="timeline-date">\${formatDate(article.date)}</div>
                        <div class="timeline-content">
                            <a href="\${article.url}" target="_blank" class="timeline-rectangle timeline-clickable">
                                <div class="timeline-title">\${article.title}</div>
                                <div class="timeline-summary">\${getArticleSummary(article)}</div>
                            </a>
                        </div>
                        <div class="timeline-flags">\${flagsHtml}</div>
                    </div>
                \`;
            });
            
            container.innerHTML = html;
        }
        
        function updateStats(articles) {
            const stats = document.getElementById('stats');
            const now = new Date();
            const today = articles.filter(article => 
                new Date(article.date).toDateString() === now.toDateString()
            ).length;
            
            stats.innerHTML = \`
                Total: \${articles.length}<br>
                Today: \${today}<br>
                Filter: \${currentFilter}
            \`;
        }
        
        async function refreshData() {
            const btn = document.getElementById('btn-refresh');
            btn.innerHTML = '⏳ Loading...';
            btn.disabled = true;
            
            try {
                const response = await fetch('/api/scrape');
                const data = await response.json();
                
                if (data.success) {
                    currentNews = data.articles;
                    window.newsData.articles = currentNews;
                    window.newsData.summaries = data.summaries || {};
                    
                    filterNews(currentFilter);
                    alert('Data refreshed successfully!');
                } else {
                    alert('Failed to refresh data: ' + data.error);
                }
            } catch (error) {
                alert('Error refreshing data: ' + error.message);
            } finally {
                btn.innerHTML = '🔄 Refresh';
                btn.disabled = false;
            }
        }
        
        // Initialize
        displayResults(currentNews);
        updateStats(currentNews);
    </script>
</body>
</html>`;
}

// Routes
app.get('/', (req, res) => {
  const savedData = loadData();
  const html = generateHTML(savedData);
  res.send(html);
});

app.get('/api/scrape', async (req, res) => {
  try {
    const data = await scrapeNews();
    res.json({ success: true, articles: data.articles, summaries: data.summaries });
  } catch (error) {
    console.error('Scrape API error:', error);
    res.json({ success: false, error: error.message });
  }
});

// Vercel serverless function export
export default app;

// Only start server if not in Vercel environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 USCIS News Web App running at http://localhost:${PORT}`);
  });
}
