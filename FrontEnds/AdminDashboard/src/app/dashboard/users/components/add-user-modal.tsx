
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';
import { useStore } from '@/lib/store';
import { Role } from '@/lib/types';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  role: z.string().min(1, 'Role is required.'),
});

type UserForm = z.infer<typeof userSchema>;

export function AddUserModal({
  open,
  onOpenChangeAction,
}: {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
}) {
  const { t } = useLanguage();
  const onOpenChange = onOpenChangeAction;
  const { addUser } = useStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'Admin',
    },
  });

  const handleSave = (values: UserForm) => {
    setIsLoading(true);
    
    addUser({ ...values, role: values.role as Role });

    setTimeout(() => {
      toast({
        title: t('toast_user_created_title'),
        description: t('toast_user_created_desc').replace('{name}', values.name),
      });
      setIsLoading(false);
      onOpenChange(false);
      // Reset form after a delay to allow modal to close
      setTimeout(() => {
        form.reset();
      }, 300);
    }, 500); // Simulate a short delay
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{t('addUser_title')}</DialogTitle>
          <DialogDescription>{t('addUser_description')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('addUser_name_label')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('addUser_name_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('addUser_email_label')}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={t('addUser_email_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('addUser_role_label')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('addUser_role_placeholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Super Admin">{t('role_super_admin')}</SelectItem>
                      <SelectItem value="Admin">{t('role_admin')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4 border-t">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('addUser_save_button')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
