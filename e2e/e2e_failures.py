"""Failure paths in a real browser: unreadable ID, and camera permission denied."""
import os
import random
import sys

import cv2
import numpy as np
from playwright.sync_api import expect, sync_playwright

S = os.path.realpath(sys.argv[1])
FX, SHOTS = os.path.join(S, "fx"), os.path.join(S, "shots")
os.makedirs(SHOTS, exist_ok=True)
BASE = "http://localhost:5173"

# A camera that sees only a blurry desk, no ID.
blank = os.path.join(FX, "blank_cam.y4m")
if not os.path.exists(blank):
    img = cv2.GaussianBlur(np.random.default_rng(1).integers(40, 90, (720, 1280, 3), dtype=np.uint8), (0, 0), 25)
    with open(blank, "wb") as fh:
        fh.write(b"YUV4MPEG2 W1280 H720 F10:1 Ip A1:1 C420jpeg\n")
        for _ in range(10):
            fh.write(b"FRAME\n" + cv2.cvtColor(img, cv2.COLOR_BGR2YUV_I420).tobytes())

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True, args=[
        "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", f"--use-file-for-fake-video-capture={blank}"])
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto(BASE + "/register")
    page.get_by_label("Email").fill(f"fail{random.randint(1000, 9999)}@example.com")
    page.get_by_label("Password", exact=True).fill("Candidate123")
    page.get_by_role("button", name="Create account").click()
    expect(page.get_by_role("heading", name="Candidate profile")).to_be_visible(timeout=15000)

    # Profile photo without a face is rejected by the server with a clear message.
    page.get_by_label("First name").fill("Srinivasa Rao")
    page.get_by_label("Last name").fill("B")
    page.get_by_label("Date of birth").fill("1998-05-04")
    page.get_by_label("Mobile number").fill("9876543210")
    blank_jpg = os.path.join(FX, "blank.jpg")
    cv2.imwrite(blank_jpg, np.full((600, 800, 3), 180, np.uint8))
    page.locator('input[aria-label="Profile photo"]').set_input_files(blank_jpg)
    page.get_by_role("button", name="Save and continue").click()
    expect(page.get_by_text("We could not find a face in your profile photo")).to_be_visible(timeout=30000)
    page.screenshot(path=os.path.join(SHOTS, "20_profile_no_face.png"))
    print("  profile photo without face rejected", flush=True)

    page.locator('input[aria-label="Profile photo"]').set_input_files(os.path.join(FX, "profile.jpg"))
    page.get_by_role("button", name="Save and continue").click()
    expect(page.get_by_role("heading", name="Show your government ID")).to_be_visible(timeout=60000)
    # Interview creation is refused until an ID has been captured.
    status = page.evaluate("fetch('/api/interviews', {method: 'POST'}).then(r => r.status)")
    assert status == 409, status
    print("  interview blocked before ID capture:", status, flush=True)
    page.wait_for_timeout(2000)
    page.get_by_role("button", name="Capture ID").click()
    # No checks at this step: even a blank capture lets the candidate continue.
    expect(page.get_by_text("ID captured", exact=True)).to_be_visible(timeout=60000)
    page.screenshot(path=os.path.join(SHOTS, "21_id_captured_no_block.png"))
    print("  capture does not block the candidate", flush=True)
    browser.close()

    # Camera permission denied.
    browser = p.chromium.launch(channel="msedge", headless=True, args=["--use-fake-device-for-media-stream", "--deny-permission-prompts"])
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.goto(BASE + "/register")
    page.get_by_label("Email").fill(f"deny{random.randint(1000, 9999)}@example.com")
    page.get_by_label("Password", exact=True).fill("Candidate123")
    page.get_by_role("button", name="Create account").click()
    expect(page.get_by_role("heading", name="Candidate profile")).to_be_visible(timeout=15000)
    page.get_by_role("button", name="Use camera").click()
    expect(page.get_by_text("Permission needed")).to_be_visible(timeout=15000)
    page.screenshot(path=os.path.join(SHOTS, "22_camera_denied.png"))
    print("  camera permission denied handled", flush=True)
    browser.close()
    print("E2E FAILURE PATHS PASSED", flush=True)
