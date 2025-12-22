import { Audio } from 'expo-av';
import { getSupabaseClient } from '@/template';
import * as FileSystem from 'expo-file-system';

export interface AudioRecordingState {
  isRecording: boolean;
  duration: number;
  audioLevel: number;
}

export interface AudioMonitorSettings {
  sensitivity: number; // 0-1, threshold for crying detection
  alertEnabled: boolean;
}

let recording: Audio.Recording | null = null;
let sound: Audio.Sound | null = null;
let monitoringInterval: NodeJS.Timeout | null = null;
let chunkInterval: NodeJS.Timeout | null = null;
let currentStreamKey: string | null = null;
let onLevelChangeCallback: ((level: number) => void) | null = null;
let onLoudNoiseCallback: (() => void) | null = null;
let sensitivityThreshold: number = 0.7;

export async function requestAudioPermissions(): Promise<boolean> {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Permission error:', error);
    return false;
  }
}

async function startNewRecordingChunk(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });

    const { recording: newRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
      undefined,
      100
    );

    recording = newRecording;

    // Set up status monitoring for this chunk
    if (onLevelChangeCallback || onLoudNoiseCallback) {
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && status.metering !== undefined) {
          const normalized = Math.max(0, Math.min(1, (status.metering + 160) / 160));
          
          if (onLevelChangeCallback) {
            onLevelChangeCallback(normalized);
          }

          if (onLoudNoiseCallback && normalized > sensitivityThreshold) {
            onLoudNoiseCallback();
          }
        }
      });
    }

    console.log('✅ Started new recording chunk');
  } catch (error) {
    console.error('❌ Failed to start recording chunk:', error);
  }
}

export async function startAudioRecording(
  onLevelChange?: (level: number) => void,
  onLoudNoiseDetected?: () => void,
  sensitivity: number = 0.7,
  streamKey?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const hasPermission = await requestAudioPermissions();
    if (!hasPermission) {
      return { success: false, error: 'Microphone permission denied' };
    }

    currentStreamKey = streamKey || null;
    onLevelChangeCallback = onLevelChange || null;
    onLoudNoiseCallback = onLoudNoiseDetected || null;
    sensitivityThreshold = sensitivity;

    // Start first recording chunk
    await startNewRecordingChunk();

    // Set up chunk-based recording: every 3 seconds, stop → upload → start new
    if (currentStreamKey) {
      chunkInterval = setInterval(async () => {
        await recordAndUploadChunk();
      }, 3000);
    }

    return { success: true };
  } catch (error) {
    console.error('Recording start error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to start recording' 
    };
  }
}

async function recordAndUploadChunk(): Promise<void> {
  if (!recording || !currentStreamKey) {
    console.log('⚠️ No recording or stream key');
    return;
  }

  try {
    console.log('🎤 Stopping chunk recording...');
    // Stop and get URI
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    
    if (!uri) {
      console.error('❌ No URI from recording!');
      await startNewRecordingChunk();
      return;
    }
    
    console.log('✅ Got recording URI:', uri);
    console.log('📤 Uploading chunk for stream:', currentStreamKey);
    
    const result = await uploadAudioChunk(uri, currentStreamKey);
    
    if (result.success) {
      console.log('✅✅✅ CHUNK UPLOADED SUCCESSFULLY:', result.publicUrl);
    } else {
      console.error('❌❌❌ UPLOAD FAILED:', result.error);
    }

    // Start new chunk
    console.log('🎤 Starting next chunk...');
    await startNewRecordingChunk();
  } catch (error) {
    console.error('❌ Chunk processing error:', error);
    // Always try to restart recording
    try {
      await startNewRecordingChunk();
    } catch (restartError) {
      console.error('❌ Failed to restart recording:', restartError);
    }
  }
}

export async function stopAudioRecording(): Promise<{ 
  success: boolean; 
  uri?: string; 
  error?: string 
}> {
  try {
    // Clear intervals first
    if (chunkInterval) {
      clearInterval(chunkInterval);
      chunkInterval = null;
    }

    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      monitoringInterval = null;
    }

    let finalUri: string | undefined;

    // Stop recording if active
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        finalUri = recording.getURI() || undefined;
        
        // Upload final chunk (optional, don't fail if this errors)
        if (finalUri && currentStreamKey) {
          try {
            await uploadAudioChunk(finalUri, currentStreamKey);
            console.log('✅ Final chunk uploaded');
          } catch (uploadError) {
            console.log('⚠️ Failed to upload final chunk, continuing anyway');
          }
        }
      } catch (recordingError) {
        console.log('⚠️ Recording already stopped or error stopping:', recordingError);
      } finally {
        recording = null;
      }
    }

    // Reset state
    currentStreamKey = null;
    onLevelChangeCallback = null;
    onLoudNoiseCallback = null;

    // Reset audio mode
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
    } catch (audioModeError) {
      console.log('⚠️ Failed to reset audio mode:', audioModeError);
    }

    console.log('✅ Recording stopped successfully');
    return { success: true, uri: finalUri };
  } catch (error) {
    console.error('❌ Critical error stopping recording:', error);
    // Force cleanup even on error
    recording = null;
    currentStreamKey = null;
    chunkInterval = null;
    monitoringInterval = null;
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to stop recording' 
    };
  }
}

export async function playAudioFromUri(
  uri: string,
  onPlaybackStatusUpdate?: (isPlaying: boolean, position: number) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔊 Attempting to play audio from:', uri);

    // Unload previous sound completely
    if (sound) {
      try {
        await sound.unloadAsync();
      } catch (e) {
        console.log('Sound unload warning:', e);
      }
      sound = null;
    }

    // Set audio mode for playback (crucial for hearing audio)
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
      interruptionModeIOS: 1, // Mix with others
      interruptionModeAndroid: 1, // Duck others
    });

    // Create new sound instance
    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri },
      { 
        shouldPlay: false, // Don't auto-play yet
        isLooping: false,
        volume: 1.0, // Maximum volume
      },
      (status) => {
        if (onPlaybackStatusUpdate && status.isLoaded) {
          onPlaybackStatusUpdate(status.isPlaying, status.positionMillis);
        }
        if (status.isLoaded && status.didJustFinish) {
          console.log('✅ Audio chunk finished playing');
        }
      }
    );

    sound = newSound;
    
    // Explicitly set volume to maximum
    await sound.setVolumeAsync(1.0);
    
    // Start playback
    await sound.playAsync();
    console.log('✅ Audio playback started successfully');

    return { success: true };
  } catch (error) {
    console.error('❌ Playback error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to play audio' 
    };
  }
}

export async function stopAudioPlayback(): Promise<void> {
  try {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      sound = null;
    }
  } catch (error) {
    console.error('Stop playback error:', error);
  }
}

export async function uploadAudioChunk(
  audioUri: string,
  streamKey: string
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  try {
    console.log('📤 Starting upload for:', streamKey);
    console.log('📁 Audio URI:', audioUri);
    const supabase = getSupabaseClient();
    
    // CRITICAL: Use expo-file-system to read file on React Native
    // fetch(file://) does NOT work on mobile!
    const base64 = await FileSystem.readAsStringAsync(audioUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    console.log('✅ File read as base64, length:', base64.length);
    
    // Convert base64 to blob for upload
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'audio/m4a' });
    
    console.log('✅ Blob created, size:', blob.size, 'bytes');
    
    const fileName = `${streamKey}/${Date.now()}.m4a`;
    console.log('📤 Uploading to:', fileName);
    
    const { data, error } = await supabase.storage
      .from('audio-streams')
      .upload(fileName, blob, {
        contentType: 'audio/m4a',
        upsert: true,
      });

    if (error) {
      console.error('❌ Storage upload error:', error.message);
      return { success: false, error: error.message };
    }

    const { data: publicData } = supabase.storage
      .from('audio-streams')
      .getPublicUrl(fileName);

    console.log('✅✅✅ UPLOAD SUCCESS:', publicData.publicUrl);
    return { success: true, publicUrl: publicData.publicUrl };
  } catch (error) {
    console.error('❌❌❌ Upload exception:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to upload audio' 
    };
  }
}

export async function getLatestAudioChunk(
  streamKey: string
): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.storage
      .from('audio-streams')
      .list(streamKey, {
        limit: 1,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.log('❌ Storage error:', error.message);
      return { error: error.message };
    }

    if (!data || data.length === 0) {
      return { error: 'Stream not found' };
    }

    const filePath = `${streamKey}/${data[0].name}`;
    const { data: publicData } = supabase.storage
      .from('audio-streams')
      .getPublicUrl(filePath);

    return { url: publicData.publicUrl };
  } catch (error) {
    return { error: 'Failed to fetch chunk' };
  }
}

export function cleanupAudio(): void {
  if (chunkInterval) {
    clearInterval(chunkInterval);
    chunkInterval = null;
  }
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
  if (recording) {
    recording.stopAndUnloadAsync().catch(console.error);
    recording = null;
  }
  if (sound) {
    sound.unloadAsync().catch(console.error);
    sound = null;
  }
  currentStreamKey = null;
  onLevelChangeCallback = null;
  onLoudNoiseCallback = null;
}
