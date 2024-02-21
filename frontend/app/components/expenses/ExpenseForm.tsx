import { Form, Link, useActionData, useNavigation, useMatches, useParams } from "@remix-run/react";

function ExpenseForm() {
  const today = new Date().toISOString().slice(0, 10); // yields something like 2023-09-10
  const validationErrors: { [key: string]: string } | undefined = useActionData()
  const navigation = useNavigation()
  const params = useParams()

  // const expense: Expense = useLoaderData()
  const matches = useMatches()
  const expenseData = matches.find(match => match.id === "routes/_private.expenses")?.data as {"expenses": Expense[]}
  const expense = expenseData.expenses.find(item => item.id === parseInt(params.id as string, 10))

  // if (expenseData !== undefined) {
    
  // }
  

  if (params.id && !expense) {
      return <p>Invalid expense id!</p>
  }


  const defaultValues = expense
  ? {
    title: expense.title,
    amount: expense.amount,
    date: expense.date
  } 
  : {
    title: "",
    amount: "",
    date: ""
  }

  const isSubmitting = navigation.state != "idle"

  // Examples - https://remix.run/docs/en/main/hooks/use-submit
  // const submitHandler = (event) => {
  //   event.preventDefault()
  //   submit()
  // }

  return (
    <Form method={expenseData ? 'PUT' : 'POST'} className="form" id="expense-form">
      <p>
        <label htmlFor="title">Expense Title</label>
        <input type="text" id="title" name="title" required maxLength={50} defaultValue={defaultValues.title}/>
      </p>

      <div className="form-row">
        <p>
          <label htmlFor="amount">Amount</label>
          <input type="number" id="amount" name="amount" min="0" step="0.01" required defaultValue={defaultValues.amount}/>
        </p>
        <p>
          <label htmlFor="date">Date</label>
          <input type="date" id="date" name="date" max={today} required defaultValue={defaultValues.date ? defaultValues.date.slice(0, 10) : ""}
          />
        </p>
      </div>
      {validationErrors && (
        <ul>
          {Object.values(validationErrors).map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
      <div className="form-actions">
        <button disabled={isSubmitting}>{isSubmitting ? "Saving ..." : "Save Expense"}</button>
        <Link to="..">Cancel</Link>
      </div>
    </Form>
  );
}

export default ExpenseForm;
