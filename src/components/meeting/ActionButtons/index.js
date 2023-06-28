import {
  Badge,
  Box,
  Hidden,
  makeStyles,
} from "@material-ui/core";
import React, { useEffect, useRef, useState } from "react";
import SariskaMediaTransport from "sariska-media-transport";
import { color } from "../../../assets/styles/_color";
import { useHistory } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import classnames from "classnames";
import CallEndIcon from "@material-ui/icons/CallEnd";
import ScreenShareIcon from "@material-ui/icons/ScreenShare";
import StopScreenShareIcon from '@material-ui/icons/StopScreenShare';
import AlbumIcon from "@material-ui/icons/Album";
import {
  addLocalTrack,
  removeLocalTrack,
} from "../../../store/actions/track";
import {
  ENTER_FULL_SCREEN_MODE,
  EXIT_FULL_SCREEN_MODE,
  RECORDING_ERROR_CONSTANTS,
  DROPBOX_APP_KEY,
} from "../../../constants";
import {
  setFullScreen,
  setPresenter
} from "../../../store/actions/layout";
import { clearAllReducers } from "../../../store/actions/conference";
import {
  exitFullscreen,
  formatAMPM,
  isFullscreen,
  requestFullscreen,
} from "../../../utils";
import { withStyles } from "@material-ui/styles";
import { showSnackbar } from "../../../store/actions/snackbar";
import StyledTooltip from "../../shared/StyledTooltip";
import { showNotification } from "../../../store/actions/notification";
import { authorizeDropbox } from "../../../utils/dropbox-apis";

const StyledBadge = withStyles((theme) => ({
  badge: {
    background: color.primary,
    top: 6,
    right: 10,
  },
}))(Badge);

const useStyles = makeStyles((theme) => ({
  root: {
    height: "44px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    bottom: "16px",
    width: "100%",
    position: "fixed",
    color: color.white,
    [theme.breakpoints.down("sm")]: {
      bottom: "0px",
      background: color.secondaryDark,
      height: '60px'
    },
    "& svg": {
      padding: "8px",
      borderRadius: "8px",
      marginRight: "2px",
      [theme.breakpoints.down("sm")]: {
        background: color.secondary,
        borderRadius: '50%',
        marginRight: "12px",
      },
      "&:hover": {
        opacity: "0.8",
        cursor: "pointer",
        color: color.primaryLight,
      },
    },
  },
  active: {
    opacity: "0.8",
    cursor: "pointer",
    color: color.red,
  },
  panTool: {
    fontSize: "18px",
    padding: "12px !important",
    marginRight: "12px",
  },
  infoContainer: {
    marginLeft: "20px",
    display: "flex",
    width: "350px",
  },
  separator: {
    marginLeft: "10px",
    marginRight: "10px",
  },
  screenShare: {
    padding: "8px",
    marginRight: "2px",
    borderRadius: "8px",
    [theme.breakpoints.down("sm")]: {
      background: color.secondary,
      borderRadius: '50%',
      marginRight: "12px",
    },
  },
  permissions: {
    display: "flex",
    alignItems: "center",
    padding: "0px 5px",
    backgroundColor: color.secondary,
    borderRadius: "7.5px",
    marginRight: "24px",
    [theme.breakpoints.down("sm")]: {
      backgroundColor: "transparent",
      margin: 'auto',
      position: 'relative',
      bottom: '0px'
    },
  },
  end: {
    background: `${color.red} !important`,
    borderColor: `${color.red} !important`,
    padding: "2px 12px !important",
    textAlign: "center",
    borderRadius: "30px !important",
    width: "42px",
    fontSize: "36px",
    marginRight: 0,
    "&:hover": {
      opacity: "0.8",
      background: `${color.red} !important`,
      cursor: "pointer",
      color: `${color.white} !important`,
    },
    [theme.breakpoints.down("sm")]: {
      padding: "8px !important",
      width: "40px",
      fontSize: "24px",
    },
  },
  subIcon: {
    border: "none !important",
    marginRight: "0px !important",
    marginLeft: "4px !important",
  },
  more: {
    marginRight: "0px !important",
  },
  drawer: {
    "& .MuiDrawer-paper": {
      overflowX: "hidden",
      top: "16px",
      bottom: "80px",
      right: "16px",
      borderRadius: "10px",
      height: "89%",
      width: "360px",
      backgroundColor: color.secondary,
      overflowY: "auto",
    },
  },
  list: {
    padding: theme.spacing(3, 3, 0, 3),
    height: "100%",
  },
  title: {
    color: color.white,
    fontWeight: "400",
    marginLeft: "8px",
    fontSize: "28px",
    lineHeight: "1",
    [theme.breakpoints.down("sm")]: {
      marginLeft: 0,
      fontSize: '24px'
    }
  },
  participantHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    "& svg": {
      color: color.white
    }
  },
  chatList: {
    height: "100%",
    padding: theme.spacing(3, 3, 0, 3),
  },
  chat: {
    marginRight: "0px !important",
    fontSize: "20px",
    padding: "10px !important",
  },
  moreActionList: {
    height: "100%",
    width: "260px",
    padding: theme.spacing(1, 0, 0, 0),
    backgroundColor: color.secondary,
  },
}));

const ActionButtons = ({ dominantSpeakerId }) => {
  const history = useHistory();
  const classes = useStyles();
  const dispatch = useDispatch();
  const conference = useSelector((state) => state.conference);
  const localTracks = useSelector((state) => state.localTrack);
  const [presenting, setPresenting] = useState(false);
  const [time, setTime] = useState(formatAMPM(new Date()));
  const profile = useSelector((state) => state.profile);
  const [featureStates, setFeatureStates] = useState({});
  const recordingSession = useRef(null);


  const action = (actionData) => {
    featureStates[actionData.key] = actionData.value;
    setFeatureStates({ ...featureStates });
  };

  const shareScreen = async () => {
    let desktopTrack;
    try {
      const tracks = await SariskaMediaTransport.createLocalTracks({
        resolution: 720,
        devices: ["desktop"],
      });
      desktopTrack = tracks.find((track) => track.videoType === "desktop");
    } catch (e) {
      dispatch(
        showSnackbar({
          autoHide: true,
          message:
            "Oops, Something wrong with screen sharing permissions. Try reload",
        })
      );
      return;
    }
    await conference.addTrack(desktopTrack);
    desktopTrack.addEventListener(
      SariskaMediaTransport.events.track.LOCAL_TRACK_STOPPED,
      async () => {
        stopPresenting();
      }
    );
    conference.setLocalParticipantProperty("presenting", "start");
    dispatch(addLocalTrack(desktopTrack));
    dispatch(
      setPresenter({ participantId: conference.myUserId(), presenter: true })
    );
    setPresenting(true);
  };

  const stopPresenting = async () => {
    const desktopTrack = localTracks.find(
      (track) => track.videoType === "desktop"
    );
    await conference.removeTrack(desktopTrack);
    dispatch(
      setPresenter({ participantId: conference.myUserId(), presenter: false })
    );
    dispatch(removeLocalTrack(desktopTrack));
    conference.setLocalParticipantProperty("presenting", "stop");
    setPresenting(false);
  };


  const toggleFullscreen = () => {
    if (isFullscreen()) {
      exitFullscreen();
    } else {
      requestFullscreen();
    }
  };

  const AddFShandler = () => {
    if (isFullscreen()) {
      dispatch(setFullScreen(ENTER_FULL_SCREEN_MODE));
    } else {
      dispatch(setFullScreen(EXIT_FULL_SCREEN_MODE));
    }
  };

  const addFullscreenListeners = () => {
    document.addEventListener("fullscreenchange", AddFShandler);
    document.addEventListener("webkitfullscreenchange", AddFShandler);
    document.addEventListener("mozfullscreenchange", AddFShandler);
    document.addEventListener("MSFullscreenChange", AddFShandler);
  };

  const removeFullscreenListeners = () => {
    document.removeEventListener("fullscreenchange", AddFShandler);
    document.removeEventListener("webkitfullscreenchange", AddFShandler);
    document.removeEventListener("mozfullscreenchange", AddFShandler);
    document.removeEventListener("MSFullscreenChange", AddFShandler);
  };


  const startRecording = async () => {
    if (featureStates.recording) {
      return;
    }

    if (conference?.getRole() === "none") {
      return dispatch(
        showNotification({
          severity: "info",
          autoHide: true,
          message: "You are not moderator!!",
        })
      );
    }

    const response = await authorizeDropbox();
    if (!response?.token) {
      return dispatch(
        showNotification({
          severity: "error",
          message: "Recording failed no dropbox token",
        })
      );
    }
    const appData = {
      file_recording_metadata: {
        upload_credentials: {
          service_name: "dropbox",
          token: response.token,
          app_key: DROPBOX_APP_KEY,
          r_token: response.rToken,
        },
      },
    };

    dispatch(
      showSnackbar({
        severity: "info",
        message: "Starting Recording",
        autoHide: false,
      })
    );

    const session = await conference.startRecording({
      mode: SariskaMediaTransport.constants.recording.mode.FILE,
      appData: JSON.stringify(appData),
    });
    recordingSession.current = session;
  };

  const stopRecording = async () => {
    if (!featureStates.recording) {
      return;
    }
    if (conference?.getRole() === "none") {
      return dispatch(
        showNotification({
          severity: "info",
          autoHide: true,
          message: "You are not moderator!!",
        })
      );
    }
    await conference.stopRecording(
      localStorage.getItem("recording_session_id")
    );
  };
  


  useEffect(() => {

    const interval = setInterval(() => {
      setTime(formatAMPM(new Date()));
    }, 1000);
    document.addEventListener("dblclick", toggleFullscreen);
    addFullscreenListeners();
    return () => {
      document.removeEventListener("dblclick", toggleFullscreen);
      clearInterval(interval);
      removeFullscreenListeners();
    };
  }, []);

  useEffect(() => {
    conference.getParticipantsWithoutHidden().forEach((item) => {
      if (item._properties?.recording) {
        action({ key: "recording", value: true });
      }
    });

    conference.addEventListener(
      SariskaMediaTransport.events.conference.RECORDER_STATE_CHANGED,
      (data) => {

        if (data._status === "on" && data._mode === "file") {
          conference.setLocalParticipantProperty("recording", true);
          dispatch(
            showSnackbar({ autoHide: true, message: "Recording started" })
          );
          action({ key: "recording", value: true });
          localStorage.setItem("recording_session_id", data?._sessionID);
        }

        if (data._status === "off" && data._mode === "file") {
          conference.removeLocalParticipantProperty("recording");
          dispatch(
            showSnackbar({ autoHide: true, message: "Recording stopped" })
          );
          action({ key: "recording", value: false });
        }

        if (data._mode === "file" && data._error) {
          conference.removeLocalParticipantProperty("recording");
          dispatch(
            showSnackbar({
              autoHide: true,
              message: RECORDING_ERROR_CONSTANTS[data._error],
            })
          );
          action({ key: "recording", value: false });
        }
      }
    );
  }, []);

  const leaveConference = () => {
    dispatch(clearAllReducers());
    history.push("/leave");
  };
  
  return (
    <Box id="footer" className={classes.root}>
      <Hidden mdDown>
        <Box className={classes.infoContainer}>
          <Box>{time}</Box>
          <Box className={classes.separator}>|</Box>
          <Box>{profile.meetingTitle}</Box>
        </Box>
      </Hidden>
      <Hidden mdDown>
        <StyledTooltip title="Leave Call">
          <CallEndIcon onClick={leaveConference} className={classes.end} />
        </StyledTooltip>
      </Hidden>
      <Box className={classes.permissions}>
        
        <StyledTooltip title={presenting ? "Stop Presenting" : "Share Screen"}>
          {presenting ? (
            <StopScreenShareIcon className={classnames(classes.active, classes.screenShare)}
            onClick={stopPresenting} />
          ) : (
            <ScreenShareIcon className={ classes.screenShare}
             onClick={shareScreen} />
          )}
        </StyledTooltip>
        <StyledTooltip title={featureStates.recording ? "Stop Recording" : "Start Recording"}>
          {featureStates.recording ? (
            <AlbumIcon className={classnames(classes.active, classes.screenShare)}
            onClick={stopRecording} />
          ) : (
            <AlbumIcon className={ classes.screenShare}
             onClick={startRecording} />
          )}
        </StyledTooltip>
        <Hidden mdUp>
        <StyledTooltip title="Leave Call">
          <CallEndIcon onClick={leaveConference} className={classes.end} />
        </StyledTooltip>
      </Hidden>
      </Box>
    </Box>
  );
};

export default ActionButtons;
