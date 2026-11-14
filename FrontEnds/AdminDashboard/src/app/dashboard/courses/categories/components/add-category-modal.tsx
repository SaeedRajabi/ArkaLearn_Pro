
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, UploadCloud } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { useStore } from '@/lib/store';
import type { Category } from '@/lib/types';
import { addCategoryApi } from '@/services/category-service';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required.'),
  description: z.string().min(1, 'Description is required.'),
  imageUrl: z.string().optional(),
});

type CategoryForm = z.infer<typeof categorySchema>;

export function AddCategoryModal({
  open,
  onOpenChangeAction,
  category,
}: {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  category?: Category | null;
}) {
  const { t } = useLanguage();
  const { addCategory, updateCategory, refreshCategories } = useStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  /** فایل تصویر انتخاب‌شده برای ارسال به API */
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const handleClose = onOpenChangeAction;

  const isEditMode = !!category;

  const form = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
  });

  const imagePreview = form.watch('imageUrl');

  React.useEffect(() => {
    if (open) {
      if (isEditMode && category) {
        form.reset({
          name: category.categoryName,
          description: category.categoryDescription,
          imageUrl: category.categoryImage || '',
        });
      } else {
        form.reset({
          name: '',
          description: '',
          imageUrl: '',
        });
        setImageFile(null);
      }
    }
  }, [open, isEditMode, category, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('imageUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
    }
  };

  const handleSave = async (values: CategoryForm) => {
    setIsLoading(true);

    if (isEditMode && category) {
      updateCategory(category.categoryId, {
        categoryName: values.name,
        categoryDescription: values.description,
        categoryImage: values.imageUrl,
      });
      toast({
        title: t('editCategory_toast_success_title'),
        description: t('editCategory_toast_success_description').replace('{name}', values.name),
      });
      setTimeout(() => {
        setIsLoading(false);
        handleClose(false);
      }, 300);
      return;
    }

    const result = await addCategoryApi({
      categoryName: values.name,
      description: values.description,
      categoryImage: imageFile ?? undefined,
    });

    setIsLoading(false);

    if (result.action === 'destructive') {
      toast({
        variant: 'destructive',
        title: t(result.title),
        description: t(result.description),
      });
      return;
    }

    toast({
      title: t(result.title),
      description: t(result.description).replace('{name}', values.name),
    });
    await refreshCategories();
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[425px] max-h-[90vh] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEditMode ? t('editCategory_title') : t('addCategory_title')}</DialogTitle>
          <DialogDescription>
            {isEditMode ? t('editCategory_description') : t('addCategory_description')}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto pr-6 -mr-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSave)}
              className="space-y-6 py-4 ml-3"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('addCategory_name_label')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('addCategory_name_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('addCategory_description_label')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('addCategory_description_placeholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <Label htmlFor="photo-upload" className="text-base font-medium">
                  {t('addCategory_photo_label')}
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  {t('addCategory_photo_description')}
                </p>
                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10">
                  <div className="text-center">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Category Preview"
                        width={128}
                        height={128}
                        className="mx-auto rounded-md object-cover h-32 w-32"
                      />
                    ) : (
                      <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                    )}
                    <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                      <Label
                          htmlFor="photo-upload"
                          className="relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80"
                      >
                        <p className="mt-1 mb-2">{t('upload_file')}</p>
                        <Input
                            id="photo-upload"
                            name="photo-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        <p className="pl-1 mb-2">{t('drag_and_drop')}</p>
                      </Label>

                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {t('image_upload_specs')}
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-4 mt-auto border-t">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditMode ? t('editCategory_save_button') : t('addCategory_save_button')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
