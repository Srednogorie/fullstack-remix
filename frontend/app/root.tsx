import { cssBundleHref } from "@remix-run/css-bundle"
import type { LinksFunction } from "@remix-run/node"
import {
  Link, Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useRouteError
} from "@remix-run/react"
// import styles from "./styles/tailwind.css"
import sharedStyles from "../app/styles/shared.css"
import Error from "./components/util/Error"


type DocumentProps = {
  title?: string,
  children: JSX.Element,
};

const Document = ({title, children}: DocumentProps) => {
  return (
    <html lang="en">
      <head>
        {title && <title>{title}</title>}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="use-credentials" />
        <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;700&display=swap" rel="stylesheet" />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}

export default function App() {
  return (
    <Document>
      <Outlet />
    </Document>
  );
}

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
  // { rel: "stylesheet", href: styles },
  {rel: 'stylesheet', href: sharedStyles}
];

export const ErrorBoundary = () => {
  const error = useRouteError() as {message: string, stack: string}

  // Catch boundary, it makes more sense to be used in nested routes, even layouts
  // It will need to be - throw new Response("message", {status: 402})
  // if (isRouteErrorResponse(error)) {
  //   return (
  //     <Document>
  //       <main>
  //         <Error title="CATCH BOUNDARY">
  //           {/* error.data will be the message passed to the error */}
  //           <p>{error.data}</p>
  //         </Error>
  //       </main>
  //     </Document>
  //   )
  // }

  // When NODE_ENV=production:
  // error.message = "Unexpected Server Error"
  // error.stack = undefined
  // Errors in production will be sanitized, even then it doesn't make sense too 
  // show any of the above. Custom error page is the most likely scenario.
  // This will catch any other errors, we generally want to avoid throwing such errors ourself.
  if (error instanceof Error) {
    return (
      <Document title="Unexpected error">
        <main>
          <Error title="ERROR BOUNDARY">
            <p>Something when wrong. Go to <Link to="/">safety</Link></p>
          </Error>
          <div>
            <p>{error.message}</p>
            <pre>{error.stack}</pre>
          </div>  
        </main>
      </Document>
    )
  } else {
    return (
      <div>
        <h1>Unknown Error, we handle this</h1>
        <div>
          <p>{error.message}</p>
          <pre>{error.stack}</pre>
        </div>
      </div>
    )
  }
}
