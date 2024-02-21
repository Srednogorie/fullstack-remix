import { useNavigate } from "@remix-run/react"

type ModalProps = {
  children: JSX.Element,
};

function Modal({ children }: ModalProps) {
  const navigate = useNavigate()

  const closeHandler = () => {
    navigate("..")
  }

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div className="modal-backdrop" onClick={closeHandler}>
      <dialog className="modal" open onClick={(event) => event.stopPropagation()}>
        {children}
      </dialog>
    </div>
  );
}

export default Modal;
