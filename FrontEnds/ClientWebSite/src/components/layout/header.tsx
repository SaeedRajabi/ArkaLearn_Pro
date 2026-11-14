import { Logo } from '@/components/shared/logo';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import type { Dictionary } from '@/types';
import { AuthHeaderActions } from './auth-header-actions';
import { BasketHeaderItem } from './basket-header-item';
import { HeaderNav } from './header-nav';
import { MobileNavSheet } from './mobile-nav-sheet';
import { TabletNavDropdown } from './tablet-nav-dropdown';
import { getPublicCategoryTree } from '@/lib/data-server';
import { getMegaMenuFeaturedMap } from '@/lib/header-mega-data';

interface HeaderProps {
  lang: 'en' | 'fa';
  dict: Dictionary;
}

export default async function Header({ lang, dict }: HeaderProps) {
  const headerDic = dict.header as Record<string, string | undefined>;
  const [categoryTree, featuredByCategoryId] = await Promise.all([
    getPublicCategoryTree(),
    getMegaMenuFeaturedMap(),
  ]);

  const dir = lang === 'fa' ? 'rtl' : 'ltr';

  return (
    <header
      className="site-header sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 font-headline backdrop-blur supports-[backdrop-filter]:bg-background/60"
      dir={dir}
    >
      <div className="container flex h-20 items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Logo />
          <HeaderNav
            lang={lang}
            headerDic={headerDic}
            categoryTree={categoryTree}
            featuredByCategoryId={featuredByCategoryId}
          />
          <TabletNavDropdown
            lang={lang}
            headerDic={headerDic}
            categoryTree={categoryTree}
          />
        </div>

        {/* fa: چپ — آیکون منو، سبد، پروفایل | en: راست — برعکس */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <BasketHeaderItem lang={lang} />
            <LanguageSwitcher lang={lang} />
            <AuthHeaderActions
              loginLabel={headerDic.login}
              registerLabel={headerDic.register}
              accountLabel={headerDic.account ?? (lang === 'fa' ? 'حساب من' : 'My account')}
              dashboardLabel={headerDic.dashboard ?? (lang === 'fa' ? 'داشبورد' : 'Dashboard')}
              logoutLabel={headerDic.logout}
              lang={lang}
              dict={dict}
            />
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <BasketHeaderItem lang={lang} />
          </div>
          <MobileNavSheet lang={lang} dict={dict} headerDic={headerDic} />
        </div>
      </div>
    </header>
  );
}
