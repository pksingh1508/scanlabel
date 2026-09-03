import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Linking,
  Pressable,
  StyleSheet,
  View,
  type AppStateStatus,
} from 'react-native';
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
  type BarcodeType,
} from 'expo-camera';
import { useIsFocused } from 'expo-router';

import { BarcodeScanLock } from '@/lib/barcode/scan-lock';
import { layout, radius, spacing, useAppTheme } from '@/theme';

import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ThemedText } from '../ui/ThemedText';

const FOOD_BARCODE_TYPES: BarcodeType[] = ['ean13', 'ean8', 'upc_a', 'upc_e'];

type DetectedBarcode = {
  data: string;
  type: string;
};

type CameraFailure = 'permission_request' | 'camera_mount' | null;

function CameraMessage({
  title,
  message,
  actionTitle,
  onAction,
  busy = false,
}: {
  title: string;
  message: string;
  actionTitle?: string;
  onAction?: () => void;
  busy?: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <View accessibilityLiveRegion="polite" style={styles.message}>
      {busy ? <ActivityIndicator color={colors.cameraGuide} size="large" /> : null}
      <ThemedText
        accessibilityRole="header"
        style={[styles.centered, { color: colors.cameraText }]}
        variant="section">
        {title}
      </ThemedText>
      <ThemedText style={[styles.centered, { color: colors.cameraMutedText }]}>
        {message}
      </ThemedText>
      {actionTitle && onAction ? (
        <Button onPress={onAction} size="compact" title={actionTitle} />
      ) : null}
    </View>
  );
}

export function CameraScanner() {
  const { colors } = useAppTheme();
  const isFocused = useIsFocused();
  const [permission, requestPermission, refreshPermission] = useCameraPermissions();
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraFailure, setCameraFailure] = useState<CameraFailure>(null);
  const [cameraSession, setCameraSession] = useState(0);
  const [detectedBarcode, setDetectedBarcode] = useState<DetectedBarcode | null>(null);
  const scanLock = useRef(new BarcodeScanLock());
  const autoRequestAttempted = useRef(false);
  const previouslyFocused = useRef(isFocused);
  const cameraActive = isFocused && appState === 'active';

  const resetScanner = useCallback(() => {
    scanLock.current.reset();
    setDetectedBarcode(null);
  }, []);

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
    if (isFocused && !previouslyFocused.current) {
      resetScanner();
      void refreshPermission();
    }

    previouslyFocused.current = isFocused;
  }, [isFocused, refreshPermission, resetScanner]);

  useEffect(() => {
    if (
      isFocused &&
      permission?.status === 'undetermined' &&
      !autoRequestAttempted.current
    ) {
      autoRequestAttempted.current = true;
      requestPermission().catch(() => setCameraFailure('permission_request'));
    }
  }, [isFocused, permission?.status, requestPermission]);

  const handleBarcodeScanned = useCallback((result: BarcodeScanningResult) => {
    const data = result.data.trim();

    if (!data || !scanLock.current.tryLock()) {
      return;
    }

    setDetectedBarcode({ data, type: result.type });
  }, []);

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
    setCameraReady(false);
    setTorchEnabled(false);
    setCameraSession((value) => value + 1);
  }, []);

  if (!permission) {
    return (
      <View style={[styles.cameraFrame, { backgroundColor: colors.cameraSurface }]}>
        <CameraMessage
          busy
          message="Checking whether ScanLabel can use this device camera."
          title="Preparing camera"
        />
      </View>
    );
  }

  if (!permission.granted) {
    const canAskAgain = permission.canAskAgain;

    return (
      <View style={styles.container}>
        <View style={[styles.cameraFrame, { backgroundColor: colors.cameraSurface }]}>
          <CameraMessage
            actionTitle={canAskAgain ? 'Try camera access again' : 'Open settings'}
            message={
              canAskAgain
                ? 'Camera access is needed to scan a package label or barcode.'
                : 'Enable camera access for ScanLabel in your device settings, then return here.'
            }
            onAction={canAskAgain ? retryPermission : openSettings}
            title="Camera access needed"
          />
        </View>
        {cameraFailure === 'permission_request' ? (
          <ThemedText accessibilityLiveRegion="polite" muted style={styles.centered} variant="caption">
            We could not update camera access. Please try again or enable it manually in settings.
          </ThemedText>
        ) : null}
      </View>
    );
  }

  if (cameraFailure === 'camera_mount') {
    return (
      <View style={[styles.cameraFrame, { backgroundColor: colors.cameraSurface }]}>
        <CameraMessage
          actionTitle="Try camera again"
          message="The camera could not start. Close other camera apps and try again."
          onAction={retryCamera}
          title="Camera unavailable"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.cameraFrame, { backgroundColor: colors.cameraSurface }]}>
        {cameraActive ? (
          <CameraView
            accessibilityLabel="Live back camera for scanning food labels and barcodes"
            active={cameraActive}
            barcodeScannerSettings={{ barcodeTypes: FOOD_BARCODE_TYPES }}
            enableTorch={torchEnabled}
            facing="back"
            key={cameraSession}
            mode="picture"
            onBarcodeScanned={detectedBarcode ? undefined : handleBarcodeScanned}
            onCameraReady={() => setCameraReady(true)}
            onMountError={() => setCameraFailure('camera_mount')}
            style={StyleSheet.absoluteFill}
            testID="camera-view"
          />
        ) : (
          <CameraMessage
            busy
            message="The camera pauses whenever this screen is not active."
            title="Camera paused"
          />
        )}

        <View
          accessibilityElementsHidden
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.guideLayer]}>
          <View style={[styles.guide, { borderColor: colors.cameraGuide }]} />
        </View>

        {cameraActive ? (
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
        ) : null}

        <View pointerEvents="none" style={[styles.cameraInstruction, { backgroundColor: colors.cameraOverlay }]}>
          <ThemedText style={[styles.centered, { color: colors.cameraText }]} variant="captionStrong">
            {detectedBarcode ? 'Barcode captured' : 'Align a food barcode inside the guide'}
          </ThemedText>
        </View>
      </View>

      {detectedBarcode ? (
        <Card>
          <ThemedText accessibilityLiveRegion="polite" variant="bodyStrong">
            Barcode detected
          </ThemedText>
          <ThemedText muted>
            {detectedBarcode.data} · {detectedBarcode.type.toUpperCase()}
          </ThemedText>
          <ThemedText muted variant="caption">
            Product lookup will be connected in Step 4. Scanning is locked to prevent duplicate requests.
          </ThemedText>
          <Button onPress={resetScanner} size="compact" title="Scan again" variant="secondary" />
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  cameraFrame: {
    alignItems: 'center',
    aspectRatio: layout.cameraAspectRatio,
    borderCurve: 'continuous',
    borderRadius: radius.lg,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  message: {
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: layout.screenMaxWidth,
    padding: spacing.xl,
  },
  centered: {
    textAlign: 'center',
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
});
