import { useEffect } from 'react';
import type { DimensionValue } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { radius as r, useColors } from '@/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = r.sm, style }: SkeletonProps) {
  const c = useColors();
  const shimmer = useSharedValue(0.4);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(0.9, { duration: 800 }), -1, true);
    return () => cancelAnimation(shimmer);
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: shimmer.value }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: c.bgSunken }, animatedStyle, style]}
    />
  );
}
