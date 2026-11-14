import { redirect } from 'next/navigation';

export default function LegacyCourseCategoriesPage() {
  redirect('/dashboard/categories');
}
