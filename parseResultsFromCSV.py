import csv
import json

# Read the CSV file
csv_file_path = 'data/results_In_CSV/11_rbgp_2025_csv_results.csv'
results = []

# Function to convert time to hh:mm:ss format
def format_time(time_str):
    if len(time_str) == 7:  # format is h:mm:ss
        return "0" + time_str
    return time_str

with open(csv_file_path, mode='r', encoding='utf-8') as csv_file:
    csv_reader = csv.reader(csv_file)
    for row in csv_reader:
        if len(row) >= 5:
            place, number, surename, name, time = row[0], row[1], row[2].strip(), row[3].strip(), row[4]
            formatted_time = format_time(time)
            results.append({
                "Place": "",
                "Number": number,
                "Surename": surename if surename else "",
                "Name": name if name else "",
                "Time": formatted_time
            })

# Sort the results by time
results.sort(key=lambda x: x['Time'])

# Assign place positions
for idx, result in enumerate(results):
    result['Place'] = str(idx + 1)

# Save results to a JSON file
json_file_path = 'goni_pony_results.json'
with open(json_file_path, 'w', encoding='utf-8') as json_file:
    json.dump(results, json_file, ensure_ascii=False, indent=4)

print("Results saved to goni_pony_results.json")
