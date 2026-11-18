import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View, type ImageStyle, type StyleProp } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MAX_SCALE = 5;

function Viewer({ uri, onClose }: { uri: string; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const reset = (): void => {
    'worklet';
    scale.value = withTiming(1);
    savedScale.value = 1;
    tx.value = withTiming(0);
    ty.value = withTiming(0);
    savedTx.value = 0;
    savedTy.value = 0;
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(MAX_SCALE, Math.max(1, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1) reset();
    });
  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value <= 1) return;
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) reset();
      else {
        scale.value = withTiming(2.5);
        savedScale.value = 2.5;
      }
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  return (
    <GestureHandlerRootView style={styles.backdrop}>
      <GestureDetector gesture={Gesture.Simultaneous(pinch, pan, doubleTap)}>
        <Animated.View style={[styles.fill, style]}>
          <Image source={{ uri }} style={styles.fill} resizeMode="contain" />
        </Animated.View>
      </GestureDetector>
      <Pressable onPress={onClose} hitSlop={16} style={[styles.close, { top: insets.top + 12 }]} accessibilityLabel="Close image">
        <Ionicons name="close" size={26} color="#fff" />
      </Pressable>
      <Text style={[styles.hint, { bottom: insets.bottom + 16 }]}>Pinch or double-tap to zoom</Text>
    </GestureHandlerRootView>
  );
}

/** A thumbnail that opens full-screen with pinch / double-tap zoom and pan. */
export function ZoomableImage({ uri, style }: { uri: string; style?: StyleProp<ImageStyle> }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable onPress={() => setOpen(true)} accessibilityLabel="View image">
        <Image source={{ uri }} style={style} resizeMode="cover" />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Viewer uri={uri} onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000' },
  fill: { flex: 1, width: '100%', height: '100%' },
  close: { position: 'absolute', right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  hint: { position: 'absolute', alignSelf: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 12 },
});
