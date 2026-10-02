# Ward management system: shift handover

Product design for a regional hospital group's ward management system: a handover screen that cleared itself, repaired in three decisions on top of a record system that could not be touched.

- Client: Regional hospital group
- Role: Product designer
- Year: 2024
- Duration: 9 weeks
- Status: Shipped

## Overview

The product is a ward management system. Charge nurses and bedside nurses use it across three shifts a day. The engagement covered shift handover, the moment one shift's nurses pass patients to the next, and the screen they use to do it. I was the product designer.

## Problem

Before every handover, nurses photographed the Ward Board. The screen cleared itself on session timeout and the Patient Notes column reset with it, so nurses had learned that the screen might not be there afterwards.

The client's report, in their words:

> "The handover screen looks cluttered and nurses find it confusing."

That is an accurate account of what the nurses experienced and a wrong account of its cause. The layout was not what sent nurses to photograph the screen — its habit of disappearing was.

Escalated patients sat wherever their bed happened to be, in a list ordered by room number, so a deteriorating patient could be anywhere in it. Escalations were passed on out loud, and skipped whenever a shift ran late.

These are one failure rather than three: the screen could not be relied on to hold what the next shift needed, so the information that mattered most travelled by photograph and by voice.

The trouble was costing the client a handover that ran fourteen minutes against a six-minute budget, three times a day, across eleven wards. I reached this diagnosis by going through the product myself.

## Approach

The patient record system was off limits, so everything had to work as a layer on top of it. I owned the interface. The clinical lead had the final call on anything touching medication fields.

Two of the three changes repair behaviour that already existed. One of those two departs deliberately from how the rest of the ward lists patients. The third adds a step that had no prior version.

## Solution

### Handover note

> "Can you make the handover screen less cluttered?"

The request read the problem as layout, and the cause lay elsewhere. Nurses photographed the screen because it cleared itself: the note vanished on session timeout, with no warning. The note now freezes at shift change, so nobody photographs the screen before handover any more. I ruled out an autosave indicator, because a reassuring spinner does not earn trust back once it is gone.

### Patient list order

Every other view on the ward lists patients by room, and this one does not. Escalated patients sat wherever their bed happened to be, so a deteriorating patient could be anywhere in the list. I broke the pattern: the list sorts by escalation, and deteriorating patients are read first, without hunting for them. Colour-coding the rows would have kept the rule and kept the scan, because the eye still has to cross the whole list to find them.

### Escalated notes

The incoming nurse cannot miss an escalation, and the outgoing nurse no longer has to say it out loud twice. Escalations were passed on out loud and skipped when a shift ran late, and nothing in the product held them. The mechanic is new:

1. The outgoing nurse marks a patient escalated.
2. The note stays pinned to the top of the incoming nurse's list.
3. It holds until the incoming nurse taps Acknowledge.

I chose a hold over a push notification, because nurses already silence those on the ward.

## Outcome

The client's request was for a less cluttered handover screen. In practice the photographs stopped within two weeks, and nobody was asked to stop.

The client said afterwards:

> "We stopped talking about the handover screen in the ops meeting."

## Credits

- Client: Regional hospital group
- Role: Product designer
- Clinical lead: Priya Raman
- Duration: 9 weeks
- Status: Shipped
