import { jsPDF } from "jspdf";
import { TalkRecord } from "../types";

export const generateTalkRecordPDF = (record: TalkRecord) => {
  // Initialize jsPDF in portrait mode, millimeters, A4 size
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // --- Header ---
  doc.setTextColor(30, 58, 138); // Brand Blue (#1e3a8a)
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("SiteSafe", margin, 20);
  
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.text("Toolbox Talk Record", margin, 30);
  
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, 35, pageWidth - margin, 35);

  // --- Metadata Section ---
  let y = 50;
  doc.setFontSize(10);
  
  const addMetadataRow = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(label, margin, y);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    doc.text(value, margin + 35, y);
    
    y += 7;
  };

  addMetadataRow("Topic:", record.topic);
  addMetadataRow("Date:", new Date(record.dateTime).toLocaleDateString());
  addMetadataRow("Time:", new Date(record.dateTime).toLocaleTimeString());
  addMetadataRow("Foreman:", record.foremanName);
  addMetadataRow("Location:", record.location);
  addMetadataRow("Record ID:", record.id);
  addMetadataRow("Status:", record.recordStatus.toUpperCase());

  if (record.gpsCoordinates) {
      addMetadataRow("GPS Coords:", `${record.gpsCoordinates.latitude.toFixed(6)}, ${record.gpsCoordinates.longitude.toFixed(6)}`);
      addMetadataRow("GPS Accuracy:", `±${Math.round(record.gpsCoordinates.accuracy)} meters`);
  }

  y += 5;
  doc.setDrawColor(230, 230, 230);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  // --- Signatures Header ---
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`Crew Signatures (${record.crewSignatures.length})`, margin, y);
  y += 8;

  // --- Signature Table ---
  // Header row
  doc.setFillColor(243, 244, 246); // gray-100
  doc.rect(margin, y - 5, contentWidth, 8, 'F');
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(80, 80, 80);
  doc.text("NAME", margin + 5, y);
  doc.text("SIGNATURE", margin + 80, y);
  
  y += 10;
  doc.setTextColor(0, 0, 0);

  // Rows
  record.crewSignatures.forEach((crew) => {
    // Check for page break
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 20;
      // Optional: Header on new page
    }

    // Name Column
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(crew.name, margin + 5, y + 5);
    
    if (crew.isGuest) {
        doc.setFontSize(8);
        doc.setTextColor(180, 83, 9); // amber-700ish
        doc.setFont("helvetica", "italic");
        doc.text("(Guest)", margin + 5, y + 9);
        doc.setTextColor(0, 0, 0);
    }

    // Signature Column
    if (crew.signature) {
      try {
        // Signature pad usually produces PNG data URIs
        // Dimensions: width 50mm, height 15mm
        doc.addImage(crew.signature, 'PNG', margin + 80, y - 5, 50, 15);
      } catch (error) {
         doc.setFontSize(8);
         doc.setTextColor(200, 0, 0);
         doc.text("[Invalid Signature Data]", margin + 80, y + 5);
         doc.setTextColor(0, 0, 0);
      }
    } else {
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.setFont("helvetica", "italic");
      doc.text("Not Signed", margin + 80, y + 5);
      doc.setTextColor(0, 0, 0);
    }

    y += 20; // Row height
    
    // Row separator
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y - 5, pageWidth - margin, y - 5); 
  });

  // --- Photo Evidence Page ---
  if (record.photoEvidence) {
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Photo Evidence", margin, 20);

    try {
        const imgProps = doc.getImageProperties(record.photoEvidence);
        const pdfWidth = pageWidth - (margin * 2);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        // Ensure image fits on the page vertically
        const maxHeight = pageHeight - 40; // Top + Bottom margins roughly
        let finalWidth = pdfWidth;
        let finalHeight = pdfHeight;
        
        if (pdfHeight > maxHeight) {
            finalHeight = maxHeight;
            finalWidth = (imgProps.width * finalHeight) / imgProps.height;
        }

        doc.addImage(record.photoEvidence, 'JPEG', margin, 30, finalWidth, finalHeight);
    } catch (e) {
        doc.setFontSize(10);
        doc.setTextColor(255, 0, 0);
        doc.text("Error rendering photo evidence.", margin, 40);
        console.error("PDF Image Error", e);
    }
  }

  // --- Footer ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated by SiteSafe on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`, margin, pageHeight - 10);
  }

  // Save file
  const sanitizedDate = new Date(record.dateTime).toISOString().split('T')[0];
  const filename = `SiteSafe_Talk_${sanitizedDate}_${record.id.substring(0, 6)}.pdf`;
  doc.save(filename);
};