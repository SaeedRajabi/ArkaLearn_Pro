from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]

layout = root / 'src/app/dashboard/components/dashboard-client-layout.tsx'
text = layout.read_text(encoding='utf-8')
if 'LayoutGrid' not in text:
    text = text.replace('  LayoutDashboard, Loader2,', '  LayoutDashboard, Loader2,\n  LayoutGrid,')
old_nav = """const navItems: NavItemType[] = [
  { href: '/dashboard', icon: LayoutDashboard, labelKey: 'nav_dashboard' },
  {
    href: '#',
    icon: BookMarked,
    labelKey: 'nav_courses',
    subItems: [
      { href: '/dashboard/courses', labelKey: 'nav_courses_all' },
      { href: '/dashboard/courses/categories', labelKey: 'nav_courses_categories' },
      { href: '/dashboard/courses/reviews', labelKey: 'nav_courses_reviews', icon: Star },
    ],
  },"""
new_nav = """const navItems: NavItemType[] = [
  { href: '/dashboard', icon: LayoutDashboard, labelKey: 'nav_dashboard' },
  { href: '/dashboard/categories', icon: LayoutGrid, labelKey: 'nav_categories' },
  {
    href: '#',
    icon: BookMarked,
    labelKey: 'nav_courses',
    subItems: [
      { href: '/dashboard/courses', labelKey: 'nav_courses_all' },
      { href: '/dashboard/courses/reviews', labelKey: 'nav_courses_reviews', icon: Star },
    ],
  },"""
if old_nav not in text:
    raise SystemExit('nav block not found')
layout.write_text(text.replace(old_nav, new_nav, 1), encoding='utf-8')
print('layout updated')

for lang in ['fa', 'en']:
    path = root / f'public/locales/{lang}.json'
    data = json.loads(path.read_text(encoding='utf-8'))
    data['nav_categories'] = 'دسته\u200cبندی\u200cها' if lang == 'fa' else 'Categories'
    data['categories_page_title'] = 'مدیریت دسته\u200cبندی\u200cها' if lang == 'fa' else 'Category management'
    data['categories_page_description'] = (
        'دسته\u200cبندی\u200cها را به\u200cصورت مستقل مدیریت کنید و برای هرکدام زیردسته تعریف کنید.'
        if lang == 'fa'
        else 'Manage categories independently and define nested subcategories for each one.'
    )
    data['category_parent_label'] = 'دسته\u200cبندی والد' if lang == 'fa' else 'Parent category'
    data['category_parent_placeholder'] = 'انتخاب دسته\u200cبندی والد' if lang == 'fa' else 'Select parent category'
    data['category_parent_root'] = 'بدون والد (ریشه)' if lang == 'fa' else 'No parent (root)'
    data['category_children_label'] = 'زیردسته\u200cهای مستقیم' if lang == 'fa' else 'Direct subcategories'
    data['category_children_count'] = '{count} زیردسته' if lang == 'fa' else '{count} subcategories'
    data['category_add_child'] = 'افزودن زیردسته' if lang == 'fa' else 'Add subcategory'
    data['categoryTable_col_parent'] = 'والد' if lang == 'fa' else 'Parent'
    data['categoryTable_empty'] = 'دسته\u200cبندی\u200cای یافت نشد.' if lang == 'fa' else 'No categories found.'
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{lang} locale updated')
