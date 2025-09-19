const express = require('express');
const { loadAllArticles } = require('./data');

const app = express();

// Generate HTML template
function generateHTML(articles) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>F1 News - USCIS Updates for International Students</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: #ffffff;
            min-height: 100vh;
            line-height: 1.6;
        }

        .header {
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            padding: 20px 0;
            text-align: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #00d4ff, #0099cc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .header p {
            font-size: 1.1rem;
            color: #cccccc;
            max-width: 600px;
            margin: 0 auto;
        }

        .stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin: 30px 0;
            flex-wrap: wrap;
        }

        .stat-item {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px 25px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(5px);
            text-align: center;
            min-width: 120px;
        }

        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #00d4ff;
            display: block;
        }

        .stat-label {
            font-size: 0.9rem;
            color: #cccccc;
            margin-top: 5px;
        }

        .timeline {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
            position: relative;
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
            margin-bottom: 80px;
            padding-top: 20px;
            padding-bottom: 40px;
            border-bottom: 1px dashed #ffffff;
            z-index: 1;
        }

        .timeline-item:last-child {
            border-bottom: none;
        }

        .timeline-dot {
            position: absolute;
            left: 200px;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 12px;
            height: 12px;
            background: #00d4ff;
            border: 3px solid #ffffff;
            border-radius: 50%;
            z-index: 20;
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
            position: relative;
            left: 220px;
            right: 260px;
            z-index: 0;
        }

        .timeline-rectangle {
            background: rgba(255, 255, 255, 0.1);
            padding: 25px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .timeline-clickable {
            text-decoration: none;
            display: block;
            transition: background-color 0.3s ease;
        }

        .timeline-clickable:hover {
            background-color: #333333;
        }

        .timeline-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 10px;
            line-height: 1.4;
        }

        .timeline-summary {
            font-size: 0.6rem;
            line-height: 1.3;
            color: #cccccc;
            margin-top: 5px;
            white-space: pre-line;
        }

        .timeline-flags {
            position: absolute;
            right: 100px;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            gap: 6px;
            background: transparent;
            border: none;
            border-radius: none;
            padding: 4px 8px;
            font-size: 0.8rem;
            z-index: 10;
            white-space: nowrap;
        }

        @media (max-width: 768px) {
            .header h1 {
                font-size: 2rem;
            }
            
            .stats {
                gap: 15px;
            }
            
            .stat-item {
                padding: 10px 15px;
                min-width: 100px;
            }
            
            .timeline-line {
                left: 100px;
            }
            
            .timeline-line-right {
                right: 100px;
            }
            
            .timeline-dot {
                left: 100px;
            }
            
            .timeline-date {
                left: 50px;
                font-size: 0.7rem;
            }
            
            .timeline-content {
                left: 120px;
                right: 120px;
            }
            
            .timeline-flags {
                right: 50px;
                font-size: 0.7rem;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>F1 News</h1>
        <p>USCIS updates and policy changes affecting international students on F1 visas</p>
    </div>

    <div class="stats">
        <div class="stat-item">
            <span class="stat-number">${articles.length}</span>
            <div class="stat-label">Total Articles</div>
        </div>
        <div class="stat-item">
            <span class="stat-number">0</span>
            <div class="stat-label">Today</div>
        </div>
        <div class="stat-item">
            <span class="stat-number">all</span>
            <div class="stat-label">Filter</div>
        </div>
    </div>

    <div class="timeline">
        <div class="timeline-line"></div>
        <div class="timeline-line-right"></div>
        <div id="timeline-content">
            ${articles.map(article => {
              const date = new Date(article.date);
              const dateStr = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                timeZone: 'America/New_York'
              });
              
              const flagsHtml = article.countries && article.countries.length > 0 
                ? article.countries.map(country => country.flag).join('')
                : '';
              
              return `
                <div class="timeline-item">
                    <div class="timeline-dot"></div>
                    <div class="timeline-date">${dateStr}</div>
                    <div class="timeline-content">
                        <a href="${article.url}" target="_blank" class="timeline-rectangle timeline-clickable">
                            <div class="timeline-title">${article.title}</div>
                            <div class="timeline-summary">${article.summary}</div>
                        </a>
                    </div>
                    <div class="timeline-flags">${flagsHtml}</div>
                </div>
              `;
            }).join('')}
        </div>
    </div>

    <script>
        window.newsData = {
            articles: ${JSON.stringify(articles)},
            summaries: {}
        };
    </script>
</body>
</html>`;
}

// Routes
app.get('/', (req, res) => {
  try {
    const articles = loadAllArticles();
    const html = generateHTML(articles);
    res.send(html);
  } catch (error) {
    console.error('Error generating HTML:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/api/scrape', (req, res) => {
  try {
    const articles = loadAllArticles();
    res.json({ 
      success: true, 
      message: 'Articles loaded successfully',
      articles: articles,
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
module.exports = app;
