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
  Mic,
  Square,
  Upload,
  Palette,
  Code,
  ClipboardPaste,
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
import { lowlight } from '@/lib/lowlight-setup';
import { ExamFontSize, ExamPasteMark } from './exam-editor-extensions';

interface ExamAnswerEditorProps {
  value: string;
  onChange: (html: string) => void;
  /** When false (copy restricted), every paste is wrapped in the paste mark and reported. */
  trackPaste: boolean;
  onPasteDetected?: (pastedLength: number) => void;
  onUploadImage?: (file: File) => Promise<string>;
  onUploadAudio?: (file: File) => Promise<string>;
  placeholder?: string;
  className?: string;
  editorMinHeight?: string;
  editorMaxHeight?: string;
  labels?: Partial<{
    bold: string;
    italic: string;
    underline: string;
    bulletList: string;
    orderedList: string;
    code: string;
    alignLeft: string;
    alignCenter: string;
    alignRight: string;
    font: string;
    fontSize: string;
    color: string;
    image: string;
    audio: string;
    record: string;
    paste: string;
  }>;
}

const FONTS = [
  { label: 'Default', value: 'inherit' },
  { label: 'Tahoma', value: 'Tahoma, sans-serif' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Mono', value: 'ui-monospace, monospace' },
];

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '32px'];

export function ExamAnswerEditor({
  value,
  onChange,
  trackPaste,
  onPasteDetected,
  onUploadImage,
  onUploadAudio,
  placeholder,
  className,
  editorMinHeight = '220px',
  editorMaxHeight = '420px',
  labels = {},
}: ExamAnswerEditorProps) {
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const audioInputRef = React.useRef<HTMLInputElement>(null);
  const colorInputRef = React.useRef<HTMLInputElement>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const editorRef = React.useRef<ReturnType<typeof useEditor>>(null);
  const [recording, setRecording] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  // Props read inside editorProps callbacks would be stale otherwise.
  const trackPasteRef = React.useRef(trackPaste);
  trackPasteRef.current = trackPaste;
  const onPasteDetectedRef = React.useRef(onPasteDetected);
  onPasteDetectedRef.current = onPasteDetected;

  const insertAudio = (url: string) => {
    if (!editorRef.current || !url) return;
    editorRef.current
      .chain()
      .focus()
      .insertContent({ type: 'qaAudio', attrs: { src: url } })
      .run();
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
    if (!onUploadAudio) return;
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
        const file = new File([blob], `exam-answer-${Date.now()}.webm`, { type: 'audio/webm' });
        await handleAudioFile(file);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setRecording(false);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'plaintext',
        HTMLAttributes: { class: 'rich-code-block' },
      }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      ExamFontSize,
      ExamPasteMark,
      TextAlign.configure({ types: ['paragraph'] }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'qa-content-image max-w-[400px] max-h-[400px] object-contain rounded-md border',
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
        // Pasted images still flow through the normal upload path.
        const items = event.clipboardData?.items;
        if (items && onUploadImage) {
          for (const item of items) {
            if (!item.type.startsWith('image/')) continue;
            const file = item.getAsFile();
            if (!file) continue;
            event.preventDefault();
            void onUploadImage(file).then((url) => {
              if (url && editorRef.current) {
                editorRef.current.chain().focus().setImage({ src: url }).run();
              }
            });
            return true;
          }
        }

        if (!trackPasteRef.current) return false;

        const text = event.clipboardData?.getData('text/plain');
        if (!text || !text.trim()) return false;
        event.preventDefault();

        const lines = text.replace(/\r\n/g, '\n').split('\n');
        const content = lines.map((line) => ({
          type: 'paragraph',
          content: line
            ? [{ type: 'text', text: line, marks: [{ type: 'examPasteMark' }] }]
            : undefined,
        }));
        editorRef.current?.chain().focus().insertContent(content).run();
        onPasteDetectedRef.current?.(text.length);
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

  React.useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  if (!editor) return null;

  const L = {
    bold: labels.bold ?? 'Bold',
    italic: labels.italic ?? 'Italic',
    underline: labels.underline ?? 'Underline',
    bulletList: labels.bulletList ?? 'Bullet list',
    orderedList: labels.orderedList ?? 'Ordered list',
    code: labels.code ?? 'Code',
    alignLeft: labels.alignLeft ?? 'Align left',
    alignCenter: labels.alignCenter ?? 'Align center',
    alignRight: labels.alignRight ?? 'Align right',
    font: labels.font ?? 'Font',
    fontSize: labels.fontSize ?? 'Size',
    color: labels.color ?? 'Text color',
    image: labels.image ?? 'Image',
    audio: labels.audio ?? 'Audio file',
    record: labels.record ?? 'Record audio',
    paste: labels.paste ?? 'Paste',
  };

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

  return (
    <div className={cn('rounded-xl border bg-background shadow-sm overflow-hidden', className)}>
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2">
        {toolBtn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), <Bold className="h-4 w-4" />, L.bold)}
        {toolBtn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), <Italic className="h-4 w-4" />, L.italic)}
        {toolBtn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), <UnderlineIcon className="h-4 w-4" />, L.underline)}
        {toolBtn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), <List className="h-4 w-4" />, L.bulletList)}
        {toolBtn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered className="h-4 w-4" />, L.orderedList)}
        {toolBtn(editor.isActive('codeBlock'), () => editor.chain().focus().toggleCodeBlock().run(), <Code className="h-4 w-4" />, L.code)}
        {toolBtn(editor.isActive({ textAlign: 'left' }), () => editor.chain().focus().setTextAlign('left').run(), <AlignLeft className="h-4 w-4" />, L.alignLeft)}
        {toolBtn(editor.isActive({ textAlign: 'center' }), () => editor.chain().focus().setTextAlign('center').run(), <AlignCenter className="h-4 w-4" />, L.alignCenter)}
        {toolBtn(editor.isActive({ textAlign: 'right' }), () => editor.chain().focus().setTextAlign('right').run(), <AlignRight className="h-4 w-4" />, L.alignRight)}

        <Select
          onValueChange={(v) =>
            v === 'inherit'
              ? editor.chain().focus().unsetFontFamily().run()
              : editor.chain().focus().setFontFamily(v).run()
          }
        >
          <SelectTrigger className="h-8 w-[110px] shrink-0 text-xs">
            <SelectValue placeholder={L.font} />
          </SelectTrigger>
          <SelectContent>
            {FONTS.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          onValueChange={(v) =>
            v === 'default'
              ? editor.chain().focus().unsetFontSize().run()
              : editor.chain().focus().setFontSize(v).run()
          }
        >
          <SelectTrigger className="h-8 w-[86px] shrink-0 text-xs">
            <SelectValue placeholder={L.fontSize} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            {FONT_SIZES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace('px', '')}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label={L.color}
            title={L.color}
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
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={uploading}
              onClick={() => imageInputRef.current?.click()}
              aria-label={L.image}
              title={L.image}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </>
        )}

        {onUploadAudio && (
          <>
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleAudioFile(file);
                e.target.value = '';
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={uploading}
              onClick={() => audioInputRef.current?.click()}
              aria-label={L.audio}
              title={L.audio}
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={recording ? 'destructive' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              disabled={uploading}
              onClick={() => void toggleRecord()}
              aria-label={L.record}
              title={L.record}
            >
              {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </>
        )}

        {!trackPaste && (
          <span
            className="ms-auto flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400"
            title={L.paste}
          >
            <ClipboardPaste className="h-3 w-3" />
            {L.paste}
          </span>
        )}
      </div>
      <div
        className="relative overflow-y-auto overscroll-contain"
        style={{ minHeight: editorMinHeight, maxHeight: editorMaxHeight }}
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
