'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Loader2, Search, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { resolveStaticAssetUrl } from '@/lib/apiClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { AddProjectModal } from './add-project-modal';
import type { Project } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  searchProjects,
  deleteProject as deleteProjectApi,
  getProjectById,
  updateProject as updateProjectApi,
  type SearchProjectItem,
} from '@/services/project-api.service';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';

function toValidDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function resolveProjectDate(...values: unknown[]): Date {
  for (const value of values) {
    const parsed = toValidDate(value);
    if (parsed) return parsed;
  }
  return new Date();
}

function formatTableDate(dateValue: unknown, locale: 'en' | 'fa'): string {
  const date = toValidDate(dateValue);
  if (!date) return '-';

  try {
    return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return '-';
  }
}

function mapSearchItemToProject(item: SearchProjectItem): Project {
  return {
    id: String(item.id),
    title: item.title,
    slug: item.slug,
    shortDescription: item.shortDescription,
    longDescription: item.shortDescription,
    status: item.isPublished ? 'Published' : 'Draft',
    publishedAt: resolveProjectDate(item.publishedAt, item.createdAt),
    thumbnailUrl: item.thumbnailUrl ?? undefined,
    tags: item.tags ?? [],
    technologies: item.technologies ?? [],
  };
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-\u0600-\u06FF]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'project';
}

export function ProjectTable({
  onEditAction,
}: {
  onEditAction?: (project: Project) => void;
}) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);
  const [navigatingToId, setNavigatingToId] = React.useState<string | null>(null);
  const [publishingId, setPublishingId] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const filteredProjects = React.useMemo(() => {
    const term = searchTerm.toLowerCase();
    return projects.filter(
      (project) =>
        project.title.toLowerCase().includes(term) ||
        project.slug.toLowerCase().includes(term) ||
        project.shortDescription.toLowerCase().includes(term) ||
        (project.technologies ?? []).some((tech) => tech.toLowerCase().includes(term)) ||
        (project.tags ?? []).some((tag) => tag.toLowerCase().includes(term))
    );
  }, [projects, searchTerm]);

  const paginatedProjects = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, page, pageSize]);

  React.useEffect(() => {
    setPage(1);
  }, [searchTerm, pageSize, projects.length]);

  const exportColumns = React.useMemo<TableExportColumn<Project>[]>(
    () => [
      { header: t('projects_table_col_title'), accessor: (row) => row.title },
      { header: t('projects_table_col_status'), accessor: (row) => t(row.status.toLowerCase()) },
      {
        header: t('projects_table_col_technologies'),
        accessor: (row) => (row.technologies ?? []).join(', ') || '—',
      },
      {
        header: t('projects_table_col_date'),
        accessor: (row) => formatTableDate(row.publishedAt, locale),
      },
    ],
    [t, locale]
  );

  const handleProjectClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setNavigatingToId(id);
    router.push(`/dashboard/projects/${id}`);
  };

  const fetchProjects = React.useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await searchProjects({ publishedOnly: false });
      setProjects(items.map(mapSearchItemToProject));
    } catch {
      setProjects([]);
      toast({
        variant: 'destructive',
        title: t('error_title') || 'Error',
        description: t('error_fetch_projects') || 'Failed to load projects.',
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async (id: string, title: string) => {
    try {
      await deleteProjectApi(Number(id));
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast({
        title: t('project_deleted_title'),
        description: t('project_deleted_description').replace('{title}', title),
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t('error_title') || 'Error',
        description: t('error_delete_project') || 'Failed to delete project.',
      });
    }
  };

  const handleEdit = (project: Project) => {
    if (onEditAction) {
      onEditAction(project);
    } else {
      setEditingProject(project);
    }
  };

  const handlePublish = async (project: Project) => {
    setPublishingId(project.id);
    try {
      const full = await getProjectById(project.id);
      if (!full) {
        throw new Error('Project not found');
      }
      await updateProjectApi({
        id: Number(full.id ?? project.id),
        title: full.title ?? project.title,
        slug: full.slug ?? project.slug ?? slugify(full.title ?? project.title),
        shortDescription: full.shortDescription ?? project.shortDescription,
        longDescription: full.longDescription ?? project.longDescription ?? '',
        thumbnailUrl: full.thumbnailUrl ?? project.thumbnailUrl ?? null,
        introVideoUrl: full.introVideoUrl ?? project.introVideoUrl ?? null,
        gitHubUrl: full.gitHubUrl ?? project.gitHubUrl ?? null,
        projectUrl: full.projectUrl ?? project.projectUrl ?? null,
        technologiesJson: JSON.stringify(full.technologies ?? project.technologies ?? []),
        galleryJson: JSON.stringify(full.gallery ?? project.gallery ?? []),
        tagsJson: JSON.stringify(full.tags ?? project.tags ?? []),
        isPublished: true,
      });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === project.id ? { ...p, status: 'Published', publishedAt: new Date() } : p
        )
      );
      toast({
        title: t('project_published_title') || 'Project published',
        description: t('project_published_description') || 'The project has been published.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t('error_title') || 'Error',
        description: t('error_publish_project') || 'Failed to publish project.',
      });
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('search_projects') || 'Search projects...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      <AdminTableShell
        title={t('projects_table_title')}
        description={t('projects_table_description')}
        locale={locale}
        t={t}
        totalCount={filteredProjects.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        exportFilenameBase="projects"
        exportTitle={t('projects_table_title')}
        exportColumns={exportColumns}
        exportRows={paginatedProjects}
        fetchAllExportRows={async () => filteredProjects}
        loading={loading}
        isEmpty={!loading && filteredProjects.length === 0}
        emptyMessage={t('no_projects_found') || 'No projects found'}
      >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{textAlign: locale==='fa' ? 'right' : 'left'}} className="pl-6">{t('projects_table_col_title')}</TableHead>
                  <TableHead style={{textAlign: locale==='fa' ? 'right' : 'left'}}>{t('projects_table_col_status')}</TableHead>
                  <TableHead style={{textAlign: locale==='fa' ? 'right' : 'left'}} className="hidden md:table-cell">{t('projects_table_col_technologies')}</TableHead>
                  <TableHead style={{textAlign: locale==='fa' ? 'right' : 'left'}} className="hidden lg:table-cell">{t('projects_table_col_date')}</TableHead>
                  <TableHead style={{textAlign: locale==='fa' ? 'right' : 'left'}} className="pr-6 text-right">{t('projects_table_col_actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProjects.map((project) => (
                  <TableRow key={project.id} className="group">
                    <TableCell className="pl-6 font-medium">
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        onClick={(e) => handleProjectClick(e, project.id)}
                        className={cn(
                          'inline-flex items-center gap-2 transition-colors hover:text-primary',
                          navigatingToId === project.id && 'cursor-wait'
                        )}
                      >
                        {project.thumbnailUrl && (
                          <div className="relative hidden h-8 w-12 overflow-hidden rounded sm:block">
                            <img
                              src={resolveStaticAssetUrl(project.thumbnailUrl)}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <span className="font-semibold">
                          {navigatingToId === project.id && (
                            <Loader2 className="mr-2 inline h-3 w-3 animate-spin" />
                          )}
                          {project.title}
                        </span>
                      </Link>
                      {project.tags && project.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {project.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={project.status === 'Published' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {t(project.status.toLowerCase())}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden max-w-[200px] truncate text-muted-foreground md:table-cell">
                      {(project.technologies ?? []).slice(0, 3).join(', ') || '-'}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {formatTableDate(project.publishedAt, locale)}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {project.status === 'Draft' && (
                            <DropdownMenuItem
                              onClick={() => handlePublish(project)}
                              disabled={publishingId === project.id}
                            >
                              {publishingId === project.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                              )}
                              {t('actions_publish') || 'Publish'}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleEdit(project)}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t('actions_edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(project.id, project.title)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('actions_delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </AdminTableShell>

      {!onEditAction && (
        <AddProjectModal
          open={!!editingProject}
          onOpenChangeAction={(isOpen) => !isOpen && setEditingProject(null)}
          project={editingProject}
          onSuccessAction={fetchProjects}
        />
      )}
    </div>
  );
}
