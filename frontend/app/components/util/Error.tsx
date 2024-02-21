import { FaExclamationCircle } from 'react-icons/fa';

type ErrorProps = {
  title: string,
  children: JSX.Element,
};

function Error({ title, children }: ErrorProps) {
  return (
    <div className="error">
      <div className="icon">
        <FaExclamationCircle />
      </div>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export default Error;
