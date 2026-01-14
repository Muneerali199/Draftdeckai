import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 72, // 1 inch margins (72pt)
        fontSize: 11,
        fontFamily: 'Times-Roman',
        lineHeight: 1.5,
        color: '#000000',
    },
    section: {
        marginBottom: 20,
    },
    header: {
        marginBottom: 40,
    },
    bold: {
        fontFamily: 'Times-Bold', // Use standard PDF bold font
        fontWeight: 'bold',
    },
    date: {
        marginBottom: 20,
    },
    recipient: {
        marginBottom: 20,
    },
    subject: {
        fontFamily: 'Times-Bold',
        fontWeight: 'bold',
        marginBottom: 20,
    },
    paragraph: {
        marginBottom: 12,
        textAlign: 'justify',
    },
    listItem: {
        flexDirection: 'row',
        marginBottom: 5,
        paddingLeft: 10,
    },
    bullet: {
        width: 10,
    },
    listContent: {
        flex: 1,
    },
});

interface LetterPdfProps {
    letter: {
        from?: { name?: string; address?: string };
        to?: { name?: string; address?: string };
        date?: string;
        subject?: string;
        content?: string;
    };
}

// This is a simple parser that toggles bold on encountering `**` markers.
// Note: It does not implement full markdown semantics (e.g., nested bold),
// but avoids fragile regex-based splitting.
const renderStyledText = (text: string) => {
    if (!text) return null;
    const elements: React.ReactElement[] = [];
    let buffer = '';
    let isBold = false;
    let key = 0;
    for (let i = 0; i < text.length; i++) {
        // Detect bold marker `**`
        if (text[i] === '*' && text[i + 1] === '*') {
            // Flush current buffer as a Text node with the current style
            if (buffer) {
                elements.push(
                    <Text key={key++} style={isBold ? styles.bold : undefined}>
                        {buffer}
                    </Text>
                );
                buffer = '';
            }
            // Toggle bold state and skip the second '*'
            isBold = !isBold;
            i++; // Skip next '*'
        } else {
            buffer += text[i];
        }
    }
    // Flush any remaining buffer
    if (buffer) {
        elements.push(
            <Text key={key++} style={isBold ? styles.bold : undefined}>
                {buffer}
            </Text>
        );
    }
    return elements;
};

// Helper to parse content into blocks (paragraphs and lists)
const parseContent = (content: string) => {
    const lines = content.split('\n');
    const blocks: { type: 'paragraph' | 'list'; items: string[] }[] = [];
    let currentList: string[] = [];

    lines.forEach((line) => {
        const trimmed = line.trim();
        // Check for list items (starting with * or -)
        const isList = trimmed.startsWith('* ') || trimmed.startsWith('- ');

        if (isList) {
            currentList.push(trimmed.replace(/^[\*\-]\s+/, ''));
        } else {
            // If we were building a list, push it now
            if (currentList.length > 0) {
                blocks.push({ type: 'list', items: currentList });
                currentList = [];
            }
            // Treat each non-empty line as a separate paragraph to preserve explicit line breaks in letters.
            if (trimmed) {
                blocks.push({ type: 'paragraph', items: [trimmed] });
            }
        }
    });

    // Push remaining list if any
    if (currentList.length > 0) {
        blocks.push({ type: 'list', items: currentList });
    }

    return blocks;
};

export const LetterPdf = ({ letter }: LetterPdfProps) => {
    const from = letter.from || {};
    const to = letter.to || {};
    const date = letter.date || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const parsedBlocks = parseContent(letter.content || '');

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Sender Info */}
                <View style={styles.header}>
                    {from.name ? <Text style={styles.bold}>{from.name}</Text> : null}
                    {from.address ? <Text>{from.address}</Text> : null}
                </View>

                {/* Date */}
                <View style={styles.date}>
                    <Text>{date}</Text>
                </View>

                {/* Recipient Info */}
                <View style={styles.recipient}>
                    {to.name ? <Text style={styles.bold}>{to.name}</Text> : null}
                    {to.address ? <Text>{to.address}</Text> : null}
                </View>

                {/* Subject */}
                {letter.subject ? (
                    <View style={styles.subject}>
                        <Text>Subject: {letter.subject}</Text>
                    </View>
                ) : null}

                {/* Content */}
                <View>
                    {parsedBlocks.map((block, i) => {
                        if (block.type === 'list') {
                            return (
                                <View key={i} style={styles.section}>
                                    {block.items.map((item, j) => (
                                        <View key={j} style={styles.listItem}>
                                            <Text style={styles.bullet}>•</Text>
                                            <Text style={styles.listContent}>{renderStyledText(item)}</Text>
                                        </View>
                                    ))}
                                </View>
                            );
                        } else {
                            // Paragraph
                            return (
                                <View key={i} style={styles.paragraph}>
                                    <Text>{renderStyledText(block.items[0])}</Text>
                                </View>
                            );
                        }
                    })}
                </View>
            </Page>
        </Document>
    );
};
