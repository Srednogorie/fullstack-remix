import type { LinksFunction } from "@remix-run/node"
import { Outlet } from "@remix-run/react"
import expensesStyles from "../styles/expenses.css"
import MainHeader from "../components/navigation/MainHeader";

export default function ExpensesLayoutPage() {
  return (
    <>
      <MainHeader/>
      <Outlet/>
    </>
  );
}

export const links: LinksFunction = () => [
  {rel: 'stylesheet', href: expensesStyles}
];