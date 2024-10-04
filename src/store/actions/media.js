import { SET_CAMERA, SET_MICROPHONE, SET_RESOLUTION, SET_SPEAKER, SET_DEVICES ,TOGGLE_COLLABORATION,SET_PICTURE_IN_PICTURE} from "./types"

export const setMicrophone = (value) => {
    return {
        type: SET_MICROPHONE,
        payload: value
    }
}

export const setSpeaker = (value) => {
    return {
        type: SET_SPEAKER,
        payload: value
    }
}

export const setDevices = (value) => {
    return {
        type: SET_DEVICES,
        payload: value
    }
}

export const setCamera = (value) => {
    return {
        type: SET_CAMERA,
        payload: value
    }
}


export const setYourResolution = (value) => {
    return {
        type: SET_RESOLUTION,
        payload: value
    }
}
export const setPictureInPicture = (mode) => {
    return {
        type: SET_PICTURE_IN_PICTURE,
        payload: mode
    }
}
export const toggleCollaboration = (flag) => {
    return {
        type: TOGGLE_COLLABORATION,
        payload: flag
    }
}