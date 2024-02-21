import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";

import axios from "axios"
import { createRequestHandler } from "@remix-run/express";
import { broadcastDevReady, installGlobals } from "@remix-run/node";
import compression from "compression";
import https from "https"
import express from "express";
import morgan from "morgan";
import sourceMapSupport from "source-map-support";

sourceMapSupport.install({
  retrieveSourceMap: function (source) {
    // get source file with the `file://` prefix
    const match = source.match(/^file:\/\/(.*)$/);
    if (match) {
      const filePath = url.fileURLToPath(source);
      return {
        url: source,
        map: fs.readFileSync(`${filePath}.map`, "utf8"),
      };
    }
    return null;
  },
});
installGlobals();

/** @typedef {import('@remix-run/node').ServerBuild} ServerBuild */

const BUILD_PATH = path.resolve("build/index.js");
const VERSION_PATH = path.resolve("build/version.txt");

const initialBuild = await reimportServer();
const remixHandler =
  process.env.NODE_ENV === "development"
    ? await createDevRequestHandler(initialBuild)
    : createRequestHandler({
        build: initialBuild,
        mode: initialBuild.mode,
      });

const app = express();

app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

// Remix fingerprints its assets so we can cache forever.
app.use(
  "/build",
  express.static("public/build", { immutable: true, maxAge: "1y" })
);

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static("public", { maxAge: "1h" }));

app.use(morgan("tiny"));

app.all("*", remixHandler);

const port = process.env.PORT || 3000;

// The local ssl certificates are available only locally. The start-local
// script will load them too so we can test the production build locally.
// This means that we still can have the local certs but in production mode.
if (process.env.LOCAL_SSL_KEY && process.env.LOCAL_SSL_CERT) {
  const key = fs.readFileSync(process.env.LOCAL_SSL_KEY)
  const cert = fs.readFileSync(process.env.LOCAL_SSL_CERT)
  https.createServer({ key, cert }, app).listen(port, async () => {
    console.log(`Express server listening on port ${port}`)
    if (process.env.NODE_ENV === "development") {
      broadcastDevReady(initialBuild)
    }
  })
} else if (process.env.NODE_ENV === "production") {
  app.listen(port, async () => {
    console.log(`Express server listening on port ${port}`)
  })
}
axios.defaults.baseURL = process.env.BASE_URL
// axios.defaults.headers.common['Authorization'] = AUTH_TOKEN
// axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'

/**
 * @returns {Promise<ServerBuild>}
 */
async function reimportServer() {
  const stat = fs.statSync(BUILD_PATH);

  // convert build path to URL for Windows compatibility with dynamic `import`
  const BUILD_URL = url.pathToFileURL(BUILD_PATH).href;

  // use a timestamp query parameter to bust the import cache
  return import(BUILD_URL + "?t=" + stat.mtimeMs);
}

/**
 * @param {ServerBuild} initialBuild
 * @returns {Promise<import('@remix-run/express').RequestHandler>}
 */
async function createDevRequestHandler(initialBuild) {
  let build = initialBuild;
  async function handleServerUpdate() {
    // 1. re-import the server build
    build = await reimportServer();
    // 2. tell Remix that this app server is now up-to-date and ready
    broadcastDevReady(build);
  }
  const chokidar = await import("chokidar");
  chokidar
    .watch(VERSION_PATH, { ignoreInitial: true })
    .on("add", handleServerUpdate)
    .on("change", handleServerUpdate);

  // wrap request handler to make sure its recreated with the latest build for every request
  return async (req, res, next) => {
    try {
      return createRequestHandler({
        build,
        mode: "development",
      })(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}
