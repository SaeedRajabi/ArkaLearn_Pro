'use client';

import * as React from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { sendContactEmailOtp, submitContactRequest } from '@/lib/api/contact';
import type { ContactUsQri } from '@/lib/api/types';
import {
  CONTACT_ADDRESS_EN,
  CONTACT_ADDRESS_FA,
  CONTACT_EMAIL,
  CONTACT_MAP_EMBED_URL,
  CONTACT_PHONE,
  CONTACT_PHONE_DISPLAY_FA,
} from '@/lib/constants/contact';
import { FacebookIcon } from '@/components/icons/facebook-icon';
import { InstagramIcon } from '@/components/icons/instagram-icon';
import { TwitterIcon } from '@/components/icons/twitter-icon';
import { LinkedInIcon } from '@/components/icons/linkedin-icon';
import { getApiErrorMessage } from '@/lib/api/client';

type ContactDict = {
  title: string;
  subtitle: string;
  home: string;
  heroTitle: string;
  heroSubtitle: string;
  cardHeadquarters: string;
  cardContactInfo: string;
  cardSalesSupport: string;
  formTitle: string;
  formDescription: string;
  fullName: string;
  email: string;
  message: string;
  required: string;
  sendCode: string;
  resendCode: string;
  resendIn: string;
  otpLabel: string;
  otpHint: string;
  submit: string;
  followUs: string;
  successTitle: string;
  successDescription: string;
  errorGeneric: string;
  mapHint: string;
};

export function ContactPageClient({
  lang,
  dict,
  contactContent,
}: {
  lang: 'en' | 'fa';
  dict: ContactDict;
  contactContent?: ContactUsQri | null;
}) {
  const { toast } = useToast();
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [otpCode, setOtpCode] = React.useState('');
  const [otpSessionId, setOtpSessionId] = React.useState('');
  const [cooldown, setCooldown] = React.useState(0);
  const [sendingOtp, setSendingOtp] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const fallbackAddress = lang === 'fa' ? CONTACT_ADDRESS_FA : CONTACT_ADDRESS_EN;
  const fallbackPhone = lang === 'fa' ? CONTACT_PHONE_DISPLAY_FA : CONTACT_PHONE;

  const heroTitle = contactContent?.heroTitle?.trim() || dict.heroTitle;
  const heroSubtitle = contactContent?.heroSubtitle?.trim() || dict.heroSubtitle;
  const formTitle = contactContent?.formTitle?.trim() || dict.formTitle;
  const formDescription = contactContent?.formDescription?.trim() || dict.formDescription;
  const mapUrl = contactContent?.mapEmbedUrl?.trim() || CONTACT_MAP_EMBED_URL;

  const cards = [
    {
      title: contactContent?.headquartersTitle?.trim() || dict.cardHeadquarters,
      highlight: false,
      items: [
        { icon: MapPin, text: contactContent?.headquartersAddress?.trim() || fallbackAddress },
        { icon: Phone, text: contactContent?.headquartersPhone?.trim() || fallbackPhone },
        { icon: Mail, text: contactContent?.headquartersEmail?.trim() || CONTACT_EMAIL },
      ],
    },
    {
      title: contactContent?.contactInfoTitle?.trim() || dict.cardContactInfo,
      highlight: false,
      items: [
        { icon: Phone, text: contactContent?.contactInfoPhone?.trim() || fallbackPhone },
        { icon: Mail, text: contactContent?.contactInfoEmail?.trim() || CONTACT_EMAIL },
      ],
    },
    {
      title: contactContent?.salesSupportTitle?.trim() || dict.cardSalesSupport,
      highlight: true,
      items: [
        { icon: Phone, text: contactContent?.salesSupportPhone?.trim() || fallbackPhone },
        { icon: Mail, text: contactContent?.salesSupportEmail?.trim() || CONTACT_EMAIL },
      ],
    },
  ];

  const socialLinks = [
    { label: 'Facebook', url: contactContent?.facebookUrl?.trim(), Icon: FacebookIcon },
    { label: 'Twitter', url: contactContent?.twitterUrl?.trim(), Icon: TwitterIcon },
    { label: 'Instagram', url: contactContent?.instagramUrl?.trim(), Icon: InstagramIcon },
    { label: 'LinkedIn', url: contactContent?.linkedInUrl?.trim(), Icon: LinkedInIcon },
  ].filter((item) => item.url);

  async function handleSendOtp() {
    if (!fullName.trim() || !email.trim()) {
      toast({
        variant: 'destructive',
        title: dict.errorGeneric,
        description: `${dict.fullName} / ${dict.email}`,
      });
      return;
    }
    setSendingOtp(true);
    try {
      const session = await sendContactEmailOtp({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
      });
      setOtpSessionId(session.sessionId);
      setCooldown(session.resendCooldownSeconds);
      toast({ title: dict.otpHint });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: dict.errorGeneric,
        description: getApiErrorMessage(err, dict.errorGeneric),
      });
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!otpSessionId || !otpCode.trim()) {
      toast({
        variant: 'destructive',
        title: dict.errorGeneric,
        description: dict.otpLabel,
      });
      return;
    }
    setSubmitting(true);
    try {
      await submitContactRequest({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        message: message.trim(),
        emailOtpSessionId: otpSessionId,
        emailOtpCode: otpCode.trim(),
      });
      setSubmitted(true);
      toast({ title: dict.successTitle, description: dict.successDescription });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: dict.errorGeneric,
        description: getApiErrorMessage(err, dict.errorGeneric),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-16 pb-8">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-primary/5 to-background px-4 py-12 md:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.15) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold md:text-3xl">{heroTitle}</h2>
          <p className="mt-3 text-muted-foreground">{heroSubtitle}</p>
        </div>
        <div className="relative mx-auto mt-10 grid max-w-6xl gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.title}
              className={
                card.highlight
                  ? 'rounded-2xl bg-primary p-6 text-primary-foreground shadow-lg'
                  : 'rounded-2xl border bg-card p-6 shadow-sm'
              }
            >
              <h3 className="text-lg font-semibold">{card.title}</h3>
              <ul className="mt-4 space-y-3 text-sm">
                {card.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <item.icon className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />
                    <span className="break-all">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 className="text-2xl font-bold">{formTitle}</h2>
            <p className="mt-2 text-muted-foreground">{formDescription}</p>

            {submitted ? (
              <div className="mt-8 rounded-xl border border-primary/30 bg-primary/5 p-6">
                <p className="font-medium">{dict.successTitle}</p>
                <p className="mt-2 text-sm text-muted-foreground">{dict.successDescription}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {dict.fullName} <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    minLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {dict.email} <span className="text-destructive">*</span>
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      dir="ltr"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={sendingOtp || cooldown > 0}
                      onClick={() => void handleSendOtp()}
                    >
                      {cooldown > 0
                        ? dict.resendIn.replace('{seconds}', String(cooldown))
                        : otpSessionId
                          ? dict.resendCode
                          : dict.sendCode}
                    </Button>
                  </div>
                </div>
                {otpSessionId ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {dict.otpLabel} <span className="text-destructive">*</span>
                    </label>
                    <Input
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      dir="ltr"
                      className="max-w-xs text-center tracking-widest"
                    />
                    <p className="text-xs text-muted-foreground">{dict.otpHint}</p>
                  </div>
                ) : null}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {dict.message} <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    minLength={10}
                    rows={5}
                  />
                </div>
                <Button type="submit" className="w-full sm:w-auto" disabled={submitting || sendingOtp}>
                  <Send className="me-2 h-4 w-4" />
                  {dict.submit}
                </Button>
              </form>
            )}
          </div>

          <div className="flex flex-col items-center justify-center gap-8">
            <div
              aria-hidden
              className="relative flex h-64 w-full max-w-md items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 via-background to-primary/5"
            >
              <div className="absolute h-28 w-28 rounded-full bg-primary/15" />
              <Mail className="relative h-20 w-20 text-primary" />
            </div>
            <div className="flex w-full max-w-md items-center justify-between gap-4">
              <span className="text-sm font-medium text-muted-foreground">{dict.followUs}</span>
              <div className="flex gap-3">
                {socialLinks.length > 0
                  ? socialLinks.map(({ label, url, Icon }) => (
                      <a
                        key={label}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Icon className="h-5 w-5" />
                      </a>
                    ))
                  : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="overflow-hidden rounded-2xl border grayscale">
          <iframe
            title="map"
            src={mapUrl}
            className="h-[360px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">{dict.mapHint}</p>
      </section>
    </div>
  );
}
