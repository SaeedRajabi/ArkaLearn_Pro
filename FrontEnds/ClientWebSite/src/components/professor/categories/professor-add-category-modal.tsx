'use client';

import * as React from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, UploadCloud } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CategoryParentSelect } from '@/components/professor/categories/category-custom-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import {
  addCategory,
  buildCategoryPickerOptions,
  updateCategory,
  type CategoryTreeItem,
} from '@/lib/api/categories';
import { getCategoryImageUrl } from '@/lib/category-image';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  imageUrl: z.string().optional(),
  parentId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dict: Dictionary;
  tree: CategoryTreeItem[];
  parentId?: number | null;
  parentName?: string;
  categoryToEdit?: CategoryTreeItem | null;
  onSaved: () => void;
};

export function ProfessorAddCategoryModal({
  open,
  onOpenChange,
  dict,
  tree,
  parentId = null,
  parentName,
  categoryToEdit = null,
  onSaved,
}: Props) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const [imageFile, setImageFile] = React.useState<File | null>(null);

  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);
  const isRtl = getDictValue(dict, 'header.courses', '') !== 'Courses';
  const isEditMode = !!categoryToEdit;

  const parentOptions = React.useMemo(
    () =>
      buildCategoryPickerOptions(
        tree,
        t('professorDashboard.categories.rootCategory', isRtl ? '— بدون والد (دسته اصلی)' : '— No parent (root)')
      ),
    [tree, isRtl, dict]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', imageUrl: '', parentId: 'root' },
  });

  const imagePreview = form.watch('imageUrl');
  const selectedParentId = form.watch('parentId');

  React.useEffect(() => {
    if (!open) return;

    if (isEditMode && categoryToEdit) {
      form.reset({
        name: categoryToEdit.name,
        description: categoryToEdit.description,
        imageUrl: getCategoryImageUrl(categoryToEdit.imageUrl),
        parentId: 'root',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        imageUrl: '',
        parentId: parentId != null ? String(parentId) : 'root',
      });
    }
    setImageFile(null);
  }, [open, parentId, categoryToEdit, isEditMode, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      form.setValue('imageUrl', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClose = () => onOpenChange(false);

  const resolvedParentName =
    !isEditMode && selectedParentId && selectedParentId !== 'root'
      ? parentOptions.find((o) => o.id != null && String(o.id) === selectedParentId)?.name
      : null;

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);

    if (isEditMode && categoryToEdit) {
      const result = await updateCategory({
        categoryId: categoryToEdit.id,
        categoryName: values.name,
        description: values.description,
        categoryImage: imageFile,
      });
      setSubmitting(false);

      if (!result.ok) {
        toast({
          variant: 'destructive',
          title: t('professorDashboard.categories.updateFailed', 'Could not update category'),
          description: result.message ?? t('professorDashboard.categories.tryAgain', 'Please try again.'),
        });
        return;
      }

      toast({
        title: t('professorDashboard.categories.updateSuccess', 'Category updated'),
        description: t(
          'professorDashboard.categories.updateSuccessDesc',
          'Changes were saved successfully.'
        ),
      });
      handleClose();
      onSaved();
      return;
    }

    const resolvedParent =
      values.parentId && values.parentId !== 'root' ? Number(values.parentId) : null;

    const result = await addCategory({
      categoryName: values.name,
      description: values.description,
      parentId: resolvedParent,
      categoryImage: imageFile,
    });
    setSubmitting(false);

    if (!result.ok) {
      toast({
        variant: 'destructive',
        title: t('professorDashboard.categories.saveFailed', 'Could not save category'),
        description: result.message ?? t('professorDashboard.categories.tryAgain', 'Please try again.'),
      });
      return;
    }

    toast({
      title: t('professorDashboard.categories.saveSuccess', 'Category created'),
      description: t(
        'professorDashboard.categories.saveSuccessDesc',
        'The new category was added successfully.'
      ),
    });
    handleClose();
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent
        className="flex max-h-[90vh] w-[min(calc(100vw-2rem),36rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl"
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 space-y-1.5 border-b bg-gradient-to-b from-muted/40 to-background px-6 pb-4 pt-6 text-start">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {isEditMode
              ? t('professorDashboard.categories.editCategory', 'Edit category')
              : t('professorDashboard.categories.addCategory', 'Add category')}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {isEditMode
              ? t(
                  'professorDashboard.categories.editDescription',
                  'Update the category title, description, or image.'
                )
              : resolvedParentName || parentName
                ? t(
                    'professorDashboard.categories.addChildDescription',
                    'This category will be created under "{parent}".'
                  ).replace('{parent}', resolvedParentName ?? parentName ?? '')
                : t(
                    'professorDashboard.categories.addRootDescription',
                    'Create a top-level category such as Articles or Courses.'
                  )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-5">
                {!isEditMode ? (
                  <FormField
                    control={form.control}
                    name="parentId"
                    render={({ field }) => (
                      <FormItem className={isRtl ? 'text-right' : ''}>
                        <FormLabel>
                          {t('professorDashboard.categories.parentCategory', isRtl ? 'دسته والد' : 'Parent category')}
                        </FormLabel>
                        <FormControl>
                          <CategoryParentSelect
                            id="category-parent-select"
                            value={field.value ?? 'root'}
                            onChange={field.onChange}
                            options={parentOptions}
                            isRtl={isRtl}
                            placeholder={t(
                              'professorDashboard.categories.selectParent',
                              isRtl ? 'انتخاب دسته والد' : 'Select parent category'
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className={isRtl ? 'text-right' : ''}>
                      <FormLabel>{t('professorDashboard.categories.name', 'Category title')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            'professorDashboard.categories.namePlaceholder',
                            'e.g. Articles, Courses'
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className={isRtl ? 'text-right' : ''}>
                      <FormLabel>{t('professorDashboard.categories.description', 'Description')}</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder={t(
                            'professorDashboard.categories.descriptionPlaceholder',
                            'Brief description of this category'
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className={isRtl ? 'text-right' : ''}>
                  <Label className="text-base font-medium">
                    {t('professorDashboard.categories.image', 'Category image')}
                  </Label>
                  <p className="mb-2 text-sm text-muted-foreground">
                    {isEditMode
                      ? t(
                          'professorDashboard.categories.imageEditHint',
                          isRtl ? 'برای تغییر تصویر، فایل جدید انتخاب کنید.' : 'Choose a new file to replace the image.'
                        )
                      : t('professorDashboard.categories.imageHint', 'Optional. A default image is used if empty.')}
                  </p>
                  <div className="mt-2 flex justify-center rounded-xl border border-dashed border-input px-6 py-8">
                    <div className="text-center">
                      {imagePreview ? (
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          width={128}
                          height={128}
                          className="mx-auto h-32 w-32 rounded-lg object-cover"
                          unoptimized
                        />
                      ) : (
                        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                      )}
                      <div className="mt-4 text-sm text-muted-foreground">
                        <Label
                          htmlFor="category-image-upload"
                          className="cursor-pointer font-semibold text-primary hover:text-primary/80"
                        >
                          {t('professorDashboard.categories.uploadImage', 'Upload image')}
                        </Label>
                        <Input
                          id="category-image-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="shrink-0 border-t bg-muted/20 px-6 py-4 sm:justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isEditMode
                  ? t('professorDashboard.categories.saveChanges', 'Save changes')
                  : t('professorDashboard.categories.create', 'Create category')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
