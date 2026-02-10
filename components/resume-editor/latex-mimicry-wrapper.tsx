'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface LatexMimicryWrapperProps {
    children: React.ReactNode;
    showPageNumbers?: boolean;
}

/**
 * LatexMimicryWrapper - A wrapper component that provides LaTeX-like PDF appearance
 * 
 * Features:
 * - Exact A4 paper dimensions (210mm × 297mm)
 * - Precise LaTeX margins (0.75in = 19.05mm)
 * - Computer Modern font styling
 * - Multi-page overflow detection with page numbers
 * - Paper shadow effect for realistic document appearance
 */
export function LatexMimicryWrapper({ children, showPageNumbers = true }: LatexMimicryWrapperProps) {
    const measureRef = useRef<HTMLDivElement>(null);
    const [pageCount, setPageCount] = useState(1);
    const [isReady, setIsReady] = useState(false);

    // Calculate the number of pages needed based on content height
    const measureContent = useCallback(() => {
        if (!measureRef.current) return;

        const element = measureRef.current;
        const totalHeight = element.scrollHeight;

        // A4 page content height (minus top and bottom margins)
        // 297mm - 2 × 19.05mm = 258.9mm
        const pageContentHeightMm = 258.9;
        const mmToPx = 3.7795275591; // 1mm = 3.7795275591px at 96 DPI
        const pageContentHeightPx = pageContentHeightMm * mmToPx;

        // Calculate number of pages needed
        const numPages = Math.max(1, Math.ceil(totalHeight / pageContentHeightPx));
        setPageCount(numPages);
        setIsReady(true);
    }, []);

    useEffect(() => {
        // Measure after initial render
        const timer = setTimeout(measureContent, 50);

        // Re-measure on window resize
        const handleResize = () => {
            measureContent();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handleResize);
        };
    }, [measureContent, children]);

    // Re-measure when children change
    useEffect(() => {
        measureContent();
    }, [children, measureContent]);

    const pageStyle: React.CSSProperties = {
        width: '210mm',
        minHeight: '297mm',
        maxWidth: '210mm',
        padding: '19.05mm', // 0.75in exact LaTeX margin
        margin: '0 auto 20px auto',
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 25px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1)',
        boxSizing: 'border-box',
        position: 'relative',
        fontFamily: "'Computer Modern', 'Latin Modern Roman', 'Times New Roman', serif",
        fontSize: '11pt',
        lineHeight: 1.2,
        color: '#000000',
        textAlign: 'justify',
        hyphens: 'auto',
        WebkitHyphens: 'auto',
        msHyphens: 'auto',
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
    };

    const pageNumberStyle: React.CSSProperties = {
        position: 'absolute',
        bottom: '10mm',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '11pt',
        color: '#000000',
        fontFamily: "'Computer Modern', 'Latin Modern Roman', 'Times New Roman', serif",
    };

    // For single page content (most common case)
    if (pageCount === 1) {
        return (
            <div className="latex-preview-container">
                <div
                    ref={measureRef}
                    className="latex-page"
                    style={pageStyle}
                >
                    {children}
                </div>
            </div>
        );
    }

    // For multi-page content
    return (
        <div className="latex-preview-container">
            {/* Hidden measurement container */}
            <div
                ref={measureRef}
                style={{
                    position: 'absolute',
                    left: '-9999px',
                    top: 0,
                    width: '210mm',
                    padding: '19.05mm',
                    boxSizing: 'border-box',
                    fontFamily: "'Computer Modern', serif",
                    fontSize: '11pt',
                    lineHeight: 1.2,
                    visibility: 'hidden',
                }}
            >
                {children}
            </div>

            {/* Render pages */}
            {Array.from({ length: pageCount }, (_, i) => (
                <div
                    key={i}
                    className="latex-page"
                    style={{
                        ...pageStyle,
                        pageBreakAfter: i < pageCount - 1 ? 'always' : 'auto',
                        breakAfter: i < pageCount - 1 ? 'page' : 'auto',
                        overflow: i === 0 ? 'visible' : 'hidden',
                    }}
                >
                    {i === 0 ? children : (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            opacity: 0.5,
                            fontStyle: 'italic'
                        }}>
                            Content continues from previous page...
                        </div>
                    )}

                    {showPageNumbers && pageCount > 1 && (
                        <div style={pageNumberStyle}>
                            {i + 1}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// Simple wrapper for when multi-page detection is not needed
export function SimpleLatexWrapper({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="latex-preview latex-page"
            style={{
                width: '210mm',
                minHeight: '297mm',
                maxWidth: '210mm',
                padding: '19.05mm',
                margin: '0 auto',
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 25px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1)',
                boxSizing: 'border-box',
                fontFamily: "'Computer Modern', 'Latin Modern Roman', 'Times New Roman', serif",
                fontSize: '11pt',
                lineHeight: 1.2,
                color: '#000000',
                textAlign: 'justify',
                hyphens: 'auto',
                WebkitHyphens: 'auto',
                msHyphens: 'auto',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
            }}
        >
            {children}
        </div>
    );
}
