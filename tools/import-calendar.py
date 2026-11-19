#!/usr/bin/env python3
"""Fetch Flatcar's public Google Calendar and write Hugo data/calendar.yaml.

Mirrors the Flux website approach (build-time iCal import) so the site can
render an upcoming-meetings list with localized times.
"""

from __future__ import annotations

import os
import re
import sys
from datetime import date, datetime, timedelta

from icalendar import Calendar
import pytz
import recurring_ical_events
import urllib3
import yaml

CAL_URL = (
    "https://calendar.google.com/calendar/ical/"
    "c_ii991mqrpta9en8o7ofd4v19g4%40group.calendar.google.com/public/basic.ics"
)

TOP_LEVEL_DIR = os.path.realpath(os.path.join(os.path.dirname(__file__), ".."))
CALENDAR_YAML = os.path.join(TOP_LEVEL_DIR, "data", "calendar.yaml")

URL_RE = re.compile(
    r"((https?):((//)|(\\\\))+[\w\d:#@%/;$()~_?\+-=\\\.&]*)",
    re.MULTILINE | re.UNICODE,
)
DOUBLE_URL_RE = re.compile(
    r"((https?):((//)|(\\\\))+[\w\d:#@%/;$()~_?\+-=\\\.&]*)"
    r"(\s\(\s((https?):((//)|(\\\\))+[\w\d:#@%/;$()~_?\+-=\\\.&]*)\s\))",
    re.MULTILINE | re.UNICODE,
)


def replace_url_to_link(value: str) -> str:
    return URL_RE.sub(r'<a href="\1">\1</a>', value)


def fix_double_url(text: str) -> str:
    return DOUBLE_URL_RE.sub(r"\1", text)


def prepare_description(raw) -> str:
    if not raw:
        return ""
    text = fix_double_url(str(raw))
    # Google Calendar often embeds HTML anchors already; only linkify bare URLs.
    if "<a " in text.lower():
        return text
    return replace_url_to_link(text)


def download_calendar() -> bytes | None:
    http = urllib3.PoolManager()
    r = http.request("GET", CAL_URL)
    if r.status != 200:
        print(
            f"Error retrieving calendar. Status: {r.status}, "
            f"Body: {r.data.decode(errors='replace')[:500]}",
            file=sys.stderr,
        )
        return None
    return r.data


def read_organizer(event) -> dict:
    if "organizer" not in event:
        return {}
    organizer = event["organizer"]
    email = organizer.title().split(":")[1].lower()
    name = email
    if "cn" in organizer.params:
        name = organizer.params["cn"]
    return {"org_name": name, "org_email": email}


def format_location_html(location: str) -> str:
    html = location.strip()
    if not html:
        return ""
    if html.startswith("http://") or html.startswith("https://"):
        return f'<a href="{html}">{html}</a>'
    return html


def read_calendar(cal: bytes) -> list[dict]:
    events = []
    gcal = Calendar.from_ical(cal)
    today = date.today()
    now = datetime.now()
    hour_ago = now - timedelta(minutes=50)
    next_month = today + timedelta(days=30)

    for event in recurring_ical_events.of(gcal).between(hour_ago, next_month):
        description = prepare_description(event.get("description"))

        if type(event["dtstart"].dt) is date:
            event_time = datetime.combine(
                event["dtstart"].dt, datetime.min.time()
            ).astimezone(pytz.utc)
        else:
            event_time = event["dtstart"].dt.astimezone(pytz.utc)

        location = ""
        if "location" in event:
            location = str(event["location"]).strip()

        formatted_event = {
            "date": event_time.strftime("%Y-%m-%d"),
            "time": event_time.strftime("%H:%M"),
            "timestamp": event_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "label": str(event.get("summary", "Flatcar meeting")),
            "where": format_location_html(location),
            "description": description,
        }
        formatted_event.update(read_organizer(event))

        if event_time > pytz.utc.localize(hour_ago):
            events.append(formatted_event)

    events.sort(key=lambda e: e["timestamp"])
    return events


def write_events_yaml(events: list[dict]) -> None:
    os.makedirs(os.path.dirname(CALENDAR_YAML), exist_ok=True)
    if os.path.exists(CALENDAR_YAML):
        os.remove(CALENDAR_YAML)
    with open(CALENDAR_YAML, "w", encoding="utf-8") as stream:
        yaml.safe_dump(events, stream, sort_keys=False, allow_unicode=True)


def main() -> None:
    cal = download_calendar()
    if not cal:
        sys.exit(1)
    events = read_calendar(cal)
    write_events_yaml(events)
    print(f"Wrote {len(events)} events to {CALENDAR_YAML}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Aborted.", file=sys.stderr)
        sys.exit(1)
