import csv
import os
import tempfile

SCRIPT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(SCRIPT_DIR, 'AllMoviesData.csv')

if not os.path.exists(CSV_PATH):
    print('CSV not found:', CSV_PATH)
    raise SystemExit(1)

seen = set()
rows = []
header = None
total = 0
duplicates = 0

# Try common encodings
encodings = ['utf-8-sig', 'utf-8', 'cp1252']
for enc in encodings:
    try:
        with open(CSV_PATH, 'r', newline='', encoding=enc, errors='replace') as f:
            reader = csv.DictReader(f)
            header = reader.fieldnames
            for row in reader:
                total += 1
                mid = (row.get('id') or '').strip()
                if not mid:
                    # keep rows without id
                    rows.append(row)
                    continue
                if mid in seen:
                    duplicates += 1
                    continue
                seen.add(mid)
                rows.append(row)
        read_encoding = enc
        break
    except Exception as e:
        # try next encoding
        read_encoding = None
        continue

if read_encoding is None:
    print('Failed to read CSV with tried encodings')
    raise SystemExit(1)

# Write back to temp file then replace
fd, tmp_path = tempfile.mkstemp(prefix='AllMoviesData-', suffix='.csv', dir=os.path.dirname(CSV_PATH))
with os.fdopen(fd, 'w', newline='', encoding='utf-8-sig') as out:
    writer = csv.DictWriter(out, fieldnames=header)
    writer.writeheader()
    for r in rows:
        writer.writerow(r)

# Replace original
os.replace(tmp_path, CSV_PATH)

print(f'Read encoding: {read_encoding}')
print(f'Total rows processed: {total}')
print(f'Unique rows kept: {len(rows)}')
print(f'Duplicates removed: {duplicates}')
print('Updated file:', CSV_PATH)
