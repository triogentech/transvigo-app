import { useEffect, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize, fontWeight, radius, spacing, useColors } from '@/theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  height?: number;
}

export function BottomSheet({ visible, onClose, title, children, height }: BottomSheetProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const sheetH = height ?? Math.min(screenH * 0.6, 520);
  const hiddenY = sheetH + insets.bottom + 60;
  const translateY = useSharedValue(hiddenY);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : hiddenY, { duration: 220 });
  }, [visible, hiddenY, translateY]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 90) {
        translateY.value = withTiming(hiddenY, { duration: 180 });
        runOnJS(onClose)();
      } else {
        translateY.value = withTiming(0, { duration: 180 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.fill}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: c.bgSurface,
                paddingBottom: insets.bottom + spacing.lg,
                maxHeight: screenH * 0.9,
              },
              sheetStyle,
            ]}
          >
            <View style={[styles.handle, { backgroundColor: c.border }]} />
            {title ? <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text> : null}
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginBottom: spacing.md },
});
