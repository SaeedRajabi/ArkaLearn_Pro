'use client';

import * as React from 'react';
import {
  getActiveTeacherStories,
  type TeacherStoryItem,
} from '@/lib/api/support-chat';
import {
  TeacherStoriesBar,
  groupTeacherStories,
  type TeacherStoryGroup,
} from '@/components/support/teacher-stories-bar';
import { TeacherStoryViewer } from '@/components/support/teacher-story-viewer';
import { TeacherStoryPublisher } from '@/components/support/teacher-story-publisher';

type TeacherStoriesPanelProps = {
  canPublish?: boolean;
  className?: string;
};

export function TeacherStoriesPanel({ canPublish = false, className }: TeacherStoriesPanelProps) {
  const [stories, setStories] = React.useState<TeacherStoryItem[]>([]);
  const [activeStories, setActiveStories] = React.useState<TeacherStoryItem[]>([]);
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [publisherOpen, setPublisherOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const rows = await getActiveTeacherStories();
      setStories(rows);
    } catch {
      setStories([]);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const groups = React.useMemo(() => groupTeacherStories(stories), [stories]);

  const openGroup = (group: TeacherStoryGroup) => {
    setActiveStories(group.stories);
    setViewerOpen(true);
  };

  return (
    <>
      <TeacherStoriesBar
        className={className}
        groups={groups}
        onOpenGroup={openGroup}
        onPublishClick={canPublish ? () => setPublisherOpen(true) : undefined}
        publishLabel="استوری جدید"
        emptyLabel="هنوز استوری فعالی نیست"
      />
      <TeacherStoryViewer
        open={viewerOpen}
        stories={activeStories}
        onClose={() => setViewerOpen(false)}
        onStoryViewed={(storyId) => {
          setStories((prev) =>
            prev.map((s) => (s.id === storyId ? { ...s, hasUnseen: false } : s))
          );
        }}
      />
      {canPublish ? (
        <TeacherStoryPublisher
          open={publisherOpen}
          onOpenChange={setPublisherOpen}
          onPublished={() => void load()}
        />
      ) : null}
    </>
  );
}
