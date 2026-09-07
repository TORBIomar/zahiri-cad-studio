import { CutFeature, CutType, ProfileType } from '../store/useCadStore';

export interface ParsedGCodeResult {
  length: number;
  outerRadius: number;
  wallThickness: number;
  profileType: ProfileType;
  rectWidth?: number;
  rectHeight?: number;
  cornerRadius?: number;
  materialId: string;
  cuts: CutFeature[];
}

export function parseGCodeFile(gcodeContent: string): ParsedGCodeResult {
  const lines = gcodeContent.split(/\r?\n/);
  let length = 1200;
  let outerRadius = 40;
  let wallThickness = 3.5;
  let profileType: ProfileType = 'round';
  let rectWidth = 80;
  let rectHeight = 60;
  let cornerRadius = 3.0;
  let materialId = 'steel_304';
  const cuts: CutFeature[] = [];

  let maxCoordDetected = 0;
  let hasExplicitLength = false;

  // 1. Scan Header Comments & Machine Config
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('(') || trimmed.startsWith(';')) {
      const upper = trimmed.toUpperCase();

      // Profile detection
      if (upper.includes('PROFILE') || upper.includes('TUBE') || upper.includes('SECTION')) {
        if (upper.includes('SQUARE') || upper.includes('SHS') || upper.includes('BOX')) {
          profileType = 'square';
          const matchSquare = upper.match(/(\d+)\s*[X*×]\s*(\d+)/) || upper.match(/(\d+)MM/);
          if (matchSquare) {
            const side = parseInt(matchSquare[1], 10);
            rectWidth = side;
            rectHeight = side;
            outerRadius = side / 2;
          }
        } else if (upper.includes('RECT') || upper.includes('RHS')) {
          profileType = 'rectangular';
          const matchRect = upper.match(/(\d+)\s*[X*×]\s*(\d+)/);
          if (matchRect) {
            rectWidth = parseInt(matchRect[1], 10);
            rectHeight = parseInt(matchRect[2], 10);
            outerRadius = Math.max(rectWidth, rectHeight) / 2;
          }
        } else {
          profileType = 'round';
          const matchDia = upper.match(/[ØD]\s*[:=]?\s*(\d+)/) || upper.match(/DIA\s*[:=]?\s*(\d+)/);
          if (matchDia) {
            outerRadius = parseInt(matchDia[1], 10) / 2;
          }
        }

        const matchLen = upper.match(/L\s*[:=]?\s*(\d+)MM?/) || upper.match(/LENGTH\s*[:=]?\s*(\d+)/);
        if (matchLen) {
          length = parseInt(matchLen[1], 10);
          hasExplicitLength = true;
        }
      }

      // Wall Thickness
      if (upper.includes('THICK') || upper.includes('WALL') || upper.includes('T:')) {
        const matchT = upper.match(/[T:]\s*[:=]?\s*([\d.]+)/);
        if (matchT) wallThickness = parseFloat(matchT[1]);
      }

      // Material
      if (upper.includes('STAINLESS') || upper.includes('304') || upper.includes('316')) materialId = 'steel_304';
      else if (upper.includes('S235') || upper.includes('STRUCTURAL') || upper.includes('STEEL')) materialId = 'steel_s235';
      else if (upper.includes('ALU') || upper.includes('6061')) materialId = 'aluminum_6061';
      else if (upper.includes('TITANIUM') || upper.includes('TI-')) materialId = 'titanium_gr5';
      else if (upper.includes('BRASS') || upper.includes('LAITON')) materialId = 'brass';
    }
  });

  // 2. Motion Commands & Cut Feature Extraction
  let currentFeatureType: CutType = 'hole';
  let currentFeatureName = '';
  let lastX = 0;
  let lastA = 0;
  let arcRadiusDetected = 15;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Feature header comments
    if ((line.startsWith('(') || line.startsWith(';')) && (line.toUpperCase().includes('FEATURE') || line.toUpperCase().includes('CUT') || line.toUpperCase().includes('HOLE') || line.toUpperCase().includes('SLOT') || line.toUpperCase().includes('MITRE'))) {
      currentFeatureName = line.replace(/[();]/g, '').trim();
      const upper = line.toUpperCase();
      if (upper.includes('HOLE') || upper.includes('PERCAGE') || upper.includes('ROUND')) {
        currentFeatureType = 'hole';
      } else if (upper.includes('SLOT') || upper.includes('LUMIERE') || upper.includes('OBULONG')) {
        currentFeatureType = 'slot';
      } else if (upper.includes('MITRE') || upper.includes('BEVEL') || upper.includes('BISEAU')) {
        currentFeatureType = upper.includes('START') ? 'mitre_start' : 'mitre_end';
      }
    }

    // Arc radius extraction from I/J or R
    if (line.startsWith('G2') || line.startsWith('G3') || line.startsWith('G02') || line.startsWith('G03')) {
      const matchR = line.match(/R([\d.-]+)/);
      const matchI = line.match(/I([\d.-]+)/);
      const matchJ = line.match(/J([\d.-]+)/);
      if (matchR) {
        arcRadiusDetected = Math.abs(parseFloat(matchR[1]));
      } else if (matchI && matchJ) {
        const iVal = parseFloat(matchI[1]);
        const jVal = parseFloat(matchJ[1]);
        arcRadiusDetected = Math.round(Math.sqrt(iVal * iVal + jVal * jVal));
      }
    }

    // Coordinate Tracking
    if (line.startsWith('G0') || line.startsWith('G1') || line.startsWith('G00') || line.startsWith('G01')) {
      // Linear coordinate X (or Z in some lathes/rotary dialects)
      const matchX = line.match(/X([\d.-]+)/) || line.match(/Z([\d.-]+)/);
      // Rotary angle A (or B/C)
      const matchA = line.match(/[ABC]([\d.-]+)/);

      let xVal = lastX;
      let aVal = lastA;

      if (matchX) {
        xVal = Math.abs(parseFloat(matchX[1]));
        lastX = xVal;
        if (xVal > maxCoordDetected) maxCoordDetected = xVal;
      }

      if (matchA) {
        aVal = Math.abs(parseFloat(matchA[1])) % 360;
        lastA = aVal;
      }

      // Feature trigger on laser-on command (M03, M103, or pierce move)
      const isPierceLine = line.includes('M03') || line.includes('M103') || line.includes('M3') || (matchX && matchA && Math.abs(xVal) > 10);

      if (isPierceLine && xVal > 0) {
        const cutId = `gcode-cut-${cuts.length + 1}-${Date.now()}`;
        // Ensure not duplicate within 15mm
        const exists = cuts.some((c) => Math.abs(c.positionZ - xVal) < 15 && Math.abs(c.polarAngle - aVal) < 20);

        if (!exists) {
          const defaultRadius = arcRadiusDetected > 2 && arcRadiusDetected < 60 ? arcRadiusDetected : 15;
          cuts.push({
            id: cutId,
            name: currentFeatureName || `${currentFeatureType === 'hole' ? 'Hole Ø' + (defaultRadius * 2) : currentFeatureType === 'slot' ? 'Slot 60x20' : 'Mitre Cut'} @ ${Math.round(xVal)}mm`,
            type: currentFeatureType,
            positionZ: Math.round(xVal),
            polarAngle: Math.round(aVal),
            radius: defaultRadius,
            slotLength: currentFeatureType === 'slot' ? 60 : 50,
            slotWidth: currentFeatureType === 'slot' ? 20 : 20,
            mitreAngle: 45,
            enabled: true,
          });
        }
      }
    }
  }

  // If no explicit length was declared in comments, infer from max coordinate detected
  if (!hasExplicitLength && maxCoordDetected > 50) {
    length = Math.min(6000, Math.max(300, Math.ceil((maxCoordDetected + 100) / 100) * 100));
  }

  // Ensure cuts are within length bounds
  cuts.forEach((cut) => {
    if (cut.positionZ > length) {
      length = Math.ceil((cut.positionZ + 100) / 100) * 100;
    }
  });

  // Default fallback cut if G-code was purely toolpath without recognized laser triggers
  if (cuts.length === 0) {
    cuts.push({
      id: `cut-default-${Date.now()}`,
      name: 'Imported Laser Feature @ 300mm',
      type: 'hole',
      positionZ: Math.min(300, Math.round(length / 3)),
      polarAngle: 0,
      radius: 15,
      slotLength: 50,
      slotWidth: 20,
      mitreAngle: 45,
      enabled: true,
    });
  }

  return {
    length,
    outerRadius,
    wallThickness,
    profileType,
    rectWidth,
    rectHeight,
    cornerRadius,
    materialId,
    cuts,
  };
}
