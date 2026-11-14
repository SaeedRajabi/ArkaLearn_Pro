
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ProjectTable } from './components/project-table';
import { useLanguage } from '@/components/language-provider';
import { AddProjectModal } from './components/add-project-modal';
import type { Project } from '@/lib/types';

export default function ProjectsPage() {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleOpenModal = (project: Project | null = null) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">{t('projects_title')}</h1>
        <Button size="sm" className="xs:text-sm" onClick={() => handleOpenModal()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('projects_new_button')}
        </Button>
      </div>
      <ProjectTable key={refreshKey} onEditAction={handleOpenModal} />
      <AddProjectModal
        open={isModalOpen}
        onOpenChangeAction={setIsModalOpen}
        project={editingProject}
        onSuccessAction={handleSuccess}
      />
    </div>
  );
}
