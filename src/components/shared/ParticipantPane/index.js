
import React, { useState, useEffect, useMemo } from "react";
import { Box, makeStyles } from "@material-ui/core";
import { useSelector } from "react-redux";
import VideoBox from "../VideoBox";
import classnames from "classnames";
import * as Constants from "../../../constants";

const ParticipantPane = ({
  remoteTracks,
  localTracks,
  dominantSpeakerId,
  panelHeight,
  gridItemWidth,
  largeVideoId,
  isPresenter,
}) => {
  const conference = useSelector((state) => state.conference);
  const layout = useSelector((state) => state.layout);

  const useStyles = makeStyles(() => ({
    root: {
      overflowY: "auto",
      height: `${panelHeight}px`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      scrollSnapType: "y mandatory", 
      "&::-webkit-scrollbar": {
        width: "8px",
      },
      "&::-webkit-scrollbar-thumb": {
        backgroundColor: "#888",
        borderRadius: "4px",
      },
    },
    videoBoxContainer: {
      height: `${panelHeight / 4}px`, 
      width: "100%",
      marginBottom: "10px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      scrollSnapAlign: "start", 
      background: "transparent", 
      transition: "transform 0.2s ease, opacity 0.3s ease",
      "&:hover": {
        transform: "scale(1.02)", 
      },
    },
    counter: {
      position: "sticky",
      top: "0",
      background: "rgba(0, 0, 0, 0.8)", 
      color: "#fff",
      padding: "10px 20px",
      borderRadius: "20px",
      fontSize: "16px",
      fontWeight: "bold",
      textAlign: "center",
      zIndex: 10,
      marginBottom: "10px",
      boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)",
    },
  }));

  const classes = useStyles();

  const participants = useMemo(() => {
    let allParticipants = [
      ...conference.getParticipantsWithoutHidden(),
      { _identity: { user: conference.getLocalUser() }, _id: conference.myUserId() },
    ];

    allParticipants
      .filter((p) => layout.presenterParticipantIds.indexOf(p._id) >= 0)
      .forEach((p) => {
        allParticipants.push({ ...p, presenter: true });
      });

    if (isPresenter && largeVideoId) {
      allParticipants = allParticipants.filter((p) => !(p.presenter && p._id === largeVideoId));
    } else if (largeVideoId) {
      allParticipants = allParticipants.filter((p) => !(p._id === largeVideoId && !p.presenter));
    }

    return allParticipants;
  }, [conference, layout.presenterParticipantIds, layout.mode, isPresenter, largeVideoId]);

  const [visibleParticipants, setVisibleParticipants] = useState(participants.slice(0, 4));

  const handleScroll = (e) => {
    const scrollIndex = Math.floor(e.target.scrollTop / (panelHeight / 4)); 
    const newVisibleParticipants = participants.slice(
      scrollIndex,
      scrollIndex + 4
    );
    setVisibleParticipants(newVisibleParticipants);
  };

  useEffect(() => {
    setVisibleParticipants(participants.slice(0, 4));
  }, [participants]);

  if (participants.length <= 0) {
    return null;
  }

  const activeClasses = classnames(classes.root, {
    fullmode: layout.mode === Constants.ENTER_FULL_SCREEN_MODE,
  });

  return (
    <Box style={{ height: `${panelHeight}px` }} className={activeClasses} onScroll={handleScroll}>
      <div className={classes.counter}>{`Participants: ${participants.length}`}</div>

      {participants.map((participant, index) => (
        <Box key={participant._id} className={classes.videoBoxContainer}>
          <VideoBox
            localUserId={conference.myUserId()}
            width={gridItemWidth}
            height={panelHeight / 4 - 10} 
            isPresenter={participant.presenter || false}
            isFilmstrip={false}
            isActiveSpeaker={dominantSpeakerId === participant._id}
            participantDetails={participant?._identity?.user}
            participantTracks={remoteTracks[participant._id] || localTracks}
          />
        </Box>
      ))}
    </Box>
  );
};

export default ParticipantPane;
