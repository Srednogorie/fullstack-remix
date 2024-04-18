import { Form, Outlet, useLoaderData, useLocation, useNavigation, useParams, useSearchParams } from '@remix-run/react';
import { json, redirect } from '@remix-run/node';

import { Button } from '~/components/buttons';
import { H1 } from '~/components/headings';
import { ListLinkItem } from '~/components/links';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { SearchInput } from '~/components/forms';
import axios from 'axios';
import { clsx } from 'clsx';
import { logger } from '~/logger.server';
import { requireUserId } from '~/modules/session/session.server';

const PAGE_SIZE = 2;

export async function loader({ request }: LoaderFunctionArgs) {
  // const userId = await requireUserId(request);
  await requireUserId(request)

  const url = new URL(request.url);

  try {
    const response = await axios.get(`/expenses/${url.search}`)
    return json(
      { "count": response.data.total, "expenses": response.data.items}
    );
  } catch(error) {
    logger.error(new Error(error as string))
    return redirect("/")
  }
}

export default function Component() {
  const navigation = useNavigation();
  const { count, expenses } = useLoaderData<typeof loader>();
  const { id } = useParams();
  const location = useLocation();

  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const pageNumber = searchParams.get('page') ? Number(searchParams.get('page')) : 1;

  const isOnFirstPage = pageNumber === 1;
  const showPagination = count > PAGE_SIZE || !isOnFirstPage;

  return (
    <div className="w-full">
      <H1>Your expenses</H1>
      <div className="mt-10 w-full flex flex-col-reverse lg:flex-row">
        <section className="lg:p-8 w-full lg:max-w-2xl">
          <h2 className="sr-only">All expenses</h2>
          <Form method="GET" action={location.pathname}>
            <input type="hidden" name="page" value={1} />
            <SearchInput name="q" type="search" label="Search by title" defaultValue={searchQuery} />
          </Form>
          <ul className="flex flex-col">
            {expenses.map((expense) => (
              <ListLinkItem
                key={expense.id}
                to={`/dashboard/expenses/${expense.id}/?q=${searchQuery}&page=${pageNumber}`}
                isActive={expense.id == id}
                deleteProps={{
                  ariaLabel: `Delete expense ${expense.title}`,
                  action: `/dashboard/expenses/${expense.id}?index`,
                  attachmentUrl: `${expense.attachment}`,
                }}
              >
                <p>
                  <i>{new Date(expense.created).toLocaleDateString('en-UK')}</i>
                </p>
                <p className="text-xl font-semibold">{expense.title}</p>
                <p>
                  <b>
                    {Intl.NumberFormat('en-US', { style: 'currency', currency: expense.currency_code }).format(
                      expense.amount,
                    )}
                  </b>
                </p>
              </ListLinkItem>
            ))}
          </ul>
          {showPagination && (
            <Form preventScrollReset={true} method="GET" action={location.pathname} className="flex justify-between pb-10">
              <input type="hidden" name="q" value={searchQuery} />
              <Button type="submit" name="page" value={pageNumber - 1} disabled={pageNumber === 1}>
                Previous
              </Button>
              <Button type="submit" name="page" value={pageNumber + 1} disabled={count <= pageNumber * PAGE_SIZE}>
                Next
              </Button>
            </Form>
          )}
        </section>
        <section className={clsx('lg:p-8 w-full', navigation.state === 'loading' && 'motion-safe:animate-pulse')}>
          <Outlet />
        </section>
      </div>
    </div>
  );
}
