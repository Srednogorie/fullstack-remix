import { Link, NavLink } from '@remix-run/react';
import Logo from '../util/Logo';

function MainHeader() {
  return (
    <header id="main-header">
      <Logo />
      <nav id="main-nav">
        <ul>
          <li>
            <NavLink to="/">Home</NavLink>
          </li>
          <li>
            <NavLink to="/pricing">Pricing</NavLink>
          </li>
        </ul>
      </nav>
      <nav id="cta-nav">
        <ul>
          <li>
            <Link to="/login" className="cta">
              Login
            </Link>
          </li>
          <li>
            <Link to="/signin" className="cta">
              Register
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default MainHeader;
