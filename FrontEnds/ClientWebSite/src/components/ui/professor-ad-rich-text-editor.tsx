'use client';

import React from 'react';
import { Extension } from '@tiptap/core';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Heading from '@tiptap/extension-heading';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo,
  Smile,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getPlainTextLengthFromHtml } from '@/lib/utils/advertisement-limits';

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, '') || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }: { chain: () => { focus: () => { setMark: (name: string, attrs: object) => { run: () => boolean } } } }) =>
          chain().focus().setMark('textStyle', { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }: { chain: () => { focus: () => { setMark: (name: string, attrs: object) => { run: () => boolean } } } }) =>
          chain().focus().setMark('textStyle', { fontSize: null }).run(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  },
});

const FONTS = [
  { label: 'پیش‌فرض', value: 'inherit' },
  { label: 'Tahoma', value: 'Tahoma, sans-serif' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Mono', value: 'ui-monospace, monospace' },
  { label: 'Vazirmatn', value: 'Vazirmatn, sans-serif' },
];

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];

const EMOJIS = ['😀', '😊', '👍', '🎓', '📚', '💡', '✅', '⭐', '🔥', '💼', '📞', '🌐', '📝', '🎯'];

interface ProfessorAdRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
  placeholder?: string;
  className?: string;
  maxPlainTextLength?: number;
  limitErrorMessage?: string;
  hasError?: boolean;
  onLimitRejected?: () => void;
}

export function ProfessorAdRichTextEditor({
  value,
  onChange,
  onUploadImage,
  placeholder,
  className,
  maxPlainTextLength,
  limitErrorMessage,
  hasError,
  onLimitRejected,
}: ProfessorAdRichTextEditorProps) {
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const lastAcceptedHtmlRef = React.useRef(value || '');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: { HTMLAttributes: { class: 'rounded-md bg-muted p-3 font-mono text-sm' } },
        blockquote: { HTMLAttributes: { class: 'border-s-4 border-primary/40 ps-4 italic text-muted-foreground' } },
      }),
      Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full rounded-md border object-contain my-2',
        },
      }),
      Table.configure({ resizable: true, HTMLAttributes: { class: 'border-collapse w-full my-3' } }),
      TableRow,
      TableHeader.configure({ HTMLAttributes: { class: 'border bg-muted p-2 font-semibold' } }),
      TableCell.configure({ HTMLAttributes: { class: 'border p-2 align-top' } }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none min-h-[280px] px-4 py-3 focus:outline-none [&_table]:w-full',
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const newLength = getPlainTextLengthFromHtml(html);

      if (maxPlainTextLength != null && maxPlainTextLength > 0 && newLength > maxPlainTextLength) {
        const previousLength = getPlainTextLengthFromHtml(lastAcceptedHtmlRef.current);
        // Allow shortening legacy content that exceeds the plan limit; only block new additions.
        if (newLength > previousLength) {
          ed.commands.setContent(lastAcceptedHtmlRef.current || '', false);
          onLimitRejected?.();
          return;
        }
      }

      lastAcceptedHtmlRef.current = html;
      onChange(html);
    },
  });

  React.useEffect(() => {
    lastAcceptedHtmlRef.current = value || '';
  }, [value]);

  React.useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || '', false);
    }
  }, [editor, value]);

  if (!editor) return null;

  const toolBtn = (active: boolean, onClick: () => void, icon: React.ReactNode, label: string) => (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="icon"
      className="h-8 w-8 shrink-0"
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {icon}
    </Button>
  );

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          'overflow-hidden rounded-xl border bg-background shadow-sm',
          (hasError || limitErrorMessage) && 'border-destructive ring-1 ring-destructive/40',
          className
        )}
      >
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2">
        {toolBtn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), <Bold className="h-4 w-4" />, 'Bold')}
        {toolBtn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), <Italic className="h-4 w-4" />, 'Italic')}
        {toolBtn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), <UnderlineIcon className="h-4 w-4" />, 'Underline')}
        {toolBtn(editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), <Heading1 className="h-4 w-4" />, 'H1')}
        {toolBtn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 className="h-4 w-4" />, 'H2')}
        {toolBtn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), <Heading3 className="h-4 w-4" />, 'H3')}
        <Select onValueChange={(v) => editor.chain().focus().setHeading({ level: Number(v) as 1 | 2 | 3 | 4 | 5 | 6 }).run()}>
          <SelectTrigger className="h-8 w-[72px] text-xs">
            <SelectValue placeholder="H" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6].map((level) => (
              <SelectItem key={level} value={String(level)}>H{level}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {toolBtn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), <List className="h-4 w-4" />, 'Bullet list')}
        {toolBtn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered className="h-4 w-4" />, 'Ordered list')}
        {toolBtn(editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), <Quote className="h-4 w-4" />, 'Quote')}
        {toolBtn(editor.isActive('codeBlock'), () => editor.chain().focus().toggleCodeBlock().run(), <Code className="h-4 w-4" />, 'Code')}
        {toolBtn(editor.isActive({ textAlign: 'left' }), () => editor.chain().focus().setTextAlign('left').run(), <AlignLeft className="h-4 w-4" />, 'Left')}
        {toolBtn(editor.isActive({ textAlign: 'center' }), () => editor.chain().focus().setTextAlign('center').run(), <AlignCenter className="h-4 w-4" />, 'Center')}
        {toolBtn(editor.isActive({ textAlign: 'right' }), () => editor.chain().focus().setTextAlign('right').run(), <AlignRight className="h-4 w-4" />, 'Right')}
        {toolBtn(false, insertTable, <TableIcon className="h-4 w-4" />, 'Table')}
        {toolBtn(false, () => editor.chain().focus().undo().run(), <Undo className="h-4 w-4" />, 'Undo')}
        {toolBtn(false, () => editor.chain().focus().redo().run(), <Redo className="h-4 w-4" />, 'Redo')}

        <Select onValueChange={(v) => editor.chain().focus().setFontFamily(v).run()}>
          <SelectTrigger className="h-8 w-[110px] text-xs">
            <SelectValue placeholder="Font" />
          </SelectTrigger>
          <SelectContent>
            {FONTS.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          onValueChange={(v) => {
            editor.chain().focus().setMark('textStyle', { fontSize: v }).run();
          }}
        >
          <SelectTrigger className="h-8 w-[84px] text-xs">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZES.map((size) => (
              <SelectItem key={size} value={size}>{size}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Emoji">
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex flex-wrap gap-1 max-w-[200px]">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="rounded p-1 text-lg hover:bg-muted"
                  onClick={() => editor.chain().focus().insertContent(emoji).run()}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {onUploadImage && (
          <>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void onUploadImage(file).then((url) => {
                    if (url) editor.chain().focus().setImage({ src: url }).run();
                  });
                }
                e.target.value = '';
              }}
            />
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => imageInputRef.current?.click()}>
              <ImageIcon className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      <EditorContent editor={editor} />
      {!value && placeholder && (
        <p className="pointer-events-none px-4 pb-3 text-sm text-muted-foreground">{placeholder}</p>
      )}
      </div>
      {limitErrorMessage ? (
        <p className="text-sm text-destructive" role="alert">
          {limitErrorMessage}
        </p>
      ) : null}
    </div>
  );
}
