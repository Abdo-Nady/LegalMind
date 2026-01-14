import { jsPDF } from "jspdf";
import amiriFontBase64 from "./fonts/amiri-regular";

function hasArabicText(text) {
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text);
}

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
 * Generate a PDF from markdown content
 * @param {string} content - Markdown content to convert
 * @param {string} title - Document title
 * @param {string} type - Type of export ('insights' or 'summary')
 * @param {string} documentName - Original document name
 */
export function exportToPDF(content, title, type, documentName = 'Document') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const isArabic = hasArabicText(content) || hasArabicText(title);

  if (isArabic) {
    doc.addFileToVFS("Amiri-Regular.ttf", amiriFontBase64);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.addFont("Amiri-Regular.ttf", "Amiri", "bold");
    doc.setFont("Amiri");
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  // Colors
  const primaryColor = [21, 42, 67]; // Deep navy
  const accentColor = [20, 160, 133]; // Teal
  const textColor = [51, 51, 51];
  const mutedColor = [120, 120, 120];

  // Header background
  doc.setFillColor(21, 42, 67);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Logo/Brand area
  doc.setFillColor(186, 155, 94); // Gold accent
  doc.circle(margin + 8, 20, 8, 'F');

  // Brand text
  doc.setTextColor(255, 255, 255);
  doc.setFont(isArabic ? 'Amiri' : 'helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('DocuMind', margin + 22, 22);

  // Subtitle
  doc.setFont(isArabic ? 'Amiri' : 'helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text('Legal Document Analysis', margin + 22, 30);

  // Export type badge
  const badgeText = type === 'insights' ? 'LEGAL CLAUSE ANALYSIS' : 'EXECUTIVE SUMMARY';
  doc.setFillColor(...accentColor);
  const badgeWidth = doc.getTextWidth(badgeText) + 10;
  doc.roundedRect(pageWidth - margin - badgeWidth, 15, badgeWidth, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont(isArabic ? 'Amiri' : 'helvetica', 'bold');
  doc.text(badgeText, pageWidth - margin - badgeWidth + 5, 20.5);

  y = 55;

  // Document title
  doc.setTextColor(...primaryColor);
  doc.setFont(isArabic ? 'Amiri' : 'helvetica', 'bold');
  doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(title, contentWidth);
  if (isArabic) {
    doc.text(titleLines, pageWidth - margin, y, { align: 'right' });
  } else {
    doc.text(titleLines, margin, y);
  }
  y += titleLines.length * 7 + 3;

  // Document source
  doc.setTextColor(...mutedColor);
  doc.setFont(isArabic ? 'Amiri' : 'helvetica', 'normal');
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
  y += 10;

  // Divider line
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Parse and render content
  const elements = parseMarkdownForPDF(content);

  function checkPageBreak(neededSpace) {
    if (y + neededSpace > pageHeight - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  }

  function addText(text, x, yPos, options = {}) {
    if (isArabic) {
      const xPos = options.useMargin ? pageWidth - margin : x;
      doc.text(text, xPos, yPos, { align: 'right', ...options });
    } else {
      doc.text(text, x, yPos, options);
    }
  }

  function renderTextSegments(segments, x, currentY, fontSize, maxWidth) {
    doc.setFontSize(fontSize);
    let currentX = x;
    let lineY = currentY;

    for (const segment of segments) {
      if (segment.bold) {
        doc.setFont(isArabic ? 'Amiri' : 'helvetica', 'bold');
      } else if (segment.italic) {
        doc.setFont(isArabic ? 'Amiri' : 'helvetica', 'italic');
      } else {
        doc.setFont(isArabic ? 'Amiri' : 'helvetica', 'normal');
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
        doc.setTextColor(...primaryColor);
        doc.setFont(isArabic ? 'Amiri' : 'helvetica', 'bold');
        doc.setFontSize(14);
        const h1Lines = doc.splitTextToSize(element.text, contentWidth);
        addText(h1Lines, margin, y, { useMargin: true });
        y += h1Lines.length * 6 + 4;
        break;

      case 'h2':
        checkPageBreak(12);
        doc.setTextColor(...primaryColor);
        doc.setFont(isArabic ? 'Amiri' : 'helvetica', 'bold');
        doc.setFontSize(12);
        const h2Lines = doc.splitTextToSize(element.text, contentWidth);
        addText(h2Lines, margin, y, { useMargin: true });
        y += h2Lines.length * 5 + 3;
        break;

      case 'h3':
        checkPageBreak(10);
        doc.setTextColor(...primaryColor);
        doc.setFont(isArabic ? 'Amiri' : 'helvetica', 'bold');
        doc.setFontSize(11);
        const h3Lines = doc.splitTextToSize(element.text, contentWidth);
        addText(h3Lines, margin, y, { useMargin: true });
        y += h3Lines.length * 5 + 2;
        break;

      case 'paragraph':
        checkPageBreak(8);
        doc.setTextColor(...textColor);
        if (Array.isArray(element.text)) {
          const plainText = element.text.map(s => s.text).join('');
          const pLines = doc.splitTextToSize(plainText, contentWidth);
          doc.setFont(isArabic ? 'Amiri' : 'helvetica', 'normal');
          doc.setFontSize(10);
          addText(pLines, margin, y, { useMargin: true });
          y += pLines.length * 4.5 + 2;
        } else {
          const pLines = doc.splitTextToSize(element.text, contentWidth);
          doc.setFont(isArabic ? 'Amiri' : 'helvetica', 'normal');
          doc.setFontSize(10);
          addText(pLines, margin, y, { useMargin: true });
          y += pLines.length * 4.5 + 2;
        }
        break;

      case 'bullet-list':
        checkPageBreak(8);
        doc.setTextColor(...accentColor);
        doc.setFontSize(10);
        if (isArabic) {
          doc.text('•', pageWidth - margin, y, { align: 'right' });
        } else {
          doc.text('•', margin, y);
        }
        doc.setTextColor(...textColor);
        const bulletText = Array.isArray(element.text)
          ? element.text.map(s => s.text).join('')
          : element.text;
        const bulletLines = doc.splitTextToSize(bulletText, contentWidth - 8);
        doc.setFont(isArabic ? 'Amiri' : 'helvetica', 'normal');
        addText(bulletLines, margin + 6, y, { useMargin: isArabic });
        y += bulletLines.length * 4.5 + 1.5;
        break;

      case 'numbered-list':
        checkPageBreak(8);
        doc.setTextColor(...accentColor);
        doc.setFont(isArabic ? 'Amiri' : 'helvetica', 'bold');
        doc.setFontSize(10);
        if (isArabic) {
          doc.text(`${element.number}.`, pageWidth - margin, y, { align: 'right' });
        } else {
          doc.text(`${element.number}.`, margin, y);
        }
        doc.setTextColor(...textColor);
        doc.setFont(isArabic ? 'Amiri' : 'helvetica', 'normal');
        const numText = Array.isArray(element.text)
          ? element.text.map(s => s.text).join('')
          : element.text;
        const numLines = doc.splitTextToSize(numText, contentWidth - 10);
        addText(numLines, margin + 8, y, { useMargin: isArabic });
        y += numLines.length * 4.5 + 1.5;
        break;

      case 'sub-list':
        checkPageBreak(8);
        doc.setTextColor(...mutedColor);
        doc.setFontSize(9);
        if (isArabic) {
          doc.text('◦', pageWidth - margin - 8, y, { align: 'right' });
        } else {
          doc.text('◦', margin + 8, y);
        }
        doc.setTextColor(...textColor);
        const subText = Array.isArray(element.text)
          ? element.text.map(s => s.text).join('')
          : element.text;
        const subLines = doc.splitTextToSize(subText, contentWidth - 16);
        doc.setFont(isArabic ? 'Amiri' : 'helvetica', 'normal');
        addText(subLines, margin + 14, y, { useMargin: isArabic });
        y += subLines.length * 4 + 1;
        break;

      case 'spacing':
        y += element.size;
        break;
    }
  }

  // Footer on last page
  const footerY = pageHeight - 10;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setTextColor(...mutedColor);
  doc.setFont(isArabic ? 'Amiri' : 'helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Generated by DocuMind - AI-Powered Legal Document Analysis', margin, footerY);
  doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - margin - 15, footerY);

  // Save the PDF
  const filename = `${documentName.replace(/\.[^/.]+$/, '')}_${type}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
