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
import { router, useIsFocused } from 'expo-router';

import { BarcodeScanLock } from '@/lib/barcode/scan-lock';
import { fetchOffProduct } from '@/lib/open-food-facts/client';
import { evaluateProductCompleteness } from '@/lib/open-food-facts/normalize';
import type {
  NormalizedOffProduct,
  ProductCompleteness,
} from '@/lib/open-food-facts/types';
import { layout, radius, spacing, useAppTheme } from '@/theme';

import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ThemedText } from '../ui/ThemedText';

const FOOD_BARCODE_TYPES: BarcodeType[] = ['ean13', 'ean8', 'upc_a', 'upc_e'];

type DetectedBarcode = {
  data: string;
  type: string;
};

type LookupState =
  | { status: 'idle' }
  | { status: 'loading'; barcode: string }
  | { status: 'complete'; product: NormalizedOffProduct; completeness: ProductCompleteness }
  | { status: 'needs_label'; product: NormalizedOffProduct; missing: string[] }
  | { status: 'not_found'; barcode: string }
  | { status: 'not_food'; reason: string }
  | { status: 'error'; message: string };

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
  const [lookup, setLookup] = useState<LookupState>({ status: 'idle' });
  const scanLock = useRef(new BarcodeScanLock());
  const autoRequestAttempted = useRef(false);
  const previouslyFocused = useRef(isFocused);
  const lookupRequestId = useRef(0);
  const cameraActive = isFocused && appState === 'active';

  const resetScanner = useCallback(() => {
    lookupRequestId.current += 1;
    scanLock.current.reset();
    setDetectedBarcode(null);
    setLookup({ status: 'idle' });
  }, []);

  const runLookup = useCallback((barcode: string) => {
    const requestId = lookupRequestId.current + 1;
    lookupRequestId.current = requestId;
    setLookup({ status: 'loading', barcode });

    void fetchOffProduct(barcode)
      .then((result) => {
        if (lookupRequestId.current !== requestId) return;
        if (result.kind === 'error') {
          if (result.error.kind === 'not_found') {
            setLookup({ status: 'not_found', barcode });
            return;
          }
          setLookup({ status: 'error', message: result.error.userMessage });
          return;
        }

        const completeness = evaluateProductCompleteness(result.product);
        if (completeness.status === 'complete') {
          setLookup({ status: 'complete', product: result.product, completeness });
        } else if (completeness.status === 'needs_label') {
          setLookup({ status: 'needs_label', product: result.product, missing: completeness.missing });
        } else if (completeness.status === 'not_food') {
          setLookup({ status: 'not_food', reason: completeness.reason });
        } else {
          setLookup({ status: 'not_found', barcode });
        }
      })
      .catch(() => {
        if (lookupRequestId.current !== requestId) return;
        setLookup({
          status: 'error',
          message: 'The food database is unavailable right now. Try again or scan the label.',
        });
      });
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

  const handleBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      const data = result.data.trim();

      if (!data || !scanLock.current.tryLock()) {
        return;
      }

      setDetectedBarcode({ data, type: result.type });
      runLookup(data);
    },
    [runLookup],
  );

  const retryLookup = useCallback(() => {
    if (detectedBarcode) {
      runLookup(detectedBarcode.data);
    }
  }, [detectedBarcode, runLookup]);

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

          {lookup.status === 'loading' ? (
            <View style={styles.lookupRow}>
              <ActivityIndicator accessibilityLabel="Looking up barcode" />
              <ThemedText muted variant="caption">
                Looking up this barcode in the food database. One request per scan.
              </ThemedText>
            </View>
          ) : null}

          {lookup.status === 'complete' ? (
            <View style={styles.lookupDetails}>
              <ThemedText variant="bodyStrong">
                {[lookup.product.productName, lookup.product.brand].filter(Boolean).join(' · ') ||
                  'Product found'}
              </ThemedText>
              <ThemedText muted variant="caption">
                {[
                  lookup.product.servingSize ? `Serving: ${lookup.product.servingSize}` : null,
                  lookup.product.ingredientsText || lookup.product.ingredients.length > 0
                    ? `${lookup.product.ingredients.length || 'Some'} ingredients listed`
                    : null,
                  `${Object.keys(lookup.product.nutriments).length} nutrition values`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </ThemedText>
              <ThemedText muted variant="caption">
                Data ready. Full AI analysis arrives in a later step; no analysis is run yet.
              </ThemedText>
            </View>
          ) : null}

          {lookup.status === 'needs_label' ? (
            <View style={styles.lookupDetails}>
              <ThemedText variant="bodyStrong">
                {lookup.product.productName || lookup.product.brand || 'Product found, but incomplete'}
              </ThemedText>
              <ThemedText muted variant="caption">
                We found the product, but the nutrition information is incomplete
                {lookup.missing.length ? ` (missing: ${lookup.missing.join(', ')})` : ''}. Scan the
                nutrition panel.
              </ThemedText>
            </View>
          ) : null}

          {lookup.status === 'not_found' ? (
            <ThemedText muted variant="caption">
              This barcode isn&apos;t in our food data yet. Scan the label instead.
            </ThemedText>
          ) : null}

          {lookup.status === 'not_food' ? (
            <ThemedText muted variant="caption">
              {lookup.reason} This scanner covers packaged food and drinks only.
            </ThemedText>
          ) : null}

          {lookup.status === 'error' ? (
            <ThemedText muted variant="caption">
              {lookup.message}
            </ThemedText>
          ) : null}

          <View style={styles.lookupActions}>
            {lookup.status === 'error' ? (
              <Button onPress={retryLookup} size="compact" title="Try again" variant="secondary" />
            ) : null}
            {lookup.status === 'complete' ||
            lookup.status === 'needs_label' ||
            lookup.status === 'not_found' ||
            lookup.status === 'error' ? (
              <Button
                accessibilityHint="Opens the label photo screen"
                onPress={() => router.push('/capture')}
                size="compact"
                title="Scan label"
              />
            ) : null}
            <Button onPress={resetScanner} size="compact" title="Scan again" variant="quiet" />
          </View>
          <ThemedText muted variant="caption">
            Scanning stays locked until you scan again or return to this screen.
          </ThemedText>
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
  lookupRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  lookupDetails: {
    gap: spacing.xs,
  },
  lookupActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
