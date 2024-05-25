const video = document.getElementById('video');

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('http://localhost/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('http://localhost/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('http://localhost/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('http://localhost/models')
]).then(startVideo);

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: {} })
    .then(stream => {
      video.srcObject = stream;
      video.addEventListener('loadedmetadata', () => {
        video.play();
      });
    })
    .catch(err => console.error(err));
}

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  const container = document.querySelector('.video-container');
  container.append(canvas);

  const displaySize = { width: video.videoWidth + 80, height: video.videoHeight + 80 };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
  }, 100);
});
