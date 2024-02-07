const STATUS = document.getElementById('status');
const ENABLE_CAM_BUTTON = document.getElementById('enableCam');
const DISABLE_CAM_BUTTON = document.getElementById('disableCam');
const RESET_BUTTON = document.getElementById('reset');
const TRAIN_BUTTON = document.getElementById('train');
const MOBILE_NET_INPUT_WIDTH = 224;
const MOBILE_NET_INPUT_HEIGHT = 224;
const STOP_DATA_GATHER = -1;
const CLASS_NAMES = [];
const socket = io(`http://${location.hostname}:30000`, {path: "/ws/socket.io",});

ENABLE_CAM_BUTTON.addEventListener('click', enableCam);
DISABLE_CAM_BUTTON.addEventListener('click', disableCam);
TRAIN_BUTTON.addEventListener('click', trainAndPredict);
RESET_BUTTON.addEventListener('click', reset);

// Just add more buttons in HTML to allow classification of more classes of data!
let dataCollectorButtons = document.querySelectorAll('button.dataCollector');
for (let i = 0; i < dataCollectorButtons.length; i++) {
  console.log(dataCollectorButtons)
  dataCollectorButtons[i].addEventListener('mousedown', gatherDataForClass);
  dataCollectorButtons[i].addEventListener('mouseup', gatherDataForClass);
  // For mobile.
  dataCollectorButtons[i].addEventListener('touchend', gatherDataForClass);

  // Populate the human readable names for classes.
  CLASS_NAMES.push(dataCollectorButtons[i].getAttribute('data-name'));
}

let mobilenet = undefined;
let gatherDataState = STOP_DATA_GATHER;
let trainingDataInputs = [];
let trainingDataOutputs = [];
let examplesCount = [];
let predict = false;

let mobilenet1 = undefined;

async function loadMobileNetFeatureModel() {
  //const URL = 'https://storage.googleapis.com/jmstore/TensorFlowJS/EdX/SavedModels/mobilenet-v2/model.json';
  const URL = '../static/model.json';
  mobilenet1 = await tf.loadLayersModel(URL);
  STATUS.innerText = 'MobileNet v2 loaded successfully!';
  //mobilenet1.summary();
 
  const layer = mobilenet1.getLayer('global_average_pooling2d_1');
  mobilenet = tf.model({inputs: mobilenet1.inputs, outputs: layer.output}); 
  //mobilenet.summary();

  // Warm up the model by passing zeros through it once.
  tf.tidy(function () {
    let answer = mobilenet.predict(tf.zeros([1, MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH, 3]));
    //console.log(answer.shape);
  });
}

loadMobileNetFeatureModel();
let model = tf.sequential();
model.add(tf.layers.dense({ inputShape: [1280], units: 128, activation: 'relu' }));
model.add(tf.layers.dense({ units: CLASS_NAMES.length, activation: 'softmax' }));
//model.summary();

model.compile({
  optimizer: 'adam',
  loss: (CLASS_NAMES.length === 2) ? 'binaryCrossentropy' : 'categoricalCrossentropy',
  metrics: ['accuracy']
});

function enableCam() {
  image.style.display = 'inline-block';
  socket.emit('control_cam', true);
}
function disableCam() {
  image.style.display = 'none';
  socket.emit('control_cam', false);
}

const image = document.getElementById('view');
socket.on('image', function (data) {
  image.src = 'data:image/jpeg;utf-8;base64,' + data;
  
  if (predict) {
    image.onload = async function () {
      const imageTensor = tf.browser.fromPixels(image);
      const resizedTensor = tf.image.resizeBilinear(imageTensor, [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH], true);
      const normalizedTensor = resizedTensor.div(255);
      const batchedTensor = normalizedTensor.expandDims();
      const features = mobilenet.predict(batchedTensor).squeeze();
      imageTensor.dispose();
      normalizedTensor.dispose();
      batchedTensor.dispose();
      predictImage(features);
    };
  }
});

function gatherDataForClass() {
  let classNumber = parseInt(this.getAttribute('data-1hot'));
  gatherDataState = (gatherDataState === STOP_DATA_GATHER) ? classNumber : STOP_DATA_GATHER;
  dataGatherLoop();
}

function calculateFeaturesOnCurrentFrame(base64ImageData) {
  return tf.tidy(function () {
    const imageTensor = tf.browser.fromPixels(image);
    const resizedTensor = tf.image.resizeBilinear(imageTensor, [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH], true);
    const normalizedTensor = resizedTensor.div(255);
    const batchedTensor = normalizedTensor.expandDims();
    return mobilenet.predict(batchedTensor).squeeze();
  });
}

function dataGatherLoop() {
  // Only gather data if webcam is on and a relevant button is pressed.
  if (gatherDataState !== STOP_DATA_GATHER) {
    let imageFeatures = calculateFeaturesOnCurrentFrame();
    trainingDataInputs.push(imageFeatures);
    trainingDataOutputs.push(gatherDataState);

    if (examplesCount[gatherDataState] === undefined) {
      examplesCount[gatherDataState] = 0;
    }
    examplesCount[gatherDataState]++;

    STATUS.innerText = '';
    for (let n = 0; n < CLASS_NAMES.length; n++) {
      if (examplesCount[n] === undefined) examplesCount[n] = 0;
      STATUS.innerText += CLASS_NAMES[n] + ' data count: ' + examplesCount[n] + '. ';
    }

    window.requestAnimationFrame(dataGatherLoop);
  }
}

async function trainAndPredict() {
  predict = false;
  STATUS.innerText = 'Training ...';
  tf.util.shuffleCombo(trainingDataInputs, trainingDataOutputs);

  let outputsAsTensor = tf.tensor1d(trainingDataOutputs, 'int32');
  let oneHotOutputs = tf.oneHot(outputsAsTensor, CLASS_NAMES.length);
  let inputsAsTensor = tf.stack(trainingDataInputs);

  let results = await model.fit(inputsAsTensor, oneHotOutputs, {
    shuffle: true,
    batchSize: 5,
    epochs: 10,
    callbacks: { onEpochEnd: logProgress }
  });
  outputsAsTensor.dispose();
  oneHotOutputs.dispose();
  inputsAsTensor.dispose();
  STATUS.innerText = 'Trained Ok';

/*
  let combinedModel = tf.sequential();
  combinedModel.add(mobilenet1);
  combinedModel.add(model);
  
  combinedModel.compile({
    optimizer: 'adam',
    loss: (CLASS_NAMES.length === 2) ? 'binaryCrossentropy': 'categoricalCrossentropy'
  });
  
  combinedModel.summary();
  await combinedModel.save('downloads://my-model');
*/
  //await model.save('downloads://my-model');
  console.log(`http://${location.hostname}:30000/upload`)
  //await model.save(`http://${location.hostname}:30000/upload`);


  await model.save(tf.io.browserHTTPRequest(
    `http://${location.hostname}:30000/upload`,
    {method: 'POST', headers: {'header_key_1': 'header_value_1'} }));

  predict = true;
  predictLoop();
}

function logProgress(epoch, logs) {
  console.log('Data for epoch ' + epoch, logs);
  STATUS.innerText = 'Data for epoch ' + epoch + ', ' + JSON.stringify(logs);
}

function predictImage(imageFeatures) {
  tf.tidy(function () {
    let prediction = model.predict(imageFeatures.expandDims()).squeeze();
    let highestIndex = prediction.argMax().arraySync();
    let predictionArray = prediction.arraySync();
    STATUS.innerText = 'Prediction: ' + CLASS_NAMES[highestIndex] + ' with ' + Math.floor(predictionArray[highestIndex] * 100) + '% confidence';
  });
}

function predictLoop() {
  if (predict) {
    tf.tidy(function () {
      let imageFeatures = calculateFeaturesOnCurrentFrame();
      predictImage(imageFeatures);
    });
    window.requestAnimationFrame(predictLoop);
  }
}

function reset() {
  predict = false;
  examplesCount.splice(0);
  for (let i = 0; i < trainingDataInputs.length; i++) {
    trainingDataInputs[i].dispose();
  }
  trainingDataInputs.splice(0);
  trainingDataOutputs.splice(0);
  STATUS.innerText = 'No data collected';
  console.log('Tensors in memory: ' + tf.memory().numTensors);
}