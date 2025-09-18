'use client';

import { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import { useParams } from "next/navigation";
import { useGetStreamTokenQuery } from "@/services/api/callApi";
import { useCurrentUser } from "@/services/hooks/useCurrentUser";

const STREAM_API_KEY = "tmnm6ct77bxs";

const ChatPage = () => {
  const { id: targetUserId } = useParams();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  const { currentUser, isAuthenticated, isLoading, error, refreshUser, logout } = useCurrentUser();

  console.log(currentUser);

  const { data : tokenData , isLoading: isTokenLoading } = useGetStreamTokenQuery({});

  console.log('tokenData', tokenData);

  useEffect(() => {
    const initChat = async () => {
      // Attendre que les données soient chargées
      if (!tokenData?.token || !currentUser || isTokenLoading || isLoading) {
        console.log('⏳ En attente des données:', {
          hasToken: !!tokenData?.token,
          hasUser: !!currentUser,
          isTokenLoading,
          isLoading
        });
        return;
      }

      console.log('🚀 Initialisation du chat avec:', {
        token: tokenData.token,
        userId: currentUser.id,
        targetUserId
      });

      try {
        const client = StreamChat.getInstance(STREAM_API_KEY);

        await client.connectUser(
          {
            id: currentUser.id.toString(),
            name: currentUser?.firstName + " " + currentUser?.lastName,
            image: 'https://cdn.pixabay.com/photo/2023/06/01/13/07/cat-8024366_1280.jpg',
          },
          tokenData.token
        );

        //
        const channelId = [currentUser.id.toString(), targetUserId].sort().join("-");

        // you and me
        // if i start the chat => channelId: [myId, yourId]
        // if you start the chat => channelId: [yourId, myId]  => [myId,yourId]

        const currChannel = client.channel("messaging", channelId, {
          members: [currentUser.id.toString(), targetUserId],
        });

        await currChannel.watch();

        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing chat:", error);
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [tokenData, currentUser, isTokenLoading, isLoading, targetUserId]);

  let callUrl = "";
  const handleVideoCall = () => {
    if (channel) {
      callUrl = `${window.location.origin}/call/${channel.id}`;
      console.log(callUrl);
      return callUrl;
    }
  };

  return (
    <div className="h-[93vh]">
      url : 
      <button onClick={handleVideoCall}>call</button>
      <p>{callUrl}</p>
    </div>
  );
};
export default ChatPage;
