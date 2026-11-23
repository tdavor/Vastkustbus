"""Compare the shipped ONNX graph with the original PyTorch generator."""
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).parent/'drawings'))
import numpy as np
import onnxruntime as ort
import torch
from generator import Generator
root=Path(__file__).resolve().parent.parent
model=Generator(3,1,3).eval()
model.load_state_dict(torch.load(root/'.model-cache/informative-style1.pth',map_location='cpu',weights_only=True),strict=True)
torch.set_num_threads(2)
options=ort.SessionOptions();options.intra_op_num_threads=2;options.inter_op_num_threads=1
session=ort.InferenceSession(str(root/'modules/informative-drawings/android/src/main/assets/models/informative-style1.onnx'),sess_options=options,providers=['CPUExecutionProvider'])
for height,width in [(64,96),(96,64),(256,320)]:
 x=np.random.default_rng(7).random((1,3,height,width),dtype=np.float32)
 with torch.inference_mode():reference=model(torch.from_numpy(x)).numpy()
 actual=session.run(['drawing'],{'photo':x})[0]
 assert actual.shape==(1,1,height,width)
 assert np.isfinite(actual).all() and actual.min()>=0 and actual.max()<=1
 difference=np.max(np.abs(reference-actual))
 assert difference<0.0002, difference
 print(f'ONNX {ort.__version__} parity {width}x{height}: max difference {difference:.8f}')
