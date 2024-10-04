import React, { useEffect, useRef } from "react";
import { makeStyles } from "@material-ui/core";
import { color } from "../../../assets/styles/_color";
import { useSelector } from 'react-redux';

const useStyles = makeStyles(() => ({
  video: {},
}));

const Video = (props) => {
  const classes = useStyles();
  const { track, isPresenter,isLargeVideo, borderRadius, width, height, left,isPipEnabled } = props;
  const videoElementRef = useRef(null);
  const pictureInPicture = useSelector((state) => state.media?.pictureInPicture);
  const conference = useSelector((state) => state.conference);
  const audioTrack = useSelector((state) => state.localTrack)?.find((track) =>
    track?.isAudioTrack()
  );
  useEffect(() => {
    track?.attach(videoElementRef.current);
  }, [track]);

  useEffect(()=>{
    if(videoElementRef.current) {
      videoElementRef.current.onloadedmetadata = ()=>{
        console.log("VIDEOElementref",videoElementRef);
        console.log("metadata laoded");
      }
    }
}, [videoElementRef?.current])

  if (!track) {
    return null;
  }

  let participants = conference ? [...conference?.getParticipantsWithoutHidden(), { _identity: { user: conference?.getLocalUser() }, _id: conference?.myUserId() }] : [];

  const getLeft = () => {
    let left = 0;
    if(!conference){
      left = "-42px";
    }
    if(conference){
      if(participants?.length === 1) left = "-36px";
      if(participants?.length === 2) {
        if(isLargeVideo) {left = "-36px"}
        else left = "-10px"
      }
    }
    return left;
  }

  return (
    <video
      playsInline="1"
      autoPlay="1"
      ref={videoElementRef}
      style={{
        left: "-1px",
        top: "-1px",
        position: props.position || "absolute",
        width:isPipEnabled ? 0 : "calc(100% + 2px)",
        display: isPipEnabled ? "none": "initial",
        height: props.height || "calc(100% + 2px)",
        objectFit: "contain",
        borderRadius: "8px",
        transform: 'rotateY(180deg)'

        // transform: isPresenter ? 'initial' : `scaleX(-1)`,
      }}
    />
  );
};

export default Video;
