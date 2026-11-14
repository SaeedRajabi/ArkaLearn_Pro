import type { SeminarUser, SeminarRoom, SeminarClassSchedule } from './types';

export let mockSeminarUsers: SeminarUser[] = [
  {
    id: 'seminar-user-1',
    name: 'Dr. Evelyn Reed',
    displayName: 'Evelyn R.',
    username: 'organizer',
    password: 'password123',
    email: 'e.reed@arkasoftware.com',
    emailVerified: false,
    role: 'organizer',
    avatar: 'https://picsum.photos/seed/avatar1/200/200',
    contactNumber: '123-456-7890',
  },
  {
    id: 'seminar-user-2',
    name: 'John Doe',
    displayName: 'John D.',
    username: 'participant1',
    password: 'password123',
    email: 'j.doe@example.com',
    emailVerified: true,
    role: 'participant',
    avatar: 'https://picsum.photos/seed/avatar2/200/200',
    paymentPlan: {
      type: 'package',
      paymentType: 'installment',
      planId: 'user2-plan1',
      planName: '15-Hour Package',
      totalHours: 15,
      price: 10500000,
      paidInstallments: 1,
      totalInstallments: 2,
      status: 'Active',
      paymentConfirmed: true,
      nextPaymentDue: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    planHistory: [
      {
        id: 'user2-plan1',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        planName: '15-Hour Package',
        totalHours: 15,
        price: 10500000,
        status: 'Active',
      },
    ],
    paymentHistory: [
      {
        id: 'pay-initial-1',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        planId: 'user2-plan1',
        planName: '15-Hour Package',
        amount: 5250000,
        status: 'Completed',
      },
    ],
  },
  {
    id: 'seminar-user-3',
    name: 'Jane Smith',
    displayName: 'Jane S.',
    username: 'participant2',
    password: 'password123',
    email: 'j.smith@example.com',
    emailVerified: true,
    role: 'participant',
    avatar: 'https://picsum.photos/seed/avatar3/200/200',
  },
  {
    id: 'seminar-user-4',
    name: 'Alice Johnson',
    displayName: 'Alice J.',
    username: 'participant3',
    password: 'password123',
    email: 'a.johnson@example.com',
    emailVerified: true,
    role: 'participant',
    avatar: 'https://picsum.photos/seed/avatar4/200/200',
    contactNumber: '555-123-4567',
    paymentPlan: {
      type: 'package',
      paymentType: 'installment',
      planId: 'alice-plan-3',
      planName: '60-Hour Package',
      totalHours: 60,
      price: 28000000,
      paidInstallments: 1,
      totalInstallments: 3,
      status: 'Active',
      paymentConfirmed: true,
      nextPaymentDue: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
    },
    planHistory: [
      {
        id: 'alice-plan-1',
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 5)).toISOString(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString(),
        planName: '15-Hour Package',
        totalHours: 15,
        price: 10500000,
        status: 'Expired',
      },
      {
        id: 'alice-plan-2',
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
        planName: '30-Hour Package',
        totalHours: 30,
        price: 19000000,
        status: 'Expired',
      },
      {
        id: 'alice-plan-3',
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
        planName: '60-Hour Package',
        totalHours: 60,
        price: 28000000,
        status: 'Active',
      },
    ],
    classSchedule: [
      {
        id: 'class-1',
        date: new Date().toISOString().split('T')[0],
        className: 'Introduction to Programming',
        startTime: '10:00',
        endTime: '11:30',
        description: 'First session',
        status: 'pending',
      },
    ],
    paymentHistory: [
      {
        id: 'pay-alice-1-1',
        date: new Date(new Date().setMonth(new Date().getMonth() - 5)).toISOString(),
        planId: 'alice-plan-1',
        planName: '15-Hour Package',
        amount: 5250000,
        status: 'Completed',
      },
      {
        id: 'pay-alice-1-2',
        date: new Date(new Date().setMonth(new Date().getMonth() - 4)).toISOString(),
        planId: 'alice-plan-1',
        planName: '15-Hour Package',
        amount: 5250000,
        status: 'Completed',
      },
      {
        id: 'pay-alice-2-1',
        date: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString(),
        planId: 'alice-plan-2',
        planName: '30-Hour Package',
        amount: 19000000,
        status: 'Completed',
      },
      {
        id: 'pay-alice-3-1',
        date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
        planId: 'alice-plan-3',
        planName: '60-Hour Package',
        amount: 9333333,
        status: 'Completed',
      },
    ],
  },
  {
    id: 'seminar-user-5',
    name: 'Bob Brown',
    displayName: 'Bob B.',
    username: 'participant4',
    password: 'password123',
    email: 'b.brown@example.com',
    emailVerified: false,
    role: 'participant',
    avatar: 'https://picsum.photos/seed/avatar5/200/200',
  },
];

export let mockSeminarRooms: SeminarRoom[] = [
  {
    id: 'room-1',
    name: 'Q2 Project Kick-off',
    organizerId: 'seminar-user-1',
    participants: ['seminar-user-2', 'seminar-user-3'],
    participantRoles: {
      'seminar-user-2': 'participant',
      'seminar-user-3': 'presenter',
    },
    allowGuests: true,
    guestLimit: 10,
    duration: 60,
  },
  {
    id: 'room-2',
    name: 'Weekly Sync',
    organizerId: 'seminar-user-1',
    participants: ['seminar-user-4', 'seminar-user-5'],
    participantRoles: {
      'seminar-user-4': 'participant',
      'seminar-user-5': 'participant',
    },
    allowGuests: false,
    duration: 30,
  },
  {
    id: 'room-3',
    name: 'Design Review',
    organizerId: 'seminar-user-1',
    participants: [],
    participantRoles: {},
    allowGuests: true,
    guestLimit: 5,
    duration: 90,
  },
];

export const updateMockSeminarUser = (updatedUser: SeminarUser) => {
  const idx = mockSeminarUsers.findIndex((u) => u.id === updatedUser.id);
  if (idx !== -1) mockSeminarUsers[idx] = updatedUser;
  else mockSeminarUsers.push(updatedUser);
};

export const updateMockSeminarRoom = (updatedRoom: SeminarRoom) => {
  const idx = mockSeminarRooms.findIndex((r) => r.id === updatedRoom.id);
  if (idx !== -1) mockSeminarRooms[idx] = updatedRoom;
  else mockSeminarRooms.push(updatedRoom);
};
