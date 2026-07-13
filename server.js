import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 10000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
 * Environment variables
 */
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const SHRINKEARN_API_KEY =
  process.env.SHRINKEARN_API_KEY;

const TMDB_BASE_URL =
  "https://api.themoviedb.org/3";

const SHRINKEARN_BASE_URL =
  "https://shrinkearn.com/api";

/*
 * Parse JSON requests
 */
app.use(express.json());

/*
 * ============================================================
 * TMDB SERVER-SIDE PROXY
 * ============================================================
 *
 * Frontend request:
 *
 * /api/tmdb/movie/popular?language=en-US&page=1
 *
 * Server request:
 *
 * https://api.themoviedb.org/3/movie/popular
 * ?language=en-US
 * &page=1
 * &api_key=SECRET
 */
app.use("/api/tmdb", async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  if (!TMDB_API_KEY) {
    console.error(
      "TMDB_API_KEY is missing"
    );

    return res.status(500).json({
      error:
        "Movie API is not configured",
    });
  }

  let timeout;

  try {
    const tmdbUrl = new URL(
      `${TMDB_BASE_URL}${req.url}`
    );

    /*
     * Add secret API key server-side.
     */
    tmdbUrl.searchParams.set(
      "api_key",
      TMDB_API_KEY
    );

    const controller =
      new AbortController();

    timeout = setTimeout(() => {
      controller.abort();
    }, 15000);

    const response = await fetch(
      tmdbUrl,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    /*
     * Read as text first so an unexpected
     * non-JSON response does not crash.
     */
    const responseText =
      await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error(
        "TMDB returned invalid JSON:",
        responseText.substring(0, 500)
      );

      return res.status(502).json({
        error:
          "Movie service returned an invalid response",
      });
    }

    if (!response.ok) {
      console.error(
        "TMDB API error:",
        response.status,
        data
      );

      return res
        .status(response.status)
        .json(data);
    }

    /*
     * Cache public movie metadata
     * for 5 minutes.
     */
    res.set(
      "Cache-Control",
      "public, max-age=300"
    );

    return res.json(data);
  } catch (error) {
    if (timeout) {
      clearTimeout(timeout);
    }

    console.error(
      "TMDB proxy error:",
      error
    );

    if (error.name === "AbortError") {
      return res.status(504).json({
        error:
          "Movie service request timed out",
      });
    }

    return res.status(502).json({
      error:
        "Unable to connect to movie service",
    });
  }
});

/*
 * ============================================================
 * SHRINKEARN SERVER-SIDE PROXY
 * ============================================================
 *
 * Frontend request:
 *
 * /api/shorten?url=https%3A%2F%2Fexample.com
 *
 * Server request:
 *
 * https://shrinkearn.com/api
 * ?api=SECRET
 * &url=https%3A%2F%2Fexample.com
 */
app.get(
  "/api/shorten",
  async (req, res) => {
    if (!SHRINKEARN_API_KEY) {
      console.error(
        "SHRINKEARN_API_KEY is missing"
      );

      return res.status(500).json({
        error:
          "Short link service is not configured",
      });
    }

    const destinationUrl =
      req.query.url;

    if (
      !destinationUrl ||
      typeof destinationUrl !== "string"
    ) {
      return res.status(400).json({
        error:
          "Destination URL is required",
      });
    }

    /*
     * Validate destination URL.
     */
    let parsedDestination;

    try {
      parsedDestination =
        new URL(destinationUrl);

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
      return res.status(400).json({
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
       * Add API key only on the server.
       */
      shrinkEarnUrl.searchParams.set(
        "api",
        SHRINKEARN_API_KEY
      );

      shrinkEarnUrl.searchParams.set(
        "url",
        parsedDestination.toString()
      );

      /*
       * Optional custom alias.
       *
       * Frontend can call:
       *
       * /api/shorten?url=...&alias=my-link
       */
      if (
        req.query.alias &&
        typeof req.query.alias ===
          "string"
      ) {
        shrinkEarnUrl.searchParams.set(
          "alias",
          req.query.alias
        );
      }

      const controller =
        new AbortController();

      timeout = setTimeout(() => {
        controller.abort();
      }, 15000);

      const response = await fetch(
        shrinkEarnUrl,
        {
          method: "GET",
          headers: {
            Accept:
              "application/json, text/plain",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      const responseText =
        await response.text();

      /*
       * ShrinkEarn may return JSON or
       * potentially a plain-text URL.
       */
      let data;

      try {
        data =
          JSON.parse(responseText);
      } catch {
        data = {
          shortenedUrl:
            responseText.trim(),
        };
      }

      if (!response.ok) {
        console.error(
          "ShrinkEarn API error:",
          response.status,
          data
        );

        return res
          .status(response.status)
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

      return res.json(data);
    } catch (error) {
      if (timeout) {
        clearTimeout(timeout);
      }

      console.error(
        "ShrinkEarn proxy error:",
        error
      );

      if (
        error.name === "AbortError"
      ) {
        return res.status(504).json({
          error:
            "Short link service request timed out",
        });
      }

      return res.status(502).json({
        error:
          "Unable to connect to short link service",
      });
    }
  }
);

/*
 * ============================================================
 * HEALTH CHECK
 * ============================================================
 */
app.get(
  "/api/health",
  (req, res) => {
    res.json({
      status: "ok",

      /*
       * Only expose whether configuration
       * exists — never expose API keys.
       */
      services: {
        tmdb: Boolean(
          TMDB_API_KEY
        ),
        shrinkearn: Boolean(
          SHRINKEARN_API_KEY
        ),
      },
    });
  }
);

/*
 * ============================================================
 * SERVE VITE PRODUCTION BUILD
 * ============================================================
 */
app.use(
  express.static(
    path.join(
      __dirname,
      "dist"
    )
  )
);

/*
 * ============================================================
 * REACT ROUTER FALLBACK
 * ============================================================
 *
 * This MUST remain after all /api routes.
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

/*
 * ============================================================
 * START SERVER
 * ============================================================
 */
app.listen(
  PORT,
  "0.0.0.0",
  () => {
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
  }
);