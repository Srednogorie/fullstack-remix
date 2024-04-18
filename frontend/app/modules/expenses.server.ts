import zod from 'zod';
import { deleteFile } from './s3.server';
import { logger } from '~/logger.server';
import axios from 'axios';

type ExpenseCreateData = {
  title: string;
  description: string;
  amount: number;
  userId: string;
  attachment?: string;
};

export async function deleteExpense(id: string, userId: string) {
  //
}

type ExpenseUpdateData = {
  id: string;
  userId: string;
  title: string;
  description: string;
  amount: number;
  attachment?: string;
};

export const removeAttachmentFromExpense = async (id: string, userId: string, fileName: string) => {
  console.log('removeAttachmentFromExpense', id, userId, fileName);

  try {
    const expense = await axios.get(`/expenses/${id}`)
    if (expense.data.attachment) {
      deleteFile({Key: fileName})
      expense.data.attachment = null
      console.log('deleteExpense', expense.data)
      await axios.put(`/expenses/${id}`, expense.data)
    }
  } catch(err) {
    logger.error(new Error(err as string))
  }
}

const expenseSchema = zod.object({
  title: zod.string(),
  description: zod.string(),
  amount: zod.string(),
});

export function parseExpense(formData: FormData) {
  const data = Object.fromEntries(formData);
  const { title, description, amount } = expenseSchema.parse(data);
  const amountNumber = Number.parseFloat(amount);
  if (Number.isNaN(amountNumber)) {
    throw Error('Invalid amount');
  }
  let attachment: FormDataEntryValue | null | undefined = formData.get('attachment');
  if (!attachment || typeof attachment !== 'string') {
    attachment = undefined;
  }
  return { title, description, amount: amountNumber, attachment };
}
