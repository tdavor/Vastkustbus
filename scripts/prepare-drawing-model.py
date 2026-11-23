"""Reproducibly export the tested author model for offline Android inference."""
import hashlib,sys,urllib.request,tempfile
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent/'drawings'))
import torch
import onnx
from generator import Generator
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'modules/informative-drawings/android/src/main/assets/models/informative-style1.onnx'
SHA='c686ced2a666b4850b4bb6ccf0748031c3eda9f822de73a34b8979970d90f0c6'
URL='https://huggingface.co/spaces/carolineec/informativedrawings/resolve/bd4b4299be505803e036203a39c02024b4cfee11/model.pth'
CACHE=ROOT/'.model-cache';CACHE.mkdir(exist_ok=True)
weights=CACHE/'informative-style1.pth'
if not weights.exists():
 with urllib.request.urlopen(URL,timeout=90) as response:weights.write_bytes(response.read())
if hashlib.sha256(weights.read_bytes()).hexdigest()!=SHA:
 weights.unlink(missing_ok=True)
 raise RuntimeError('Author model checksum mismatch')
torch.set_num_threads(2)
model=Generator(3,1,3).eval()
model.load_state_dict(torch.load(weights,map_location='cpu',weights_only=True),strict=True)
OUT.parent.mkdir(parents=True,exist_ok=True)
with torch.inference_mode():
 torch.onnx.export(model,torch.zeros(1,3,64,64),str(OUT),input_names=['photo'],output_names=['drawing'],opset_version=17,dynamic_axes={'photo':{2:'height',3:'width'},'drawing':{2:'height',3:'width'}},dynamo=False)
onnx.checker.check_model(onnx.load(str(OUT)))
print(f'Exported checked style-1 model: {OUT} ({OUT.stat().st_size} bytes); PyTorch {torch.__version__}')
