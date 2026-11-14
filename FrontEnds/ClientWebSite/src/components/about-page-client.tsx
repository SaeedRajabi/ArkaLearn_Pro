
'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TwitterIcon } from '@/components/icons/twitter-icon';
import { InstagramIcon } from '@/components/icons/instagram-icon';
import { LinkedInIcon } from '@/components/icons/linkedin-icon';
import { Users, Video, Award, Github, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/lib/definitions';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import { motion } from 'motion/react';
import type { AboutUsQri } from '@/lib/api';
import { getAboutImageUrl } from '@/lib/utils/image-url';
import { pageLayout } from '@/lib/utils/page-layout';
import createDOMPurify from 'dompurify';
import { useEffect, useMemo, useState } from 'react';
import {Variants} from "motion-dom";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants:Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' } },
};


const TeamMemberCard = ({
    member,
    fallbackImage,
}: {
    member: NonNullable<AboutUsQri['teamMembers']>[number];
    fallbackImage: string;
}) => {
    const imageSource = getAboutImageUrl(member.imageUrl, fallbackImage);
    const socialLinks = [
        { key: 'github', url: member.githubUrl, icon: <Github className="h-5 w-5" /> },
        { key: 'linkedin', url: member.linkedinUrl, icon: <LinkedInIcon className="h-5 w-5" /> },
        { key: 'twitter', url: member.twitterUrl, icon: <TwitterIcon className="h-5 w-5" /> },
        { key: 'instagram', url: member.instagramUrl, icon: <InstagramIcon className="h-5 w-5" /> },
        { key: 'website', url: member.websiteUrl, icon: <Globe className="h-5 w-5" /> },
    ].filter((item) => Boolean(item.url));

    return (
        <motion.div variants={itemVariants}>
            <Card className="text-center overflow-hidden transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl h-full">
                <div className="relative h-64 w-full">
                    <Image
                        src={imageSource}
                        alt={member.fullName}
                        fill
                        className="object-cover object-top"
                        unoptimized
                    />
                </div>
                <CardContent className="p-6">
                    <h3 className="text-xl font-bold font-headline">{member.fullName}</h3>
                    <p className="text-sm text-primary">{member.skillTitle}</p>
                    <div className="flex justify-center gap-3 mt-4">
                        {socialLinks.map((link) => (
                            <Link key={link.key} href={link.url!} target="_blank" rel="noreferrer">
                                <Button variant="outline" size="icon">{link.icon}</Button>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

interface AboutPageClientProps {
    lang: 'en' | 'fa';
    dict: Dictionary;
    aboutContent?: AboutUsQri | null;
    aboutHeroImage?: ImagePlaceholder;
}

export function AboutPageClient({ lang, dict, aboutContent, aboutHeroImage }: AboutPageClientProps) {
    const [isMounted, setIsMounted] = useState(false);
    const pageDict:any = dict.aboutPage;
    const defaultHeroImage = aboutHeroImage?.imageUrl || '/placeholder-course.png';

    useEffect(() => {
      setIsMounted(true);
    }, []);

    const introTitle = aboutContent?.introTitle || pageDict.introTitle;
    const missionTitle = aboutContent?.missionTitle || pageDict.feature1Title;
    const visionTitle = aboutContent?.visionTitle || pageDict.feature2Title;
    const valuesTitle = aboutContent?.valuesTitle || pageDict.feature3Title;
    const teamTitle = aboutContent?.teamTitle || pageDict.teamTitle;
    const ctaTitle = aboutContent?.ctaTitle || pageDict.ctaTitle;
    const ctaSubtitle = aboutContent?.ctaSubtitle || pageDict.ctaSubtitle;
    const ctaButtonText = aboutContent?.ctaButtonText || (dict.hero as any).ctaPrimary;
    const ctaButtonUrl = aboutContent?.ctaButtonUrl || '/courses';

    const introHtmlSource =
      aboutContent?.introContentHtml ||
      `<p>${pageDict.introText1}</p><p>${pageDict.introText2}</p>`;
    const missionHtmlSource =
      aboutContent?.missionContentHtml ||
      `<p>${pageDict.feature1Text}</p>`;
    const visionHtmlSource =
      aboutContent?.visionContentHtml ||
      `<p>${pageDict.feature2Text}</p>`;
    const valuesHtmlSource =
      aboutContent?.valuesContentHtml ||
      `<p>${pageDict.feature3Text}</p><p>${pageDict.feature4Text}</p>`;
    const teamHtmlSource =
      aboutContent?.teamContentHtml ||
      `<p>${pageDict.teamSubtitle}</p>`;

    const sanitize = (html: string) => {
      if (!isMounted || typeof window === 'undefined') {
        return html;
      }

      const DOMPurify = createDOMPurify(window);
      return DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        ADD_ATTR: ['style', 'class', 'dir', 'data-lucide-icon'],
        ALLOW_DATA_ATTR: true,
      });
    };

    const introHtml = useMemo(() => sanitize(introHtmlSource), [introHtmlSource, isMounted]);
    const missionHtml = useMemo(() => sanitize(missionHtmlSource), [missionHtmlSource, isMounted]);
    const visionHtml = useMemo(() => sanitize(visionHtmlSource), [visionHtmlSource, isMounted]);
    const valuesHtml = useMemo(() => sanitize(valuesHtmlSource), [valuesHtmlSource, isMounted]);
    const teamHtml = useMemo(() => sanitize(teamHtmlSource), [teamHtmlSource, isMounted]);

    const heroImageSource = aboutContent?.heroImageUrl
      ? getAboutImageUrl(aboutContent.heroImageUrl, defaultHeroImage)
      : (aboutHeroImage?.imageUrl || defaultHeroImage);

    const teamImageSource = aboutContent?.teamImageUrl
      ? getAboutImageUrl(aboutContent.teamImageUrl, defaultHeroImage)
      : '';
    const dynamicTeamMembers = aboutContent?.teamMembers ?? [];
    const hasDynamicTeamMembers = dynamicTeamMembers.length > 0;

    return (
        <div className={pageLayout.sectionContainer}>
        {/* Intro Section */}
        <motion.section 
            className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
        >
            <motion.div className={cn(lang === 'fa' && 'md:order-2')} variants={itemVariants}>
                <h2 className="text-3xl font-bold font-headline mb-4">{introTitle}</h2>
                <div
                  dir={lang === 'fa' ? 'rtl' : 'ltr'}
                  className="prose prose-neutral dark:prose-invert max-w-none prose-p:text-muted-foreground prose-img:rounded-xl"
                  dangerouslySetInnerHTML={{ __html: introHtml }}
                />
            </motion.div>
            <motion.div className={cn("relative aspect-video rounded-lg overflow-hidden shadow-lg", lang === 'fa' && 'md:order-1')} variants={itemVariants}>
              <Image
                src={heroImageSource}
                alt={aboutHeroImage?.description || introTitle}
                fill
                className="object-cover"
                data-ai-hint={aboutHeroImage?.imageHint || 'team collaboration'}
                unoptimized
              />
            </motion.div>
        </motion.section>

        {/* Why Choose Us Section */}
        <motion.section 
            className="py-24"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
        >
            <motion.div className="text-center" variants={itemVariants}>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline">
                    {pageDict.whyChooseUsTitle}
                </h2>
                <p className={cn("mt-4 max-w-2xl mx-auto text-lg leading-8 text-muted-foreground", lang === 'fa' && 'font-subtitle')}>
                    {pageDict.whyChooseUsSubtitle}
                </p>
            </motion.div>
            <motion.div 
                className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
                variants={containerVariants}
            >
                <motion.div className="flex flex-col items-center" variants={itemVariants}>
                    <div className="bg-primary/10 text-primary rounded-full p-4 mb-4">
                        <Award className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold font-headline mb-2">{missionTitle}</h3>
                    <div
                      dir={lang === 'fa' ? 'rtl' : 'ltr'}
                      className="prose prose-sm dark:prose-invert max-w-none prose-p:text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: missionHtml }}
                    />
                </motion.div>
                <motion.div className="flex flex-col items-center" variants={itemVariants}>
                    <div className="bg-primary/10 text-primary rounded-full p-4 mb-4">
                        <Video className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold font-headline mb-2">{visionTitle}</h3>
                    <div
                      dir={lang === 'fa' ? 'rtl' : 'ltr'}
                      className="prose prose-sm dark:prose-invert max-w-none prose-p:text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: visionHtml }}
                    />
                </motion.div>
                <motion.div className="flex flex-col items-center" variants={itemVariants}>
                    <div className="bg-primary/10 text-primary rounded-full p-4 mb-4">
                        <Users className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold font-headline mb-2">{valuesTitle}</h3>
                    <div
                      dir={lang === 'fa' ? 'rtl' : 'ltr'}
                      className="prose prose-sm dark:prose-invert max-w-none prose-p:text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: valuesHtml }}
                    />
                </motion.div>
            </motion.div>
        </motion.section>

        {/* Meet the Team Section */}
        <motion.section 
            className="overflow-hidden rounded-lg bg-muted/30 py-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={containerVariants}
        >
            <div className="px-4 sm:px-8 md:px-12">
                <motion.div className="text-center" variants={itemVariants}>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline">
                        {teamTitle}
                    </h2>
                    <div
                      dir={lang === 'fa' ? 'rtl' : 'ltr'}
                      className={cn(
                        "prose dark:prose-invert max-w-2xl mx-auto text-muted-foreground mt-4",
                        lang === 'fa' && 'font-subtitle'
                      )}
                      dangerouslySetInnerHTML={{ __html: teamHtml }}
                    />
                </motion.div>
                {teamImageSource && (
                  <motion.div className="relative mt-10 mx-auto max-w-4xl aspect-video rounded-xl overflow-hidden" variants={itemVariants}>
                    <Image
                      src={teamImageSource}
                      alt={teamTitle}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </motion.div>
                )}
                <motion.div 
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12"
                    variants={containerVariants}
                >
                    {hasDynamicTeamMembers
                        ? dynamicTeamMembers.map((member) => (
                            <TeamMemberCard
                                key={`${member.id}-${member.displayOrder}-${member.fullName}`}
                                member={member}
                                fallbackImage={defaultHeroImage}
                            />
                        ))
                        : null}
                </motion.div>
            </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section 
            className="text-center py-24"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={containerVariants}
        >
             <motion.h2 variants={itemVariants} className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline">
                {ctaTitle}
            </motion.h2>
            <motion.p variants={itemVariants} className={cn("mt-4 max-w-2xl mx-auto text-lg leading-8 text-muted-foreground", lang === 'fa' && 'font-subtitle')}>
                {ctaSubtitle}
            </motion.p>
            <motion.div variants={itemVariants} className="mt-10">
                <Button size="lg" asChild className="shadow-lg shadow-primary/30 transition-transform hover:scale-105">
                    <Link href={ctaButtonUrl}>{ctaButtonText}</Link>
                </Button>
            </motion.div>
        </motion.section>
      </div>
    );
}
