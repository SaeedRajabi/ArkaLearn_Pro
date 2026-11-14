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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import type { Category, CategoryDetail } from '@/lib/types';
import { buildParentOptions, collectDescendantIds } from '@/lib/category-utils';
import { addCategoryApi, getCategoryById, updateCategoryApi } from '@/services/category-service';
import { resolveStaticAssetUrl } from '@/lib/apiClient';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required.'),
  description: z.string().min(1, 'Description is required.'),
  parentId: z.string().optional(),
  imageUrl: z.string().optional(),
});

type CategoryForm = z.infer<typeof categorySchema>;

type Props = {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  category?: Category | null;
  defaultParentId?: string | null;
  onSaved?: () => void;
};

export function CategoryFormModal({
  open,
  onOpenChangeAction,
  category,
  defaultParentId,
  onSaved,
}: Props) {
  const { t } = useLanguage();
  const { categoryTree, refreshCategories } = useStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDetailLoading, setIsDetailLoading] = React.useState(false);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [detail, setDetail] = React.useState<CategoryDetail | null>(null);

  const isEditMode = !!category;
  const handleClose = onOpenChangeAction;

  const form = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      parentId: '0',
      imageUrl: '',
    },
  });

  const imagePreview = form.watch('imageUrl');

  const parentOptions = React.useMemo(() => {
    const exclude = category ? collectDescendantIds(categoryTree, category.categoryId) : new Set<string>();
    return buildParentOptions(categoryTree, exclude).map((option) => ({
      ...option,
      label: option.value === '0' ? t('category_parent_root') : option.label,
    }));
  }, [category, categoryTree, t]);

  React.useEffect(() => {
    if (!open) {
      setDetail(null);
      setImageFile(null);
      return;
    }

    if (isEditMode && category) {
      setIsDetailLoading(true);
      getCategoryById(category.categoryId)
        .then((loaded) => {
          setDetail(loaded);
          const imageUrl = loaded?.categoryImage
            ? resolveStaticAssetUrl(loaded.categoryImage)
            : category.categoryImage || '';
          form.reset({
            name: loaded?.categoryName ?? category.categoryName,
            description: loaded?.categoryDescription ?? category.categoryDescription,
            parentId: loaded?.parentId ?? category.parentId ?? '0',
            imageUrl,
          });
        })
        .finally(() => setIsDetailLoading(false));
      return;
    }

    form.reset({
      name: '',
      description: '',
      parentId: defaultParentId && defaultParentId !== '0' ? defaultParentId : '0',
      imageUrl: '',
    });
    setImageFile(null);
    setDetail(null);
  }, [open, isEditMode, category, defaultParentId, form]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
    const parentId = values.parentId && values.parentId !== '0' ? Number(values.parentId) : 0;

    const result = isEditMode && category
      ? await updateCategoryApi({
          categoryId: category.categoryId,
          categoryName: values.name,
          description: values.description,
          parentId,
          categoryImage: imageFile ?? undefined,
        })
      : await addCategoryApi({
          categoryName: values.name,
          description: values.description,
          parentId,
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
    onSaved?.();
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="flex max-h-[90vh] max-w-lg flex-col sm:max-w-xl"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEditMode ? t('editCategory_title') : t('addCategory_title')}</DialogTitle>
          <DialogDescription>
            {isEditMode ? t('editCategory_description') : t('addCategory_description')}
          </DialogDescription>
        </DialogHeader>

        {isDetailLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="-mr-6 overflow-y-auto pr-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSave)} className="ml-1 space-y-5 py-2">
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
                        <Textarea placeholder={t('addCategory_description_placeholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('category_parent_label')}</FormLabel>
                      <Select value={field.value ?? '0'} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('category_parent_placeholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {parentOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <Label htmlFor="category-photo-upload" className="text-base font-medium">
                    {t('addCategory_photo_label')}
                  </Label>
                  <p className="mb-2 text-sm text-muted-foreground">{t('addCategory_photo_description')}</p>
                  <div className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-8">
                    <div className="text-center">
                      {imagePreview ? (
                        <Image
                          src={imagePreview}
                          alt="Category Preview"
                          width={128}
                          height={128}
                          unoptimized
                          className="mx-auto h-32 w-32 rounded-md object-cover"
                        />
                      ) : (
                        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                      )}
                      <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                        <Label
                          htmlFor="category-photo-upload"
                          className="relative cursor-pointer rounded-md bg-background font-semibold text-primary hover:text-primary/80"
                        >
                          <p className="mb-2 mt-1">{t('upload_file')}</p>
                          <Input
                            id="category-photo-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                          <p className="mb-2 pl-1">{t('drag_and_drop')}</p>
                        </Label>
                      </div>
                      <p className="text-xs leading-5 text-muted-foreground">{t('image_upload_specs')}</p>
                    </div>
                  </div>
                </div>

                {isEditMode && detail?.children?.length ? (
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="mb-2 text-sm font-semibold">{t('category_children_label')}</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {detail.children.map((child) => (
                        <li key={child.categoryId} className="flex items-center justify-between gap-2">
                          <span>{child.categoryName}</span>
                          <span className="text-xs">
                            {t('categoryTable_col_courses')}: {child.courseCount}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <DialogFooter className="mt-auto border-t pt-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditMode ? t('editCategory_save_button') : t('addCategory_save_button')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
