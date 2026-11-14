import { redirect } from 'next/navigation';

/** Legacy route — overlay in root layout handles backend downtime. */
export default function MaintenancePage() {
  redirect('/');
}
