from fastapi_socketio import SocketManager
from fastapi import FastAPI,Request,UploadFile,File,Body
from fastapi.responses import HTMLResponse,FileResponse,JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware

import time,os,json,shutil
import argparse,cv2,base64
from openpibo.vision import Camera
import asyncio
from threading import Timer

try:
  app = FastAPI()
  app.mount("/static", StaticFiles(directory="static"), name="static")
  app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
  templates = Jinja2Templates(directory="templates")
  socketio = SocketManager(app=app, cors_allowed_origins=[])
except Exception as ex:
  print(f'Server Error:{ex}')

def to_base64(im):
  im = cv2.imencode('.jpg', cv2.resize(im, (320,240)))[1].tobytes()
  return base64.b64encode(im).decode('utf-8')

def TimerStart(intv, func, daemon=True):
  tim = Timer(intv, func)
  tim.daemon = True
  tim.start()
  return tim

def vision_loop():
  camera.cap.set(cv2.CAP_PROP_FPS, 10)
  while True:
    if vision_en == False:
      time.sleep(1)
      continue
    img = camera.read()
    asyncio.run(emit('image', to_base64(img), callback=None))

# REST API
@app.get('/', response_class=HTMLResponse)
async def f(request:Request):
  return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload")
async def upload_files(model_json: UploadFile = File(...), model_weights_bin: UploadFile = File(...)):
  with open("model.json", "wb") as json_file:
    json_content = await model_json.read()
    json_file.write(json_content)

  with open("model.weights.bin", "wb") as weights_file:
    weights_content = await model_weights_bin.read()
    weights_file.write(weights_content)

  return {"message": "모델 파일이 성공적으로 업로드되었습니다."}

@app.sio.on('control_cam')
async def f(sid, d=None):
  global vision_en
  print('control_cam: ', d)
  vision_en = d

@app.on_event('startup')
async def f():
  global camera, vision_en
  vision_en = False
  camera = Camera()
  TimerStart(1, vision_loop, True)

async def emit(key, data, callback=None):
  try:
    await app.sio.emit(key, data, callback=callback)
  except Exception as ex:
    print(f'[emit] Error: {ex}')  

if __name__ == '__main__':
  parser = argparse.ArgumentParser()
  parser.add_argument('--port', help='set port number', default=30000)
  args = parser.parse_args()

  import uvicorn
  uvicorn.run('main:app', host='0.0.0.0', port=args.port, access_log=False)
