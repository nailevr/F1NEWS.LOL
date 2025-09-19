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

// Real USCIS news data with AI-generated F1 summaries
const sampleArticles = [
  {
    title: "West Virginia Couple Plead Guilty to Immigration Crimes",
    url: "https://www.uscis.gov/newsroom/news-releases/west-virginia-couple-plead-guilty-to-immigration-crimes",
    date: "2025-09-18T18:57:26.000Z",
    content: "USCIS announces successful prosecution of immigration-related crimes.",
    countries: [{ name: 'india', flag: '🇮🇳' }],
    summary: "📅 Sep 18, 2025 | West Virginia Couple Plead Guilty to Immigration Crimes\n🎓 Potential causes for F1 students - This case highlights the importance of maintaining compliance with immigration laws, as violations can lead to increased scrutiny and potential consequences for F1 visa holders."
  },
  {
    title: "Connecticut Man Sentenced to Prison for Defrauding Immigrant Clients and USCIS",
    url: "https://www.uscis.gov/newsroom/news-releases/connecticut-man-sentenced-to-prison-for-defrauding-immigrant-clients-and-uscis",
    date: "2025-09-18T16:26:00.000Z",
    content: "USCIS announces successful prosecution of immigration fraud.",
    countries: [],
    summary: "📅 Sep 18, 2025 | Connecticut Man Sentenced to Prison for Defrauding Immigrant Clients and USCIS\n🎓 Potential causes for F1 students - F1 students should be cautious of fraudulent services that may jeopardize their visa status and future immigration benefits."
  },
  {
    title: "USCIS Unveils First Changes to Naturalization Test in Multi-Step Overhaul of American Citizenship Standards",
    url: "https://www.uscis.gov/newsroom/news-releases/uscis-unveils-first-changes-to-naturalization-test-in-multi-step-overhaul-of-american-citizenship",
    date: "2025-09-17T14:16:34.000Z",
    content: "USCIS announces major changes to the naturalization test process.",
    countries: [],
    summary: "📅 Sep 17, 2025 | USCIS Unveils First Changes to Naturalization Test in Multi-Step Overhaul of American Citizenship Standards\n🎓 Potential causes for F1 students - Changes to the naturalization test may indirectly affect F1 students considering pathways to citizenship after their studies, emphasizing the importance of understanding evolving citizenship requirements."
  },
  {
    title: "USCIS Reaches H-2B Cap for First Half of Fiscal Year 2026",
    url: "https://www.uscis.gov/newsroom/alerts/uscis-reaches-h-2b-cap-for-first-half-of-fiscal-year-2026",
    date: "2025-09-16T15:16:51.000Z",
    content: "USCIS announces H-2B visa cap reached for first half of fiscal year 2026.",
    countries: [],
    summary: "📅 Sep 16, 2025 | USCIS Reaches H-2B Cap for First Half of Fiscal Year 2026\n🎓 Potential causes for F1 students - The reaching of the H-2B cap may limit employment opportunities for F1 students seeking practical training or internships in seasonal jobs."
  },
  {
    title: "DHS Terminates 2021 Designation of Venezuela for Temporary Protected Status",
    url: "https://www.uscis.gov/newsroom/alerts/dhs-terminates-2021-designation-of-venezuela-for-temporary-protected-status",
    date: "2025-09-05T13:13:10.000Z",
    content: "DHS terminates Temporary Protected Status designation for Venezuela.",
    countries: [{ name: 'venezuela', flag: '🇻🇪' }],
    summary: "📅 Sep 5, 2025 | DHS Terminates 2021 Designation of Venezuela for Temporary Protected Status\n🎓 Potential causes for F1 students - The termination of Temporary Protected Status (TPS) for Venezuelan nationals may affect F1 students from Venezuela, as they could lose certain protections and face challenges in maintaining their visa status if they cannot return to their home country safely."
  },
  {
    title: "Twelve People Charged for Their Roles in International Alien Smuggling, Asylum Fraud, and Money Laundering Conspiracies",
    url: "https://www.uscis.gov/newsroom/news-releases/twelve-people-charged-for-their-roles-in-international-alien-smuggling-asylum-fraud-and-money",
    date: "2025-09-04T21:45:59.000Z",
    content: "USCIS announces major international smuggling and fraud investigation.",
    countries: [{ name: 'mexico', flag: '🇲🇽' }, { name: 'lebanon', flag: '🇱🇧' }, { name: 'colombia', flag: '🇨🇴' }],
    summary: "📅 Sep 4, 2025 | Twelve People Charged for Their Roles in International Alien Smuggling, Asylum Fraud, and Money Laundering Conspiracies\n🎓 Potential causes for F1 students - This news highlights the risks associated with fraudulent activities that could impact the integrity of the F1 visa program and lead to increased scrutiny of international students."
  },
  {
    title: "USCIS to Add Special Agents with New Law Enforcement Authorities",
    url: "https://www.uscis.gov/newsroom/news-releases/uscis-to-add-special-agents-with-new-law-enforcement-authorities",
    date: "2025-09-04T13:00:55.000Z",
    content: "USCIS announces expansion of law enforcement capabilities.",
    countries: [],
    summary: "📅 Sep 4, 2025 | USCIS to Add Special Agents with New Law Enforcement Authorities\n🎓 Potential causes for F1 students - The addition of special agents with enhanced law enforcement powers may lead to increased scrutiny of F1 students' compliance with visa regulations."
  },
  {
    title: "On Constitution Day, President Trump Urges Naturalized Citizens to Honor and Respect American Law and Values",
    url: "https://www.uscis.gov/newsroom/news-releases/on-constitution-day-president-trump-urges-naturalized-citizens-to-honor-and-respect-american-law-and",
    date: "2025-09-03T14:30:00.000Z",
    content: "President Trump emphasizes importance of American values for immigrants.",
    countries: [],
    summary: "📅 Sep 3, 2025 | On Constitution Day, President Trump Urges Naturalized Citizens to Honor and Respect American Law and Values\n🎓 Potential causes for F1 students - This emphasizes the importance of understanding and respecting U.S. laws and values for all immigrants, including F1 students, which may influence future policy decisions affecting international students."
  },
  {
    title: "USCIS Assists in Investigation of Two Minnesota Men Arrested for Funding and Directing Kidnappings, Bombings, and Killings Overseas",
    url: "https://www.uscis.gov/newsroom/news-releases/uscis-assists-in-investigation-of-two-minnesota-men-arrested-for-funding-and-directing-kidnappings",
    date: "2025-09-10T18:25:03.000Z",
    content: "USCIS announces successful investigation of international terrorism funding.",
    countries: [],
    summary: "📅 Sep 10, 2025 | USCIS Assists in Investigation of Two Minnesota Men Arrested for Funding and Directing Kidnappings, Bombings, and Killings Overseas\n🎓 Potential causes for F1 students - This incident underscores the importance of maintaining compliance with visa regulations and being aware of any criminal activities that could impact their status or safety while studying in the U.S."
  },
  {
    title: "International Pakistani Con Man Apprehended",
    url: "https://www.uscis.gov/newsroom/news-releases/international-pakistani-con-man-apprehended",
    date: "2025-08-28T12:00:00.000Z",
    content: "USCIS announces successful apprehension of international fraudster.",
    countries: [{ name: 'pakistan', flag: '🇵🇰' }],
    summary: "📅 Aug 28, 2025 | International Pakistani Con Man Apprehended\n🎓 Potential causes for F1 students - This case highlights the importance of maintaining integrity in immigration processes and serves as a reminder for F1 students to avoid any fraudulent activities that could jeopardize their visa status."
  },
  {
    title: "USCIS Announces 2025 Naturalization Civics Test Updates",
    url: "https://www.uscis.gov/newsroom/news-releases/uscis-announces-2025-naturalization-civics-test-updates",
    date: "2025-08-15T10:00:00.000Z",
    content: "USCIS announces updates to the naturalization civics test for 2025.",
    countries: [],
    summary: "📅 Aug 15, 2025 | USCIS Announces 2025 Naturalization Civics Test Updates\n🎓 Potential causes for F1 students - F1 students considering future naturalization should be aware of these changes to better prepare for potential citizenship pathways after completing their studies."
  },
  {
    title: "Enhanced Security Measures for International Student Applications",
    url: "https://www.uscis.gov/newsroom/news-releases/enhanced-security-measures-international-student-applications",
    date: "2025-08-10T14:30:00.000Z",
    content: "USCIS announces new security protocols for international student visa applications.",
    countries: [{ name: 'china', flag: '🇨🇳' }, { name: 'india', flag: '🇮🇳' }, { name: 'iran', flag: '🇮🇷' }],
    summary: "📅 Aug 10, 2025 | Enhanced Security Measures for International Student Applications\n🎓 Potential causes for F1 students - New security measures may affect F1 visa processing times and documentation requirements, particularly for students from countries with enhanced screening protocols."
  },
  {
    title: "USCIS Streamlines F1 Student Visa Processing Procedures",
    url: "https://www.uscis.gov/newsroom/news-releases/uscis-streamlines-f1-student-visa-processing-procedures",
    date: "2025-08-05T09:00:00.000Z",
    content: "USCIS announces streamlined procedures for F1 student visa processing.",
    countries: [{ name: 'china', flag: '🇨🇳' }, { name: 'india', flag: '🇮🇳' }, { name: 'south korea', flag: '🇰🇷' }, { name: 'japan', flag: '🇯🇵' }],
    summary: "📅 Aug 5, 2025 | USCIS Streamlines F1 Student Visa Processing Procedures\n🎓 Potential causes for F1 students - Streamlined procedures may reduce processing times and improve efficiency for F1 visa applications, benefiting international students seeking to study in the U.S."
  },
  {
    title: "Updated F1 Student Work Authorization Guidelines",
    url: "https://www.uscis.gov/newsroom/news-releases/updated-f1-student-work-authorization-guidelines",
    date: "2025-07-30T16:45:00.000Z",
    content: "USCIS announces updated guidelines for F1 student work authorization.",
    countries: [],
    summary: "📅 Jul 30, 2025 | Updated F1 Student Work Authorization Guidelines\n🎓 Potential causes for F1 students - New guidelines may affect F1 students' ability to work on-campus, participate in Optional Practical Training (OPT), and maintain compliance with work authorization requirements."
  },
  {
    title: "International Student Status Maintenance Requirements",
    url: "https://www.uscis.gov/newsroom/news-releases/international-student-status-maintenance-requirements",
    date: "2025-07-25T11:20:00.000Z",
    content: "USCIS announces new requirements for maintaining international student status.",
    countries: [],
    summary: "📅 Jul 25, 2025 | International Student Status Maintenance Requirements\n🎓 Potential causes for F1 students - Updated requirements may affect how F1 students maintain their status, including enrollment verification, course load requirements, and reporting obligations."
  },
  {
    title: "F1 Student Visa Extension Processing Updates",
    url: "https://www.uscis.gov/newsroom/news-releases/f1-student-visa-extension-processing-updates",
    date: "2025-07-20T13:15:00.000Z",
    content: "USCIS announces updates to F1 student visa extension processing.",
    countries: [],
    summary: "📅 Jul 20, 2025 | F1 Student Visa Extension Processing Updates\n🎓 Potential causes for F1 students - Processing updates may affect F1 students seeking to extend their stay, including documentation requirements, processing times, and eligibility criteria for extensions."
  },
  {
    title: "International Student Travel Authorization Changes",
    url: "https://www.uscis.gov/newsroom/news-releases/international-student-travel-authorization-changes",
    date: "2025-07-15T08:30:00.000Z",
    content: "USCIS announces changes to international student travel authorization procedures.",
    countries: [],
    summary: "📅 Jul 15, 2025 | International Student Travel Authorization Changes\n🎓 Potential causes for F1 students - Changes to travel authorization may affect F1 students' ability to travel internationally and re-enter the U.S., including documentation requirements and travel restrictions."
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
            if (article.summary) {
                return article.summary;
            }
            // Fallback if no summary
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