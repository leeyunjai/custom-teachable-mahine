import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input
from tensorflow.keras.layers import GlobalAveragePooling2D
from tensorflow.keras.models import load_model
from openpibo.vision import Camera

camera = Camera()
class_names = ['c1', 'c2', 'c3']

# MobileNetV2 모델 로드
#mobilenet = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
mobilenet = MobileNetV2(weights='/home/pi/mobilenet_v2_weights_tf_dim_ordering_tf_kernels_1.0_224_no_top.h5', include_top=False, input_shape=(224, 224, 3))

x = GlobalAveragePooling2D()(mobilenet.output)

# my-model 로드
my_model = load_model('my-model.h5')

# 특성 추출 모델 정의
feature_extractor = tf.keras.Model(inputs=mobilenet.input, outputs=x)

while True:
    # 이미지 불러오기
    frame = camera.read()
    img = cv2.resize(frame, (224, 224))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # 이미지 전처리
    img = np.array(img, dtype=np.float32)
    img = np.expand_dims(img, axis=0)
    img = preprocess_input(img)

    # 특성 추출
    features = feature_extractor.predict(img)

    # 예측 수행
    predictions = my_model.predict(features)
    prediction = predictions[0]

    index = np.argmax(prediction)
    class_name = class_names[index]
    confidence_score = prediction[index]

    # 예측 결과 출력
    print("Class:", class_name)
    print("Confidence Score:", str(np.round(confidence_score * 100))[:-2], "%")
    print(predictions)
    camera.imshow_to_ide(frame)
