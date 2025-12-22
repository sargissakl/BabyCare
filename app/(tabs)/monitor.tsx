import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Share, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { spacing, borderRadius } from '@/constants/theme';
import { useAlert } from '@/template';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { TextInput } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { 
  startBroadcasting,
  leaveChannel,
  cleanupAgora,
} from '@/services/agoraService';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withRepeat,
  withTiming,
  Easing
} from 'react-native-reanimated';

export default function MonitorScreen() {
  const insets = useSafeAreaInsets();
  const { colors, typography, shadows } = useTheme();
  const { showAlert } = useAlert();
  const router = useRouter();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const lastAlertTime = useRef(0);

  const pulseAnim = useSharedValue(1);
  const waveAnim = useSharedValue(0);

  useEffect(() => {
    const update = () => setDimensions(Dimensions.get('window'));
    update();
    const sub = Dimensions.addEventListener('change', update);
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    if (isMonitoring) {
      pulseAnim.value = withRepeat(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      waveAnim.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      pulseAnim.value = withSpring(1);
      waveAnim.value = 0;
    }
  }, [isMonitoring]);

  useEffect(() => {
    return () => {
      cleanupAgora();
    };
  }, []);

  const generateStreamKey = () => {
    // Generate a random 4-digit code
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinKey, setJoinKey] = useState('');

  const handleLoudNoise = () => {
    const now = Date.now();
    // Alert max elke 10 seconden
    if (now - lastAlertTime.current > 10000) {
      lastAlertTime.current = now;
      showAlert('Baby Alert', 'Loud noise detected! Baby might be crying.');
    }
  };

  const startMonitoring = async () => {
    const key = generateStreamKey();
    
    console.log('🎙️ Starting Agora broadcast...');
    const result = await startBroadcasting(
      key,
      (level) => {
        setAudioLevel(level);
        // Check for loud noise (crying)
        if (level > 0.65) {
          handleLoudNoise();
        }
      }
    );

    if (!result.success) {
      showAlert('Error', result.error || 'Failed to start audio monitoring');
      return;
    }

    setStreamKey(key);
    setIsMonitoring(true);
    showAlert('Monitoring Started', '🎙️ Real-time babyfoon actief - anderen kunnen nu meluisteren met <300ms vertraging!');
  };

  const stopMonitoring = async () => {
    try {
      console.log('🛑 Stopping Agora broadcast...');
      const result = await leaveChannel();
      
      if (!result.success && result.error) {
        console.log('⚠️ Stop warning:', result.error);
      }
    } catch (error) {
      console.error('❌ Stop monitoring error:', error);
    } finally {
      setIsMonitoring(false);
      setStreamKey(null);
      setAudioLevel(0);
      showAlert('Monitoring Gestopt', 'Babyfoon is nu uitgeschakeld');
    }
  };

  const shareStreamKey = async () => {
    if (!streamKey) return;
    
    try {
      await Clipboard.setStringAsync(streamKey);
      showAlert('Stream Key Gekopieerd', 'Deel deze code met anderen zodat ze kunnen meeluisteren');
    } catch (error) {
      showAlert('Error', 'Failed to copy stream key');
    }
  };

  const joinStream = () => {
    if (!joinKey.trim()) {
      showAlert('Fout', 'Voer een geldige stream key in');
      return;
    }
    // Navigate to watch screen with the key
    router.push(`/watch/${joinKey.trim()}`);
  };

  const micSize = Math.max(1, Math.min(dimensions.width * 0.5, 200));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const waveStyle = useAnimatedStyle(() => ({
    opacity: 0.3 * (1 - waveAnim.value),
    transform: [{ scale: 1 + waveAnim.value * 0.5 }],
  }));

  const audioBarHeight = useAnimatedStyle(() => ({
    height: withSpring(20 + audioLevel * 100),
  }));

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingTop: insets.top + spacing.md,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xl,
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
    monitorContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
      minHeight: 300,
    },
    microphoneWrapper: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xl,
    },
    waveCircle: {
      position: 'absolute',
      width: micSize * 1.8,
      height: micSize * 1.8,
      borderRadius: micSize * 0.9,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    microphoneCircle: {
      width: micSize,
      height: micSize,
      borderRadius: micSize / 2,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.xl,
    },
    microphoneCircleInactive: {
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
      height: 120,
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
    controlButtonStop: {
      backgroundColor: colors.error,
    },
    controlButtonSecondary: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    controlButtonText: {
      ...typography.button,
      color: '#FFFFFF',
    },
    controlButtonTextSecondary: {
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
    streamInfo: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginTop: spacing.md,
      ...shadows.sm,
    },
    streamInfoTitle: {
      ...typography.subheading,
      marginBottom: spacing.sm,
    },
    streamInfoText: {
      ...typography.bodySmall,
      marginBottom: spacing.sm,
    },
    linkContainer: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      marginTop: spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    linkText: {
      ...typography.caption,
      flex: 1,
    },
    streamKeyText: {
      ...typography.title,
      fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
      flex: 1,
      fontWeight: '700',
      textAlign: 'center',
      letterSpacing: 8,
    },
    qrCodeContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      marginTop: spacing.md,
      ...shadows.sm,
    },
    qrCodeTitle: {
      ...typography.subheading,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    qrCodeInstructions: {
      ...typography.caption,
      marginTop: spacing.md,
      textAlign: 'center',
    },
    streamInfoInstructions: {
      ...typography.caption,
      marginTop: spacing.sm,
      fontStyle: 'italic',
    },
    copyButton: {
      padding: spacing.xs,
    },
    joinContainer: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      ...shadows.md,
    },
    joinTitle: {
      ...typography.subheading,
      marginBottom: spacing.xs,
    },
    joinSubtitle: {
      ...typography.bodySmall,
      marginBottom: spacing.md,
    },
    joinInput: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      ...typography.body,
      color: colors.text,
      borderWidth: 2,
      borderColor: colors.border,
      marginBottom: spacing.md,
    },
    joinButtons: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Audio Babyfoon</Text>
          <Text style={styles.subtitle}>
            {isMonitoring ? 'Luistert naar geluiden' : 'Start audio monitoring voor je baby'}
          </Text>
        </View>

        <View style={styles.monitorContainer}>
          <View style={styles.microphoneWrapper}>
            {isMonitoring && (
              <Animated.View style={[styles.waveCircle, waveStyle]} />
            )}
            <Animated.View 
              style={[
                styles.microphoneCircle,
                !isMonitoring && styles.microphoneCircleInactive,
                isMonitoring && pulseStyle,
              ]}
            >
              <Ionicons 
                name={isMonitoring ? "mic" : "mic-off"} 
                size={micSize * 0.4} 
                color={isMonitoring ? '#FFFFFF' : colors.textTertiary} 
              />
            </Animated.View>

            {isMonitoring && (
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>LIVE</Text>
              </View>
            )}
          </View>

          {isMonitoring && (
            <View style={styles.audioLevelContainer}>
              <Animated.View style={[styles.audioBar, audioBarHeight]} />
              <Animated.View style={[styles.audioBar, audioBarHeight]} />
              <Animated.View style={[styles.audioBar, audioBarHeight]} />
              <Animated.View style={[styles.audioBar, audioBarHeight]} />
              <Animated.View style={[styles.audioBar, audioBarHeight]} />
            </View>
          )}

          {isMonitoring && (
            <Text style={styles.audioLevelText}>
              Geluidsniveau: {Math.round(audioLevel * 100)}%
            </Text>
          )}
        </View>

        <View style={styles.controls}>
          {!isMonitoring ? (
            <TouchableOpacity
              style={styles.controlButton}
              onPress={startMonitoring}
              activeOpacity={0.8}
            >
              <Ionicons name="mic" size={24} color="#FFFFFF" />
              <Text style={styles.controlButtonText}>Start Monitoring</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.controlButton, styles.controlButtonStop]}
                onPress={stopMonitoring}
                activeOpacity={0.8}
              >
                <Ionicons name="stop" size={24} color="#FFFFFF" />
                <Text style={styles.controlButtonText}>Stop Monitoring</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, styles.controlButtonSecondary]}
                onPress={shareStreamKey}
                activeOpacity={0.8}
              >
                <Ionicons name="copy" size={24} color={colors.primary} />
                <Text style={[styles.controlButtonText, styles.controlButtonTextSecondary]}>
                  Kopieer Stream Key
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {isMonitoring && streamKey && (
          <View style={styles.streamInfo}>
            <Text style={styles.streamInfoTitle}>Monitor Actief</Text>
            <Text style={styles.streamInfoText}>
              Deel deze 4-cijferige code met anderen:
            </Text>
            <View style={styles.linkContainer}>
              <Text style={styles.streamKeyText}>
                {streamKey}
              </Text>
            </View>
            
            <View style={styles.qrCodeContainer}>
              <Text style={styles.qrCodeTitle}>Of scan deze QR code</Text>
              <QRCode
                value={`babycare://watch/${streamKey}`}
                size={180}
                backgroundColor="white"
                color={colors.primary}
              />
              <Text style={styles.qrCodeInstructions}>
                📱 Scan met camera om automatisch mee te luisteren
              </Text>
            </View>
            
            <Text style={styles.streamInfoInstructions}>
              💡 Anderen kunnen ook handmatig joinen door op "Luister Mee" te klikken en de code in te voeren
            </Text>
          </View>
        )}

        {!isMonitoring && !showJoinInput && (
          <TouchableOpacity
            style={[styles.controlButton, styles.controlButtonSecondary]}
            onPress={() => setShowJoinInput(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="enter" size={24} color={colors.primary} />
            <Text style={[styles.controlButtonText, styles.controlButtonTextSecondary]}>
              Luister Mee (Join Stream)
            </Text>
          </TouchableOpacity>
        )}

        {showJoinInput && (
          <View style={styles.joinContainer}>
            <Text style={styles.joinTitle}>Luister Mee</Text>
            <Text style={styles.joinSubtitle}>Voer de stream key in die je hebt ontvangen:</Text>
            <TextInput
              style={styles.joinInput}
              value={joinKey}
              onChangeText={setJoinKey}
              placeholder="Plak stream key hier"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.joinButtons}>
              <TouchableOpacity
                style={[styles.controlButton, { flex: 1 }]}
                onPress={joinStream}
                activeOpacity={0.8}
              >
                <Ionicons name="play" size={24} color="#FFFFFF" />
                <Text style={styles.controlButtonText}>Start Luisteren</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, styles.controlButtonSecondary, { flex: 1 }]}
                onPress={() => {
                  setShowJoinInput(false);
                  setJoinKey('');
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.controlButtonText, styles.controlButtonTextSecondary]}>Annuleer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!isMonitoring && !showJoinInput && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Hoe werkt het?</Text>
            <Text style={styles.infoText}>
              🚀 ECHTE Real-time babyfoon met Agora:
            </Text>
            <View style={styles.infoItem}>
              <Ionicons name="flash" size={20} color={colors.success} />
              <Text style={[styles.infoText, { flex: 1 }]}>
                <Text style={{ fontWeight: '700' }}>&lt;300ms latency</Text> - hoor je baby DIRECT huilen
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="musical-notes" size={20} color={colors.success} />
              <Text style={[styles.infoText, { flex: 1 }]}>
                Continue audio stream, geen chunks of vertraging
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="notifications" size={20} color={colors.success} />
              <Text style={[styles.infoText, { flex: 1 }]}>
                Automatische alert bij hard geluid (huilen)
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="people" size={20} color={colors.success} />
              <Text style={[styles.infoText, { flex: 1 }]}>
                Meerdere mensen kunnen tegelijk meluisteren
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="rocket" size={20} color={colors.success} />
              <Text style={[styles.infoText, { flex: 1 }]}>
                Werkt direct, professionele audio kwaliteit
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
