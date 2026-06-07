import { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface PulsingDotProps {
  color: string;
  pulse?: boolean;
  size?: number;
}

/** Small status dot; gently pulses opacity when `pulse` is set. */
export function PulsingDot({ color, pulse = false, size = 7 }: PulsingDotProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (pulse) {
      opacity.value = withRepeat(withTiming(0.25, { duration: 700 }), -1, true);
    } else {
      opacity.value = 1;
    }
    return () => cancelAnimation(opacity);
  }, [pulse, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color, marginRight: 5 },
        animatedStyle,
      ]}
    />
  );
}
