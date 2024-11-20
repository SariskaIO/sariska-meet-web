
let canvas;
let context;
let codec_string = "avc1.42001E";
let underflow1 = true;
let underflow2 = true;
let ready_frames1 = [];
let ready_frames2 = [];
let timeout;
let shouldCancel = false;

function renderMultipleTracks(canvas, reader1, reader2, user1, user2) {
  readChunk();
  function readChunk() {
      let promises  = [];
      if (user1) {
        promises.push( reader1 ? reader1.read() : new Promise((resolve, reject) =>{ reject(1)}));
      }

      if (user2) { 
        promises.push( reader2 ? reader2.read() : new Promise((resolve, reject) =>{ reject(1)}));
      }

      Promise.allSettled(promises).then((values) => {
        const ctx = canvas.getContext("2d", { alpha: true });
        render(ctx, values[0]?.value?.value, values[1]?.value?.value, values.length, user1, user2);
        if (!values[0]?.value?.value && !values[1]?.value?.value) {
          timeout = setTimeout( ()=>readChunk() ,16);
        } else {
          clearTimeout(timeout);
          readChunk();
        }
      }).then(function(arrayOfValuesOrErrors) {
        // handling of my array containing values and/or errors. 
      })
      .catch(function(err) {
        console.log("errnjjjjjjjjjjjjj", err.message); // some coding error in handling happened
        readChunk();
      });
  }
}

self.onmessage = async function(event) {
  if (event.data.canvas) {
    canvas = event.data.canvas;
  }  else {
    let user1 = event.data.user1;
    let user2 = event.data.user2;
    let reader1  =  event.data.frame_source1 ? event.data.frame_source1.getReader() : undefined;
    let reader2 = event.data.frame_source2 ? event.data.frame_source2.getReader(): undefined;
    renderMultipleTracks(canvas, reader1, reader2, user1, user2);  
  }
}


function render(context, frame1, frame2, participantCount, user1, user2) {  
  if (participantCount === 2) {
    context.canvas.width  = 360;
    context.canvas.height = 480;  
    
    if (frame1 && frame2) {
        context.clearRect(0, 0, 360, 480);
        context.scale(-1, 1);
        if (frame1) {
          underflow1 = false;  
          context.drawImage( frame1, 0, 0, frame1.codedWidth, frame1.codedHeight, -360, 0, 360, 240);
          frame1.close();   
        }

        if (frame2) {
          underflow2 = false;  
          context.drawImage( frame2, 0, 0, frame2.codedWidth, frame2.codedHeight, -360, 240, 360, 240);
          frame2.close();    
        }       
    } else if (frame1 && !frame2) { 
      if (frame1) {
        context.scale(-1, 1);
        underflow1 = false;  
        context.drawImage( frame1, 0, 0, frame1.codedWidth, frame1.codedHeight, -360, 0, 360, 240);
        frame1.close();   
      }

      context.save();
      drawNameWithMuteState(user2.name, user2.color, context, 180, 330, true);
    } else if (!frame1 && frame2) {    
      context.save();
      drawNameWithMuteState(user1.name, user1.color, context, 180,  90);
      if (frame2) {
        underflow2 = false;  
        context.scale(-1, 1);
        context.drawImage( frame2, 0, 0, frame2.codedWidth, frame2.codedHeight, -360, 240, 360, 240);
        frame2.close();    
      }   
    } else {
      context.save();
      drawNameWithMuteState(user1.name, user1.color, context, 180,  90);
      drawNameWithMuteState(user2.name, user2.color, context, 180, 270);
    }
  } else if (participantCount === 1)  {
    context.canvas.width  = 360;
    context.canvas.height = 240;
    if (frame1) {
        underflow1 = false;  
        context.scale(-1, 1);
        context.drawImage( frame1, 0, 0, frame1.codedWidth, frame1.codedHeight, -360, 0, 360, 240);
        frame1.close();   
    } else {
      context.save();
      drawNameWithMuteState(user1.name, user1.color, context, 180, 90);
    }
  }
}

async function drawNameWithMuteState(name, color, context, centerX, centerY, isPostDraw) { 
  context.scale(-1, 1);  
  let newCenterX = isPostDraw ?  centerX : centerX - 360;
  var radius = 30;
  context.fillStyle = color;
  context.arc(newCenterX , centerY , radius, 0, 2 * Math.PI, false);
  context.fill();
  if(!isPostDraw){
    // Move to the text position and apply a local transformation
    context.translate(newCenterX, centerY); // Move the origin to the text position
    context.scale(-1, 1);    // Flip horizontally
    context.translate(-newCenterX , -centerY); // Restore the origin back
  }

  context.beginPath();
  context.font = "20px Noto Sans Korean";
  context.fillStyle = "white";
  context.textAlign = "center";
  context.fillText(name && name[0]?.toUpperCase(), newCenterX, centerY + 7.5 );

  context.beginPath();
  context.letterSpacing = "2px";
  context.font = "20px Noto Sans Korean";
 // context.fillStyle = "white";
  context.textAlign = "center";
  const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, '#718EFF');
  gradient.addColorStop(1, "#7D73FF");
  context.fillStyle = gradient;
  context.fillText(name, newCenterX, centerY + 70 );
  context.direction = 'rtl'
  context.restore();
}