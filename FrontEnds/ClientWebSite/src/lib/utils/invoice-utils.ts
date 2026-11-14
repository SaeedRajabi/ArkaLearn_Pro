export const normalizeInvoiceStatus = (status: string) => status.trim().toUpperCase();

export const getInvoiceStatusText = (status: string, locale: 'fa' | 'en' = 'fa') => {
  const isEnglish = locale === 'en';
  switch (normalizeInvoiceStatus(status)) {
    case 'PAID': return isEnglish ? 'Paid' : 'پرداخت شده';
    case 'ISSUED': return isEnglish ? 'Awaiting payment' : 'در انتظار پرداخت';
    case 'DRAFT': return isEnglish ? 'Draft' : 'ذخیره شده';
    case 'CANCELLED':
    case 'CANCELED': return isEnglish ? 'Cancelled' : 'لغو شده';
    default: return status;
  }
};

export const getInvoiceStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" | null | undefined => {
  switch (normalizeInvoiceStatus(status)) {
    case 'PAID': return 'default'; // Ø³Ø¨Ø²
    case 'ISSUED': return 'secondary'; // Ø²Ø±Ø¯/Ø®Ø§Ú©Ø³ØªØ±ÛŒ
    case 'CANCELLED':
    case 'CANCELED': return 'destructive'; // Ù‚Ø±Ù…Ø²
    default: return 'outline';
  }
};
