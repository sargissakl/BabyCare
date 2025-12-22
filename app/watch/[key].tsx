import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { spacing, borderRadius } from '@/constants/theme';
import { useState, useEffect, useRef } from 'react';
import { useAlert } from '@/template';
import { joinChannel, leaveChannel, muteRemoteAudio, cleanupAgora } from '@/services/agoraService';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withSpring,
  Easing
} from 'react-native-reanimated';

export default function WatchStreamScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const { colors, typography, shadows } = useTheme();
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0.3);


  const pulseAnim = useSharedValue(1);
  const waveAnim = useSharedValue(0);
  const audioBarAnim = useSharedValue(0);

  useEffect(() => {
    const update = () => setDimensions(Dimensions.get('window'));
    update();
    const sub = Dimensions.addEventListener('change', update);
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    if (!key) {
      setHasError(true);
      showAlert('Ongeldige Link', 'Deze stream link is niet geldig');
      return;
    }

    // Start listening (removed setIsListening(true) - now done after verification)
    const timer = setTimeout(() => {
      startListening();
    }, 1000);

    return () => {
      clearTimeout(timer);
      cleanupAgora();
    };
  }, [key]);

  const startListening = async () => {
    if (!key) {
      console.log('❌ No stream key provided');
      setHasError(true);
      showAlert('Fout', 'Geen stream code opgegeven');
      return;
    }

    // Validate stream key format (4 digits)
    const trimmedKey = (key as string).trim();
    if (!/^\d{4}$/.test(trimmedKey)) {
      console.log('❌ Invalid format:', trimmedKey);
      setHasError(true);
      showAlert('Ongeldige Code', 'Voer een geldige 4-cijferige code in');
      return;
    }

    console.log('🎧 Joining Agora channel:', trimmedKey);

    const result = await joinChannel(
      trimmedKey,
      (level) => {
        setAudioLevel(level);
      }
    );

    if (!result.success) {
      console.log('❌ Failed to join channel:', result.error);
      setHasError(true);
      showAlert('Stream Niet Gevonden', result.error || 'Kan niet verbinden met deze stream');
      return;
    }

    setIsListening(true);
    showAlert('Verbonden', '🎧 Real-time audio stream actief - je hoort de baby LIVE!');
  };

  useEffect(() => {
    if (isListening && !isMuted) {
      pulseAnim.value = withRepeat(
        withTiming(1.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      waveAnim.value = withRepeat(
        withTiming(1, { duration: 2500, easing: Easing.linear }),
        -1,
        false
      );
      audioBarAnim.value = withRepeat(
        withTiming(1, { duration: 600 }),
        -1,
        true
      );
    } else {
      pulseAnim.value = withSpring(1);
      waveAnim.value = 0;
      audioBarAnim.value = 0;
    }
  }, [isListening, isMuted]);

  const speakerSize = Math.max(1, Math.min(dimensions.width * 0.5, 200));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const waveStyle = useAnimatedStyle(() => ({
    opacity: 0.3 * (1 - waveAnim.value),
    transform: [{ scale: 1 + waveAnim.value * 0.5 }],
  }));

  const audioBarStyle = useAnimatedStyle(() => ({
    height: withSpring(20 + audioBarAnim.value * 80),
  }));

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingTop: insets.top + spacing.md,
      paddingHorizontal: spacing.md,
    },
    header: {
      marginBottom: spacing.lg,
    },
    title: {
      ...typography.title,
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.bodySmall,
    },
    listenerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
    },
    speakerWrapper: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xl,
    },
    waveCircle: {
      position: 'absolute',
      width: speakerSize * 1.8,
      height: speakerSize * 1.8,
      borderRadius: speakerSize * 0.9,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    speakerCircle: {
      width: speakerSize,
      height: speakerSize,
      borderRadius: speakerSize / 2,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.xl,
    },
    speakerCircleMuted: {
      backgroundColor: colors.surfaceVariant,
    },
    statusBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: colors.success,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      borderWidth: 3,
      borderColor: colors.background,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#FFFFFF',
    },
    statusText: {
      ...typography.caption,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    audioLevelContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.xs,
      height: 100,
      marginTop: spacing.lg,
    },
    audioBar: {
      width: 8,
      backgroundColor: colors.primary,
      borderRadius: borderRadius.sm,
    },
    audioLevelText: {
      ...typography.caption,
      marginTop: spacing.sm,
      color: colors.textSecondary,
    },
    controls: {
      gap: spacing.md,
      paddingVertical: spacing.lg,
    },
    controlButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.full,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      ...shadows.md,
    },
    controlButtonMuted: {
      backgroundColor: colors.surfaceVariant,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    controlButtonText: {
      ...typography.button,
      color: '#FFFFFF',
    },
    controlButtonTextMuted: {
      color: colors.primary,
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      ...shadows.sm,
    },
    infoTitle: {
      ...typography.subheading,
      marginBottom: spacing.sm,
    },
    infoText: {
      ...typography.bodySmall,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    streamId: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      marginTop: spacing.sm,
    },
    streamIdText: {
      ...typography.caption,
      fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
    },
    connectionStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      marginTop: spacing.lg,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.successLight,
      borderRadius: borderRadius.full,
      alignSelf: 'center',
    },
    connectionStatusText: {
      ...typography.caption,
      color: colors.success,
      fontWeight: '600',
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorText: {
      ...typography.body,
      color: colors.error,
      marginTop: spacing.md,
    },
  });

  if (hasError) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Audio Babyfoon</Text>
            <Text style={styles.subtitle}>Error</Text>
          </View>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color={colors.error} />
            <Text style={styles.errorText}>
              {key ? 'Stream niet gevonden of gestopt' : 'Ongeldige stream link'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Audio Babyfoon</Text>
          <Text style={styles.subtitle}>
            {isListening 
              ? isMuted ? 'Gedempt' : 'Luisteren...' 
              : 'Verbinding maken...'}
          </Text>
        </View>

        <View style={styles.listenerContainer}>
          <View style={styles.speakerWrapper}>
            {isListening && !isMuted && (
              <Animated.View style={[styles.waveCircle, waveStyle]} />
            )}
            <Animated.View 
              style={[
                styles.speakerCircle,
                isMuted && styles.speakerCircleMuted,
                isListening && !isMuted && pulseStyle,
              ]}
            >
              <Ionicons 
                name={isMuted ? "volume-mute" : "volume-high"} 
                size={speakerSize * 0.4} 
                color={isMuted ? colors.textTertiary : '#FFFFFF'} 
              />
            </Animated.View>

            {isListening && (
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>LIVE</Text>
              </View>
            )}
          </View>

          {isListening && !isMuted && (
            <>
              <View style={styles.audioLevelContainer}>
                <Animated.View style={[styles.audioBar, audioBarStyle]} />
                <Animated.View style={[styles.audioBar, audioBarStyle]} />
                <Animated.View style={[styles.audioBar, audioBarStyle]} />
                <Animated.View style={[styles.audioBar, audioBarStyle]} />
                <Animated.View style={[styles.audioBar, audioBarStyle]} />
              </View>
              <Text style={styles.audioLevelText}>
                Audio feed actief
              </Text>
            </>
          )}

          {isListening && (
            <View style={styles.connectionStatus}>
              <Ionicons name="wifi" size={16} color={colors.success} />
              <Text style={styles.connectionStatusText}>Verbonden</Text>
            </View>
          )}
        </View>

        {isListening && (
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.controlButtonMuted]}
              onPress={async () => {
                const newMutedState = !isMuted;
                setIsMuted(newMutedState);
                
                await muteRemoteAudio(newMutedState);
                
                if (newMutedState) {
                  setAudioLevel(0.1);
                  showAlert('Gedempt', 'Audio is gedempt');
                } else {
                  setAudioLevel(0.3);
                  showAlert('Geluid aan', 'Je hoort nu de babyfoon');
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={isMuted ? "volume-mute" : "volume-high"} 
                size={24} 
                color={isMuted ? colors.primary : '#FFFFFF'} 
              />
              <Text style={[
                styles.controlButtonText,
                isMuted && styles.controlButtonTextMuted
              ]}>
                {isMuted ? 'Geluid Aan' : 'Dempen'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Stream Info</Text>
          <View style={styles.infoItem}>
            <Ionicons name="flash" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { flex: 1 }]}>
              <Text style={{ fontWeight: '700' }}>Real-time stream</Text> - &lt;300ms latency
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="musical-notes" size={20} color={colors.success} />
            <Text style={[styles.infoText, { flex: 1 }]}>
              Powered by Agora - professionele audio kwaliteit
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="people" size={20} color={colors.accent} />
            <Text style={[styles.infoText, { flex: 1 }]}>
              Meerdere luisteraars mogelijk
            </Text>
          </View>
          <View style={styles.streamId}>
            <Text style={styles.streamIdText}>Stream: {key}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
