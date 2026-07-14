import csv
import os
import time
import tempfile
import requests

# ============================================================
# ENV LOADING
# ============================================================

def load_dotenv(dotenv_path):
    if not os.path.exists(dotenv_path):
        return

    with open(dotenv_path, "r", encoding="utf-8") as file:
        for line in file:
            line = line.strip()
            if not line or line.startswith("#"):
                continue

            if "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")

            if key and value and key not in os.environ:
                os.environ[key] = value


# ============================================================
# CONFIGURATION
# ============================================================

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(SCRIPT_DIR, ".env"))

TMDB_API_KEY = os.getenv("TMDB_API_KEY")

TMDB_BASE_URL = "https://api.themoviedb.org/3"

MAX_PAGES = 1000
REQUEST_DELAY = 0.15

# Save every 3,000 movies
SAVE_BATCH_SIZE = 3000

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE = os.path.join(SCRIPT_DIR, "AllMoviesData.csv")

CATEGORY_ENDPOINTS = [
    ("now_playing", "/movie/now_playing"),
    ("upcoming", "/movie/upcoming"),
    ("trending", "/trending/movie/week"),
]


# ============================================================
# CSV FIELDS
# ============================================================

FIELDS = [
    "id",
    "title",
    "original_title",
    "overview",
    "release_date",
    "original_language",
    "popularity",
    "vote_average",
    "vote_count",
    "poster_path",
    "backdrop_path",
    "adult",
    "genre_ids",
]


# ============================================================
# VALIDATE CONFIGURATION
# ============================================================

if not TMDB_API_KEY:
    raise RuntimeError(
        "TMDB_API_KEY environment variable is missing."
    )


# ============================================================
# CONVERT MOVIE TO CSV ROW
# ============================================================

def movie_to_row(movie):
    return {
        "id": movie.get("id"),
        "title": movie.get("title"),
        "original_title": movie.get("original_title"),
        "overview": movie.get("overview"),
        "release_date": movie.get("release_date"),
        "original_language": movie.get("original_language"),
        "popularity": movie.get("popularity"),
        "vote_average": movie.get("vote_average"),
        "vote_count": movie.get("vote_count"),
        "poster_path": movie.get("poster_path"),
        "backdrop_path": movie.get("backdrop_path"),
        "adult": movie.get("adult"),
        "genre_ids": ",".join(
            map(str, movie.get("genre_ids", []))
        ),
    }


# ============================================================
# SAVE BATCH TO CSV
# ============================================================

def save_batch_to_csv(movies, write_header=False):

    if not movies:
        return

    mode = "w" if write_header else "a"

    with open(
        CSV_FILE,
        mode,
        newline="",
        encoding="utf-8-sig" if write_header else "utf-8",
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=FIELDS,
        )

        if write_header:
            writer.writeheader()

        for movie in movies:
            writer.writerow(
                movie_to_row(movie)
            )

        # Force buffered data to disk
        file.flush()
        os.fsync(file.fileno())

    print()
    print("========================================")
    print(f"Saved batch: {len(movies):,} movies")
    print(f"CSV file: {CSV_FILE}")
    print("========================================")
    print()


def dedupe_csv():
    """Remove duplicate rows by `id` in the CSV, keeping the first occurrence.

    Tries common encodings when reading, writes back in UTF-8 with BOM
    to preserve compatibility with other tools used in this repo.
    """

    if not os.path.exists(CSV_FILE):
        print("No CSV to dedupe.")
        return

    encodings = ["utf-8-sig", "utf-8", "cp1252"]
    rows = None
    header = None
    read_enc = None

    for enc in encodings:
        try:
            with open(CSV_FILE, "r", newline="", encoding=enc, errors="replace") as f:
                reader = csv.DictReader(f)
                header = reader.fieldnames
                rows = list(reader)
            read_enc = enc
            break
        except Exception:
            continue

    if rows is None:
        print("Failed to read CSV for dedupe; skipping.")
        return

    seen = set()
    out_rows = []
    dup_count = 0

    for r in rows:
        mid = (r.get("id") or "").strip()
        if not mid:
            out_rows.append(r)
            continue
        if mid in seen:
            dup_count += 1
            continue
        seen.add(mid)
        out_rows.append(r)

    if dup_count == 0:
        print("No duplicate IDs found in CSV.")
        return

    # Write to temp and replace original
    dirpath = os.path.dirname(CSV_FILE)
    fd, tmp_path = tempfile.mkstemp(prefix="AllMoviesData-", suffix=".csv", dir=dirpath)
    try:
        with os.fdopen(fd, "w", newline="", encoding="utf-8-sig") as out:
            writer = csv.DictWriter(out, fieldnames=header)
            writer.writeheader()
            for r in out_rows:
                writer.writerow(r)

        os.replace(tmp_path, CSV_FILE)
        print(f"Dedupe complete. Removed {dup_count:,} duplicate rows. Wrote cleaned CSV: {CSV_FILE}")
    except Exception as e:
        try:
            os.remove(tmp_path)
        except Exception:
            pass
        print("Failed to write deduped CSV:", e)


# ============================================================
# FETCH MOVIES
# ============================================================

def load_existing_movie_ids():
    existing_ids = set()

    if not os.path.exists(CSV_FILE):
        return existing_ids

    for encoding in ("utf-8-sig", "utf-8", "cp1252"):
        try:
            with open(
                CSV_FILE,
                "r",
                newline="",
                encoding=encoding,
                errors="replace",
            ) as file:
                reader = csv.DictReader(file)
                for row in reader:
                    movie_id = row.get("id")
                    if movie_id:
                        try:
                            existing_ids.add(int(movie_id))
                        except ValueError:
                            continue
            return existing_ids
        except UnicodeDecodeError:
            continue
        except Exception as error:
            print(f"Warning: failed to load existing CSV IDs using {encoding}: {error}")
            return existing_ids

    print(
        "Warning: failed to load existing CSV IDs. Please check AllMoviesData.csv encoding."
    )
    return existing_ids


def fetch_movies():
    existing_ids = load_existing_movie_ids()
    batch = []
    total_saved = 0

    if not os.path.exists(CSV_FILE):
        save_batch_to_csv([], write_header=True)

    session = requests.Session()

    for category_name, endpoint in CATEGORY_ENDPOINTS:
        print()
        print("========================================")
        print(f"Fetching category: {category_name}")
        print("========================================")

        for page in range(1, MAX_PAGES + 1):
            print(
                f"Category={category_name} "
                f"page={page}/{MAX_PAGES} "
                f"| Saved: {total_saved:,} "
                f"| Current batch: {len(batch):,} "
                f"| Existing: {len(existing_ids):,}"
            )

            url = f"{TMDB_BASE_URL}{endpoint}"
            params = {
                "api_key": TMDB_API_KEY,
                "language": "en-US",
                "include_adult": "false",
                "include_video": "false",
                "page": page,
            }

            try:
                response = session.get(
                    url,
                    params=params,
                    timeout=30,
                )
                response.raise_for_status()

                data = response.json()
                results = data.get("results", [])

                if not results:
                    print("No more movies found for this category.")
                    break

                for movie in results:
                    movie_id = movie.get("id")
                    if not movie_id:
                        continue

                    if movie_id in existing_ids:
                        continue

                    if movie.get("adult") is True:
                        continue

                    existing_ids.add(movie_id)
                    batch.append(movie)

                    if len(batch) >= SAVE_BATCH_SIZE:
                        save_batch_to_csv(batch)
                        total_saved += len(batch)
                        print(
                            f"TOTAL SAVED: {total_saved:,} movies"
                        )
                        batch.clear()

                time.sleep(REQUEST_DELAY)

            except requests.RequestException as error:
                print(f"Error fetching category={category_name} page={page}: {error}")
                print("Waiting 5 seconds...")
                time.sleep(5)

    if batch:
        save_batch_to_csv(batch)
        total_saved += len(batch)
        batch.clear()

    session.close()

    print()
    print("========================================")
    print("FETCH COMPLETED")
    print(f"Total movies saved: {total_saved:,}")
    print(f"CSV location: {CSV_FILE}")
    print("========================================")


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    print("Starting TMDB movie fetch...")
    print(f"Saving every {SAVE_BATCH_SIZE:,} movies")
    print()

    fetch_movies()
    dedupe_csv()