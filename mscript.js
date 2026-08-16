const jsmediatags = window.jsmediatags;
const averagecolor = new FastAverageColor();

const background = document.getElementById("bg-image");
const videoBackground = document.getElementById("bg-video");

const playlistDiv = document.getElementById("playlist");

const fileInput = document.getElementById("file-selector");

const songSelector = document.getElementById("song-selection");

const playerDiv = document.getElementById("player");
const favicon = document.getElementById("favicon");

const audio = document.getElementById("audio");
const name = document.getElementById("name");
const cover = document.getElementById("cover");

const controls = document.getElementById("audio-controls");
const previousButton = document.getElementById("prev");
const playButton = document.getElementById("play-pause");
const skipButton = document.getElementById("skip");
const loopButton = document.getElementById("loop");
const shuffleButton = document.getElementById("shuffle");
const volume = document.getElementById("volume").querySelector("input");

const settingsDiv = document.getElementById("settings");
const playbackSlider = document.getElementById("playback-speed");
const wetSlider = document.getElementById("wet-gain");
const drySlider = document.getElementById("dry-gain");
const lowSlider = document.getElementById("low-gain");
const midSlider = document.getElementById("mid-gain");
const highSlider = document.getElementById("high-gain");

const pb = document.getElementById("progress-bar");
const pbf = document.getElementById("pb-fill");
const pbt = document.getElementById("pb-text");

let playing = false;
let singleLoop = false;
let playlistLoop = false;
let shuffle = false;
let playbackRate = 1;

let playlist = [];
let played = [];
let current = 0;
let currentSong = "";

let images = {};

let mouseX;
let mouseY;

let settings = {
  volume: 1,
  eqLowGain: 0,
  eqMidGain: 0,
  eqHighGain: 0,
  reverb: 0,
  dry: 0,
  playbackRate: 1,
  shuffle: false,
  singleLoop: false,
  playlistLoop: false
};

//initialization

window.addEventListener('resize', () => {
  playerDiv.style.left = `${window.innerWidth * 0.33}px`;
});

playerDiv.style.left = `${window.innerWidth * 0.33}px`;
playerDiv.style.bottom = "0px";

if (window.KNMPDB) {
  KNMPDB.open()
    .then(() => KNMPDB.getAllSongs())
    .then((records) => {
      playlist = records || [];
      
      if (playlist.length > 0) {
        current = 0;
        changeAudio(playlist[current]);
      }
      updatePlaylist();
    })
    .catch((err) => alert('IndexedDB init error: ' + err));
} else {
  alert('KNMPDB not found — persistence disabled');
}

if (window.localStorage) {
  let savedSettings = localStorage.getItem('settings');
  if (savedSettings) {
    savedSettings = JSON.parse(savedSettings);
    
    for (const key in savedSettings) {
      if (settings.hasOwnProperty(key)) {
        settings[key] = savedSettings[key];
      }
    }

    shuffle = settings.shuffle;
    singleLoop = settings.singleLoop;
    playlistLoop = settings.playlistLoop;

    volume.value = settings.volume;
    audio.volume = settings.volume;

    playbackRate = settings.playbackRate || 1;

    if (shuffle) {
      shuffleButton.src = "assets/shuffle.svg";
    } else {
      shuffleButton.src = "assets/shuffle0.svg";
    }
    
    if (playlistLoop) {
      loopButton.src = "assets/loop.svg";
    } else if (singleLoop) {
      loopButton.src = "assets/loop1.svg";
    } else {
      loopButton.src = "assets/loop0.svg";
    }

    playbackSlider.value = settings.playbackRate || 1;
    wetSlider.value = settings.reverb || 0;
    drySlider.value = settings.dry || 0;
    lowSlider.value = settings.eqLowGain || 0;
    midSlider.value = settings.eqMidGain || 0;
    highSlider.value = settings.eqHighGain || 0;
  }
} else {
  alert('localStorage not found — settings persistence disabled');
}

//functions

function changeAudio(entry) {
  let file = entry;
  let title = '';
  if (entry && typeof entry === 'object' && entry.file) {
    file = entry.file;
    title = entry.name || '';
  } else if (entry && entry.name) {
    title = entry.name;
  }
  if (file && file.name) {
    title = title || file.name;
  }

  currentSong = title;

  audio.src = URL.createObjectURL(file);
  name.textContent = title.slice(0, -4);

  getCoverImage(file);
  let dataUrl = images[file.name] || "assets/default.png";

  if (playlist[current].file.type && playlist[current].file.type.startsWith("video")) {
    videoBackground.src = URL.createObjectURL(playlist[current].file);
    videoBackground.style.display = "block";
    background.style.display = "none";
  } else {
    videoBackground.style.display = "none";
    background.style.display = "block";
  }

  cover.src = dataUrl;
  favicon.href = dataUrl;
  background.src = dataUrl == "assets/default.png" ? '' : dataUrl;

  playlistDiv.style.backgroundImage = "linear-gradient(to right, rgba(0, 74, 155, 1), rgba(0, 155, 155, .5))";

  background.onload = function() {
    averagecolor.getColorAsync(background)
      .then(color => {
        let brightness = 0.8;
        color.rgba[0] *= brightness;
        color.rgba[1] *= brightness;
        color.rgba[2] *= brightness;
        playlistDiv.style.backgroundImage = `linear-gradient(to right, ${"rgba(" + color.rgba.join(",") + ")"}, rgba(1, 2, 2, .5))`;
      })
      .catch(e => console.error(e));
  };
  
  play();

  updatePlaylist();
}

function getID(name) {
  for (let i = 0; i < playlist.length; i++) {
    let entry = playlist[i];
    const file = entry && entry.file ? entry.file : entry;

    const displayName = (entry && entry.name) ? entry.name : (file && file.name ? file.name : '');
    if (displayName == name) {
      return i;
    }
  }
}

function getCoverImage(entry) {
  if (images[entry.name]) {
    return;
  }
    
  jsmediatags.read(entry, {
    onSuccess: async function(tag) {
      const tags = tag.tags;
      const image = tags.picture;
      
      if (image) {
        let base64 = "";

        for (let i = 0; i < image.data.length; i++) {
            base64 += String.fromCharCode(image.data[i]);
        }

        const dataUrl = `data:${image.format};base64,${window.btoa(base64)}`;

        images[entry.name] = dataUrl;
      } else if (entry.type && entry.type.startsWith("video")) {
        images[entry.name] = await generateVideoThumbnail(entry).catch((e) => { 
          console.error('thumbnail error', e); 
          return "assets/default.png"; 
        });
      } else {
        images[entry.name] = "assets/default.png";
      }
    },
    onError: async function(error) {
      console.error('jsmediatags error', error);
      if (entry.type && entry.type.startsWith("video")) {
        images[entry.name] = await generateVideoThumbnail(entry).catch((e) => { 
          console.error('thumbnail error', e); 
          return "assets/default.png"; 
        });
      } else {
        images[entry.name] = "assets/default.png";
      }
    }
  });
}


function generateVideoThumbnail(videoFile, seekTime = 1) {
  return new Promise((resolve, reject) => {
    const videoUrl = URL.createObjectURL(videoFile);
    
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    
    video.muted = true;
    video.playsInline = true;
    video.src = videoUrl;

    video.addEventListener("loadedmetadata", () => {
      if (seekTime > video.duration) {
        video.currentTime = video.duration / 2;
      } else {
        video.currentTime = seekTime;
      }
    });

    video.addEventListener("seeked", () => {
      try {
        const ctx = canvas.getContext("2d");
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
          
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.85);
        
        URL.revokeObjectURL(videoUrl);
        video.src = "";
        video.load();
        
        resolve(thumbnailUrl);
      } catch (error) {
        reject(error);
      }
    });

    video.addEventListener("error", (err) => {
      URL.revokeObjectURL(videoUrl);
      reject("Error loading video file: " + err.message);
    });
  });
}

function refreshDB() {
  KNMPDB.clearAll().then(() => {
    const promises = [];
    for (const entry of playlist) {
      if (entry && entry.file) {
        promises.push(KNMPDB.addSong(entry.file).catch((e) => { console.error('save error', e); return null; }));
      }
    }
    return Promise.all(promises);
  }).then((results) => {
    let newPlaylist = [];
    for (const r of results) {
      if (r) newPlaylist.push(r);
    }
    playlist = newPlaylist;
    updatePlaylist();
  }).catch((err) => console.error('refresh error', err));
}

function configureElement(element, entry, index) {
  const file = entry && entry.file ? entry.file : entry;
  let imageElem = document.createElement('img');
  imageElem.classList.add('songImage');

  getCoverImage(file);
  let dataUrl = images[file.name] || "assets/default.png";
  imageElem.src = dataUrl;

  element.appendChild(imageElem);

  let songNameElement = document.createElement('h3');
  songNameElement.classList.add('songName');
  const displayName = (entry && entry.name) ? entry.name : (file && file.name ? file.name : '');
  songNameElement.textContent = displayName.slice(0, -4);

  element.appendChild(songNameElement);

  let songOptions = document.createElement('div');
  songOptions.classList.add('songOptions');
  element.appendChild(songOptions);

  if (index > 0) {
    let moveUp = document.createElement('img');
    moveUp.src = 'assets/up.svg';
    songOptions.appendChild(moveUp);

    moveUp.onclick = function(e) {
      e.stopPropagation();
      if (index > 0) {
        [playlist[index - 1], playlist[index]] = [playlist[index], playlist[index - 1]];
        updatePlaylist();
        refreshDB();
      }
    };
  }

  if (index < playlist.length - 1) {
    let moveDown = document.createElement('img');
    moveDown.src = 'assets/down.svg';
    songOptions.appendChild(moveDown);

    moveDown.onclick = function(e) {
      e.stopPropagation();
      if (index < playlist.length - 1) {
        [playlist[index + 1], playlist[index]] = [playlist[index], playlist[index + 1]];
        updatePlaylist();
        refreshDB();
      }
    };
  }

  let removeSong = document.createElement('img');
  removeSong.src = 'assets/remove.svg';
  songOptions.appendChild(removeSong);

  removeSong.onclick = function() {
    const rec = playlist[index];
    if (rec && rec.id) {
      KNMPDB.deleteSong(rec.id).then(() => {
        playlist.splice(index, 1);
        if (index === current) {
          current = current - 1 < 0 ? 0 : current - 1;
          if (playlist.length) {
            changeAudio(playlist[current])
          } else {
            audio.src = '';
            name.textContent = '';
            cover.src = 'assets/default.png';
            favicon.href = 'assets/favicon.png';
            background.src = '';
            videoBackground.src = '';
            playlistDiv.style.backgroundImage = "linear-gradient(to right, rgba(0, 74, 155, 1), rgba(0, 155, 155, .5))";
          }
        }
        updatePlaylist();
      }).catch((err) => console.error('delete error', err));
    } else {
      playlist.splice(index, 1);
      updatePlaylist();
    }
  };

  let enter = false;

  removeSong.onmouseenter = function(e) {
    enter = true;
  };

  removeSong.onmouseleave = function(e) {
    enter = false;
  };

  if (index != current) {
    element.onclick = function() {
      if (!enter) {
        current = index;
        changeAudio(playlist[current]);
      }
    };
  }
}

function updatePlaylist() {
  current = getID(currentSong) || 0;
  songSelector.innerHTML = '';

  for (let i = 0; i < playlist.length; i++) {
    let songElement = document.createElement('div');
    songElement.classList.add('song');

    configureElement(songElement, playlist[i], i);

    if (i === current) {
      songElement.classList.add('selectedSong');
    }

    songSelector.appendChild(songElement);
  }
}

function play() { 
  audio.play();
  audio.playbackRate = playbackRate;
  if (playlist[current].file.type && playlist[current].file.type.startsWith("video")) {
    videoBackground.play();
    videoBackground.playbackRate = playbackRate;
    videoBackground.currentTime = audio.currentTime;
  }

  getCoverImage(playlist[current].file);
  let dataUrl = images[currentSong] || "assets/favicon.png";
  favicon.href = dataUrl;
}

function pause() {
  audio.pause();
  if (playlist[current].file.type && playlist[current].file.type.startsWith("video")) {
    videoBackground.pause();
  }

  favicon.href = "assets/favicon.png";
}

function convertToTime(seconds) {
  return `${Math.floor(seconds/60)}:${((seconds % 60) < 10) ? 0 : ""}${seconds % 60}`;
}

//audio event listeners

audio.addEventListener('play', () => {
  playing = true;
  playButton.src = 'assets/pause.svg';

  const title = playlist[current] && (playlist[current].name || (playlist[current].file && playlist[current].file.name)) ? (playlist[current].name || playlist[current].file.name) : 'music player by Kyle Nham';
  document.title = title.slice(0, -4);
  ctx.resume();
});

audio.addEventListener('pause', () => {
  playing = false;
  playButton.src = 'assets/play.svg';

  document.title = 'music player by Kyle Nham';
});

audio.addEventListener('ended', () => {
  playing = false;
  playButton.src = 'assets/play.svg';

  if (playlist[current].file.type && playlist[current].file.type.startsWith("video")) {
    videoBackground.pause();
  }

  document.title = "music player by Kyle Nham";

  if (shuffle) {
    if (playlistLoop) {
      played = [];
    }
    
    played.push(current);
    if (played.length >= playlist.length) {
      played = [];
    }

    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } while (played.includes(nextIndex));

    current = nextIndex;
    changeAudio(playlist[current]);
  }

  if (!singleLoop) {
    current += 1;
    if (current > playlist.length - 1) {
      if (playlistLoop) {
        current = 0;
        changeAudio(playlist[current]);
      }
    } else {
      changeAudio(playlist[current]);
    }
  }
});

audio.addEventListener("timeupdate", () => {
  pbf.style.width = `${(audio.currentTime/audio.duration) * 100}%`;
  pbt.textContent = `${convertToTime(Math.round(audio.currentTime))} / ${convertToTime(Math.round(audio.duration))}`;
});

//inputs

fileInput.addEventListener('change', (event) => {
  const fileList = event.target.files;
  if (fileList.length > 0) {
    let empty = false;
    if (playlist.length <= 0) {
      empty = true;
    }

    const allowed = ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/webm', 'audio/mp4', 'video/mp4', 'video/webm'];

    const promises = [];
    for (const file of fileList) {
      if (allowed.includes(file.type) && !playlist.some(entry => entry.name === file.name)) {
        promises.push(KNMPDB.addSong(file).catch((e) => { console.error('save error', e); return null; }));
      }
    }

    Promise.all(promises).then((results) => {
      for (const r of results) {
        if (r) playlist.push(r);
      }

      if (empty && playlist.length > 0) {
        current = 0;
        changeAudio(playlist[current]);
      } else {
        updatePlaylist();
      }
    });
  }
});

playButton.onclick = function() {
  if (!playing) {
    play();
  } else {
    pause();
  }
}

skipButton.onclick = function() {
  current += 1;
  if (current > playlist.length - 1) {
    current = playlist.length - 1;
  }

  changeAudio(playlist[current]);
}

previousButton.onclick = function() {
  current -= 1;
  if (current < 0) {
    current = 0;
  }

  changeAudio(playlist[current]);
}

loopButton.onclick = function() {
  if (playlistLoop) {
    singleLoop = true;
    playlistLoop = false;
  } else if (singleLoop) {
    singleLoop = false;
    playlistLoop = false;
  } else {
    singleLoop = false;
    playlistLoop = true;
  }

  if (playlistLoop) {
    loopButton.src = "assets/loop.svg";
  } else if (singleLoop) {
    loopButton.src = "assets/loop1.svg";
  } else {
    loopButton.src = "assets/loop0.svg";
  }

  audio.loop = singleLoop;
  settings.singleLoop = singleLoop;
  settings.playlistLoop = playlistLoop;
  localStorage.setItem('settings', JSON.stringify(settings));
}

shuffleButton.onclick = function() {
  shuffle = !shuffle;
  if (shuffle) {
    shuffleButton.src = "assets/shuffle.svg";
    played = [];
  } else {
    shuffleButton.src = "assets/shuffle0.svg";
  }

  settings.shuffle = shuffle;
    localStorage.setItem('settings', JSON.stringify(settings));
}

document.addEventListener("mousemove", (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
});

let timings = false;

pb.onmousedown = function() {
  timings = true;
}

window.onmouseup = function() {
  timings = false;
}

pb.onmousemove = function() {
  if (timings) {
    let percentage = mouseX / window.innerWidth;
    audio.currentTime = percentage * audio.duration;
    if (playlist[current].file.type && playlist[current].file.type.startsWith("video")) {
      videoBackground.currentTime = percentage * videoBackground.duration;
    }
  }
}

pb.onclick = function() {
  let percentage = mouseX / window.innerWidth;
  audio.currentTime = percentage * audio.duration;
  if (playlist[current].file.type && playlist[current].file.type.startsWith("video")) {
    videoBackground.currentTime = percentage * videoBackground.duration;
  }
}

document.addEventListener("keydown", (key) => {
  if (key.code=="Space") {
    if (!playing) {
      play();
    } else {
      pause();
    }
  }

  if (key.code=="ArrowUp") {
    current -= 1;
    if (current < 0) {
      current = playlist.length - 1;
    }
    changeAudio(playlist[current]);
  }

  if (key.code=="ArrowDown") {
    current += 1;
    if  (current > playlist.length - 1) {
      current = 0;
    }
    changeAudio(playlist[current]);
  }

  if (key.code=="ArrowLeft") {
    audio.currentTime -= 5;
    videoBackground.currentTime = audio.currentTime;
  }

  if (key.code=="ArrowRight") {
    audio.currentTime += 5;
    videoBackground.currentTime = audio.currentTime;
  }

  if (key.code=="KeyM") {
    audio.volume = audio.volume > 0 ? 0 : 1;
    volume.value = audio.volume;
    settings.volume = audio.volume;
    localStorage.setItem('settings', JSON.stringify(settings));
  }

  if (key.code=="KeyL") {
    if (playlistLoop) {
      singleLoop = true;
      playlistLoop = false;
    } else if (singleLoop) {
      singleLoop = false;
      playlistLoop = false;
    } else {
      singleLoop = false;
      playlistLoop = true;
    }

    if (playlistLoop) {
      loopButton.src = "assets/loop.svg";
    } else if (singleLoop) {
      loopButton.src = "assets/loop1.svg";
    } else {
      loopButton.src = "assets/loop0.svg";
    }

    audio.loop = singleLoop;

    settings.singleLoop = singleLoop;
    settings.playlistLoop = playlistLoop;
    localStorage.setItem('settings', JSON.stringify(settings));
  }

  if (key.code.startsWith("Digit")) {
    audio.currentTime = audio.duration * (parseInt(key.code.slice(-1)) / 10);
  }

  if (key.code=="KeyE") {
    confirm("Do you want to erase your data? This will delete all songs from the playlist and clear the database.") && KNMPDB.clearAll().then(() => {
      localStorage.removeItem('settings');
      alert("Data erased. The page will now reload.");
      window.location.reload();
    }).catch((err) => console.error('clear error', err));
  }

  if (key.code=="KeyS") {
    shuffle = !shuffle;
    if (shuffle) {
      shuffleButton.src = "assets/shuffle.svg";
      played = [];
    } else {
      shuffleButton.src = "assets/shuffle0.svg";
    }

    settings.shuffle = shuffle;
    localStorage.setItem('settings', JSON.stringify(settings));
  }
});

volume.addEventListener("input", () => {
  audio.volume = volume.value;
  settings.volume = audio.volume;
  localStorage.setItem('settings', JSON.stringify(settings));
});

//post processing

const visualizer = document.getElementById("visualizer");

const ctx = new AudioContext();
const analyser = ctx.createAnalyser();
analyser.fftSize = 2048;
analyser.maxDecibels = -25;
analyser.minDecibels = -150;

const lowFilter = ctx.createBiquadFilter();
lowFilter.type = "lowshelf";
lowFilter.frequency.value = 500;
lowFilter.gain.value = settings.eqLowGain;

const midFilter = ctx.createBiquadFilter();
midFilter.type = "peaking";
midFilter.frequency.value = 1500;
midFilter.Q.value = 1;
midFilter.gain.value = settings.eqMidGain;

const highFilter = ctx.createBiquadFilter();
highFilter.type = "highshelf";
highFilter.frequency.value = 3000;
highFilter.gain.value = settings.eqHighGain;
highFilter.numberOfOutputs = 2;

const convolver = ctx.createConvolver();
async function initReverb() {
  convolver.buffer = await window.generateReverb({decayTime: 2.5, sampleRate: ctx.sampleRate});
}
initReverb();

const wetNode = ctx.createGain();
wetNode.gain.value = settings.reverb;

const dryNode = ctx.createGain();
dryNode.gain.value = settings.dry;

const source = ctx.createMediaElementSource(audio);
source.connect(lowFilter)
lowFilter.connect(midFilter);
midFilter.connect(highFilter);
highFilter.connect(dryNode);
dryNode.connect(analyser);

highFilter.connect(convolver);
convolver.connect(wetNode);
wetNode.connect(analyser);
analyser.connect(ctx.destination);

function renderFrame(count, margin = 1) {
  requestAnimationFrame(() => renderFrame(count, margin));
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);

  visualizer.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const bar = document.createElement('div');
    bar.classList.add('bar');
    bar.style.marginTop = `${margin}px`;
    bar.style.width = `${(dataArray[i] / 255) ** 10 * 20 + 0.1}%`;
    bar.style.height = `${(1/count - margin/visualizer.clientHeight)*100}%`;
    visualizer.appendChild(bar);
  }
}

renderFrame(128, 2);

let int = setInterval(function() {
  if (playlist.length > 0) {
    changeAudio(playlist[current]);
  }
  clearInterval(int);
}, 300);

playbackSlider.addEventListener("input", () => {
  playbackRate = playbackSlider.value;
  audio.playbackRate = playbackRate;
  if (playlist[current].file.type && playlist[current].file.type.startsWith("video")) {
    videoBackground.playbackRate = playbackRate;
  }
  settings.playbackRate = playbackRate;
  localStorage.setItem('settings', JSON.stringify(settings));
});

wetSlider.addEventListener("input", () => {
  wetNode.gain.value = wetSlider.value;
  settings.reverb = wetSlider.value;
  localStorage.setItem('settings', JSON.stringify(settings));
});

drySlider.addEventListener("input", () => {
  dryNode.gain.value = drySlider.value;
  settings.dry = drySlider.value;
  localStorage.setItem('settings', JSON.stringify(settings));
});

lowSlider.addEventListener("input", () => {
  lowFilter.gain.value = lowSlider.value;
  settings.eqLowGain = lowSlider.value;
  localStorage.setItem('settings', JSON.stringify(settings));
});

midSlider.addEventListener("input", () => {
  midFilter.gain.value = midSlider.value;
  settings.eqMidGain = midSlider.value;
  localStorage.setItem('settings', JSON.stringify(settings));
});

highSlider.addEventListener("input", () => {
  highFilter.gain.value = highSlider.value;
  settings.eqHighGain = highSlider.value;
  localStorage.setItem('settings', JSON.stringify(settings));
});

//TODO: this
window.onfocus = function(event) {
  if (playlist[current] && playlist[current].file.type && playlist[current].file.type.startsWith("video")) {
    videoBackground.currentTime = audio.currentTime;
  }
}