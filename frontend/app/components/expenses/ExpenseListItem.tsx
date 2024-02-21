import { Link } from "@remix-run/react"
import React from "react"
import Confirm from "./Confirm"

type ExpenseListItemProps = {
  id: number,
  title: string,
  amount: number,
}

function  ExpenseListItem(props: ExpenseListItemProps) {
  const [showConfirmSave, setShowConfirmSave] = React.useState(false);

  const modalHideHandler = () => {
    setShowConfirmSave(false);
  };



  // if (fetcher.state != "idle") {
  //   return (
  //     <article className="expense-item locked">
  //       <p>Deleting ...</p>
  //     </article>
  //   )
  // }

  return (
    <>
      {showConfirmSave && <Confirm modalHide={modalHideHandler} id={props.id} />}
      <article className="expense-item">
        <div>
          <h2 className="expense-title">{props.title}</h2>
          <p className="expense-amount">${props.amount.toFixed(2)}</p>
        </div>
        <menu className="expense-actions">
          <button onClick={() => setShowConfirmSave(true)}>Delete</button>
          {/* <Form method="delete" action={`/expenses/${id}`}>
            <button>Delete</button>
          </Form> */}
          <Link to={`${props.id}`} prefetch="intent">Edit</Link>
        </menu>
      </article>
    </>

  );
}

export default ExpenseListItem;
