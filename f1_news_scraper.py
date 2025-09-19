#!/usr/bin/env python3
"""
USCIS F1 Student News Scraper
Scrapes F1 student related news from USCIS website and makes it searchable by country
"""

import requests
from bs4 import BeautifulSoup
import json
import pandas as pd
from datetime import datetime
import re
import os
from openai import OpenAI
from typing import List, Dict, Any
import time

class USCISF1NewsScraper:
    def __init__(self, openai_api_key: str):
        self.base_url = "https://www.uscis.gov"
        self.news_url = "https://www.uscis.gov/newsroom"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        # Initialize OpenAI client
        self.openai_client = OpenAI(api_key=openai_api_key)
        
        # Keywords related to F1 students
        self.f1_keywords = [
            'f1', 'f-1', 'student visa', 'international student', 'study abroad',
            'student status', 'opt', 'optional practical training', 'stem opt',
            'sevis', 'ds-2019', 'i-20', 'student and exchange visitor program',
            'educational institution', 'university', 'college', 'academic',
            'student employment', 'curricular practical training', 'cpt',
            'grace period', 'student extension', 'transfer student',
            'student and exchange visitor', 'sevp', 'designated school official',
            'dso', 'maintaining status', 'full course of study', 'enrollment',
            'academic program', 'degree program', 'graduate program',
            'undergraduate', 'master', 'phd', 'doctoral', 'bachelor',
            'tuition', 'scholarship', 'financial support', 'sponsor',
            'dependent', 'f2', 'f-2', 'work authorization', 'employment',
            'internship', 'co-op', 'research', 'thesis', 'dissertation',
            'curriculum', 'coursework', 'semester', 'quarter', 'academic year',
            'registration', 'transcript', 'gpa', 'grade point average',
            'visa processing', 'consulate', 'embassy', 'interview',
            'documentation', 'financial documents', 'bank statements',
            'i-901', 'sevis fee', 'visa fee', 'application fee'
        ]
        
        # Country keywords for extraction
        self.country_keywords = [
            'china', 'india', 'south korea', 'canada', 'brazil', 'mexico',
            'japan', 'taiwan', 'thailand', 'vietnam', 'philippines',
            'indonesia', 'malaysia', 'singapore', 'hong kong', 'saudi arabia',
            'turkey', 'iran', 'iraq', 'afghanistan', 'bangladesh', 'pakistan',
            'nepal', 'sri lanka', 'myanmar', 'laos', 'cambodia', 'mongolia',
            'uzbekistan', 'kazakhstan', 'kyrgyzstan', 'tajikistan', 'turkmenistan',
            'azerbaijan', 'armenia', 'georgia', 'russia', 'ukraine', 'belarus',
            'moldova', 'romania', 'bulgaria', 'serbia', 'croatia', 'slovenia',
            'slovakia', 'czech republic', 'hungary', 'poland', 'lithuania',
            'latvia', 'estonia', 'finland', 'sweden', 'norway', 'denmark',
            'germany', 'austria', 'switzerland', 'liechtenstein', 'netherlands',
            'belgium', 'luxembourg', 'france', 'monaco', 'spain', 'portugal',
            'italy', 'vatican', 'san marino', 'malta', 'cyprus', 'greece',
            'albania', 'macedonia', 'montenegro', 'bosnia', 'kosovo',
            'ireland', 'united kingdom', 'island', 'lebanon', 'syria',
            'jordan', 'israel', 'palestine', 'egypt', 'libya', 'tunisia',
            'algeria', 'morocco', 'sudan', 'south sudan', 'ethiopia',
            'eritrea', 'djibouti', 'somalia', 'kenya', 'uganda', 'tanzania',
            'rwanda', 'burundi', 'madagascar', 'mauritius', 'seychelles',
            'comoros', 'malawi', 'zambia', 'zimbabwe', 'botswana', 'namibia',
            'south africa', 'lesotho', 'swaziland', 'mozambique', 'angola',
            'congo', 'central african republic', 'cameroon', 'chad', 'niger',
            'nigeria', 'benin', 'togo', 'ghana', 'burkina faso', 'mali',
            'senegal', 'gambia', 'guinea-bissau', 'guinea', 'sierra leone',
            'liberia', 'ivory coast', 'cote d\'ivoire', 'gabon', 'equatorial guinea',
            'sao tome and principe', 'cape verde', 'argentina', 'bolivia',
            'chile', 'colombia', 'ecuador', 'guyana', 'paraguay', 'peru',
            'suriname', 'uruguay', 'venezuela', 'australia', 'new zealand',
            'fiji', 'papua new guinea', 'solomon islands', 'vanuatu',
            'samoa', 'tonga', 'kiribati', 'tuvalu', 'nauru', 'palau',
            'marshall islands', 'micronesia'
        ]
    
    def is_today_news(self, date_str: str) -> bool:
        """Check if news is from today only"""
        if not date_str:
            return False  # Exclude if no date available
        
        try:
            from datetime import datetime
            
            # Try different date formats
            date_formats = [
                '%Y-%m-%d',
                '%B %d, %Y',
                '%b %d, %Y',
                '%m/%d/%Y',
                '%d/%m/%Y',
                '%Y-%m-%d %H:%M:%S',
                '%d %B %Y',
                '%d %b %Y',
                '%B %d, %Y',
                '%b %d, %Y'
            ]
            
            article_date = None
            for fmt in date_formats:
                try:
                    article_date = datetime.strptime(date_str.strip(), fmt)
                    break
                except ValueError:
                    continue
            
            if not article_date:
                return False  # Exclude if can't parse date
            
            # Check if from today
            today = datetime.now().date()
            return article_date.date() == today
            
        except Exception as e:
            print(f"Error parsing date '{date_str}': {str(e)}")
            return False  # Exclude if error parsing
    
    def scrape_news_pages(self) -> List[Dict[str, Any]]:
        """Scrape all news pages from USCIS (today only)"""
        all_news = []
        
        try:
            # Get main newsroom page
            response = self.session.get(self.news_url)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find all news links
            news_links = []
            
            # Look for news items in different sections
            for link in soup.find_all('a', href=True):
                href = link['href']
                if '/newsroom/' in href or '/news/' in href:
                    if href.startswith('/'):
                        href = self.base_url + href
                    news_links.append(href)
            
            # Also try to find specific news release pages
            news_releases_url = "https://www.uscis.gov/newsroom/news-releases"
            try:
                response = self.session.get(news_releases_url)
                response.raise_for_status()
                soup = BeautifulSoup(response.content, 'html.parser')
                
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    if '/newsroom/news-releases/' in href and href not in news_links:
                        if href.startswith('/'):
                            href = self.base_url + href
                        news_links.append(href)
            except Exception as e:
                print(f"Error scraping news releases: {str(e)}")
            
            # Try to get all news page
            all_news_url = "https://www.uscis.gov/newsroom/all-news"
            try:
                response = self.session.get(all_news_url)
                response.raise_for_status()
                soup = BeautifulSoup(response.content, 'html.parser')
                
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    if ('/newsroom/' in href or '/news/') and href not in news_links:
                        if href.startswith('/'):
                            href = self.base_url + href
                        news_links.append(href)
            except Exception as e:
                print(f"Error scraping all news: {str(e)}")
            
            # Remove duplicates
            news_links = list(set(news_links))
            
            print(f"Found {len(news_links)} news links to process")
            
            # Process each news link
            for i, link in enumerate(news_links):
                try:
                    print(f"Processing news link {i+1}/{len(news_links)}: {link}")
                    news_content = self.scrape_news_article(link)
                    if news_content:
                        # Filter for today's news only
                        if self.is_today_news(news_content.get('date', '')):
                            all_news.append(news_content)
                            print(f"  ✓ Today's news: {news_content['title'][:50]}...")
                        else:
                            print(f"  ✗ Not today's news (skipped): {news_content['title'][:50]}...")
                    
                    # Be respectful with delays
                    time.sleep(1)
                    
                except Exception as e:
                    print(f"Error processing {link}: {str(e)}")
                    continue
            
        except Exception as e:
            print(f"Error scraping news pages: {str(e)}")
        
        return all_news
    
    def scrape_news_article(self, url: str) -> Dict[str, Any]:
        """Scrape individual news article"""
        try:
            response = self.session.get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract title
            title_elem = soup.find('h1') or soup.find('title')
            title = title_elem.get_text().strip() if title_elem else "No title found"
            
            # Extract content
            content = ""
            content_elem = soup.find('div', class_='field--name-body') or soup.find('main') or soup.find('article')
            if content_elem:
                content = content_elem.get_text().strip()
            else:
                # Fallback: get all paragraph text
                paragraphs = soup.find_all('p')
                content = ' '.join([p.get_text().strip() for p in paragraphs])
            
            # Extract date
            date = None
            date_elem = soup.find('time') or soup.find('span', class_='date')
            if date_elem:
                date = date_elem.get_text().strip()
            
            # Extract author
            author = None
            author_elem = soup.find('span', class_='author') or soup.find('div', class_='author')
            if author_elem:
                author = author_elem.get_text().strip()
            
            return {
                'url': url,
                'title': title,
                'content': content,
                'date': date,
                'author': author,
                'scraped_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error scraping article {url}: {str(e)}")
            return None
    
    def is_f1_related(self, text: str) -> bool:
        """Check if content is related to F1 students"""
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self.f1_keywords)
    
    def extract_countries(self, text: str) -> List[str]:
        """Extract country mentions from text"""
        text_lower = text.lower()
        found_countries = []
        
        for country in self.country_keywords:
            if country in text_lower:
                found_countries.append(country.title())
        
        return list(set(found_countries))
    
    def summarize_with_openai(self, content: str) -> str:
        """Summarize content using OpenAI"""
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that summarizes immigration news related to F1 students. Focus on key policy changes, requirements, and important information for international students."
                    },
                    {
                        "role": "user",
                        "content": f"Please summarize the following USCIS news content, focusing on information relevant to F1 students:\n\n{content}"
                    }
                ],
                max_tokens=300,
                temperature=0.3
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"Error summarizing with OpenAI: {str(e)}")
            return "Summary unavailable"
    
    def process_and_filter_news(self, all_news: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Process news and filter for F1 related content"""
        f1_news = []
        
        for article in all_news:
            # Check if article is F1 related
            full_text = f"{article['title']} {article['content']}"
            if self.is_f1_related(full_text):
                # Extract countries
                countries = self.extract_countries(full_text)
                
                # Summarize with OpenAI
                summary = self.summarize_with_openai(article['content'])
                
                # Add processed data
                article['countries'] = countries
                article['summary'] = summary
                article['is_f1_related'] = True
                
                f1_news.append(article)
        
        return f1_news
    
    def save_to_json(self, data: List[Dict[str, Any]], filename: str):
        """Save data to JSON file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    def save_to_csv(self, data: List[Dict[str, Any]], filename: str):
        """Save data to CSV file"""
        df = pd.DataFrame(data)
        df.to_csv(filename, index=False, encoding='utf-8')
    
    def create_searchable_database(self, f1_news: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create searchable database by country"""
        country_db = {}
        
        for article in f1_news:
            for country in article['countries']:
                if country not in country_db:
                    country_db[country] = []
                country_db[country].append(article)
        
        return country_db
    
    def search_by_country(self, country_db: Dict[str, Any], country: str) -> List[Dict[str, Any]]:
        """Search news by country"""
        country_lower = country.lower()
        
        # Try exact match first
        if country_lower.title() in country_db:
            return country_db[country_lower.title()]
        
        # Try case-insensitive match
        for db_country, articles in country_db.items():
            if country_lower in db_country.lower():
                return articles
        
        return []
    
    def create_sample_f1_news(self) -> List[Dict[str, Any]]:
        """Create sample F1 news for today only"""
        from datetime import datetime, timedelta
        
        # Create timestamps for today at different times
        now = datetime.now()
        today_date = now.strftime('%Y-%m-%d')
        
        # Create different times throughout the day
        timestamps = [
            (now - timedelta(hours=2)).strftime('%Y-%m-%d %H:%M'),
            (now - timedelta(hours=4)).strftime('%Y-%m-%d %H:%M'),
            (now - timedelta(hours=6)).strftime('%Y-%m-%d %H:%M'),
            (now - timedelta(hours=8)).strftime('%Y-%m-%d %H:%M'),
            (now - timedelta(hours=10)).strftime('%Y-%m-%d %H:%M'),
            (now - timedelta(hours=12)).strftime('%Y-%m-%d %H:%M')
        ]
        
        sample_news = [
            {
                'url': 'https://www.uscis.gov/newsroom/news-releases/today-f1-policy-update',
                'title': 'USCIS Announces Today: New F1 Student Policy Updates',
                'content': 'The U.S. Citizenship and Immigration Services (USCIS) has announced significant policy updates affecting F1 students from China, India, and South Korea. The new regulations focus on Optional Practical Training (OPT) extensions and STEM degree programs. International students will now have expanded opportunities for work authorization after graduation, particularly in technology and engineering fields.',
                'date': timestamps[0],
                'author': 'USCIS Press Office',
                'scraped_at': datetime.now().isoformat(),
                'countries': ['China', 'India', 'South Korea'],
                'summary': 'USCIS announces new F1 student policy updates today, focusing on OPT extensions and STEM programs for international students from China, India, and South Korea.',
                'is_f1_related': True
            },
            {
                'url': 'https://www.uscis.gov/newsroom/news-releases/today-sevis-enhancement',
                'title': 'Enhanced SEVIS System Launched Today for F1 Students',
                'content': 'USCIS has implemented enhanced features in the Student and Exchange Visitor Information System (SEVIS) to streamline F1 student visa processing. The improvements benefit international students from Brazil, Mexico, and Canada by reducing processing times for I-20 form issuance and SEVIS fee payments.',
                'date': timestamps[1],
                'author': 'SEVIS Program Office',
                'scraped_at': datetime.now().isoformat(),
                'countries': ['Brazil', 'Mexico', 'Canada'],
                'summary': 'Enhanced SEVIS system launched today improves F1 student processing with faster I-20 issuance for students from Brazil, Mexico, and Canada.',
                'is_f1_related': True
            },
            {
                'url': 'https://www.uscis.gov/newsroom/news-releases/today-opt-extension',
                'title': 'New OPT Extension Guidelines Released Today',
                'content': 'The Department of Homeland Security has released new guidelines for Optional Practical Training (OPT) extensions for F1 students. The updated regulations affect international students from Japan, Taiwan, and Thailand, providing clearer pathways for post-graduation employment authorization.',
                'date': timestamps[2],
                'author': 'DHS Immigration Services',
                'scraped_at': datetime.now().isoformat(),
                'countries': ['Japan', 'Taiwan', 'Thailand'],
                'summary': 'New OPT extension guidelines released today provide clearer pathways for post-graduation employment authorization for F1 students from Japan, Taiwan, and Thailand.',
                'is_f1_related': True
            },
            {
                'url': 'https://www.uscis.gov/newsroom/news-releases/today-visa-processing',
                'title': 'Streamlined Visa Processing Announced Today',
                'content': 'USCIS has announced streamlined visa processing procedures specifically for F1 student applicants from Vietnam and the Philippines. The new procedures reduce interview wait times and improve document processing efficiency for university applicants.',
                'date': timestamps[3],
                'author': 'USCIS Visa Services',
                'scraped_at': datetime.now().isoformat(),
                'countries': ['Vietnam', 'Philippines'],
                'summary': 'Streamlined visa processing procedures announced today for F1 students from Vietnam and Philippines reduce wait times and improve efficiency.',
                'is_f1_related': True
            },
            {
                'url': 'https://www.uscis.gov/newsroom/news-releases/today-nigerian-students',
                'title': 'New F1 Student Guidelines for Nigerian Nationals - Today',
                'content': 'USCIS has updated its guidelines for F1 student visa processing for Nigerian nationals. The new procedures include enhanced documentation requirements and faster processing times for students attending accredited U.S. universities.',
                'date': timestamps[4],
                'author': 'USCIS Visa Services',
                'scraped_at': datetime.now().isoformat(),
                'countries': ['Nigeria'],
                'summary': 'Updated F1 student guidelines for Nigerian nationals announced today include enhanced documentation and faster processing for STEM students.',
                'is_f1_related': True
            },
            {
                'url': 'https://www.uscis.gov/newsroom/news-releases/today-european-students',
                'title': 'F1 Student Policy Changes for European Union Nationals - Today',
                'content': 'New policy changes affect F1 students from European Union countries including Germany, France, Italy, and Spain. The updates focus on work authorization during studies and post-graduation OPT opportunities.',
                'date': timestamps[5],
                'author': 'USCIS Policy Office',
                'scraped_at': datetime.now().isoformat(),
                'countries': ['Germany', 'France', 'Italy', 'Spain'],
                'summary': 'F1 policy changes for EU nationals announced today focus on work authorization for German, French, Italian, and Spanish students.',
                'is_f1_related': True
            }
        ]
        return sample_news
    
    def run_scraper(self):
        """Main method to run the scraper (today only)"""
        print("Starting USCIS F1 News Scraper (Today Only)...")
        
        # Scrape all news from today only
        print("Scraping news pages from today...")
        all_news = self.scrape_news_pages()
        print(f"Scraped {len(all_news)} today's articles")
        
        # Process and filter for F1 related content
        print("Processing and filtering for F1 related content...")
        f1_news = self.process_and_filter_news(all_news)
        print(f"Found {len(f1_news)} F1 related articles from today")
        
        # Show real news only - no sample data
        if len(f1_news) == 0:
            print("No F1 related articles found in real data from today.")
        else:
            print(f"Found {len(f1_news)} real F1 articles from today")
        
        # Create searchable database
        print("Creating searchable database...")
        country_db = self.create_searchable_database(f1_news)
        
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        print("Saving results...")
        self.save_to_json(f1_news, f"f1_news_today_{timestamp}.json")
        self.save_to_csv(f1_news, f"f1_news_today_{timestamp}.csv")
        self.save_to_json(country_db, f"f1_news_by_country_today_{timestamp}.json")
        
        print(f"Scraping completed! Results saved with timestamp: {timestamp}")
        
        return f1_news, country_db

def main():
    # Initialize scraper with OpenAI API key
    openai_api_key = os.getenv('OPENAI_API_KEY', '')
    
    scraper = USCISF1NewsScraper(openai_api_key)
    
    try:
        f1_news, country_db = scraper.run_scraper()
        
        # Display summary
        print("\n" + "="*50)
        print("SCRAPING SUMMARY")
        print("="*50)
        print(f"Total F1 related articles found: {len(f1_news)}")
        print(f"Countries with F1 news: {list(country_db.keys())}")
        
        # Show sample results
        if f1_news:
            print("\nSample articles:")
            for i, article in enumerate(f1_news[:3]):
                print(f"\n{i+1}. {article['title']}")
                print(f"   Countries: {', '.join(article['countries']) if article['countries'] else 'None'}")
                print(f"   Summary: {article['summary'][:100]}...")
        
    except Exception as e:
        print(f"Error running scraper: {str(e)}")

if __name__ == "__main__":
    main()
