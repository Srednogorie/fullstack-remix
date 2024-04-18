import type { ActionFunctionArgs, LoaderFunctionArgs, SerializeFrom } from '@remix-run/node';
import { defer, json, redirect, unstable_parseMultipartFormData } from '@remix-run/node';
import {
  Await,
  isRouteErrorResponse,
  useActionData,
  useLoaderData,
  useNavigation,
  useParams,
  useRouteError,
} from '@remix-run/react';
import axios from 'axios';
import { Suspense } from 'react';

import { Button } from '~/components/buttons';
import { Attachment, Form, Input, Textarea } from '~/components/forms';
import { H2, H3 } from '~/components/headings';
import { FloatingActionLink } from '~/components/links';
import { logger } from '~/logger.server';
import { uploadHandler } from '~/modules/attachments.server';
import { parseInvoice } from '~/modules/invoices.server';
import { emitter } from '~/modules/server-sent-events/events.server';
import { requireUserId } from '~/modules/session/session.server';

async function handleDelete(request: Request, id: string, userId: string): Promise<Response> {
  const referer = request.headers.get('referer');
  const redirectPath = referer || '/dashboard/income';

  try {
    await axios.delete(`/invoices/${id}`)
  } catch (err) {
    return json({ success: false });
  }

  emitter.emit(userId);
  if (redirectPath.includes(id)) {
    return redirect('/dashboard/income');
  }
  return redirect(redirectPath);
}

async function handleUpdate(formData: FormData, id: string): Promise<Response> {
  const invoiceData = parseInvoice(formData);
  // await updateInvoice({ id, userId, ...invoiceData });
  // emitter.emit(userId);
  // return json({ success: true });

  try {
    invoiceData.attachment = null
    invoiceData.currency_code = "USD"
    await axios.put(`/invoices/${id}`, {...invoiceData, invoice_id: id})
    await axios.post("/invoice_logs/", {...invoiceData, invoice_id: id})
    return json({ success: true });
  } catch (error) {
    logger.error(new Error(error as string))
    return null
  }
}

async function handleRemoveAttachment(formData: FormData, id: string, userId: string): Promise<Response> {
  const attachmentUrl = formData.get('attachmentUrl');
  if (!attachmentUrl || typeof attachmentUrl !== 'string') {
    throw Error('something went wrong');
  }
  const fileName = attachmentUrl.split('/').pop();
  if (!fileName) throw Error('something went wrong');
  // Not implemented for invoices
  // await removeAttachmentFromInvoice(id, userId, fileName);
  emitter.emit(userId);
  return json({ success: true });
}

export async function action({ params, request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const { id } = params;
  if (!id) throw Error('id route parameter must be defined');

  let formData: FormData;
  const contentType = request.headers.get('content-type');
  if (contentType?.toLowerCase().includes('multipart/form-data')) {
    formData = await unstable_parseMultipartFormData(request, uploadHandler);
  } else {
    formData = await request.formData();
  }

  const intent = formData.get('intent');
  if (intent === 'delete') {
    return handleDelete(request, id, userId);
  }
  if (intent === 'update') {
    return handleUpdate(formData, id, userId);
  }
  if (intent === 'remove-attachment') {
    return handleRemoveAttachment(formData, id, userId);
  }
  throw new Response('Bad request', { status: 400 });
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireUserId(request);
  const { id } = params;
  if (!id) throw Error('id route parameter must be defined');

  try {
    // TODO: this can be nested expense/logs response?
    const invoice_response = await axios.get(`/invoices/${id}`)
    const invoice = invoice_response.data
    const invoiceLogsResponse = await axios.get(`/invoice_logs/?invoice_id=${id}`)
    const invoiceLogs = invoiceLogsResponse.data
    return defer({ invoice, invoiceLogs });
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
  const { invoice, invoiceLogs } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state !== 'idle' && navigation.formAction === `/dashboard/income/${invoice.id}?index`;
  const actionData = useActionData<typeof action>();
  const attachment = navigation.formData?.get('attachment');
  const isUploadingAttachment = attachment instanceof File && attachment.name !== '';
  const isRemovingAttachment = navigation.formData?.get('intent') === 'remove-attachment';
  return (
    <>
      <Form
        method="POST"
        action={`/dashboard/income/${invoice.id}?index`}
        key={invoice.id}
        encType="multipart/form-data"
      >
        <Input label="Title:" type="text" name="title" defaultValue={invoice.title} required />
        <Textarea label="Description:" name="description" defaultValue={invoice.description || ''} />
        <Input label="Amount (in USD):" type="number" defaultValue={invoice.amount} name="amount" required />
        {(isUploadingAttachment || invoice.attachment) && !isRemovingAttachment ? (
          <Attachment
            label="Current Attachment"
            attachmentUrl={`/dashboard/income/${invoice.id}/attachments/${invoice.attachment}`}
            disabled={isUploadingAttachment}
          />
        ) : (
          <Input label="New Attachment" type="file" name="attachment" disabled={isSubmitting} />
        )}
        <Button type="submit" name="intent" value="update" disabled={isSubmitting} isPrimary>
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
        <p aria-live="polite" className="text-green-600">
          {actionData?.success && 'Changes saved!'}
        </p>
      </Form>
      <section className="my-5 w-full m-auto lg:max-w-3xl flex flex-col items-center justify-center gap-5">
        <H3>Invoice History</H3>
        <Suspense fallback="Loading invoice history..." key={invoice.id}>
          <Await resolve={invoiceLogs} errorElement="There was an error loading the invoice history. Please try again.">
            {(resolvedInvoiceLogs) => <InvoiceLogs invoiceLogs={resolvedInvoiceLogs} />}
          </Await>
        </Suspense>
      </section>
      <FloatingActionLink to="/dashboard/income/">Add invoice</FloatingActionLink>
    </>
  );
}

function InvoiceLogs({ invoiceLogs }: { invoiceLogs: SerializeFrom<InvoiceLog[]> }) {
  return (
    <ul className="space-y-2 max-h-[300px] lg:max-h-max overflow-y-scroll lg:overflow-hidden py-5">
      {invoiceLogs.map((invoiceLog) => (
        <li key={invoiceLog.id}>
          <p>
            <b>
              {`${invoiceLog.title} - ${Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: invoiceLog.currency_code,
              }).format(invoiceLog.amount)}`}
            </b>
          </p>
          {invoiceLog.description && (
          <p>
              <i>{invoiceLog.description}</i>
            </p>
          )}
          <p className="text-sm text-gray-500">
            {`${new Date(invoiceLog.created).toLocaleDateString("en-UK")} ${new Date(
              invoiceLog.created,
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
    heading = 'Invoice not found';
    message = `Apologies, the invoice with the id ${id} cannot be found.`;
  }
  return (
    <>
      <div className="w-full m-auto lg:max-w-3xl flex flex-col items-center justify-center gap-5">
        <H2>{heading}</H2>
        <p>{message}</p>
      </div>
      <FloatingActionLink to="/dashboard/income/">Add invoice</FloatingActionLink>
    </>
  );
}
