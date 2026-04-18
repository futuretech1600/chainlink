#!/usr/bin/env python3
"""
Chainlink Staking Pool Monitor
================================
Watches https://staking.chain.link/ and emails you the moment
pool space opens up.

SETUP (one time):
  1. Install dependencies:
       pip install selenium webdriver-manager
  2. Fill in your Gmail credentials below.
     Use a Gmail App Password, not your regular password.
     How to get one: https://myaccount.google.com/apppasswords
  3. Run:
       python chainlink_staking_monitor.py
"""

import re
import smtplib
import time
import logging
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException

# ─────────────────────────────────────────────
#  CONFIGURATION  ← fill these in before running
# ─────────────────────────────────────────────
ALERT_EMAIL    = "mikevachss@gmail.com"       # email to notify
SENDER_EMAIL   = "your_gmail@gmail.com"       # your Gmail address
SENDER_PASSWORD = "your_app_password_here"    # Gmail App Password (not your login password)

STAKING_URL    = "https://staking.chain.link/"
CHECK_EVERY    = 300   # seconds between checks (300 = every 5 minutes)
# ─────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    handlers=[
        logging.FileHandler("staking_monitor.log"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)


# ── Email ────────────────────────────────────

def send_alert(subject: str, html_body: str) -> bool:
    """Send an HTML email via Gmail SMTP SSL."""
    try:
        msg = MIMEMultipart("alternative")
        msg["From"]    = SENDER_EMAIL
        msg["To"]      = ALERT_EMAIL
        msg["Subject"] = subject
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)

        log.info(f"Alert email sent to {ALERT_EMAIL}")
        return True
    except Exception as exc:
        log.error(f"Failed to send email: {exc}")
        return False


# ── Browser helpers ──────────────────────────

def make_driver() -> webdriver.Chrome:
    """Create a headless Chrome browser (no window pops up)."""
    options = Options()
    options.add_argument("--headless=new")          # invisible browser
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    # Pretend to be a normal browser so the site doesn't block us
    options.add_argument(
        "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )

    try:
        # Try webdriver-manager first (auto-downloads correct ChromeDriver)
        from webdriver_manager.chrome import ChromeDriverManager
        service = Service(ChromeDriverManager().install())
        return webdriver.Chrome(service=service, options=options)
    except Exception:
        # Fall back to system ChromeDriver if webdriver-manager isn't installed
        return webdriver.Chrome(options=options)


# ── Pool availability check ──────────────────

def parse_link_amount(text: str) -> float | None:
    """Extract a LINK number from a string like '22,500,000 LINK'. Returns float or None."""
    text = text.replace(",", "").replace(" ", "")
    match = re.search(r"([\d]+(?:\.\d+)?)", text)
    return float(match.group(1)) if match else None


def check_pool() -> tuple[bool | None, str]:
    """
    Load the staking page and decide if space is available.

    Returns:
        (True,  details)  – space is available, go stake!
        (False, details)  – pool is full
        (None,  details)  – couldn't determine status (error / timeout)
    """
    driver = None
    try:
        driver = make_driver()
        driver.get(STAKING_URL)

        wait = WebDriverWait(driver, 40)

        # Wait until the page body has some meaningful text
        wait.until(lambda d: len(d.find_element(By.TAG_NAME, "body").text) > 200)

        # Extra pause for React/Next.js data to finish loading from the blockchain
        time.sleep(8)

        body_text = driver.find_element(By.TAG_NAME, "body").text
        body_lower = body_text.lower()

        log.debug(f"Page text snippet: {body_text[:400]}")

        # ── Strategy 1: look for "X / Y LINK" capacity pattern ──────────
        # e.g.  "22,500,000 / 40,000,000 LINK"
        capacity_match = re.search(
            r"([\d,]+(?:\.\d+)?)\s*/\s*([\d,]+(?:\.\d+)?)\s*LINK",
            body_text,
        )
        if capacity_match:
            staked_str, max_str = capacity_match.group(1), capacity_match.group(2)
            staked = float(staked_str.replace(",", ""))
            maximum = float(max_str.replace(",", ""))
            available = maximum - staked

            if maximum > 0:
                pct_full = (staked / maximum) * 100
                detail = (
                    f"Staked: {staked_str} / {max_str} LINK  "
                    f"({pct_full:.1f}% full, {available:,.0f} LINK available)"
                )
                if available > 0:
                    log.info(f"SPACE AVAILABLE – {detail}")
                    return True, detail
                else:
                    log.info(f"Pool full – {detail}")
                    return False, detail

        # ── Strategy 2: look for explicit "full" / "open" phrases ────────
        full_phrases = ["pool full", "at capacity", "staking is closed",
                        "no space available", "pool is full", "sold out"]
        open_phrases = ["space available", "stake now", "pool is open",
                        "available space", "join the pool"]

        if any(p in body_lower for p in full_phrases):
            return False, "Page indicates pool is full"

        if any(p in body_lower for p in open_phrases):
            return True, "Page indicates staking space is available"

        # ── Strategy 3: check whether a "Stake" button is enabled ────────
        stake_buttons = driver.find_elements(
            By.XPATH,
            "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',"
            " 'abcdefghijklmnopqrstuvwxyz'), 'stake')]",
        )
        for btn in stake_buttons:
            if btn.is_enabled() and btn.is_displayed():
                aria = btn.get_attribute("aria-disabled") or ""
                disabled = btn.get_attribute("disabled")
                if not disabled and aria.lower() != "true":
                    return True, f"Stake button appears active: '{btn.text}'"

        return None, "Could not determine pool status from page content"

    except TimeoutException:
        return None, "Timed out waiting for page to load"
    except WebDriverException as exc:
        return None, f"Browser error: {exc}"
    except Exception as exc:
        log.exception("Unexpected error in check_pool()")
        return None, f"Unexpected error: {exc}"
    finally:
        if driver:
            driver.quit()


# ── Main loop ────────────────────────────────

def main():
    log.info("=" * 60)
    log.info("Chainlink Staking Pool Monitor starting")
    log.info(f"URL   : {STAKING_URL}")
    log.info(f"Alert : {ALERT_EMAIL}")
    log.info(f"Every : {CHECK_EVERY // 60} minutes")
    log.info("=" * 60)

    alert_sent   = False   # avoid spamming the same alert
    check_number = 0

    while True:
        check_number += 1
        log.info(f"--- Check #{check_number}  {datetime.now():%Y-%m-%d %H:%M:%S} ---")

        has_space, details = check_pool()

        if has_space is True:
            log.info(f"SPACE AVAILABLE! {details}")

            if not alert_sent:
                subject = "Chainlink Staking Pool Has Open Space!"
                body = f"""
<html><body>
<h2 style="color:#1a5276;">Chainlink Staking Pool Alert</h2>
<p><strong>Good news — space has opened up in the Chainlink staking pool!</strong></p>
<p>{details}</p>
<p>
  <a href="{STAKING_URL}" style="
    background:#1a5276; color:white; padding:10px 20px;
    text-decoration:none; border-radius:5px; font-size:16px;">
    Stake Now →
  </a>
</p>
<hr>
<small>Detected at {datetime.now():%Y-%m-%d %H:%M:%S} by your Chainlink monitor.</small>
</body></html>
"""
                if send_alert(subject, body):
                    alert_sent = True

        elif has_space is False:
            log.info(f"Pool is full. {details}")
            alert_sent = False  # reset so we alert again next time it opens

        else:
            log.warning(f"Status unknown: {details}")

        log.info(f"Next check in {CHECK_EVERY // 60} min. Sleeping…\n")
        time.sleep(CHECK_EVERY)


if __name__ == "__main__":
    main()
