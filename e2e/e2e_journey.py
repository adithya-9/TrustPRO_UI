"""Full candidate journey in a real browser (Edge) with a fake camera."""
import os
import random
import sys
import time

from playwright.sync_api import expect, sync_playwright

S = os.path.realpath(sys.argv[1])
FX, SHOTS = os.path.join(S, "fx"), os.path.join(S, "shots")
os.makedirs(SHOTS, exist_ok=True)
BASE = "http://localhost:5173"
EMAIL = f"e2e{random.randint(1000, 9999)}@example.com"
LIVE_SECONDS = int(sys.argv[2]) if len(sys.argv) > 2 else 40


def launch(p, y4m):
    return p.chromium.launch(channel="msedge", headless=True, args=[
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
        f"--use-file-for-fake-video-capture={os.path.join(FX, y4m)}",
        "--autoplay-policy=no-user-gesture-required",
    ])


def shot(page, name, full=False):
    page.screenshot(path=os.path.join(SHOTS, f"{name}.png"), full_page=full)
    print("  screenshot", name, flush=True)


def log_console(page):
    page.on("console", lambda m: m.type in ("error", "warning") and print("  [browser]", m.type, m.text[:200], flush=True))
    page.on("pageerror", lambda e: print("  [pageerror]", str(e)[:300], flush=True))


with sync_playwright() as p:
    # ------------------------------------------------------------ part 1: onboarding + ID
    browser = launch(p, "id_cam.y4m")
    ctx = browser.new_context(viewport={"width": 1440, "height": 900}, permissions=["camera", "microphone"])
    page = ctx.new_page()
    log_console(page)
    page.goto(BASE)
    expect(page.get_by_role("heading", name="AI-powered interview protection.")).to_be_visible()
    shot(page, "01_landing")
    shot(page, "01_landing_full", full=True)

    page.get_by_role("link", name="Start your interview").click()
    page.get_by_label("Email").fill(EMAIL)
    page.get_by_label("Password", exact=True).fill("short")
    page.get_by_role("button", name="Create account").click()
    expect(page.get_by_text("Use at least 8 characters with a letter and a number.")).to_be_visible()
    shot(page, "02_register_validation")
    page.get_by_label("Password", exact=True).fill("Candidate123")
    page.get_by_role("button", name="Create account").click()
    expect(page.get_by_role("heading", name="Candidate profile")).to_be_visible(timeout=15000)

    page.get_by_role("button", name="Save and continue").click()
    expect(page.get_by_text("A profile photo is required.")).to_be_visible()
    shot(page, "03_profile_validation")
    page.get_by_label("First name").fill("Srinivasa Rao")
    page.get_by_label("Last name").fill("B")
    page.get_by_label("Date of birth").fill("1998-05-04")
    page.get_by_label("Mobile number").fill("9876543210")
    page.get_by_label("City").fill("Hyderabad")
    page.locator('input[aria-label="Profile photo"]').set_input_files(os.path.join(FX, "profile.jpg"))
    shot(page, "04_profile_filled")
    page.get_by_role("button", name="Save and continue").click()
    expect(page.get_by_role("heading", name="Show your government ID")).to_be_visible(timeout=60000)
    page.wait_for_timeout(2500)
    shot(page, "05_id_camera")
    page.get_by_role("button", name="Capture ID").click()
    expect(page.get_by_text("ID captured", exact=True)).to_be_visible(timeout=60000)
    shot(page, "06_id_captured")
    page.get_by_role("button", name="Continue to interview").click()
    page.wait_for_url("**/interviews/*", timeout=30000)
    interview_url = page.url
    print("interview url", interview_url, flush=True)
    state = ctx.storage_state()
    browser.close()

    # ------------------------------------------------------------ part 2: interview
    browser = launch(p, "interview.y4m")
    ctx = browser.new_context(viewport={"width": 1440, "height": 900}, permissions=["camera", "microphone"], storage_state=state)
    page = ctx.new_page()
    log_console(page)
    page.goto(interview_url)
    expect(page.get_by_role("heading", name="Get ready for your interview")).to_be_visible(timeout=30000)
    start = page.get_by_role("button", name="Start interview")
    expect(start).to_be_enabled(timeout=20000)
    page.wait_for_timeout(2500)
    shot(page, "07_setup")
    start.click()
    expect(page.get_by_text("Your interview starts in")).to_be_visible(timeout=20000)
    page.wait_for_timeout(4000)
    shot(page, "07b_countdown")
    expect(page.get_by_text("Your interview starts in")).to_be_hidden(timeout=20000)
    expect(page.get_by_text("Live gaze status")).to_be_visible(timeout=20000)
    t0 = time.time()
    seen = set()
    while time.time() - t0 < LIVE_SECONDS:
        page.wait_for_timeout(2000)
        status = page.locator("p[aria-live=polite]").first.inner_text()
        seen.add(status)
        if int(time.time() - t0) in (6, 7) and "08_live_early" not in seen:
            shot(page, "08_live_early"); seen.add("08_live_early")
        if page.get_by_text("Mobile phone detected", exact=True).count() and "09_live_alert" not in seen:
            shot(page, "09_live_alert"); seen.add("09_live_alert")
    shot(page, "10_live")
    print("gaze states seen:", sorted(s for s in seen if not s.startswith("0")), flush=True)

    page.get_by_role("button", name="End interview").click()
    shot(page, "11_end_confirm")
    page.get_by_role("dialog").get_by_role("button", name="End interview").click()
    expect(page.get_by_role("heading", name="Interview Completed")).to_be_visible(timeout=120000)
    shot(page, "12_completed")
    page.get_by_role("button", name="Generate Interview Report").click()
    expect(page.get_by_role("heading", name="Generating the interview report")).to_be_visible(timeout=30000)
    page.wait_for_timeout(4000)
    shot(page, "13_report_progress")
    expect(page.get_by_text("Interview integrity report")).to_be_visible(timeout=600000)
    page.wait_for_timeout(2500)
    shot(page, "14_report_top")
    shot(page, "15_report_full", full=True)
    for section in ["identity", "gaze", "environment", "processing"]:
        page.locator(f"#{section}").scroll_into_view_if_needed()
        page.wait_for_timeout(600)
        shot(page, f"16_report_{section}")
    page.locator("#environment button, #identity button").first.click()
    page.wait_for_timeout(800)
    shot(page, "17_evidence_modal")
    page.keyboard.press("Escape")

    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(BASE + "/dashboard")
    page.wait_for_timeout(1500)
    shot(page, "18_dashboard_mobile", full=True)
    page.goto(BASE)
    page.wait_for_timeout(1000)
    shot(page, "19_landing_mobile")
    browser.close()
    print("E2E JOURNEY PASSED", EMAIL, flush=True)
