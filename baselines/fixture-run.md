# Ward management system: shift handover

Repairing the handover screen of a ward management system, with three fixes built as a layer on top of a patient record system that was off limits.

- Client: A regional hospital group
- Role: Product designer
- Year: 2024
- Duration: 9 weeks
- Status: Shipped

## Overview

The product is a ward management system. Charge nurses and bedside nurses use it across three shifts a day. The client is a regional hospital group, and I was the product designer on shift handover, the moment the system has to carry one shift's knowledge of the ward to the next.

## Problem

Before every handover, nurses photographed the Ward Board. The screen cleared itself on session timeout and the Patient Notes column reset with it, so a nurse who needed the notes at the end of a shift had learned to keep a copy.

The client described the problem this way:

> The handover screen looks cluttered and nurses find it confusing.

That is an accurate account of what the screen was like to use, and an inaccurate account of why. The screen was not failing on how much it showed. It failed on whether it held what it showed, and on whether the patients who mattered were seen first. Escalated patients sat wherever their bed happened to be in a list ordered by room number. Escalations themselves were passed on out loud, and skipped whenever a shift ran late.

I reached this diagnosis by going through the product myself.

Handover ran fourteen minutes against a six-minute budget, three times a day, across eleven wards.

## Approach

The patient record system was off limits, so everything had to work as a layer on top of it. That set the edge of the work: what the handover screen held, how it ordered patients, and what it did with escalations.

I owned the interface. Priya Raman, the clinical lead, had the final call on anything touching medication fields.

Two of the three fixes changed behaviour that already existed. The third had no prior version at all, and it depends on the first.

## Solution

### Patient Notes at shift change

The client's request for this screen was:

> Can you make the handover screen less cluttered?

A request explains why the work happened, not why the fix took this form. The note cleared on session timeout with no warning, and nurses photographed the screen before every handover because they had learned it might not be there afterwards. I made the note freeze at shift change instead. This answers the first problem named above: nurses photographed the screen because it cleared itself.

I considered an autosave indicator and dropped it. A reassuring spinner does not earn trust back once it is gone. With the note frozen, a nurse no longer has to photograph the screen before handover.

### Handover list

Every other view on the ward lists patients by room. The handover list does not: I sorted it by escalation. It had been ordered by room number, which left escalated patients wherever their bed happened to be, and that is the second problem named above.

Following the ward's convention would have kept deteriorating patients scattered through the list. Colour-coding the rows, the alternative I weighed, still leaves the eye scanning the whole list to find them. Sorted by escalation, deteriorating patients are read first, without hunting for them.

### Escalated notes

The incoming nurse cannot miss an escalation, and the outgoing nurse no longer has to say it out loud twice. Escalations were the one thing handed over verbally, and the verbal version was the one that got skipped when a shift ran late. That is the third problem named above, and this fix had no prior version to edit. It works in three beats:

1. The outgoing nurse marks a patient escalated.
2. The note stays pinned to the top of the incoming nurse's list.
3. It holds until the incoming nurse taps Acknowledge.

I considered a push notification. Nurses already silence them on the ward, so it would have reached the people most likely to dismiss it. This fix depends on the first, where the note stopped clearing itself.

## Outcome

The brief was a handover screen that looked less cluttered. What changed is that the photographs stopped within two weeks, and nobody was asked to stop. Escalations are no longer passed on out loud twice.

The client said afterwards:

> We stopped talking about the handover screen in the ops meeting.

## Credits

- Client: A regional hospital group
- Role: Product designer
- Clinical lead: Priya Raman
- Duration: 9 weeks
- Status: Shipped
