import { type ActionFunctionArgs, type MetaFunction, redirect, LoaderFunctionArgs } from "@remix-run/node"
import ExpensesForm from "../components/expenses/ExpenseForm"
import Modal from "../components/util/Modal";
import axios from "axios";
import { isAuthenticated } from "../cookies.server";
import { logger } from "../logger.server";

export default function ExpensesAddPage() {
  return (
    <Modal>
      <ExpensesForm/>
    </Modal>
  );
}


function isValidTitle(value: string) {
  return value && value.trim().length > 0 && value.trim().length <= 30;
}

function isValidAmount(value: string) {
  const amount = parseFloat(value);
  return !isNaN(amount) && amount > 0;
}

function isValidDate(value: string) {
  return value && new Date(value).getTime() < new Date().getTime();
}

export function validateExpenseInput(input: {title: string, amount: string, date: string}) {
  const validationErrors: {title?: string, amount?: string, date?: string} = {};

  if (!isValidTitle(input.title)) {
    validationErrors.title = 'Invalid expense title. Must be at most 30 characters long.'
  }

  if (!isValidAmount(input.amount)) {
    validationErrors.amount = 'Invalid amount. Must be a number greater than zero.'
  }

  if (!isValidDate(input.date)) {
    validationErrors.date = 'Invalid date. Must be a date before today.'
  }

  if (Object.keys(validationErrors).length > 0) {
    throw validationErrors;
  }
}

export async function action({request}: ActionFunctionArgs) {
  const formData: FormData = await request.formData()
  const expenseData = Object.fromEntries(formData)
  if (typeof expenseData.date === 'string') {
    expenseData.date = new Date(expenseData.date).toISOString()
  } else {
    // Handle this
  }
  // const title = formData.get("title")
  // const content = formData.get("content")


  // Basic validation
  // if (noteData.title.trim().length < 5) {
  //     return json({ error: "Invalid title" })
  // }
  // headers: {'X-Requested-With': 'XMLHttpRequest'}

  try {
    validateExpenseInput(expenseData as {title: string, amount: string, date: string})
  } catch (error) {
    return error
  }

  try {
    await axios.post("/expenses", expenseData, {
      headers: {'X-Requested-With': 'XMLHttpRequest'}
    })
    return redirect("/expenses")
  } catch(error) {
    logger.error(new Error(error as string))
  }
  // await new Promise<void>((resolve, reject) => setTimeout(() => resolve(), 3000))
}


export const meta: MetaFunction = () => {
  return [
    { title: "Expenses Add Page" },
    { name: "description", content: "Expenses Add page" },
  ];
};

export async function loader({request}: LoaderFunctionArgs) {
  await isAuthenticated(request)

  return null
}
