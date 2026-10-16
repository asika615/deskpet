from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np,json
p=Path(__file__).resolve().parents[1]
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';F=lambda n:ImageFont.truetype(font,n)
bg='#eee8e0';ink='#302722';muted='#6c625a'
def text(d,xy,s,size=20,color=ink):d.text(xy,s,font=F(size),fill=color)
def image(can,file,box,size,xy):
 im=Image.open(p/file).convert('RGBA').crop(box).resize(size,Image.Resampling.LANCZOS);can.paste(im,xy,im)
def save(can,name):
 target=p/'review'/name;temp=target.with_suffix('.part.png');can.save(temp,optimize=True)
 with Image.open(temp) as check:check.verify()
 temp.replace(target)
files=['references/original.png','review/v0.3.11-idle.png','review/v0.3.12-idle.png'];labels=['Original reference','v0.3.11 / before','v0.3.12 / fuller shoulder base']
can=Image.new('RGB',(1350,612),bg);d=ImageDraw.Draw(can)
text(d,(22,15),'Shoulder base volume / same scale and camera',25)
for i,(f,t) in enumerate(zip(files,labels)):
 text(d,(i*450+17,64),t,20);image(can,f,(0,0,1206,1304),(438,474),(i*450+6,103))
text(d,(20,588),'Existing components and editable support contours; no body or head rescaling.',16,muted)
save(can,'shoulder-volume-comparison.png')
can=Image.new('RGB',(1536,885),bg);d=ImageDraw.Draw(can)
text(d,(22,15),'Shoulder roots / near skin cap and far inner sleeve support',26)
for i,(f,t) in enumerate(zip(files,labels)):
 x=i*512;text(d,(x+16,63),t,19)
 image(can,f,(540,688,690,815),(480,406),(x+16,105));text(d,(x+18,520),'Near shoulder / base beneath fixed armor',16,muted)
 image(can,f,(757,710,831,790),(210,227),(x+284,584))
 text(d,(x+18,580),'Far shoulder:',17);text(d,(x+18,615),'smaller dark sleeve base',15,muted)
text(d,(22,852),'The armor and torso are unchanged; added volume belongs to the inner shoulder / sleeve root.',16,muted)
save(can,'shoulder-volume-closeup.png')
# Two rows x three frozen poses, with the same shoulder crop in each cell.
can=Image.new('RGB',(1260,1230),bg);d=ImageDraw.Draw(can)
text(d,(20,15),'Idle / 50% lift / 100% lift — before and after',26)
for col,(pose,title) in enumerate([('idle','Idle / arm down'),('half','50% lift / frozen'),('full','100% lift / frozen')]):
 text(d,(col*420+16,60),title,22)
 for row,version in enumerate(['v0.3.11','v0.3.12']):
  x=col*420;y=108+row*550
  text(d,(x+16,y),version+(' / before' if row==0 else ' / after'),20)
  file=f'review/{version}-{pose}.png'
  image(can,file,(0,0,1206,1304),(334,361),(x+43,y+34))
  image(can,file,(530,687,848,807),(402,152),(x+9,y+392))
save(can,'shoulder-volume-three-poses.png')
# Explicit pixel-class estimate, not an anatomical or 3-D volume measurement.
metrics={}
for f,label in zip(files,['reference','before','after']):
 a=np.array(Image.open(p/f).convert('RGBA')).astype(int)
 skin=(a[:,:,0]>210)&(a[:,:,0]-a[:,:,1]>5)&(a[:,:,0]-a[:,:,2]>12)&(a[:,:,3]>200)
 metrics[label]={'visibleSkinAreaInRoi':int(skin[700:785,585:675].sum()),'skinWidthAtRows':{str(y):int(skin[y,585:675].sum()) for y in [715,725,735,745,755]}}
metrics['method']={'roi':[585,700,675,785],'skinThreshold':'R>210, R-G>5, R-B>12, alpha>200','limitation':'Visible flat-skin pixel estimate; occlusion and costume differ. It is not total anatomical or 3-D shoulder volume.'}
metrics['visibleAreaIncreasePercent']=100*(metrics['after']['visibleSkinAreaInRoi']/metrics['before']['visibleSkinAreaInRoi']-1)
(p/'review/shoulder-volume-measurements.json').write_text(json.dumps(metrics,indent=2)+'\n')
print(json.dumps(metrics,indent=2))
