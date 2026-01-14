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

// Helper to render text with Bold formatting (**text**)
const renderStyledText = (text: string) => {
    if (!text) return null;

    // Split by bold markers (**...**)
    // matches: (**bold**) | (normal)
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            // Render bold content without markers
            return (
                <Text key={index} style={styles.bold}>
                    {part.slice(2, -2)}
                </Text>
            );
        }
        // Return normal text
        return <Text key={index}>{part}</Text>;
    });
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
            // If line is empty, it's a paragraph break.
            // If it has text, add as a paragraph (or merge with previous if desired? 
            // usually in markdown single newlines are soft, but for letters we often treat them as lines.
            // Let's treat non-empty lines as paragraphs for simplicity and clarity in letters)
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
