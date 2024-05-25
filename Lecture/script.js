var labels = [];
let detectedFaces = [];

document.getElementById("addButton").onclick = function() {
    document.getElementById("photoUpload").click();
};

document.getElementById("photoUpload").onchange = function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const image = new Image();
            image.src = e.target.result;
            image.onload = function() {
                const canvas = document.getElementById('overlay');
                const video = document.getElementById("video");
                
                const videoAspectRatio = video.width / video.height;
                const imageAspectRatio = image.width / image.height;

                if (videoAspectRatio > imageAspectRatio) {
                    canvas.height = video.height;
                    canvas.width = image.width * (video.height / image.height);
                } else {
                    canvas.width = video.width;
                    canvas.height = image.height * (video.width / image.width);
                }

                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

                recognizeFaces(image);
                
                // Display the canvas container
                const videoContainer = document.querySelector(".video-container");
                videoContainer.style.display = "flex";
            };
        };
        reader.readAsDataURL(file);
    }
};

function drawImageOnCanvas(image, canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
}

async function recognizeFaces(image) {
    await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri("http://localhost/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("http://localhost/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("http://localhost/models"),
        faceapi.nets.ageGenderNet.loadFromUri("http://localhost/models")
    ]);

    const labeledFaceDescriptors = await getLabeledFaceDescriptions();
    if (labeledFaceDescriptors.length === 0) {
        console.error("No labeled face descriptors found.");
        showMessage("No labeled face descriptors found.");
        return;
    }

    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

    const canvas = document.getElementById('overlay');
    const displaySize = { width: canvas.width, height: canvas.height };
    faceapi.matchDimensions(canvas, displaySize);

    const detections = await faceapi.detectAllFaces(image)
        .withFaceLandmarks()
        .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    // Redraw the uploaded image on the canvas before drawing the boxes
    drawImageOnCanvas(image, canvas);

    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));

    detectedFaces = results.map(result => result.label);
    markAttendance(detectedFaces);

    results.forEach((result, i) => {
        const box = resizedDetections[i].detection.box;
        const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
        drawBox.draw(canvas);
    });
}

function updateTable() {
    var selectedCourseID = document.getElementById('courseSelect').value;
    var selectedUnitCode = document.getElementById('unitSelect').value;
    var selectedVenue = document.getElementById("venueSelect").value;

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'manageFolder.php', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            if (response.status === 'success') {
                labels = response.data;

                if (selectedCourseID && selectedUnitCode && selectedVenue) {
                    updateOtherElements();
                }
                document.getElementById('studentTableContainer').innerHTML = response.html;
            } else {
                console.error('Error:', response.message);
            }
        }
    };
    xhr.send('courseID=' + encodeURIComponent(selectedCourseID) +
        '&unitID=' + encodeURIComponent(selectedUnitCode) +
        '&venueID=' + encodeURIComponent(selectedVenue));
}

let continuousDetection = {};

function markAttendance(detectedFaces) {
    document.querySelectorAll('#studentTableContainer tr').forEach(row => {
        const registrationNumber = row.cells[0].innerText.trim();
        if (detectedFaces.includes(registrationNumber)) {
            if (!continuousDetection[registrationNumber]) {
                continuousDetection[registrationNumber] = 1;
            } else {
                continuousDetection[registrationNumber]++;
            }

            if (continuousDetection[registrationNumber] >= 30) { // 30 frames ~ 3 seconds at 10 fps
                const attendanceCell = row.cells[5];
                if (attendanceCell.innerText.trim() !== 'Present') {
                    attendanceCell.innerText = 'Present';
                    attendanceCell.classList.add('highlight');
                    setTimeout(() => {
                        attendanceCell.classList.remove('highlight');
                    }, 2000);
                }
            }
        } else {
            continuousDetection[registrationNumber] = 0;
        }
    });
}

function updateOtherElements() {
    const video = document.getElementById("video");
    const videoContainer = document.querySelector(".video-container");
    const startButton = document.getElementById("startButton");
    let webcamStarted = false;
    let modelsLoaded = false;

    Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri("http://localhost/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("http://localhost/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("http://localhost/models")
    ]).then(() => {
        modelsLoaded = true;
    });

    startButton.addEventListener("click", async () => {
        videoContainer.style.display = "flex";
        if (!webcamStarted && modelsLoaded) {
            startWebcam();
            webcamStarted = true;
        }
    });
}

function startWebcam() {
    navigator.mediaDevices
        .getUserMedia({
            video: true,
            audio: false,
        })
        .then((stream) => {
            const video = document.getElementById("video");
            video.srcObject = stream;
            videoStream = stream;
        })
        .catch((error) => {
            console.error(error);
        });
}

async function getLabeledFaceDescriptions() {
    const labeledDescriptors = [];

    for (const label of labels) {
        const descriptions = [];

        for (let i = 1; i <= 2; i++) {
            try {
                const img = await faceapi.fetchImage(`./labels/${label}/${i}.png`);
                const detections = await faceapi
                    .detectSingleFace(img)
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (detections) {
                    descriptions.push(detections.descriptor);
                } else {
                    console.log(`No face detected in ${label}/${i}.png`);
                }
            } catch (error) {
                console.error(`Error processing ${label}/${i}.png:`, error);
            }
        }

        if (descriptions.length > 0) {
            labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(label, descriptions));
        }
    }

    return labeledDescriptors;
}

video.addEventListener("play", async () => {
    const labeledFaceDescriptors = await getLabeledFaceDescriptions();
    if (labeledFaceDescriptors.length === 0) {
        console.error("No labeled face descriptors found.");
        showMessage("No labeled face descriptors found.");
        return;
    }
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

    const canvas = faceapi.createCanvasFromMedia(video);
    const videoContainer = document.querySelector(".video-container");
    videoContainer.appendChild(canvas);

    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        const detections = await faceapi
            .detectAllFaces(video)
            .withFaceLandmarks()
            .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

        const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));

        detectedFaces = results.map(result => result.label);
        markAttendance(detectedFaces);

        results.forEach((result, i) => {
            const box = resizedDetections[i].detection.box;
            const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
            drawBox.draw(canvas);
        });
    }, 100);
});
