import type { ActionFunctionArgs, LoaderFunctionArgs, SerializeFrom } from '@remix-run/node';
import { Attachment, Form, Input, Textarea } from '~/components/forms';
import {
  Await,
  isRouteErrorResponse,
  useActionData,
  useLoaderData,
  useNavigation,
  useParams,
  useRouteError,
} from '@remix-run/react';
import { H2, H3 } from '~/components/headings';
import { defer, json, redirect } from '@remix-run/node';

import { Button } from '~/components/buttons';
import { FloatingActionLink } from '~/components/links';
import { Suspense } from 'react';
import axios from 'axios';
import { logger } from '~/logger.server';
import { requireUserId } from '~/modules/session/session.server';

async function handleDelete(request: Request, id: string): Promise<Response> {
  const referer = request.headers.get('referer');
  const redirectPath = referer || '/dashboard/expenses';

  // await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    // await handleRemoveAttachment(formData, id, userId)
    await axios.delete(`/expenses/${id}`)
  } catch (err) {
    return json({ success: false });
  }

  // emitter.emit(userId);
  if (redirectPath.includes(id)) {
    return redirect('/dashboard/expenses');
  }
  return redirect(redirectPath);
}

async function handleUpdate(
  request: Request, id: string, userId: string, formData: FormData
): Promise<Response> {
  try {
    const expense = await axios.put(`/expenses/${id}`, formData)
    const logData = {
      title: expense.data.title,
      description: expense.data.description,
      amount: expense.data.amount,
      currency_code: expense.data.currency_code,
      expense_id: expense.data.id
    }
    await axios.post("/expense_logs/", logData)
    // emitter.emit(userId);
    return json({ success: true });
  } catch (error) {
    logger.error(new Error(error as string))
    return null
  }
}

async function handleRemoveAttachment(formData: FormData, id: string): Promise<Response> {
  const attachmentUrl = formData.get('attachmentUrl');
  if (!attachmentUrl || typeof attachmentUrl !== 'string') {
    throw Error('something went wrong');
  }
  try {
    await axios.post(`/expenses/${id}/delete-attachment`)
  } catch (error) {
    logger.error(new Error(error as string))
  }
  // emitter.emit(userId);
  return json({ success: true });
}

export async function action({ params, request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const { id } = params;
  if (!id) throw Error('id route parameter must be defined');

  const formData = await request.formData();

  const intent = formData.get('intent');
  if (intent === 'delete') {
    return handleDelete(request, id, userId, formData);
  }
  if (intent === 'update') {
    return handleUpdate(request, id, userId, formData);
  }
  if (intent === 'remove-attachment') {
    return handleRemoveAttachment(formData, id, userId);
  }
  throw new Response('Bad request', { status: 400 });
}

async function getLogs(id) {
  // const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  // await delay(5000)
  const expenseLogsResponse = await axios.get(`/expense_logs/?expense_id=${id}`)
  const expenseLogs = expenseLogsResponse.data
  return expenseLogs
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireUserId(request);
  const { id } = params;
  if (!id) throw Error('id route parameter must be defined');

  try {
    // TODO: this can be nested expense/logs response?
    const expense_response = await axios.get(`/expenses/${id}`)
    const expense = expense_response.data
    // Note we are not awaiting the expenseLogs promise here and passing it unresolved,
    // so it will be awaited in the Suspense/Await boundary
    const expenseLogs = getLogs(id)
    return defer({ expense, expenseLogs });
  } catch (error) {
    logger.error(new Error(error as string))
    // session.flash('toastMessage', "Something went wrong. Please, try again later.")
    // return redirect("/expenses", {
    //   headers: { 'Set-Cookie': await authSessionStorage.commitSession(session)},
    // })
    throw new Response('Not found', { status: 404 })
  }
}

export default function Component() {
  const { expense, expenseLogs } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state !== 'idle' && navigation.formAction === `/dashboard/expenses/${expense.id}?index`;
  const actionData = useActionData<typeof action>();
  const attachment = navigation.formData?.get('attachment');
  const isUploadingAttachment = attachment instanceof File && attachment.name !== '';
  const isRemovingAttachment = navigation.formData?.get('intent') === 'remove-attachment';
  return (
    <>
      <Form method="POST" action={`/dashboard/expenses/${expense.id}?index`} key={expense.id} encType="multipart/form-data">
        <Input label="Title:" type="text" name="title" defaultValue={expense.title} required />
        <Textarea label="Description:" name="description" defaultValue={expense.description || ''} />
        <Input label="Amount (in USD):" type="number" defaultValue={expense.amount} name="amount" required />
        {(isUploadingAttachment || expense.attachment) && !isRemovingAttachment ? (
          <Attachment
            label="Current Attachment"
            attachmentUrl={expense.attachment}
            disabled={isUploadingAttachment}
          />
        ) : (
          <Input label="New Attachment" type="file" name="attachment" disabled={isSubmitting} />
        )}
        <Button type="submit" name="intent" value="update" isPrimary>
          Save
        </Button>
        <p aria-live="polite" className="text-green-600">
          {actionData?.success && 'Changes saved!'}
        </p>
      </Form>
      <section className="my-5 w-full m-auto lg:max-w-3xl flex flex-col items-center justify-center gap-5">
        <H3>Expense History</H3>
        <Suspense fallback="Loading expense history..." key={expense.id}>
          <Await resolve={expenseLogs} errorElement="There was an error loading the expense history. Please try again.">
            {(resolvedExpenseLogs) => <ExpenseLogs expenseLogs={resolvedExpenseLogs} />}
          </Await>
        </Suspense>
      </section>
      <FloatingActionLink to="/dashboard/expenses/">Add expense</FloatingActionLink>
    </>
  );
}

function ExpenseLogs({ expenseLogs }: { expenseLogs: SerializeFrom<ExpenseLog[]> }) {
  return (
    <ul className="space-y-2 max-h-[300px] lg:max-h-max overflow-y-scroll lg:overflow-hidden py-5">
      {expenseLogs.map((expenseLog) => (
        <li key={expenseLog.id}>
          <p>
            <b>
              {`${expenseLog.title} - ${Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: expenseLog.currency_code,
              }).format(expenseLog.amount)}`}
            </b>
          </p>
          {expenseLog.description && (
            <p>
              <i>{expenseLog.description}</i>
            </p>
          )}
          <p className="text-sm text-gray-500">
            {`${new Date(expenseLog.created).toLocaleDateString("en-UK")} ${new Date(
              expenseLog.created,
            ).toLocaleTimeString("en-UK")}`}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const { id } = useParams();
  let heading = 'Something went wrong';
  let message = `Apologies, something went wrong on our end, please try again.`;
  if (isRouteErrorResponse(error) && error.status === 404) {
    heading = 'Expense not found';
    message = `Apologies, the expense with the id ${id} cannot be found.`;
  }
  return (
    <>
      <div className="w-full m-auto lg:max-w-3xl flex flex-col items-center justify-center gap-5">
        <H2>{heading}</H2>
        <p>{message}</p>
      </div>
      <FloatingActionLink to="/dashboard/expenses/">Add expense</FloatingActionLink>
    </>
  );
}
