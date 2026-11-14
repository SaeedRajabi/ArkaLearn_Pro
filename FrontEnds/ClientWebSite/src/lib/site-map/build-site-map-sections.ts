import { headerNavItems, resolveNavLabel } from '@/lib/nav-config';
import type { CategoryTreeItem } from '@/lib/api/categories';

export type SiteMapIconKey =
  | 'home'
  | 'sparkles'
  | 'folder-kanban'
  | 'megaphone'
  | 'graduation-cap'
  | 'messages-square'
  | 'info'
  | 'phone'
  | 'book-open'
  | 'presentation'
  | 'file-text'
  | 'book-marked'
  | 'download'
  | 'folder-open'
  | 'file-plus-2'
  | 'user-circle'
  | 'tags'
  | 'layers'
  | 'life-buoy'
  | 'log-in'
  | 'shopping-cart';

export type SiteMapNode = {
  label: string;
  href: string;
  description?: string;
  children?: SiteMapNode[];
};

export type SiteMapSection = {
  id: string;
  title: string;
  description: string;
  iconKey: SiteMapIconKey;
  accentClass: string;
  nodes: SiteMapNode[];
};

const NAV_ICON_KEYS: Record<string, SiteMapIconKey> = {
  arkaSoftware: 'sparkles',
  projectsMenu: 'folder-kanban',
  courses: 'book-open',
  seminars: 'presentation',
  articles: 'file-text',
  books: 'book-marked',
  software: 'download',
  projectsList: 'folder-open',
  projectRequests: 'file-plus-2',
  advertisements: 'megaphone',
  teachers: 'graduation-cap',
  qa: 'messages-square',
  about: 'info',
  contact: 'phone',
};

function categoryNodes(
  categories: CategoryTreeItem[],
  lang: 'en' | 'fa',
  maxDepth = 3,
  depth = 0
): SiteMapNode[] {
  return categories.map((category) => ({
    label: category.name,
    href: `/categories/${category.id}`,
    description:
      category.courseCount > 0
        ? lang === 'fa'
          ? `${category.courseCount} دوره`
          : `${category.courseCount} courses`
        : undefined,
    children:
      depth < maxDepth && category.children.length > 0
        ? categoryNodes(category.children, lang, maxDepth, depth + 1)
        : undefined,
  }));
}

export function countSiteMapNodes(nodes: SiteMapNode[]): number {
  return nodes.reduce((total, node) => {
    const childCount = node.children ? countSiteMapNodes(node.children) : 0;
    return total + 1 + childCount;
  }, 0);
}

export function countSiteMapLinks(sections: SiteMapSection[]): number {
  return sections.reduce((total, section) => total + countSiteMapNodes(section.nodes), 0);
}

export function buildSiteMapSections(params: {
  lang: 'en' | 'fa';
  headerDic?: Record<string, string | undefined> | null;
  pageDic?: Record<string, string> | null;
  footerDic?: Record<string, string | undefined> | null;
}): SiteMapSection[] {
  const lang = params.lang;
  const headerDic = params.headerDic ?? {};
  const pageDic = params.pageDic ?? {};
  const footerDic = params.footerDic ?? {};

  const label = (key: string) => resolveNavLabel(headerDic, key, lang);

  const sections: SiteMapSection[] = [
    {
      id: 'home',
      title: pageDic.sectionHome ?? (lang === 'fa' ? 'صفحه اصلی' : 'Home'),
      description: pageDic.sectionHomeDesc ?? '',
      iconKey: 'home',
      accentClass: 'from-sky-500/15 via-sky-500/5 to-transparent',
      nodes: [
        {
          label: pageDic.homeLink ?? (lang === 'fa' ? 'خانه' : 'Home'),
          href: '/',
          description: pageDic.homeLinkDesc ?? '',
        },
      ],
    },
  ];

  for (const item of headerNavItems) {
    if (item.type === 'group') {
      sections.push({
        id: item.labelKey,
        title: label(item.labelKey),
        description: pageDic[`section_${item.labelKey}`] ?? pageDic.sectionDefaultDesc ?? '',
        iconKey: NAV_ICON_KEYS[item.labelKey] ?? 'layers',
        accentClass:
          item.labelKey === 'arkaSoftware'
            ? 'from-violet-500/15 via-violet-500/5 to-transparent'
            : 'from-amber-500/15 via-amber-500/5 to-transparent',
        nodes: item.items.map((child) => ({
          label: label(child.labelKey),
          href: child.href,
          description: pageDic[`link_${child.labelKey}`] ?? '',
        })),
      });
      continue;
    }

    const node: SiteMapNode = {
      label: label(item.labelKey),
      href: item.href,
      description: pageDic[`link_${item.labelKey}`] ?? '',
    };

    const sectionId = item.labelKey === 'about' || item.labelKey === 'contact' ? 'company' : 'community';
    const existingSection = sections.find((section) => section.id === sectionId);

    if (existingSection) {
      existingSection.nodes.push(node);
      continue;
    }

    sections.push({
      id: sectionId,
      title:
        sectionId === 'company'
          ? pageDic.sectionCompany ?? (lang === 'fa' ? 'درباره آرکا' : 'About Arka')
          : pageDic.sectionCommunity ?? (lang === 'fa' ? 'جامعه و ارتباطات' : 'Community'),
      description:
        sectionId === 'company'
          ? pageDic.sectionCompanyDesc ?? ''
          : pageDic.sectionCommunityDesc ?? '',
      iconKey: sectionId === 'company' ? 'info' : 'messages-square',
      accentClass:
        sectionId === 'company'
          ? 'from-rose-500/15 via-rose-500/5 to-transparent'
          : 'from-emerald-500/15 via-emerald-500/5 to-transparent',
      nodes: [node],
    });
  }

  return sections.concat([
    {
      id: 'categories',
      title: pageDic.sectionCategories ?? (lang === 'fa' ? 'دسته‌بندی‌ها' : 'Categories'),
      description: pageDic.sectionCategoriesDesc ?? '',
      iconKey: 'layers',
      accentClass: 'from-cyan-500/15 via-cyan-500/5 to-transparent',
      nodes: [],
    },
    {
      id: 'account',
      title: pageDic.sectionAccount ?? (lang === 'fa' ? 'حساب کاربری' : 'Your account'),
      description: pageDic.sectionAccountDesc ?? '',
      iconKey: 'user-circle',
      accentClass: 'from-indigo-500/15 via-indigo-500/5 to-transparent',
      nodes: [
        {
          label: label('login'),
          href: '/login',
          description: pageDic.linkLogin ?? '',
        },
        {
          label: label('register'),
          href: '/register',
          description: pageDic.linkRegister ?? '',
        },
        {
          label: label('dashboard'),
          href: '/account',
          description: pageDic.linkAccount ?? '',
        },
        {
          label: pageDic.linkProfessor ?? (lang === 'fa' ? 'پنل استاد' : 'Professor panel'),
          href: '/professor',
          description: pageDic.linkProfessorDesc ?? '',
        },
      ],
    },
    {
      id: 'support',
      title: pageDic.sectionSupport ?? (footerDic.helpAndSupport ?? (lang === 'fa' ? 'راهنما' : 'Help')),
      description: pageDic.sectionSupportDesc ?? '',
      iconKey: 'life-buoy',
      accentClass: 'from-orange-500/15 via-orange-500/5 to-transparent',
      nodes: [
        {
          label: footerDic.documentation ?? (lang === 'fa' ? 'مقالات' : 'Articles'),
          href: '/articles',
        },
        {
          label: footerDic.submitTicket ?? (lang === 'fa' ? 'پرسش و پاسخ' : 'Q&A'),
          href: '/qa',
        },
        {
          label: pageDic.linkSupport ?? (lang === 'fa' ? 'پشتیبانی پلتفرم' : 'Platform support'),
          href: '/support',
        },
        {
          label: pageDic.linkTags ?? (lang === 'fa' ? 'برچسب‌ها' : 'Tags'),
          href: '/tags',
        },
        {
          label: footerDic.checkout ?? (lang === 'fa' ? 'تسویه حساب' : 'Checkout'),
          href: '/checkout',
        },
      ],
    },
  ]);
}

export function attachCategorySection(
  sections: SiteMapSection[],
  categories: CategoryTreeItem[],
  lang: 'en' | 'fa'
): SiteMapSection[] {
  const categorySection = sections.find((section) => section.id === 'categories');
  if (!categorySection) return sections;

  categorySection.nodes = categoryNodes(categories, lang);
  return sections;
}
