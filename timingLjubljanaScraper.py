import csv
from selenium import webdriver
from selenium.webdriver.common.by import By

def semi_auto_scraper():
    url = "https://www.timingljubljana.si/rezultati.aspx?IDtekme=6983&tip=B"
    
    print("Starting browser...")
    driver = webdriver.Chrome()
    driver.get(url)
    
    print("\nBrowser opened! Navigate to the first results page (M or Z).")
    
    # Track unique page signatures to prevent duplicate entries
    # Signature format: (first_rank, first_bib, last_rank, last_bib)
    scraped_pages_registry = set()
    
    with open('goni_pony_results_2026.csv', 'w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file, quoting=csv.QUOTE_NONNUMERIC)
        
        while True:
            user_input = input("\n👉 Press [ENTER] to scrape the current visible table, or type 'q' to quit: ")
            
            if user_input.lower() == 'q':
                print("Closing scraper...")
                break
                
            try:
                # Target the exact table ID
                rows = driver.find_elements(By.CSS_SELECTOR, "#MainContent_GridView1 tr")
                
                if not rows:
                    print("⚠️ No table found! Double check the browser window.")
                    continue
                    
                page_data = []
                for row in rows:
                    # Skip the header row
                    if row.find_elements(By.TAG_NAME, "th"):
                        continue
                        
                    cols = row.find_elements(By.TAG_NAME, "td")
                    if len(cols) >= 5:
                        try:
                            rank = int(cols[0].text.strip().replace('.', ''))
                            bib = int(cols[1].text.strip())
                            last_name = cols[2].text.strip()   # Priimek
                            first_name = cols[3].text.strip()  # Ime
                            time_val = cols[4].text.strip()    # Rezultat
                            
                            # ADDED: Filter out the footer pagination row (e.g. 1, 2, "3", "4", "5")
                            # Real names won't be purely numeric, so this safely ignores the page links.
                            if last_name.isdigit() or first_name.isdigit():
                                continue
                            
                            page_data.append([rank, bib, last_name, first_name, time_val])
                        except ValueError:
                            continue
                
                if not page_data:
                    print("⚠️ No valid data rows found on this page.")
                    continue
                
                # Identify boundary rows for visualization and validation
                first_runner = page_data[0]
                last_runner = page_data[-1]
                
                # Generate a unique tracking signature for this specific page layout
                page_signature = (first_runner[0], first_runner[1], last_runner[0], last_runner[1])
                
                # 1. Print out the exact visual confirmation you requested
                print("\n--- 📋 PAGE BOUNDARY DATA ---")
                print(f"First Row -> {first_runner[0]},{first_runner[1]},\"{first_runner[2]}\",\"{first_runner[3]}\",\"{first_runner[4]}\"")
                print(f"Last Row  -> {last_runner[0]},{last_runner[1]},\"{last_runner[2]}\",\"{last_runner[3]}\",\"{last_runner[4]}\"")
                print("----------------------------")
                
                # 2. Check registry to block accidental duplicate parsing
                if page_signature in scraped_pages_registry:
                    print("❌ SKIPPED: You already scraped this exact page! (No duplicates added)")
                    continue
                    
                # 3. If unique, commit to file and register the signature
                for data_row in page_data:
                    writer.writerow(data_row)
                    
                scraped_pages_registry.add(page_signature)
                print(f"✅ Successfully scraped {len(page_data)} rows from this page!")
                file.flush() 
                
            except Exception as e:
                print(f"❌ An error occurred: {e}")

    driver.quit()
    print("All done! Data is safely stored in goni_pony_results.csv")

if __name__ == "__main__":
    semi_auto_scraper()