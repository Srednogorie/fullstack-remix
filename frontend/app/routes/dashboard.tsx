import { Form, Outlet, Link as RemixLink, useLoaderData, useLocation, useRouteError } from '@remix-run/react';
import type { HeadersFunction, LoaderFunctionArgs, MetaFunction, SerializeFrom } from '@remix-run/node';

import { Container } from '~/components/containers';
import { H1 } from '~/components/headings';
import { NavLink } from '~/components/links';
import axios from 'axios';
import { json } from '@remix-run/node';
import { logger } from '~/logger.server';
import { requireUserId } from '~/modules/session/session.server';
import type { loader as rootLoader } from '~/root';
import { useEventSource } from '~/modules/server-sent-events/event-source';

export const headers: HeadersFunction = () => {
  return {
    'Cache-Control': 'no-cache, private',
  };
};

export const meta: MetaFunction<typeof loader, { root: typeof rootLoader }> = ({ matches }) => {
  const root = matches.find((match) => match.id === 'root');
  const userName = root?.data?.user?.username || null;
  const title = userName ? `${userName}'s Dashboard | BeeRich` : 'Dashboard | BeeRich';
  return [{ title }, { name: 'robots', content: 'noindex' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  // throw Error('Something went wrong on the BE!');
  await requireUserId(request);
  try {
    const firstExpense = (await axios.get('/expenses/first')).data
    const firstInvoice = (await axios.get('/invoices/first')).data
    return json(
      { firstExpense, firstInvoice }
    );
  } catch(error) {
    logger.error( new Error(error as string))
    return {firstExpense: null, firstInvoice: null}
  }
}

type LayoutProps = {
  firstExpense: SerializeFrom | null;
  firstInvoice: SerializeFrom | null;
  children: React.ReactNode;
};

function Layout({ firstExpense, firstInvoice, children }: LayoutProps) {
  const location = useLocation();
  return (
    <>
      <header>
        <Container className="p-4 mb-10">
          <nav>
            <ul className="w-full flex flex-row gap-5 font-bold text-lg lg:text-2xl">
              <li>
                <RemixLink to="/">BeeRich</RemixLink>
              </li>
              <li className="ml-auto">
                <Form method="POST" action="/logout">
                  <button type="submit">Log out</button>
                </Form>
              </li>
            </ul>
            <ul className="mt-10 w-full flex flex-row gap-5">
              <li className="ml-auto">
                <NavLink
                  to={firstInvoice ? `/dashboard/income/${firstInvoice.id}` : '/dashboard/income'}
                  styleAsActive={location.pathname.startsWith('/dashboard/income')}
                  prefetch="intent"
                >
                  Income
                </NavLink>
              </li>
              <li className="mr-auto">
                <NavLink
                  to={firstExpense ? `/dashboard/expenses/${firstExpense.id}` : '/dashboard/expenses'}
                  styleAsActive={location.pathname.startsWith('/dashboard/expenses')}
                  prefetch="intent"
                >
                  Expenses
                </NavLink>
              </li>
            </ul>
          </nav>
        </Container>
      </header>
      <main className="p-4 w-full flex justify-center items-center">{children}</main>
    </>
  );
}

export default function Component() {

  // useEffect(() => {    throw Error('Something went wrong on the FE!');  }, [])

  const { firstExpense, firstInvoice } = useLoaderData<typeof loader>();
  useEventSource();
  return (
    <Layout firstExpense={firstExpense} firstInvoice={firstInvoice}>
      <Outlet />
    </Layout>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const errorMessage = error instanceof Error && error.message;
  return (
    <Layout firstExpense={null} firstInvoice={null}>
      <Container className="p-5 lg:p-20 flex flex-col gap-5">
        <H1>Unexpected Error</H1>
        <p>We are very sorry. An unexpected error occurred. Please try again or contact us if the problem persists.</p>
        {errorMessage && (
          <div className="border-4 border-red-500 p-10">
            <p>Error message: {error.message}</p>
          </div>
        )}
      </Container>
    </Layout>
  );
}
