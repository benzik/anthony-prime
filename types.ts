
export enum UploadZoneKey {
  DIAGNOCAT_SEGMENTATION = 'DIAGNOCAT_SEGMENTATION',
  MEDITLINK_SCANS = 'MEDITLINK_SCANS',
  DIAGNOCAT_RADIOLOGICAL = 'DIAGNOCAT_RADIOLOGICAL',
  CEPHALOMETRIC_ANALYSIS = 'CEPHALOMETRIC_ANALYSIS',
}

export interface FileWithPreview extends File {
  preview: string;
}

export type ProcessingStatus = 'idle' | 'processing' | 'success' | 'error';

export interface CropConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}