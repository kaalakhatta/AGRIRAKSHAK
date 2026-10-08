# Device QA Test Plan

## Overview
This test plan covers the device, browser, accessibility, privacy, backup, failure, offline capability, and storage QA execution using synthetic records for the M5 exhibition build.

## D1: Device/Browser and Accessibility Tests
- Identify build/commit/schema, device/browser versions, viewport, network, and synthetic fixture IDs for every run.
- Test screens: Today, Plan, Scan, Records, My Farm.
- Test responsive layout, keyboard/focus, labels/errors, zoom, and available screen-reader behavior.
- Document results as not-run/pass/fail/blocked.

## D2: Privacy, Backup, and Failure Journeys
- Location: Denied/manual/skip/revoke tests.
- Camera: Test separately from location permissions.
- Missing/stale weather and provider/network failure isolation.
- Unavailable model behavior.
- Validate unsupported/uncertain results only with actual fixtures.
- Test invalid/large/empty file uploads.
- Reload persistence.
- Backup: download, import, conflict resolution.
- Deletion confirmation and storage failure.
- Offline behavior tests on a build that implements it.
- Use only synthetic records for tests. No real farmer data.
