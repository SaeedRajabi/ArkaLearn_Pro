import { EmailSettingsForm } from './components/email-settings-form';
import { EmailTemplatesManager } from './components/email-templates-manager';

export default function EmailSettingsPage() {
  return (
    <div className="space-y-6">
      <EmailSettingsForm />
      <EmailTemplatesManager />
    </div>
  );
}
