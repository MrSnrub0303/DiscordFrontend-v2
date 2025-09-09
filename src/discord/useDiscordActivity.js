import { useContext, useEffect, useState } from 'react';
import { ActivityContext } from './ActivityProvider';

export function useDiscordActivity() {
  const context = useContext(ActivityContext);
  const [voiceChannel, setVoiceChannel] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (!context?.sdk || !context?.ready) return;

    const fetchDiscordData = async () => {
      try {
        // Get current user from authenticated context (already available from auth response)
        if (context.sdk.authenticated) {
          const user = {
            id: context.sdk.authenticated.user.id,
            username: context.sdk.authenticated.user.username,
            discriminator: context.sdk.authenticated.user.discriminator,
            avatar: context.sdk.authenticated.user.avatar,
            accessToken: context.token
          };
          setCurrentUser(user);

          // Create a basic participant list with just the current user
          setParticipants([{ 
            user: {
              id: user.id,
              username: user.username,
              avatar: user.avatar
            }
          }]);
        }

        // Get current channel info (where the activity is running)
        if (context.sdk.channelId) {
          try {
            const channel = await context.sdk.commands.getChannel({
              channel_id: context.sdk.channelId
            });
            setVoiceChannel(channel);
          } catch (err) {
            console.log('Could not get channel info, using fallback:', err);
            // Set basic channel info from SDK
            setVoiceChannel({
              id: context.sdk.channelId,
              name: 'Voice Channel'
            });
          }
        }

        // Skip guild members API call to avoid 401 errors
        // Instead, use a simplified approach for now
        console.log('Skipping guild members API call to avoid authorization issues');

      } catch (err) {
        console.error('Failed to fetch Discord data:', err);
        // Provide fallback data
        if (context.sdk.authenticated) {
          setCurrentUser({
            id: context.sdk.authenticated.user.id,
            username: context.sdk.authenticated.user.username,
            avatar: context.sdk.authenticated.user.avatar,
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
    isHost: true, // For now, assume current user is host
    isInVoiceChannel: !!voiceChannel
  };
}
