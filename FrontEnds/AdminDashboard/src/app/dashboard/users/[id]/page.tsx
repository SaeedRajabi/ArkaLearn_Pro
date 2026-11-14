
'use client';

import * as React from 'react';
import {
  ArrowLeft,
  BookCheck,
  BookOpenCheck,
  CreditCard,
  FileText,
  MoreVertical,
  Shield,
  User,
  Star,
  Edit,
  UserX,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useLanguage } from '@/components/language-provider';
import { orders, userActivities } from '@/lib/placeholder-data';
import { notFound } from 'next/navigation';
import { StatsCard } from '../../components/stats-card';
import { useStore } from '@/lib/store';
import type { User as UserType } from '@/lib/types';
import UserDetailsLoading from './loading';
import { useToast } from '@/hooks/use-toast';
import { formatUserLastLogin, formatUserRegistrationDate } from '@/lib/format-user-date';
import { getUser } from '@/services/user-service';
import { resolveUserAvatarUrl } from '@/lib/default-user-avatar';

export default function UserDetailsPage() {
  const { t } = useLanguage();
  const params = useParams();
  const userId = params.id as string;
  const { users, toggleUserStatus } = useStore();
  const { toast } = useToast();
  const [user, setUser] = React.useState<UserType | null | undefined>(undefined);

  React.useEffect(() => {
    if (!userId) return;

    const fromStore = users.find((u) => u.id === userId);
    if (fromStore) {
      setUser(fromStore);
      return;
    }

    let cancelled = false;
    getUser(userId)
      .then((loaded) => {
        if (!cancelled) setUser(loaded ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, users]);
  
  const handleToggleBlock = (userId: string, userName: string, currentStatus: 'Active' | 'Blocked') => {
    toggleUserStatus(userId);
    const newStatus = currentStatus === 'Active' ? 'Blocked' : 'Active';
    toast({
      title: newStatus === 'Blocked' ? t('toast_user_blocked_title') : t('toast_user_unblocked_title'),
      description: (newStatus === 'Blocked' ? t('toast_user_blocked_desc') : t('toast_user_unblocked_desc')).replace('{name}', userName),
    });
  };

  if (user === undefined) {
    return <UserDetailsLoading />;
  }

  if (user === null) {
    notFound();
  }

  const userOrders = orders.filter((o) => o.userId === userId);
  const totalSpent = userOrders.reduce((acc, order) => acc + order.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/users">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">{t('back_to_users')}</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">
          {t('user_details_title')}
        </h1>
      </div>

      <Card>
        <CardHeader className="space-y-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row">
                 <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                    <AvatarImage src={resolveUserAvatarUrl(user.avatarUrl)} alt={user.name} />
                    <AvatarFallback className="text-3xl">{user.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                        <h2 className="text-2xl font-bold">{user.name}</h2>
                         <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                            {t(`status_${user.status.toLowerCase()}`)}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground">{user.email}</p>
                    <div className="mt-2 flex items-center justify-center sm:justify-start gap-2 text-sm text-muted-foreground">
                        <Shield className="h-4 w-4" />
                        <span>{t(`role_${user.role.toLowerCase().replace(' ', '_')}`)}</span>
                    </div>
                </div>
                 <div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="outline">
                                <MoreVertical className="h-5 w-5" />
                                <span className="sr-only">{t('user_menu_toggle')}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                {t('actions_edit')}
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleToggleBlock(user.id, user.name, user.status)} className="text-destructive">
                                {user.status === 'Active' ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                                {user.status === 'Active' ? t('actions_block') : t('actions_unblock')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
             <div className="grid grid-cols-1 gap-4 rounded-lg border bg-muted/50 p-4 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                    <div>
                        <p className="text-sm text-muted-foreground">{t('user_details_total_spent')}</p>
                        <p className="text-lg font-bold">${totalSpent.toFixed(2)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <BookCheck className="h-6 w-6 text-muted-foreground" />
                    <div>
                        <p className="text-sm text-muted-foreground">{t('user_details_courses_enrolled')}</p>
                        <p className="text-lg font-bold">5</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <BookOpenCheck className="h-6 w-6 text-muted-foreground" />
                    <div>
                        <p className="text-sm text-muted-foreground">{t('user_details_seminars_attended')}</p>
                        <p className="text-lg font-bold">2</p>
                    </div>
                </div>
            </div>
        </CardHeader>
        <CardContent>
             <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>{t('user_details_registered')}</span>
                <span>{formatUserRegistrationDate(user)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('user_details_last_login')}</span>
                <span>{formatUserLastLogin(user)}</span>
              </div>
            </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="orders" className="w-full">
        <TabsList>
          <TabsTrigger value="orders">{t('user_details_tab_orders')}</TabsTrigger>
          <TabsTrigger value="activity">{t('user_details_tab_activity')}</TabsTrigger>
          <TabsTrigger value="reviews">{t('user_details_tab_reviews')}</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>{t('user_details_orders_title')}</CardTitle>
              <CardDescription>{t('user_details_orders_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('orders_table_col_id')}</TableHead>
                    <TableHead>{t('orders_table_col_date')}</TableHead>
                    <TableHead>{t('orders_table_col_status')}</TableHead>
                    <TableHead className='text-right'>{t('orders_table_col_amount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className='font-medium'>{order.id}</TableCell>
                      <TableCell>{order.date.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === 'Completed' ? 'default' : 'secondary'}>{t(`status_${order.status.toLowerCase()}`)}</Badge>
                      </TableCell>
                      <TableCell className='text-right'>${order.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="activity">
           <Card>
            <CardHeader>
              <CardTitle>{t('user_details_activity_title')}</CardTitle>
              <CardDescription>{t('user_details_activity_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
               <ul className="space-y-4">
                {userActivities.filter(a => a.userId === userId).map(activity => (
                  <li key={activity.id} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        {activity.type === 'course_enrollment' && <BookCheck className="h-5 w-5 text-muted-foreground" />}
                        {activity.type === 'seminar_registration' && <BookOpenCheck className="h-5 w-5 text-muted-foreground" />}
                        {activity.type === 'article_view' && <FileText className="h-5 w-5 text-muted-foreground" />}
                        {activity.type === 'comment_post' && <User className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1">
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-muted-foreground">{activity.date.toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reviews">
             <Card>
                <CardHeader>
                    <CardTitle>{t('user_details_reviews_title')}</CardTitle>
                    <CardDescription>{t('user_details_reviews_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{t('no_reviews_placeholder')}</p>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
