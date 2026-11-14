export function ticketSourceLabel(source: string, t: (key: string) => string): string {
  if (source === 'Platform') return t('support_tickets_source_platform');
  if (source === 'Contact') return t('support_tickets_source_contact');
  if (source === 'IpUnblock') return t('support_tickets_source_ip_unblock');
  return source;
}

export function departmentLabel(department: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    Support: t('support_tickets_dept_support'),
    Services: t('support_tickets_dept_services'),
    Sales: t('support_tickets_dept_sales'),
    SoftwareDevelopment: t('support_tickets_dept_software'),
  };
  return map[department] ?? department;
}

export function statusLabel(status: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    Open: t('support_tickets_status_open'),
    Replied: t('support_tickets_status_replied'),
    UnderReview: t('support_tickets_status_under_review'),
    ViewedByAdmin: t('support_tickets_status_viewed_by_admin'),
    Answered: t('support_tickets_status_answered'),
    Closed: t('support_tickets_status_closed'),
  };
  return map[status] ?? status;
}

export function formatTicketDate(
  value: string | null | undefined,
  locale: string,
): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}
