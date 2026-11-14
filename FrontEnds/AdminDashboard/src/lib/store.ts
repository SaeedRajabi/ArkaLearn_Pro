'use client';

import React from 'react';
import { resolveStaticAssetUrl } from '@/lib/apiClient';
import {
    Course,
    Article,
    Seminar,
    User,
    Category,
    TrainingPlan,
    ArticleComment,
    CourseReview,
    Role,
} from '@/lib/types';
import {
    articles as initialArticles,
    seminars as initialSeminars,
    articleComments as initialArticleComments,
    courseReviews as initialCourseReviews,
} from '@/lib/placeholder-data';
import {addCourses, buildCourseFormData, getCourseById, getCourses} from '@/services/course-service';
import { getCategories } from '@/services/category-service';
import { getTrainingPlans } from '@/services/training-plan-service';
import { getUsers } from '@/services/user-service';
import {
    mapApiCourseDetailToCourse,
    normalizeCourseLanguageCode,
    normalizeCourseLevelCode,
    normalizeCourseLifecyclePhase,
    normalizeCoursePublishStatus,
    normalizeDeliveryMode,
    optionalApiDateString,
    unwrapCourseApiPayload,
} from '@/lib/course-form-mappers';
import { useAuth } from '@/components/auth-provider';
import { flattenCategories, mapRawCategory } from '@/lib/category-utils';

interface AppState {
    articles: Article[];
    seminars: Seminar[];
    users: User[];
    courses: Course[];
    categories: Category[];
    categoryTree: Category[];
    trainingPlans: TrainingPlan[];
    articleComments: ArticleComment[];
    courseReviews: CourseReview[];
}

export interface AppStore extends AppState {
    addArticle: (article: Omit<Article, 'id' | 'publishedAt' | 'views' | 'status'>) => void;
    updateArticle: (id: string, article: Partial<Article>) => void;
    deleteArticle: (id: string) => void;
    addSeminar: (seminar: Omit<Seminar, 'id' | 'attendees' | 'status'>) => void;
    updateSeminar: (id: string, seminar: Partial<Omit<Seminar, 'id' | 'attendees' | 'status'>>) => void;
    cancelSeminar: (id: string) => void;
    addUser: (user: Omit<User, 'id' | 'registrationDate' | 'lastLogin' | 'initials' | 'status' | 'avatarUrl'>) => void;
    toggleUserStatus: (id: string) => void;
    deleteUser: (id: string) => void;
    addCourse: (course: Omit<Course, 'id' | 'studentCount' | 'createdAt' | 'instructorId'>) => Promise<void>;
    updateCourse: (id: string, course: Partial<Course>) => void;
    deleteCourse: (id: string) => void;
    addCategory: (category: Omit<Category, 'categoryId' | 'courseCount' | 'createdAt'>) => void;
    updateCategory: (id: string, category: Partial<Omit<Category, 'categoryId' | 'courseCount' | 'createdAt'>>) => void;
    deleteCategory: (id: string) => void;
    getCourseDetails: (id: string) => Promise<Course | null>;
    /** بارگذاری مجدد دسته‌بندی‌ها از API (بعد از افزودن/ویرایش) */
    refreshCategories: () => Promise<void>;
    addPlan: (plan: Omit<TrainingPlan, 'id' | 'createdAt'>) => void;
    updatePlan: (id: string, plan: Partial<Omit<TrainingPlan, 'id' | 'createdAt'>>) => void;
    deletePlan: (id: string) => void;
    approveComment: (id: string) => void;
    rejectComment: (id: string) => void;
    deleteComment: (id: string) => void;
    likeComment: (id: string) => void;
    replyToComment: (id: string, reply: Omit<ArticleComment, 'id' | 'articleTitle' | 'status' | 'likes'>) => void;
    approveReview: (id: string) => void;
    rejectReview: (id: string) => void;
    deleteReview: (id: string) => void;
    likeReview: (id: string) => void;
    dislikeReview: (id: string) => void;
    replyToReview: (id: string, reply: Omit<CourseReview, 'id' | 'courseTitle' | 'status' | 'rating' | 'likes' | 'dislikes'>) => void;
}

export const StoreContext = React.createContext<AppStore | null>(null);

export const useCreateStore = (): AppStore => {
    const [articles, setArticles] = React.useState<Article[]>(initialArticles);
    const [seminars, setSeminars] = React.useState<Seminar[]>(initialSeminars);
    const [users, setUsers] = React.useState<User[]>([]);
    const [articleComments, setArticleComments] = React.useState<ArticleComment[]>(initialArticleComments);
    const [courseReviews, setCourseReviews] = React.useState<CourseReview[]>(initialCourseReviews);

    const [courses, setCourses] = React.useState<Course[]>([]);
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [categoryTree, setCategoryTree] = React.useState<Category[]>([]);
    const [trainingPlans, setTrainingPlans] = React.useState<TrainingPlan[]>([]);

    const { user } = useAuth();

    const toList = <T,>(x: { queryResult?: { $values?: T[] } | T[] } | null | undefined): T[] => {
        if (!x || typeof x !== 'object') return [];
        const q = (x as { queryResult?: { $values?: T[] } | T[] }).queryResult;
        if (Array.isArray(q)) return q;
        if (q && Array.isArray((q as { $values?: T[] }).$values)) return (q as { $values: T[] }).$values;
        return [];
    };

    const mapCategoryImages = (node: Category): Category => ({
        ...node,
        categoryImage: node.categoryImage ? resolveStaticAssetUrl(node.categoryImage) || undefined : undefined,
        children: node.children?.map(mapCategoryImages),
    });

    const applyCategoryResponse = (raw: unknown[]) => {
        const tree = raw.map((item) => mapRawCategory(item as Record<string, unknown>, 0, null)).map(mapCategoryImages);
        setCategoryTree(tree);
        setCategories(flattenCategories(tree).map(mapCategoryImages));
    };

    const mapApiCoursesToCourses = (raw: unknown[]): Course[] => {
        const out: Course[] = [];
        for (const c of raw as Record<string, unknown>[]) {
            const id = c?.id ?? c?.Id ?? c?.courseId ?? c?.CourseId;
            const title = String(c?.title ?? c?.Title ?? '');
            const price = Number(c?.price ?? c?.Price ?? 0);
            const level = normalizeCourseLevelCode(c as Record<string, unknown>);
            const shortDesc = String(c?.shortDescription ?? c?.ShortDescription ?? c?.description ?? c?.Description ?? '');
            const desc = String(c?.longDescription ?? c?.LongDescription ?? shortDesc); 
            
            let img = (c?.titleImage ?? c?.TitleImage ?? c?.thumbnailUrl ?? c?.ThumbnailUrl ?? c?.logoImage ?? c?.LogoImage) as string | undefined;
            img = img ? (resolveStaticAssetUrl(img) || undefined) : undefined;
            const category = String(c?.categoryName ?? c?.CategoryName ?? c?.category ?? c?.Category ?? '');
            const status = normalizeCoursePublishStatus(c as Record<string, unknown>);
            const studentCount = Number(c?.studentCount ?? c?.StudentCount ?? 0);
            const createdStr = (c?.createAt ?? c?.CreateAt ?? c?.createdAt ?? c?.CreatedAt) as string;
            
            let created = new Date();
            if (createdStr) {
                // Try to parse "HH:mm | yyyy/MM/dd" format from backend
                // e.g. "14:30 | 2025/02/11"
                if (createdStr.includes('|')) {
                    const parts = createdStr.split('|');
                    if (parts.length === 2) {
                        const timePart = parts[0].trim(); // "14:30"
                        const datePart = parts[1].trim(); // "2025/02/11"
                        
                        // Convert to ISO format: "2025-02-11T14:30:00"
                        const isoString = `${datePart.replace(/\//g, '-')}T${timePart}:00`;
                        const d = new Date(isoString);
                        if (!isNaN(d.getTime())) {
                            created = d;
                        } else {
                            // Fallback if parsing fails
                             const d2 = new Date(createdStr);
                             if (!isNaN(d2.getTime())) created = d2;
                        }
                    }
                } else {
                    const d = new Date(createdStr);
                    if (!isNaN(d.getTime())) {
                        created = d;
                    }
                }
            }
            
            let videoUrl = (c?.videoUrl ?? c?.VideoUrl) as string | undefined;
            videoUrl = videoUrl ? (resolveStaticAssetUrl(videoUrl) || undefined) : undefined;
            // Search returns Status: "Published"|"Draft" but often omits IsPublish —
            // prefer normalizeCoursePublishStatus so the list badge is correct before edit.
            const publishStatus = status;
            const isPublish = publishStatus === 'Published';

            out.push({
                id: String(id ?? ''),
                title,
                shortDescription: shortDesc,
                description: desc,
                price,
                level,
                thumbnailUrl: img,
                category,
                status: publishStatus,
                isPublish,
                studentCount,
                createdAt: created,
                videoUrl,
                instructorId: '0',
                language: normalizeCourseLanguageCode(c as Record<string, unknown>),
                degreeRequired: false,
                deliveryMode: normalizeDeliveryMode(c as Record<string, unknown>),
            });
        }
        return out;
    };

    React.useEffect(() => {
        getCourses()
            .then(x => setCourses(mapApiCoursesToCourses(toList(x) as unknown[])))
            .catch(() => setCourses([]));
        getCategories()
            .then(x => applyCategoryResponse(toList(x)))
            .catch(() => {
                setCategories([]);
                setCategoryTree([]);
            });
        getTrainingPlans()
            .then(x => {
                 const list = toList(x);
                 const mapped = list.map(item => ({...item, id: String(item.id)}));
                 setTrainingPlans(mapped);
            })
            .catch(() => setTrainingPlans([]));
        getUsers('search', '', 1, 10, 1, true, '', false)
            .then(x => {
                 const list = toList(x);
                 const mapped = list.map(item => ({...item, id: String(item.id)}));
                 setUsers(mapped);
            })
            .catch(() => setUsers([]));
    }, []);

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    const toArray = <T>(val: unknown): T[] => {
        if (Array.isArray(val)) return val as T[];
        if (val && typeof val === 'object' && '$values' in val && Array.isArray((val as { $values: unknown }).$values))
            return (val as { $values: T[] }).$values;
        return [];
    };

    const mapApiCourseToCourse = (c: any): Course => {
        const raw = (c && typeof c === 'object' ? c : {}) as Record<string, unknown>;
        const mapped = mapApiCourseDetailToCourse(raw);
        const id = mapped.id || String(raw.courseId ?? raw.CourseId ?? '');
        const title = mapped.title || String(raw.title ?? raw.Title ?? '');
        const price = mapped.price ?? Number(raw.price ?? raw.Price ?? 0);
        const level = mapped.level ?? normalizeCourseLevelCode(raw);
        const shortDesc = String(
            raw.shortDescription ??
                raw.ShortDescription ??
                raw.shortDesc ??
                ''
        );
        const desc = String(
            raw.longDescription ??
                raw.LongDescription ??
                raw.description ??
                raw.Description ??
                '',
        );
        
        let img = (raw.thumbnailUrl ?? raw.ThumbnailUrl) as string | undefined;
        img = img ? (resolveStaticAssetUrl(img) || undefined) : undefined;
        
        const categoryId = raw.categoryId ?? raw.CategoryId;
        const category =
            mapped.category ||
            (categoryId != null && categoryId !== 0
                ? String(categoryId)
                : String(raw.category ?? raw.Category ?? ''));
        const status = mapped.status ?? normalizeCoursePublishStatus(raw);
        const createdStr = (raw.createdAt ?? raw.CreatedAt) as string;
        
        let created = new Date();
        if (createdStr) {
            // Try parsing custom format "yyyy/MM/dd - HH:mm" or similar
             const d = new Date(createdStr);
             if (!isNaN(d.getTime())) created = d;
        }
        
        let videoUrl = (raw.videoUrl ?? raw.VideoUrl) as string | undefined;
        videoUrl = videoUrl ? (resolveStaticAssetUrl(videoUrl) || undefined) : undefined;

        const tags = toArray<string>(raw.tags ?? raw.Tags ?? raw.courseTags ?? raw.CourseTags);
        const dependencies = toArray<string>(raw.dependencies ?? raw.Dependencies);
        const prerequisites = dependencies.length > 0 ? dependencies.join('\n') : '';
        const comments = toArray<any>(raw.comments ?? raw.Comments).map((cm: any) => ({
            id: String(cm?.id ?? cm?.Id ?? ''),
            content: String(cm?.content ?? cm?.Content ?? ''),
            createAt: String(cm?.createAt ?? cm?.CreateAt ?? '')
        }));
        const faqs = toArray<any>(raw.faQs ?? raw.faqs ?? raw.FAQs ?? raw.courseFaqs ?? raw.CourseFaqs).map((f: any) => ({
            id: f.id ?? f.Id ?? `faq-${Math.random()}`,
            question: f.question ?? f.Question ?? '',
            answer: f.answer ?? f.Answer ?? ''
        }));
        
        const sections = toArray<any>(raw.sections ?? raw.Sections).map((s: any, secIdx: number) => {
            const lessons = toArray<any>(s?.courseLessons ?? s?.CourseLessons ?? s?.lessons ?? s?.Lessons);
            return {
                id: String(s.sessionId ?? s.SessionId ?? s?.id ?? s?.Id ?? `sec-${secIdx}`),
                title: s.sessionTitle ?? s.SessionTitle ?? s?.title ?? s?.Title ?? '',
                lessons: lessons.map((l: any, lesIdx: number) => ({
                    id: String(l.lessonId ?? l.LessonId ?? l?.id ?? l?.Id ?? `les-${secIdx}-${lesIdx}`),
                    title: l.lessonTitle ?? l.LessonTitle ?? l?.title ?? l?.Title ?? '',
                    videoTitle: l.videoTitle ?? l.VideoTitle ?? l.lessonTitle ?? l.LessonTitle ?? '',
                    videoUrl: l.videoUrl ?? l.VideoUrl ?? undefined,
                    durationSeconds: Number(l.durationSeconds ?? l.DurationSeconds ?? 0),
                    hasVideo: Boolean(l.hasVideo ?? l.HasVideo ?? l.mediaAssetId ?? l.MediaAssetId ?? l.videoUrl ?? l.VideoUrl),
                    hasEncryptedVideo: Boolean(l.hasEncryptedVideo ?? l.HasEncryptedVideo ?? l.mediaAssetId ?? l.MediaAssetId),
                    mediaAssetId: l.mediaAssetId ?? l.MediaAssetId ?? undefined,
                    isPublished: Boolean(l.isPublished ?? l.IsPublished ?? false),
                }))
            };
        });

        return {
            id: String(id ?? ''),
            title,
            shortDescription: shortDesc,
            description: desc,
            price,
            originalPrice: mapped.originalPrice,
            paymentType: mapped.paymentType ?? 'cash',
            installmentPlans: mapped.installmentPlans ?? [],
            level,
            thumbnailUrl: img,
            category,
            status,
            studentCount: 0, // Not in GetById response usually, might need separate call or keep from list
            createdAt: created,
            videoUrl,
            instructorId: '0', 
            language: mapped.language ?? normalizeCourseLanguageCode(raw),
            degreeRequired: Boolean(raw.isCertificate ?? raw.IsCertificate ?? false),
            deliveryMode: normalizeDeliveryMode(raw),
            lifecyclePhase: mapped.lifecyclePhase ?? normalizeCourseLifecyclePhase(raw),
            registrationClosed: mapped.registrationClosed ?? Boolean(
                raw.isRegistrationClosed ?? raw.IsRegistrationClosed ?? false,
            ),
            registrationDeadlineUtc: optionalApiDateString(raw.registrationDeadlineUtc ?? raw.RegistrationDeadlineUtc),
            courseStartUtc: optionalApiDateString(raw.courseStartUtc ?? raw.CourseStartUtc),
            courseEndUtc: optionalApiDateString(raw.courseEndUtc ?? raw.CourseEndUtc),
            seoTitle: (raw.seoTitle ?? raw.SeoTitle) as string | null | undefined,
            metaDescription: (raw.metaDescription ?? raw.MetaDescription) as string | null | undefined,
            ogImageUrl: (raw.ogImageUrl ?? raw.OgImageUrl) as string | null | undefined,
            tags,
            prerequisites,
            faqs,
            sections,
            comments,
            isPublish: status === 'Published' || Boolean(raw.isPublish ?? raw.IsPublish),
            isSpecial: false // Not mapped yet
        };
    };

    return {
        // ... existing methods ...
        // Add fetchFullCourseDetails to exposing methods if needed or just use fetching inside components
        // But since this is a store, we might want to update the course in the list with full details
        getCourseDetails: async (id: string) => {
             const rawResponse = await getCourseById(id);
             if (rawResponse) {
                 const data = unwrapCourseApiPayload(rawResponse);
                 const fullCourse = mapApiCourseToCourse(data);
                 setCourses(prev => {
                     const existing = prev.find(c => c.id === id);
                     if (existing) {
                         // Merge full details with existing (preserving studentCount if missing in detail)
                         return prev.map(c => c.id === id ? { ...existing, ...fullCourse, studentCount: existing.studentCount } : c);
                     }
                     return [...prev, fullCourse];
                 });
                 return fullCourse;
             }
             return null;
        },
        addArticle: (article) => {
            const newArticle: Article = {
                ...article,
                id: `ART-${Date.now()}`,
                status: 'Draft',
                views: 0,
                publishedAt: new Date(),
            };
            setArticles(prev => [newArticle, ...prev]);
        },
        addCategory: (category) => {
            const newCategory: Category = {
                ...category,
                categoryId: `CAT-${Date.now()}`,
                courseCount: 0,
                createdAt: new Date(),
            };
            setCategories(prev => [newCategory, ...prev]);
        },
        addCourse: async (course) => {

            // Object.entries(course).forEach(([key, value]) => {
            //     if (value instanceof File) {
            //         formData.append(key, value);
            //     } else if (Array.isArray(value)) {
            //         // For arrays like tags, faqs, sections
            //         value.forEach((item, index) => {
            //             if (typeof item === 'object' && item !== null) {
            //                 Object.entries(item).forEach(([itemKey, itemValue]) => {
            //                     formData.append(`${key}[${index}].${itemKey}`, JSON.stringify(itemValue));
            //                 });
            //             } else {
            //                 formData.append(`${key}[${index}]`, item);
            //             }
            //         });
            //     }
            //     else if (typeof value !== 'undefined' && value !== null) {
            //         formData.append(key, String(value));
            //     }
            // });


            const formData = buildCourseFormData(course as import('@/services/course-service').CourseFormPayload, {
                userId: user?.id ?? '',
                teacherId: user?.id ?? '',
            });

            const newCourse2  =  addCourses(formData).then(x => x);
            const newCourse: Course = {
                ...(course as any),
                id: `CRS-${Date.now()}`,
                studentCount: 0,
                createdAt: new Date(),
                instructorId: user?.id, // Mock instructor
            };
            setCourses(prev => [newCourse, ...prev]);
        },
        addPlan: (plan) => {
            const newPlan: TrainingPlan = {
                ...plan,
                id: `PLAN-${Date.now()}`,
                createdAt: new Date(),
            };
            setTrainingPlans(prev => [newPlan, ...prev]);
        },
        addSeminar: (seminar) => {
            const newSeminar: Seminar = {
                ...seminar,
                id: `SEM-${Date.now()}`,
                attendees: 0,
                status: 'Upcoming'
            };
            setSeminars(prev => [newSeminar, ...prev]);
        },
        addUser: (user) => {
            const newUser: User = {
                ...user,
                id: `USR-${Date.now()}`,
                initials: getInitials(user.name),
                status: 'Active',
                registrationDate: new Date(),
                lastLogin: new Date(),
                avatarUrl: `/placeholder-images/avatar-${Math.floor(Math.random() * 4) + 1}.jpeg`,
                role: user.role as Role
            };
            setUsers((prev: any | null) => [newUser, ...prev]);
        },
        approveComment: (id) => setArticleComments(prev => prev.map(c => c.id === id ? {...c, status: 'Approved'} : c)),
        approveReview: (id) => setCourseReviews(prev => prev.map(r => r.id === id ? {...r, status: 'Approved'} : r)),

        articleComments,
        articles,
        cancelSeminar: (id) => {
            setSeminars(prev => prev.map(s => s.id === id ? {...s, status: 'Cancelled'} : s))
        },

        categories,
        categoryTree,
        courseReviews,
        courses,

        deleteArticle: (id) => setArticles(prev => prev.filter(a => a.id !== id)),
        deleteCategory: (id) => setCategories(prev => prev.filter(c => c.categoryId !== id)),
        refreshCategories: () => getCategories('', 1, 500).then(x => applyCategoryResponse(toList(x))).catch(() => {}),
        deleteComment: (id) => setArticleComments(prev => prev.filter(c => c.id !== id)),

        deleteCourse: (id) => setCourses(prev => prev.filter(c => c.id !== id)),
        deletePlan: (id) => setTrainingPlans(prev => prev.filter(p => p.id !== id)),
        deleteReview: (id) => setCourseReviews(prev => prev.filter(r => r.id !== id)),

        deleteUser: (id) => setUsers((prev: any | null) => prev.filter((u: any) => u.id !== id)),
        dislikeReview: (id) => setCourseReviews(prev => prev.map(r => r.id === id ? {
            ...r,
            dislikes: (r.dislikes || 0) + 1
        } : r)),
        likeComment: (id) => setArticleComments(prev => prev.map(c => c.id === id ? {
            ...c,
            likes: (c.likes || 0) + 1
        } : c)),

        likeReview: (id) => setCourseReviews(prev => prev.map(r => r.id === id ? {
            ...r,
            likes: (r.likes || 0) + 1
        } : r)),
        rejectComment: (id) => setArticleComments(prev => prev.map(c => c.id === id ? {...c, status: 'Rejected'} : c)),
        rejectReview: (id) => setCourseReviews(prev => prev.map(r => r.id === id ? {...r, status: 'Rejected'} : r)),

        replyToComment: (id, reply) => {
            const parentComment = articleComments.find(c => c.id === id);
            if (!parentComment) return;

            const newReply: ArticleComment = {
                ...reply,
                id: `CMT-${Date.now()}`,
                articleTitle: parentComment.articleTitle,
                status: 'Approved',
                likes: 0,
            };

            const parentIndex = articleComments.findIndex(c => c.id === id);
            const newComments = [...articleComments];
            newComments.splice(parentIndex + 1, 0, newReply);
            setArticleComments(newComments);
        },
        replyToReview: (id, reply) => {
            const parentReview = courseReviews.find(c => c.id === id);
            if (!parentReview) return;

            const newReply: CourseReview = {
                ...reply,
                id: `REV-${Date.now()}`,
                courseTitle: parentReview.courseTitle,
                status: 'Approved',
                rating: 0, // Replies don't have ratings
                likes: 0,
                dislikes: 0,
            };

            const parentIndex = courseReviews.findIndex(c => c.id === id);
            const newReviews = [...courseReviews];
            newReviews.splice(parentIndex + 1, 0, newReply);
            setCourseReviews(newReviews);
        },
        seminars,
        toggleUserStatus: (id) => {
            setUsers((prev: any | null) => prev.map((u: any) => u.id === id ? {
                ...u,
                status: u.status === 'Active' ? 'Blocked' : 'Active'
            } : u));
        },
        trainingPlans,

        updateArticle: (id, articleUpdate) => {
            setArticles(prev => prev.map(a => a.id === id ? {...a, ...articleUpdate} : a));
        },
        updateCategory: (id, categoryUpdate) => {
            setCategories(prev => prev.map(c => c.categoryId === id ? {...c, ...categoryUpdate} : c));
        },
        updateCourse: (id, updatedData) => {
            setCourses(prev => prev.map(c => c.id === id ? {...c, ...updatedData} : c));
        },
        updatePlan: (id, planUpdate) => {
            setTrainingPlans(prev => prev.map(p => p.id === id ? {...p, ...planUpdate} : p));
        },
        updateSeminar: (id, seminarUpdate) => {
            setSeminars(prev => prev.map(s => s.id === id ? {...s, ...seminarUpdate} : s));
        },
        users,
    };
};

export const useStore = () => {
    const context = React.useContext(StoreContext);
    if (!context) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
};
