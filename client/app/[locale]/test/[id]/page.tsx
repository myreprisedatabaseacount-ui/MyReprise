'use client';

import { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import { useParams } from "next/navigation";
import { useCurrentUser } from "@/services/hooks/useCurrentUser";
import { useGetStreamTokenQuery } from "@/services/api/callApi";

const STREAM_API_KEY = "tmnm6ct77bxs";

const ChatPage = () => {
  const { id: targetUserId } = useParams();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  const { currentUser: authUser } = useCurrentUser();

  const { data: tokenData } = useGetStreamTokenQuery({});

  useEffect(() => {
    const initChat = async () => {
      if (!tokenData?.token || !authUser) return;

      try {
        const client = StreamChat.getInstance(STREAM_API_KEY);

        await client.connectUser(
          {
            id: authUser.id.toString(),
            name: authUser?.firstName + " " + authUser?.lastName,
            image: 'https://cdn.pixabay.com/photo/2023/06/01/13/07/cat-8024366_1280.jpg',
          },
          tokenData.token
        );

        //
        const channelId = [authUser.id.toString(), targetUserId].sort().join("-");

        // you and me
        // if i start the chat => channelId: [myId, yourId]
        // if you start the chat => channelId: [yourId, myId]  => [myId,yourId]

        const currChannel = client.channel("messaging", channelId, {
          members: [authUser.id, targetUserId],
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
  }, [tokenData, authUser]);

  let callUrl = "";
  const handleVideoCall = () => {
    if (channel) {
      callUrl = `${window.location.origin}/call/${channel.id}`;
      console.log(callUrl);
      return callUrl;
    }
  };

  if (loading || !chatClient || !channel) return (<div>loading</div>);

  return (
    <div className="h-[93vh]">
      url : 
      <button onClick={handleVideoCall}>call</button>
      <p>{callUrl}</p>
    </div>
  );
};
export default ChatPage;
