

import type { Course, Article, Seminar, Ticket, Instructor, Notification, TrafficSource, Sales, CourseReview, ArticleComment, User, Order, UserActivity } from '@/lib/types';
import { getUsers } from '@/services/user-service';

export const articles: Article[] = [
  {
    id: 'ART-001',
    title: '10 Tips for Better Code Reviews',
    shortDescription: 'Improve your team\'s code quality and collaboration with these actionable tips for code reviews.',
    longDescription: '<p>Code reviews are a crucial part of the software development lifecycle, but they can often be a source of friction. This article explores 10 practical tips to make your code reviews more effective, efficient, and constructive. From setting clear expectations to using the right tools, you\'ll learn how to foster a positive review culture that leads to better code and stronger teams.</p>',
    category: 'Productivity',
    status: 'Published',
    publishedAt: new Date('2023-06-01'),
    views: 15200,
    imageUrl: 'https://picsum.photos/seed/code-review/1280/720',
    tags: ['code quality', 'teamwork'],
  },
  {
    id: 'ART-002',
    title: 'The Rise of Server Components',
    shortDescription: 'Understand the what, why, and how of React Server Components and their impact on web architecture.',
    longDescription: '<p>React Server Components (RSCs) are changing the way we build web applications. This deep dive explains the core concepts behind RSCs, how they differ from traditional client-side components, and the benefits they bring, such as reduced bundle sizes and improved performance. We\'ll walk through examples and discuss the future of React architecture.</p>',
    category: 'Web Development',
    status: 'Published',
    publishedAt: new Date('2023-05-25'),
    views: 8900,
    imageUrl: 'https://picsum.photos/seed/server-components/1280/720',
    tags: ['react', 'nextjs', 'performance'],
  },
  {
    id: 'ART-003',
    title: 'Designing for Accessibility',
    shortDescription: 'Learn the fundamentals of accessible design to create inclusive digital products for everyone.',
    longDescription: '<p>Accessibility (a11y) is not just a feature; it\'s a fundamental aspect of good design. This article covers the essential principles of designing for accessibility, including WCAG guidelines, semantic HTML, ARIA roles, and keyboard navigation. Learn how to create experiences that are usable by people with a wide range of abilities.</p>',
    category: 'Design',
    status: 'Published',
    publishedAt: new Date('2023-05-18'),
    views: 12345,
    imageUrl: 'https://picsum.photos/seed/accessibility/1280/720',
    tags: ['a11y', 'ux', 'inclusive design'],
  },
  {
    id: 'ART-004',
    title: 'Getting Started with Docker',
    shortDescription: 'A beginner\'s guide to containerizing your applications with Docker for consistent development environments.',
    longDescription: '<p>New to Docker? This guide will take you from zero to hero. Learn what containers are, why they are useful, and how to create your first Dockerfile. We\'ll cover essential commands and best practices to get you up and running with containerized applications quickly.</p>',
    category: 'DevOps',
    status: 'Draft',
    publishedAt: new Date(),
    views: 0,
    imageUrl: 'https://picsum.photos/seed/docker-start/1280/720',
    tags: ['docker', 'containers', 'devops'],
  },
  {
    id: 'ART-005',
    title: 'State Management in Modern Apps',
    shortDescription: 'A comparative look at different state management libraries and patterns in the JavaScript ecosystem.',
    longDescription: '<p>From Redux and Zustand to Signals and Jotai, the state management landscape can be confusing. This article breaks down the pros and cons of various approaches, helping you choose the right solution for your next project. We compare boilerplate, performance, and developer experience across popular libraries.</p>',
    category: 'Web Development',
    status: 'Published',
    publishedAt: new Date('2023-04-30'),
    views: 7654,
    imageUrl: 'https://picsum.photos/seed/state-management/1280/720',
    tags: ['react', 'state', 'javascript'],
  },
];

const mockUsers: User[] = [
    { id: 'USR-001', name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'Active', avatarUrl: '/placeholder-images/avatar-1.jpeg', initials: 'AJ', registrationDate: new Date('2023-01-15'), lastLogin: new Date('2024-07-21') },
    { id: 'USR-002', name: 'Bob Smith', email: 'bob@example.com', role: 'Admin', status: 'Active', avatarUrl: '/placeholder-images/avatar-3.jpeg', initials: 'BS', registrationDate: new Date('2023-02-10'), lastLogin: new Date('2024-07-20') },
    { id: 'USR-003', name: 'Charlie Brown', email: 'charlie@example.com', role: 'Admin', status: 'Blocked', avatarUrl: '/placeholder-images/avatar-2.jpeg', initials: 'CB', registrationDate: new Date('2023-03-05'), lastLogin: new Date('2024-05-15') },
    { id: 'USR-004', name: 'Diana Prince', email: 'diana@example.com', role: 'Super Admin', status: 'Active', avatarUrl: '/placeholder-images/avatar-4.jpeg', initials: 'DP', registrationDate: new Date('2022-11-01'), lastLogin: new Date('2024-07-22') },
];

export const seminars: Seminar[] = [
  {
    id: 'SEM-001',
    title: 'The State of Frontend in 2024',
    date: new Date('2024-08-15T10:00:00'),
    location: 'Online',
    attendees: 2,
    status: 'Upcoming',
    category: 'Web Development',
    level: 'Intermediate',
    description: "<p>Join us for a comprehensive overview of the current frontend landscape. We'll cover the latest trends in frameworks, tooling, and best practices that are shaping the future of web development. This seminar is perfect for developers looking to stay ahead of the curve.</p><h2>Topics Covered:</h2><ul><li><p>React 19 and the impact of the new compiler</p></li><li><p>The rise of Svelte and SolidJS</p></li><li><p>Modern CSS techniques: Container Queries, :has(), and more</p></li><li><p>The state of build tools: Vite, Turbopack, and Rspack</p></li><li><p>WebAssembly's growing role in performance-critical applications</p></li></ul>",
    participants: [mockUsers[0], mockUsers[1]],
  },
  {
    id: 'SEM-002',
    title: 'AI in Education Summit',
    date: new Date('2024-09-05T09:00:00'),
    location: 'San Francisco, CA',
    attendees: 1,
    status: 'Upcoming',
    category: "Productivity",
    level: "Advanced",
    description: "<p>A full-day summit dedicated to exploring the intersection of Artificial Intelligence and education. Hear from leading experts, researchers, and practitioners on how AI is transforming learning, teaching, and administrative processes in educational institutions.</p><p>Keynote speakers include pioneers in AI-driven personalized learning platforms and ethical AI development.</p>",
    participants: [mockUsers[3]],
  },
  {
    id: 'SEM-003',
    title: 'Next.js 15 Deep Dive',
    date: new Date('2024-07-20T14:00:00'),
    location: 'Online',
    attendees: 3,
    status: 'Completed',
    category: "Web Development",
    level: "Advanced",
    description: "<p>This seminar provided a deep dive into the features of Next.js 15, focusing on performance optimizations and the latest developments in the App Router. Attendees learned how to leverage new capabilities to build faster, more scalable applications.</p>",
    participants: [mockUsers[0], mockUsers[2], mockUsers[3]],
  },
  {
    id: 'SEM-004',
    title: 'Cybersecurity Workshop',
    date: new Date('2024-06-10T11:00:00'),
    location: 'New York, NY',
    attendees: 0,
    status: 'Completed',
    category: "DevOps",
    level: "Beginner",
    description: "<p>A hands-on workshop covering the fundamentals of web application security. Participants engaged in practical exercises to identify and mitigate common vulnerabilities, such as XSS, CSRF, and SQL injection.</p>",
    participants: [],
  },
  {
    id: 'SEM-005',
    title: 'The Future of Remote Work',
    date: new Date('2024-08-01T13:00:00'),
    location: 'Online',
    attendees: 0,
    status: 'Cancelled',
    category: "Productivity",
    level: "Beginner",
    description: "<p>This seminar was planned to discuss the evolving landscape of remote work, focusing on tools, culture, and strategies for success in a distributed team environment. It was unfortunately cancelled due to unforeseen circumstances.</p>",
    participants: [],
  },
];

export const enrollmentData = [
  { month: 'Jan', enrollments: 1234 },
  { month: 'Feb', enrollments: 1456 },
  { month: 'Mar', enrollments: 1678 },
  { month: 'Apr', enrollments: 1890 },
  { month: 'May', enrollments: 2123 },
  { month: 'Jun', enrollments: 2345 },
];

export const tickets: Ticket[] = [
  {
    id: 'TKT-001',
    userName: 'Niloofar Jalili',
    userAvatarUrl: '/placeholder-images/avatar-1.jpeg',
    userInitials: 'NJ',
    ticketNumber: '759',
    timestamp: '8 hours ago',
  },
  {
    id: 'TKT-002',
    userName: 'Milad Ahmadi',
    userInitials: 'MA',
    ticketNumber: '629',
    timestamp: '8 hours ago',
  },
  {
    id: 'TKT-003',
    userName: 'Ali Moradi',
    userInitials: 'AM',
    ticketNumber: '820',
    timestamp: '5 hours ago',
  },
  {
    id: 'TKT-004',
    userName: 'Saeed Nouri',
    userAvatarUrl: '/placeholder-images/avatar-2.jpeg',
    userInitials: 'SN',
    ticketNumber: '234',
    timestamp: '9 hours ago',
  },
];

export const instructors: Instructor[] = [
  {
    id: 'INS-001',
    name: 'Niloofar Jalili',
    avatarUrl: '/placeholder-images/avatar-1.jpeg',
    courseCount: 25,
    rating: 4.5,
    initials: 'NJ',
  },
  {
    id: 'INS-002',
    name: 'John Doe',
    avatarUrl: '/placeholder-images/avatar-3.jpeg',
    courseCount: 18,
    rating: 4.8,
    initials: 'JD',
  },
  {
    id: 'INS-003',
    name: 'Jane Smith',
    avatarUrl: '/placeholder-images/avatar-4.jpeg',
    courseCount: 32,
    rating: 4.9,
    initials: 'JS',
  }
];

export const notifications: Notification[] = [
    {
        id: 'NOT-001',
        title: 'notification_new_instructor_title',
        description: 'notification_new_instructor_desc',
        timestamp: '5 minutes ago',
    },
    {
        id: 'NOT-002',
        title: 'notification_course_published_title',
        description: 'notification_course_published_desc',
        timestamp: '1 hour ago',
    },
    {
        id: 'NOT-003',
        title: 'notification_maintenance_title',
        description: 'notification_maintenance_desc',
        timestamp: '1 day ago',
    }
];

export const trafficData: TrafficSource[] = [
  { name: 'Organic', value: 400 },
  { name: 'Social', value: 300 },
  { name: 'Referral', value: 200 },
  { name: 'Direct', value: 100 },
];

export const salesData: Sales[] = [
  { month: 'Jan', sales: 2909 },
  { month: 'Feb', sales: 1259 },
  { month: 'Mar', sales: 950 },
  { month: 'Apr', sales: 1563 },
  { month: 'May', sales: 1825 },
  { month: 'Jun', sales: 2010 },
  { month: 'Jul', sales: 2526 },
  { month: 'Aug', sales: 3260 },
  { month: 'Sep', sales: 3005 },
  { month: 'Oct', sales: 3860 },
  { month: 'Nov', sales: 4039 },
  { month: 'Dec', sales: 4200 },
];

export const courseReviews: CourseReview[] = [
  {
    id: 'REV-001',
    courseId: 'CRS-001',
    courseTitle: 'Introduction to React',
    userId: 'USR-001',
    userName: 'Alice Johnson',
    userInitials: 'AJ',
    rating: 5,
    comment: 'Excellent course! The instructor explains everything very clearly. Highly recommended.',
    createdAt: new Date('2024-07-20T10:00:00Z'),
    status: 'Approved',
    likes: 25,
    dislikes: 1,
  },
  {
    id: 'REV-002',
    courseId: 'CRS-002',
    courseTitle: 'Advanced CSS Techniques',
    userId: 'USR-002',
    userName: 'Bob Smith',
    userAvatarUrl: '/placeholder-images/avatar-3.jpeg',
    userInitials: 'BS',
    rating: 3,
    comment: 'The content is good, but some parts were a bit rushed. Could use more examples.',
    createdAt: new Date('2024-07-19T14:30:00Z'),
    status: 'Pending',
    likes: 10,
    dislikes: 5,
  },
  {
    id: 'REV-003',
    courseId: 'CRS-001',
    courseTitle: 'Introduction to React',
    userId: 'USR-003',
    userName: 'Charlie Brown',
    userInitials: 'CB',
    rating: 1,
    comment: 'Not what I expected. Very basic and not helpful at all.',
    createdAt: new Date('2024-07-18T09:00:00Z'),
    status: 'Rejected',
    likes: 2,
    dislikes: 18,
  },
];

export const articleComments: ArticleComment[] = [
  {
    id: 'CMT-001',
    articleId: 'ART-001',
    articleTitle: '10 Tips for Better Code Reviews',
    userId: 'USR-004',
    userName: 'Diana Prince',
    userAvatarUrl: '/placeholder-images/avatar-4.jpeg',
    userInitials: 'DP',
    comment: 'Great tips! I especially agree with point #7. It has made a huge difference in our team\'s workflow.',
    createdAt: new Date('2024-07-21T11:00:00Z'),
    status: 'Approved',
    likes: 12,
  },
  {
    id: 'CMT-002',
    articleId: 'ART-002',
    articleTitle: 'The Rise of Server Components',
    userId: 'USR-005',
    userName: 'Ethan Hunt',
    userInitials: 'EH',
    comment: 'I have a question about hydration. How do server components handle state on the client after the initial render?',
    createdAt: new Date('2024-07-22T08:45:00Z'),
    status: 'Pending',
    likes: 2,
  },
  {
    id: 'CMT-003',
    parentId: 'CMT-001',
    articleId: 'ART-001',
    articleTitle: '10 Tips for Better Code Reviews',
    userId: 'USR-000',
    userName: 'Super Admin',
    userAvatarUrl: '/placeholder-images/avatar-1.jpeg',
    userInitials: 'SA',
    comment: 'Glad you found it helpful, Diana!',
    createdAt: new Date('2024-07-21T12:30:00Z'),
    status: 'Approved',
    likes: 5,
  }
];

export const orders: Order[] = [
  { id: 'ORD-001', userId: 'USR-001', date: new Date('2024-07-15'), amount: 49.99, itemCount: 1, status: 'Completed' },
  { id: 'ORD-002', userId: 'USR-002', date: new Date('2024-07-18'), amount: 129.98, itemCount: 2, status: 'Completed' },
  { id: 'ORD-003', userId: 'USR-001', date: new Date('2024-06-20'), amount: 89.00, itemCount: 1, status: 'Completed' },
  { id: 'ORD-004', userId: 'USR-004', date: new Date('2024-07-22'), amount: 19.99, itemCount: 1, status: 'Pending' },
];

export const userActivities: UserActivity[] = [
    { id: 'ACT-001', userId: 'USR-001', type: 'course_enrollment', description: 'Enrolled in "Introduction to React"', date: new Date('2024-07-15') },
    { id: 'ACT-002', userId: 'USR-001', type: 'article_view', description: 'Viewed "The Rise of Server Components"', date: new Date('2024-07-16') },
    { id: 'ACT-003', userId: 'USR-001', type: 'comment_post', description: 'Commented on "10 Tips for Better Code Reviews"', date: new Date('2024-07-17') },
    { id: 'ACT-004', userId: 'USR-002', type: 'seminar_registration', description: 'Registered for "AI in Education Summit"', date: new Date('2024-07-18') },
];
