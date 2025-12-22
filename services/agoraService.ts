import { getSupabaseClient } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Type definitions for Agora (when installed)
type IRtcEngine = any;
type ChannelProfileType = any;
type ClientRoleType = any;

// Agora SDK - only available in production EAS builds
// NOT loaded in preview to avoid dependency conflicts
const AgoraSDK: any = null;

export interface AgoraTokenResponse {
  token: string;
  appId: string;
  channelName: string;
  uid: number;
  expiration: number;
}

let agoraEngine: IRtcEngine | null = null;
let isJoined: boolean = false;
let currentChannel: string | null = null;
let onAudioLevelCallback: ((level: number) => void) | null = null;

export async function generateAgoraToken(
  channelName: string,
  uid: number = 0,
  role: number = 1
): Promise<{ data: AgoraTokenResponse | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.functions.invoke('generate-agora-token', {
      body: { channelName, uid, role },
    });

    if (error) {
      let errorMessage = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const statusCode = error.context?.status ?? 500;
          const textContent = await error.context?.text();
          errorMessage = `[Code: ${statusCode}] ${textContent || error.message || 'Unknown error'}`;
        } catch {
          errorMessage = `${error.message || 'Failed to generate token'}`;
        }
      }
      return { data: null, error: errorMessage };
    }

    return { data, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to generate Agora token' 
    };
  }
}

export async function initializeAgora(): Promise<{ success: boolean; error?: string }> {
  try {
    // Agora real-time audio only works in the APK build
    if (!AgoraSDK) {
      const errorMsg = Platform.OS === 'web' 
        ? '🚀 Real-time babyfoon werkt alleen in de mobiele app. Download de APK via de download knop rechtsboven!'
        : '🚀 Real-time babyfoon werkt alleen in de APK build. Download de APK om deze feature te gebruiken!';
      return {
        success: false,
        error: errorMsg,
      };
    }

    if (agoraEngine) {
      console.log('✅ Agora already initialized');
      return { success: true };
    }

    console.log('🚀 Initializing Agora Engine...');
    agoraEngine = AgoraSDK.createAgoraRtcEngine();
    
    // Placeholder appId - will be replaced with real one from token
    agoraEngine.initialize({
      appId: 'temp',
    });

    // Enable audio only
    await agoraEngine.enableAudio();
    
    console.log('✅ Agora Engine initialized');
    return { success: true };
  } catch (error) {
    console.error('❌ Agora initialization error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize Agora',
    };
  }
}

export async function startBroadcasting(
  channelName: string,
  onAudioLevel?: (level: number) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🎙️ Starting broadcast for channel:', channelName);

    // Initialize if needed
    if (!agoraEngine) {
      const initResult = await initializeAgora();
      if (!initResult.success) {
        return initResult;
      }
    }

    // Get token from backend
    const tokenResult = await generateAgoraToken(channelName, 0, 1); // role 1 = broadcaster
    if (tokenResult.error || !tokenResult.data) {
      return { success: false, error: tokenResult.error || 'Failed to get token' };
    }

    const { token, appId } = tokenResult.data;

    // Re-initialize with correct appId
    agoraEngine!.initialize({ appId });
    await agoraEngine!.enableAudio();

    // Set channel profile for live broadcasting (1 = live broadcasting)
    agoraEngine!.setChannelProfile(1);
    
    // Set client role as broadcaster (1 = broadcaster)
    agoraEngine!.setClientRole(1);

    // Register event handlers
    agoraEngine!.registerEventHandler({
      onJoinChannelSuccess: (connection, elapsed) => {
        console.log('✅ Joined channel successfully:', connection.channelId);
        isJoined = true;
        currentChannel = channelName;
      },
      onUserJoined: (connection, remoteUid, elapsed) => {
        console.log('👤 User joined:', remoteUid);
      },
      onUserOffline: (connection, remoteUid, reason) => {
        console.log('👋 User left:', remoteUid);
      },
      onAudioVolumeIndication: (connection, speakers) => {
        if (speakers.length > 0 && onAudioLevel) {
          const level = speakers[0].volume / 255;
          onAudioLevel(level);
        }
      },
    });

    onAudioLevelCallback = onAudioLevel || null;

    // Enable audio volume indication
    agoraEngine!.enableAudioVolumeIndication(200, 3, true);

    // Join channel (uid 0 = auto-assign)
    await agoraEngine!.joinChannel(token, channelName, 0, {
      clientRoleType: 1, // broadcaster
    });

    console.log('✅ Broadcasting started');
    return { success: true };
  } catch (error) {
    console.error('❌ Broadcast error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start broadcast',
    };
  }
}

export async function joinChannel(
  channelName: string,
  onAudioLevel?: (level: number) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🎧 Joining channel:', channelName);

    // Initialize if needed
    if (!agoraEngine) {
      const initResult = await initializeAgora();
      if (!initResult.success) {
        return initResult;
      }
    }

    // Get token from backend
    const tokenResult = await generateAgoraToken(channelName, 0, 2); // role 2 = audience
    if (tokenResult.error || !tokenResult.data) {
      return { success: false, error: tokenResult.error || 'Failed to get token' };
    }

    const { token, appId } = tokenResult.data;

    // Re-initialize with correct appId
    agoraEngine!.initialize({ appId });
    await agoraEngine!.enableAudio();

    // Set channel profile (1 = live broadcasting)
    agoraEngine!.setChannelProfile(1);
    
    // Set client role as audience (2 = audience)
    agoraEngine!.setClientRole(2);

    // Register event handlers
    agoraEngine!.registerEventHandler({
      onJoinChannelSuccess: (connection, elapsed) => {
        console.log('✅ Joined channel successfully:', connection.channelId);
        isJoined = true;
        currentChannel = channelName;
      },
      onUserJoined: (connection, remoteUid, elapsed) => {
        console.log('👤 Broadcaster joined:', remoteUid);
      },
      onUserOffline: (connection, remoteUid, reason) => {
        console.log('👋 Broadcaster left:', remoteUid);
      },
      onAudioVolumeIndication: (connection, speakers) => {
        if (speakers.length > 0 && onAudioLevel) {
          const level = speakers[0].volume / 255;
          onAudioLevel(level);
        }
      },
    });

    onAudioLevelCallback = onAudioLevel || null;

    // Enable audio volume indication
    agoraEngine!.enableAudioVolumeIndication(200, 3, true);

    // Join channel as audience (uid 0 = auto-assign)
    await agoraEngine!.joinChannel(token, channelName, 0, {
      clientRoleType: 2, // audience
    });

    console.log('✅ Listening to channel');
    return { success: true };
  } catch (error) {
    console.error('❌ Join channel error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to join channel',
    };
  }
}

export async function leaveChannel(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!agoraEngine || !isJoined) {
      console.log('⚠️ Not in a channel');
      return { success: true };
    }

    console.log('👋 Leaving channel...');
    await agoraEngine.leaveChannel();
    
    isJoined = false;
    currentChannel = null;
    onAudioLevelCallback = null;

    console.log('✅ Left channel');
    return { success: true };
  } catch (error) {
    console.error('❌ Leave channel error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to leave channel',
    };
  }
}

export async function muteLocalAudio(muted: boolean): Promise<void> {
  if (agoraEngine) {
    await agoraEngine.muteLocalAudioStream(muted);
  }
}

export async function muteRemoteAudio(muted: boolean): Promise<void> {
  if (agoraEngine) {
    await agoraEngine.muteAllRemoteAudioStreams(muted);
  }
}

export function cleanupAgora(): void {
  if (agoraEngine) {
    if (isJoined) {
      agoraEngine.leaveChannel();
    }
    agoraEngine.release();
    agoraEngine = null;
  }
  isJoined = false;
  currentChannel = null;
  onAudioLevelCallback = null;
  console.log('🧹 Agora cleaned up');
}

export function getChannelStatus(): {
  isJoined: boolean;
  channel: string | null;
} {
  return {
    isJoined,
    channel: currentChannel,
  };
}
