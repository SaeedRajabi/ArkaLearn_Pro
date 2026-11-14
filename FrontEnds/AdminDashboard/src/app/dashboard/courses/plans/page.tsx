import { redirect } from 'next/navigation';

export default function LegacyTrainingPlansRedirect() {
  redirect('/dashboard/education-plans');
}
