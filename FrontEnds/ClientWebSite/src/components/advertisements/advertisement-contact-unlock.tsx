'use client';

import * as React from 'react';
import Link from 'next/link';
import { Loader2, Lock, Phone, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { hasAdvertisementContactUnlock, type ContactUnlockStatus } from '@/lib/api/advertisement-monetization';
import { requestAdContactUnlockPayment } from '@/lib/api/payments';
import { hasAdvertisementContactDetails } from '@/lib/utils/advertisement-content-policy';

export type AdvertisementContactDetails = {
  contactPhone?: string | null;
  websiteUrl?: string | null;
  websiteTitle?: string | null;
  baleLink?: string | null;
  telegramLink?: string | null;
  whatsAppLink?: string | null;
  gitHubLink?: string | null;
  linkedInLink?: string | null;
};

type Props = {
  teacherId: number;
  canShowContact?: boolean;
  hasContactDetails?: boolean;
  dict: Record<string, string>;
} & AdvertisementContactDetails;

function formatCountdown(expiresAtUtc: string, lang: 'fa' | 'en') {
  const diff = new Date(expiresAtUtc).getTime() - Date.now();
  if (diff <= 0) return lang === 'en' ? 'Expired' : 'منقضی شده';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return lang === 'en' ? `${hours}h ${minutes}m left` : `${hours} ساعت و ${minutes} دقیقه باقی‌مانده`;
}

function ContactDetailsList({
  contact,
  dict,
}: {
  contact: AdvertisementContactDetails;
  dict: Record<string, string>;
}) {
  const socialLinks = [
    { label: dict.bale ?? 'Bale', href: contact.baleLink },
    { label: dict.telegram ?? 'Telegram', href: contact.telegramLink },
    { label: dict.whatsapp ?? 'WhatsApp', href: contact.whatsAppLink },
    { label: dict.github ?? 'GitHub', href: contact.gitHubLink },
    { label: dict.linkedin ?? 'LinkedIn', href: contact.linkedInLink },
  ].filter((link) => link.href);

  return (
    <div className="space-y-3 text-sm">
      {contact.contactPhone ? (
        <p className="inline-flex items-center gap-2 font-medium">
          <Phone className="h-4 w-4" />
          {contact.contactPhone}
        </p>
      ) : null}

      {contact.websiteUrl ? (
        <p>
          <a
            href={contact.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            {contact.websiteTitle || contact.websiteUrl}
          </a>
        </p>
      ) : null}

      {socialLinks.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {socialLinks.map((link) => (
            <Button key={link.label} asChild variant="outline" size="sm">
              <a href={link.href!} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AdvertisementContactUnlock({
  teacherId,
  canShowContact,
  hasContactDetails,
  dict,
  contactPhone,
  websiteUrl,
  websiteTitle,
  baleLink,
  telegramLink,
  whatsAppLink,
  gitHubLink,
  linkedInLink,
}: Props) {
  const contact: AdvertisementContactDetails = {
    contactPhone,
    websiteUrl,
    websiteTitle,
    baleLink,
    telegramLink,
    whatsAppLink,
    gitHubLink,
    linkedInLink,
  };

  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = React.useState<ContactUnlockStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [paying, setPaying] = React.useState(false);
  const lang = (dict.lang as 'fa' | 'en') || 'fa';
  const hasAnyContact = hasContactDetails ?? hasAdvertisementContactDetails(contact);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await hasAdvertisementContactUnlock(teacherId);
      setStatus(result);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (!status?.expiresAtUtc) return;
    const timer = window.setInterval(() => setStatus((s) => (s ? { ...s } : s)), 60000);
    return () => window.clearInterval(timer);
  }, [status?.expiresAtUtc]);

  const handleUnlock = async () => {
    if (!user) {
      toast({ title: dict.loginRequired ?? 'Please sign in first.', variant: 'destructive' });
      return;
    }
    setPaying(true);
    try {
      const { paymentUrl } = await requestAdContactUnlockPayment(teacherId);
      if (paymentUrl) window.location.href = paymentUrl;
    } catch (e) {
      const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : '';
      toast({
        title: dict.unlockError ?? 'Payment could not be started.',
        description: message || undefined,
        variant: 'destructive',
      });
    } finally {
      setPaying(false);
    }
  };

  if (canShowContact) {
    if (!hasAnyContact) {
      return <p className="text-sm text-muted-foreground">{dict.noContact ?? 'No contact details provided.'}</p>;
    }
    return <ContactDetailsList contact={contact} dict={dict} />;
  }

  if (status?.contactVisibleWithoutPayment && hasAnyContact) {
    return <ContactDetailsList contact={contact} dict={dict} />;
  }

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  const price = status?.unlockPriceToman ?? 20000;
  const priceLabel =
    lang === 'en' ? `${price.toLocaleString()} Toman` : `${price.toLocaleString('fa-IR')} تومان`;

  if (status?.isUnlocked && hasAnyContact) {
    return (
      <div className="space-y-2">
        <ContactDetailsList contact={contact} dict={dict} />
        {status.expiresAtUtc ? (
          <p className="text-xs text-muted-foreground">
            {dict.unlockExpires ?? 'Access expires'}: {formatCountdown(status.expiresAtUtc, lang)}
          </p>
        ) : null}
      </div>
    );
  }

  if (!hasAnyContact) {
    return <p className="text-sm text-muted-foreground">{dict.noContact ?? 'No contact details provided.'}</p>;
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed p-4">
      <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" />
        {dict.contactHidden ??
          'Contact details are hidden on the free plan. Upgrade or unlock to view phone, website, and social links.'}
      </p>
      {user ? (
        <Button onClick={() => void handleUnlock()} disabled={paying}>
          {paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {(dict.unlockButton ?? 'Unlock contact details — {price}').replace('{price}', priceLabel)}
        </Button>
      ) : (
        <Button asChild variant="outline">
          <Link href="/login">{dict.loginToUnlock ?? 'Sign in to unlock contact'}</Link>
        </Button>
      )}
    </div>
  );
}
