import React, { useEffect, useRef, useState } from "react";
import MenuList from "@material-ui/core/MenuList";
import MenuItem from "@material-ui/core/MenuItem";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Typography from "@material-ui/core/Typography";
import { color } from "../../../assets/styles/_color";
import { Box, Drawer, Hidden } from "@material-ui/core";
import CopyLink from "../CopyLink";
import { useDispatch, useSelector } from "react-redux";
import AlbumIcon from "@material-ui/icons/Album";
import PublicIcon from "@material-ui/icons/Public";
import FlipToFrontIcon from "@material-ui/icons/FlipToFront";
import DescriptionIcon from "@material-ui/icons/Description";
import SettingsIcon from "@material-ui/icons/Settings";
import CreateIcon from "@material-ui/icons/Create";
import CloseIcon from "@material-ui/icons/Close";
import GroupIcon from "@material-ui/icons/Group";
import ChatIcon from "@material-ui/icons/Chat";
import ViewListIcon from "@material-ui/icons/ViewList";
import ViewComfyIcon from "@material-ui/icons/ViewComfy";
import {
  DROPBOX_APP_KEY,
  PRESENTATION,
  SHARED_DOCUMENT,
  SPEAKER,
  WHITEBOARD,
} from "../../../constants";
import LiveStreamDialog from "../LiveStreamDialog";
import VirtualBackground from "../VirtualBackground";
import { showSnackbar } from "../../../store/actions/snackbar";
import { showNotification } from "../../../store/actions/notification";
import googleApi from "../../../utils/google-apis";
import SariskaMediaTransport from "sariska-media-transport/dist/esm/SariskaMediaTransport";
import { authorizeDropbox } from "../../../utils/dropbox-apis";
import SettingsBox from "../../meeting/Settings";
import classnames from "classnames";
import DrawerBox from "../DrawerBox";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    backgroundColor: color.secondary,
    boxShadow: "none",
    color: color.white,
    "& .MuiList-padding": {
      paddingTop: "0px",
    },
    "& ul>li:first-child": {
      marginTop: 0,
    },
    "& .MuiListItem-root": {
      height: "40px",
      marginTop: "10px",
      marginBottom: "20px",
      paddingLeft: "6px",
      borderRadius: "7.5px",
      "&:hover": {
        backgroundColor: color.secondaryLight,
        borderRadius: "7.5px",
      },
    },
    "& span.material-icons": {
      color: color.white,
    },
    "& svg": {
      color: color.white,
    },
  },
  drawer: {
    "& .MuiDrawer-paper": {
      overflow: "hidden",
      top: "64px",
      height: "82%",
      right: "10px",
      borderRadius: "10px",
    },
  },
  detailedList: {
    width: "360px",
    padding: theme.spacing(3),
    "& h6": {
      paddingLeft: "10px",
    },
  },
  title: {
    color: color.secondary,
    fontWeight: "900",
  },
  header: {
    marginBottom: "24px", 
    [theme.breakpoints.down("sm")]: {
      //padding: theme.spacing(0,0,3,0),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }
  },
  cardTitle: {
    color: color.white,
    fontWeight: "400",
    marginLeft: "8px",
    fontSize: "28px",
    lineHeight: "1",
    //marginBottom: '24px',
        [theme.breakpoints.down("sm")]: {
          fontSize: '24px'
      }
  },
  urlBox: {
    padding: "24px 10px",
    "& h5": {
      fontSize: "1rem",
      fontWeight: "900",
      paddingBottom: theme.spacing(2),
    },
  },
  stopRecording: {
    color: `${color.primaryLight} !important`,
  },
  stopCaption: {
    color: `${color.primaryLight} !important`,
  },
  startCaption: {
    color: 'white'
  },
  startRecording: {
    color: color.white,
  },
  virtualList: {
    overflowY: "scroll",
    height: "95%",
  },
  settingsList: {},
}));

export default function MoreAction({
  featureStates,
  onClick
}) {
  const classes = useStyles();
  const conference = useSelector((state) => state.conference);

  const dispatch = useDispatch();
  const recordingSession = useRef(null);

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

  const menuData = [
    {
      icon: (
        <AlbumIcon
          className={
            featureStates.recording
              ? classes.stopRecording
              : classes.startRecording
          }
        />
      ),
      title: featureStates.recording ? "Stop Recording" : "Start Recording",
      onClick: featureStates.recording ? stopRecording : startRecording,
    }
  ];

  return (
    <>
      <Paper className={classes.root}>
        <Box className={classes.header}>
          <Typography variant="h6" className={classes.cardTitle}>
            Activities
          </Typography>
          <Hidden mdUp>
            <CloseIcon onClick={onClick} />
          </Hidden>
        </Box>
        <MenuList>
          {menuData.map((menu, index) => (
            <>
              {(
                <MenuItem onClick={menu.onClick} key={index}>
                  <ListItemIcon>{menu.icon}</ListItemIcon>
                  <Typography variant="inherit">{menu.title}</Typography>
                </MenuItem>
              )}
            </>
          ))}
        </MenuList>
      </Paper>
    </>
  );
}
