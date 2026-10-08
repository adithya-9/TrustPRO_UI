"""Build browser-test fixtures from your own media (fixtures are not committed).

    python make_fixtures.py <workdir> <interview_video.mp4> <id_card_image.jpg>

Run with the backend's Python (it uses the backend's face detector). Produces in <workdir>/fx:
profile.jpg, id_card.jpg (the ID image with the video person's face in the portrait slot, so the
happy path can match), id_cam.y4m and interview.y4m (fake camera feeds for Chromium/Edge).
"""
import sys

import cv2
import numpy as np

sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parents[2] / "trustpro_backend"))
from app.core.logging import configure_logging  # noqa: E402

configure_logging("WARNING")
from app.ai.face import get_face_engine  # noqa: E402

OUT = __import__("os").path.join(sys.argv[1], "fx")
__import__("os").makedirs(OUT, exist_ok=True)
VIDEO = sys.argv[2]
DL = sys.argv[3]
fe = get_face_engine()

cap = cv2.VideoCapture(VIDEO)
cap.set(cv2.CAP_PROP_POS_MSEC, 3000)
ok, frame = cap.read()
cv2.imwrite(f"{OUT}/profile.jpg", frame)

# ID card with the interview person's face in the portrait slot.
card = cv2.imread(DL)
portrait = fe.detect(card, max_side=1600, min_score=0.6)[0]
face = fe.detect(frame)[0]
x, y, w, h = face.box
mx, my = int(w * 0.25), int(h * 0.35)
crop = frame[max(0, y - my):y + h + my // 2, max(0, x - mx):x + w + mx]
px, py, pw, ph = portrait.box
PX0, PY0 = max(0, px - int(pw * 0.35)), max(0, py - int(ph * 0.45))
PX1, PY1 = px + int(pw * 1.35), py + int(ph * 1.35)
card[PY0:PY1, PX0:PX1] = cv2.resize(crop, (PX1 - PX0, PY1 - PY0))
cv2.imwrite(f"{OUT}/id_card.jpg", card)


def write_y4m(path, frames, w, h, fps):
    with open(path, "wb") as fh:
        fh.write(f"YUV4MPEG2 W{w} H{h} F{fps}:1 Ip A1:1 C420jpeg\n".encode())
        for f in frames:
            fh.write(b"FRAME\n")
            fh.write(cv2.cvtColor(f, cv2.COLOR_BGR2YUV_I420).tobytes())


# Camera view for the ID step: the card held in front of the camera, filling most of the guide.
W, H = 1280, 720
bg = np.full((H, W, 3), (48, 44, 40), np.uint8)
cw = int(W * 0.66)
chh = int(cw * card.shape[0] / card.shape[1])
small = cv2.resize(card, (cw, chh), interpolation=cv2.INTER_AREA)
x0, y0 = (W - cw) // 2, (H - chh) // 2
bg[y0:y0 + chh, x0:x0 + cw] = small
write_y4m(f"{OUT}/id_cam.y4m", [bg] * 20, W, H, 10)

# Interview camera: 45 s of the real clip at 15 fps, 640x360.
cap.set(cv2.CAP_PROP_POS_MSEC, 0)
fps = cap.get(cv2.CAP_PROP_FPS) or 30
frames, i = [], 0
while len(frames) < 45 * 15:
    ok, f = cap.read()
    if not ok:
        break
    if i % max(1, round(fps / 15)) == 0:
        frames.append(cv2.resize(f, (640, 360), interpolation=cv2.INTER_AREA))
    i += 1
write_y4m(f"{OUT}/interview.y4m", frames, 640, 360, 15)
print("fixtures ok", len(frames), "interview frames")
