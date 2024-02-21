import { Link, Outlet, useLoaderData } from "@remix-run/react"
import {LoaderFunctionArgs, json, redirect} from "@remix-run/node"
import ExpensesList from "../components/expenses/ExpensesList"
import { FaDownload, FaPlus } from "react-icons/fa"
import axios from "axios"
import { authSessionStorage, isAuthenticated } from "../cookies.server"
import { logger } from "../logger.server"
import { useEffect } from "react"
import toast, { Toaster } from 'react-hot-toast'


export default function ExpensesLayoutPage() {
  const {expenses, toastMessage} = useLoaderData<typeof loader>()

  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    toast(toastMessage);
  }, [toastMessage]);

  return (
    <>
      <Outlet/>
      <Toaster />
      <main>
        <section id="expenses-actions">
          <Link to="add">
            <FaPlus />
            <span>Add Expense</span>
          </Link>
          <a href="/expenses/raw">
            <FaDownload/>
            <span>Load Raw Data</span>
          </a>
        </section>
        <ExpensesList expenses={expenses}/>
      </main>
    </>
  );
}


export async function loader({request}: LoaderFunctionArgs) {

  const session = await authSessionStorage.getSession(request.headers.get("Cookie"))
  const toastMessage = session.get('toastMessage') || null

  await isAuthenticated(request)

  try {
    const expenses = await axios.get("/expenses")
    return json(
      { "expenses": expenses.data, toastMessage },
      {
        headers: {
          'Set-Cookie': await authSessionStorage.commitSession(session),
        },
      },
    );
  } catch(error) {
    logger.error(new Error(error as string))
    return redirect("/")
  }
}
