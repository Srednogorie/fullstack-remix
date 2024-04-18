import type { ActionFunctionArgs } from "@remix-run/node"; // or cloudflare/deno
import { redirect } from "@remix-run/node"; // or cloudflare/deno
import { logout, requireUserId } from "~/modules/session/session.server";

export function loader() {
  return redirect('/');
}

export const action = async ({request}: ActionFunctionArgs) => {
  const auth = await requireUserId(request)
  
  if (!auth) {
    return redirect("/")
  }

  return logout(request);
};