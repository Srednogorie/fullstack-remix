import type { ActionFunctionArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useNavigation } from '@remix-run/react';
import axios from 'axios';

import { Button } from '~/components/buttons';
import { Form, Input, Textarea } from '~/components/forms';
import { logger } from '~/logger.server';
import { requireUserId } from '~/modules/session/session.server';

export async function action({ request }: ActionFunctionArgs) {
  await requireUserId(request);
  const formData = await request.formData();

  try {
    // The /expenses endpoint accepts form data where the /expense_logs endpoint accepts JSON
    const expenseResponse = await axios.post("/expenses/", formData)
    const logRecord = {
      title: expenseResponse.data.title,
      description: expenseResponse.data.description,
      amount: expenseResponse.data.amount,
      currency_code: expenseResponse.data.currency_code,
      expense_id: expenseResponse.data.id
    }
    await axios.post("/expense_logs/", logRecord)
    return redirect(`/dashboard/expenses/${expenseResponse.data.id}`);
    // emitter.emit(userId);
  } catch(error) {
    logger.error(new Error(error as string))
    return new Response("Internal Server Error", { status: 500 })
  }
}

export default function Component() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state !== 'idle' && navigation.formAction === '/dashboard/expenses/?index';
  return (
    <Form method="POST" action="/dashboard/expenses/?index" encType="multipart/form-data">
      <Input label="Title:" type="text" name="title" placeholder="Dinner for Two" required />
      <Textarea label="Description:" name="description" />
      <Input label="Amount (in USD):" type="number" defaultValue={0} name="amount" required />
      <Input label="Attachment" type="file" name="attachment" />
      <Button type="submit" disabled={isSubmitting} isPrimary>
        {isSubmitting ? 'Creating...' : 'Create'}
      </Button>
    </Form>
  );
}
