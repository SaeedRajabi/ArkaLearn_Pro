import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InstructorCard } from '@/components/shared/instructor-card';
import type { Seminar } from '@/types';
import { cn } from '@/lib/utils';
import { SeminarRecordingPlayer } from './seminar-recording-player';
import { RichHtmlContent } from '@/components/shared/rich-html-content';
import { SeoTagLink } from '@/components/shared/seo-tag-link';

type DictSlice = {
  seminarsPage: Record<string, string | undefined>;
};

interface SeminarDetailTabsProps {
  seminar: Seminar;
  dict: DictSlice;
  lang: 'en' | 'fa';
}

export function SeminarDetailTabs({ seminar, dict, lang }: SeminarDetailTabsProps) {
  const pageDict = dict.seminarsPage;

  return (
    <Tabs defaultValue="description" className="w-full" dir={lang==="fa" ? "rtl" : "ltr"}>
      <TabsList className="mb-8 grid w-full grid-cols-2 md:grid-cols-4">
        <TabsTrigger value="description">
          {pageDict.descriptionTab ?? (lang === 'fa' ? 'توضیحات' : 'Description')}
        </TabsTrigger>
        <TabsTrigger value="instructor">
          {pageDict.instructorTab ?? (lang === 'fa' ? 'مدرس' : 'Instructor')}
        </TabsTrigger>
        <TabsTrigger value="comments">{pageDict.commentsTab}</TabsTrigger>
        <TabsTrigger value="faq">
          {pageDict.faqTab ?? (lang === 'fa' ? 'سوالات متداول' : 'FAQ')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="description">
        <div className={cn('space-y-8', lang === 'fa' && 'text-right')}>
          {seminar.hasRecording && (
            <SeminarRecordingPlayer seminarId={seminar.id} title={seminar.title} lang={lang} />
          )}
          <div>
            <h2 className="font-headline mb-4 text-2xl font-bold">
              {pageDict.seminarDescription ?? (lang === 'fa' ? 'توضیحات سمینار' : 'Seminar description')}
            </h2>
            {seminar.description ? (
              <RichHtmlContent html={seminar.description} dir={lang === 'fa' ? 'rtl' : 'ltr'} />
            ) : (
              <p className={cn('leading-relaxed text-muted-foreground', lang === 'fa' && 'text-right')}>
                —
              </p>
            )}
          </div>
          {seminar.tags && seminar.tags.length > 0 && (
            <div>
              <h3 className="font-headline mb-2 text-lg font-semibold">
                {lang === 'fa' ? 'برچسب‌ها' : 'Tags'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {seminar.tags.map((tag) => (
                  <SeoTagLink key={tag} tag={tag} />
                ))}
              </div>
            </div>
          )}
          {seminar.prerequisites && (
            <div>
              <h3 className="font-headline mb-2 text-lg font-semibold">
                {lang === 'fa' ? 'پیش‌نیازها' : 'Prerequisites'}
              </h3>
              <p
                className={cn(
                  'leading-relaxed text-muted-foreground',
                  lang === 'fa' && 'text-right'
                )}
              >
                {seminar.prerequisites}
              </p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="instructor">
        <InstructorCard
          instructor={seminar.instructor}
          lang={lang}
          dict={{
            instructorCourses:
              pageDict.instructorSeminars ?? (lang === 'fa' ? 'سمینارها' : 'Seminars'),
            instructorArticles:
              pageDict.instructorArticles ?? (lang === 'fa' ? 'مقالات' : 'Articles'),
            instructorPoints:
              pageDict.instructorPoints ?? (lang === 'fa' ? 'امتیاز' : 'Points'),
            aboutInstructor:
              pageDict.aboutInstructor ?? (lang === 'fa' ? 'درباره مدرس' : 'About instructor'),
            viewProfile:
              pageDict.viewProfile ?? (lang === 'fa' ? 'مشاهده پروفایل' : 'View profile'),
          }}
        />
      </TabsContent>

      <TabsContent value="comments">
        <p className={cn('text-muted-foreground', lang === 'fa' && 'text-right')}>
          {pageDict.commentsComingSoon}
        </p>
      </TabsContent>

      <TabsContent value="faq">
        <div className={cn('space-y-4', lang === 'fa' && 'text-right')}>
          <h2 className="font-headline mb-6 text-2xl font-bold">
            {pageDict.faqTitle ?? (lang === 'fa' ? 'سوالات متداول' : 'Frequently asked questions')}
          </h2>
          {seminar.faq && seminar.faq.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {seminar.faq.map((faqItem, index) => (
                <AccordionItem key={faqItem.id} value={`item-${index}`} className="border-b">
                  <AccordionTrigger className="py-6 hover:no-underline">
                    <span
                      className={cn(
                        'flex-1 text-lg font-semibold',
                        lang === 'fa' ? 'text-right' : 'text-left'
                      )}
                    >
                      {lang === 'en' ? faqItem.question_en : faqItem.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p
                      className={cn(
                        'leading-relaxed text-muted-foreground pt-2 pb-4',
                        lang === 'fa' ? 'text-right' : 'text-left'
                      )}
                    >
                      {lang === 'en' ? faqItem.answer_en : faqItem.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className={cn('text-muted-foreground', lang === 'fa' && 'text-right')}>
              {pageDict.faqEmpty ??
                (lang === 'fa'
                  ? 'هنوز سوال متداولی برای این سمینار ثبت نشده است.'
                  : 'No frequently asked questions for this seminar yet.')}
            </p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
