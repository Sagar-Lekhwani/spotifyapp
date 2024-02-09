    var open =true;
    var playbtn = document.querySelector('#audio #play');
    var Audio = document.querySelector('#audio audio');
    let trackPlaying = false ;
    var Time = document.querySelector('#audio #a2 #time');
    var FullTime = document.querySelector('#audio #a2 #fulltime');
    var slider = document.querySelector('#audio #a2 #slider');
    var volslider = document.querySelector('#bottom #elements #rangeslider #slider');
    var volicon = document.querySelector('#bottom #elements #volumeIcon');
    var progress = document.querySelector('#audio #a2 .progress');
    var volprogress = document.querySelector('#bottom #elements #rangeslider .progress');
    var Thumb = document.querySelector('#audio #a2 #rangeslider .thumb');
    var songimage = document.querySelector('#bottom #filename #playImage');
    var songname = document.querySelector('#bottom #filename #songName');
    var songartist = document.querySelector('#bottom #filename #songArtist');



    document.querySelector('.r1 #i').addEventListener('click', () => {
      if(open) {
        document.querySelector('.r1 #input').style.width = '75%';
        document.querySelector('.r1 #i').style.borderRadius = '0';
        document.querySelector('.r1 #i').style.padding = '4px';
        open = false ;
      }
      else{
        document.querySelector('.r1 #input').style.width = '0';
        document.querySelector('.r1 #i').style.borderRadius = '50%';
        document.querySelector('.r1 #i').style.padding = '10px'; 
        open = true 
      }
    })

    function endswith(str, substr) {
  
      return str.slice(-substr.length)
    }

    function songPlay (filename,index,poster,songName,songArtist,playlistname) {
      var songtoplay = `${playlistname}${index}`
      var songplaying = Audio.getAttribute('id').slice(4)
      if(songtoplay != songplaying)
      {
      var nt = parseInt(index) + 1
      var pt = parseInt(index) - 1
      Audio.setAttribute('src' , `/stream/${filename}`)
      Audio.setAttribute('id' , `play${songtoplay}`)
      if(endswith(poster , 'poster') === 'poster') songimage.setAttribute('src' , `/poster/${poster}`)
      else songimage.setAttribute('src' , `../images/${poster}`)
      songname.textContent = songName
      songartist.textContent = songArtist
      Audio.play();
      playbtn.classList.remove('fa-play')
      playbtn.classList.add('fa-pause')
      trackPlaying = true;
      document.querySelector('#audio #forwards').setAttribute('data-song', `${playlistname}${nt}`);
      document.querySelector('#audio #previous').setAttribute('data-song', `${playlistname}${pt}`);
      document.querySelector(`#${songtoplay}`).classList.replace('fa-play' , 'fa-pause')
      document.querySelector(`#${songplaying}`).classList.replace('fa-pause' , 'fa-play')
      console.log(Audio.getAttribute('id'))
      }
      else {
        if(!trackPlaying)
        {
          Audio.play(); 
          playbtn.classList.remove('fa-play')
          playbtn.classList.add('fa-pause')
          trackPlaying = true;
          document.querySelector(`#${songplaying}`).classList.replace('fa-play' , 'fa-pause')
        }
        else{
          Audio.pause();
          playbtn.classList.remove('fa-pause')
          playbtn.classList.add('fa-play')
          trackPlaying = false;
          document.querySelector(`#${songplaying}`).classList.replace('fa-pause' , 'fa-play') 
        }
      }


    }

    function mxplayer () {
      
      var nextbtn = document.querySelector('#audio #forwards');
      var prevbtn = document.querySelector('#audio #previous');

      function setTime(output , input) {
        const mins = Math.floor(input / 60);
  
        const secs = Math.floor(input % 60);
  
        if(secs < 10){
          output.textContent = mins + ':0' + secs ;
        }
        else {
          output.textContent = mins + ':' + secs ;
  
        }
      }


      let volumeMuted = false ;
      
      let trackID = 0 ;

      playbtn.addEventListener('click' , playTrack);

      function getAnimal(animalString) {
        // Remove the digits from the end of the animal string.
        const animalName = animalString.slice(0, -1);
      
        // Return the animal name.
        return animalName;
      }
      
      

      function playTrack() {
        var prev = Audio.getAttribute('id').slice(4)
        
        var playlistplay = getAnimal(prev)
        if(!trackPlaying)
        {
          console.log(playlistplay)
          Audio.play();
          playbtn.classList.remove('fa-play')
          playbtn.classList.add('fa-pause')
          trackPlaying = true;
          document.querySelector(`#${prev}`).classList.replace('fa-play' , 'fa-pause')
          document.querySelector(`#${playlistplay}`).classList.replace('fa-play' , 'fa-pause')
        }
        else{
          
          console.log(prev)
          Audio.pause();
          Audio.getAttribute('id')
          playbtn.classList.remove('fa-pause')
          playbtn.classList.add('fa-play')
          trackPlaying = false;
          document.querySelector(`#${prev}`).classList.replace('fa-pause' , 'fa-play')
          document.querySelector(`#${playlistplay}`).classList.replace('fa-pause' , 'fa-play')
        }
      }

      Audio.addEventListener('loadeddata' , () => {
        setTime(FullTime , Audio.duration)

        slider.setAttribute('max' , Audio.duration)
        progress.style.width = 0;
        Thumb.style.left = 0;
      })

      Audio.addEventListener('timeupdate' , () => {
        const currentAudioTime = Math.floor(Audio.currentTime)

        const TimePercent = (currentAudioTime / Audio.duration) * 100 + '%';

        setTime(Time , currentAudioTime);

        progress.style.width = TimePercent;
        Thumb.style.left = TimePercent;

      })

      nextbtn.addEventListener('click' , nextSong);
      prevbtn.addEventListener('click' , preSong);
      Audio.addEventListener('ended' , nextSong)

      function nextSong() {

        var nextSongId = nextbtn.getAttribute('data-song')
        const clickevent = new MouseEvent('click')
        document.querySelector(`#${nextSongId}`).dispatchEvent(clickevent)


      }

      function preSong() {
        var prevSongId = prevbtn.getAttribute('data-song')
        const clickevent = new MouseEvent('click')
       document.querySelector(`#${prevSongId}`).dispatchEvent(clickevent)
      }

      function CustomSlider() {
        const val = (slider.value / Audio.duration) * 100 + '%';

        console.log(slider.value)
        console.log(val)

        progress.style.width = val ;
        Thumb.style.left = val;

        setTime(Time,slider.value);

        Audio.currentTime = slider.value;
      }

      CustomSlider();

      slider.addEventListener('input' , CustomSlider)

      let vol1 ;

      function customVolume() {

        const maxVol = volslider.getAttribute('max');

        vol1 = (volslider.value / maxVol) * 100 + '%';

        volprogress.style.width = vol1;

        Audio.volume = volslider.value / 100 ;

        if(Audio.volume < 0.5) {
            volicon.classList.remove('fa-volume-high')
            volicon.classList.add('fa-volume-low')
        }
        else{
            volicon.classList.remove('fa-volume-low')
            volicon.classList.add('fa-volume-high')
        }
      }

      customVolume();

      volslider.addEventListener('input' , customVolume)
    }

    mxplayer();