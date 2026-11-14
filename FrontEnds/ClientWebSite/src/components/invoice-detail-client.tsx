'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getInvoiceById, payInvoice, type InvoiceDetail } from '@/lib/api/invoices';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CreditCard, CheckCircle, ArrowLeft, Download, Loader2 } from 'lucide-react';
import { getInvoiceStatusText, getInvoiceStatusColor, normalizeInvoiceStatus } from '@/lib/utils/invoice-utils';
import { useLanguage } from '@/contexts/language-context';
import { useNavigationLoading } from '@/contexts/navigation-loading-context';
import { ApiError } from '@/lib/api/client';

const INVOICES_DASHBOARD_HREF = '/account?view=invoices';

export function InvoiceDetailClient({
  invoiceId,
  isModal = false,
  onPaid,
}: {
  invoiceId: number;
  isModal?: boolean;
  onPaid?: () => void;
}) {
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [isNavigatingBack, setIsNavigatingBack] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { beginLoading } = useNavigationLoading();
  const { locale } = useLanguage();
  const isFa = locale === 'fa';
  const tr = {
    loadErrorTitle: isFa ? 'خطا در بارگذاری فاکتور' : 'Invoice load error',
    loadErrorDesc: isFa ? 'بارگذاری فاکتور با خطا مواجه شد. لطفاً بعداً دوباره تلاش کنید.' : 'The invoice could not be loaded. Please try again later.',
    paymentErrorTitle: isFa ? 'خطا در پرداخت' : 'Payment error',
    paymentErrorDesc: isFa ? 'پرداخت فاکتور با خطا مواجه شد.' : 'Invoice payment failed.',
    invoiceNumber: isFa ? 'شماره فاکتور' : 'Invoice number',
    issuedAt: isFa ? 'تاریخ صدور' : 'Issued at',
    print: isFa ? 'نمایش / چاپ فاکتور' : 'View / print invoice',
    items: isFa ? 'اقلام فاکتور' : 'Invoice items',
    quantity: isFa ? 'تعداد' : 'Quantity',
    total: isFa ? 'مجموع' : 'Total',
    unitPrice: isFa ? 'قیمت واحد' : 'Unit price',
    emptyItems: isFa ? 'موردی برای این سفارش پیدا نشد.' : 'No items were found for this order.',
    paymentSummary: isFa ? 'مبلغ قابل پرداخت' : 'Payment total',
    description: isFa ? 'توضیحات فاکتور' : 'Invoice description',
    back: isFa ? 'بازگشت' : 'Back',
    goingBack: isFa ? 'در حال بازگشت...' : 'Going back...',
    paying: isFa ? 'در حال پرداخت...' : 'Processing payment...',
    pay: isFa ? 'پرداخت' : 'Pay',
    paid: isFa ? 'این فاکتور پرداخت شده است.' : 'This invoice has been paid.',
    redirecting: isFa ? 'در حال انتقال به درگاه پرداخت…' : 'Redirecting to payment gateway…',
    walletPaidTitle: isFa ? 'پرداخت موفق' : 'Payment successful',
    walletPaidDesc: isFa
      ? 'مبلغ از کیف پول شما کسر شد و فاکتور پرداخت گردید.'
      : 'The amount was deducted from your wallet and the invoice is paid.',
  };

  const goToInvoicesDashboard = () => {
    if (isNavigatingBack) return;
    setIsNavigatingBack(true);
    beginLoading();
    router.push(INVOICES_DASHBOARD_HREF);
  };

  const fetchInvoiceData = async () => {
    setIsLoading(true);
    try {
      const data = await getInvoiceById(invoiceId);

      if (data) {
        setInvoice(data);
      } else {
        toast({
          title: tr.loadErrorTitle,
          description: tr.loadErrorDesc,
          variant: 'destructive',
        });

        if (!isModal) goToInvoicesDashboard();
      }
    } catch (err) {
      console.error('Failed to fetch invoice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isModal) {
      router.prefetch(INVOICES_DASHBOARD_HREF);
    }
  }, [isModal, router]);

  useEffect(() => {
    fetchInvoiceData().then(x => x);
  }, [invoiceId, isModal]);

  const handlePayment = async () => {
    if (!invoice || isPaying) return;
    setIsPaying(true);
    try {
      const due =
        Number(invoice.remainingAmount) > 0
          ? Number(invoice.remainingAmount)
          : Math.max(0, Number(invoice.totalAmount) - Number(invoice.paidAmount || 0));

      const outcome = await payInvoice(invoiceId, due);
      if (outcome === 'wallet') {
        toast({
          title: tr.walletPaidTitle,
          description: tr.walletPaidDesc,
        });
        onPaid?.();
        if (isModal) {
          await fetchInvoiceData();
          setIsPaying(false);
          return;
        }
        beginLoading();
        router.push(INVOICES_DASHBOARD_HREF);
        return;
      }
      // Gateway redirect — keep paying state until unload.
    } catch (error) {
      console.error('Payment failed:', error);
      const message = error instanceof ApiError ? error.message : tr.paymentErrorDesc;
      toast({
        title: tr.paymentErrorTitle,
        description: message || tr.paymentErrorDesc,
        variant: 'destructive',
      });
      setIsPaying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>;
  }

  if (!invoice) return null;

  const isPaid = normalizeInvoiceStatus(invoice.status) === 'PAID';
  const isFreeInvoice = invoice.totalAmount === 0;
  const showPayButton = !isPaid && !isFreeInvoice;
  const formattedDate = new Intl.DateTimeFormat(isFa ? 'fa-IR' : 'en-US', { dateStyle: 'medium' }).format(new Date(invoice.invoiceDate));
  const formatMoney = (value: number) => {
    if (value === 0) return isFa ? 'رایگان' : 'Free';
    return new Intl.NumberFormat(isFa ? 'fa-IR' : 'en-US', { maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div dir={locale === 'fa' ? 'rtl' : 'ltr'} className={isModal ? 'w-full' : 'max-w-4xl mx-auto print:max-w-full print:w-full'}>
      <Card className={`mb-8 ${isModal ? 'border-0 shadow-none' : 'print:shadow-none print:border-none'}`}>
        <CardHeader className="flex flex-row items-center justify-between print:px-0">
          <div>
            <CardTitle className="font-body">{tr.invoiceNumber}: {invoice.invoiceNumber}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {tr.issuedAt}: {formattedDate}
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button className='font-subtitle' variant="outline" size="sm" onClick={handlePrint}>
              <Download className="h-4 w-4 mr-2" />
              {tr.print}
            </Button>
            <Badge
              variant={getInvoiceStatusColor(invoice.status)}
              className="text-lg font-subtitle px-4 py-1"
            >
              {getInvoiceStatusText(invoice.status, locale)}
            </Badge>
          </div>
          <div className="hidden print:block">
            <span className="font-bold  border px-2 py-1 rounded">
              {getInvoiceStatusText(invoice.status, locale)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="print:px-0">
          <div className="space-y-6">
            <div>
              <h3 className="font-subtitle font-bold mb-2">{tr.items}</h3>
              <div className="border rounded-md divide-y print:border-gray-300">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, index) => (
                    <div key={index} className="p-4 flex justify-between items-center print:py-2">
                      <div>
                        <p className="font-subtitle font-medium">{item.courseTitle}</p>
                        <p className="font-subtitle text-sm text-muted-foreground">{tr.quantity}: {item.quantity}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-subtitle font-medium">{formatMoney(item.totalPrice)} {tr.total}</p>
                        <p className="font-subtitle text-xs text-muted-foreground">{formatMoney(item.unitPrice)} / {tr.unitPrice}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">{tr.emptyItems}</div>
                )}
              </div>
            </div>

            <Separator className="print:my-2" />

            <div className="flex justify-between items-center">
              <span className="font-bold font-subtitle text-lg">{tr.paymentSummary}</span>
              <span className="font-bold font-subtitle text-2xl text-primary">{formatMoney(invoice.totalAmount)}</span>
            </div>

            {invoice.description && (
              <div className="bg-muted/30 p-4 rounded-md print:bg-gray-100 print:border">
                <p className="text-sm font-subtitle font-medium mb-1">{tr.description}</p>
                <p className="text-sm font-subtitle text-muted-foreground">{invoice.description}</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between bg-muted/10 p-6 print:hidden">
          {!isModal && (
            <Button
              className="font-subtitle"
              variant="outline"
              onClick={goToInvoicesDashboard}
              disabled={isNavigatingBack || isPaying}
            >
              {isNavigatingBack ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowLeft className="h-4 w-4 mr-2" />
              )}
              {isNavigatingBack ? tr.goingBack : tr.back}
            </Button>
          )}

          {!showPayButton ? (
            isPaid || isFreeInvoice ? (
              <div className={`flex items-center text-green-600 font-medium ${isModal ? 'w-full justify-center' : ''}`}>
                <CheckCircle className="h-5 w-5 mr-2" />
                {tr.paid}
              </div>
            ) : null
          ) : (
            <Button
              size="lg"
              className={`bg-green-600 hover:bg-green-700 font-body text-white ${isModal ? 'w-full' : ''}`}
              onClick={handlePayment}
              disabled={isPaying || isNavigatingBack}
            >
              {isPaying ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
              {isPaying ? tr.paying : tr.pay}
              {!isPaying && <CreditCard className="h-5 w-5 ml-2" />}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
