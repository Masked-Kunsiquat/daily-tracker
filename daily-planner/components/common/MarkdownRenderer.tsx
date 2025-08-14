// daily-planner/components/common/MarkdownRenderer.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/styles/colors';
import { Typography } from '@/styles/typography';
import { Spacing } from '@/styles/spacing';

interface MarkdownRendererProps {
  content: string;
  style?: any;
}

interface ParsedElement {
  type: 'heading1' | 'heading2' | 'heading3' | 'bold' | 'bullet' | 'paragraph' | 'spacing';
  content?: string;
  level?: number;
}

const parseMarkdown = (content: string): ParsedElement[] => {
  const lines = content.split('\n');
  const elements: ParsedElement[] = [];

  for (const line of lines) {
    if (line.startsWith('# ')) {
      elements.push({
        type: 'heading1',
        content: line.replace('# ', '').trim(),
      });
    } else if (line.startsWith('## ')) {
      elements.push({
        type: 'heading2',
        content: line.replace('## ', '').trim(),
      });
    } else if (line.startsWith('### ')) {
      elements.push({
        type: 'heading3',
        content: line.replace('### ', '').trim(),
      });
    } else if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      elements.push({
        type: 'bold',
        content: line.replace(/^\*\*|\*\*$/g, '').trim(),
      });
    } else if (line.startsWith('• ') || line.startsWith('- ')) {
      elements.push({
        type: 'bullet',
        content: line.replace(/^[•-] /, '').trim(),
      });
    } else if (line.trim() === '') {
      elements.push({ type: 'spacing' });
    } else if (line.trim()) {
      // Handle inline bold formatting within paragraphs
      elements.push({
        type: 'paragraph',
        content: line.trim(),
      });
    }
  }

  return elements;
};

const renderInlineFormatting = (text: string, key: string): React.JSX.Element => {
  // Handle inline bold text **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  
  return (
    <Text key={key} style={styles.paragraph}>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={index} style={styles.inlineBold}>
              {part.replace(/\*\*/g, '')}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  style,
}) => {
  const elements = parseMarkdown(content);

  return (
    <View style={[styles.container, style]}>
      {elements.map((element, index) => {
        const key = `element-${index}`;
        
        switch (element.type) {
          case 'heading1':
            return (
              <Text key={key} style={styles.heading1}>
                {element.content}
              </Text>
            );
            
          case 'heading2':
            return (
              <Text key={key} style={styles.heading2}>
                {element.content}
              </Text>
            );
            
          case 'heading3':
            return (
              <Text key={key} style={styles.heading3}>
                {element.content}
              </Text>
            );
            
          case 'bold':
            return (
              <Text key={key} style={styles.bold}>
                {element.content}
              </Text>
            );
            
          case 'bullet':
            return (
              <View key={key} style={styles.bulletContainer}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{element.content}</Text>
              </View>
            );
            
          case 'spacing':
            return <View key={key} style={styles.spacing} />;
            
          case 'paragraph':
            return renderInlineFormatting(element.content || '', key);
            
          default:
            return null;
        }
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  heading1: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginVertical: Spacing.sm,
    lineHeight: Typography.sizes.xl * 1.2,
  },
  heading2: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    lineHeight: Typography.sizes.lg * 1.3,
  },
  heading3: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    lineHeight: Typography.sizes.md * 1.4,
  },
  bold: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginVertical: Spacing.xs,
    lineHeight: Typography.sizes.md * Typography.lineHeights.normal,
  },
  paragraph: {
    fontSize: Typography.sizes.md,
    color: Colors.text,
    lineHeight: Typography.sizes.md * Typography.lineHeights.normal,
    marginVertical: Spacing.xs,
  },
  inlineBold: {
    fontWeight: Typography.weights.bold,
  },
  bulletContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: Spacing.xs,
    paddingLeft: Spacing.sm,
  },
  bullet: {
    fontSize: Typography.sizes.md,
    color: Colors.primary,
    marginRight: Spacing.sm,
    width: 12,
    lineHeight: Typography.sizes.md * Typography.lineHeights.normal,
  },
  bulletText: {
    fontSize: Typography.sizes.md,
    color: Colors.text,
    flex: 1,
    lineHeight: Typography.sizes.md * Typography.lineHeights.normal,
  },
  spacing: {
    height: Spacing.sm,
  },
});