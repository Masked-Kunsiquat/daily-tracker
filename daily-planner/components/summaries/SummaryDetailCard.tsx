// daily-planner/components/summaries/SummaryDetailCard.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Card, IconButton, Button, Badge, MarkdownRenderer } from '../common';
import { Summary } from '@/lib/database';
import { formatDateRange } from '@/utils/dateRange';
import { getRatingColor } from '@/utils/ratingHelpers'; // Why: Reuse shared helper, avoid duplication
import { Colors } from '@/styles/colors';
import { Typography } from '@/styles/typography';
import { Spacing } from '@/styles/spacing';

interface SummaryDetailCardProps {
  summary: Summary;
  onShare: () => void;
}

export const SummaryDetailCard: React.FC<SummaryDetailCardProps> = ({
  summary,
  onShare,
}) => {
  const [showFullContent, setShowFullContent] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const dateRange = formatDateRange(summary.start_date, summary.end_date);
  const contentPreview = summary.content.substring(0, 300);
  const isLongContent = summary.content.length > 300;

  return (
    <>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.dateRange}>{dateRange}</Text>
            {summary.created_at && !isNaN(Date.parse(summary.created_at)) && (
              <Text style={styles.createdAt}>
                Created {new Date(summary.created_at).toLocaleDateString()}
              </Text>
            )}
          </View>
          <IconButton
            icon="📤"
            onPress={onShare}
            size="small"
            label="Share summary"
          />
        </View>

        {/* Insights Summary */}
        <View style={styles.insights}>
          <Text style={styles.insightsTitle}>Key Insights</Text>
          
          <View style={styles.ratings}>
            <View style={styles.ratingItem}>
              <Text style={styles.ratingLabel}>Productivity</Text>
              <View style={[
                styles.ratingBadge, 
                { backgroundColor: getRatingColor(summary.insights.productivity_trend) }
              ]}>
                <Text style={styles.ratingValue}>
                  {summary.insights.productivity_trend.toFixed(1)}
                </Text>
              </View>
            </View>
            
            <View style={styles.ratingItem}>
              <Text style={styles.ratingLabel}>Mood</Text>
              <View style={[
                styles.ratingBadge, 
                { backgroundColor: getRatingColor(summary.insights.mood_trend) }
              ]}>
                <Text style={styles.ratingValue}>
                  {summary.insights.mood_trend.toFixed(1)}
                </Text>
              </View>
            </View>
            
            <View style={styles.ratingItem}>
              <Text style={styles.ratingLabel}>Energy</Text>
              <View style={[
                styles.ratingBadge, 
                { backgroundColor: getRatingColor(summary.insights.energy_trend) }
              ]}>
                <Text style={styles.ratingValue}>
                  {summary.insights.energy_trend.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>

          {summary.insights.key_themes.length > 0 && (
            <View style={styles.themes}>
              <Text style={styles.themesTitle}>Key Themes</Text>
              <View style={styles.themesContainer}>
                {summary.insights.key_themes.slice(0, 5).map((theme, index) => (
                  <Badge
                    key={index}
                    label={theme}
                    variant="neutral"
                    size="small"
                  />
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Content Preview */}
        <View style={styles.content}>
          <Text style={styles.contentTitle}>Summary</Text>
          
          <MarkdownRenderer 
            content={isExpanded ? summary.content : contentPreview}
            style={styles.markdownContent}
          />

          {isLongContent && (
            <View style={styles.contentActions}>
              <TouchableOpacity
                onPress={() => setIsExpanded(!isExpanded)}
                style={styles.expandButton}
              >
                <Text style={styles.expandButtonText}>
                  {isExpanded ? 'Show Less' : 'Show More'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setShowFullContent(true)}
                style={styles.fullViewButton}
              >
                <Text style={styles.fullViewButtonText}>Full View</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Card>

      {/* Full Content Modal */}
      <Modal
        visible={showFullContent}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{dateRange}</Text>
            <IconButton
              icon="✕"
              onPress={() => setShowFullContent(false)}
              size="medium"
            />
          </View>
          
          <ScrollView 
            style={styles.modalContent}
            contentContainerStyle={styles.modalScrollContent}
          >
            <MarkdownRenderer 
              content={summary.content}
              style={styles.markdownContent}
            />
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <Button
              title="Share"
              onPress={() => {
                setShowFullContent(false);
                onShare();
              }}
              variant="outline"
              style={styles.modalShareButton}
            />
            <Button
              title="Close"
              onPress={() => setShowFullContent(false)}
              style={styles.modalCloseButton}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  titleContainer: {
    flex: 1,
  },
  dateRange: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  createdAt: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },
  insights: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  insightsTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  ratings: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  ratingItem: {
    alignItems: 'center',
    flex: 1,
  },
  ratingLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  ratingBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textInverse,
  },
  themes: {
    marginTop: Spacing.md,
  },
  themesTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  themesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  content: {
    marginTop: Spacing.md,
  },
  contentTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  markdownContent: {
    marginVertical: Spacing.sm,
  },
  contentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  expandButton: {
    paddingVertical: Spacing.sm,
  },
  expandButtonText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
  fullViewButton: {
    paddingVertical: Spacing.sm,
  },
  fullViewButtonText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
  modal: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    flex: 1,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.lg,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  modalShareButton: {
    flex: 1,
  },
  modalCloseButton: {
    flex: 1,
  },
});
