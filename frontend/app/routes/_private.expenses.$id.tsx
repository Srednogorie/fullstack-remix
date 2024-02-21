import { ActionFunctionArgs, redirect, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node"
import ExpensesForm from "../components/expenses/ExpenseForm"
import Modal from "../components/util/Modal";
import axios from "axios";
import { authSessionStorage, isAuthenticated } from "../cookies.server";
import { logger } from "../logger.server";

export default function ExpensesDetailPage() {
  return (
    <Modal>
      <ExpensesForm/>
    </Modal>
  )
}

export const meta: MetaFunction = () => {
  return [
    { title: "Expenses Id Page" },
    { name: "description", content: "Expenses Id page" },
  ];
};

export async function action({params, request}: ActionFunctionArgs) {
  const session = await authSessionStorage.getSession(request.headers.get("Cookie"))

  if (request.method === "PUT") {
    const formData: FormData = await request.formData()
    const expenseData = Object.fromEntries(formData)

    try {
      await axios.put(`/expenses/${params.id}`, expenseData, {
        headers: {'X-Requested-With': 'XMLHttpRequest'}
      })
      return redirect("/expenses")
    } catch (error) {
      logger.error(new Error(error as string))
      session.flash('toastMessage', "Something went wrong. Please, try again later.")
      return redirect("/expenses", {
        headers: { 'Set-Cookie': await authSessionStorage.commitSession(session)},
      })
    }
  } else if (request.method === "DELETE") {
    try {
      await axios.delete(`/expenses/${params.id}`, {
        headers: {'X-Requested-With': 'XMLHttpRequest'}
      })
      return redirect("/expenses")
    } catch(error) {
      logger.error(new Error(error as string))
      session.flash('toastMessage', "Something went wrong. Please, try again later.")
      return redirect("/expenses", {
        headers: { 'Set-Cookie': await authSessionStorage.commitSession(session)},
      })
    }
  }

  // await new Promise<void>((resolve, reject) => setTimeout(() => resolve(), 3000))

}

export async function loader({request}: LoaderFunctionArgs) {
  await isAuthenticated(request)

  return null
}
