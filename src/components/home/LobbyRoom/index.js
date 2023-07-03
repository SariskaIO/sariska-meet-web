import {
  Box,
  Hidden,
  makeStyles,
  Typography,
} from "@material-ui/core";
import React, { useEffect, useState, useRef } from "react";
import SariskaMediaTransport from "sariska-media-transport";
import { color } from "../../../assets/styles/_color";
import { useHistory } from "react-router-dom";
import { addConference } from "../../../store/actions/conference";
import {
  getToken,
  getRandomColor,
  getMeetingId
} from "../../../utils";
import { addThumbnailColor } from "../../../store/actions/color";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import CircularProgress from "@material-ui/core/CircularProgress";
import TextInput from "../../shared/TextInput";
import { setProfile, setMeeting , updateProfile} from "../../../store/actions/profile";
import JoinTrack from "../JoinTrack";
import { addConnection } from "../../../store/actions/connection";
import SnackbarBox from "../../shared/Snackbar";
import { setDisconnected } from "../../../store/actions/layout";
import Logo from "../../shared/Logo";
import FancyButton from "../../shared/FancyButton";


const LobbyRoom = ({ tracks }) => {
  const history = useHistory();
  const audioTrack =  useSelector((state) => state.localTrack).find(track=>track?.isAudioTrack());  
  const videoTrack =  useSelector((state) => state.localTrack).find(track=>track?.isVideoTrack());  
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [meetingId, setMeetingId] = useState();
  const [name, setName] = useState("");
  const [buttonText, setButtonText] = useState("Start Meeting");
  const profile = useSelector((state) => state.profile);
  const queryParams = useParams();
  const iAmRecorder = window.location.hash.indexOf("iAmRecorder") >= 0;
  const testMode = window.location.hash.indexOf("testMode") >= 0;
  const notification = useSelector((state) => state.notification);
  const moderator = useRef(true);

  const useStyles = makeStyles((theme) => ({
    root: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: 'flex-start'
    },
    permissions: {
      display: "flex",
      justifyContent: "space-around",
      paddingLeft: "0",
      paddingRight: "0",
      marginTop: "3.73vh",
      "& svg": {
        //border: `1px solid ${color.white}`,
        padding: "12px 0px",
        borderRadius: "7.5px",
        color: color.white,
        fontSize: "1.87vw",
        "&:hover": {
          color: color.primaryLight,
          cursor: "pointer",
        },
        [theme.breakpoints.down("sm")]: {
          fontSize: "1.6rem",
        }
      },
      [theme.breakpoints.down("sm")]: {
        marginTop: "10px !important",
        padding: '0 50px',
        width: '250px',
        margin: 'auto'
      }
    },
  
    joinPermissions: {
      display: "flex",
      justifyContent: "space-around",
      paddingLeft: "0",
      paddingRight: "0",
      marginTop: "3.73vh",
      //marginBottom: theme.spacing(3),
      "& svg": {
        //border: `1px solid ${color.white}`,
        padding: "12px 0px",
        borderRadius: "7.5px",
        color: color.white,
        fontSize: "1.87vw",
        "&:hover": {
          color: color.primaryLight,
          cursor: "pointer",
        },
        [theme.breakpoints.down("sm")]: {
          fontSize: "1.6rem",
        }
      },
      [theme.breakpoints.down("sm")]: {
        marginTop: "10px !important",
        padding: '0 50px',
        width: '250px',
        margin: 'auto'
      }
    },
    disable: {
      background: color.red,
      "&:hover": {
        opacity: "0.8",
        background: `${color.red} !important`,
      },
    },
    textBox: {
      width: "100%",
      //marginBottom: "60px"
    },
    userBox: {
      marginTop: '1vh',
      marginBottom: '1vh',
      [theme.breakpoints.down("sm")]: {
        marginTop: '10px',
        marginBottom: '10px'
      }
    },
    moderatorBox: {
      display: "flex",
      justifyContent: "space-between",
      color: color.lightgray1,
      alignItems: "center",
      padding: "0px 8px 8px",
    },
    action: {
      opacity: .9
    },
    anchor: {
      color: color.white,
      textDecoration: "none",
      border: `1px solid ${color.primaryLight}`,
      padding: theme.spacing(0.5, 5),
      borderRadius: "10px",
      textTransform: "capitalize",
      marginTop: '5.4vh',
      width: '178.69px',
      "&:hover": {
        fontWeight: "900",
        background: `linear-gradient(to right, ${color.primaryLight}, ${color.buttonGradient}, ${color.primary})`,
      }
    },
    videoContainer: {
      borderRadius: "4px",
      backgroundColor: color.blurEffect,
      backdropFilter: `blur(48px)`,	
      '-webkit-backdrop-filter': 'blur(48px)',
      transition: `background-color .2s ease`,
      display: "flex",
      justifyContent: "space-between",
      flexDirection: "column",
      zIndex: 1,
      padding: "1.74vw",
      border: `1px solid ${color.whitePointOne}`,
      marginLeft: '15%',
      marginRight: 'auto',
      minHeight: '60vh',
      [theme.breakpoints.down("sm")]: {
        padding: "24px 0",
        backgroundColor: videoTrack?.isMuted() ? color.blurEffect : color.lightBlurEffect,
        minHeight:queryParams.meetingId ? '40vh' : '60vh',
        border: `1px solid ${color.whitePointOne}`,
        borderRadius: "20px 20px 0px 0px",
        marginLeft: 0,
        marginRight: 0,
        width: '100%'
      }
    },
    logoContainer: {},
    header: {
      color: color.white,
      textAlign: "center",
      fontSize: "2.385vw",
      fontWeight: 300,
      marginTop: '5.5vh',
      [theme.breakpoints.down("sm")]: {
        fontSize: "1.7rem",
        marginTop: '0',
      }
    },
    headerJoin: {
      color: color.white,
      textAlign: "center",
      fontSize: "2.385vw",
      fontWeight: 300,
      marginTop: theme.spacing(11),
      [theme.breakpoints.down("sm")]: {
        fontSize: "1.7rem",
        marginTop: '0',
      }
    },
    wrapper: {
      margin: "2.3vh 0px 0.5vh 0px",
      position: "relative",
      textAlign: "center",
      [theme.breakpoints.down("sm")]: {
        marginTop: 0,
        marginBottom: 0,
      }
    },
    buttonSuccess: {
      backgroundColor: color.primary,
      "&:hover": {
        backgroundColor: color.primary,
      },
    },
    buttonProgress: {
      color: color.primary,
      position: "absolute",
      bottom: "4.5vh",
      top: "30px",
      left: "50%",
      marginLeft: -12,
    },
    buttonProgressJoin: {
      color: color.primary,
      top: "30px",
      position: "absolute",
      bottom: '4.5vh',
      left: "50%",
      marginLeft: -12,
    },
  }));

  const classes = useStyles();
  
  const handleSubmit = async (queryMeetingId) => {
    console.log('submitted')
    setLoading(true);
    let avatarColor = profile?.color ?  profile?.color : getRandomColor();
    dispatch(updateProfile({key: "color", value: avatarColor}));
    const token = await getToken();
    let meetingTitle = queryMeetingId ? queryMeetingId : meetingId;
    console.log('tokne1', token, meetingTitle);
    const connection = new SariskaMediaTransport.JitsiConnection(
      token,
      meetingTitle,
      process.env.REACT_APP_ENV === "development" ? true : false
    );

    connection.addEventListener(
      SariskaMediaTransport.events.connection.CONNECTION_ESTABLISHED,
      () => {
        dispatch(addConnection(connection));
        createConference(connection, meetingTitle);
      }
    );

    connection.addEventListener(
      SariskaMediaTransport.events.connection.CONNECTION_FAILED,
      async (error) => {
        console.log(" CONNECTION_DROPPED_ERROR", error);
        if (
          error === SariskaMediaTransport.errors.connection.PASSWORD_REQUIRED
        ) {
          const token = await getToken();
          connection.setToken(token); // token expired, set a new token
        }
        if (
          error ===
          SariskaMediaTransport.errors.connection.CONNECTION_DROPPED_ERROR
        ) {
          dispatch(setDisconnected("lost"));
        }
      }
    );

    connection.addEventListener(
      SariskaMediaTransport.events.connection.CONNECTION_DISCONNECTED,
      (error) => {
        console.log("connection disconnect!!!", error);
      }
    );

    connection.connect();
  };

  const createConference = async (connection, meetingTitle) => {
    const conference = connection.initJitsiConference();
    tracks.forEach(async track => await conference.addTrack(track));

    conference.addEventListener(
      SariskaMediaTransport.events.conference.CONFERENCE_JOINED,
      () => {
        setLoading(false);
        dispatch(addConference(conference));
        dispatch(setProfile(conference.getLocalUser()));
        dispatch(setMeeting({ meetingTitle }));
        dispatch(addThumbnailColor({participantId: conference?.myUserId(), color:  profile?.color}));
      }
    );

    conference.addEventListener(
      SariskaMediaTransport.events.conference.USER_ROLE_CHANGED,
      (id) => {
        console.log('USER_ROLE_CHANGED', id, conference, conference.isModerator())
        if (conference.isModerator() && !testMode) {
          //conference.enableLobby();
          history.push(`/${meetingTitle}`);
        } else {
          history.push(`/${meetingTitle}`);
        }
      }
    );

    conference.addEventListener(
      SariskaMediaTransport.events.conference.CONFERENCE_ERROR,
      () => {
        setLoading(false);
      }
    );

    conference.addEventListener(
      SariskaMediaTransport.events.conference.USER_JOINED,
      (id) => {
        console.log('user_joined', id)
      }
    );

    conference.join();
  };

  if (iAmRecorder && !meetingId) {
    setName("recorder");
    setMeetingId(queryParams.meetingId);
  }
console.log('meeting', meetingId, testMode, iAmRecorder, window.location)
  useEffect(() => {
    if (meetingId && (testMode || iAmRecorder)) {
      console.log('firstrun')
      handleSubmit();
    }
  }, [meetingId]);

  useEffect(() => {
    if(queryParams?.meetingTitle){
    }else{
      
    }
    if (!iAmRecorder ) {
        setLoading(true);
    } else {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (queryParams.meetingId) {
      console.log('secondrun')
      setMeetingId(queryParams.meetingId);
      handleSubmit(queryParams.meetingId);
    }else{
      setMeetingId(getMeetingId())
    }
  }, []);

  return (
    <Box className={classes.root}>
      <JoinTrack tracks={tracks} name={name} />
      <Box className={classes.videoContainer}>
        <Hidden smDown>
        <Box className={classes.logoContainer}>
          <Logo height={"80px"} />
        </Box>
        </Hidden>
        <Box style={{textAlign: 'center', position: 'relative'}}>
        <FancyButton 
              homeButton={true}
              disabled={!loading}
              onClick={handleSubmit}
              buttonText={buttonText}
            />
            {!loading && (
              <CircularProgress size={24} className={ !queryParams?.meetingId ? classes.buttonProgress : classes.buttonProgressJoin} />
            )}
            </Box>
      </Box>
      <SnackbarBox notification={notification} />
    </Box>
  );
};

export default LobbyRoom;