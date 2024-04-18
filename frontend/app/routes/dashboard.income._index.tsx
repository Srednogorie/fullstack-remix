import { Form, Input, Textarea } from '~/components/forms';
import { redirect, unstable_parseMultipartFormData } from '@remix-run/node';

import type { ActionFunctionArgs } from '@remix-run/node';
import { Button } from '~/components/buttons';
import axios from 'axios';
import { logger } from '~/logger.server';
import { parseInvoice } from '~/modules/invoices.server';
import { uploadHandler } from '~/modules/attachments.server';
import { useNavigation } from '@remix-run/react';

export async function action({ request }: ActionFunctionArgs) {
  // const userId = await requireUserId(request);
  // const formData = await unstable_parseMultipartFormData(request, uploadHandler);
  // const invoiceData = parseInvoice(formData);
  // const invoice = await createInvoice({ userId, ...invoiceData });
  // emitter.emit(userId);
  // return redirect(`/dashboard/income/${invoice.id}`);


    // const userId = await requireUserId(request);
    const formData = await unstable_parseMultipartFormData(request, uploadHandler);
    const invoiceData = parseInvoice(formData);
    invoiceData.currency_code = "USD"
    invoiceData.attachment = null
    // const expense = await createExpense({ userId, ...expenseData });
    // emitter.emit(userId);
    // return redirect(`/dashboard/expenses/${expense.id}`);
  
    try {
      const invoiceResponse = await axios.post("/invoices/", invoiceData)
      delete invoiceData.attachment
      await axios.post("/invoice_logs/", {...invoiceData, invoice_id: invoiceResponse.data.id})
      return redirect(`/dashboard/income/${invoiceResponse.data.id}`);
    } catch(error) {
      logger.error(new Error(error as string))
      return redirect("/")
    }
}

export default function Component() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state !== 'idle' && navigation.formAction === '/dashboard/income/?index';
  return (
    <Form method="POST" action="/dashboard/income/?index" encType="multipart/form-data">
      <Input label="Title:" type="text" name="title" placeholder="Salary December 2022" required />
      <Textarea label="Description:" name="description" />
      <Input label="Amount (in USD):" type="number" defaultValue={0} name="amount" required />
      <Input label="Attachment" type="file" name="attachment" />
      <Button type="submit" disabled={isSubmitting} isPrimary>
        {isSubmitting ? 'Creating...' : 'Create'}
      </Button>
    </Form>
  );
}
