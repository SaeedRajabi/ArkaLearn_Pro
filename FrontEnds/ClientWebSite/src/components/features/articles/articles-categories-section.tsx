'use client';

import { categoryToneClass } from './articles-blog-utils';

type CategoryItem = {
  id: number | string;
  name: string;
  count: number;
  description?: string;
};

type Dict = Record<string, string>;

interface ArticlesCategoriesSectionProps {
  categories: CategoryItem[];
  selectedName: string;
  dict: Dict;
  lang: 'en' | 'fa';
  onSelect: (name: string) => void;
}

export function ArticlesCategoriesSection({
  categories,
  selectedName,
  dict,
  lang,
  onSelect,
}: ArticlesCategoriesSectionProps) {
  if (categories.length === 0) return null;

  return (
    <section id="articles-categories" className="scroll-mt-28 space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">
          {dict.categoriesTitle ?? (lang === 'fa' ? 'دسته‌بندی‌ها' : 'Categories')}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {dict.categoriesSubtitle ??
            (lang === 'fa' ? 'موضوع مورد علاقه‌ات را انتخاب کن' : 'Pick a topic you care about')}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat, index) => {
          const active = selectedName === cat.name;
          return (
            <button
              key={String(cat.id)}
              type="button"
              onClick={() => onSelect(active ? '' : cat.name)}
              className={`rounded-2xl border p-4 text-start transition ${
                active
                  ? 'border-primary bg-primary text-primary-foreground shadow-md'
                  : 'border-border bg-card hover:border-primary/40 hover:shadow-sm'
              }`}
            >
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                  active ? 'bg-primary-foreground/15 text-primary-foreground' : categoryToneClass(index)
                }`}
              >
                {cat.name}
              </span>
              <p className={`mt-3 text-sm font-bold ${active ? 'text-primary-foreground' : 'text-foreground'}`}>
                {cat.name}
              </p>
              <p className={`mt-1 text-xs leading-5 ${active ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                {(
                  dict.categoryArticlesCount ??
                  (lang === 'fa' ? '{count} مقاله در این موضوع' : '{count} articles in this topic')
                ).replace('{count}', String(cat.count))}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
