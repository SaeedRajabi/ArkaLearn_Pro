'use client';

import { Extension, Mark, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    examFontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

/** Font-size support on top of TextStyle (e.g. "14px"). */
export const ExamFontSize = Extension.create({
  name: 'examFontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null as string | null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${String(attributes.fontSize)}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: null }).run(),
    };
  },
});

/**
 * Marks content the student pasted into an exam answer. Stored in the answer HTML
 * as <span data-pasted="true"> so the teacher sees copied parts highlighted.
 */
export const ExamPasteMark = Mark.create({
  name: 'examPasteMark',
  keepOnSplit: false,
  inclusive: false,
  parseHTML() {
    return [{ tag: 'span[data-pasted]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-pasted': 'true' }), 0];
  },
});
