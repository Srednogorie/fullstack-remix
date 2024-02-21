import { Outlet } from "@remix-run/react";
import ExpensesHeader from "../components/navigation/ExpensesHeader";
import { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import expensesStyles from "../styles/expenses.css"
import { isAuthenticated } from "../cookies.server";

export default function ExpensesLayoutPage() {
  return (
    <>
      <ExpensesHeader/>
      <Outlet/>
    </>
  )
}
  
export const links: LinksFunction = () => [
  {rel: 'stylesheet', href: expensesStyles}
];

export async function loader({request}: LoaderFunctionArgs) {
  await isAuthenticated(request)

  return null
}
