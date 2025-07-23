

import { useState, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import { ProcessingStatus, UploadZoneKey, FileWithPreview } from '../types';
import { CROP_CONFIGS } from '../constants';
import { MILADENT_LOGO } from '../logo';

// Set worker source for pdf.js, which is required for it to work correctly.
// pdfjs-dist is loaded from esm.sh, so the worker should be too.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.min.js`;

const cropImage = (file: File, cropConfig: { x: number; y: number; width: number; height: number; }): Promise<string> => {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();
    image.src = imageUrl;
    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      const canvas = document.createElement('canvas');
      const width = cropConfig.width;
      const height = cropConfig.height;
      const radius = 30; // Radius for rounded corners

      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Не удалось получить контекст canvas'));
      }
      
      // Create a rounded rectangle path
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(width - radius, 0);
      ctx.quadraticCurveTo(width, 0, width, radius);
      ctx.lineTo(width, height - radius);
      ctx.quadraticCurveTo(width, height, width - radius, height);
      ctx.lineTo(radius, height);
      ctx.quadraticCurveTo(0, height, 0, height - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      ctx.clip(); // Use the path as a clipping mask

      // Draw the cropped image inside the clipped area
      ctx.drawImage(
        image,
        cropConfig.x,
        cropConfig.y,
        cropConfig.width,
        cropConfig.height,
        0,
        0,
        width,
        height
      );
      
      // Resolve with the data URL of the canvas content
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = (error) => {
      URL.revokeObjectURL(imageUrl);
      reject(error);
    };
  });
};

interface PdfImage {
  imageData: string;
  width: number; // in points
  height: number; // in points
  source: UploadZoneKey;
}

const convertPdfToImages = (file: FileWithPreview, source: UploadZoneKey): Promise<PdfImage[]> => {
  const isRadiologicalReport = source === UploadZoneKey.DIAGNOCAT_RADIOLOGICAL;
  const isCephalometricAnalysis = source === UploadZoneKey.CEPHALOMETRIC_ANALYSIS;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        if (!event.target?.result) {
          return reject(new Error('Не удалось прочитать PDF файл.'));
        }
        const typedarray = new Uint8Array(event.target.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        const pagePromises: Promise<PdfImage>[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const promise = (async () => {
            const page = await pdf.getPage(i);
            const originalViewport = page.getViewport({ scale: 1.0 });
            const viewport = page.getViewport({ scale: 3.0 }); // Increased for better quality
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) {
              throw new Error('Не удалось получить контекст canvas');
            }
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);

            await page.render({ canvasContext: context, viewport }).promise;
            
            let outputCanvas = canvas;
            let outputWidth = originalViewport.width;
            let outputHeight = originalViewport.height;

            if (isRadiologicalReport) {
              // Cover the footer with a white rectangle.
              context.fillStyle = 'white';
              const footerHeightInPixels = 70 * 3.0; // 70 points from original PDF, scaled by 3
              context.fillRect(0, canvas.height - footerHeightInPixels, canvas.width, footerHeightInPixels);
            }

            if (isCephalometricAnalysis) {
              const logoImg = new Image();
              const p = new Promise(res => { logoImg.onload = res; });
              logoImg.src = MILADENT_LOGO;
              await p;
              
              const scale = 3.0;
              const logoWidth = 110 * scale;
              const logoHeight = logoWidth * (120 / 680);

              const rectangleWidth = logoWidth + 30; // wider by 15px
              const rectangleHeight = logoHeight + (20 * scale);
              
              const logoX = (65 / 3) * scale;
              const logoY = ((65 / 3) + 4) * scale;

              const rectangleX = logoX;
              const rectangleY = logoY - 30; // raised by 15px

              context.fillStyle = 'white';
              context.fillRect(rectangleX, rectangleY, rectangleWidth, rectangleHeight);
              context.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

              const rotatedCanvas = document.createElement('canvas');
              rotatedCanvas.width = canvas.height;
              rotatedCanvas.height = canvas.width;
              const rotatedContext = rotatedCanvas.getContext('2d');
              if (!rotatedContext) {
                throw new Error('Не удалось получить контекст canvas для поворота');
              }
              
              rotatedContext.fillStyle = 'white';
              rotatedContext.fillRect(0, 0, rotatedCanvas.width, rotatedCanvas.height);
              rotatedContext.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
              rotatedContext.rotate(Math.PI / 2);
              rotatedContext.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
              
              outputCanvas = rotatedCanvas;
              outputWidth = originalViewport.height;
              outputHeight = originalViewport.width;
            }
            
            return {
              imageData: outputCanvas.toDataURL('image/png'),
              width: outputWidth,
              height: outputHeight,
              source,
            };
          })();
          pagePromises.push(promise);
        }
        
        const images = await Promise.all(pagePromises);
        resolve(images);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error('Ошибка при конвертации PDF в изображения:', errorMessage);
        reject(new Error(`Не удалось обработать PDF файл: ${file.name}`));
      }
    };
    reader.readAsArrayBuffer(file);
    reader.onerror = (error) => reject(error);
  });
};


const addLogo = (doc: jsPDF) => {
    const logoWidth = 40; 
    // The logo's original aspect ratio is 680x120 pixels.
    // We calculate the height based on a fixed width to prevent distortion.
    const logoHeight = logoWidth * (120 / 680);
    const margin = 10;
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Position in bottom right corner
    const x = pageWidth - margin - logoWidth;
    const y = pageHeight - margin - logoHeight;
    doc.addImage(MILADENT_LOGO, 'SVG', x, y, logoWidth, logoHeight);
};

export const useFileProcessor = () => {
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const processFiles = useCallback(async (files: Record<UploadZoneKey, FileWithPreview[]>) => {
    setStatus('processing');
    setError(null);
    setPdfUrl(null);

    try {
      const diagnocatSegmentationFiles = files[UploadZoneKey.DIAGNOCAT_SEGMENTATION] || [];
      const meditlinkScansFiles = files[UploadZoneKey.MEDITLINK_SCANS] || [];

      // Await all image processing promises
      const cropPromises = [
        ...diagnocatSegmentationFiles.map(file => cropImage(file, CROP_CONFIGS[UploadZoneKey.DIAGNOCAT_SEGMENTATION])),
        ...meditlinkScansFiles.map(file => cropImage(file, CROP_CONFIGS[UploadZoneKey.MEDITLINK_SCANS]))
      ];
      
      const radiologicalReportPromises = (files[UploadZoneKey.DIAGNOCAT_RADIOLOGICAL] || [])
        .map(file => convertPdfToImages(file, UploadZoneKey.DIAGNOCAT_RADIOLOGICAL));
      const cephalometricAnalysisPromises = (files[UploadZoneKey.CEPHALOMETRIC_ANALYSIS] || [])
        .map(file => convertPdfToImages(file, UploadZoneKey.CEPHALOMETRIC_ANALYSIS));
        
      const pdfToImagePromises = [...radiologicalReportPromises, ...cephalometricAnalysisPromises];
      
      const [croppedImages, pdfPagesAsImagesArrays] = await Promise.all([
        Promise.all(cropPromises),
        Promise.all(pdfToImagePromises)
      ]);

      const pdfPagesData = pdfPagesAsImagesArrays.flat();

      if (croppedImages.length === 0 && pdfPagesData.length === 0) {
        throw new Error("Нет файлов для обработки.");
      }

      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });
      
      // Delete the first, blank page that jsPDF creates by default.
      if (doc.getNumberOfPages() > 0) {
         doc.deletePage(1);
      }
      
      const A4_WIDTH = 210;
      const A4_HEIGHT = 297;
      let pageAdded = false;

      // --- Process screenshots FIRST ---
      if (croppedImages.length > 0) {
        doc.addPage();
        addLogo(doc);
        pageAdded = true;

        const MARGIN = 10;
        const PADDING_BETWEEN_IMAGES = 5;
        const MAX_WIDTH = A4_WIDTH - MARGIN * 2;
        let currentPageY = MARGIN;

        for (const imgData of croppedImages) {
          const imgProps = doc.getImageProperties(imgData);
          const aspectRatio = imgProps.width / imgProps.height;
          let imgWidth = MAX_WIDTH;
          let imgHeight = imgWidth / aspectRatio;
          
          // Scale down if too tall for one page area
          if (imgHeight > A4_HEIGHT - MARGIN * 2) {
              imgHeight = A4_HEIGHT - MARGIN * 2;
              imgWidth = imgHeight * aspectRatio;
          }

          // If the current image doesn't fit on the current page, create a new one.
          if (currentPageY !== MARGIN && (currentPageY + imgHeight > A4_HEIGHT - MARGIN)) {
              doc.addPage();
              addLogo(doc);
              currentPageY = MARGIN;
          }

          const x = (A4_WIDTH - imgWidth) / 2;
          doc.addImage(imgData, 'PNG', x, currentPageY, imgWidth, imgHeight);
          currentPageY += imgHeight + PADDING_BETWEEN_IMAGES;
        }
      }

      // --- Process PDF pages SECOND ---
      const PT_TO_MM = 25.4 / 72;

      for (const pageData of pdfPagesData) {
        const pageWidthMm = pageData.width * PT_TO_MM;
        const pageHeightMm = pageData.height * PT_TO_MM;
        
        doc.addPage([pageWidthMm, pageHeightMm], 'p');
        pageAdded = true;
        
        doc.addImage(pageData.imageData, 'PNG', 0, 0, pageWidthMm, pageHeightMm);
        if (pageData.source !== UploadZoneKey.CEPHALOMETRIC_ANALYSIS) {
            addLogo(doc);
        }
      }

      if (!pageAdded) {
        // This case should be handled by the check at the beginning, but as a safeguard.
        throw new Error("Нет файлов для обработки.");
      }

      const generatedPdfUrl = doc.output('bloburl');
      setPdfUrl(generatedPdfUrl.toString());
      setStatus('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла неизвестная ошибка';
      console.error("Ошибка при обработке файлов:", errorMessage);
      setError(errorMessage);
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    if(pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    setPdfUrl(null);
  }, [pdfUrl]);

  return { processFiles, status, error, pdfUrl, reset };
};