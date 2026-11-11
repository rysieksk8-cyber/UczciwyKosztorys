import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from './theme';

// Matte workshop paper: restrained borders, soft depth, readable headings.
export const paperStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  iconTile: {
    width: spacing.xxl, height: spacing.xxl, borderRadius: radius.sm,
    backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center',
  },
  sectionHeading: {
    color: colors.text, fontSize: typography.section, fontWeight: '600',
    lineHeight: 26, includeFontPadding: false, flexShrink: 1,
  },
  hero: {
    backgroundColor: colors.primaryDark, borderRadius: radius.lg,
    padding: spacing.lg, gap: spacing.md,
  },
});

