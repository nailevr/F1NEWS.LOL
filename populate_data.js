import fs from 'fs';

// Read the converted articles
const convertedData = JSON.parse(fs.readFileSync('converted_articles.json', 'utf8'));
const articles = convertedData.articles || [];

console.log(`Found ${articles.length} articles to add to data.js`);

// Generate the data.js file content
let dataJsContent = `// All ${articles.length} USCIS articles with F1 analysis
const articlesData = [`;

articles.forEach((article, index) => {
  dataJsContent += `
  {
    "title": ${JSON.stringify(article.title)},
    "url": ${JSON.stringify(article.url)},
    "date": ${JSON.stringify(article.date)},
    "content": ${JSON.stringify(article.content || "")},
    "countries": ${JSON.stringify(article.countries || [])},
    "summary": ${JSON.stringify(article.summary)}
  }`;
  
  if (index < articles.length - 1) {
    dataJsContent += ',';
  }
});

dataJsContent += `
];

// Load all articles from converted data
const loadAllArticles = () => {
  try {
    // In a real implementation, this would load from a database
    // For now, we'll return the embedded data
    return articlesData;
  } catch (error) {
    console.error('Error loading articles:', error);
    return articlesData; // Fallback to embedded data
  }
};

module.exports = {
  articlesData,
  loadAllArticles
};`;

// Write the new data.js file
fs.writeFileSync('api/data.js', dataJsContent);

console.log(`✅ Generated api/data.js with ${articles.length} articles`);
console.log(`📁 File size: ${(fs.statSync('api/data.js').size / 1024).toFixed(1)} KB`);
