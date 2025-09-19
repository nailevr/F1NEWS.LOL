# F1 Student News Scraper

A comprehensive web scraper that extracts F1 student-related news from the USCIS website, processes the content with OpenAI, and makes it searchable by country.

## Features

- **Web Scraping**: Automatically scrapes all news articles from USCIS website
- **F1 Content Filtering**: Identifies and filters news specifically related to F1 students
- **Country Extraction**: Automatically extracts country mentions from news content
- **AI Summarization**: Uses OpenAI to summarize news articles for better readability
- **Search Interface**: Multiple ways to search and browse the data:
  - Command-line interface
  - Web interface with country and keyword search
- **Data Export**: Saves results in both JSON and CSV formats

## Installation

1. Install required dependencies:
```bash
pip install -r requirements.txt
```

2. Set up your OpenAI API key (already configured in the script)

## Usage

### 1. Scrape USCIS News

Run the main scraper to collect F1 student news:

```bash
python f1_news_scraper.py
```

This will:
- Scrape all news pages from USCIS
- Filter for F1 student-related content
- Extract country information
- Summarize content using OpenAI
- Save results to timestamped JSON and CSV files

### 2. Search the Data

#### Command Line Interface

```bash
# List all countries with F1 news
python search_interface.py --list-countries

# Search by country
python search_interface.py --country "China"

# Search by keyword
python search_interface.py --keyword "OPT"

# Show recent news (last 30 days)
python search_interface.py --recent 30
```

#### Web Interface

Start the web interface for a user-friendly search experience:

```bash
python search_interface.py --web
```

Then open your browser to `http://localhost:5000`

The web interface provides:
- Dropdown to search by country
- Text search by keyword
- Display of recent news
- Formatted results with summaries

## Data Structure

The scraper creates several output files:

### F1 News JSON (`f1_news_YYYYMMDD_HHMMSS.json`)
Contains all F1-related articles with:
- `url`: Original article URL
- `title`: Article title
- `content`: Full article content
- `date`: Publication date
- `author`: Article author (if available)
- `countries`: List of countries mentioned
- `summary`: AI-generated summary
- `scraped_at`: Timestamp when scraped

### Country Database (`f1_news_by_country_YYYYMMDD_HHMMSS.json`)
Organized by country for fast searching:
```json
{
  "China": [article1, article2, ...],
  "India": [article3, article4, ...],
  ...
}
```

### CSV Export (`f1_news_YYYYMMDD_HHMMSS.csv`)
Tabular format for spreadsheet applications

## F1 Keywords

The scraper identifies F1-related content using these keywords:
- F1, F-1, student visa, international student
- OPT, Optional Practical Training, STEM OPT
- SEVIS, DS-2019, I-20
- Student and Exchange Visitor Program
- Educational institution, university, college
- Student employment, CPT, grace period

## Country Detection

The system recognizes 150+ countries and territories for automatic country extraction and categorization.

## Technical Details

- **Rate Limiting**: Includes delays between requests to be respectful to USCIS servers
- **Error Handling**: Robust error handling for network issues and parsing problems
- **Data Validation**: Validates and cleans scraped data
- **OpenAI Integration**: Uses GPT-3.5-turbo for content summarization
- **Web Interface**: Flask-based web application for easy browsing

## Output Example

After running the scraper, you'll see output like:

```
Starting USCIS F1 News Scraper...
Scraping news pages...
Found 45 news links to process
Processing news link 1/45: https://www.uscis.gov/newsroom/news-releases/...
Processing and filtering for F1 related content...
Found 12 F1 related articles
Creating searchable database...
Saving results...
Scraping completed! Results saved with timestamp: 20241218_143022

==================================================
SCRAPING SUMMARY
==================================================
Total F1 related articles found: 12
Countries with F1 news: ['China', 'India', 'South Korea', 'Canada']

Sample articles:

1. USCIS Announces New F1 Student Policy Changes
   Countries: China, India
   Summary: USCIS has announced significant policy changes affecting F1 students...

2. OPT Extension Guidelines for STEM Students
   Countries: South Korea, Canada
   Summary: New guidelines for STEM OPT extensions have been released...
```

## Troubleshooting

- **No data found**: Ensure you have internet connection and USCIS website is accessible
- **OpenAI errors**: Check your API key and quota
- **Web interface issues**: Make sure port 5000 is available
- **Parsing errors**: Some articles may have different HTML structure

## Legal Notice

This scraper is for educational and research purposes. Please respect USCIS website terms of service and use responsibly.

