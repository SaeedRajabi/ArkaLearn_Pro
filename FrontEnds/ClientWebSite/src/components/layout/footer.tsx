'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/shared/logo';
import type { Dictionary } from '@/types';
import type { ContactUsQri } from '@/lib/api/types';
import { resolveContactDisplay } from '@/lib/api/contact';
import { isAuthPath } from '@/lib/auth/auth-paths';
import { FacebookIcon } from '@/components/icons/facebook-icon';
import { InstagramIcon } from '@/components/icons/instagram-icon';
import { TwitterIcon } from '@/components/icons/twitter-icon';
import { LinkedInIcon } from '@/components/icons/linkedin-icon';

const SOCIAL_ICONS = {
  LinkedIn: LinkedInIcon,
  Twitter: TwitterIcon,
  Instagram: InstagramIcon,
  Facebook: FacebookIcon,
} as const;

export default function Footer({
  dict,
  contactContent,
  isAuthPage: isAuthPageProp,
}: {
  dict: Dictionary;
  contactContent?: ContactUsQri | null;
  isAuthPage?: boolean;
}) {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();
  const footerDict:any = dict.footer;
  const headerDict:any = dict.header;
  const isAuthPage = isAuthPageProp ?? isAuthPath(pathname);
  if (isAuthPage) {
    return (
      <footer className="border-t bg-card text-card-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; {currentYear} ArkaSoftware - آرکا نرم افزار. {footerDict.rights}</p>
          </div>
        </div>
      </footer>
    );
  }


  const lang:"en"|"fa" = headerDict.courses === 'Courses' ? 'en' : 'fa';
  const dir:'rtl'|'ltr' = lang === 'fa' ? 'rtl' : 'ltr';
  const { phone, phoneTel, email, socialLinks } = resolveContactDisplay(contactContent, lang);

  return (
    <footer dir={dir} className={lang === 'fa' ?"border-t border-slate-700 bg-[#242a2f] text-slate-100 font-body" : "border-t border-slate-700 bg-[#242a2f] text-slate-100"}>
      <div className="container mx-auto px-4 py-6 md:py-5">
        <div className="space-y-5 md:hidden">
          <div className="flex flex-col items-center text-center">
            <Logo />
            <p className="mt-3 line-clamp-2 max-w-sm text-sm leading-6 text-slate-300 hover:text-primary">
              {footerDict.about}
            </p>
          </div>

          <nav aria-label="Mobile footer links" className="grid grid-cols-2 gap-2 text-sm">
            <Link href="/courses" className="rounded-xl border border-slate-600 bg-white/5 px-3 py-2 text-center font-medium text-slate-200 transition-colors hover:border-primary hover:text-primary">
              {headerDict.courses}
            </Link>
            <Link href="/seminars" className="rounded-xl border border-slate-600 bg-white/5 px-3 py-2 text-center font-medium text-slate-200 transition-colors hover:border-primary hover:text-primary">
              {headerDict.seminars}
            </Link>
            <Link href="/articles" className="rounded-xl border border-slate-600 bg-white/5 px-3 py-2 text-center font-medium text-slate-200 transition-colors hover:border-primary hover:text-primary">
              {footerDict.blog}
            </Link>
            <Link href="/books" className="rounded-xl border border-slate-600 bg-white/5 px-3 py-2 text-center font-medium text-slate-200 transition-colors hover:border-primary hover:text-primary">
              {headerDict.books ?? (lang === 'fa' ? 'کتاب‌ها' : 'Books')}
            </Link>
            <Link href="/projects" className="rounded-xl border border-slate-600 bg-white/5 px-3 py-2 text-center font-medium text-slate-200 transition-colors hover:border-primary hover:text-primary">
              {headerDict.projects ?? footerDict.projects}
            </Link>
            <Link href="/teachers" className="rounded-xl border border-slate-600 bg-white/5 px-3 py-2 text-center font-medium text-slate-200 transition-colors hover:border-primary hover:text-primary">
              {headerDict.teachers ?? (lang === 'fa' ? 'اساتید' : 'Teachers')}
            </Link>
            <Link href="/about" className="rounded-xl border border-slate-600 bg-white/5 px-3 py-2 text-center font-medium text-slate-200 transition-colors hover:border-primary hover:text-primary">
              {footerDict.aboutUs}
            </Link>
            <Link href="/contact" className="rounded-xl border border-slate-600 bg-white/5 px-3 py-2 text-center font-medium text-slate-200 transition-colors hover:border-primary hover:text-primary">
              {footerDict.contactUs}
            </Link>
          </nav>

          <div className="rounded-2xl bg-white/5 p-4 text-center text-sm text-slate-300">
            <p className="font-medium text-white">{footerDict.contact}</p>
            <div className="mt-2 flex flex-col gap-1">
              {phoneTel ? (
                <a href={phoneTel} className="hover:text-primary">
                  {footerDict.phone}: {phone}
                </a>
              ) : (
                <span>
                  {footerDict.phone}: {phone}
                </span>
              )}
              <a href={`mailto:${email}`} className="break-all hover:text-primary">
                {footerDict.email}: {email}
              </a>
            </div>
          </div>

          {socialLinks.length > 0 ? (
            <div className="flex items-center justify-center gap-4">
              {socialLinks.map(({ label, url }) => {
                const Icon = SOCIAL_ICONS[label as keyof typeof SOCIAL_ICONS];
                if (!Icon) return null;
                return (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="text-slate-300 hover:text-primary"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="hidden grid-cols-1 gap-8 sm:grid-cols-2 md:grid md:grid-cols-6 lg:grid-cols-12">
          {/* Logo and Social */}
          <div className="md:col-span-6 lg:col-span-3">
            <div className="flex flex-col items-start gap-4">
              <Logo  className='text-white hover:text-primary'/>
              <p className="max-w-xs text-sm text-slate-300">{footerDict.about}</p>
              {socialLinks.length > 0 ? (
                <div className="mt-2 flex gap-3">
                  {socialLinks.map(({ label, url }) => {
                    const Icon = SOCIAL_ICONS[label as keyof typeof SOCIAL_ICONS];
                    if (!Icon) return null;
                    return (
                      <a
                        key={label}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="text-slate-300 hover:text-primary"
                      >
                        <Icon className="h-5 w-5" />
                      </a>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          {/* Useful Links */}
          <div className="md:col-span-2 lg:col-span-2">
            <h3 className="font-semibold">{footerDict.usefulLinks}</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-slate-300 hover:text-primary">
                  {footerDict.aboutUs}
                </Link>
              </li>
              <li>
                <Link href="/teachers" className="text-slate-300 hover:text-primary">
                  {headerDict.teachers ?? (lang === 'fa' ? 'اساتید' : 'Teachers')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-300 hover:text-primary">
                  {footerDict.contactUs}
                </Link>
              </li>
              <li>
                <Link href="/advertisements" className="text-slate-300 hover:text-primary">
                  {headerDict.advertisements ?? (lang === 'fa' ? 'آگهی‌ها' : 'Advertisements')}
                </Link>
              </li>
              <li>
                <Link href="/articles" className="text-slate-300 hover:text-primary">
                  {footerDict.blog}
                </Link>
              </li>
              <li>
                <Link href="/books" className="text-slate-300 hover:text-primary">
                  {headerDict.books ?? (lang === 'fa' ? 'کتاب‌ها' : 'Books')}
                </Link>
              </li>
              <li>
                <Link href="/projects" className="text-slate-300 hover:text-primary">
                  {headerDict.projects ?? footerDict.projects}
                </Link>
              </li>
              <li>
                <Link href="/order-project" className="text-slate-300 hover:text-primary">
                  {footerDict.freeConsultation}
                </Link>
              </li>
              <li>
                <Link href="/tags" className="text-slate-300 hover:text-primary">
                  {lang === 'fa' ? 'برچسب‌ها' : 'Tags'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Help and Support */}
          <div className="md:col-span-2 lg:col-span-2">
            <h3 className="font-semibold">{footerDict.helpAndSupport}</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/articles" className="text-slate-300 hover:text-primary">
                  {footerDict.documentation}
                </Link>
              </li>
              <li>
                <Link href="/qa" className="text-slate-300 hover:text-primary">
                  {footerDict.submitTicket}
                </Link>
              </li>
              <li>
                <Link href="/courses" className="text-slate-300 hover:text-primary">
                  {footerDict.purchaseCourse}
                </Link>
              </li>
              <li>
                <Link href="/site-map" className="text-slate-300 hover:text-primary">
                  {footerDict.sitemap}
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 lg:col-span-2">
            <h3 className="font-semibold">{footerDict.quickLinks}</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-slate-300 hover:text-primary">
                  {footerDict.hireTeacher}
                </Link>
              </li>
              <li>
                <Link href="/order-project" className="text-slate-300 hover:text-primary">
                  {footerDict.freeConsultation}
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-slate-300 hover:text-primary">
                  {footerDict.terms}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Us & App Badges */}
          <div className="md:col-span-6 lg:col-span-3">
            <h3 className="font-semibold">{footerDict.contact}</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>
                {phoneTel ? (
                  <a href={phoneTel} className="hover:text-primary">
                    {footerDict.phone}: {phone}
                  </a>
                ) : (
                  <span>
                    {footerDict.phone}: {phone}
                  </span>
                )}
              </li>
              <li className="text-xs">{footerDict.workingHours}</li>
              <li>
                <a href={`mailto:${email}`} className="hover:text-primary">
                  {footerDict.email}: {email}
                </a>
              </li>
            </ul>
            <div className="mt-4 flex flex-col items-start gap-2">
              <a referrerPolicy='origin' target='_blank'
                 href='https://trustseal.enamad.ir/?id=630876&Code=blItWvMRwu9dgRZlQUptk32Mp4sSh4ao'><img
                  referrerPolicy='origin'
                  src='https://trustseal.enamad.ir/logo.aspx?id=630876&Code=blItWvMRwu9dgRZlQUptk32Mp4sSh4ao' alt='نماد اعتماد الکترونیکی enamad'
                  style={{cursor:'pointer'}}/>
              </a>
            </div>
          </div>
        </div>
        <div className="mt-5 border-t border-slate-700 pt-4 text-center text-xs text-slate-400 md:mt-6 md:pt-3 md:text-sm">
          <p>&copy; {currentYear} ArkaSoftware-آرکا نرم افزار. {footerDict.rights}</p>
        </div>
      </div>
    </footer>
  );
}
