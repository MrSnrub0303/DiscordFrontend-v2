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
        
        const discordInstanceId = context.sdk.instanceId;
        setInstanceId(discordInstanceId);
        

        
        
          
          
          
          
        
        
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
          
        } else {
          
        }

        
        try {
          const instanceParticipants = await context.sdk.commands.getInstanceConnectedParticipants();
          
          
          if (instanceParticipants && instanceParticipants.participants) {
            setParticipants(instanceParticipants.participants);
            
            
            if (!context.sdk.authenticated && instanceParticipants.participants.length > 0) {
              
              
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
                
              }
            }
          } else {
            
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

        
        if (!context.sdk.authenticated) {
          try {
            
            
            const channel = await context.sdk.commands.getChannel({ channel_id: context.sdk.channelId });
            
          } catch (err) {
            
          }
        }

        
        if (context.sdk.channelId) {
          try {
            const channel = await context.sdk.commands.getChannel({
              channel_id: context.sdk.channelId
            });
            setVoiceChannel(channel);
          } catch (err) {
            
            setVoiceChannel({
              id: context.sdk.channelId,
              name: 'Voice Channel'
            });
          }
        }

        
        try {
          context.sdk.subscribe('ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE', (data) => {
            
            if (data && data.participants) {
              setParticipants(data.participants);
            }
          });
        } catch (err) {
          
        }

      } catch (err) {
        
        
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
    isHost: true, 
    
    
    isInVoiceChannel: !!(currentUser && context?.sdk?.channelId)
  };
}
