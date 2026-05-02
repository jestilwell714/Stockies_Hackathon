import { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import type { WeeklyGraph } from '../data/types';
import { colors, fonts, graphPalette, spacing } from '../theme';
import { formatCurrency } from '../utils/format';
import { Avatar } from './Avatar';
import { Card } from './Card';

type SpendingGraphCardProps = {
  title: string;
  graph: WeeklyGraph;
  currentUserId?: string;
  compact?: boolean;
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
};

const chartHeight = 198;
const padding = 30;

export function SpendingGraphCard({
  title,
  graph,
  currentUserId,
  compact = false,
  onScrubStart,
  onScrubEnd,
}: SpendingGraphCardProps) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width - 64, 360);
  const plotWidth = chartWidth - padding * 2;
  const plotHeight = chartHeight - padding * 2;
  const visibleSeries = compact ? graph.series.slice(0, 4) : graph.series;
  const currentSeries = graph.series.find((line) => line.userId === currentUserId) ?? graph.series[0];
  const [selectedDayIndex, setSelectedDayIndex] = useState(graph.days.length - 1);
  const scrubStartX = useRef(0);
  const allAmounts = graph.series.flatMap((line) => line.points.map((point) => point.cumulativeAmount));
  const maxAmount = Math.max(80, ...allAmounts);

  const pointFor = (dayIndex: number, amount: number) => ({
    x: padding + (dayIndex * plotWidth) / Math.max(1, graph.days.length - 1),
    y: padding + (1 - amount / maxAmount) * plotHeight,
  });

  const updateSelectedDay = (locationX: number) => {
    const clampedX = Math.max(padding, Math.min(chartWidth - padding, locationX));
    const ratio = (clampedX - padding) / Math.max(1, plotWidth);
    const nextIndex = Math.round(ratio * (graph.days.length - 1));
    setSelectedDayIndex(Math.max(0, Math.min(graph.days.length - 1, nextIndex)));
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          scrubStartX.current = event.nativeEvent.locationX;
          onScrubStart?.();
          updateSelectedDay(scrubStartX.current);
        },
        onPanResponderMove: (_, gestureState) => updateSelectedDay(scrubStartX.current + gestureState.dx),
        onPanResponderRelease: () => onScrubEnd?.(),
        onPanResponderTerminate: () => onScrubEnd?.(),
      }),
    [chartWidth, graph.days.length, onScrubEnd, onScrubStart, plotWidth],
  );

  const selectedX = pointFor(selectedDayIndex, 0).x;
  const selectedDay = graph.days[selectedDayIndex];

  return (
    <Card style={styles.cardFill}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {currentSeries ? formatCurrency(currentSeries.points.at(-1)?.cumulativeAmount ?? 0) : '$0.00'} this week
          </Text>
        </View>
      </View>

      <View style={styles.selectedCard}>
        <Text style={styles.selectedDay}>{selectedDay}</Text>
        <View style={styles.selectedGrid}>
          {visibleSeries.map((line, index) => {
            const point = line.points[selectedDayIndex];
            const color = line.userId === currentUserId ? colors.mintStrong : graphPalette[index % graphPalette.length];
            return (
              <View key={line.userId} style={styles.selectedPerson}>
                <View style={[styles.selectedDot, { backgroundColor: color }]} />
                <Text numberOfLines={1} style={styles.selectedName}>
                  {line.userId === currentUserId ? 'You' : line.displayName}
                </Text>
                <Text style={styles.selectedAmount}>{formatCurrency(point.cumulativeAmount)}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View {...panResponder.panHandlers} style={[styles.chartWrap, { width: chartWidth, height: chartHeight }]}> 
        <Svg width={chartWidth} height={chartHeight}>
          {[0, 1, 2].map((index) => {
            const y = padding + (index * plotHeight) / 2;
            return (
              <Line
                key={index}
                x1={padding}
                x2={chartWidth - padding}
                y1={y}
                y2={y}
                stroke={colors.border}
                strokeWidth={1}
              />
            );
          })}
          <Rect
            fill="rgba(184, 242, 208, 0.18)"
            height={plotHeight}
            rx={10}
            width={plotWidth / Math.max(1, graph.days.length - 1)}
            x={Math.max(padding, selectedX - plotWidth / Math.max(1, graph.days.length - 1) / 2)}
            y={padding}
          />
          {visibleSeries.map((line, index) => {
            const color = line.userId === currentUserId ? colors.mintStrong : graphPalette[index % graphPalette.length];
            const points = line.points
              .map((point) => {
                const coordinate = pointFor(point.dayIndex, point.cumulativeAmount);
                return `${coordinate.x},${coordinate.y}`;
              })
              .join(' ');

            return (
              <Polyline
                key={line.userId}
                fill="none"
                points={points}
                stroke={color}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity={line.userId === currentUserId ? 1 : 0.55}
                strokeWidth={line.userId === currentUserId ? 5 : 3}
              />
            );
          })}
          <Line
            x1={selectedX}
            x2={selectedX}
            y1={padding - 2}
            y2={chartHeight - padding + 2}
            stroke={colors.green}
            strokeDasharray="4 5"
            strokeWidth={2}
          />
          {graph.days.map((day, index) => {
            const coordinate = pointFor(index, 0);
            return (
              <SvgText
                key={day}
                fill={index === selectedDayIndex ? colors.green : colors.muted}
                fontSize="11"
                fontWeight="700"
                textAnchor="middle"
                x={coordinate.x}
                y={chartHeight - 8}
              >
                {day.toUpperCase()}
              </SvgText>
            );
          })}
        </Svg>
        {visibleSeries.map((line) => {
          const point = line.points[selectedDayIndex];
          if (!point) return null;

          const coordinate = pointFor(point.dayIndex, point.cumulativeAmount);

          return (
            <View
              key={`avatar-${line.userId}`}
              style={[
                styles.graphAvatar,
                {
                  left: coordinate.x - 14,
                  top: coordinate.y - 14,
                  opacity: line.userId === currentUserId ? 1 : 0.88,
                },
              ]}
            >
              <Avatar name={line.displayName} uri={line.avatarUrl} color={line.avatarColor} size={28} />
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  cardFill: {
    minHeight: 374,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 21,
  },
  subtitle: {
    color: colors.textSoft,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    marginTop: 2,
  },
  selectedCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  selectedDay: {
    color: colors.text,
    fontFamily: fonts.headingSemi,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  selectedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  selectedPerson: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    minWidth: '47%',
  },
  selectedDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  selectedName: {
    color: colors.textSoft,
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
  },
  selectedAmount: {
    color: colors.text,
    fontFamily: fonts.bodySemi,
    fontSize: 10,
  },
  chartWrap: {
    alignSelf: 'center',
    position: 'relative',
  },
  graphAvatar: {
    position: 'absolute',
  },
});
