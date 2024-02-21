import { useFetcher } from "@remix-run/react";
import Modal from "../util/Modal";


interface Props {
    modalHide: () => void
    id: number
}
  
export default function Confirm({modalHide, id}: Props) {
    const fetcher = useFetcher()
    function deleteExpenseItemHandler() {
        fetcher.submit(null, {method: "DELETE", action: `/expenses/${id}`})
    }
    return (
        <Modal>
            <div className="form">
                <div>
                    <h1>Are you sure you want to delete the item?</h1>
                </div>
                <div>
                    <button type="submit" name="_action" value="save" onClick={deleteExpenseItemHandler}>Delete</button>
                </div>
                <div>
                    <button type="button" onClick={modalHide}>Cancel</button>
                </div>
            </div>
        </Modal>

    )
}