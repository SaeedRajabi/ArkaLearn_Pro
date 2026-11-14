'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Dictionary } from '@/lib/definitions';
import { Lightbulb, Mail, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AngularLogo } from './icons/angular-logo';
import { ReactLogo } from './icons/react-logo';
import { FigmaLogo } from './icons/figma-logo';
import { PythonLogo } from './icons/python-logo';
import { UnderlineScribble } from './icons/underline-scribble';
import { motion } from 'motion/react';
import { pageLayout } from '@/lib/utils/page-layout';

const FloatingCard = ({ className, children, delay = 0, duration = 3 }: { className?: string, children: React.ReactNode, delay?: number, duration?: number }) => (
    <motion.div
        className={cn(
            'absolute rounded-2xl bg-card/80 p-4 shadow-xl backdrop-blur-md',
            className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: [0, -10, 0] }}
        transition={{ 
            opacity: { delay: delay + 0.5, duration: 0.5 },
            y: {
                delay: delay + 1,
                duration: duration,
                repeat: Infinity,
                ease: 'easeInOut'
            }
        }}
    >
        {children}
    </motion.div>
);

const backgroundImages = [
    '/images/elements/07.svg',
    '/images/elements/30.svg',
    '/images/elements/16.svg',
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
        },
    },
};

const itemVariants:any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
};

const underlineVariants = {
    hidden: { pathLength: 0 },
    visible: { pathLength: 1, transition: { duration: 0.8, ease: 'easeInOut', delay: 0.8 } },
};

export function Hero({ dict }: { dict: Dictionary }) {
    const [currentBgIndex, setCurrentBgIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentBgIndex(prevIndex => (prevIndex + 1) % backgroundImages.length);
        }, 2000);

        return () => clearInterval(intervalId);
    }, []);
    
    const lang = dict.hero.headline1.includes('Future') ? 'en' : 'fa';
    const dir = lang === 'fa' ? 'rtl' : 'ltr';
    
    const content = (
        <motion.div 
            className="flex flex-col items-center text-center md:items-start md:text-start"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="relative">
                <motion.h1 variants={itemVariants} className="text-4xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl font-headline max-[643px]:text-3xl">
                   {dict.hero.headline1}
                   <br />
                   <span className="relative inline-block">
                        <motion.div 
                            initial={{ scaleX: 0, originX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.8, delay: 1, ease: "easeInOut" }}
                        >
                            <UnderlineScribble className="absolute z-0 bottom-[05px] left-0 w-full h-auto text-accent" />
                        </motion.div>
                        <span className="z-10 relative">{dict.hero.highlight}</span>
                   </span>
                   {dict.hero.headline2 && ` ${dict.hero.headline2}`}
                </motion.h1>
            </div>
            <motion.p variants={itemVariants} className={cn("mt-6 max-w-xl text-lg text-muted-foreground", lang === 'fa' && 'font-subtitle')}>
                {dict.hero.subheadline}
            </motion.p>

            <motion.div variants={itemVariants} className="mt-10 flex flex-wrap items-center justify-center md:justify-start gap-4">
                <Button size="lg" asChild className="shadow-lg shadow-primary/30 transition-transform hover:scale-105">
                    <Link href="/courses">{dict.hero.ctaPrimary}</Link>
                </Button>
                <Button size="lg" variant="ghost" asChild className="group">
                    <Link href="/seminars">
                        <PlayCircle className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
                        <span className="ml-2 rtl:mr-2">{lang === 'en' ? 'Watch Video' : 'مشاهده ویدیو'}</span>
                    </Link>
                </Button>
            </motion.div>
        </motion.div>
    );

    const image = (
        <motion.div 
            className="relative mx-auto flex w-full items-center justify-center aspect-square"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeInOut" }}
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -end-6 -top-8 hidden h-24 w-24 rounded-full bg-primary/20 lg:block"
            />
             <svg
                viewBox="0 0 1000 1000"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0 z-0 h-full w-full text-primary/80 drop-shadow-2xl"
            >
                <path
                    d="M848.5,663Q733,826,539.5,850.5Q346,875,223.5,702Q101,529,183.5,357.5Q266,186,432.5,200.5Q599,215,752.5,299Q906,383,923,521.5Q940,660,848.5,663Z"
                    fill="currentColor"
                />
            </svg>

             <div 
                className="absolute inset-2 z-10"
                style={{ clipPath: 'url(#blob-mask)' }}
            >
                {backgroundImages.map((bg, index) => (
                    <Image
                        key={bg}
                        src={bg}
                        alt={`Abstract background ${index + 1}`}
                        fill
                        className={cn(
                            "transition-opacity duration-1000 ease-in-out",
                            index === currentBgIndex ? "opacity-90" : "opacity-0"
                        )}
                        priority={index === 0}
                    />
                ))}
            </div>
            
            {/* Floating elements */}
            <FloatingCard className="top-[5%] left-[2%] z-20 !p-3 sm:top-[13%] sm:left-[15%] max-[393px]:left-[10%] max-[640px]:left-[10%] max-[640px]:top-[11%]" delay={0.5} duration={4}>
                 <ReactLogo className="h-10 w-10 transition-transform duration-300 hover:scale-110" />
            </FloatingCard>

            <FloatingCard className="top-0 right-[15%] z-20 !p-3 sm:top-[20%] sm:right-[15%] max-[513px]:top-[12%] max-[640px]:right-[10%] max-[640px]:top-[16%]" delay={0.2} duration={3.5}>
                <AngularLogo className="h-10 w-10 transition-transform duration-300 hover:scale-110" />
            </FloatingCard>

             <FloatingCard className="bottom-[15%] left-0 z-20 !p-3 sm:bottom-[20%] sm:left-[12%] max-[640px]:left-[10%] max-[640px]:bottom-[14%] max-[293px]:hidden" delay={0.8} duration={2.5}>
                <FigmaLogo className="h-10 w-10 transition-transform duration-300 hover:scale-110" />
            </FloatingCard>
            
            <FloatingCard className="top-[50%] -right-2 z-20 max-[272px]-top[60%]" delay={0.4} duration={3}>
                <div className="flex items-center gap-4">
                    <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                        <Lightbulb />
                    </div>
                    <div>
                        <p className="font-bold">{lang === 'en' ? 'New Ideas' : 'ایده‌های نو'}</p>
                        <p className="text-sm text-muted-foreground"> {lang === 'en' ? 'Weekly' : 'هفتگی'}</p>
                    </div>
                </div>
            </FloatingCard>

            <FloatingCard className="bottom-0 right-[5%] z-20 max-[339px]:hidden max-[374px]:-bottom-[5%] sm:bottom-[4%] sm:right-[15%]" delay={1} duration={4.5}>
                <div className="flex items-center gap-3">
                    <div className="rounded-full bg-amber-400 p-3">
                        <Mail className="h-5 w-5 text-white" />
                    </div>
                     <div>
                        <p className="font-bold">{lang === 'en' ? 'Congrats!' : 'تبریک!'}</p>
                        <p className="text-sm text-muted-foreground">{lang === 'en' ? 'Admission complete' : 'پذیرش تکمیل شد'}</p>
                    </div>
                </div>
            </FloatingCard>

            <FloatingCard className="top-[35%] left-2 z-20 !p-3 max-[339px]:hidden" delay={0.6} duration={3.2}>
                <PythonLogo className="h-8 w-8 transition-transform duration-300 hover:scale-110" />
            </FloatingCard>
        </motion.div>
    );

    return (
        <section dir={dir} className={cn(pageLayout.shell, 'relative overflow-hidden bg-background')}>
            <svg
                aria-hidden="true"
                className="pointer-events-none absolute -start-24 -top-24 hidden h-72 w-[52rem] text-primary/20 dark:text-primary/10 lg:block"
                viewBox="0 0 822.2 301.9"
                fill="none"
            >
                <path
                    d="M752.5 51.9c-4.5 3.9-8.9 7.8-13.4 11.8-51.5 45.3-104.8 92.2-171.7 101.4-39.9 5.5-80.2-3.4-119.2-12.1-32.3-7.2-65.6-14.6-98.9-13.9-66.5 1.3-128.9 35.2-175.7 64.6-11.9 7.5-23.9 15.3-35.5 22.8-40.5 26.4-82.5 53.8-128.4 70.7-2.1.8-4.2 1.5-6.2 2.2L0 301.9"
                    stroke="currentColor"
                    strokeWidth="2"
                />
            </svg>
             <svg className="absolute h-0 w-0">
                <defs>
                    <clipPath id="blob-mask" clipPathUnits="objectBoundingBox">
                        <path d="M.848.663Q.733.826.54.851.346.875.224.702.101.529.184.358.266.186.433.201.599.215.753.299.906.383.923.522.94.66.848.663Z" />
                    </clipPath>
                </defs>
            </svg>
            <div className={cn(pageLayout.container, 'relative z-10 flex min-h-[calc(100vh-4rem)] flex-col items-center gap-1 py-0 md:flex-row lg:gap-20')}>
                <div className="w-full md:w-5/12">
                    {content}
                </div>
                <div className="w-full md:w-7/12">
                    {image}
                </div>
            </div>
        </section>
    );
}
