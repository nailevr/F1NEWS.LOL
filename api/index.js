import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

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

// Sample F1 news data
const sampleArticles = [
  {
    title: "USCIS Announces Streamlined F1 Student Visa Processing Procedures",
    url: "https://www.uscis.gov/newsroom/news-releases/streamlined-f1-processing",
    date: new Date().toISOString(),
    content: "USCIS has implemented new streamlined procedures for F1 student visa processing that will significantly reduce application review times for international students.",
    countries: [{ name: 'china', flag: '🇨🇳' }, { name: 'india', flag: '🇮🇳' }, { name: 'south korea', flag: '🇰🇷' }]
  },
  {
    title: "Enhanced Security Protocols for International Student Applications",
    url: "https://www.uscis.gov/newsroom/news-releases/security-protocols-students",
    date: new Date(Date.now() - 86400000).toISOString(),
    content: "New security measures have been introduced to ensure the integrity of international student visa applications while maintaining efficient processing times.",
    countries: [{ name: 'mexico', flag: '🇲🇽' }, { name: 'philippines', flag: '🇵🇭' }, { name: 'vietnam', flag: '🇻🇳' }]
  },
  {
    title: "Updated F1 Student Work Authorization Guidelines",
    url: "https://www.uscis.gov/newsroom/news-releases/f1-work-authorization-update",
    date: new Date(Date.now() - 172800000).toISOString(),
    content: "USCIS has updated guidelines for F1 student work authorization, including new provisions for Optional Practical Training (OPT) programs.",
    countries: [{ name: 'japan', flag: '🇯🇵' }, { name: 'thailand', flag: '🇹🇭' }, { name: 'indonesia', flag: '🇮🇩' }]
  },
  {
    title: "International Student Status Maintenance Requirements",
    url: "https://www.uscis.gov/newsroom/news-releases/student-status-maintenance",
    date: new Date(Date.now() - 259200000).toISOString(),
    content: "New requirements have been established for F1 students to maintain their status, including updated enrollment verification procedures.",
    countries: [{ name: 'brazil', flag: '🇧🇷' }, { name: 'colombia', flag: '🇨🇴' }, { name: 'peru', flag: '🇵🇪' }]
  },
  {
    title: "F1 Student Visa Extension Processing Updates",
    url: "https://www.uscis.gov/newsroom/news-releases/f1-extension-processing",
    date: new Date(Date.now() - 345600000).toISOString(),
    content: "Processing procedures for F1 student visa extensions have been updated to include new documentation requirements and faster review processes.",
    countries: [{ name: 'ukraine', flag: '🇺🇦' }, { name: 'poland', flag: '🇵🇱' }, { name: 'romania', flag: '🇷🇴' }]
  },
  {
    title: "International Student Travel Authorization Changes",
    url: "https://www.uscis.gov/newsroom/news-releases/student-travel-authorization",
    date: new Date(Date.now() - 432000000).toISOString(),
    content: "New travel authorization procedures have been implemented for F1 students, including updated re-entry documentation requirements.",
    countries: [{ name: 'egypt', flag: '🇪🇬' }, { name: 'nigeria', flag: '🇳🇬' }, { name: 'ethiopia', flag: '🇪🇹' }]
  }
];

// Generate HTML template
function generateHTML(articles) {
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
        
        .notice {
            text-align: center;
            padding: 20px;
            background: #222222;
            border: 2px solid #00ff00;
            margin: 20px;
            border-radius: 8px;
            font-size: 0.6rem;
            color: #00ff00;
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
    
    <div class="notice">
        🚀 F1 News Timeline - Live USCIS Updates for International Students<br>
        📅 Tracking immigration policy changes since Trump election (Jan 20, 2025)<br>
        🎓 Specialized analysis for F1 student visa implications
    </div>
    
    <div class="controls">
        <button onclick="filterNews('all')" class="active" id="btn-all">All News</button>
        <button onclick="filterNews('today')" id="btn-today">Today</button>
        <button onclick="filterNews('week')" id="btn-week">Last 7 Days</button>
        <button onclick="filterNews('f1')" id="btn-f1">F1 Related</button>
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
        let currentNews = ${JSON.stringify(articles)};
        let currentFilter = 'all';
        
        function getArticleSummary(article) {
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
                container.innerHTML = '<div style="text-align: center; padding: 40px; color: #ff6b6b;">No articles found for the selected filter.</div>';
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
        
        // Initialize
        displayResults(currentNews);
        updateStats(currentNews);
    </script>
</body>
</html>`;
}

// Routes
app.get('/', (req, res) => {
  try {
    const html = generateHTML(sampleArticles);
    res.send(html);
  } catch (error) {
    console.error('Error generating HTML:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/api/scrape', (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'Sample data loaded successfully',
      articles: sampleArticles,
      summaries: {}
    });
  } catch (error) {
    console.error('Error in scrape API:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Vercel serverless function export
export default app;

// Only start server if not in Vercel environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 F1 News App running at http://localhost:${PORT}`);
  });
}