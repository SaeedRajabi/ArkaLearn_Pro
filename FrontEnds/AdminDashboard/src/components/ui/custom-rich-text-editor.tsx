
'use client';

import React from 'react';
import { useEditor, EditorContent, Editor, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Heading from '@tiptap/extension-heading';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { Node } from '@tiptap/core';
import * as LucideIcons from 'lucide-react';
import { CODE_LANGUAGES, lowlight } from '@/lib/lowlight-setup';
import 'highlight.js/styles/github-dark.min.css';


import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Palette,
  Underline as UnderlineIcon,
  Minus,
  Pilcrow,
  Highlighter,
  Indent,
  Outdent,
  Smile,
  Table as TableIcon,
  Trash2,
  Rows3,
  Columns3,
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { useLanguage } from '../language-provider';
import { ImageEditorDialog } from './image-editor-dialog';
import { IconStickerMenu } from './icon-sticker-dialog';

const IconNodeView = ({ node }: { node: any }) => {
  const IconComponent = (LucideIcons as any)[node.attrs.name];

  if (!IconComponent) {
    return <span>?</span>;
  }

  return (
    <span className="react-component-with-content">
      <IconComponent className="inline-block h-5 w-5 mx-0.5" />
    </span>
  );
};

const IconExtension = Node.create({
    name: 'lucideIcon',
    group: 'inline',
    inline: true,
    atom: true,
  
    addAttributes() {
      return {
        name: {
          default: '',
        },
      };
    },
  
    parseHTML() {
      return [{
        tag: 'span[data-lucide-icon]',
        getAttrs: (dom) => {
            const element = dom as HTMLElement;
            return {name: element.getAttribute('data-lucide-icon')};
        },
      }];
    },
  
    renderHTML({ HTMLAttributes }) {
      return ['span', { 'data-lucide-icon': HTMLAttributes.name }];
    },
  
    addNodeView() {
      return ReactNodeViewRenderer(IconNodeView);
    },
  });

const EditorToolbar = ({ editor }: { editor: Editor | null }) => {
  const { t } = useLanguage();
  const [isImageEditorOpen, setIsImageEditorOpen] = React.useState(false);
  const [isIconMenuOpen, setIsIconMenuOpen] = React.useState(false);
  const colorInputRef = React.useRef<HTMLInputElement>(null);

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    editor?.chain().focus().setColor(event.target.value).run();
  };

  const handleColorButtonClick = () => {
    colorInputRef.current?.click();
  };
  
  const handleImageInsert = (attrs: { src: string; style: string; alt?: string }) => {
    if (editor) {
        editor.chain().focus().setImage(attrs).run();
    }
    setIsImageEditorOpen(false);
  };
  
  const handleIconInsert = (iconName: string) => {
    if (editor) {
      editor.chain().focus().insertContent({ type: 'lucideIcon', attrs: { name: iconName } }).run();
    }
  };

  const handleEmojiInsert = (emoji: string) => {
    if (editor) {
        editor.chain().focus().insertContent(emoji).run();
    }
  }

  const applyAlignToAll = (align: 'left' | 'center' | 'right' | 'justify') => {
    editor?.chain().focus().selectAll().setTextAlign(align).run();
  };

  if (!editor) {
    return null;
  }

  const FONT_SIZES = ['12', '14', '16', '18', '20', '22', '24', '28', '32', '36', '40', '48'];
  const FONT_FAMILIES = [
    { name: t('editor_font_system_default'), value: 'Inter, sans-serif' },
    { name: 'Vazir', value: '"wazirmatn", sans-serif' },
    { name: 'Shabnam', value: '"Shabnam", sans-serif' },
    { name: 'Sahel', value: '"Sahel", sans-serif' },
    { name: 'Samim', value: '"Samim", sans-serif' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Times New Roman', value: 'Times New Roman, Times, serif' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
  ];

  return (
    <>
    <div className="flex flex-wrap items-center gap-1 rounded-t-md border-b border-input bg-transparent p-2">
       <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label={t('editor_bold')}
        type="button"
      >
        <Bold className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label={t('editor_italic')}
        type="button"
      >
        <Italic className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive('underline')}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        aria-label={t('editor_underline')}
        type="button"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        aria-label={t('editor_strikethrough')}
        type="button"
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive('highlight')}
        onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
        aria-label={t('editor_highlight')}
        type="button"
      >
        <Highlighter className="h-4 w-4" />
      </Toggle>
      
      <div className="relative">
        <Button type="button" size="sm" variant="ghost" onClick={handleColorButtonClick} aria-label={t('editor_text_color')}>
            <Palette className="h-4 w-4" />
        </Button>
        <input
            ref={colorInputRef}
            type="color"
            onChange={handleColorChange}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
            value={editor.getAttributes('textStyle').color || '#000000'}
        />
      </div>

      <Separator orientation="vertical" className="h-8 mx-1" />

       <Select
        value={FONT_FAMILIES.find(f => editor.isActive('textStyle', { fontFamily: f.value }))?.value}
        onValueChange={(value) => editor.chain().focus().setFontFamily(value).run()}
      >
        <SelectTrigger className="w-[150px] h-9 text-xs">
          <SelectValue placeholder={t('editor_font')} />
        </SelectTrigger>
        <SelectContent>
          {FONT_FAMILIES.map(font => (
            <SelectItem key={font.name} value={font.value} className="text-xs">{font.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={editor.getAttributes('textStyle').fontSize?.replace('px', '') || '16'}
        onValueChange={(value) => editor.chain().focus().setFontSize(`${value}px`).run()}
      >
        <SelectTrigger className="w-[70px] h-9 text-xs">
          <SelectValue placeholder={t('editor_size')} />
        </SelectTrigger>
        <SelectContent>
          {FONT_SIZES.map(size => (
            <SelectItem key={size} value={size} className="text-xs">{size}</SelectItem>
          ))}
        </SelectContent>
      </Select>

       <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" className="h-9 w-32 justify-start text-xs">
            {editor.isActive('heading', { level: 1 }) && <Heading1 className="h-4 w-4 mr-2" />}
            {editor.isActive('heading', { level: 2 }) && <Heading2 className="h-4 w-4 mr-2" />}
            {editor.isActive('heading', { level: 3 }) && <Heading3 className="h-4 w-4 mr-2" />}
            {editor.isActive('heading', { level: 4 }) && <Heading4 className="h-4 w-4 mr-2" />}
            {editor.isActive('heading', { level: 5 }) && <Heading5 className="h-4 w-4 mr-2" />}
            {editor.isActive('heading', { level: 6 }) && <Heading6 className="h-4 w-4 mr-2" />}
            {!editor.isActive('heading') && <Pilcrow className="h-4 w-4 mr-2" />}
            <span>
              {editor.isActive('heading', { level: 1 })
                ? t('editor_heading_1')
                : editor.isActive('heading', { level: 2 })
                ? t('editor_heading_2')
                : editor.isActive('heading', { level: 3 })
                ? t('editor_heading_3')
                : editor.isActive('heading', { level: 4 })
                ? t('editor_heading_4')
                : editor.isActive('heading', { level: 5 })
                ? t('editor_heading_5')
                : editor.isActive('heading', { level: 6 })
                ? t('editor_heading_6')
                : t('editor_paragraph')}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => editor.chain().focus().setParagraph().run()}>
             <Pilcrow className="h-4 w-4 mr-2" /> {t('editor_paragraph')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 className="h-4 w-4 mr-2" /> {t('editor_heading_1')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="h-4 w-4 mr-2" /> {t('editor_heading_2')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 className="h-4 w-4 mr-2" /> {t('editor_heading_3')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>
            <Heading4 className="h-4 w-4 mr-2" /> {t('editor_heading_4')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}>
            <Heading5 className="h-4 w-4 mr-2" /> {t('editor_heading_5')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}>
            <Heading6 className="h-4 w-4 mr-2" /> {t('editor_heading_6')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-8 mx-1" />

       <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'left' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
        aria-label={t('editor_align_left')}
        type="button"
      >
        <AlignLeft className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'center' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
        aria-label={t('editor_align_center')}
        type="button"
      >
        <AlignCenter className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'right' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
        aria-label={t('editor_align_right')}
        type="button"
      >
        <AlignRight className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'justify' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('justify').run()}
        aria-label={t('editor_align_justify')}
        type="button"
      >
        <AlignJustify className="h-4 w-4" />
      </Toggle>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-9 px-2 text-[11px] gap-1"
            aria-label={t('editor_align_all')}
            title={t('editor_align_all_content')}
          >
            <AlignJustify className="h-4 w-4" />
            <span>{t('editor_all')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => applyAlignToAll('left')}>{t('editor_align_all_left')}</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => applyAlignToAll('center')}>{t('editor_align_all_center')}</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => applyAlignToAll('right')}>{t('editor_align_all_right')}</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => applyAlignToAll('justify')}>{t('editor_align_all_justify')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-8 mx-1" />

       <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        aria-label={t('editor_bullet_list')}
        type="button"
      >
        <List className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label={t('editor_ordered_list')}
        type="button"
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
        disabled={!editor.can().sinkListItem('listItem')}
        aria-label="Indent"
        >
        <Indent className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().liftListItem('listItem').run()}
        disabled={!editor.can().liftListItem('listItem')}
        aria-label="Outdent"
        >
        <Outdent className="h-4 w-4" />
      </Button>


      <Separator orientation="vertical" className="h-8 mx-1" />

      <Toggle
        size="sm"
        pressed={editor.isActive('blockquote')}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        aria-label="Blockquote"
        type="button"
      >
        <Quote className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('codeBlock')}
        onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
        aria-label={t('editor_code_block')}
        type="button"
      >
        <Code className="h-4 w-4" />
      </Toggle>
      {editor.isActive('codeBlock') && (
        <Select
          value={editor.getAttributes('codeBlock').language || 'plaintext'}
          onValueChange={(value) => editor.chain().focus().updateAttributes('codeBlock', { language: value }).run()}
        >
          <SelectTrigger className="h-9 w-[130px] text-xs">
            <SelectValue placeholder={t('editor_code_language')} />
          </SelectTrigger>
          <SelectContent>
            {CODE_LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value} className="text-xs">
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant={editor.isActive('table') ? 'secondary' : 'ghost'}
            aria-label={t('editor_table')}
            title={t('editor_table')}
          >
            <TableIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-[min(70vh,420px)] overflow-y-auto">
          <DropdownMenuItem onSelect={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            <TableIcon className="h-4 w-4 mr-2" /> {t('editor_table_insert')}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!editor.can().addRowBefore()} onSelect={() => editor.chain().focus().addRowBefore().run()}>
            <Rows3 className="h-4 w-4 mr-2" /> {t('editor_table_add_row_before')}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!editor.can().addRowAfter()} onSelect={() => editor.chain().focus().addRowAfter().run()}>
            <Rows3 className="h-4 w-4 mr-2" /> {t('editor_table_add_row_after')}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!editor.can().deleteRow()} onSelect={() => editor.chain().focus().deleteRow().run()}>
            <Trash2 className="h-4 w-4 mr-2" /> {t('editor_table_delete_row')}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!editor.can().addColumnBefore()} onSelect={() => editor.chain().focus().addColumnBefore().run()}>
            <Columns3 className="h-4 w-4 mr-2" /> {t('editor_table_add_col_before')}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!editor.can().addColumnAfter()} onSelect={() => editor.chain().focus().addColumnAfter().run()}>
            <Columns3 className="h-4 w-4 mr-2" /> {t('editor_table_add_col_after')}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!editor.can().deleteColumn()} onSelect={() => editor.chain().focus().deleteColumn().run()}>
            <Trash2 className="h-4 w-4 mr-2" /> {t('editor_table_delete_col')}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!editor.can().toggleHeaderRow()} onSelect={() => editor.chain().focus().toggleHeaderRow().run()}>
            {t('editor_table_toggle_header_row')}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!editor.can().toggleHeaderColumn()} onSelect={() => editor.chain().focus().toggleHeaderColumn().run()}>
            {t('editor_table_toggle_header_col')}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!editor.can().deleteTable()} onSelect={() => editor.chain().focus().deleteTable().run()}>
            <Trash2 className="h-4 w-4 mr-2" /> {t('editor_table_delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button type="button" size="sm" variant="ghost" onClick={() => setIsImageEditorOpen(true)} aria-label="Insert Image">
        <ImageIcon className="h-4 w-4" />
      </Button>
      <DropdownMenu open={isIconMenuOpen} onOpenChange={setIsIconMenuOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button type="button" size="sm" variant="ghost" aria-label="Insert Icon">
            <Smile className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="bottom" sideOffset={6} className="p-2">
          <IconStickerMenu
            onIconSelectAction={(iconName) => {
              handleIconInsert(iconName);
              setIsIconMenuOpen(false);
            }}
            onEmojiSelectAction={(emoji) => {
              handleEmojiInsert(emoji);
              setIsIconMenuOpen(false);
            }}
          />
        </DropdownMenuContent>
      </DropdownMenu>
       <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().setHorizontalRule().run()} aria-label="Horizontal Rule">
        <Minus className="h-4 w-4" />
      </Button>


      <Separator orientation="vertical" className="h-8 mx-1" />

      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        aria-label="Undo"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        aria-label="Redo"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
    <ImageEditorDialog 
        open={isImageEditorOpen} 
        onOpenChangeAction={setIsImageEditorOpen}
        onInsertAction={handleImageInsert}
    />
    </>
  );
};

interface CustomRichTextEditorProps {
  content: string;
  onChangeAction: (html: string) => void;
  placeholder?: string;
  /** When true, editor grows with content and relies on parent scroll (e.g. inside modals). */
  expandVertically?: boolean;
}

// Add fontSize to the TextStyle attributes
const ExtendedTextStyle = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize,
        renderHTML: (attributes) => {
          if (!attributes['fontSize']) {
            return {};
          }
          return { style: `font-size: ${attributes['fontSize']}` };
        },
      },
    };
  },
});

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        fontSize: {
            setFontSize: (size: string) => ReturnType;
            unsetFontSize: () => ReturnType;
        }
    }
}

const editorExtensions = [
  StarterKit.configure({
    heading: false,
    horizontalRule: false,
    codeBlock: false,
  }),
  CodeBlockLowlight.configure({
    lowlight,
    defaultLanguage: 'plaintext',
  }),
  Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
  Underline,
  FontFamily,
  ExtendedTextStyle.extend({
    addCommands() {
        return {
            ...this.parent?.(),
            setFontSize: (fontSize) => ({ chain }) => {
                return chain().setMark('textStyle', { fontSize }).run();
            },
            unsetFontSize: () => ({ chain }) => {
                return chain().unsetMark('textStyle').run();
            },
        };
    },
  }),
  Color,
  Highlight.configure({ multicolor: true }),
  TextAlign.configure({
    types: ['heading', 'paragraph', 'listItem', 'blockquote', 'codeBlock', 'tableCell'],
  }),
  Table.configure({
    resizable: true,
    HTMLAttributes: { class: 'rich-editor-table' },
  }),
  TableRow,
  TableHeader.configure({ HTMLAttributes: { class: 'rich-editor-table-header' } }),
  TableCell.configure({ HTMLAttributes: { class: 'rich-editor-table-cell' } }),
  HorizontalRule.extend({
    addInputRules() {
        return [];
    }
  }),
  Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        style: {
          default: null,
          renderHTML: (attributes) => {
            if (!attributes.style) {
              return {};
            }
            return {
              style: attributes.style,
            };
          },
        },
      };
    },
  }).configure({
    allowBase64: true,
    HTMLAttributes: {
      class: 'tiptap-image-resize',
    },
  }),
  IconExtension,
];

const EDITOR_CONTENT_CLASS =
  'prose dark:prose-invert prose-sm sm:prose-base min-h-[150px] w-full max-w-full rounded-b-md border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50';

export function CustomRichTextEditor({
  content,
  onChangeAction,
  placeholder,
  expandVertically = false,
}: CustomRichTextEditorProps) {
  const { direction } = useLanguage();
  const editorContentClass = expandVertically
    ? EDITOR_CONTENT_CLASS
    : `${EDITOR_CONTENT_CLASS} max-h-[35vh] overflow-y-auto`;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions,
    content: content,
    onUpdate({ editor }) {
      onChangeAction(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: editorContentClass,
        dir: direction,
      },
    },
  });

  React.useEffect(() => {
    if (editor) {
      const attrs = editor.options.editorProps.attributes;
      let classStr = '';
      if (typeof attrs === 'function') {
        const out = attrs(editor.state);
        classStr =
          out && typeof out === 'object' && 'class' in out && typeof (out as { class?: string }).class === 'string'
            ? (out as { class: string }).class
            : '';
      } else if (attrs && typeof attrs === 'object' && 'class' in attrs) {
        classStr = String((attrs as { class?: string }).class ?? '');
      }
      editor.setOptions({
        editorProps: {
          attributes: {
            class: classStr,
            dir: direction,
          },
        },
      });
    }
  }, [direction, editor]);

  React.useEffect(() => {
    if (editor && content != null) {
      const current = editor.getHTML();
      if (current !== content) {
        editor.commands.setContent(content, false);
      }
    }
  }, [content, editor]);

  return (
    <div className="flex flex-col justify-stretch border rounded-md relative">
      <EditorToolbar editor={editor} />
      <div className="relative">
        <EditorContent editor={editor} />
        {editor && editor.isEmpty && (
          <div className="absolute top-2 left-3 right-3 text-muted-foreground text-sm pointer-events-none text-start">
            {placeholder}
          </div>
        )}
      </div>
      <style jsx global>{`
        .prose {
            max-width: none;
        }
        .prose h1 {
            font-size: 2em;
            font-weight: bold;
        }
        .prose h2 {
            font-size: 1.5em;
            font-weight: bold;
        }
        .prose h3 {
            font-size: 1.25em;
            font-weight: bold;
        }
        .prose h4 {
            font-size: 1em;
            font-weight: bold;
        }
        .prose h5 {
            font-size: 0.875em;
            font-weight: bold;
        }
        .prose h6 {
            font-size: 0.85em;
            font-weight: bold;
        }
        .prose :where(img) {
          margin-top: 1rem;
          margin-bottom: 1rem;
        }
        .tiptap-image-resize {
          max-width: 100%;
          height: auto;
          cursor: move;
        }
        .prose :where(blockquote) {
          border-left-color: hsl(var(--primary));
          margin-left: 1em;
          padding-left: 1em;
        }
        .prose[dir=rtl] :where(blockquote) {
          border-left-color: transparent;
          border-right-color: hsl(var(--primary));
          margin-left: 0;
          margin-right: 1em;
          padding-left: 0;
          padding-right: 1em;
        }
        .prose :where(pre) {
          background: #0d1117;
          color: #e6edf3;
          border-radius: var(--radius);
          padding: 0.75rem 1rem;
          overflow-x: auto;
          border: 1px solid hsl(var(--border));
        }
        .prose :where(pre code) {
          background: transparent;
          color: inherit;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.875rem;
          line-height: 1.6;
        }
        .prose table.rich-editor-table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          table-layout: fixed;
        }
        .prose table.rich-editor-table th,
        .prose table.rich-editor-table td {
          border: 1px solid hsl(var(--border));
          padding: 0.5rem 0.75rem;
          vertical-align: top;
          min-width: 80px;
        }
        .prose table.rich-editor-table th {
          background: hsl(var(--muted));
          font-weight: 600;
        }
        .prose table.rich-editor-table .selectedCell {
          background: hsl(var(--accent) / 0.35);
        }
        .prose table.rich-editor-table .column-resize-handle {
          background-color: hsl(var(--primary));
          bottom: -2px;
          pointer-events: none;
          position: absolute;
          right: -2px;
          top: 0;
          width: 4px;
        }
        .ProseMirror-selectednode {
          outline: 3px solid hsl(var(--primary));
        }
        .prose p {
            margin: 0;
        }
        .prose ul, .prose ol {
            padding: 0 1rem;
        }
        .prose[dir="ltr"] ul, .prose[dir="ltr"] ol {
            padding-left: 1.5rem;
        }
        .prose[dir="rtl"] ul, .prose[dir="rtl"] ol {
            padding-right: 1.5rem;
        }
        .prose ul {
            list-style-type: disc;
        }
        .prose ol {
            list-style-type: decimal;
        }
      `}</style>
    </div>
  );
}
