import React, { useState, useMemo, useEffect } from 'react';
import UploadZone from './components/UploadZone';
import { useFileProcessor } from './hooks/useFileProcessor';
import { UploadZoneKey, FileWithPreview } from './types';
import { ACCEPTED_IMAGE_TYPES, ACCEPTED_PDF_TYPES } from './constants';

const Header = () => (
    <header className="w-full bg-slate-900/80 backdrop-blur-sm sticky top-0 z-20 border-b border-slate-700/50 mb-8">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
                <svg className="w-10 h-10 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 15H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.364 5.63604C16.5771 3.84916 14.3338 2.89926 12 2.89926C9.66617 2.89926 7.42293 3.84916 5.63604 5.63604C3.84916 7.42293 2.89926 9.66617 2.89926 12C2.89926 14.3338 3.84916 16.5771 5.63604 18.364C7.42293 20.1508 9.66617 21.1007 12 21.1007C14.3338 21.1007 16.5771 20.1508 18.364 18.364C20.1508 16.5771 21.1007 14.3338 21.1007 12C21.1007 9.66617 20.1508 7.42293 18.364 5.63604Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                    <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Anthony Prime</h1>
                    <p className="text-sm text-slate-400">for Miladent Clinic</p>
                </div>
            </div>
        </div>
    </header>
);

const Spinner = () => (
     <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const App: React.FC = () => {
    const [files, setFiles] = useState<Record<UploadZoneKey, FileWithPreview[]>>({
        [UploadZoneKey.DIAGNOCAT_SEGMENTATION]: [],
        [UploadZoneKey.MEDITLINK_SCANS]: [],
        [UploadZoneKey.DIAGNOCAT_RADIOLOGICAL]: [],
        [UploadZoneKey.CEPHALOMETRIC_ANALYSIS]: [],
    });

    const { processFiles, status, error, pdfUrl, reset: resetProcessor } = useFileProcessor();

    const handleFilesAdded = (zone: UploadZoneKey) => (newFiles: FileWithPreview[]) => {
        setFiles(prev => ({
            ...prev,
            [zone]: [...prev[zone], ...newFiles]
        }));
    };

    const handleFileRemoved = (zone: UploadZoneKey) => (fileNameToRemove: string) => {
        setFiles(prev => ({
            ...prev,
            [zone]: prev[zone].filter(file => file.name !== fileNameToRemove)
        }));
    };

    const handleReset = () => {
        setFiles({
            [UploadZoneKey.DIAGNOCAT_SEGMENTATION]: [],
            [UploadZoneKey.MEDITLINK_SCANS]: [],
            [UploadZoneKey.DIAGNOCAT_RADIOLOGICAL]: [],
            [UploadZoneKey.CEPHALOMETRIC_ANALYSIS]: [],
        });
        resetProcessor();
    };

    const handleProcess = () => {
        processFiles(files);
    };

    const hasFilesToProcess = useMemo(() => 
        Object.values(files).some(fileList => fileList.length > 0), 
        [files]
    );

    useEffect(() => {
        return () => {
            Object.values(files).flat().forEach((file: FileWithPreview) => URL.revokeObjectURL(file.preview));
        };
    }, [files]);
    
    const actionButtonClasses = "inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800";
    const primaryButtonClasses = "text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 focus:ring-purple-500";
    const secondaryButtonClasses = "text-white bg-sky-600 hover:bg-sky-500 focus:ring-sky-500";
    const tertiaryButtonClasses = "text-slate-200 bg-slate-700 hover:bg-slate-600 focus:ring-slate-500";


    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <UploadZone 
                        title="Diagnocat отчет о сегментации (screenshots)"
                        onFilesAdded={handleFilesAdded(UploadZoneKey.DIAGNOCAT_SEGMENTATION)}
                        onFileRemoved={handleFileRemoved(UploadZoneKey.DIAGNOCAT_SEGMENTATION)}
                        files={files[UploadZoneKey.DIAGNOCAT_SEGMENTATION]}
                        acceptedFileTypes={ACCEPTED_IMAGE_TYPES}
                    />
                    <UploadZone 
                        title="MEDIT Link сканы (screenshots)"
                        onFilesAdded={handleFilesAdded(UploadZoneKey.MEDITLINK_SCANS)}
                        onFileRemoved={handleFileRemoved(UploadZoneKey.MEDITLINK_SCANS)}
                        files={files[UploadZoneKey.MEDITLINK_SCANS]}
                        acceptedFileTypes={ACCEPTED_IMAGE_TYPES}
                    />
                    <UploadZone 
                        title="Diagnocat рентгенологический отчет (pdf)"
                        onFilesAdded={handleFilesAdded(UploadZoneKey.DIAGNOCAT_RADIOLOGICAL)}
                        onFileRemoved={handleFileRemoved(UploadZoneKey.DIAGNOCAT_RADIOLOGICAL)}
                        files={files[UploadZoneKey.DIAGNOCAT_RADIOLOGICAL]}
                        acceptedFileTypes={ACCEPTED_PDF_TYPES}
                    />
                    <UploadZone 
                        title="Цефалометрический анализ (КТ от Diagnocat) (pdf)"
                        onFilesAdded={handleFilesAdded(UploadZoneKey.CEPHALOMETRIC_ANALYSIS)}
                        onFileRemoved={handleFileRemoved(UploadZoneKey.CEPHALOMETRIC_ANALYSIS)}
                        files={files[UploadZoneKey.CEPHALOMETRIC_ANALYSIS]}
                        acceptedFileTypes={ACCEPTED_PDF_TYPES}
                    />
                </div>

                <div className="bg-slate-800/70 p-6 rounded-xl shadow-lg border border-slate-700 text-center">
                    {status === 'idle' && (
                        <>
                            <button
                                onClick={handleProcess}
                                disabled={!hasFilesToProcess}
                                className={`${actionButtonClasses} ${hasFilesToProcess ? primaryButtonClasses : 'bg-slate-700 text-slate-500 cursor-not-allowed shadow-none hover:scale-100'}`}
                            >
                                Обработать и создать PDF
                            </button>
                             <p className="mt-3 text-sm text-slate-500">
                                {!hasFilesToProcess && "Кнопка станет активной после добавления файлов."}
                            </p>
                        </>
                    )}
                    {status === 'processing' && (
                        <button
                            disabled
                            className={`${actionButtonClasses} ${primaryButtonClasses} cursor-wait opacity-80`}
                        >
                            <Spinner />
                            <span className="ml-3">Обработка...</span>
                        </button>
                    )}
                    {status === 'error' && (
                         <div className="flex flex-col items-center gap-4">
                            <div className="flex items-center gap-3 text-red-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <p className="font-semibold text-lg">Ошибка: {error}</p>
                            </div>
                            <button onClick={handleReset} className={`${actionButtonClasses} ${tertiaryButtonClasses}`}>
                                Попробовать снова
                            </button>
                        </div>
                    )}
                     {status === 'success' && pdfUrl && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex items-center gap-3 text-green-400">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <p className="font-semibold text-lg">Документ успешно создан!</p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-4 mt-4">
                                <a
                                    href={pdfUrl}
                                    download="processed_document.pdf"
                                    className={`${actionButtonClasses} ${primaryButtonClasses}`}
                                >
                                    Сохранить PDF
                                </a>
                                <button
                                    onClick={() => window.open(pdfUrl, '_blank')}
                                    className={`${actionButtonClasses} ${secondaryButtonClasses}`}
                                >
                                    Отправить на печать
                                </button>
                                <button onClick={handleReset} className={`${actionButtonClasses} ${tertiaryButtonClasses}`}>
                                    Начать заново
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;