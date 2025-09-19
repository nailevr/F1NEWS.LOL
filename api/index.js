export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>F1 News - USCIS Updates</title>
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
            .article { 
                background: rgba(255,255,255,0.1); 
                padding: 20px; 
                margin: 20px 0; 
                border-radius: 10px;
                border-left: 4px solid #00d4ff;
            }
            .article h2 { margin: 0 0 10px 0; }
            .article p { margin: 5px 0; opacity: 0.9; }
            .flag { font-size: 1.5em; margin-left: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>F1 News - USCIS Updates for International Students</h1>
            
            <div class="article">
                <h2>West Virginia Couple Plead Guilty to Immigration Crimes</h2>
                <p><strong>Date:</strong> Sep 18, 2025</p>
                <p><strong>Impact for F1 Students:</strong> May impact F1 visa processing and student status requirements.</p>
                <p><strong>Countries Affected:</strong> <span class="flag">🇮🇳</span> India</p>
                <p><a href="https://www.uscis.gov/newsroom/news-releases/west-virginia-couple-plead-guilty-to-immigration-crimes" target="_blank" style="color: #00d4ff;">Read Full Article →</a></p>
            </div>

            <div class="article">
                <h2>Connecticut Man Sentenced to Prison for Defrauding Immigrant Clients and USCIS</h2>
                <p><strong>Date:</strong> Sep 18, 2025</p>
                <p><strong>Impact for F1 Students:</strong> Highlights importance of maintaining compliance with immigration laws and avoiding fraudulent activities.</p>
                <p><strong>Countries Affected:</strong> General impact</p>
                <p><a href="https://www.uscis.gov/newsroom/news-releases/connecticut-man-sentenced-to-prison-for-defrauding-immigrant-clients-and-uscis" target="_blank" style="color: #00d4ff;">Read Full Article →</a></p>
            </div>

            <div class="article">
                <h2>USCIS Unveils First Changes to Naturalization Test</h2>
                <p><strong>Date:</strong> Sep 17, 2025</p>
                <p><strong>Impact for F1 Students:</strong> May affect F1 students considering future pathways to citizenship after completing their studies.</p>
                <p><strong>Countries Affected:</strong> General impact</p>
                <p><a href="https://www.uscis.gov/newsroom/news-releases/uscis-unveils-first-changes-to-naturalization-test-in-multi-step-overhaul-of-american-citizenship" target="_blank" style="color: #00d4ff;">Read Full Article →</a></p>
            </div>

            <div style="text-align: center; margin-top: 40px; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 10px;">
                <h3>🚀 F1 News is Live!</h3>
                <p>Showing 3 of 72+ USCIS articles with F1-specific analysis</p>
                <p>More articles will be added as the system scales</p>
            </div>
        </div>
    </body>
    </html>
  `);
}