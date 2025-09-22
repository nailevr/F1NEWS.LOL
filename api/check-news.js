const axios = require('axios');
const cheerio = require('cheerio');

// Simple in-memory storage for demo (in production, use a database)
let articlesDatabase = {
  articles: [],
  lastChecked: null,
  summaries: {}
};

const SITES = [
  'https://www.uscis.gov/newsroom/news-releases',
  'https://www.uscis.gov/newsroom/alerts'
];

const F1_KEYWORDS = [
  'f1', 'student', 'visa', 'international', 'immigration', 'education',
  'opt', 'cpt', 'sevis', 'dso', 'iss', 'stem', 'extension', 'status',
  'maintenance', 'enrollment', 'academic', 'program', 'degree'
];

// Country detection
const COUNTRY_FLAGS = {
  'China': '🇨🇳', 'India': '🇮🇳', 'Mexico': '🇲🇽', 'Philippines': '🇵🇭',
  'Vietnam': '🇻🇳', 'Brazil': '🇧🇷', 'Canada': '🇨🇦', 'Japan': '🇯🇵',
  'South Korea': '🇰🇷', 'Taiwan': '🇹🇼', 'Thailand': '🇹🇭',
  'Germany': '🇩🇪', 'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸',
  'United Kingdom': '🇬🇧', 'Nigeria': '🇳🇬', 'Egypt': '🇪🇬'
};

async function fetchPage(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; F1NewsBot/1.0; +https://f1news.lol)'
      },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return null;
  }
}

function extractArticleLinks(html) {
  const $ = cheerio.load(html);
  const links = [];
  
  $('a[href*="/newsroom/"]').each((i, element) => {
    const href = $(element).attr('href');
    if (href && (href.includes('/news-releases/') || href.includes('/alerts/'))) {
      const fullUrl = href.startsWith('http') ? href : `https://www.uscis.gov${href}`;
      if (!links.includes(fullUrl)) {
        links.push(fullUrl);
      }
    }
  });
  
  return links;
}

async function extractArticle(url) {
  try {
    const html = await fetchPage(url);
    if (!html) return null;
    
    const $ = cheerio.load(html);
    
    // Extract title
    const title = $('h1').first().text().trim() || 
                  $('.page-title').text().trim() ||
                  $('title').text().trim();
    
    if (!title) return null;
    
    // Extract content
    const content = $('.field--name-body').text().trim() ||
                   $('.content').text().trim() ||
                   $('main').text().trim();
    
    // Extract date
    let date = new Date();
    const dateText = $('.field--name-created').text().trim() ||
                     $('.date').text().trim();
    if (dateText) {
      const parsedDate = new Date(dateText);
      if (!isNaN(parsedDate.getTime())) {
        date = parsedDate;
      }
    }
    
    return {
      title,
      url,
      date: date.toISOString(),
      content: content.substring(0, 1000) // Limit content length
    };
  } catch (error) {
    console.error(`Error extracting article ${url}:`, error.message);
    return null;
  }
}

function isF1Relevant(article) {
  const text = (article.title + ' ' + article.content).toLowerCase();
  return F1_KEYWORDS.some(keyword => text.includes(keyword));
}

function detectCountries(article) {
  const text = article.title + ' ' + article.content;
  const countries = [];
  
  Object.keys(COUNTRY_FLAGS).forEach(country => {
    if (text.toLowerCase().includes(country.toLowerCase())) {
      countries.push({
        name: country,
        flag: COUNTRY_FLAGS[country]
      });
    }
  });
  
  // Default to general if no specific country detected
  if (countries.length === 0) {
    countries.push({ name: 'general', flag: '🌍' });
  }
  
  return countries;
}

function generateSummary(article) {
  const dateStr = new Date(article.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  const isF1Related = isF1Relevant(article);
  const emoji = isF1Related ? '🎓' : '📋';
  
  return `${emoji} ${dateStr} | ${article.title}
🎓 Potential causes for F1 students - ${isF1Related ? 
  'May impact F1 visa processing and student status requirements.' : 
  'General immigration policy change that may indirectly affect student visa holders.'}`;
}

async function checkForNewArticles() {
  console.log('🔍 Checking for new USCIS articles...');
  
  const allLinks = new Set();
  
  // Get links from all sites
  for (const site of SITES) {
    try {
      const html = await fetchPage(site);
      if (html) {
        const links = extractArticleLinks(html);
        links.forEach(link => allLinks.add(link));
        console.log(`✅ Found ${links.length} links from ${site}`);
      }
    } catch (error) {
      console.error(`❌ Error checking ${site}:`, error.message);
    }
  }
  
  console.log(`📝 Total unique URLs found: ${allLinks.size}`);
  
  const newArticles = [];
  const existingUrls = new Set(articlesDatabase.articles.map(a => a.url));
  
  // Process articles in batches
  const linksArray = Array.from(allLinks);
  const batchSize = 5;
  
  for (let i = 0; i < linksArray.length; i += batchSize) {
    const batch = linksArray.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (url) => {
      // Skip if we already have this article
      if (existingUrls.has(url)) {
        return null;
      }
      
      try {
        const article = await extractArticle(url);
        if (article && isF1Relevant(article)) {
          return {
            ...article,
            countries: detectCountries(article),
            summary: generateSummary(article)
          };
        }
        return null;
      } catch (error) {
        console.error(`❌ Error processing ${url}:`, error.message);
        return null;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    const validArticles = batchResults.filter(article => article !== null);
    newArticles.push(...validArticles);
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  if (newArticles.length > 0) {
    console.log(`🎉 Found ${newArticles.length} new F1-relevant articles!`);
    
    // Add new articles to database
    articlesDatabase.articles = [...newArticles, ...articlesDatabase.articles];
    
    // Update summaries
    newArticles.forEach(article => {
      articlesDatabase.summaries[article.url] = article.summary;
    });
    
    // Sort by date (newest first)
    articlesDatabase.articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Keep only latest 100 articles to prevent memory issues
    articlesDatabase.articles = articlesDatabase.articles.slice(0, 100);
  }
  
  articlesDatabase.lastChecked = new Date().toISOString();
  
  return {
    newCount: newArticles.length,
    totalCount: articlesDatabase.articles.length,
    newArticles: newArticles.slice(0, 5) // Return first 5 new articles for preview
  };
}

// Vercel Cron Job handler
async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    console.log('🕐 Running scheduled news check...');
    
    const result = await checkForNewArticles();
    
    console.log(`✅ News check complete: ${result.newCount} new articles found`);
    
    return res.status(200).json({
      success: true,
      message: `Found ${result.newCount} new articles`,
      data: {
        newCount: result.newCount,
        totalCount: result.totalCount,
        lastChecked: articlesDatabase.lastChecked,
        newArticles: result.newArticles
      }
    });
    
  } catch (error) {
    console.error('❌ Error in news check:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Export the database for the main API to use
module.exports = { articlesDatabase, handler };
