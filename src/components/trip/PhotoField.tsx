import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { brand, fontSize, fontWeight, radius, spacing, useColors } from '@/theme';
import { showToast } from '@/store/toast.store';

interface Props {
  label: string;
  uri: string | null;
  onChange: (uri: string) => void;
  /** Also offer the gallery (for a document that was photographed earlier). */
  allowGallery?: boolean;
}

/** Take a photo with the camera (or pick one from the gallery) and show it. */
export function PhotoField({ label, uri, onChange, allowGallery }: Props) {
  const c = useColors();

  const camera = async (): Promise<void> => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      showToast({ type: 'error', message: 'Camera permission is needed to take the photo' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (!result.canceled && result.assets[0]) onChange(result.assets[0].uri);
  };
  const gallery = async (): Promise<void> => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!result.canceled && result.assets[0]) onChange(result.assets[0].uri);
  };

  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text>
      {uri ? (
        <View>
          <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
          <Pressable onPress={() => void camera()} style={[styles.retake, { backgroundColor: c.bgSurface, borderColor: c.border }]}>
            <Ionicons name="camera-reverse-outline" size={16} color={c.textPrimary} />
            <Text style={{ color: c.textPrimary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold }}>Retake</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: spacing.xs }}>
          <Pressable onPress={() => void camera()} style={[styles.btn, { borderColor: c.border, backgroundColor: c.bgSunken }]}>
            <Ionicons name="camera-outline" size={28} color={brand.teal} />
            <Text style={{ color: c.textPrimary, fontWeight: fontWeight.semibold }}>Take photo</Text>
          </Pressable>
          {allowGallery ? (
            <Pressable onPress={() => void gallery()} hitSlop={8}>
              <Text style={{ color: brand.teal, fontSize: fontSize.sm, fontWeight: fontWeight.semibold, textAlign: 'center' }}>Choose from gallery</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  btn: { height: 110, borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  photo: { width: '100%', height: 180, borderRadius: radius.lg },
  retake: { position: 'absolute', right: 8, bottom: 8, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1 },
});
