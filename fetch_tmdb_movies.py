import csv
import os
import time
import requests

# ============================================================
# CONFIGURATION
# ============================================================

TMDB_API_KEY = os.getenv("TMDB_API_KEY")

TMDB_BASE_URL = "https://api.themoviedb.org/3"

MAX_PAGES = 50000
REQUEST_DELAY = 0.15

# Save every 1,000 movies
SAVE_BATCH_SIZE = 3000

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE = os.path.join(SCRIPT_DIR, "movies.csv")


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


# ============================================================
# FETCH MOVIES
# ============================================================

def fetch_movies():

    # Movies waiting to be saved
    batch = []

    # Prevent duplicates during this run
    seen_movie_ids = set()

    total_saved = 0

    # Create a new CSV with header
    save_batch_to_csv([], write_header=True)

    # Because empty batch doesn't create file,
    # explicitly create the CSV header
    with open(
        CSV_FILE,
        "w",
        newline="",
        encoding="utf-8-sig",
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=FIELDS,
        )

        writer.writeheader()

    session = requests.Session()

    for page in range(1, MAX_PAGES + 1):

        print(
            f"Fetching page {page}/{MAX_PAGES} "
            f"| Saved: {total_saved:,} "
            f"| Current batch: {len(batch):,}"
        )

        url = f"{TMDB_BASE_URL}/discover/movie"

        params = {
            "api_key": TMDB_API_KEY,
            "language": "en-US",
            "sort_by": "popularity.desc",
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
                print("No more movies found.")
                break

            for movie in results:

                movie_id = movie.get("id")

                if not movie_id:
                    continue

                # Extra safety: skip adult movies
                if movie.get("adult") is True:
                    continue

                # Skip duplicate movies
                if movie_id in seen_movie_ids:
                    continue

                seen_movie_ids.add(movie_id)

                batch.append(movie)

                # Save immediately after reaching 1,000
                if len(batch) >= SAVE_BATCH_SIZE:

                    save_batch_to_csv(batch)

                    total_saved += len(batch)

                    print(
                        f"TOTAL SAVED: {total_saved:,} movies"
                    )

                    # Clear memory after saving
                    batch.clear()

            time.sleep(REQUEST_DELAY)

        except requests.RequestException as error:

            print(
                f"Error fetching page {page}: {error}"
            )

            print("Waiting 5 seconds...")

            time.sleep(5)

    # ========================================================
    # SAVE REMAINING MOVIES
    # ========================================================

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