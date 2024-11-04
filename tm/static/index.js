<style>
    body {
        font-family: 'Nanum Gothic', sans-serif;
        background-color: #f9fafb;
        color: #333;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: stretch;
        min-height: 100vh;
        overflow: hidden;
    }
    .container {
        display: flex;
        width: 100vw;
        height: 100vh;
    }
    .sidebar {
        width: 25%;
        padding: 20px;
        background-color: #ffffff;
        box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
        overflow-y: auto;
    }
    .main-content {
        width: 75%;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-around;
        position: relative;
    }
    .sidebar h2 {
        text-align: center;
        margin-bottom: 20px;
    }
    #class-management {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
    }
    #class-name {
        padding: 12px;
        font-size: 1.2em;
        flex-grow: 1;
        margin-right: 10px;
        border: 1px solid #ccc;
        border-radius: 5px;
        transition: border-color 0.3s;
    }
    #class-name:focus {
        border-color: #4CAF50;
    }
    button {
        padding: 12px 20px;
        font-size: 1.1em;
        margin: 8px;
        border: none;
        border-radius: 8px;
        background-color: #4CAF50;
        color: white;
        cursor: pointer;
        transition: background-color 0.3s, transform 0.2s;
    }
    button:hover {
        background-color: #45a049;
        transform: scale(1.05);
    }
    .class-container {
        cursor: pointer;
        margin: 10px 0;
        border: 1px solid #ccc;
        border-radius: 5px;
        padding: 10px;
        background-color: #f0f0f0;
        transition: background-color 0.3s, transform 0.3s;
    }
    .class-container:hover {
        background-color: #e0f7fa;
        transform: scale(1.02);
    }
    .class-container.selected {
        border: 2px solid #4CAF50;
        background-color: #dcedc8;
    }
    .image-collection {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-top: 10px;
    }
    .thumbnail {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        transition: transform 0.3s;
    }
    .thumbnail:hover {
        transform: scale(1.1);
    }
    #camera-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 20px;
        width: 100%;
        max-width: 600px;
    }
    #camera { width: 100%; height: 400px; max-width: 600px; margin-bottom: 10px; }
    #training-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
        margin-bottom: 20px;
        width: 100%;
    }
    #training-params {
        display: flex;
        justify-content: space-evenly;
        gap: 10px;
        margin-top: 15px;
        width: 100%;
        max-width: 600px;
    }
    #training-params label, #training-params input {
        margin: 5px;
    }
    #training-buttons {
        display: flex;
        justify-content: space-evenly;
        flex-wrap: wrap;
        gap: 15px;
        width: 100%;
        max-width: 800px;
    }
    #progress-section {
        margin-bottom: 20px;
        width: 100%;
        text-align: center;
    }
    #preview-status {
        font-weight: bold;
        color: #4CAF50;
        animation: pulse 1s infinite;
    }
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
    @media (max-width: 600px) {
        .container {
            flex-direction: column;
            align-items: stretch;
        }
        .sidebar {
            width: 100%;
            height: 40%;
            padding: 10px;
            overflow-y: auto;
        }
        .main-content {
            width: 100%;
            height: 60%;
            padding: 10px;
        }
        #camera {
            width: 100%;
            height: 200px;
        }
        button {
            padding: 10px;
            font-size: 1em;
        }
    }
</style>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>이미지 학습 도구</title>
    <script src="static/tf.min-3.11.0.js"></script>
</head>
<body>
    <div class="container">
        <!-- Sidebar for class management -->
        <div class="sidebar">
            <h2>클래스 관리</h2>
            <div id="class-management">
                <input type="text" id="class-name" placeholder="클래스 이름을 입력하세요">
                <button onclick="addClass()">클래스 추가</button>
            </div>
            <div id="class-list">
                <!-- Dynamically added classes and image collections will appear here -->
            </div>
        </div>

        <!-- Main content for camera and model operations -->
        <div class="main-content">
            <!-- Camera Feed and Capture -->
            <div id="camera-section">
                <video id="camera" autoplay playsinline></video>
                <button id="capture-button" onmousedown="startCapturingImages()" onmouseup="stopCapturingImages()" onmouseleave="stopCapturingImages()">이미지 캡처</button>
            </div>

            <!-- Training Parameters -->
            <div id="training-params">
                <label for="epochs">에포크 수: </label>
                <input type="number" id="epochs" value="15" min="1" max="100">
                <label for="batch-size">배치 크기: </label>
                <input type="number" id="batch-size" value="32" min="1" max="256">
            </div>

            <!-- Train, Export, and Import Model Buttons -->
            <div id="training-buttons">
                <button onclick="trainAndPredict()">모델 학습 시작</button>
                <button onclick="togglePredictImage()">미리보기 토글</button>
                <button onclick="exportModel()">모델 내보내기</button>
                <label for="model-upload" class="upload-button">모델 불러오기</label>
                <input type="file" id="model-upload" onchange="importModel(event)" style="display:none" />
            </div>

            <!-- Training Progress -->
            <div id="progress-section">
                <p id="training-progress">학습이 시작되지 않았습니다</p>
                <progress id="progress-bar" value="0" max="100"></progress>
            </div>

            <!-- Prediction Result -->
            <div id="prediction-section">
                <h3>예측 결과:</h3>
                <p id="prediction-result">아직 예측이 없습니다</p>
                <p id="preview-status" style="visibility: hidden;"></p>
            </div>
        </div>
    </div>

    <script>
        const MOBILE_NET_INPUT_WIDTH = 224;
        const MOBILE_NET_INPUT_HEIGHT = 224;
        const CLASS_NAMES = [];
        let mobilenet;
        let model;
        let gatherDataState = -1;
        let trainingDataInputs = [];
        let trainingDataOutputs = [];
        let examplesCount = [];
        let predict = false;
        let webcamStream;
        let capturing = false;
        let captureInterval;
        let previewing = false;
        let previewInterval = null;

        // Start webcam
        async function startCamera() {
            webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
            document.getElementById('camera').srcObject = webcamStream;
        }

        // Load MobileNet Feature Model
        async function loadMobileNetFeatureModel() {
            const URL = 'static/model.json';
            let tmp_model = await tf.loadLayersModel(URL);
            const layer = tmp_model.getLayer('global_average_pooling2d_1');
            mobilenet = tf.model({inputs: tmp_model.inputs, outputs: layer.output});

            // Warm up the model by passing zeros through it once.
            tf.tidy(function () {
                mobilenet.predict(tf.zeros([1, MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH, 3]));
            });
        }

        loadMobileNetFeatureModel().then(() => {
            document.getElementById('training-progress').innerText = '모델이 준비되었습니다.';
        });

        // Add a new class
        function addClass() {
            const className = document.getElementById('class-name').value;
            if (className && !CLASS_NAMES.includes(className)) {
                CLASS_NAMES.push(className);
                // Create new class container
                const classContainer = document.createElement('div');
                classContainer.className = 'class-container';
                classContainer.id = `class-${className}`;
                classContainer.innerHTML = `<h3 onclick="selectClass('${className}')">${className}</h3><div class="image-collection"></div>`;
                classContainer.onclick = () => {
                    selectClass(className);
                };
                document.getElementById('class-list').appendChild(classContainer);
                document.getElementById('class-name').value = '';
            }
        }

        // Select a class
        function selectClass(className) {
            // Clear previous selection
            document.querySelectorAll('.class-container').forEach(container => {
                container.classList.remove('selected');
            });

            // Update gatherDataState and highlight selected class
            gatherDataState = CLASS_NAMES.indexOf(className);
            const selectedClassContainer = document.getElementById(`class-${className}`);
            if (selectedClassContainer) {
                selectedClassContainer.classList.add('selected');
            }
        }

        // Capture images when button is held down
        function startCapturingImages() {
            capturing = true;
            captureInterval = setInterval(() => {
                if (capturing) {
                    captureImage();
                }
            }, 200); // Capture image every 200ms
        }

        function stopCapturingImages() {
            capturing = false;
            clearInterval(captureInterval);
        }

        // Capture image from webcam
        function captureImage() {
            if (gatherDataState === -1) {
                alert('이미지를 추가할 클래스를 선택하세요.');
                return;
            }

            const video = document.getElementById('camera');
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);

            // Add image to the selected class
            const className = CLASS_NAMES[gatherDataState];
            const imageElement = document.createElement('img');
            imageElement.src = canvas.toDataURL('image/png');
            imageElement.className = 'thumbnail';
            imageElement.onclick = function() {
                if (confirm('이 이미지를 삭제하시겠습니까?')) {
                    const index = trainingDataInputs.indexOf(imgTensor);
                    if (index > -1) {
                        trainingDataInputs.splice(index, 1);
                        trainingDataOutputs.splice(index, 1);
                        imageElement.remove();
                    }
                }
            };
            document.querySelector(`#class-${className} .image-collection`).appendChild(imageElement);

            const imgTensor = tf.browser.fromPixels(canvas).resizeNearestNeighbor([MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH]).toFloat().div(tf.scalar(255));
            const features = mobilenet.predict(imgTensor.expandDims()).squeeze();

            trainingDataInputs.push(features);
            trainingDataOutputs.push(gatherDataState);
        }

        // Train model using MobileNet for transfer learning
        async function trainAndPredict() {
            predict = false;
            document.getElementById('training-progress').innerText = 'Training ...';
            tf.util.shuffleCombo(trainingDataInputs, trainingDataOutputs);

            let outputsAsTensor = tf.tensor1d(trainingDataOutputs, 'int32');
            let oneHotOutputs = tf.oneHot(outputsAsTensor, CLASS_NAMES.length);
            let inputsAsTensor = tf.stack(trainingDataInputs);

            model = tf.sequential();
            model.add(tf.layers.dense({inputShape: [1280], units: 128, activation: 'relu'}));
            model.add(tf.layers.dense({units: CLASS_NAMES.length, activation: 'softmax'}));
            model.compile({
                optimizer: 'adam',
                loss: 'categoricalCrossentropy',
                metrics: ['accuracy']
            });

            model.fit(inputsAsTensor, oneHotOutputs, {
                shuffle: true,
                batchSize: parseInt(document.getElementById('batch-size').value),
                epochs: parseInt(document.getElementById('epochs').value),
                callbacks: { onEpochEnd: logProgress }
            }).then(() => {
                outputsAsTensor.dispose();
                oneHotOutputs.dispose();
                inputsAsTensor.dispose();
                document.getElementById('training-progress').innerText = 'Trained Ok';
                predict = true;
                togglePredictImage();
            });
        }

        function logProgress(epoch, logs) {
            console.log('Data for epoch ' + epoch, logs);
            document.getElementById('training-progress').innerText = 'Data for epoch ' + epoch + ', ' + JSON.stringify(logs);
        }

        // Toggle prediction preview
        function togglePredictImage() {
            const previewStatus = document.getElementById('preview-status');
            if (!previewStatus) return;
            if (previewing) {
                clearInterval(previewInterval);
                previewing = false;
                previewStatus.style.visibility = 'hidden';
                document.getElementById('prediction-result').innerText = '아직 예측이 없습니다';
            } else {
                previewInterval = setInterval(() => predictImage(), 1000); // Predict every second
                previewing = true;
                previewStatus.innerText = '(미리보기 실행 중)';
                previewStatus.style.visibility = 'visible';
            }
        }

        // Predict using trained model
        async function predictImage() {
            if (!model) {
                alert('먼저 모델을 학습하세요');
                return;
            }

            const video = document.getElementById('camera');
            const img = tf.tidy(() => tf.browser.fromPixels(video)
                            .resizeNearestNeighbor([MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH])
                            .toFloat()
                            .div(tf.scalar(255.0))
                            .expandDims());

            const features = tf.tidy(() => mobilenet.predict(img).flatten());
            const prediction = tf.tidy(() => model.predict(features.expandDims()));
            const predictionData = await prediction.data();
            const classIndex = prediction.argMax(-1).dataSync()[0];
            const confidence = predictionData[classIndex];

            const className = CLASS_NAMES[classIndex];
            document.getElementById('prediction-result').innerText = `예측된 클래스: ${className} (신뢰도: ${(confidence * 100).toFixed(2)}%)`;

            img.dispose();
            features.dispose();
            prediction.dispose();
        }

        // Start the camera when the page loads
        window.onload = () => {
            startCamera();
        }
    </script>
</body>
</html>
