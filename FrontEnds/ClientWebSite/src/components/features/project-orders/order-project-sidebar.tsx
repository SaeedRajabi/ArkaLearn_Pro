'use client';

import Link from 'next/link';
import { Headphones, ShieldCheck, Sparkles, Clock3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderProjectProgress } from './order-project-progress';
import type { OrderProjectFlowStep } from './project-order-types';

type Props = {
  flowStep: OrderProjectFlowStep;
  otpEnabled: boolean;
  t: (key: string, def: string) => string;
  isRtl?: boolean;
};

export function OrderProjectSidebar({ flowStep, otpEnabled, t, isRtl }: Props) {
  const highlights = [
    {
      icon: ShieldCheck,
      title: t('projectOrder.info.secureTitle', 'Secure & verified'),
      text: t('projectOrder.info.secureText', 'Your phone number is verified before we accept the request.'),
    },
    {
      icon: Clock3,
      title: t('projectOrder.info.reviewTitle', 'Fast review'),
      text: t('projectOrder.info.reviewText', 'Our team reviews requests and contacts you if more details are needed.'),
    },
    {
      icon: Headphones,
      title: t('projectOrder.info.supportTitle', 'Expert consultation'),
      text: t('projectOrder.info.supportText', 'We help you clarify scope, timeline, and the best technical approach.'),
    },
  ];

  return (
    <aside className="space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      <Card className="border-primary/15 bg-gradient-to-br from-primary/5 via-background to-background shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <CardTitle className="text-base">{t('projectOrder.info.companyTitle', 'About ArkaSoftware')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>{t('projectOrder.info.companyIntro', 'ArkaSoftware builds custom software for organizations, businesses, and academic teams.')}</p>
          <p>{t('projectOrder.info.companyScope', 'From web and mobile apps to internal systems — we focus on reliable delivery and clear communication.')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('projectOrder.trackingTitle', 'Request progress')}</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderProjectProgress current={flowStep} otpEnabled={otpEnabled} t={t} isRtl={isRtl} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('projectOrder.info.whyTitle', 'Why submit a request?')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        {t('projectOrder.info.needHelp', 'Need help?')}{' '}
        <Link href="/contact" className="font-medium text-primary hover:underline">
          {t('projectOrder.info.contactUs', 'Contact us')}
        </Link>
      </p>
    </aside>
  );
}
