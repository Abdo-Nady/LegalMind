import { jsPDF } from "jspdf";
import { containsArabic, processArabicText } from "./fonts/arabic-text-helper";

// Export type constants
export const EXPORT_TYPES = {
  INSIGHTS: 'insights',
  SUMMARY: 'summary',
  ANALYSIS_REPORT: 'analysis-report',
  REFERENCE_DOC: 'reference-doc',
  BILINGUAL_SUMMARY: 'bilingual-summary',
  COMPLIANCE_REPORT: 'compliance-report',
};

// Colors used in PDF
const COLORS = {
  primary: [21, 42, 67],      // Deep navy
  accent: [20, 160, 133],     // Teal
  text: [51, 51, 51],         // Dark gray
  muted: [120, 120, 120],     // Medium gray
  gold: [186, 155, 94],       // Gold accent
  success: [34, 139, 34],     // Green
  warning: [255, 165, 0],     // Orange
  danger: [220, 53, 69],      // Red
  white: [255, 255, 255],
};

/**
 * Converts markdown text to formatted PDF content
 * Handles headers, lists, bold, italic, etc.
 */
function parseMarkdownForPDF(text) {
  const lines = text.split('\n');
  const elements = [];
  let inList = false;
  let listType = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Skip empty lines but add spacing
    if (!line.trim()) {
      if (elements.length > 0) {
        elements.push({ type: 'spacing', size: 4 });
      }
      inList = false;
      continue;
    }

    // Horizontal rule / section divider
    if (line.match(/^---+$/)) {
      elements.push({ type: 'divider' });
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push({ type: 'h3', text: line.slice(4) });
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push({ type: 'h2', text: line.slice(3) });
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push({ type: 'h1', text: line.slice(2) });
      continue;
    }

    // Bold headers (like **Header:**)
    if (line.match(/^\*\*[^*]+\*\*:?\s*$/)) {
      const headerText = line.replace(/\*\*/g, '').replace(/:$/, '');
      elements.push({ type: 'h3', text: headerText });
      continue;
    }

    // Numbered lists
    if (line.match(/^\d+\.\s/)) {
      const content = line.replace(/^\d+\.\s/, '');
      elements.push({ type: 'numbered-list', text: parseInlineFormatting(content), number: line.match(/^(\d+)/)[1] });
      inList = true;
      listType = 'numbered';
      continue;
    }

    // Bullet lists
    if (line.match(/^[-*]\s/)) {
      const content = line.replace(/^[-*]\s/, '');
      elements.push({ type: 'bullet-list', text: parseInlineFormatting(content) });
      inList = true;
      listType = 'bullet';
      continue;
    }

    // Indented list items (sub-items)
    if (line.match(/^\s+[-*]\s/) || line.match(/^\s+\d+\.\s/)) {
      const content = line.replace(/^\s+[-*]\s/, '').replace(/^\s+\d+\.\s/, '');
      elements.push({ type: 'sub-list', text: parseInlineFormatting(content) });
      continue;
    }

    // Table rows (simple markdown tables)
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
      // Skip separator rows
      if (!cells.every(c => c.match(/^[-:]+$/))) {
        elements.push({ type: 'table-row', cells });
      }
      continue;
    }

    // Regular paragraph
    elements.push({ type: 'paragraph', text: parseInlineFormatting(line) });
    inList = false;
  }

  return elements;
}

/**
 * Parse inline formatting (bold, italic) and return segments
 */
function parseInlineFormatting(text) {
  const segments = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Bold text
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    if (boldMatch && remaining.indexOf(boldMatch[0]) === 0) {
      segments.push({ text: boldMatch[1], bold: true });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic text
    const italicMatch = remaining.match(/\*([^*]+)\*/);
    if (italicMatch && remaining.indexOf(italicMatch[0]) === 0) {
      segments.push({ text: italicMatch[1], italic: true });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Find next formatting
    const nextBold = remaining.indexOf('**');
    const nextItalic = remaining.search(/(?<!\*)\*(?!\*)/);

    let nextFormat = remaining.length;
    if (nextBold !== -1) nextFormat = Math.min(nextFormat, nextBold);
    if (nextItalic !== -1) nextFormat = Math.min(nextFormat, nextItalic);

    if (nextFormat > 0) {
      segments.push({ text: remaining.slice(0, nextFormat), bold: false, italic: false });
      remaining = remaining.slice(nextFormat);
    } else {
      segments.push({ text: remaining, bold: false, italic: false });
      break;
    }
  }

  return segments;
}

/**
 * Get status badge color based on compliance status
 */
function getStatusColor(status) {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('compliant') && !statusLower.includes('non')) {
    return COLORS.success;
  } else if (statusLower.includes('non-compliant') || statusLower.includes('non_compliant')) {
    return COLORS.danger;
  } else if (statusLower.includes('review') || statusLower.includes('needed')) {
    return COLORS.warning;
  }
  return COLORS.muted;
}

/**
 * Get risk level color
 */
function getRiskColor(risk) {
  const riskLower = risk.toLowerCase();
  if (riskLower.includes('high')) return COLORS.danger;
  if (riskLower.includes('medium')) return COLORS.warning;
  if (riskLower.includes('low')) return COLORS.success;
  return COLORS.muted;
}

/**
 * Create PDF header with branding
 */
function createHeader(doc, pageWidth, margin, type, lawType = null) {
  // Header background
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Logo/Brand area
  doc.setFillColor(...COLORS.gold);
  doc.circle(margin + 8, 20, 8, 'F');

  // Brand text
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('DocuMind', margin + 22, 22);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text('Legal Document Analysis', margin + 22, 30);

  // Export type badge
  let badgeText;
  let badgeColor = COLORS.accent;
  
  switch (type) {
    case EXPORT_TYPES.INSIGHTS:
      badgeText = 'LEGAL CLAUSE ANALYSIS';
      break;
    case EXPORT_TYPES.SUMMARY:
      badgeText = 'EXECUTIVE SUMMARY';
      break;
    case EXPORT_TYPES.ANALYSIS_REPORT:
      badgeText = 'COMPREHENSIVE ANALYSIS';
      break;
    case EXPORT_TYPES.REFERENCE_DOC:
      badgeText = 'REFERENCE DOCUMENT';
      break;
    case EXPORT_TYPES.BILINGUAL_SUMMARY:
      badgeText = 'BILINGUAL SUMMARY';
      break;
    case EXPORT_TYPES.COMPLIANCE_REPORT:
      badgeText = lawType ? `${lawType.toUpperCase()} LAW COMPLIANCE` : 'COMPLIANCE REPORT';
      badgeColor = COLORS.warning;
      break;
    default:
      badgeText = 'DOCUMENT EXPORT';
  }

  doc.setFillColor(...badgeColor);
  const badgeWidth = doc.getTextWidth(badgeText) + 10;
  doc.roundedRect(pageWidth - margin - badgeWidth, 15, badgeWidth, 8, 2, 2, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(badgeText, pageWidth - margin - badgeWidth + 5, 20.5);
}

/**
 * Create PDF footer
 */
function createFooter(doc, pageWidth, pageHeight, margin, pageNum, totalPages = null) {
  const footerY = pageHeight - 10;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setTextColor(...COLORS.muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Generated by DocuMind - AI-Powered Legal Document Analysis', margin, footerY);
  
  const pageText = totalPages ? `Page ${pageNum} of ${totalPages}` : `Page ${pageNum}`;
  doc.text(pageText, pageWidth - margin - 20, footerY);
}

/**
 * Render text with Arabic support
 */
function renderText(doc, text, x, y, options = {}) {
  const { align = 'left', maxWidth = null } = options;
  
  // Check if text contains Arabic
  if (containsArabic(text)) {
    // Process Arabic text for proper rendering
    const processedText = processArabicText(text);
    
    // For Arabic, we render from right side
    if (align === 'right' || containsArabic(text)) {
      const textWidth = doc.getTextWidth(processedText);
      const rightX = maxWidth ? x + maxWidth - textWidth : x;
      doc.text(processedText, rightX, y);
    } else {
      doc.text(processedText, x, y);
    }
  } else {
    if (maxWidth) {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return lines.length;
    } else {
      doc.text(text, x, y);
    }
  }
  return 1;
}

/**
 * Generate a PDF from markdown content
 * @param {string} content - Markdown content to convert
 * @param {string} title - Document title
 * @param {string} type - Type of export (see EXPORT_TYPES)
 * @param {string} documentName - Original document name
 * @param {object} options - Additional options (lawType for compliance reports)
 */
export function exportToPDF(content, title, type, documentName = 'Document', options = {}) {
  const { lawType = null } = options;
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  // Create header
  createHeader(doc, pageWidth, margin, type, lawType);

  y = 55;

  // Document title
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(title, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7 + 3;

  // Document source
  doc.setTextColor(...COLORS.muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Source: ${documentName}`, margin, y);
  y += 5;

  // Date
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`Generated: ${date}`, margin, y);
  
  // Add law type for compliance reports
  if (type === EXPORT_TYPES.COMPLIANCE_REPORT && lawType) {
    y += 5;
    doc.text(`Compliance Check: Egyptian ${lawType.charAt(0).toUpperCase() + lawType.slice(1)} Law`, margin, y);
  }
  
  y += 10;

  // Divider line
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Parse and render content
  const elements = parseMarkdownForPDF(content);
  let currentPage = 1;

  function checkPageBreak(neededSpace) {
    if (y + neededSpace > pageHeight - margin) {
      doc.addPage();
      currentPage++;
      y = margin;
      return true;
    }
    return false;
  }

  function renderTextSegments(segments, x, currentY, fontSize, maxWidth) {
    doc.setFontSize(fontSize);
    let currentX = x;
    let lineY = currentY;

    for (const segment of segments) {
      if (segment.bold) {
        doc.setFont('helvetica', 'bold');
      } else if (segment.italic) {
        doc.setFont('helvetica', 'italic');
      } else {
        doc.setFont('helvetica', 'normal');
      }

      const text = segment.text;
      const textWidth = doc.getTextWidth(text);

      // Check if we need to wrap
      if (currentX + textWidth > x + maxWidth) {
        // Split text to fit
        const words = text.split(' ');
        for (const word of words) {
          const wordWidth = doc.getTextWidth(word + ' ');
          if (currentX + wordWidth > x + maxWidth) {
            lineY += fontSize * 0.4;
            checkPageBreak(fontSize * 0.5);
            currentX = x;
          }
          doc.text(word + ' ', currentX, lineY);
          currentX += wordWidth;
        }
      } else {
        doc.text(text, currentX, lineY);
        currentX += textWidth;
      }
    }

    return lineY;
  }

  for (const element of elements) {
    switch (element.type) {
      case 'h1':
        checkPageBreak(15);
        doc.setTextColor(...COLORS.primary);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        // Check for Arabic text in headers
        if (containsArabic(element.text)) {
          const processedText = processArabicText(element.text);
          const h1Lines = doc.splitTextToSize(processedText, contentWidth);
          // Right-align Arabic headers
          h1Lines.forEach((line, idx) => {
            const lineWidth = doc.getTextWidth(line);
            doc.text(line, pageWidth - margin - lineWidth, y + idx * 6);
          });
          y += h1Lines.length * 6 + 4;
        } else {
          const h1Lines = doc.splitTextToSize(element.text, contentWidth);
          doc.text(h1Lines, margin, y);
          y += h1Lines.length * 6 + 4;
        }
        break;

      case 'h2':
        checkPageBreak(12);
        doc.setTextColor(...COLORS.primary);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        if (containsArabic(element.text)) {
          const processedText = processArabicText(element.text);
          const h2Lines = doc.splitTextToSize(processedText, contentWidth);
          h2Lines.forEach((line, idx) => {
            const lineWidth = doc.getTextWidth(line);
            doc.text(line, pageWidth - margin - lineWidth, y + idx * 5);
          });
          y += h2Lines.length * 5 + 3;
        } else {
          const h2Lines = doc.splitTextToSize(element.text, contentWidth);
          doc.text(h2Lines, margin, y);
          y += h2Lines.length * 5 + 3;
        }
        break;

      case 'h3':
        checkPageBreak(10);
        doc.setTextColor(...COLORS.primary);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        if (containsArabic(element.text)) {
          const processedText = processArabicText(element.text);
          const h3Lines = doc.splitTextToSize(processedText, contentWidth);
          h3Lines.forEach((line, idx) => {
            const lineWidth = doc.getTextWidth(line);
            doc.text(line, pageWidth - margin - lineWidth, y + idx * 5);
          });
          y += h3Lines.length * 5 + 2;
        } else {
          const h3Lines = doc.splitTextToSize(element.text, contentWidth);
          doc.text(h3Lines, margin, y);
          y += h3Lines.length * 5 + 2;
        }
        break;

      case 'paragraph':
        checkPageBreak(8);
        doc.setTextColor(...COLORS.text);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const paraText = Array.isArray(element.text)
          ? element.text.map(s => s.text).join('')
          : element.text;
        
        if (containsArabic(paraText)) {
          const processedText = processArabicText(paraText);
          const pLines = doc.splitTextToSize(processedText, contentWidth);
          pLines.forEach((line, idx) => {
            const lineWidth = doc.getTextWidth(line);
            doc.text(line, pageWidth - margin - lineWidth, y + idx * 4.5);
          });
          y += pLines.length * 4.5 + 2;
        } else {
          const pLines = doc.splitTextToSize(paraText, contentWidth);
          doc.text(pLines, margin, y);
          y += pLines.length * 4.5 + 2;
        }
        break;

      case 'bullet-list':
        checkPageBreak(8);
        doc.setFontSize(10);
        const bulletText = Array.isArray(element.text)
          ? element.text.map(s => s.text).join('')
          : element.text;
        
        if (containsArabic(bulletText)) {
          const processedText = processArabicText(bulletText);
          const bulletLines = doc.splitTextToSize(processedText, contentWidth - 8);
          doc.setTextColor(...COLORS.accent);
          doc.text('•', pageWidth - margin, y);
          doc.setTextColor(...COLORS.text);
          doc.setFont('helvetica', 'normal');
          bulletLines.forEach((line, idx) => {
            const lineWidth = doc.getTextWidth(line);
            doc.text(line, pageWidth - margin - 6 - lineWidth, y + idx * 4.5);
          });
          y += bulletLines.length * 4.5 + 1.5;
        } else {
          doc.setTextColor(...COLORS.accent);
          doc.text('•', margin, y);
          doc.setTextColor(...COLORS.text);
          const bulletLines = doc.splitTextToSize(bulletText, contentWidth - 8);
          doc.setFont('helvetica', 'normal');
          doc.text(bulletLines, margin + 6, y);
          y += bulletLines.length * 4.5 + 1.5;
        }
        break;

      case 'numbered-list':
        checkPageBreak(8);
        doc.setTextColor(...COLORS.accent);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`${element.number}.`, margin, y);
        doc.setTextColor(...COLORS.text);
        doc.setFont('helvetica', 'normal');
        const numText = Array.isArray(element.text)
          ? element.text.map(s => s.text).join('')
          : element.text;
        const numLines = doc.splitTextToSize(numText, contentWidth - 10);
        doc.text(numLines, margin + 8, y);
        y += numLines.length * 4.5 + 1.5;
        break;

      case 'sub-list':
        checkPageBreak(8);
        doc.setTextColor(...COLORS.muted);
        doc.setFontSize(9);
        doc.text('◦', margin + 8, y);
        doc.setTextColor(...COLORS.text);
        const subText = Array.isArray(element.text)
          ? element.text.map(s => s.text).join('')
          : element.text;
        const subLines = doc.splitTextToSize(subText, contentWidth - 16);
        doc.setFont('helvetica', 'normal');
        doc.text(subLines, margin + 14, y);
        y += subLines.length * 4 + 1;
        break;

      case 'divider':
        checkPageBreak(10);
        y += 3;
        doc.setDrawColor(...COLORS.muted);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
        y += 7;
        break;

      case 'table-row':
        checkPageBreak(8);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.text);
        const cellWidth = contentWidth / element.cells.length;
        element.cells.forEach((cell, idx) => {
          const cellX = margin + (idx * cellWidth);
          doc.text(cell.substring(0, 30), cellX, y); // Truncate long cells
        });
        y += 5;
        break;

      case 'spacing':
        y += element.size;
        break;
    }
  }

  // Footer on last page
  createFooter(doc, pageWidth, pageHeight, margin, doc.internal.getNumberOfPages());

  // Save the PDF
  const typeSlug = type.replace(/-/g, '_');
  const filename = `${documentName.replace(/\.[^/.]+$/, '')}_${typeSlug}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * Export comprehensive analysis report (combines insights + summary + risk matrix)
 */
export function exportAnalysisReport(insights, summary, documentName = 'Document') {
  const combinedContent = `# Comprehensive Legal Analysis Report

## Executive Summary
${summary || 'No summary available.'}

---

## Detailed Clause Analysis
${insights || 'No clause analysis available.'}

---

## Disclaimer
This analysis is generated by AI and should be reviewed by qualified legal professionals.
It does not constitute legal advice.`;

  exportToPDF(combinedContent, 'Comprehensive Legal Analysis Report', EXPORT_TYPES.ANALYSIS_REPORT, documentName);
}

/**
 * Export compliance report
 */
export function exportComplianceReport(complianceData, lawType, documentName = 'Document') {
  const content = complianceData || 'No compliance data available.';
  const title = `Egyptian ${lawType.charAt(0).toUpperCase() + lawType.slice(1)} Law Compliance Report`;
  
  exportToPDF(content, title, EXPORT_TYPES.COMPLIANCE_REPORT, documentName, { lawType });
}

/**
 * Export bilingual summary
 */
export function exportBilingualSummary(bilingualContent, documentName = 'Document') {
  const content = bilingualContent || 'No bilingual summary available.';
  exportToPDF(content, 'Bilingual Summary / الملخص ثنائي اللغة', EXPORT_TYPES.BILINGUAL_SUMMARY, documentName);
}

/**
 * Export reference document
 */
export function exportReferenceDocument(referenceData, documentName = 'Document') {
  const content = referenceData || 'No reference data available.';
  exportToPDF(content, 'Document Reference Sheet', EXPORT_TYPES.REFERENCE_DOC, documentName);
}
