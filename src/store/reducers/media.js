import {
  SET_CAMERA,
  SET_MICROPHONE,
  SET_RESOLUTION,
  SET_SPEAKER,
  SET_DEVICES,
  SET_PICTURE_IN_PICTURE,
  TOGGLE_COLLABORATION
} from "../actions/types";

const initialState = {
  microphone: "",
  speaker: "",
  camera: "",
  devices: null,
  resolution: 720,
  aspectRatio: 16/9,
  pictureInPicture: false,
  collaboration: false
};

export const media = (state = initialState, action) => {
  switch (action.type) {
    case SET_MICROPHONE:
      state.microphone = action.payload;
      return {
        ...state,
      };
    case SET_SPEAKER:
      state.speaker = action.payload;
      return {
        ...state,
      };
    case SET_CAMERA:
      state.camera = action.payload;
      return {
        ...state,
      };
    case SET_DEVICES:
      state.devices = action.payload;
      return {
        ...state,
      };    
    case SET_RESOLUTION:
      state.resolution = action.payload.resolution;
      state.aspectRatio = action.payload.aspectRatio;
      return {
        ...state,
      };
      case SET_PICTURE_IN_PICTURE:
        state.pictureInPicture = action.payload;
        return {...state};
        
      case TOGGLE_COLLABORATION:
        state.collaboration = action.payload;
        return {
          ...state
        };
    default:
      return state;
  }
};
