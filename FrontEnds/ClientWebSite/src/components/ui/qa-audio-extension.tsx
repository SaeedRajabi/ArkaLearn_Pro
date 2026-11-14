'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveQaMediaUrl } from '@/lib/qa-content-html';

function resolveAudioSrc(url: string): string {
  if (!url) return '';
  return resolveQaMediaUrl(url);
}

function QaAudioNodeView({ node, deleteNode }: NodeViewProps) {
  const src = resolveAudioSrc(String(node.attrs.src ?? ''));
  return (
    <NodeViewWrapper className="qa-audio-node my-3 flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 max-w-md">
      <audio controls preload="metadata" className="w-full" src={src}>
        <track kind="captions" />
      </audio>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start gap-1 text-destructive hover:text-destructive"
        onClick={() => deleteNode()}
      >
        <X className="h-3.5 w-3.5" />
        Remove audio
      </Button>
    </NodeViewWrapper>
  );
}

export const QaAudio = Node.create({
  name: 'qaAudio',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (el) => el.getAttribute('src') ?? el.getAttribute('data-qa-audio-src'),
        renderHTML: (attrs) => (attrs.src ? { src: attrs.src } : {}),
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'audio[src]' },
      { tag: 'span[data-qa-audio-src]' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'audio',
      mergeAttributes(
        {
          controls: 'true',
          preload: 'metadata',
          class: 'qa-audio my-2 w-full max-w-md',
        },
        HTMLAttributes
      ),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(QaAudioNodeView);
  },
});
