import React, {useEffect, useState} from "react";

import {makeStyles, Box, Grid} from "@material-ui/core";
import {color} from "../../assets/styles/_color";
import LobbyRoom from "../../components/home/LobbyRoom";
import SariskaMediaTransport from "sariska-media-transport";
import {addLocalTrack} from "../../store/actions/track";
import {useDispatch, useSelector} from "react-redux";
import { setDevices } from "../../store/actions/media";

const useStyles = makeStyles((theme) => ({
    googleBtn: {
        cursor: "pointer",
        width: "210px",
        height: "42px",
        backgroundColor: "#4285f4",
        borderRadius: "2px",
        boxShadow: "0 3px 4px 0 rgba(0,0,0,.25)"
    },
    microsoftBtn: {
        color: "#5e5e5e",
        cursor: "pointer",
        width: "210px",
        height: "42px",
        backgroundColor: "#ffffff",
        borderRadius: "2px",
        boxShadow: "0 3px 4px 0 rgba(0,0,0,.25)"
    },
    googleIconWrapper: {
        position: "absolute",
        marginTop: "1px",
        marginLeft: "1px",
        width: "40px",
        height: "40px",
        borderRadius: "2px",
        backgroundColor: "#fff"
    },
    googleIcon: {
        position: "absolute",
        marginTop: "11px",
        marginLeft: "11px",
        width: "18px",
        height: "18px"
    },
    btnText: {
        float: "right",
        margin: "11px",
        color: "#fff",
        fontSize: "14px"
    },
    btnTextMicrosoft: {
        float: "right",
        margin: "11px",
        color: "#5e5e5e",
        fontSize: "14px"
    },
    root: {
        minHeight: "100vh",
        background: color.secondaryDark,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        [theme.breakpoints.down("sm")]: {
            alignItems: "flex-end",
        }
    },

    cardContainer: {
        [theme.breakpoints.down("xs")]: {
            minWidth: "300px",
        },
        borderRadius: "8px",
        background: "white",
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: 'column',
    },
    calenderEntries: {
        width: "90%",
        overflow: "auto",
        background: "#c7ddff",
        borderRadius: "8px",
        padding: "11px"
    },
    calenderEntriesRow: {
        background: "#fff",
        boxSizing: "border-box",
        borderRadius: "4px",
        margin: "4px 4px 4px 4px",
        minHeight: "60px",
        width: "calc(100% - 8px)",
        wordBreak: "break-word",
        textAlign: "left",
        fontSize: "14px",
        color: "#253858",
        lineHeight: "20px",
        textOverflow: "ellipsis",
        position: "relative",
        overflow: "auto",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingLeft: "10px",
        paddingRight: "10px"
    },
    rightContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    cardHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        margin: theme.spacing(0, 1, 1, 1),
    },
    left: {
        height: '100%',
    },
    leftBox: {
        height: "450px",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
    },
    calenderHeader: {
        fontSize: "20px",
        color: "black",
        margin: "15px",
    },
    gridContainer: {
        justifyContent: "space-around"
    },
    gridChild: {
        [theme.breakpoints.down("sm")]: {
            width: '100%'
        }
    },
    logo: {
        width: "20px",
        marginTop: "7px",
        marginRight: "8px"
    },
    title: {
        marginLeft: '24px',
        fontSize: '1.8rem',
        width: '190px'
    },
    anchor: {
        color: color.white,
        textDecoration: "none",
        "&:hover": {
            color: color.primary,
        },
    },
    joinBtn: {
        cursor: "pointer",
        color: color.primary
    },
    buttonProgress: {
        color: color.primary
    },
    loginBox: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
    },
    bottomText: {
        textAlign: "center",
        padding: "10px"
    },
    separator: {
        padding: "10px"
    },
    slackBtn: {
        cursor: "pointer"
    },
    slackContainer: {
        position: "absolute",
        left: "22px",
        bottom: "22px"
    }
}));

const Home = () => {
    const dispatch = useDispatch();
    const localTracksRedux = useSelector(state => state.localTrack);
    SariskaMediaTransport.initialize({disableSimulcast: true});
    SariskaMediaTransport.setLogLevel(SariskaMediaTransport.logLevels.ERROR); //TRACE ,DEBUG, INFO, LOG, WARN, ERROR
    const classes = useStyles();
    const [localTracks, setLocalTracks] = useState([]);
    const iAmRecorder = window.location.hash.indexOf("iAmRecorder") >= 0;

    useEffect(() => {
        SariskaMediaTransport.mediaDevices.enumerateDevices((allDevices) => {
          dispatch(setDevices(allDevices));
        });
      }, []);

    useEffect(()=>{
        if (iAmRecorder) {
            setLocalTracks([]);
            return;
        }
        if (localTracksRedux.length > 0)  {
            return;
        }
        const createNewLocalTracks = async () => {
            let tracks = [];
            setLocalTracks(tracks);
            tracks.forEach(track=>dispatch(addLocalTrack(track)));
        };
        createNewLocalTracks();
    },[])

    return (
        <Box className={classes.root}>
            <Grid className={classes.gridContainer} container>
                <Grid item md={12} className={classes.gridChild}>
                    <Box >
                        <LobbyRoom tracks={localTracks}/>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Home;