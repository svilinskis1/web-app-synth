import './reset.css'
import './styles.css'

//INITIAL SETUP-------------------------------------------------------------------------------------------------------------

//some variables
const piano = document.getElementById("piano") as HTMLDivElement
let oscillatorType: OscillatorType
let detuneAmount: number
let octaveMultiplier: number

//set up the audio
const audioContext = new AudioContext()
let oscillatorNode = audioContext.createOscillator()
const gainNode = audioContext.createGain()
const analyserNode = audioContext.createAnalyser()
const pannerNode = audioContext.createStereoPanner()

oscillatorNode.connect(gainNode).connect(analyserNode).connect(pannerNode).connect(audioContext.destination)

//set up the canvas
const WIDTH = 300;
const HEIGHT = 80
const canvas = document.getElementById('waveform') as HTMLCanvasElement;
const canvasContext = canvas.getContext('2d') as CanvasRenderingContext2D;
canvas.width = WIDTH;
canvas.height = HEIGHT;

//analyzer node stuff for the visualizer 
analyserNode.fftSize = 2048;
const bufferLength = analyserNode.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

//PIANO KEY SETUP-------------------------------------------------------------------------------------------------------------

//set up the piano keys
const keysList = document.querySelectorAll(".key")

//add functions to all the keys
keysList.forEach(function(currentkey){
    currentkey.addEventListener('mousedown', ()=>playSound(parseFloat(currentkey.id)))
    currentkey.addEventListener('mouseup', stopSound)
    currentkey.addEventListener('mouseleave', stopSound)
  })

//stops the sound and changes the color back
function stopSound(){
    
   oscillatorNode.stop()
   piano.style.boxShadow = "0px 0px 100px dodgerblue"
   piano.style.textShadow = "0px 0px 5px dodgerblue"
}

//plays the sound and makes the color bright
function playSound(frequency: number){
    if (audioContext!.state === 'suspended') {
        audioContext!.resume()
    }
        oscillatorNode = audioContext.createOscillator()
        oscillatorNode.connect(gainNode).connect(audioContext.destination)
        oscillatorNode.type = oscillatorType
        oscillatorNode.frequency.setValueAtTime(frequency * octaveMultiplier, audioContext.currentTime)
        oscillatorNode.detune.setValueAtTime(detuneAmount, audioContext.currentTime)
        oscillatorNode.start()

        piano.style.boxShadow = "0px 0px 180px cyan"
        piano.style.textShadow = "0px 0px 10px cyan"
}

//OPTIONS SETUP-------------------------------------------------------------------------------------------------------------

//make the menu buttons functional
//detune slider
const detune = document.getElementById("detune") as HTMLInputElement
detune.onchange = function(){
    detuneAmount = Number(detune.value)
    localStorage.setItem("detuneAmount", String(detuneAmount))
}

//gain slider
const gain = document.getElementById("volume") as HTMLInputElement
gain.onchange = function(){
    gainNode.gain.value = Number(gain.value)
    localStorage.setItem("gainAmount", String(gain.value))
}

//pan slider
const pan = document.getElementById("pan") as HTMLInputElement
pan.onchange = function(){
    pannerNode.pan.setValueAtTime(Number(pan.value), audioContext.currentTime)
    localStorage.setItem("panValue", String(pan.value))
}

//waveshape radio buttons
const sine = document.getElementById("sine") as HTMLInputElement
sine.onchange = function(){
    oscillatorType = "sine"
    localStorage.setItem("oscillatorType", "sine")
}

const square = document.getElementById("square") as HTMLInputElement
square.onchange = function(){
    oscillatorType = "square"
    localStorage.setItem("oscillatorType", "square")
}

const sawtooth = document.getElementById("sawtooth") as HTMLInputElement
sawtooth.onchange = function(){
    oscillatorType = "sawtooth"
    localStorage.setItem("oscillatorType", "sawtooth")
}

const triangle = document.getElementById("triangle") as HTMLInputElement
triangle.onchange = function(){
    oscillatorType = "triangle"
    localStorage.setItem("oscillatorType", "triangle")
}

//hook up the octave changer
const octave = document.getElementById("octave") as HTMLInputElement
octave.onchange = function(){
    switch (octave.value){
        case "-1":
            octaveMultiplier = .5
            break;
        case "0":
            octaveMultiplier = 1
            break;
        case "1":
            octaveMultiplier = 2
            break;
    }

    localStorage.setItem("octave", octave.value)
}

//LOCAL STORAGE SETUP-------------------------------------------------------------------------------------------------------------

//load a bunch of settings from local storage
//pan
if(localStorage.getItem("panValue")){
    pan.value = localStorage.getItem("panValue") as string
}
else{
    pan.value = "0"
    localStorage.setItem("panValue", "0")
}

pannerNode.pan.setValueAtTime(Number(pan.value), audioContext.currentTime)

//detune
if(localStorage.getItem("detuneAmount")){
    detuneAmount = Number(localStorage.getItem("detuneAmount"))
    detune.value = localStorage.getItem("detuneAmount") as string
}
else{
    detune.value = "0"
    localStorage.setItem("detuneAmount", "0")
}

//gain
if(localStorage.getItem("gainAmount")){
    gainNode.gain.value = Number(localStorage.getItem("gainAmount"))
    gain.value = localStorage.getItem("gainAmount") as string
}
else{
    gainNode.gain.value = .5
    localStorage.setItem("gainAmount", ".5")
}

//octave
if(localStorage.getItem("octave")){
    octave.value = localStorage.getItem("octave") as string

    switch (octave.value){
        case "-1":
            octaveMultiplier = .5
            break;
        case "0":
            octaveMultiplier = 1
            break;
        case "1":
            octaveMultiplier = 2
            break;
    }
    
}
else{
    octaveMultiplier = 1
    octave.value = "0"
    localStorage.setItem("octaveMultiplier", "1")
}

//oscillator type
if(localStorage.getItem("oscillatorType")){
    oscillatorType = localStorage.getItem("oscillatorType") as OscillatorType
}
else{
    oscillatorType = "sine"
    localStorage.setItem("oscillatorType", "sine")
}

switch(oscillatorType)
{
    case "sine":
        sine.checked = true;
        break;
    case "square":
        square.checked = true;
        break;
    case "sawtooth":
        sawtooth.checked = true;
        break;
    case "triangle":
        triangle.checked = true;
        break;
}

//CANVAS SETUP-------------------------------------------------------------------------------------------------------------

//draw  the waveform
//from: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API 
const clear = () => {
    canvasContext.clearRect(0, 0, WIDTH, HEIGHT)
    canvasContext.fillRect(0, 0, WIDTH, HEIGHT)
  };

  const draw = () => {
    analyserNode.getByteTimeDomainData(dataArray);
    canvasContext.lineWidth = 2;
    canvasContext.strokeStyle = "rgb(255 255 255)";
    canvasContext.shadowColor = "rgb(0 255 255)"
    canvasContext.shadowBlur = 10
    canvasContext.beginPath();

    const sliceWidth = WIDTH / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * (HEIGHT / 2);
      
        if (i === 0) {
            canvasContext.moveTo(x, y);
        } else {
            canvasContext.lineTo(x, y);
        }
      
        x += sliceWidth;
      }

      canvasContext.lineTo(WIDTH, HEIGHT / 2);
      canvasContext.stroke();
  }

  const render = () => {
    clear();
    draw();
    window.requestAnimationFrame(render);
  };

window.requestAnimationFrame(render);

