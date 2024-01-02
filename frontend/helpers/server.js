// .......................................................

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static("public", { maxAge: "1h" }));

app.use(morgan("tiny"));

app.all("*", remixHandler);

// ============= WE NEED THIS BIT =================================
const port = process.env.PORT || 3000
// The local ssl certificates are available only locally. The start-local
// script will load them too so we can test the production build locally.
// This means that we still can have the local certs but in production mode.
if (process.env.LOCAL_SSL_KEY && process.env.LOCAL_SSL_CERT) {
  const key = fs.readFileSync(process.env.LOCAL_SSL_KEY)
  const cert = fs.readFileSync(process.env.LOCAL_SSL_CERT)
  https.createServer({ key, cert }, app).listen(port, async () => {
    console.log(`Express server listening on port ${port}`)
  })
  if (process.env.NODE_ENV === "development") {
    broadcastDevReady(initialBuild)
  }
} else if (process.env.NODE_ENV === "production") {
  app.listen(port, async () => {
    console.log(`Express server listening on port ${port}`)
  })
}
axios.defaults.baseURL = process.env.BASE_URL
// axios.defaults.headers.common['Authorization'] = AUTH_TOKEN
// axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'

// =========================================================================

/**
 * @returns {Promise<ServerBuild>}
 */
async function reimportServer() {
  const stat = fs.statSync(BUILD_PATH);

// .................................................................
