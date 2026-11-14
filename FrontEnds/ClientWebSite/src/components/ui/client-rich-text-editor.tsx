'use client';

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Heading from '@tiptap/extension-heading';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Heading2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ClientRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
  placeholder?: string;
  className?: string;
}

export function ClientRichTextEditor({
  value,
  onChange,
  onUploadImage,
  placeholder,
  className,
}: ClientRichTextEditorProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Heading.configure({ levels: [2, 3, 4] }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: true, allowBase64: true }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none min-h-[220px] px-3 py-2 focus:outline-none',
      },
    },
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
  });

  React.useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || '', false);
    }
  }, [editor, value]);

  const handleImageUpload = async (file: File) => {
    if (!editor || !onUploadImage) return;
    try {
      const url = await onUploadImage(file);
      if (url) editor.chain().focus().setImage({ src: url }).run();
    } catch {
      /* ignore */
    }
  };

  if (!editor) return null;

  const toolBtn = (active: boolean, onClick: () => void, icon: React.ReactNode, label: string) => (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="icon"
      className="h-8 w-8"
      onClick={onClick}
      aria-label={label}
    >
      {icon}
    </Button>
  );

  return (
    <div className={cn('rounded-md border bg-background', className)}>
      <div className="flex flex-wrap items-center gap-1 border-b p-2">
        {toolBtn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), <Bold className="h-4 w-4" />, 'Bold')}
        {toolBtn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), <Italic className="h-4 w-4" />, 'Italic')}
        {toolBtn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), <UnderlineIcon className="h-4 w-4" />, 'Underline')}
        {toolBtn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 className="h-4 w-4" />, 'Heading')}
        {toolBtn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), <List className="h-4 w-4" />, 'Bullet list')}
        {toolBtn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered className="h-4 w-4" />, 'Ordered list')}
        {toolBtn(editor.isActive({ textAlign: 'left' }), () => editor.chain().focus().setTextAlign('left').run(), <AlignLeft className="h-4 w-4" />, 'Align left')}
        {toolBtn(editor.isActive({ textAlign: 'center' }), () => editor.chain().focus().setTextAlign('center').run(), <AlignCenter className="h-4 w-4" />, 'Align center')}
        {toolBtn(editor.isActive({ textAlign: 'right' }), () => editor.chain().focus().setTextAlign('right').run(), <AlignRight className="h-4 w-4" />, 'Align right')}
        {onUploadImage && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImageUpload(file);
                e.target.value = '';
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Insert image"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      <EditorContent editor={editor} />
      {!value && placeholder && (
        <p className="pointer-events-none -mt-[200px] px-3 text-sm text-muted-foreground">{placeholder}</p>
      )}
    </div>
  );
}
