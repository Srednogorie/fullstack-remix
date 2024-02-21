import { createCookie, createCookieSessionStorage, redirect } from "@remix-run/node"
import axios from "axios"

export const authSessionStorage = createCookieSessionStorage({
    cookie: {
      name: "_auth_session", // use any name you want here
      sameSite: "lax", // this helps with CSRF
      path: "/", // remember to add this so the cookie will work in all routes
      httpOnly: true, // for security reasons, make this cookie http only
      secrets: ["s3cr3t"], // replace this with an actual secret
      secure: true, // enable this in prod only
      maxAge: 900
    },
  })

export const authCookie = createCookie("auth-token")

export const isAuthenticated = async (request: Request) => {
    const session = await authSessionStorage.getSession(request.headers.get("Cookie"))
  
    if (!session.has("authToken")) {
        // Remove token
        axios.defaults.headers.common['Authorization'] = ''
        delete axios.defaults.headers.common['Authorization']
        // At this point the session shouldn't be available anyway!
        await authSessionStorage.destroySession(session)
        throw redirect("/login", {
          headers: {
            "Set-Cookie": await authSessionStorage.destroySession(session),
          },
        })
    } else {
        // Configure axios token
        axios.defaults.headers.common['Authorization'] = `Bearer ${session.get("authToken")}`
        return true
    }
}

// export const setToastMessage = async (session, path) => {
//   return redirect(path, {
//     headers: { 'Set-Cookie': await commitSession(session) },
//   })
// }
