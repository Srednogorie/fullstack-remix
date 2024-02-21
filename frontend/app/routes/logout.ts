import type { ActionFunctionArgs } from "@remix-run/node"; // or cloudflare/deno
import { redirect } from "@remix-run/node"; // or cloudflare/deno
import axios from "axios"
import { authSessionStorage, isAuthenticated } from "../cookies.server";

export const loader = async () => {
  return redirect("/")
}

export const action = async ({request}: ActionFunctionArgs) => {
  const auth = await isAuthenticated(request)
  
  if (!auth) {
    return redirect("/")
  }
  
  axios.post("/auth/bearer/logout")
  .then((data) => data)
  .catch((error) => {
    // This will trigger the catch boundary
    throw new Response(`Logout loader exception ${error}`, {status: 404})
  })

  // Remove cookie
  const session = await authSessionStorage.getSession(request.headers.get("Cookie"))
  return redirect("/", {
    headers: {
      "Set-Cookie": await authSessionStorage.destroySession(session),
    },
  })
};