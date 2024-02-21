import { type LinksFunction, type MetaFunction, LoaderFunctionArgs, redirect, json } from "@remix-run/node";
import ExpenseStatistics from "../components/expenses/ExpenseStatistics"
import Chart from "../components/expenses/Chart" 
import expensesStyles from "../styles/expenses.css"
import axios from "axios";
import { useLoaderData } from "react-router"
import { isAuthenticated } from "../cookies.server";
import { logger } from "../logger.server";

export default function ExpensesAnalysisPage() {
  const {expenses} = useLoaderData() as {"expenses": Expense[]}

  return (
    <>
      {/* <ExpensesHeader/> */}
      <main>
        <Chart expenses={expenses}/>
        <ExpenseStatistics expenses={expenses}/>
      </main>
    </>

  );
}

export const meta: MetaFunction = () => {
  return [
    { title: "Expenses Analysis Page" },
    { name: "description", content: "Expenses Analysis page" },
  ];
};

export const links: LinksFunction = () => [
  {rel: 'stylesheet', href: expensesStyles}
];

export async function loader({request}: LoaderFunctionArgs) {
  await isAuthenticated(request)

  try {
    const expenses = await axios.get("/expenses")
    return json({"expenses": expenses.data})
  } catch(error) {
    logger.error(new Error(error as string))
    return redirect("/")
  }
}