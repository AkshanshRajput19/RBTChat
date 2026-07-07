import { useEffect, useRef } from "react";

const STATUS_TEXT = {
  preparing: "Requesting camera and microphone permission...",
  calling: "Calling...",
  incoming: "Incoming call",
  connecting: "Connecting...",
  connected: "Connected",
  error: "Call could not continue",
};

function CallOverlay({ call, getInitials }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = call.localStream;
    }
  }, [call.localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = call.remoteStream;
    }
  }, [call.remoteStream]);

  if (!call.isActive) return null;

  return (
    <div className="call-overlay">
      <div className={`call-dialog ${call.type}`}>
        <div className="call-media">
          <video
            ref={remoteVideoRef}
            className={
              call.type === "video"
                ? "remote-call-video"
                : "hidden-call-media"
            }
            autoPlay
            playsInline
          />

          {(call.type === "voice" || !call.remoteStream) && (
            <div className="call-avatar">
              {getInitials(call.partner?.name)}
            </div>
          )}

          {call.type === "video" && call.localStream && (
            <video
              ref={localVideoRef}
              className="local-call-video"
              autoPlay
              playsInline
              muted
            />
          )}
        </div>

        <div className="call-information">
          <span>{call.type === "video" ? "Video call" : "Voice call"}</span>
          <h2>{call.partner?.name || "RBTChat user"}</h2>
          <p>{STATUS_TEXT[call.status]}</p>
          {call.error && <div className="call-error">{call.error}</div>}
        </div>

        {call.status === "incoming" ? (
          <div className="incoming-call-actions">
            <button className="reject-call" onClick={call.rejectCall}>
              Reject
            </button>
            <button className="accept-call" onClick={call.acceptCall}>
              Accept
            </button>
          </div>
        ) : call.status === "error" ? (
          <div className="incoming-call-actions">
            <button className="reject-call" onClick={call.closeError}>
              Close
            </button>
          </div>
        ) : (
          <div className="active-call-actions">
            <button
              className={call.isMuted ? "control-active" : ""}
              onClick={call.toggleMute}
            >
              {call.isMuted ? "Unmute" : "Mute"}
            </button>

            {call.type === "video" && (
              <>
                <button
                  className={call.isCameraOff ? "control-active" : ""}
                  onClick={call.toggleCamera}
                >
                  {call.isCameraOff ? "Camera on" : "Camera off"}
                </button>

                <button
                  className={call.isScreenSharing ? "control-active" : ""}
                  onClick={call.toggleScreenShare}
                >
                  {call.isScreenSharing ? "Stop sharing" : "Share screen"}
                </button>
              </>
            )}

            <button className="reject-call" onClick={call.endCall}>
              End
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CallOverlay;
