import ExpenseListItem from './ExpenseListItem'

type ExpensesListProps = {
  expenses: Expense[]
}

function ExpensesList(props: ExpensesListProps) {

  return (
    <ol id="expenses-list">
      {props.expenses.map((expense) => {
        return (
          <li key={expense.id}>
            <ExpenseListItem id={expense.id} title={expense.title} amount={expense.amount}/>
          </li>
        )
      })}
    </ol>
  );
}

export default ExpensesList;
