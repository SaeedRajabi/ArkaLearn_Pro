'use client';

import { Download, ExternalLink, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getResumeFileUrl } from '@/lib/utils/image-url';
import type { TeacherResume } from '@/types';

type Props = {
  resume: TeacherResume;
  lang: 'en' | 'fa';
  dict: {
    title?: string;
    viewPdf?: string;
    download?: string;
  };
};

export function TeacherResumeSection({ resume, lang, dict }: Props) {
  const pdfUrl = getResumeFileUrl(resume.pdfFileUrl);
  if (!pdfUrl) return null;

  const sectionTitle = dict.title ?? (lang === 'fa' ? 'رزومه' : 'Resume');
  const viewLabel = dict.viewPdf ?? (lang === 'fa' ? 'مشاهده PDF' : 'View PDF');
  const downloadLabel = dict.download ?? (lang === 'fa' ? 'دانلود رزومه' : 'Download resume');
  const downloadName = resume.pdfFileName?.trim() || `${resume.title || 'resume'}.pdf`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <CardTitle>{sectionTitle}</CardTitle>
          {resume.title ? <p className="mt-1 text-sm font-medium text-foreground">{resume.title}</p> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {resume.description?.trim() ? (
          <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{resume.description}</p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="default">
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              {viewLabel}
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={pdfUrl} download={downloadName}>
              <Download className="h-4 w-4" />
              {downloadLabel}
            </a>
          </Button>
        </div>
        <div className="overflow-hidden rounded-lg border bg-muted/30">
          <iframe
            src={pdfUrl}
            title={resume.title || sectionTitle}
            className="h-[min(70vh,640px)] w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}
