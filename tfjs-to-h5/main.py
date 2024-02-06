import tensorflow as tf
import keras_tfjs_loader
import json

config_json_path = 'my-model.json'
h5_path = 'my-model.h5'

with open(config_json_path, 'rt') as f:
  try:
    json.load(f)
  except (ValueError, IOError):
    raise ValueError(
        'For input_type=tfjs_layers_model & output_format=keras, '
        'the input path is expected to contain valid JSON content, '
        'but cannot read valid JSON content from %s.' % config_json_path)

with tf.Graph().as_default(), tf.compat.v1.Session():
  model = keras_tfjs_loader.load_keras_model(config_json_path)
  print("==========================1=============================")
  model.summary()
  model.save(h5_path)
  
  new_model = tf.keras.models.load_model(h5_path) 
  print("==========================2=============================")
  new_model.summary()
