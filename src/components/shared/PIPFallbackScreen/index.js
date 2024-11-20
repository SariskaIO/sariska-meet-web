import { Button, makeStyles, Typography } from '@material-ui/core';
import React from 'react'
import meetingSVG from "../../../assets/images/meeting/meeting.svg";
import { exitPipMode } from "../../../utils";
import { color } from '../../../assets/styles/_color';

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      color: "#B8B8B8",
      textAlign: "center",
      padding: theme.spacing(4),
      height: '100%'
    },
    iconContainer: {
              marginBottom: theme.spacing(2),
              "& svg": {
                width: 100,
                height: 100,
                color: "#636363",
              },
    },
    buttonStyle: {
              color: color.white,
              textDecoration: "none",
              border: `1px solid ${color.primaryLight}`,
              padding: "4px 40px",
              borderRadius: "10px",
              textTransform: "none",
              marginTop: theme.spacing(3),
              width: "251px", // Set your width here
              transition: "0.1s all ease",
              fontSize: "15px", // Customize font size here
              
              "&:hover": {
                background: color.mainGradient,
                color: color.white,
                border: "1px solid transparent",
              },
              "&:active": {
                background: color.mainGradient,
                color: color.white,
                border: `1px solid ${color.primaryLight}`,
              },
              "&:focus": {
                    background: color.mainGradient,
                    color: color.white,
                    border: `1px solid ${color.primaryLight}`,
                },
                "&.MuiButton-root.Mui-disabled": {
                    color: color.white,
                    border: `1px solid ${color.primaryLight}`,
                },
            },
}));

const PIPFallbackScreen = () => {
    const classes = useStyles();
  return (
    <div className={classes.root}>
        <div
            className={classes.iconContainer}
            style={{ marginBottom: "12px" }}
          >
            <img
              src={meetingSVG}
              alt="pip fallback screen"
              style={{
                width: "300px",
                height: "300px",
                marginBottom: "-50px",
                marginTop: "-80px",
              }}
            />
          </div>
          <Typography variant="h5" style={{ marginBottom: "8px" }}>
          Your Meet call is open in another window. 
          </Typography>
          <Typography variant="body5">
            Picture-in-picture mode lets you stay connected to the call while multitasking.
            </Typography>
            <Button
              style={{ zIndex: 100 }}
              className={classes.buttonStyle}
              onClick={() => {
                exitPipMode();
              }}
            >
              Bring the call back here
            </Button>
    </div>
  )
}

export default PIPFallbackScreen