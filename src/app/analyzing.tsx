import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ui/ThemedText';
import { buildAnalyzeBody } from '@/lib/analysis/requestBody';
import { requestAnalysis } from '@/lib/analysis/client';
import { readFileAsBase64 } from '@/lib/image/readAsBase64';
import { useScan } from '@/state/scan-context';
import { layout, radius, spacing, useAppTheme } from '@/theme';

const STAGES = [
  { label: 'Reading label', state: 'complete' },
  { label: 'Checking nutrition', state: 'active' },
  { label: 'Explaining ingredients', state: 'waiting' },
] as const;

/**
 * Single analysis entry point for every pipeline path (barcode-complete,
 * barcode-incomplete, barcode-not-found, direct label). Runs the request once
 * per attempt, stores the validated result in scan state, and replaces to
 * /result — never holding analysis in local component state.
 */
export default function AnalyzingScreen() {
  const { colors } = useAppTheme();
  const {
    session,
    analysis,
    analysisError,
    updateFlow,
    setAnalysisResult,
    setAnalysisFailure,
    clearAnalysisError,
    resetScan,
  } = useScan();
  const [attempt, setAttempt] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (analysis) {
      router.replace('/result');
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    abortRef.current = controller;
    clearAnalysisError();
    updateFlow({ type: 'ANALYZE_START' });
    void (async () => {
      const built = await buildAnalyzeBody(
        { barcode: session.barcode, offProduct: session.offProduct, images: session.images },
        readFileAsBase64,
      );
      if (cancelled) return;
      if (!built.ok) {
        setAnalysisFailure({ code: 'rejected', message: built.message });
        return;
      }
      const result = await requestAnalysis(built.body, { signal: controller.signal });
      if (cancelled) return;
      if (result.ok) {
        setAnalysisResult(result.analysis);
        router.replace('/result');
      } else {
        setAnalysisFailure(result.error);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [attempt, session, analysis, updateFlow, setAnalysisResult, setAnalysisFailure, clearAnalysisError]);

  const handleRetry = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    router.back();
  }, []);

  const handleStartOver = useCallback(() => {
    resetScan();
    router.replace('/');
  }, [resetScan]);

  const running = !analysis && !analysisError;

  return (
    <Screen safeEdges={['bottom']} testID="analyzing-screen">
      <View style={styles.content}>
        <View style={styles.heading}>
          {running ? (
            <ActivityIndicator accessibilityLabel="Analysis in progress" color={colors.brand} size="large" />
          ) : null}
          <ThemedText accessibilityRole="header" style={styles.centered} variant="title">
            {running ? 'Making the label easier to understand' : 'Analysis hit a snag'}
          </ThemedText>
          <ThemedText accessibilityLiveRegion="polite" muted style={styles.centered}>
            {running
              ? 'This usually takes a moment. These stages summarize progress and may complete together.'
              : (analysisError?.message ?? 'Something went wrong.')}
          </ThemedText>
        </View>
        {running ? (
          <Card>
            {STAGES.map((stage) => {
              const isComplete = stage.state === 'complete';
              const isActive = stage.state === 'active';

              return (
                <View key={stage.label} style={styles.stage}>
                  <View
                    style={[
                      styles.stageMarker,
                      {
                        backgroundColor: isComplete || isActive ? colors.brandSoft : colors.surfaceSubtle,
                        borderColor: isComplete || isActive ? colors.brand : colors.border,
                      },
                    ]}>
                    <ThemedText
                      accessibilityElementsHidden
                      style={{ color: isComplete || isActive ? colors.brand : colors.textMuted }}
                      variant="captionStrong">
                      {isComplete ? '✓' : isActive ? '•' : '–'}
                    </ThemedText>
                  </View>
                  <ThemedText muted={!isComplete && !isActive} style={styles.stageLabel} variant="bodyStrong">
                    {stage.label}
                  </ThemedText>
                </View>
              );
            })}
          </Card>
        ) : null}
        <View style={styles.actions}>
          {running ? (
            <Button
              accessibilityHint="Cancels this analysis and goes back"
              onPress={handleCancel}
              title="Cancel"
              variant="quiet"
            />
          ) : (
            <>
              <Button
                accessibilityHint="Tries the analysis again with the same photos and data"
                onPress={handleRetry}
                title="Try again"
              />
              <Button
                accessibilityHint="Discards this scan and returns to the scanner"
                onPress={handleStartOver}
                title="Start over"
                variant="secondary"
              />
            </>
          )}
          {running ? (
            <ThemedText muted style={styles.centered} variant="caption">
              Sending only the current scan to the analysis service. Nothing is saved.
            </ThemedText>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.xl,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  heading: {
    alignItems: 'center',
    gap: spacing.md,
  },
  centered: {
    textAlign: 'center',
  },
  stage: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: layout.compactButtonMinHeight,
  },
  stageMarker: {
    alignItems: 'center',
    aspectRatio: 1,
    borderRadius: radius.pill,
    borderWidth: layout.borderWidth,
    justifyContent: 'center',
    padding: spacing.xs,
  },
  stageLabel: {
    flex: 1,
  },
  actions: {
    gap: spacing.sm,
  },
});
