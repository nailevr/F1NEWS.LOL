// Import the automated news checker
const { articlesDatabase } = require('./check-news.js');

function handler(req, res) {
  res.setHeader('Content-Type', 'text/html');
  
  // Get articles from the automated checker
  const articles = articlesDatabase.articles || [];
  const lastChecked = articlesDatabase.lastChecked;
  
  // If no articles yet, show sample data
  const displayArticles = articles.length > 0 ? articles : [
    {
      title: "West Virginia Couple Plead Guilty to Immigration Crimes",
      url: "https://www.uscis.gov/newsroom/news-releases/west-virginia-couple-plead-guilty-to-immigration-crimes",
      date: "2025-09-18T10:00:00.000Z",
      summary: "🎓 Sep 18, 2025 | West Virginia Couple Plead Guilty to Immigration Crimes\n🎓 Potential causes for F1 students - May impact F1 visa processing and student status requirements.",
      countries: [{ name: 'India', flag: '🇮🇳' }]
    },
    {
      title: "Connecticut Man Sentenced to Prison for Defrauding Immigrant Clients and USCIS",
      url: "https://www.uscis.gov/newsroom/news-releases/connecticut-man-sentenced-to-prison-for-defrauding-immigrant-clients-and-uscis",
      date: "2025-09-18T14:30:00.000Z",
      summary: "🎓 Sep 18, 2025 | Connecticut Man Sentenced to Prison for Defrauding Immigrant Clients and USCIS\n🎓 Potential causes for F1 students - Highlights importance of maintaining compliance with immigration laws and avoiding fraudulent activities.",
      countries: [{ name: 'general', flag: '🌍' }]
    },
    {
      title: "USCIS Unveils First Changes to Naturalization Test",
      url: "https://www.uscis.gov/newsroom/news-releases/uscis-unveils-first-changes-to-naturalization-test-in-multi-step-overhaul-of-american-citizenship",
      date: "2025-09-17T11:00:00.000Z",
      summary: "🎓 Sep 17, 2025 | USCIS Unveils First Changes to Naturalization Test\n🎓 Potential causes for F1 students - May affect F1 students considering future pathways to citizenship after completing their studies.",
      countries: [{ name: 'general', flag: '🌍' }]
    }
  ];
  
  const articlesHtml = displayArticles.map(article => {
    const dateStr = new Date(article.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    const flagsHtml = article.countries ? 
      article.countries.map(c => `<span class="flag">${c.flag}</span>`).join(' ') : 
      '<span class="flag">🌍</span>';
    
    return `
      <div class="article">
        <h2>${article.title}</h2>
        <p><strong>Date:</strong> ${dateStr}</p>
        <div class="summary">${article.summary.replace(/\n/g, '<br>')}</div>
        <p><strong>Countries Affected:</strong> ${flagsHtml}</p>
        <p><a href="${article.url}" target="_blank" style="color: #00d4ff;">Read Full Article →</a></p>
      </div>
    `;
  }).join('');
  
  const statusMessage = articles.length > 0 ? 
    `Showing ${articles.length} USCIS articles with automated F1 analysis` :
    `Automated system initializing... showing sample articles`;
    
  const lastCheckedStr = lastChecked ? 
    new Date(lastChecked).toLocaleString('en-US') : 
    'Never';

  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>F1 News - USCIS Updates</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { 
                font-family: Arial, sans-serif; 
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                color: white; 
                margin: 0; 
                padding: 40px;
                min-height: 100vh;
            }
            .container { max-width: 800px; margin: 0 auto; }
            h1 { color: #00d4ff; text-align: center; margin-bottom: 30px; }
            .status-bar {
                background: rgba(0, 212, 255, 0.1);
                padding: 15px;
                border-radius: 10px;
                margin-bottom: 30px;
                border-left: 4px solid #00d4ff;
                font-size: 0.9em;
            }
            .article { 
                background: rgba(255,255,255,0.1); 
                padding: 20px; 
                margin: 20px 0; 
                border-radius: 10px;
                border-left: 4px solid #00d4ff;
            }
            .article h2 { margin: 0 0 10px 0; color: #ffffff; }
            .article p { margin: 5px 0; opacity: 0.9; }
            .summary {
                background: rgba(0, 0, 0, 0.3);
                padding: 10px;
                border-radius: 5px;
                margin: 10px 0;
                font-family: monospace;
                font-size: 0.9em;
                line-height: 1.4;
            }
            .flag { font-size: 1.5em; margin-left: 10px; }
            .auto-refresh {
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 212, 255, 0.2);
                padding: 10px;
                border-radius: 5px;
                font-size: 0.8em;
                border: 1px solid #00d4ff;
            }
        </style>
        <script>
            // Auto-refresh every 5 minutes
            setTimeout(() => {
                window.location.reload();
            }, 300000);
        </script>
    </head>
    <body>
        <div class="auto-refresh">
            🔄 Auto-refresh: 5min
        </div>
        
        <div class="container">
            <h1>F1 News - USCIS Updates for International Students</h1>
            
            <div class="status-bar">
                <strong>🤖 Automated System Status:</strong><br>
                ${statusMessage}<br>
                <strong>Last Checked:</strong> ${lastCheckedStr}<br>
                <strong>Next Check:</strong> Every 6 hours (Vercel Cron)
            </div>
            
            ${articlesHtml}

            <div style="text-align: center; margin-top: 40px; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 10px;">
                <h3>🚀 F1 News - Automated USCIS Monitoring</h3>
                <p>✅ Constantly monitoring USCIS for F1-relevant updates</p>
                <p>🎯 AI-powered analysis of impact on international students</p>
                <p>🌍 Country-specific flagging for targeted information</p>
                <p>⏰ Updates every 6 hours via Vercel Cron Jobs</p>
            </div>
        </div>
    </body>
    </html>
  `);
}

module.exports = handler;