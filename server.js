import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";
import "dotenv/config";

/* ============================================================
 * APP CONFIGURATION
 * ============================================================ */

const app = express();
const PORT = process.env.PORT || 10000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const SHRINKEARN_API_KEY = process.env.SHRINKEARN_API_KEY;

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const SHRINKEARN_BASE_URL = "https://shrinkearn.com/api";

const DIST_DIR = path.join(__dirname, "dist");

const MOVIES_CSV_FILE = path.join(
  __dirname,
  "AllMoviesData.csv"
);

/*
 * Each movie sitemap contains 10,000 URLs.
 */
const SITEMAP_CHUNK_SIZE = 10000;


/* ============================================================
 * MIDDLEWARE
 * ============================================================ */

/*
 * Required for Render / Cloudflare.
 */
app.set("trust proxy", true);

app.use(express.json());


/* ============================================================
 * SHARED HELPERS
 * ============================================================ */

function getBaseUrl(req) {
  const forwardedProto = req
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();

  const forwardedHost = req
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();

  const protocol =
    forwardedProto ||
    req.protocol ||
    "https";

  const host =
    forwardedHost ||
    req.get("host");

  return `${protocol}://${host}`;
}


function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}


function createSlug(value = "movie") {
  return (
    String(value)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") ||
    "movie"
  );
}


function isAdultMovie(value) {
  const normalized = String(
    value ?? ""
  )
    .trim()
    .toLowerCase();

  return (
    normalized === "true" ||
    normalized === "1"
  );
}


/* ============================================================
 * CSV MOVIE CACHE
 * ============================================================ */

let cachedMovies = null;


function loadMoviesFromCsv() {
  /*
   * Return cached data after first load.
   */
  if (cachedMovies !== null) {
    return cachedMovies;
  }


  /*
   * Check whether CSV exists.
   */
  if (!fs.existsSync(MOVIES_CSV_FILE)) {
    console.error(
      `CSV file not found: ${MOVIES_CSV_FILE}`
    );

    cachedMovies = [];

    return cachedMovies;
  }


  try {
    console.log(
      "Loading movies from AllMoviesData.csv..."
    );


    const csvContent = fs.readFileSync(
      MOVIES_CSV_FILE,
      "utf-8"
    );


    const records = parse(
      csvContent,
      {
        columns: true,
        skip_empty_lines: true,
        bom: true,
        relax_quotes: true,
        relax_column_count: true,
        trim: true,
      }
    );


    /*
     * Remove:
     *
     * - Invalid IDs
     * - Adult movies
     * - Duplicate movie IDs
     */
    const uniqueMovies =
      new Map();


    for (const movie of records) {
      const id = String(
        movie.id || ""
      ).trim();


      if (!id) {
        continue;
      }


      if (
        isAdultMovie(
          movie.adult
        )
      ) {
        continue;
      }


      if (
        !uniqueMovies.has(id)
      ) {
        uniqueMovies.set(
          id,
          {
            id,

            title:
              movie.title ||
              movie.original_title ||
              "movie",
          }
        );
      }
    }


    cachedMovies =
      Array.from(
        uniqueMovies.values()
      );


    console.log(
      `Loaded ${cachedMovies.length.toLocaleString()} non-adult movies from CSV`
    );


    return cachedMovies;

  } catch (error) {

    console.error(
      "Failed to read movie CSV:",
      error
    );


    cachedMovies = [];


    return cachedMovies;
  }
}


/* ============================================================
 * STATIC SITEMAP DATA
 * ============================================================ */

const STATIC_PAGES = [
  {
    path: "/",
    changefreq: "daily",
    priority: "1.0",
  },

  {
    path: "/movies",
    changefreq: "daily",
    priority: "0.9",
  },

  {
    path: "/languages",
    changefreq: "weekly",
    priority: "0.8",
  },

  {
    path: "/search",
    changefreq: "weekly",
    priority: "0.5",
  },
];


/*
 * IMPORTANT:
 *
 * These slugs must match your React routes/constants.
 */
const GENRE_SLUGS = [
  "action",
  "adventure",
  "animation",
  "comedy",
  "crime",
  "documentary",
  "drama",
  "family",
  "fantasy",
  "history",
  "horror",
  "music",
  "mystery",
  "romance",
  "science-fiction",
  "thriller",
  "war",
  "western",
];


const LANGUAGE_SLUGS = [
  "english",
  "hindi",
  "telugu",
  "tamil",
  "malayalam",
  "kannada",
  "bengali",
  "marathi",
  "punjabi",
  "gujarati",
  "urdu",
  "japanese",
  "korean",
  "chinese",
  "spanish",
  "french",
  "german",
  "italian",
  "portuguese",
  "russian",
  "arabic",
  "turkish",
  "thai",
  "indonesian",
];


/* ============================================================
 * MAIN SITEMAP INDEX
 * ============================================================ */

function sendSitemapIndex(
  req,
  res
) {
  const baseUrl =
    getBaseUrl(req);


  const movies =
    loadMoviesFromCsv();


  const totalMovieSitemaps =
    Math.ceil(
      movies.length /
        SITEMAP_CHUNK_SIZE
    );


  const entries = [
    `${baseUrl}/sitemap-static.xml`,
  ];


  /*
   * Automatically add:
   *
   * sitemap-movies-1.xml
   * sitemap-movies-2.xml
   * sitemap-movies-3.xml
   * ...
   */
  for (
    let page = 1;
    page <=
    totalMovieSitemaps;
    page++
  ) {
    entries.push(
      `${baseUrl}/sitemap-movies-${page}.xml`
    );
  }


  const xmlEntries =
    entries
      .map(
        (url) => `
  <sitemap>
    <loc>${escapeXml(
      url
    )}</loc>
  </sitemap>`
      )
      .join("");


  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</sitemapindex>`;


  return res
    .status(200)
    .type(
      "application/xml"
    )
    .set(
      "Cache-Control",
      "public, max-age=3600"
    )
    .send(sitemap);
}


/*
 * Support both:
 *
 * /sitemap
 * /sitemap.xml
 */
app.get(
  "/sitemap.xml",
  sendSitemapIndex
);


app.get(
  "/sitemap",
  sendSitemapIndex
);


/* ============================================================
 * STATIC SITEMAP
 * ============================================================ */

app.get(
  "/sitemap-static.xml",

  (req, res) => {

    const baseUrl =
      getBaseUrl(req);


    const urls = [

      /*
       * Main pages
       */
      ...STATIC_PAGES,


      /*
       * Genre pages
       */
      ...GENRE_SLUGS.map(
        (slug) => ({
          path:
            `/genre/${slug}`,

          changefreq:
            "weekly",

          priority:
            "0.7",
        })
      ),


      /*
       * Language pages
       */
      ...LANGUAGE_SLUGS.map(
        (slug) => ({
          path:
            `/language/${slug}`,

          changefreq:
            "weekly",

          priority:
            "0.7",
        })
      ),
    ];


    const xmlUrls =
      urls
        .map(
          (item) => `
  <url>
    <loc>${escapeXml(
      baseUrl +
        item.path
    )}</loc>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
        )
        .join("");


    const sitemap =
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;


    return res
      .status(200)
      .type(
        "application/xml"
      )
      .set(
        "Cache-Control",
        "public, max-age=3600"
      )
      .send(sitemap);
  }
);


/* ============================================================
 * MOVIE SITEMAPS
 * ============================================================ */

/*
 * Examples:
 *
 * /sitemap-movies-1.xml
 * /sitemap-movies-2.xml
 * /sitemap-movies-3.xml
 */
app.get(
  "/sitemap-movies-:page.xml",

  (req, res) => {

    const baseUrl =
      getBaseUrl(req);


    const movies =
      loadMoviesFromCsv();


    const page =
      Number.parseInt(
        req.params.page,
        10
      );


    /*
     * Validate page number.
     */
    if (
      !Number.isInteger(
        page
      ) ||
      page < 1
    ) {
      return res
        .status(404)
        .type(
          "text/plain"
        )
        .send(
          "Sitemap not found"
        );
    }


    const start =
      (page - 1) *
      SITEMAP_CHUNK_SIZE;


    const end =
      start +
      SITEMAP_CHUNK_SIZE;


    const movieChunk =
      movies.slice(
        start,
        end
      );


    /*
     * Sitemap page does not exist.
     */
    if (
      movieChunk.length ===
      0
    ) {
      return res
        .status(404)
        .type(
          "text/plain"
        )
        .send(
          "Sitemap not found"
        );
    }


    const xmlUrls =
      movieChunk
        .map(
          (movie) => {

            const slug =
              `${movie.id}-${createSlug(
                movie.title
              )}`;


            return `
  <url>
    <loc>${escapeXml(
      `${baseUrl}/movie/${slug}`
    )}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
          }
        )
        .join("");


    const sitemap =
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;


    return res
      .status(200)
      .type(
        "application/xml"
      )
      .set(
        "Cache-Control",
        "public, max-age=3600"
      )
      .send(sitemap);
  }
);


/* ============================================================
 * ROBOTS.TXT
 * ============================================================ */

app.get(
  "/robots.txt",

  (req, res) => {

    const baseUrl =
      getBaseUrl(req);


    const robots =
      `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;


    return res
      .status(200)
      .type(
        "text/plain"
      )
      .set(
        "Cache-Control",
        "public, max-age=3600"
      )
      .send(robots);
  }
);


/* ============================================================
 * TMDB SERVER-SIDE PROXY
 * ============================================================ */

app.use(
  "/api/tmdb",

  async (req, res) => {

    /*
     * Only allow GET.
     */
    if (
      req.method !==
      "GET"
    ) {
      return res
        .status(405)
        .json({
          error:
            "Method not allowed",
        });
    }


    /*
     * Check API key.
     */
    if (
      !TMDB_API_KEY
    ) {
      console.error(
        "TMDB_API_KEY is missing"
      );


      return res
        .status(500)
        .json({
          error:
            "Movie API is not configured",
        });
    }


    let timeout;


    try {

      /*
       * Example incoming request:
       *
       * /api/tmdb/movie/popular?page=1
       *
       * req.url becomes:
       *
       * /movie/popular?page=1
       */
      const tmdbUrl =
        new URL(
          `${TMDB_BASE_URL}${req.url}`
        );


      /*
       * Add secret API key
       * only on server.
       */
      tmdbUrl
        .searchParams
        .set(
          "api_key",
          TMDB_API_KEY
        );


      const controller =
        new AbortController();


      timeout =
        setTimeout(
          () => {
            controller.abort();
          },
          15000
        );


      const response =
        await fetch(
          tmdbUrl,
          {
            method:
              "GET",

            headers: {
              Accept:
                "application/json",
            },

            signal:
              controller.signal,
          }
        );


      clearTimeout(
        timeout
      );


      /*
       * Read text first.
       *
       * This prevents JSON parsing crashes
       * if TMDB returns HTML or invalid JSON.
       */
      const responseText =
        await response.text();


      let data;


      try {
        data =
          JSON.parse(
            responseText
          );

      } catch {

        console.error(
          "TMDB returned invalid JSON:",
          responseText.substring(
            0,
            500
          )
        );


        return res
          .status(502)
          .json({
            error:
              "Movie service returned an invalid response",
          });
      }


      /*
       * Forward TMDB errors.
       */
      if (
        !response.ok
      ) {
        console.error(
          "TMDB API error:",
          response.status,
          data
        );


        return res
          .status(
            response.status
          )
          .json(
            data
          );
      }


      /*
       * Cache movie metadata
       * for 5 minutes.
       */
      res.set(
        "Cache-Control",
        "public, max-age=300"
      );


      return res.json(
        data
      );

    } catch (error) {

      if (timeout) {
        clearTimeout(
          timeout
        );
      }


      console.error(
        "TMDB proxy error:",
        error
      );


      if (
        error.name ===
        "AbortError"
      ) {
        return res
          .status(504)
          .json({
            error:
              "Movie service request timed out",
          });
      }


      return res
        .status(502)
        .json({
          error:
            "Unable to connect to movie service",
        });
    }
  }
);


/* ============================================================
 * SHRINKEARN SERVER-SIDE PROXY
 * ============================================================ */

app.get(
  "/api/shorten",

  async (req, res) => {

    /*
     * Check API key.
     */
    if (
      !SHRINKEARN_API_KEY
    ) {
      console.error(
        "SHRINKEARN_API_KEY is missing"
      );


      return res
        .status(500)
        .json({
          error:
            "Short link service is not configured",
        });
    }


    const destinationUrl =
      req.query.url;


    /*
     * Validate URL parameter.
     */
    if (
      !destinationUrl ||
      typeof destinationUrl !==
        "string"
    ) {
      return res
        .status(400)
        .json({
          error:
            "Destination URL is required",
        });
    }


    let parsedDestination;


    try {

      parsedDestination =
        new URL(
          destinationUrl
        );


      if (
        parsedDestination.protocol !==
          "http:" &&
        parsedDestination.protocol !==
          "https:"
      ) {
        throw new Error(
          "Invalid protocol"
        );
      }

    } catch {

      return res
        .status(400)
        .json({
          error:
            "Invalid destination URL",
        });
    }


    let timeout;


    try {

      const shrinkEarnUrl =
        new URL(
          SHRINKEARN_BASE_URL
        );


      /*
       * Add secret API key.
       */
      shrinkEarnUrl
        .searchParams
        .set(
          "api",
          SHRINKEARN_API_KEY
        );


      /*
       * Add destination URL.
       */
      shrinkEarnUrl
        .searchParams
        .set(
          "url",
          parsedDestination.toString()
        );


      /*
       * Optional alias.
       */
      if (
        req.query.alias &&
        typeof req.query.alias ===
          "string"
      ) {
        shrinkEarnUrl
          .searchParams
          .set(
            "alias",
            req.query.alias
          );
      }


      const controller =
        new AbortController();


      timeout =
        setTimeout(
          () => {
            controller.abort();
          },
          15000
        );


      const response =
        await fetch(
          shrinkEarnUrl,
          {
            method:
              "GET",

            headers: {
              Accept:
                "application/json, text/plain",
            },

            signal:
              controller.signal,
          }
        );


      clearTimeout(
        timeout
      );


      const responseText =
        await response.text();


      /*
       * ShrinkEarn may return
       * JSON or plain text.
       */
      let data;


      try {

        data =
          JSON.parse(
            responseText
          );

      } catch {

        data = {
          shortenedUrl:
            responseText.trim(),
        };
      }


      /*
       * Handle API error.
       */
      if (
        !response.ok
      ) {
        console.error(
          "ShrinkEarn API error:",
          response.status,
          data
        );


        return res
          .status(
            response.status
          )
          .json({
            error:
              data?.message ||
              data?.error ||
              "Unable to create short link",
          });
      }


      /*
       * Do not cache generated links.
       */
      res.set(
        "Cache-Control",
        "no-store"
      );


      return res.json(
        data
      );

    } catch (error) {

      if (timeout) {
        clearTimeout(
          timeout
        );
      }


      console.error(
        "ShrinkEarn proxy error:",
        error
      );


      if (
        error.name ===
        "AbortError"
      ) {
        return res
          .status(504)
          .json({
            error:
              "Short link service request timed out",
          });
      }


      return res
        .status(502)
        .json({
          error:
            "Unable to connect to short link service",
        });
    }
  }
);


/* ============================================================
 * HEALTH CHECK
 * ============================================================ */

app.get(
  "/api/health",

  (req, res) => {

    const movies =
      loadMoviesFromCsv();


    return res.json({
      status:
        "ok",


      services: {

        tmdb:
          Boolean(
            TMDB_API_KEY
          ),

        shrinkearn:
          Boolean(
            SHRINKEARN_API_KEY
          ),
      },


      sitemap: {

        csvFound:
          fs.existsSync(
            MOVIES_CSV_FILE
          ),

        movieCount:
          movies.length,

        movieSitemapCount:
          Math.ceil(
            movies.length /
              SITEMAP_CHUNK_SIZE
          ),
      },
    });
  }
);


/* ============================================================
 * SERVE VITE PRODUCTION BUILD
 * ============================================================ */

app.use(
  express.static(
    DIST_DIR
  )
);


/* ============================================================
 * REACT ROUTER FALLBACK
 * ============================================================ */

/*
 * IMPORTANT:
 *
 * Keep this AFTER:
 *
 * - API routes
 * - sitemap routes
 * - robots.txt
 */
app.use(
  (req, res) => {

    return res.sendFile(
      path.join(
        DIST_DIR,
        "index.html"
      )
    );
  }
);


/* ============================================================
 * START SERVER
 * ============================================================ */

app.listen(
  PORT,
  "0.0.0.0",

  () => {

    /*
     * Load CSV once during startup.
     */
    const movies =
      loadMoviesFromCsv();


    console.log(
      `MovieWale server running on port ${PORT}`
    );


    console.log(
      `TMDB configured: ${
        TMDB_API_KEY
          ? "Yes"
          : "No"
      }`
    );


    console.log(
      `ShrinkEarn configured: ${
        SHRINKEARN_API_KEY
          ? "Yes"
          : "No"
      }`
    );


    console.log(
      `Movie CSV found: ${
        fs.existsSync(
          MOVIES_CSV_FILE
        )
          ? "Yes"
          : "No"
      }`
    );


    console.log(
      `Sitemap movies: ${movies.length.toLocaleString()}`
    );


    console.log(
      `Movie sitemap files: ${Math.ceil(
        movies.length /
          SITEMAP_CHUNK_SIZE
      )}`
    );
  }
);