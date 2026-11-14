import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import type { GenerateMeetingSummaryOutput } from '@/ai/flows/summary-schemas';

export const generateWordDocument = (data: GenerateMeetingSummaryOutput) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: 'ArkaSoftware Seminar',
              bold: true,
              size: 28,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
            children: [
              new TextRun({
                text: 'Meeting Summary',
                bold: true,
                size: 40,
                color: '3498DB', // Primary color
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
        }),

        // Summary Section
        new Paragraph({
          text: 'Summary',
          heading: HeadingLevel.HEADING_1,
          style: 'document-heading',
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          text: data.summary,
          style: 'document-body',
        }),

        // Important Topics Section
        new Paragraph({
          text: 'Important Topics',
          heading: HeadingLevel.HEADING_1,
          style: 'document-heading',
          spacing: { before: 400, after: 200 },
        }),
        ...data.importantTopics.map(topic => new Paragraph({
          text: topic,
          bullet: { level: 0 },
          style: 'document-body',
        })),

        // Key Decisions Section
        new Paragraph({
          text: 'Key Decisions',
          heading: HeadingLevel.HEADING_1,
          style: 'document-heading',
          spacing: { before: 400, after: 200 },
        }),
        ...data.keyDecisions.map(decision => new Paragraph({
          text: decision,
          bullet: { level: 0 },
          style: 'document-body',
        })),

        // Overall Tone Section
        new Paragraph({
          text: 'Overall Tone',
          heading: HeadingLevel.HEADING_1,
          style: 'document-heading',
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: data.overallTone,
              bold: true,
            }),
          ],
          style: 'document-body',
        }),
      ],
    }],
    styles: {
      paragraphStyles: [
        {
          id: 'document-heading',
          name: 'Document Heading',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            size: 28,
            bold: true,
            color: 'E67E22', // Accent color
            font: 'Poppins',
          },
          paragraph: {
            spacing: { before: 240, after: 120 },
          },
        },
        {
          id: 'document-body',
          name: 'Document Body',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            size: 24,
            font: 'PT Sans',
          },
          paragraph: {
            spacing: { after: 120 },
          },
        },
      ],
    },
  });

  Packer.toBlob(doc).then(blob => {
    saveAs(blob, 'meeting-summary.docx');
  });
};
