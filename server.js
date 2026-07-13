import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 10000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

/*
 * Server-side TMDB proxy
 *
 * Frontend:
 * /api/tmdb/movie/popular?language=en-US&page=1
 *
 * Server calls:
 * https://api.themoviedb.org/3/movie/popular?...
 */
app.use("/api/tmdb", async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  if (!TMDB_API_KEY) {
    console.error("TMDB_API_KEY is missing");

    return res.status(500).json({
      error: "Movie API is not configured",
    });
  }

  try {
    const tmdbUrl = new URL(
      `${TMDB_BASE_URL}${req.url}`
    );

    // Add the secret API key on the server
    tmdbUrl.searchParams.set(
      "api_key",
      TMDB_API_KEY
    );

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 15000);

    const response = await fetch(tmdbUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "TMDB API error:",
        response.status,
        data
      );

      return res.status(response.status).json(data);
    }

    // Cache public movie metadata briefly
    res.set(
      "Cache-Control",
      "public, max-age=300"
    );

    return res.json(data);
  } catch (error) {
    console.error(
      "TMDB proxy error:",
      error
    );

    return res.status(502).json({
      error: "Unable to connect to movie service",
    });
  }
});

/*
 * Health check
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

/*
 * Serve the Vite production build
 */
app.use(
  express.static(
    path.join(__dirname, "dist")
  )
);

/*
 * React Router fallback
 */
app.use((req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "dist",
      "index.html"
    )
  );
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `MovieWale server running on port ${PORT}`
  );
});