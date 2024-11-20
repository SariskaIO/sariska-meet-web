import { useLocation } from "react-router-dom";
import {
  GENERATE_TOKEN_URL,
  GET_PRESIGNED_URL,
  ENTER_FULL_SCREEN_MODE,
  LIVE_STREAMING_START_URL,
  LIVE_STREAMING_STOP_URL,
} from "../constants";
import linkifyHtml from "linkify-html";
import { toggleCollaboration } from "../store/actions/media";
import SariskaMediaTransport from "sariska-media-transport/dist/esm/SariskaMediaTransport";
import { store } from "../store";
import { localTrackMutedChanged } from "../store/actions/track";
import { togglePip } from "../store/actions/layout";

const Compressor = require("compressorjs");

export function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export function getMeetingId() {
  const characters = "abcdefghijklmnopqrstuvwxyz";
  function generateString(length) {
    let result = " ";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
  const str = generateString(9).trim();
  const strArr = str.match(/.{3}/g);
  return strArr.join("-");
}

export function getJitsiMeetGlobalNS() {
  if (!window.SariskaMediaTransport) {
    window.SariskaMediaTransport = {};
  }

  if (!window.SariskaMediaTransport.app) {
    window.SariskaMediaTransport.app = {};
  }

  return window.SariskaMediaTransport.app;
}

export function createDeferred() {
  const deferred = {};

  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  return deferred;
}

export async function getToken(profile, name, avatarColor) {
  const body = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apiKey: process.env.REACT_APP_SARISKA_MEET_APP_API_KEY,
      user: {
        id: profile.id,
        avatar: avatarColor,
        name: name,
        email: profile.email,
        // moderator: name === 'admin' ? true : false
      },
      exp: "48 hours",
    }),
  };

  try {
    const response = await fetch(GENERATE_TOKEN_URL, body);
    if (response.ok) {
      const json = await response.json();
      localStorage.setItem("SARISKA_TOKEN", json.token);
      return json.token;
    } else {
      console.log(response.status);
    }
  } catch (error) {
    console.log("error", error);
  }
}

export async function startStreamingInSRSMode(roomName, streamKey, flags) {
    if(!flags && !streamKey){
        console.log('stream key is missing');
        return;
    }
    const body = {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("SARISKA_TOKEN")}`
        },
        body: streamKey ? JSON.stringify({
            stream_keys: [
                {
                    'key': 'youtube',
                    'value': streamKey
                }
            ],
            room_name: roomName,
            is_low_latency: true
            }):
            JSON.stringify(flags)
    };
    try {
        const response = await fetch(LIVE_STREAMING_START_URL, body);
        if (response.ok) {
            const json = await response.json();
            return json;
        } else {
            console.log(response.message);
        }
    } catch (error) {
        console.log('error', error);
  }
}

export async function stopStreamingInSRSMode(roomName) {
    const body = {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("SARISKA_TOKEN")}`
        },
        body: JSON.stringify({
            room_name: roomName,
            is_low_latency: true
        })
    };
    try {
        const response = await fetch(LIVE_STREAMING_STOP_URL, body);
        if (response.ok) {
            const json = await response.json();
            return json;
        } else {
            console.log("Got some error in stopping streaming");
        }
    } catch (error) {
        console.log('error', error);
  }
}

export const getUserById = (id, conference) => {
    if (id === conference.myUserId()) {
        return conference.getLocalUser()
    }
    let participants = conference?.getParticipantsWithoutHidden();
    let participant = participants.find(participant => participant?._id === id)
    return participant?._identity?.user
}

export const clearAllTokens = () => {
  Object.entries(localStorage)
    .map((x) => x[0])
    .filter((x) => x.substring(0, 8) === "sariska_")
    .map((x) => localStorage.removeItem(x));
};

export function isSquare(n) {
  return n > 0 && Math.sqrt(n) % 1 === 0;
}

export function calculateSteamHeightAndExtraDiff(
  viewportWidth,
  viewportHeight,
  documentWidth,
  documentHeight,
  isPresenter,
  isActiveSpeaker
) {
  let videoStreamHeight = viewportHeight,
    videoStreamDiff = 0;
  if (isPresenter) {
    return { videoStreamHeight: viewportHeight, videoStreamDiff: 0 };
  }
  if (viewportWidth > documentWidth) {
    return { videoStreamHeight: (documentWidth * 9) / 16, videoStreamDiff: 0 };
  }
  if (viewportHeight * (16 / 9) < viewportWidth) {
    let diff = viewportWidth - (viewportHeight * 16) / 9;
    videoStreamHeight = (((viewportHeight * 16) / 9 + diff) * 9) / 16;
    videoStreamDiff = (viewportHeight * 16) / 9 + diff - viewportWidth;
  } else {
    videoStreamDiff = (viewportHeight * 16) / 9 - viewportWidth;
  }
  return { videoStreamHeight, videoStreamDiff };
}

export function calculateRowsAndColumns(
  totalParticipant,
  viewportWidth,
  viewportHeight
) {
  const actualWidth = viewportWidth;
  const actualHeight = viewportHeight;
  const numWindows = totalParticipant;
  let columns;
  let rows;
  let isAsymmetricView;
  let gridItemWidth, gridItemHeight, offset, lastRowOffset, lastRowWidth;
  if (isMobileOrTab()) {
    columns = totalParticipant > 3 ? 2 : 1;
    rows = totalParticipant > 8 ? 4 : Math.ceil(totalParticipant / columns);
    isAsymmetricView = totalParticipant > 0 ? true : false;
    if (totalParticipant > 8) {
      gridItemHeight = (viewportHeight - 2 * 12) / 4;
      gridItemWidth = viewportWidth - (columns + 1) * 12;
    }
  } else if (viewportWidth * 3 < viewportHeight) {
    columns = 1;
    rows = viewportWidth / columns;
    isAsymmetricView = true;
  } else if (viewportWidth > 3 * viewportHeight) {
    rows = 1;
    columns = viewportHeight / rows;
    isAsymmetricView = true;
  } else {
    columns = Math.ceil(Math.sqrt(numWindows));
    rows = Math.ceil(numWindows / columns);
  }

  if (isAsymmetricView) {
    viewportHeight = viewportHeight - (rows + 1) * 12;
    viewportWidth = viewportWidth - (columns + 1) * 12;

    gridItemHeight = viewportHeight / rows;
    gridItemWidth = viewportWidth / columns;

    offset = 0;
    lastRowOffset =
      (viewportWidth - (totalParticipant % (columns + 1)) * gridItemWidth) / 2;

    if (totalParticipant % columns === 0) {
      lastRowOffset = offset;
    }
    if (totalParticipant === 2) {
      viewportHeight = viewportHeight - (columns - 1) * 12;
      viewportWidth = viewportWidth - (columns - 1) * 12;
      gridItemHeight = viewportHeight / rows;
      gridItemWidth = viewportWidth;
      return {
        rows,
        columns,
        gridItemWidth,
        gridItemHeight, //viewportHeight / 2,
        offset: 12,
        lastRowWidth: gridItemWidth,
        lastRowOffset: 12,
      };
    }

    if (isSquare(totalParticipant) || totalParticipant <= 4) {
      viewportHeight = viewportHeight - (columns - 1) * 12;
      viewportWidth = viewportWidth - (columns - 1) * 12;
      gridItemHeight = viewportHeight / rows;
      gridItemWidth = viewportWidth / columns;
      offset = (viewportWidth - columns * gridItemWidth) / 2;
      const lastRowParticipantCount =
        totalParticipant % columns === 0 ? columns : totalParticipant % columns;
      lastRowOffset =
        (actualWidth -
          lastRowParticipantCount * gridItemWidth -
          (lastRowParticipantCount - 1) * 12) /
        2;

      return {
        rows,
        columns,
        gridItemWidth,
        gridItemHeight,
        offset,
        lastRowOffset,
        lastRowWidth: gridItemWidth,
      };
    }

    return {
      rows: rows,
      columns: columns,
      gridItemWidth,
      gridItemHeight,
      offset,
      lastRowOffset,
    };
  }

  if (totalParticipant === 1) {
    return {
      rows,
      columns,
      gridItemWidth: viewportWidth,
      gridItemHeight: viewportHeight,
    };
  }

  if (totalParticipant === 2) {
    viewportWidth = viewportWidth - 36;
    gridItemWidth = viewportWidth / (rows + 1);
    return {
      rows,
      columns,
      gridItemWidth,
      gridItemHeight: (gridItemWidth * 9) / 16,
      offset: 12,
      lastRowWidth: gridItemWidth,
      lastRowOffset: 12,
    };
  }

  if (isSquare(totalParticipant) || totalParticipant <= 4) {
    viewportHeight = viewportHeight - (columns - 1) * 12;
    viewportWidth = viewportWidth - (columns - 1) * 12;
    gridItemHeight = viewportHeight / rows;
    gridItemWidth = (gridItemHeight * 16) / 9;
    offset = (viewportWidth - columns * gridItemWidth) / 2;
    const lastRowParticipantCount =
      totalParticipant % columns === 0 ? columns : totalParticipant % columns;
    lastRowOffset =
      (actualWidth -
        lastRowParticipantCount * gridItemWidth -
        (lastRowParticipantCount - 1) * 12) /
      2;

    return {
      rows,
      columns,
      gridItemWidth,
      gridItemHeight,
      offset,
      lastRowOffset,
      lastRowWidth: gridItemWidth,
    };
  } else if (rows < columns) {
    viewportHeight = viewportHeight - (rows - 1) * 12;
    viewportWidth = viewportWidth - (columns + 1) * 12;
    gridItemWidth = viewportWidth / (rows + 1);
    gridItemHeight = viewportHeight / (columns - 1);
    lastRowWidth = (gridItemHeight * 16) / 9;
    offset = (viewportWidth - columns * gridItemWidth) / 2 || 12;
    if (
      totalParticipant % columns === 0 ||
      ((totalParticipant % columns) * gridItemHeight * 16) / 9 > actualWidth
    ) {
      lastRowWidth = gridItemWidth;
    }
    const lastRowParticipantCount =
      totalParticipant % columns === 0 ? columns : totalParticipant % columns;
    lastRowOffset =
      (actualWidth -
        lastRowParticipantCount * lastRowWidth -
        (lastRowParticipantCount - 1) * 12) /
      2;

    return {
      rows,
      columns,
      gridItemWidth,
      gridItemHeight,
      offset,
      lastRowOffset,
      lastRowWidth,
    };
  } else if (rows === columns) {
    rows = rows - 1;
    columns = columns + 1;
    viewportHeight = viewportHeight - (rows - 1) * 12;
    viewportWidth = viewportWidth - (columns + 1) * 12;

    gridItemHeight = viewportHeight / rows;
    gridItemWidth = viewportWidth / columns;
    offset = (viewportWidth - columns * gridItemWidth) / 2 || 12;
    lastRowWidth = (gridItemHeight * 16) / 9;
    if (
      totalParticipant % columns === 0 ||
      ((totalParticipant % columns) * gridItemHeight * 16) / 9 > actualWidth
    ) {
      lastRowWidth = gridItemWidth;
    }
    const lastRowParticipantCount =
      totalParticipant % columns === 0 ? columns : totalParticipant % columns;
    lastRowOffset =
      (actualWidth -
        lastRowParticipantCount * lastRowWidth -
        (lastRowParticipantCount - 1) * 12) /
      2;

    return {
      rows,
      columns,
      gridItemWidth,
      gridItemHeight,
      offset,
      lastRowWidth,
      lastRowOffset,
    };
  } else {
    viewportHeight = viewportHeight - (rows - 1) * 12;
    viewportWidth = viewportWidth - (columns + 1) * 12;

    gridItemHeight = viewportHeight / rows;
    gridItemWidth = viewportWidth / columns;

    offset = (viewportWidth - columns * gridItemWidth) / 2 || 12;
    lastRowWidth = (gridItemHeight * 16) / 9;
    if (
      totalParticipant % columns === 0 ||
      ((totalParticipant % columns) * gridItemHeight * 16) / 9 > actualWidth
    ) {
      lastRowWidth = gridItemWidth;
    }
    const lastRowParticipantCount =
      totalParticipant % columns === 0 ? columns : totalParticipant % columns;
    lastRowOffset =
      (actualWidth -
        lastRowParticipantCount * lastRowWidth -
        (lastRowParticipantCount - 1) * 12) /
      2;

    return {
      rows,
      columns,
      gridItemWidth,
      gridItemHeight,
      offset,
      lastRowWidth,
      lastRowOffset,
    };
  }
}

export function isMobile() {
  let check = false;
  (function (a) {
    if (
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
        a
      ) ||
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
        a.substr(0, 4)
      )
    )
      check = true;
  })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
}

export function isPortrait() {
  return window.innerWidth <= 620 ? true : false;
}

export function isTab() {
  return window.innerWidth > 620 && window.innerWidth < 960 ? true : false;
}

export function isMobileOrTab() {
  return window.innerWidth < 960 ? true : false;
}

export function getLeftTop(
  i,
  j,
  gridItemWidth,
  gridItemHeight,
  offset,
  lastRowOffset,
  rows,
  participantCount,
  viewportHeight,
  lastRowWidth,
  documentHeight
) {
  let left, top;
  if (lastRowWidth === undefined) {
    lastRowWidth = 0;
  }
  if (rows - 1 === i) {
    if (isMobileOrTab()) {
      if (participantCount === 5) {
        left = lastRowOffset + j * lastRowWidth + (j + 1) * 12;
      } else if (participantCount < 5) {
        left = lastRowOffset + j * lastRowWidth + j * 12;
      } else {
        left = offset + j * gridItemWidth + (j + 1) * 12;
      }
    } else {
      left = lastRowOffset + j * lastRowWidth + j * 12;
    }
  } else {
    if (isMobileOrTab()) {
      left =
        participantCount <= 4
          ? lastRowOffset + j * lastRowWidth + j * 12
          : offset + j * gridItemWidth + (j + 1) * 12;
    } else {
      left = offset + j * gridItemWidth + j * 12;
    }
  }
  top = i * gridItemHeight + i * 12;
  if (!isMobileOrTab() && participantCount === 2) {
    return { left, top: (documentHeight - gridItemHeight) / 2 };
  }
  return { left, top };
}

export function getRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export function videoShadow(level) {
  const scale = 2;

  // Internal circle audio level.
  const int = {
    level: level > 0.15 ? 20 : 0,
    color: "rgba(255,255,255,0.4)",
  };

  // External circle audio level.
  const ext = {
    level: parseFloat((int.level * scale * level + int.level).toFixed(0)),
    color: "rgba(255,255,255,0.2)",
  };

  // Internal blur.
  int.blur = int.level ? 2 : 0;

  // External blur.
  ext.blur = ext.level ? 6 : 0;

  return [
    `0 0 ${int.blur}px ${int.level}px ${int.color}`,
    `0 0 ${ext.blur}px ${ext.level}px ${ext.color}`,
  ].join(", ");
}

export function getWhiteIframeUrl(conference) {
  return `https://whiteboard.sariska.io/boards/${
    conference.connection.name
  }?authorName=${conference.getLocalUser().name}`;
}

export function isFullscreen() {
  let isInFullScreen =
    (document.fullscreenElement && document.fullscreenElement !== null) ||
    (document.webkitFullscreenElement &&
      document.webkitFullscreenElement !== null) ||
    (document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
    (document.msFullscreenElement && document.msFullscreenElement !== null);
  return isInFullScreen;
}

export function requestFullscreen() {
  var docElm = document.documentElement;
  if (docElm.requestFullscreen) {
    docElm.requestFullscreen();
  } else if (docElm.mozRequestFullScreen) {
    docElm.mozRequestFullScreen();
  } else if (docElm.webkitRequestFullScreen) {
    docElm.webkitRequestFullScreen();
  } else if (docElm.msRequestFullscreen) {
    docElm.msRequestFullscreen();
  }
}

export function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}

export function getSharedDocumentIframeUrl(conference) {
  return `https://etherpad.sariska.io/p/${
    conference.connection.name
  }?userName=${
    conference.getLocalUser().name
  }&showChat=false&showControls=false&chatAndUsers=false`;
}

export function appendLinkTags(type, conference) {
  var preloadLink = document.createElement("link");
  preloadLink.href =
    type === "whiteboard"
      ? getWhiteIframeUrl(conference)
      : getSharedDocumentIframeUrl(conference);
  preloadLink.rel = "preload";
  preloadLink.as = "document";
  document.head.appendChild(preloadLink);
}

export function formatAMPM(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? "0" + minutes : minutes;
  var strTime = hours + ":" + minutes + " " + ampm;
  return strTime;
}

export function preloadIframes(conference) {
  appendLinkTags("whiteboard", conference);
  appendLinkTags("sharedDocument", conference);
}

export const trimSpace = (str) => {
  return str.replace(/\s/g, "");
};

export const detectUpperCaseChar = (char) => {
  return char === char.toUpperCase() && char !== char.toLowerCase();
};

export const linkify = (inputText) => {
  const options = { defaultProtocol: "https", target: "_blank" };
  return linkifyHtml(inputText, options);
};

export function encodeHTML(str) {
  return str.replace(/([\u00A0-\u9999<>&])(.|$)/g, function (full, char, next) {
    if (char !== "&" || next !== "#") {
      if (/[\u00A0-\u9999<>&]/.test(next))
        next = "&#" + next.charCodeAt(0) + ";";

      return "&#" + char.charCodeAt(0) + ";" + next;
    }

    return full;
  });
}

export function getPresignedUrl(params) {
  return new Promise((resolve, reject) => {
    const body = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("SARISKA_TOKEN")}`,
      },
      body: JSON.stringify({
        fileType: params.fileType,
        fileName: params.fileName,
      }),
    };

    fetch(GET_PRESIGNED_URL, body)
      .then((response) => {
        if (response.ok) {
          return response.json(); //then consume it again, the error happens
        }
      })
      .then(function (response) {
        resolve(response);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function compressFile(file, type) {
  return new Promise((resolve, reject) => {
    if (type === "attachment") {
      resolve(file);
    } else {
      new Compressor(file, {
        quality: 0.6,
        success(result) {
          resolve(result);
        },
        error(err) {
          reject(err.message);
        },
      });
    }
  });
}

export function getUniqueNumber() {
  return Math.floor(100000 + Math.random() * 900000);
}

export function formatBytes(bytes) {
  var marker = 1024; // Change to 1000 if required
  var decimal = 3; // Change as required
  var kiloBytes = marker; // One Kilobyte is 1024 bytes
  var megaBytes = marker * marker; // One MB is 1024 KB
  var gigaBytes = marker * marker * marker; // One GB is 1024 MB
  var teraBytes = marker * marker * marker * marker; // One TB is 1024 GB

  // return bytes if less than a KB
  if (bytes < kiloBytes) return bytes + " Bytes";
  // return KB if less than a MB
  else if (bytes < megaBytes)
    return (bytes / kiloBytes).toFixed(decimal) + " KB";
  // return MB if less than a GB
  else if (bytes < gigaBytes)
    return (bytes / megaBytes).toFixed(decimal) + " MB";
  // return GB if less than a TB
  else return (bytes / gigaBytes).toFixed(decimal) + " GB";
}

export const getParticipants = (conference) => {
  if (!conference) {
    return null;
  }
  const localUser = conference?.getLocalUser();
  return [
    ...conference.getParticipantsWithoutHidden(),
    { _identity: { user: localUser }, _id: localUser.id },
  ];
};

export const muteParticipant = async (conference, participantId, mediaType) => {
  if (!conference) {
    return;
  }
  await conference.muteParticipant(participantId, mediaType);
};

export const isParticipantTrackMuted = (
  localTracks,
  remoteTracks,
  id,
  conference,
  mediaType
) => {
  let track;
  if (conference.myUserId() === id) {
    track = localTracks;
  } else {
    track = remoteTracks[id];
  }
  if (track) {
    if (mediaType === "audio") {
      return track.find((track) => track.isAudioTrack())?.isMuted();
    } else {
      return track.find((track) => track.isVideoTrack())?.isMuted();
    }
  } else {
    return undefined;
  }
};

export const getModerator = (conference) => {
  if (!conference) {
    return null;
  }
  let moderator;
  let participants = getParticipants(conference);
  participants.forEach((participant) => {
    if (conference.myUserId() === participant?._id) {
      if (conference.isModerator()) {
        moderator = participant;
      }
    } else {
      if (participant?._role === "moderator") {
        moderator = participant;
      }
    }
  });
  return moderator;
};

export const isParticipantLocal = (conference, id) => {
  if (!conference && !id) {
    return;
  }
  return conference?.myUserId() === id;
};

const handleCollaborartion = () => {
  console.log("handleCollaborartion");
  let profile = store?.getState()?.profile;
  let media = store?.getState()?.media;

  // Detect the platform (optional, if needed for Windows-specific behavior)
  const isWindows = window.navigator.platform.includes("Win");
  console.log(`Running on Windows: ${isWindows}`);

  // Handle collaboration toggling
  if (media.collaboration) {
    window.storage.local.set(
      {
        currentSessionDetails: {
          key: "onCollaborationChanged",
          session_id: profile.meetingTitle,
          color: profile.color,
          id: profile.id,
          name: profile.name,
          collaboration: false,
        },
      },
      () => {
        store.dispatch(toggleCollaboration(false));
      }
    );
  } else {
    window.storage.local.set(
      {
        currentSessionDetails: {
          key: "onCollaborationChanged",
          session_id: profile.meetingTitle,
          color: profile.color,
          id: profile.id,
          name: profile.name,
          collaboration: true,
        },
      },
      () => {
        store.dispatch(toggleCollaboration(true));
      }
    );
  }
};

const actionHandlers = [
//   [
//     "play",
//     async () => {
//       console.log("plsay");
//       handleCollaborartion();
//     },
//   ],
//   [
//     "pause",
//     async () => {
//       console.log("pause");

//       handleCollaborartion();
//     },
//   ],
  [
    "togglemicrophone",
    async (e) => {
      if (
        store?.getState()?.localTrack &&
        store?.getState()?.localTrack[0]?.isMuted()
      ) {
        await store?.getState()?.localTrack[0]?.unmute();
        store.dispatch(localTrackMutedChanged());
      } else {
        await store?.getState()?.localTrack[0]?.mute();
        store.dispatch(localTrackMutedChanged());
      }
      navigator.mediaSession.setMicrophoneActive(
        !store?.getState()?.localTrack[0]?.isMuted()
      );
    },
  ],
  [
    "togglecamera",
    async (e) => {
      if (
        store?.getState()?.localTrack &&
        store?.getState()?.localTrack[1]?.isMuted()
      ) {
        await store?.getState()?.localTrack[1]?.unmute();
        store.dispatch(localTrackMutedChanged());
      } else {
        await store?.getState()?.localTrack[1]?.mute();
        store.dispatch(localTrackMutedChanged());
      }
      navigator.mediaSession.setCameraActive(
        !store?.getState()?.localTrack[1]?.isMuted()
      );
    },
  ],
//   [
//     "hangup",
//     (e) => {
//       window.close();
//       let profile = store.getState()?.profile;
//       window.storage.local.set(
//         {
//           currentSessionDetails: {
//             session_id: profile.meetingTitle,
//             color: profile.color,
//             name: profile.name,
//             id: profile.id,
//             collaboration: false,
//           },
//         },
//         () => {}
//       );
//     },
//   ],
];

// Function to handle adding the conference event listeners
function addConferenceListeners(conference) {
  const handleTrackAdded = (track) => {
    if (!isPipEnabled || track.isLocal()) {
      return;
    }
    if (track.getType() === "video") {
      // renderCanvas(track.getParticipantId(), "added", track.getType());
    }
  };

  const handleTrackMuteChanged = (track) => {
    if (!isPipEnabled) {
      return;
    }
    if (track.getType() === "video") {
      // renderCanvas();
    }
  };

  const handleTrackRemoved = (track) => {
    if (!isPipEnabled) {
      return;
    }
    // renderCanvas(track.getParticipantId(), "removed", track.getType());
  };

  // Remove existing listeners
  conference.removeListener(
    SariskaMediaTransport.events.conference.TRACK_ADDED,
    handleTrackAdded
  );
  conference.removeListener(
    SariskaMediaTransport.events.conference.TRACK_MUTE_CHANGED,
    handleTrackMuteChanged
  );
  conference.removeListener(
    SariskaMediaTransport.events.conference.TRACK_REMOVED,
    handleTrackRemoved
  );

  // Add new listeners
  conference.on(
    SariskaMediaTransport.events.conference.TRACK_ADDED,
    handleTrackAdded
  );
  conference.on(
    SariskaMediaTransport.events.conference.TRACK_MUTE_CHANGED,
    handleTrackMuteChanged
  );
  conference.on(
    SariskaMediaTransport.events.conference.TRACK_REMOVED,
    handleTrackRemoved
  );
}
let worker;
let isPipEnabled = false;

function startWorker() {
  worker = new Worker("worker.js", { name: "Video worker" });

  worker.onmessage = function (e) {
    worker.terminate();
    startWorker();
  };

  const fps = 25;
  // Create a new destination canvas
  const dst_cnv = document.createElement("canvas");
  dst_cnv.width = "640";
  dst_cnv.height = "480";

  function renderCanvas(participantId, keyName, kind) {
    for (const [action, handler] of actionHandlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (error) {}
    }

    navigator.mediaSession.setCameraActive(
      !store?.getState()?.localTrack[1]?.isMuted()
    );
    navigator.mediaSession.setMicrophoneActive(
      !store?.getState()?.localTrack[0]?.isMuted()
    );

    let user1 = false;
    let user2 = false;
    let key1 = Object.keys(store?.getState()?.remoteTrack)[0];

    let remoteParticipantName =
      store.getState()?.conference?.participants.get(`${key1}`)?._identity?.user?.name;
    let localParticipantName = store?.getState()?.profile?.name;

    let track1 = store?.getState()?.localTrack[1];
    let reader1;

    if (track1?.track?.readyState !== "live" || track1?.isMuted()) {
      user1 = true;
      reader1 = undefined;
    } else {
      user1 = true;
      track1 = store?.getState()?.localTrack[1]?.track;
      if (
        track1.readyState === "live" &&
        store?.getState()?.localTrack[1] &&
        !store?.getState()?.localTrack[1].isMuted()
      ) {
        let media_processor1 = new window.MediaStreamTrackProcessor(track1);
        reader1 = media_processor1.readable;
      }
    }

    let reader2;
    let key = Object.keys(store.getState().remoteTrack)[0];
    let track2 = store?.getState()?.remoteTrack[key];

    if (
      (track2 && track2[1] && track2[1]?.track?.readyState !== "live") ||
      (track2 && track2[1] && track2[1]?.isMuted())
    ) {
      user2 = true;
      reader2 = undefined;
    } else if (track2 && track2[1]) {
      user2 = true;
      let track1 = track2[1]?.track;
      if (track1.readyState === "live" && track2[1] && !track2[1]?.isMuted()) {
        let media_processor2 = new window.MediaStreamTrackProcessor(track1);
        reader2 = media_processor2.readable;
      }
    }

    if (
      keyName === "removed" &&
      store?.getState()?.localTrack[1] &&
      participantId === store?.getState()?.localTrack[1].getParticipantId()
    ) {
      user1 = false;
    }

    if (
      keyName === "removed" &&
      track2 &&
      track2[1] &&
      participantId === track2[1].getParticipantId()
    ) {
      user2 = false;
    }

    if (
      keyName === "added" &&
      kind === "video" &&
      store?.getState()?.localTrack[1] &&
      participantId === store?.getState()?.localTrack[1].getParticipantId()
    ) {
      user1 = true;
      track1 = store?.getState()?.localTrack[1]?.track;
      if (
        track1.readyState === "live" &&
        store?.getState()?.localTrack[1] &&
        !store?.getState()?.localTrack[1].isMuted()
      ) {
        let media_processor1 = new window.MediaStreamTrackProcessor(track1);
        reader1 = media_processor1.readable;
      }
    }

    if (
      keyName === "added" &&
      kind === "video" &&
      track2 &&
      track2[1] &&
      !track2[1].isMuted()
    ) {
      user2 = true;
      let track = track2[1]?.track;
      if (track.readyState === "live" && track2[1] && !track2[1].isMuted()) {
        let media_processor2 = new window.MediaStreamTrackProcessor(track1);
        reader2 = media_processor2.readable;
      }
    }

    if (track2 && track2[1] && track2[1].isMuted()) {
      user2 = true;
    }

    worker.terminate();
    worker = new Worker("worker.js", { name: "Video worker" });
    const dst_cnv = document.createElement("canvas");
    dst_cnv.width = "360";
    dst_cnv.height = "360";

    if (user1 && user2) {
      dst_cnv.height = "360";
    } else if (user1) {
      dst_cnv.height = "180";
    } else if (user2) {
      dst_cnv.height = "180";
    }

    video.srcObject = dst_cnv.captureStream();
    let offscreen = dst_cnv.transferControlToOffscreen();

    worker.postMessage(
      {
        canvas: offscreen,
      },
      [offscreen]
    );

    let ownershipArray = [];

    if (reader1) {
      ownershipArray.push(reader1);
    }

    if (reader2) {
      ownershipArray.push(reader2);
    }

    worker.postMessage(
      {
        user1: user1
          ? {
              name: localParticipantName,
              color: store?.getState().profile?.color,
            }
          : undefined,
        user2: user2
          ? {
              name: remoteParticipantName,
              color:
                store.getState()?.conference?.participants[
                  Object.keys(store.getState().remoteTrack)[0]
                ]?._identity?.user?.avatar,
            }
          : undefined,
        frame_source1: user1 ? reader1 : undefined,
        frame_source2: user2 ? reader2 : undefined,
        fps: fps,
      },
      ownershipArray
    );
  }

  store
    .getState()
    ?.conference?.addEventListener(
      SariskaMediaTransport.events.conference.TRACK_ADDED,
      (track) => {
        if (!isPipEnabled || track.isLocal()) {
          return;
        }
        if (track.getType() === "video") {
          renderCanvas(track.getParticipantId(), "added", track.getType());
        }
      }
    );

  store
    .getState()
    ?.conference?.addEventListener(
      SariskaMediaTransport.events.conference.TRACK_MUTE_CHANGED,
      (track) => {
        if (!isPipEnabled) {
          return;
        }
        if (track.getType() === "video") {
          renderCanvas();
        }
      }
    );

  store
    .getState()
    ?.conference?.addEventListener(
      SariskaMediaTransport.events.conference.TRACK_REMOVED,
      (track) => {
        if (!isPipEnabled) {
          return;
        }
        renderCanvas(track.getParticipantId(), "removed", track.getType());
      }
    );

  let video = document.createElement("video");
  video.srcObject = dst_cnv.captureStream();

  video.addEventListener("enterpictureinpicture", (event) => {
    isPipEnabled = true;
    store.dispatch(togglePip(true));
  });

  video.addEventListener("loadedmetadata", async (event) => {
    await video.play();
    video.requestPictureInPicture();
  });

  video.addEventListener(
    "leavepictureinpicture",
    async () => {
      try {
        isPipEnabled = false;
        store.dispatch(togglePip(false));
      } catch (e) {}
    },
    false
  );

  renderCanvas();
}

export const startPipMode = async () => {
  startWorker();
};

export const exitPipMode = async () => {};
