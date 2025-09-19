import fs from 'fs';

// Country flag mapping
const COUNTRY_FLAGS = {
  'china': '🇨🇳', 'india': '🇮🇳', 'mexico': '🇲🇽', 'philippines': '🇵🇭', 'vietnam': '🇻🇳',
  'south korea': '🇰🇷', 'japan': '🇯🇵', 'thailand': '🇹🇭', 'indonesia': '🇮🇩', 'bangladesh': '🇧🇩',
  'pakistan': '🇵🇰', 'iran': '🇮🇷', 'turkey': '🇹🇷', 'egypt': '🇪🇬', 'nigeria': '🇳🇬',
  'ethiopia': '🇪🇹', 'kenya': '🇰🇪', 'ghana': '🇬🇭', 'brazil': '🇧🇷', 'colombia': '🇨🇴',
  'peru': '🇵🇪', 'venezuela': '🇻🇪', 'ecuador': '🇪🇨', 'argentina': '🇦🇷', 'chile': '🇨🇱',
  'ukraine': '🇺🇦', 'russia': '🇷🇺', 'poland': '🇵🇱', 'romania': '🇷🇴', 'bulgaria': '🇧🇬',
  'croatia': '🇭🇷', 'serbia': '🇷🇸', 'bosnia': '🇧🇦', 'albania': '🇦🇱', 'moldova': '🇲🇩',
  'belarus': '🇧🇾', 'lithuania': '🇱🇹', 'latvia': '🇱🇻', 'estonia': '🇪🇪', 'czech republic': '🇨🇿',
  'slovakia': '🇸🇰', 'hungary': '🇭🇺', 'slovenia': '🇸🇮', 'spain': '🇪🇸', 'portugal': '🇵🇹',
  'france': '🇫🇷', 'italy': '🇮🇹', 'germany': '🇩🇪', 'netherlands': '🇳🇱', 'belgium': '🇧🇪',
  'austria': '🇦🇹', 'switzerland': '🇨🇭', 'united kingdom': '🇬🇧', 'ireland': '🇮🇪',
  'denmark': '🇩🇰', 'sweden': '🇸🇪', 'norway': '🇳🇴', 'finland': '🇫🇮', 'iceland': '🇮🇸',
  'greece': '🇬🇷', 'cyprus': '🇨🇾', 'malta': '🇲🇹', 'canada': '🇨🇦', 'australia': '🇦🇺',
  'new zealand': '🇳🇿', 'south africa': '🇿🇦', 'israel': '🇮🇱', 'lebanon': '🇱🇧', 'jordan': '🇯🇴',
  'syria': '🇸🇾', 'iraq': '🇮🇶', 'afghanistan': '🇦🇫', 'nepal': '🇳🇵', 'sri lanka': '🇱🇰',
  'myanmar': '🇲🇲', 'cambodia': '🇰🇭', 'laos': '🇱🇦', 'mongolia': '🇲🇳', 'taiwan': '🇹🇼',
  'hong kong': '🇭🇰', 'singapore': '🇸🇬', 'malaysia': '🇲🇾', 'brunei': '🇧🇳',
  'cuba': '🇨🇺', 'guatemala': '🇬🇹', 'honduras': '🇭🇳', 'el salvador': '🇸🇻', 'panama': '🇵🇦'
};

function generateSummary(article) {
  const dateStr = new Date(article.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/New_York'
  });
  const title = article.title.toLowerCase();
  const isF1Related = title.includes('f1') || title.includes('student') || title.includes('visa') ||
                     title.includes('international') || title.includes('immigration');
  const emoji = isF1Related ? '🎓' : '📋';
  
  let impact = 'General immigration policy change that may indirectly affect student visa holders.';
  if (isF1Related) {
    impact = 'May impact F1 visa processing and student status requirements.';
  } else if (title.includes('fraud') || title.includes('crime')) {
    impact = 'Highlights importance of maintaining compliance with immigration laws and avoiding fraudulent activities that could jeopardize F1 visa status.';
  } else if (title.includes('naturalization') || title.includes('citizenship')) {
    impact = 'May affect F1 students considering future pathways to citizenship after completing their studies.';
  } else if (title.includes('work') || title.includes('employment')) {
    impact = 'May impact F1 students\' work authorization and employment opportunities.';
  } else if (title.includes('travel') || title.includes('entry')) {
    impact = 'May affect F1 students\' ability to travel internationally and re-enter the U.S.';
  }
  
  return `${emoji} ${dateStr} | ${article.title}
🎓 Potential causes for F1 students - ${impact}`;
}

// Load localhost data
const localhostData = JSON.parse(fs.readFileSync('uscis_news_data.json', 'utf8'));
const articles = localhostData.articles || [];

console.log(`Converting ${articles.length} articles from localhost to deployed format...`);

// Convert articles to deployed format
const convertedArticles = articles.map(article => {
  // Convert countries to flag format
  const countries = [];
  if (article.countries && article.countries.length > 0) {
    article.countries.forEach(country => {
      const countryLower = country.toLowerCase();
      if (COUNTRY_FLAGS[countryLower]) {
        countries.push({ name: countryLower, flag: COUNTRY_FLAGS[countryLower] });
      }
    });
  }
  
  // Generate summary
  const summary = generateSummary(article);
  
  return {
    title: article.title,
    url: article.url,
    date: article.date,
    content: article.content || '',
    countries: countries,
    summary: summary
  };
});

// Save converted data
const output = {
  articles: convertedArticles,
  lastUpdated: new Date().toISOString(),
  totalCount: convertedArticles.length
};

fs.writeFileSync('converted_articles.json', JSON.stringify(output, null, 2));
console.log(`✅ Converted ${convertedArticles.length} articles and saved to converted_articles.json`);

// Also create a JavaScript array format for the API
const jsArray = `const allArticles = ${JSON.stringify(convertedArticles, null, 2)};`;
fs.writeFileSync('articles_array.js', jsArray);
console.log(`✅ Created JavaScript array format in articles_array.js`);
