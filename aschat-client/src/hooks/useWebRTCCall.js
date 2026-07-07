import { useCallback, useEffect, useRef, useState } from "react";

const IDLE = "idle";

function useWebRTCCall({ socket, users }) {
  const [status, setStatus] = useState(IDLE);
  const [type, setType] = useState("voice");
  const [partner, setPartner] = useState(null);
  const [error, setError] = useState("");
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const usersRef = useRef(users);
  const statusRef = useRef(IDLE);
  const partnerIdRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  const changeStatus = useCallback((nextStatus) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }, []);

  const stopConnection = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerRef.current?.close();

    localStreamRef.current = null;
    remoteStreamRef.current = null;
    peerRef.current = null;
    pendingCandidatesRef.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
  }, []);

  const reset = useCallback(() => {
    stopConnection();
    partnerIdRef.current = null;
    setPartner(null);
    setError("");
    changeStatus(IDLE);
  }, [changeStatus, stopConnection]);

  const fail = useCallback(
    (message) => {
      stopConnection();
      setError(message);
      changeStatus("error");
    },
    [changeStatus, stopConnection]
  );

  const prepareMedia = useCallback(async (callType) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("This browser does not support camera or microphone calls.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === "video",
    });

    localStreamRef.current = stream;
    setLocalStream(stream);
  }, []);

  const createPeer = useCallback(() => {
    if (peerRef.current) return peerRef.current;

    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    localStreamRef.current?.getTracks().forEach((track) => {
      peer.addTrack(track, localStreamRef.current);
    });

    peer.onicecandidate = ({ candidate }) => {
      if (candidate && partnerIdRef.current) {
        socket?.emit("ice-candidate", {
          to: partnerIdRef.current,
          candidate,
        });
      }
    };

    peer.ontrack = ({ streams }) => {
      if (streams[0]) {
        remoteStreamRef.current = streams[0];
        setRemoteStream(streams[0]);
      }
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "connected") {
        changeStatus("connected");
      } else if (peer.connectionState === "failed") {
        fail("The call connection failed. Please try again.");
      }
    };

    peerRef.current = peer;
    return peer;
  }, [changeStatus, fail, socket]);

  const addPendingCandidates = useCallback(async (peer) => {
    for (const candidate of pendingCandidatesRef.current) {
      await peer.addIceCandidate(candidate);
    }
    pendingCandidatesRef.current = [];
  }, []);

  const startCall = useCallback(
    async (selectedUser, callType) => {
      if (!selectedUser || statusRef.current !== IDLE) return;

      if (!socket?.connected) {
        setPartner(selectedUser);
        setType(callType);
        fail("The calling server is disconnected. Refresh and try again.");
        return;
      }

      partnerIdRef.current = selectedUser._id;
      setPartner(selectedUser);
      setType(callType);
      setError("");
      changeStatus("preparing");

      try {
        await prepareMedia(callType);
        changeStatus("calling");
        socket.emit("call-user", {
          to: selectedUser._id,
          callType,
        });
      } catch (mediaError) {
        fail(
          mediaError.name === "NotAllowedError"
            ? "Camera or microphone permission was denied."
            : mediaError.message || "Camera or microphone could not be opened."
        );
      }
    },
    [changeStatus, fail, prepareMedia, socket]
  );

  const acceptCall = useCallback(async () => {
    try {
      changeStatus("preparing");
      await prepareMedia(type);
      changeStatus("connecting");
      socket?.emit("accept-call", { to: partnerIdRef.current });
    } catch (mediaError) {
      socket?.emit("reject-call", {
        to: partnerIdRef.current,
        reason: "permission-denied",
      });
      fail(
        mediaError.name === "NotAllowedError"
          ? "Camera or microphone permission was denied."
          : "Camera or microphone could not be opened."
      );
    }
  }, [changeStatus, fail, prepareMedia, socket, type]);

  const rejectCall = useCallback(() => {
    socket?.emit("reject-call", {
      to: partnerIdRef.current,
      reason: "rejected",
    });
    reset();
  }, [reset, socket]);

  const endCall = useCallback(() => {
    socket?.emit("end-call", { to: partnerIdRef.current });
    reset();
  }, [reset, socket]);

  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);
  }, [isMuted]);

  const toggleCamera = useCallback(() => {
    const nextCameraOff = !isCameraOff;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !nextCameraOff;
    });
    setIsCameraOff(nextCameraOff);
  }, [isCameraOff]);

  const toggleScreenShare = useCallback(async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) return;

    try {
      if (!isScreenSharing) {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const screenTrack = displayStream.getVideoTracks()[0];
        const sender = peerRef.current?.getSenders().find((item) => item.track?.kind === "video");

        if (sender) {
          await sender.replaceTrack(screenTrack);
        }

        localStreamRef.current?.getVideoTracks().forEach((track) => track.stop());
        localStreamRef.current = displayStream;
        setLocalStream(displayStream);
        setIsScreenSharing(true);
      } else {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const cameraTrack = cameraStream.getVideoTracks()[0];
        const sender = peerRef.current?.getSenders().find((item) => item.track?.kind === "video");

        if (sender) {
          await sender.replaceTrack(cameraTrack);
        }

        localStreamRef.current?.getVideoTracks().forEach((track) => track.stop());
        localStreamRef.current = cameraStream;
        setLocalStream(cameraStream);
        setIsScreenSharing(false);
      }
    } catch {
      setError("Screen sharing could not be started.");
    }
  }, [isScreenSharing]);

  useEffect(() => {
    if (!socket) return undefined;

    const onIncoming = ({ from, callType }) => {
      if (statusRef.current !== IDLE) {
        socket.emit("reject-call", { to: from, reason: "busy" });
        return;
      }

      const incomingPartner =
        usersRef.current.find((user) => user._id === from) || {
          _id: from,
          name: "RBTChat user",
        };

      partnerIdRef.current = from;
      setPartner(incomingPartner);
      setType(callType === "video" ? "video" : "voice");
      setError("");
      changeStatus("incoming");
    };

    const onAccepted = async ({ from }) => {
      if (from !== partnerIdRef.current) return;

      try {
        changeStatus("connecting");
        const peer = createPeer();
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("webrtc-offer", { to: from, offer });
      } catch {
        fail("The call offer could not be created.");
      }
    };

    const onOffer = async ({ from, offer }) => {
      if (from !== partnerIdRef.current) return;

      try {
        const peer = createPeer();
        await peer.setRemoteDescription(offer);
        await addPendingCandidates(peer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("webrtc-answer", { to: from, answer });
      } catch {
        fail("The incoming call could not be answered.");
      }
    };

    const onAnswer = async ({ from, answer }) => {
      if (from !== partnerIdRef.current || !peerRef.current) return;

      try {
        await peerRef.current.setRemoteDescription(answer);
        await addPendingCandidates(peerRef.current);
      } catch {
        fail("The call connection could not be completed.");
      }
    };

    const onCandidate = async ({ from, candidate }) => {
      if (from !== partnerIdRef.current || !candidate) return;

      try {
        const iceCandidate = new RTCIceCandidate(candidate);
        if (peerRef.current?.remoteDescription) {
          await peerRef.current.addIceCandidate(iceCandidate);
        } else {
          pendingCandidatesRef.current.push(iceCandidate);
        }
      } catch {
        setError("A network connection candidate failed.");
      }
    };

    const onRejected = ({ from, reason }) => {
      if (from !== partnerIdRef.current) return;
      fail(
        reason === "busy"
          ? "This user is already on another call."
          : "The call was declined."
      );
    };

    const onEnded = ({ from }) => {
      if (from === partnerIdRef.current) reset();
    };

    const onUnavailable = ({ userId }) => {
      if (userId === partnerIdRef.current) {
        fail("This user is currently offline.");
      }
    };

    socket.on("incoming-call", onIncoming);
    socket.on("call-accepted", onAccepted);
    socket.on("webrtc-offer", onOffer);
    socket.on("webrtc-answer", onAnswer);
    socket.on("ice-candidate", onCandidate);
    socket.on("call-rejected", onRejected);
    socket.on("call-ended", onEnded);
    socket.on("user-unavailable", onUnavailable);

    return () => {
      socket.off("incoming-call", onIncoming);
      socket.off("call-accepted", onAccepted);
      socket.off("webrtc-offer", onOffer);
      socket.off("webrtc-answer", onAnswer);
      socket.off("ice-candidate", onCandidate);
      socket.off("call-rejected", onRejected);
      socket.off("call-ended", onEnded);
      socket.off("user-unavailable", onUnavailable);
      stopConnection();
    };
  }, [
    addPendingCandidates,
    changeStatus,
    createPeer,
    fail,
    reset,
    socket,
    stopConnection,
  ]);

  return {
    status,
    type,
    partner,
    error,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    isScreenSharing,
    isActive: status !== IDLE,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    closeError: reset,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
  };
}

export default useWebRTCCall;
