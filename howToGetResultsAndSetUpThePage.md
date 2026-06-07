## How to copy the results from Timing Ljublana to CSV file

- run ```timingLjubljanaScraper.py```
- The Chrome browser will open
- Go to the page with results, in the VS code terminal hit enter (the results for the viewed page will be saved in the ```goni_pony_results.csv```) and repeat the same process for each page with results.
- Even if you hit enter twice on the same results page, the script will handle this.
- To exit the script pres q end enter

## Get the results from the CSV to the json 

- Save the CSV file in the /data/results_in_CSV/{eventNumber}_rbgp_{year}csv_results.csv
- then in the script ```parseResultsFromCSV.py``` change the csv filename and then ran the script. 
- Now, create the new folder in the data folder with the name of the year and in it create a json file with the name of the year as 2024.json paste the data which we parse in this file.
