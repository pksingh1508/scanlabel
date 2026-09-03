import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  View,
  type AppStateStatus,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useIsFocused } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ThemedText } from '@/components/ui/ThemedText';
import { MAX_SCAN_IMAGES, useScan, type ScanImageKind } from '@/state/scan-context';
import { layout, radius, spacing, useAppTheme } from '@/theme';

type PendingPreview = {
  uri: string;
  width?: number;
  height?: number;
};

type CameraFailure = 'permission_request' | 'camera_mount' | null;

function kindLabel(kind: ScanImageKind): string {
  return kind === 'ingredients' ? 'Ingredients / allergens' : 'Nutrition facts';
}

export default function CaptureScreen() {
  const { colors } = useAppTheme();
  const isFocused = useIsFocused();
  const { session, addImage, removeImage, clearImages } = useScan();

  const [permission, requestPermission, refreshPermission] = useCameraPermissions();
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraFailure, setCameraFailure] = useState<CameraFailure>(null);
  const [cameraSession, setCameraSession] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [pendingPreview, setPendingPreview] = useState<PendingPreview | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const cameraRef = useRef<CameraView | null>(null);
  const autoRequestAttempted = useRef(false);
  const cameraActive = isFocused && appState === 'active';

  const confirmedCount = session.images.length;
  const canCaptureMore = confirmedCount < MAX_SCAN_IMAGES;
  const nextKind: ScanImageKind = confirmedCount === 0 ? 'ingredients' : 'nutrition';
  const showCamera = cameraActive && !pendingPreview && canCaptureMore;
  const canContinue = confirmedCount >= 1 && !pendingPreview && !isCapturing;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setAppState(nextState);
      if (nextState === 'active') {
        void refreshPermission();
      }
    });
    return () => subscription.remove();
  }, [refreshPermission]);

  useEffect(() => {
    if (isFocused && permission?.status === 'undetermined' && !autoRequestAttempted.current) {
      autoRequestAttempted.current = true;
      requestPermission().catch(() => setCameraFailure('permission_request'));
    }
  }, [isFocused, permission?.status, requestPermission]);

  const takePhoto = useCallback(() => {
    if (isCapturing || pendingPreview || !canCaptureMore) return;
    const camera = cameraRef.current;
    if (!camera) {
      setCaptureError('The camera is not ready yet. Wait a moment and try again.');
      return;
    }
    setIsCapturing(true);
    setCaptureError(null);
    void camera
      .takePictureAsync({ quality: 1, base64: false, exif: false })
      .then((photo) => {
        if (!photo?.uri) {
          setCaptureError("We couldn't save that photo. Try again with better light.");
          return;
        }
        setPendingPreview({ uri: photo.uri, width: photo.width, height: photo.height });
      })
      .catch(() => {
        setCaptureError("We couldn't take that photo. Try again.");
      })
      .finally(() => {
        setIsCapturing(false);
      });
  }, [isCapturing, pendingPreview, canCaptureMore]);

  const discardPending = useCallback(() => {
    // Abandon the temporary file reference; no upload happened.
    setPendingPreview(null);
    setCaptureError(null);
  }, []);

  const confirmPending = useCallback(() => {
    if (!pendingPreview) return;
    const ok = addImage({ uri: pendingPreview.uri, kind: nextKind });
    if (!ok) {
      setCaptureError('Two photos is the maximum. Remove one to retake it.');
      return;
    }
    setPendingPreview(null);
    setCaptureError(null);
    setTorchEnabled(false);
  }, [pendingPreview, addImage, nextKind]);

  const handleCancel = useCallback(() => {
    // Abandon unconfirmed preview plus any confirmed photos for this attempt.
    setPendingPreview(null);
    setCaptureError(null);
    clearImages();
    router.back();
  }, [clearImages]);

  const handleContinue = useCallback(() => {
    if (!canContinue) return;
    router.push('/analyzing');
  }, [canContinue]);

  const retryPermission = useCallback(() => {
    setCameraFailure(null);
    requestPermission().catch(() => setCameraFailure('permission_request'));
  }, [requestPermission]);

  const openSettings = useCallback(() => {
    setCameraFailure(null);
    Linking.openSettings().catch(() => setCameraFailure('permission_request'));
  }, []);

  const retryCamera = useCallback(() => {
    setCameraFailure(null);
    setCaptureError(null);
    setCameraReady(false);
    setTorchEnabled(false);
    setCameraSession((value) => value + 1);
  }, []);

  if (!permission) {
    return (
      <Screen testID="capture-screen">
        <View style={[styles.cameraFrame, { backgroundColor: colors.cameraSurface }]}>
          <ActivityIndicator
            accessibilityLabel="Preparing camera"
            color={colors.cameraGuide}
            size="large"
          />
          <ThemedText style={{ color: colors.cameraMutedText }}>
            Preparing the camera for label photos.
          </ThemedText>
        </View>
      </Screen>
    );
  }

  if (!permission.granted) {
    const canAskAgain = permission.canAskAgain;
    return (
      <Screen scroll testID="capture-screen">
        <View style={styles.content}>
          <SectionHeading
            description="Camera access is needed to photograph the ingredients and nutrition panels."
            title="Photograph the package"
          />
          <View style={[styles.cameraFrame, { backgroundColor: colors.cameraSurface }]}>
            <ThemedText
              accessibilityRole="header"
              style={[styles.centered, { color: colors.cameraText }]}
              variant="section">
              Camera access needed
            </ThemedText>
            <ThemedText style={[styles.centered, { color: colors.cameraMutedText }]}>
              {canAskAgain
                ? 'Allow camera access to capture a readable label photo.'
                : 'Enable camera access for ScanLabel in your device settings, then return here.'}
            </ThemedText>
            <Button
              onPress={canAskAgain ? retryPermission : openSettings}
              size="compact"
              title={canAskAgain ? 'Try camera access again' : 'Open settings'}
            />
          </View>
          <Button onPress={() => router.back()} title="Cancel" variant="quiet" />
        </View>
      </Screen>
    );
  }

  if (cameraFailure === 'camera_mount') {
    return (
      <Screen scroll testID="capture-screen">
        <View style={styles.content}>
          <SectionHeading description="The camera could not start." title="Photograph the package" />
          <Card>
            <ThemedText>Close other camera apps and try again.</ThemedText>
            <Button onPress={retryCamera} size="compact" title="Try camera again" />
          </Card>
          <Button onPress={() => router.back()} title="Cancel" variant="quiet" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll testID="capture-screen">
      <View style={styles.content}>
        <SectionHeading
          description={
            confirmedCount === 0
              ? 'Photo 1 of 2: capture the ingredients / allergen panel.'
              : confirmedCount === 1
                ? 'Photo 2 of 2 (optional): capture the nutrition facts panel.'
                : 'Two photos saved. Review them below.'
          }
          title="Photograph the package"
        />

        {session.barcode ? (
          <Card>
            <ThemedText variant="bodyStrong">Barcode {session.barcode}</ThemedText>
            <ThemedText muted variant="caption">
              {session.offProduct?.productName || session.offProduct?.brand
                ? `${[session.offProduct.productName, session.offProduct.brand].filter(Boolean).join(' · ')} — label photos will supplement this database entry.`
                : 'Label photos will supplement this barcode.'}
            </ThemedText>
          </Card>
        ) : null}

        {pendingPreview ? (
          <Card>
            <ThemedText accessibilityLiveRegion="polite" variant="bodyStrong">
              Check this photo
            </ThemedText>
            <ThemedText muted variant="caption">
              Make sure the {kindLabel(nextKind).toLowerCase()} text is sharp and fully visible before
              using it.
            </ThemedText>
            <Image
              accessibilityLabel={`Preview of ${kindLabel(nextKind)} photo`}
              resizeMode="contain"
              source={{ uri: pendingPreview.uri }}
              style={styles.previewImage}
            />
            <View style={styles.row}>
              <Button onPress={discardPending} size="compact" title="Retake" variant="secondary" />
              <Button
                accessibilityHint={`Saves this photo as ${kindLabel(nextKind)}`}
                onPress={confirmPending}
                size="compact"
                title="Use photo"
              />
            </View>
          </Card>
        ) : showCamera ? (
          <View style={[styles.cameraFrame, { backgroundColor: colors.cameraSurface }]}>
            <CameraView
              accessibilityLabel="Live back camera for photographing the food label"
              active={cameraActive}
              enableTorch={torchEnabled}
              facing="back"
              key={cameraSession}
              mode="picture"
              onCameraReady={() => setCameraReady(true)}
              onMountError={() => setCameraFailure('camera_mount')}
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              testID="label-camera-view"
            />
            <View
              accessibilityElementsHidden
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, styles.guideLayer]}>
              <View style={[styles.guide, { borderColor: colors.cameraGuide }]} />
            </View>
            <Pressable
              accessibilityHint="Uses the device light to reduce shadows on the label"
              accessibilityLabel={torchEnabled ? 'Turn torch off' : 'Turn torch on'}
              accessibilityRole="switch"
              accessibilityState={{ checked: torchEnabled, disabled: !cameraReady }}
              disabled={!cameraReady}
              onPress={() => setTorchEnabled((value) => !value)}
              style={({ pressed }) => [
                styles.torchButton,
                {
                  backgroundColor: colors.cameraOverlay,
                  borderColor: colors.cameraGuide,
                  opacity: cameraReady ? (pressed ? 0.7 : 1) : 0.45,
                },
              ]}>
              <ThemedText style={{ color: colors.cameraText }} variant="captionStrong">
                {torchEnabled ? 'Torch on' : 'Torch off'}
              </ThemedText>
            </Pressable>
            <View
              pointerEvents="none"
              style={[styles.cameraInstruction, { backgroundColor: colors.cameraOverlay }]}>
              <ThemedText
                style={[styles.centered, { color: colors.cameraText }]}
                variant="captionStrong">
                Fill the frame with the {kindLabel(nextKind).toLowerCase()}
              </ThemedText>
            </View>
          </View>
        ) : !canCaptureMore ? null : (
          <View style={[styles.cameraFrame, { backgroundColor: colors.cameraSurface }]}>
            <ActivityIndicator color={colors.cameraGuide} size="large" />
            <ThemedText style={{ color: colors.cameraMutedText }}>Camera paused</ThemedText>
          </View>
        )}

        {captureError ? (
          <ThemedText accessibilityLiveRegion="polite" variant="caption">
            {captureError}
          </ThemedText>
        ) : null}

        {showCamera ? (
          <Button
            accessibilityHint={`Takes a photo of the ${kindLabel(nextKind)}`}
            disabled={!cameraReady || isCapturing}
            loading={isCapturing}
            onPress={takePhoto}
            title={isCapturing ? 'Capturing…' : `Capture ${kindLabel(nextKind).toLowerCase()}`}
          />
        ) : null}

        <Card>
          <ThemedText variant="bodyStrong">Get a readable scan</ThemedText>
          <ThemedText muted>
            Fill the frame with the label. Keep text in focus. Avoid glare. Make sure calories and
            serving size are visible. Capture ingredients separately if needed.
          </ThemedText>
        </Card>

        {confirmedCount > 0 ? (
          <Card>
            <ThemedText variant="bodyStrong">
              {confirmedCount} of {MAX_SCAN_IMAGES} photos saved
            </ThemedText>
            {session.images.map((image, index) => (
              <View key={`${image.uri}-${index}`} style={styles.savedRow}>
                <Image
                  accessibilityLabel={`${kindLabel(image.kind)} photo ${index + 1}`}
                  source={{ uri: image.uri }}
                  style={styles.thumbnail}
                />
                <View style={styles.savedMeta}>
                  <ThemedText variant="bodyStrong">
                    Photo {index + 1}: {kindLabel(image.kind)}
                  </ThemedText>
                  <ThemedText muted variant="caption">
                    Saved for this scan only.
                  </ThemedText>
                </View>
                <Button
                  accessibilityHint={`Removes photo ${index + 1}`}
                  onPress={() => removeImage(index)}
                  size="compact"
                  title="Remove"
                  variant="secondary"
                />
              </View>
            ))}
            {confirmedCount === 1 ? (
              <ThemedText muted variant="caption">
                One photo saved. If ingredients and nutrition are on different sides, add the second
                photo above.
              </ThemedText>
            ) : null}
          </Card>
        ) : null}

        <Button
          accessibilityHint="Continues with the saved label photos"
          disabled={!canContinue}
          onPress={handleContinue}
          title={
            confirmedCount === 0
              ? 'Capture a photo to continue'
              : confirmedCount === 1
                ? 'Continue with 1 photo'
                : 'Continue with 2 photos'
          }
        />
        <Button
          accessibilityHint="Discards saved photos and returns to the scanner"
          onPress={handleCancel}
          title="Cancel"
          variant="quiet"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.md,
  },
  centered: {
    textAlign: 'center',
  },
  cameraFrame: {
    alignItems: 'center',
    aspectRatio: layout.cameraAspectRatio,
    borderCurve: 'continuous',
    borderRadius: radius.lg,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  guideLayer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  guide: {
    aspectRatio: layout.scanGuideAspectRatio,
    borderCurve: 'continuous',
    borderRadius: radius.md,
    borderStyle: 'dashed',
    borderWidth: layout.guideBorderWidth,
    width: layout.scanGuideWidth,
  },
  torchButton: {
    borderCurve: 'continuous',
    borderRadius: radius.pill,
    borderWidth: layout.borderWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    position: 'absolute',
    right: layout.cameraControlInset,
    top: layout.cameraControlInset,
  },
  cameraInstruction: {
    borderCurve: 'continuous',
    borderRadius: radius.pill,
    bottom: layout.cameraControlInset,
    left: layout.cameraControlInset,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    position: 'absolute',
    right: layout.cameraControlInset,
  },
  previewImage: {
    aspectRatio: layout.cameraAspectRatio,
    borderRadius: radius.md,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  savedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  savedMeta: {
    flex: 1,
    gap: spacing.xxs,
  },
  thumbnail: {
    borderRadius: radius.sm,
    height: 64,
    width: 64,
  },
});
