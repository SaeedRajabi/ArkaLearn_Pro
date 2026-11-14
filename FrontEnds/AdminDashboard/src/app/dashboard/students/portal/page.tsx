import { redirect } from 'next/navigation';

export default function PortalStudentsRedirectPage() {
  redirect('/dashboard/users/students');
}
