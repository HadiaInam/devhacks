import {
    Document, Packer, Paragraph, TextRun,
    HeadingLevel, AlignmentType, BorderStyle, LevelFormat
} from 'docx';

interface ReportData {
    patientComplaint?: string;
    historyOfPresentIllness?: string;
    symptomAnalysis?: string;
    aggravatingFactors?: string;
    relievingFactors?: string;
    pastMedicalHistory?: string;
    currentMedications?: string;
    systemsReview?: string;
    functionalImpact?: string;
    urgencyAssessment?: string;
    summary?: string;
    questionsForDoctor?: string[];
}

const COLORS = {
    primary: '1F3864',
    accent: '2E75B6',
    muted: '666666',
    disclaimer: '999999',
};

function divider() {
    return new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.accent, space: 1 } },
        children: [],
    });
}

function sectionHeading(text: string) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 160 },
        children: [new TextRun({ text, bold: true, color: COLORS.accent })],
    });
}

function bodyText(text: string) {
    return new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: text || 'Not specified' })],
    });
}

function labeledField(label: string, value: string) {
    return new Paragraph({
        spacing: { after: 120 },
        children: [
            new TextRun({ text: `${label}: `, bold: true }),
            new TextRun({ text: value || 'Not specified' }),
        ],
    });
}

export async function generateReportDocx(report: ReportData): Promise<Blob> {
    const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const sections = [
        { title: 'Chief Complaint', content: report.patientComplaint },
        { title: 'History of Present Illness', content: report.historyOfPresentIllness },
        { title: 'Symptom Analysis', content: report.symptomAnalysis },
        { title: 'Past Medical History', content: report.pastMedicalHistory },
        { title: 'Current Medications', content: report.currentMedications },
        { title: 'Review of Systems', content: report.systemsReview },
        { title: 'Functional Impact', content: report.functionalImpact },
        { title: 'Urgency Assessment', content: report.urgencyAssessment },
        { title: 'Clinical Summary', content: report.summary },
    ];

    const doc = new Document({
        styles: {
            default: {
                document: { run: { font: 'Arial', size: 24 } }
            },
            paragraphStyles: [
                {
                    id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                    run: { size: 36, bold: true, font: 'Arial', color: COLORS.primary },
                    paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 },
                },
                {
                    id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                    run: { size: 28, bold: true, font: 'Arial', color: COLORS.accent },
                    paragraph: { spacing: { before: 200, after: 160 }, outlineLevel: 1 },
                },
            ],
        },
        numbering: {
            config: [{
                reference: 'numbered-list',
                levels: [{
                    level: 0,
                    format: LevelFormat.DECIMAL,
                    text: '%1.',
                    alignment: AlignmentType.LEFT,
                    style: { paragraph: { indent: { left: 720, hanging: 360 } } },
                }],
            }],
        },
        sections: [{
            properties: {
                page: {
                    size: { width: 12240, height: 15840 },
                    margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
                },
            },
            children: [
                // Header
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: 'PATIENT MEDICAL REPORT', bold: true, size: 40, color: COLORS.primary })],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                    children: [new TextRun({ text: `Date: ${date}`, size: 22, color: COLORS.muted })],
                }),
                divider(),

                // Main sections
                ...sections.flatMap(({ title, content }) => [
                    sectionHeading(title),
                    bodyText(content || ''),
                    divider(),
                ]),

                // Modifying factors
                sectionHeading('Modifying Factors'),
                labeledField('Aggravating Factors', report.aggravatingFactors || ''),
                labeledField('Relieving Factors', report.relievingFactors || ''),
                divider(),

                // Questions for doctor
                sectionHeading('Questions for Doctor'),
                ...(report.questionsForDoctor || []).map((q) =>
                    new Paragraph({
                        numbering: { reference: 'numbered-list', level: 0 },
                        children: [new TextRun(q)],
                    })
                ),

                // Disclaimer
                new Paragraph({ spacing: { before: 400 }, children: [] }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({
                        text: 'This report was generated by an AI assistant and is intended to support — not replace — professional medical advice.',
                        size: 18,
                        color: COLORS.disclaimer,
                        italics: true,
                    })],
                }),
            ],
        }],
    });

    const buffer = await Packer.toBuffer(doc);
    return new Blob([new Uint8Array(buffer)], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
}