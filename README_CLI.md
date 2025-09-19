# USCIS Weekly News Summarizer

Scrapes USCIS newsroom (news releases + alerts) for the last 7 days and summarizes with OpenAI.

## Setup
```bash
npm install   # or yarn install
cp env.example .env
# set OPENAI_API_KEY in .env
```

## Run
```bash
npm start
```

Outputs to console and writes `uscis_news_summary.md`.

## Features

- **Respectful scraping**: 10-second delays between requests (per robots.txt)
- **Smart date parsing**: Handles multiple date formats
- **OpenAI integration**: Summarizes news with AI
- **Markdown output**: Clean, readable format
- **Error handling**: Graceful failure for individual articles

## Files Created

- `uscis_news_summary.md` - Generated report
- `package.json` - Dependencies
- `src/index.js` - Main script
- `env.example` - Environment template

## USCIS robots.txt Compliance

✅ **Allowed**: Newsroom sections (`/newsroom/news-releases`, `/newsroom/alerts`)  
✅ **Respectful**: 10-second crawl delays  
❌ **Blocked**: Admin areas, user accounts, data exports  

The scraper only accesses publicly available newsroom content and respects USCIS's crawl delay requirements.

