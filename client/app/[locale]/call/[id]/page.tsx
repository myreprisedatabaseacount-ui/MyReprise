'use client';

import { useEffect, useState } from "react";
// import { getStreamToken } from "../lib/api";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";

// import toast from ;
// import PageLoader from "../components/PageLoader";
import { toast } from "sonner";
import { useGetStreamTokenQuery } from "@/services/api/callApi";
import { useCurrentUser } from "@/services/hooks/useCurrentUser";
import { useParams, useRouter } from "next/navigation";

const STREAM_API_KEY = 'tmnm6ct77bxs'


const CallContent = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const router = useRouter();

  if (callingState === CallingState.LEFT) return router.push("/");

  return (
    <StreamTheme>
      <SpeakerLayout />
      <CallControls />
    </StreamTheme>
  );
};

const CallPage = () => {
  const { id: callId } = useParams();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);

  const { currentUser, isLoading } = useCurrentUser();

  const { data: tokenData } = useGetStreamTokenQuery({});

  useEffect(() => {
    const initCall = async () => {
      if (!tokenData.token || !currentUser || !callId) return;

      try {
        console.log("Initializing Stream video client...");

        const user = {
          id: currentUser.id.toString(),
          name: currentUser.firstName + " " + currentUser.lastName,
          image: 'https://cdn.pixabay.com/photo/2023/06/01/13/07/cat-8024366_1280.jpg',
        };

        const videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user,
          token: tokenData.token,
        });

        const callInstance = videoClient.call("default", callId.toString());

        await callInstance.join({ create: true });

        console.log("Joined call successfully");

        setClient(videoClient);
        setCall(callInstance);
      } catch (error) {
        console.error("Error joining call:", error);
        toast.error("Could not join the call. Please try again.");
      } finally {
        setIsConnecting(false);
      }
    };

    initCall();
  }, [tokenData, currentUser, callId]);

  if (isLoading || isConnecting) return <div>Loading...</div>;

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="relative">
        {client && call ? (
          <StreamVideo client={client}>
            <StreamCall call={call}>
              <CallContent />
            </StreamCall>
          </StreamVideo>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>Could not initialize call. Please refresh or try again later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallPage;