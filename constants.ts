import { UploadZoneKey, CropConfig } from './types';

export const CROP_CONFIGS: Record<UploadZoneKey, CropConfig> = {
  [UploadZoneKey.DIAGNOCAT_SEGMENTATION]: { x: 326, y: 202, width: 1571, height: 807 },
  [UploadZoneKey.MEDITLINK_SCANS]: { x: 475, y: 179, width: 1367, height: 852 },
  [UploadZoneKey.DIAGNOCAT_RADIOLOGICAL]: { x: 0, y: 0, width: 0, height: 0 }, // Not used yet
  [UploadZoneKey.CEPHALOMETRIC_ANALYSIS]: { x: 0, y: 0, width: 0, height: 0 },  // Not used yet
};

export const ACCEPTED_IMAGE_TYPES = {
  'image/jpeg': [],
  'image/png': [],
  'image/webp': [],
};

export const ACCEPTED_PDF_TYPES = {
  'application/pdf': [],
};