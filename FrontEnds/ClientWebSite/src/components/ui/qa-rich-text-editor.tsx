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
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
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
  Mic,
  Square,
  Upload,
  Palette,
  Film,
  Code,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { QaAudio } from '@/components/ui/qa-audio-extension';
import { normalizeQaMediaInHtml } from '@/lib/qa-content-html';
import { resolveQaMediaUrl } from '@/lib/qa-content-html';
import { lowlight } from '@/lib/lowlight-setup';

interface QaRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
  onUploadAudio?: (file: File) => Promise<string>;
  onUploadVideo?: (file: File) => Promise<string>;
  placeholder?: string;
  className?: string;
  editorMinHeight?: string;
  /** @deprecated Use editorMinHeight */
  minHeight?: string | number;
  editorMaxHeight?: string;
  /** @deprecated Use editorMaxHeight */
  maxHeight?: string | number;
  colorPickerLabel?: string;
}

const FONTS = [
  { label: 'Default', value: 'inherit' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Mono', value: 'ui-monospace, monospace' },
  { label: 'Tahoma', value: 'Tahoma, sans-serif' },
];

export function QaRichTextEditor({
  value,
  onChange,
  onUploadImage,
  onUploadAudio,
  onUploadVideo,
  placeholder,
  className,
  editorMinHeight = '180px',
  minHeight,
  editorMaxHeight = '220px',
  maxHeight,
  colorPickerLabel = 'Text color',
}: QaRichTextEditorProps) {
  const resolvedMinHeight =
    typeof minHeight === 'number' ? `${minHeight}px` : minHeight ?? editorMinHeight;
  const resolvedMaxHeight =
    typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight ?? editorMaxHeight;
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const audioInputRef = React.useRef<HTMLInputElement>(null);
  const videoInputRef = React.useRef<HTMLInputElement>(null);
  const colorInputRef = React.useRef<HTMLInputElement>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const editorRef = React.useRef<ReturnType<typeof useEditor>>(null);
  const [recording, setRecording] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'plaintext',
        HTMLAttributes: { class: 'rich-code-block' },
      }),
      Heading.configure({ levels: [2, 3, 4] }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'qa-content-image max-w-[400px] max-h-[400px] object-contain rounded-md border cursor-zoom-in',
        },
      }),
      QaAudio,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none px-3 py-2 focus:outline-none',
        dir: 'auto',
        spellcheck: 'true',
      },
      handleKeyDown: (view, event) => {
        if (event.key !== ' ' || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) {
          return false;
        }
        if (view.state.selection.$from.parent.type.name === 'codeBlock') {
          return false;
        }
        view.dispatch(view.state.tr.insertText(' '));
        event.preventDefault();
        return true;
      },
      handlePaste: (_view, event) => {
        if (!onUploadImage) return false;
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of items) {
          if (!item.type.startsWith('image/')) continue;
          const file = item.getAsFile();
          if (!file) continue;
          event.preventDefault();
          void onUploadImage(file).then((url) => {
            if (url && editorRef.current) editorRef.current.chain().focus().setImage({ src: url }).run();
          });
          return true;
        }
        return false;
      },
      handleDrop: (_view, event) => {
        event.preventDefault();
        const files = Array.from(event.dataTransfer?.files ?? []);
        if (!files.length) return true;
        void (async () => {
          for (const file of files) {
            if (file.type.startsWith('image/') && onUploadImage) {
              const url = await onUploadImage(file);
              if (url) editorRef.current?.chain().focus().setImage({ src: url }).run();
            } else if (file.type.startsWith('video/') && onUploadVideo) {
              const url = await onUploadVideo(file);
              if (url) {
                const resolved = url.startsWith('http')
                  ? url
                  : resolveQaMediaUrl(url);
                editorRef.current?.chain().focus().insertContent(
                  `<video controls class="qa-content-video max-w-full rounded-md" src="${resolved}"></video>`
                ).run();
              }
            } else if (file.type.startsWith('audio/') && onUploadAudio) {
              const url = await onUploadAudio(file);
              if (url) insertAudio(url);
            }
          }
        })();
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    onCreate: ({ editor: ed }) => {
      editorRef.current = ed;
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    const normalized = normalizeQaMediaInHtml(value || '', (u) => u);
    if (editor.getHTML() !== normalized) editor.commands.setContent(normalized, false);
  }, [editor, value]);

  const insertAudio = (url: string) => {
    if (!editor || !url) return;
    const resolved = url.startsWith('http')
      ? url
      : resolveQaMediaUrl(url);
    editor.chain().focus().insertContent({ type: 'qaAudio', attrs: { src: resolved } }).run();
  };

  const handleAudioFile = async (file: File) => {
    if (!onUploadAudio) return;
    setUploading(true);
    try {
      const url = await onUploadAudio(file);
      insertAudio(url);
    } finally {
      setUploading(false);
    }
  };

  const toggleRecord = async () => {
    if (!onUploadAudio || !editor) return;
    if (recording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        await handleAudioFile(file);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setRecording(false);
    }
  };

  if (!editor) return null;

  const toolBtn = (active: boolean, onClick: () => void, icon: React.ReactNode, label: string) => (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="icon"
      className="h-8 w-8 shrink-0"
      onClick={onClick}
      aria-label={label}
    >
      {icon}
    </Button>
  );

  return (
    <div className={cn('rounded-xl border bg-background shadow-sm overflow-hidden', className)}>
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2">
        {toolBtn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), <Bold className="h-4 w-4" />, 'Bold')}
        {toolBtn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), <Italic className="h-4 w-4" />, 'Italic')}
        {toolBtn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), <UnderlineIcon className="h-4 w-4" />, 'Underline')}
        {toolBtn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 className="h-4 w-4" />, 'Heading')}
        {toolBtn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), <List className="h-4 w-4" />, 'List')}
        {toolBtn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered className="h-4 w-4" />, 'Ordered')}
        {toolBtn(editor.isActive('codeBlock'), () => editor.chain().focus().toggleCodeBlock().run(), <Code className="h-4 w-4" />, 'Code')}
        {toolBtn(editor.isActive({ textAlign: 'left' }), () => editor.chain().focus().setTextAlign('left').run(), <AlignLeft className="h-4 w-4" />, 'Left')}
        {toolBtn(editor.isActive({ textAlign: 'center' }), () => editor.chain().focus().setTextAlign('center').run(), <AlignCenter className="h-4 w-4" />, 'Center')}
        {toolBtn(editor.isActive({ textAlign: 'right' }), () => editor.chain().focus().setTextAlign('right').run(), <AlignRight className="h-4 w-4" />, 'Right')}

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

        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label={colorPickerLabel}
            onClick={() => colorInputRef.current?.click()}
          >
            <Palette className="h-4 w-4" />
          </Button>
          <input
            ref={colorInputRef}
            type="color"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
            value={editor.getAttributes('textStyle').color || '#111827'}
            onChange={(event) => editor.chain().focus().setColor(event.target.value).run()}
          />
        </div>

        {onUploadImage && (
          <>
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onUploadImage(file).then((url) => {
                if (url) editor.chain().focus().setImage({ src: url }).run();
              });
              e.target.value = '';
            }} />
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => imageInputRef.current?.click()}>
              <ImageIcon className="h-4 w-4" />
            </Button>
          </>
        )}

        {onUploadVideo && (
          <>
            <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                void onUploadVideo(file).then((url) => {
                  if (!url || !editor) return;
                  const resolved = url.startsWith('http')
                    ? url
                    : resolveQaMediaUrl(url);
                  editor.chain().focus().insertContent(
                    `<video controls class="qa-content-video max-w-full rounded-md" src="${resolved}"></video>`
                  ).run();
                });
              }
              e.target.value = '';
            }} />
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => videoInputRef.current?.click()}>
              <Film className="h-4 w-4" />
            </Button>
          </>
        )}

        {onUploadAudio && (
          <>
            <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleAudioFile(file);
              e.target.value = '';
            }} />
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={uploading} onClick={() => audioInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={recording ? 'destructive' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              disabled={uploading}
              onClick={() => void toggleRecord()}
            >
              {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </>
        )}
      </div>
      <div
        className="qa-rich-text-editor-body relative overflow-y-auto overscroll-contain"
        style={{ minHeight: resolvedMinHeight, maxHeight: resolvedMaxHeight }}
      >
        {!value && placeholder ? (
          <p className="pointer-events-none absolute start-3 top-2 z-0 text-sm text-muted-foreground">
            {placeholder}
          </p>
        ) : null}
        <EditorContent editor={editor} className="relative z-[1] [&_.ProseMirror]:outline-none" />
      </div>
    </div>
  );
}
