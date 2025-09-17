import { useContext, useEffect, useState } from 'react';
import { ActivityContext } from './ActivityProvider';

export function useDiscordActivity() {
  const context = useContext(ActivityContext);
  const [voiceChannel, setVoiceChannel] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [instanceId, setInstanceId] = useState(null);

  useEffect(() => {
    if (!context?.sdk || !context?.ready) return;

    const fetchDiscordData = async () => {
      try {
        // Get the Discord instance ID for proper multiplayer session management
        const discordInstanceId = context.sdk.instanceId;
        setInstanceId(discordInstanceId);
        console.log('🎮 Discord Instance ID:', discordInstanceId);

        // Get current user from authenticated context
        console.log('🔍 Checking authentication...', {
          hasSDK: !!context.sdk,
          hasAuthenticated: !!context.sdk?.authenticated,
          authenticated: context.sdk?.authenticated,
          hasToken: !!context.token
        });
        
        if (context.sdk.authenticated) {
          const user = {
            id: context.sdk.authenticated.user.id,
            username: context.sdk.authenticated.user.username,
            discriminator: context.sdk.authenticated.user.discriminator,
            avatar: context.sdk.authenticated.user.avatar,
            global_name: context.sdk.authenticated.user.global_name,
            accessToken: context.token
          };
          setCurrentUser(user);
          console.log('👤 Current user set:', user);
        } else {
          console.log('❌ No authenticated user found in context.sdk.authenticated');
        }

        // Get instance participants using Discord's built-in API
        try {
          const instanceParticipants = await context.sdk.commands.getInstanceConnectedParticipants();
          console.log('🎭 Instance participants:', instanceParticipants);
          
          if (instanceParticipants && instanceParticipants.participants) {
            setParticipants(instanceParticipants.participants);
            
            // If we don't have currentUser yet, try to get it from participants
            if (!context.sdk.authenticated && instanceParticipants.participants.length > 0) {
              console.log('🔧 Attempting to set currentUser from participants...');
              // In Discord Activities, often the first participant is the current user
              const firstParticipant = instanceParticipants.participants[0];
              if (firstParticipant && firstParticipant.user) {
                const fallbackUser = {
                  id: firstParticipant.user.id,
                  username: firstParticipant.user.username,
                  discriminator: firstParticipant.user.discriminator,
                  avatar: firstParticipant.user.avatar,
                  global_name: firstParticipant.user.global_name,
                  accessToken: context.token
                };
                setCurrentUser(fallbackUser);
                console.log('👤 Current user set from participants:', fallbackUser);
              }
            }
          } else {
            // Fallback to current user only
            if (context.sdk.authenticated) {
              setParticipants([{ 
                user: {
                  id: context.sdk.authenticated.user.id,
                  username: context.sdk.authenticated.user.username,
                  avatar: context.sdk.authenticated.user.avatar,
                  global_name: context.sdk.authenticated.user.global_name
                }
              }]);
            }
          }
        } catch (err) {
          console.log('Could not get instance participants, using current user only:', err);
          // Fallback to current user
          if (context.sdk.authenticated) {
            setParticipants([{ 
              user: {
                id: context.sdk.authenticated.user.id,
                username: context.sdk.authenticated.user.username,
                avatar: context.sdk.authenticated.user.avatar,
                global_name: context.sdk.authenticated.user.global_name
              }
            }]);
          }
        }

        // Additional fallback: try to get user from Discord commands
        if (!context.sdk.authenticated) {
          try {
            console.log('🔧 Trying alternative method to get current user...');
            // Sometimes the user info is available through different means
            const channel = await context.sdk.commands.getChannel({ channel_id: context.sdk.channelId });
            console.log('📡 Channel info for user detection:', channel);
          } catch (err) {
            console.log('Could not get channel info for user detection:', err);
          }
        }

        // Get current channel info
        if (context.sdk.channelId) {
          try {
            const channel = await context.sdk.commands.getChannel({
              channel_id: context.sdk.channelId
            });
            setVoiceChannel(channel);
          } catch (err) {
            console.log('Could not get channel info, using fallback:', err);
            setVoiceChannel({
              id: context.sdk.channelId,
              name: 'Voice Channel'
            });
          }
        }

        // Subscribe to participant updates
        try {
          context.sdk.subscribe('ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE', (data) => {
            console.log('🔄 Participants updated:', data);
            if (data && data.participants) {
              setParticipants(data.participants);
            }
          });
        } catch (err) {
          console.log('Could not subscribe to participant updates:', err);
        }

      } catch (err) {
        console.error('Failed to fetch Discord data:', err);
        // Provide fallback data
        if (context.sdk.authenticated) {
          setCurrentUser({
            id: context.sdk.authenticated.user.id,
            username: context.sdk.authenticated.user.username,
            avatar: context.sdk.authenticated.user.avatar,
            global_name: context.sdk.authenticated.user.global_name,
            accessToken: context.token
          });
        }
      }
    };

    fetchDiscordData();
  }, [context?.sdk, context?.ready, context?.token]);

  if (!context) {
    throw new Error('useDiscordActivity must be used within an ActivityProvider');
  }

  return {
    ...context,
    voiceChannel,
    participants,
    currentUser,
    instanceId,
    channelId: context?.sdk?.channelId,
    isHost: true, // For now, assume current user is host
    // Discord Activities can run in any channel, not just voice channels
    // We're "in voice channel" if we have a current user and channel ID
    isInVoiceChannel: !!(currentUser && context?.sdk?.channelId)
  };
}
