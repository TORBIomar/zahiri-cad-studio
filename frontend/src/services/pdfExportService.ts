import { jsPDF } from 'jspdf';
import { CadState, MATERIALS } from '../store/useCadStore';

export interface MoroccanQuotation {
  unitCost?: number;
  batchTotal?: string | number;
  batchQuantity?: number;
  materialCostDH?: string | number;
  machineCostDH?: string | number;
}

export class PdfExportService {
  static exportTechnicalDataSheet(
    state: CadState,
    language: string = 'en',
    quotation?: MoroccanQuotation
  ) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const isFr = language === 'fr';
    const material = MATERIALS[state.materialId] || MATERIALS.steel_304;
    const outerDiameter = state.profileType === 'round' ? state.outerRadius * 2 : state.rectWidth;
    const enabledCuts = state.cuts.filter((c) => c.enabled);
    const dateStr = new Date().toLocaleDateString(isFr ? 'fr-FR' : 'en-US');
    const jobRef = `ZHR-CAD-${Math.floor(100000 + Math.random() * 900000)}`;

    // Page Background & Border
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 297, 'F');

    // Header Banner
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(10, 10, 190, 25, 'F');
    doc.setDrawColor(245, 158, 11); // amber-500
    doc.setLineWidth(0.8);
    doc.rect(10, 10, 190, 25, 'D');

    // Title & Logo Text
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('ZAHIRI METAL', 15, 21);

    doc.setTextColor(241, 245, 249);
    doc.setFontSize(10);
    doc.text(
      isFr
        ? 'FICHE TECHNIQUE CAD & SPÉCIFICATIONS LASER FIBRE'
        : 'INDUSTRIAL CAD & FIBER LASER DATA SHEET',
      15,
      29
    );

    doc.setFontSize(8);
    doc.setFont('courier', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`REF: ${jobRef}`, 150, 20);
    doc.text(`DATE: ${dateStr}`, 150, 25);
    doc.text('ISO 10303 / ISO 6983', 150, 30);

    // Section 1: Tube Geometry & Material Specs
    let yPos = 42;
    doc.setFillColor(30, 41, 59);
    doc.rect(10, yPos, 190, 8, 'F');
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(
      isFr ? '1. GÉOMÉTRIE DU TUBE & MATÉRIAU' : '1. TUBE GEOMETRY & MATERIAL SPECIFICATIONS',
      14,
      yPos + 5.5
    );

    yPos += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);

    const leftSpecs = [
      [isFr ? 'Profil Tube:' : 'Tube Profile:', state.profileType.toUpperCase()],
      [isFr ? 'Longueur Totale (L):' : 'Total Length (L):', `${state.length} mm`],
      [isFr ? 'Diamètre Extérieur (Ø):' : 'Outer Diameter (Ø):', `${outerDiameter} mm`],
      [isFr ? 'Épaisseur de Paroi (T):' : 'Wall Thickness (T):', `${state.wallThickness} mm`],
    ];

    leftSpecs.forEach(([label, val]) => {
      doc.setTextColor(148, 163, 184);
      doc.text(label, 14, yPos);
      doc.setTextColor(241, 245, 249);
      doc.setFont('helvetica', 'bold');
      doc.text(val, 65, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 5.5;
    });

    let rightY = 54;
    const rightSpecs = [
      [isFr ? 'Nuance Matériau:' : 'Material Grade:', material.name],
      [isFr ? 'Masse Volumique:' : 'Metal Density:', `${material.density} g/cm³`],
      [isFr ? 'Puissance Laser Fibre:' : 'Fiber Laser Power:', `${state.laserPowerKW} kW`],
      [isFr ? 'Gaz d\'Assistance:' : 'Assist Gas:', state.assistGas.toUpperCase()],
    ];

    rightSpecs.forEach(([label, val]) => {
      doc.setTextColor(148, 163, 184);
      doc.text(label, 110, rightY);
      doc.setTextColor(241, 245, 249);
      doc.setFont('helvetica', 'bold');
      doc.text(val, 160, rightY);
      doc.setFont('helvetica', 'normal');
      rightY += 5.5;
    });

    // Section 2: Physical & Cutting Telemetry
    yPos = 82;
    doc.setFillColor(30, 41, 59);
    doc.rect(10, yPos, 190, 8, 'F');
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(
      isFr ? '2. TÉLÉMÉTRIE DE DÉCOUPE & POIDS' : '2. CUTTING TELEMETRY & PHYSICAL PROPERTIES',
      14,
      yPos + 5.5
    );

    yPos += 12;
    // Calculate telemetry
    const lCm = state.length / 10;
    const rOuterCm = state.outerRadius / 10;
    const rInnerCm = Math.max(0, rOuterCm - state.wallThickness / 10);
    const crossSectionCm2 = Math.PI * (rOuterCm ** 2 - rInnerCm ** 2);
    const volCm3 = crossSectionCm2 * lCm;
    const massKg = (volCm3 * material.density) / 1000;

    doc.setFillColor(15, 23, 42);
    doc.setDrawColor(51, 65, 85);
    doc.rect(14, yPos, 85, 20, 'FD');
    doc.rect(105, yPos, 95, 20, 'FD');

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text(isFr ? 'POIDS NET ESTIMÉ' : 'ESTIMATED NET WEIGHT', 18, yPos + 6);
    doc.setTextColor(245, 158, 11);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${massKg.toFixed(2)} kg`, 18, yPos + 15);

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(isFr ? 'VOLUME MATÉRIAU' : 'NET VOLUME', 110, yPos + 6);
    doc.setTextColor(6, 182, 212);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${volCm3.toFixed(1)} cm³`, 110, yPos + 15);

    // Section 3: Active Laser Cut Features Table
    yPos = 120;
    doc.setFillColor(30, 41, 59);
    doc.rect(10, yPos, 190, 8, 'F');
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(
      isFr
        ? `3. LISTE DES DÉCOUPES LASER (${enabledCuts.length} FEATURES)`
        : `3. ACTIVE CUT FEATURES LIST (${enabledCuts.length} FEATURES)`,
      14,
      yPos + 5.5
    );

    yPos += 12;
    // Table Header
    doc.setFillColor(51, 65, 85);
    doc.rect(10, yPos, 190, 7, 'F');
    doc.setTextColor(241, 245, 249);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    doc.text('#', 14, yPos + 5);
    doc.text(isFr ? 'NOM FEATURE' : 'FEATURE NAME', 24, yPos + 5);
    doc.text('TYPE', 80, yPos + 5);
    doc.text('POSITION Z', 115, yPos + 5);
    doc.text('ANGLE (POLAR)', 150, yPos + 5);
    doc.text('DIMENSIONS', 178, yPos + 5);

    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    enabledCuts.forEach((cut, idx) => {
      doc.setFillColor(idx % 2 === 0 ? 30 : 20, idx % 2 === 0 ? 41 : 30, idx % 2 === 0 ? 59 : 45);
      doc.rect(10, yPos, 190, 7, 'F');

      doc.setTextColor(245, 158, 11);
      doc.text(`${idx + 1}`, 14, yPos + 5);

      doc.setTextColor(241, 245, 249);
      doc.text(cut.name, 24, yPos + 5);

      doc.setTextColor(6, 182, 212);
      doc.text(cut.type.toUpperCase(), 80, yPos + 5);

      doc.setTextColor(241, 245, 249);
      doc.text(`${cut.positionZ} mm`, 115, yPos + 5);
      doc.text(`${cut.polarAngle}°`, 150, yPos + 5);

      const dimStr =
        cut.type === 'hole'
          ? `Ø${cut.radius * 2}mm`
          : cut.type === 'slot'
          ? `${cut.slotLength}x${cut.slotWidth}mm`
          : `${cut.mitreAngle}° bevel`;
      doc.text(dimStr, 178, yPos + 5);

      yPos += 7;
    });

    // Section 4: Moroccan Industrial Cost Estimation (MAD / DH)
    yPos += 10;
    doc.setFillColor(30, 41, 59);
    doc.rect(10, yPos, 190, 8, 'F');
    doc.setTextColor(16, 185, 129); // emerald-500
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(
      isFr
        ? '4. DEVIS ESTIMATIF FABRICATION (EN DIRHAMS - MAD / DH)'
        : '4. ESTIMATED MANUFACTURING QUOTATION (MOROCCAN DIRHAMS - MAD / DH)',
      14,
      yPos + 5.5
    );

    yPos += 11;
    const rawCostPerKgMap: Record<string, number> = {
      steel_s235: 14.0,
      steel_304: 38.0,
      aluminum_6061: 48.0,
      brass: 68.0,
      titanium_gr5: 320.0,
    };
    const rawCostPerKg = rawCostPerKgMap[state.materialId] || 15.0;
    const matCost = quotation?.materialCostDH ?? (massKg * rawCostPerKg).toFixed(1);
    const cutTimeMin = (enabledCuts.length * 0.45 + (state.length / 1000) * 0.1) / (material.cuttingSpeedFactor || 1);
    const machCost = quotation?.machineCostDH ?? ((cutTimeMin / 60) * 210).toFixed(1);
    const uCost = quotation?.unitCost ?? Math.round(Math.max(25, Number(matCost) + Number(machCost) + 12));
    const bQty = quotation?.batchQuantity ?? 10;
    const discountRate = bQty >= 50 ? 0.88 : bQty >= 20 ? 0.94 : 1.0;
    const bTotal = quotation?.batchTotal ?? Math.round(uCost * bQty * discountRate).toLocaleString('fr-FR');

    // Quotation Cards
    doc.setFillColor(15, 23, 42);
    doc.setDrawColor(16, 185, 129);
    doc.rect(14, yPos, 85, 23, 'FD');
    doc.rect(105, yPos, 95, 23, 'FD');

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(isFr ? 'DÉCOMPOSITION DU COÛT' : 'COST BREAKDOWN', 18, yPos + 5.5);
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(isFr ? `• Matière Première: ${matCost} DH` : `• Raw Material: ${matCost} DH`, 18, yPos + 10.5);
    doc.text(isFr ? `• Découpe Laser & Gaz: ${machCost} DH` : `• Laser Cutting & Gas: ${machCost} DH`, 18, yPos + 15);
    doc.text(isFr ? '• Calage & Fixation Mandrin: 12.0 DH' : '• Rotary Chuck Setup: 12.0 DH', 18, yPos + 19.5);

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text(isFr ? `TOTAL DEVIS (LOT DE ${bQty} PIÈCES)` : `QUOTATION TOTAL (${bQty} UNITS)`, 110, yPos + 5.5);
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`${bTotal} DH`, 110, yPos + 14);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text(isFr ? `Prix unitaire indicatif HT: ${uCost} DH / pièce` : `Unit price HT: ${uCost} DH / part`, 110, yPos + 19.5);

    // Section 5: Signature & Manufacturing Stamp
    yPos = 252;
    doc.setDrawColor(51, 65, 85);
    doc.line(10, yPos, 200, yPos);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      isFr
        ? 'GÉNÉRÉ AUTOMATIQUEMENT PAR ZAHIRI METAL CAD STUDIO'
        : 'AUTOMATICALLY GENERATED BY ZAHIRI METAL CAD STUDIO',
      14,
      yPos + 8
    );
    doc.text(
      isFr
        ? 'DOCUMENT APPROUVÉ POUR DÉCOUPE LASER FIBRE CNC - MAROC'
        : 'APPROVED FOR CNC ROTARY FIBER LASER CUTTING - MOROCCO',
      14,
      yPos + 14
    );

    doc.setDrawColor(245, 158, 11);
    doc.rect(145, yPos + 3, 50, 18, 'D');
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.text('ZAHIRI METAL', 152, yPos + 10);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('QUALITY ASSURED', 152, yPos + 16);

    doc.save(`Zahiri_CAD_Specification_${state.length}x${outerDiameter}mm.pdf`);
  }
}
