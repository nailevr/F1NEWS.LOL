import fs from 'fs';

// Read the articles array
const articlesContent = fs.readFileSync('articles_array.js', 'utf8');

// Read the current API template
const apiTemplate = fs.readFileSync('api/index.js', 'utf8');

// Extract the articles array content (everything between the first [ and last ])
const startIndex = articlesContent.indexOf('[');
const endIndex = articlesContent.lastIndexOf(']');
const articlesArrayContent = articlesContent.substring(startIndex, endIndex + 1);

// Replace the sampleArticles array in the API
const newApiContent = apiTemplate.replace(
  /const sampleArticles = \[[\s\S]*?\];/,
  `const sampleArticles = ${articlesArrayContent};`
);

// Write the new API file
fs.writeFileSync('api/index.js', newApiContent);

console.log('✅ Generated new API file with all 72 articles embedded');
