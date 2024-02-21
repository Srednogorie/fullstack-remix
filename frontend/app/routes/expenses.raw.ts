import type { LoaderFunctionArgs } from "@remix-run/node"; // or cloudflare/deno
import axios from "axios"
import { isAuthenticated } from "../cookies.server";

export const loader = async ({request}: LoaderFunctionArgs) => {
  await isAuthenticated(request)
  
  const expenses: Promise<Expense[]> = axios.get("/expenses")
  .then((data) => data.data)
  .catch((error) => {
    // This will trigger the catch boundary
    throw new Response(`Loader exception ${error}`, {status: 404})
  })

  return expenses
};