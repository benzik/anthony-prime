
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import type { FileWithPreview } from '../types';

interface UploadZoneProps {
  title: string;
  onFilesAdded: (files: FileWithPreview[]) => void;
  onFileRemoved: (fileName: string) => void;
  files: FileWithPreview[];
  acceptedFileTypes: { [key: string]: string[] };
  isDisabled?: boolean;
  supportsPaste?: boolean;
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const UploadIcon = () => (
    <svg className="w-12 h-12 mx-auto text-slate-500 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12v9m-4-4l4-4 4 4"></path>
    </svg>
);

const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);


const UploadZone: React.FC<UploadZoneProps> = ({ title, onFilesAdded, onFileRemoved, files, acceptedFileTypes, isDisabled = false, supportsPaste = false, isHovered = false, onMouseEnter, onMouseLeave }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (isDisabled) return;
    const filesWithPreview = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }));
    onFilesAdded(filesWithPreview);
  }, [onFilesAdded, isDisabled]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    disabled: isDisabled,
  });

  const handleRemoveClick = (event: React.MouseEvent, fileName: string) => {
    event.stopPropagation();
    onFileRemoved(fileName);
  };

  const fileList = files.map(file => (
    <div key={file.name} className="flex items-center justify-between p-2.5 bg-slate-700/50 rounded-lg text-sm transition-colors hover:bg-slate-700">
      <div className="flex items-center gap-3 overflow-hidden">
        <FileIcon />
        <span className="truncate text-slate-300" title={file.name}>{file.name}</span>
      </div>
      <button onClick={(e) => handleRemoveClick(e, file.name)} className="p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800">
        <TrashIcon />
      </button>
    </div>
  ));

  return (
    <div 
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`relative group flex flex-col p-6 bg-slate-800/70 border border-slate-700 rounded-xl shadow-lg transition-all duration-300
        ${isDragActive || (isHovered && supportsPaste) ? 'border-blue-500 scale-105 shadow-blue-500/20' : ''} 
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-600 hover:shadow-2xl'}`}
    >
      <h3 className="text-base font-semibold text-slate-200 mb-4 text-center">{title}</h3>
      <div {...getRootProps()} className="flex-grow flex flex-col justify-center items-center cursor-pointer rounded-lg border-2 border-dashed border-slate-600 p-4 transition-colors hover:border-slate-500">
        <input {...getInputProps()} />
        {files.length === 0 ? (
          <div className="text-center">
            <UploadIcon/>
            <p className="mt-2 text-sm text-slate-400">
              <span className="font-semibold text-blue-500">Нажмите для загрузки</span>
              { supportsPaste && isHovered ? ' или вставьте' : ' или перетащите' }
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {Object.keys(acceptedFileTypes).join(', ').replace(/image\//g, '').toUpperCase()}
            </p>
          </div>
        ) : (
          <div className="w-full h-full space-y-2 overflow-y-auto pr-1">{fileList}</div>
        )}
      </div>
       {isDisabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-xl">
          <span className="px-4 py-2 text-sm font-bold text-slate-300 bg-slate-700/50 rounded-full border border-slate-600">Функционал в разработке</span>
        </div>
      )}
    </div>
  );
};

export default UploadZone;
