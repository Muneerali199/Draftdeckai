'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompileErrorPopupProps {
    error: string | null;
    onClose: () => void;
}

export function CompileErrorPopup({ error, onClose }: CompileErrorPopupProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (error) {
            setIsVisible(true);
        }
    }, [error]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 200); // Wait for animation to complete
    };

    if (!error) return null;

    return (
        <div
            className={`fixed top-4 right-4 z-50 max-w-md transition-all duration-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                }`}
        >
            <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-red-800">
                            PDF Compilation Error
                        </h3>
                        <p className="mt-1 text-sm text-red-700 break-words">
                            {error}
                        </p>
                        <p className="mt-2 text-xs text-red-500">
                            Try fixing the LaTeX code and exporting again.
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-100"
                        onClick={handleClose}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
