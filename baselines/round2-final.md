# Ward management system: shift handover

Repairing shift handover in a ward management system, as a layer over a patient record system that could not be changed.

- Client: A regional hospital group
- Role: Product designer
- Year: 2024
- Duration: 9 weeks
- Status: Shipped

## Overview

The product is a ward management system used by charge nurses and bedside nurses across three shifts a day. The client is a regional hospital group. I was the product designer, and the engagement covered shift handover.

## Problem

Before every handover, nurses photographed the Ward Board. The screen cleared itself on session timeout, and a nurse who had learned it might not be there afterwards took the picture first.

The Patient Notes column reset with it. The list was ordered by room number, so escalated patients sat wherever their bed happened to be. Escalations were passed on out loud, and skipped whenever a shift ran late.

The client described the trouble this way:

> The handover screen looks cluttered and nurses find it confusing.

That is an accurate account of what the nurses experienced. It points at the wrong cause, because it is about how the screen looked and the evidence is about what the screen did. A cluttered screen would not explain the photographs. A screen that empties itself does.

Handover depended on a screen that could not be trusted to hold its contents or to put urgent patients first, so the real work moved to a camera and to speech, outside the product. Handover ran fourteen minutes against a six-minute budget, three times a day, across eleven wards. I reached this by going through the product myself.

## Approach

The patient record system was off limits, so all three fixes work as a layer on top of it. I owned the interface. The clinical lead had the final call on anything touching medication fields.

The three decisions differ in kind rather than in size. Two change something that already existed: the note that cleared, and the list ordered by room. Of those two, only the sort order departs from a convention the rest of the ward follows. The third has no precedent. The held escalation builds on the frozen note from the first fix, which is why the first fix has to be understood before it.

## Solution

### Patient Notes at shift change

The client's request for this fix read:

> Can you make the handover screen less cluttered?

Nurses photographed the screen because it cleared itself. The Patient Notes column went with it on session timeout, with no warning. Now the note holds at shift change instead of clearing.

I froze the note rather than add an autosave indicator. A reassuring spinner does not earn trust back once it is gone, and these nurses had already learned the screen might not be there afterwards. Nobody photographs the screen before handover any more.

### Patient list order

Every other view on the ward lists patients by room, and this list does not. It sorts by escalation. Escalated patients sat wherever their bed happened to be, scattered through a list ordered by room number.

Following the room-order rule would have meant colour-coding the rows, which I considered. The eye still has to scan the whole list to find them, so finding a deteriorating patient would stay a search. Sorting by escalation puts them first, and they are read first without hunting for them.

### Escalated notes and Acknowledge

The incoming nurse cannot miss an escalation, and the outgoing nurse no longer has to say it out loud twice. Escalations were passed on out loud and skipped whenever a shift ran late. Nothing like this existed before, so it works in three beats:

1. The outgoing nurse marks a patient escalated.
2. The note stays pinned to the top of the incoming nurse's list.
3. It holds until the incoming nurse taps Acknowledge.

Escalations were the one thing handed over verbally, and the verbal version was the one that got skipped when a shift ran late. I ruled out a push notification, because nurses already silence them on the ward.

## Outcome

The brief was a less cluttered handover screen. What changed was behaviour on the ward: the photographs stopped within two weeks, and nobody was asked to stop.

The client's report afterwards:

> We stopped talking about the handover screen in the ops meeting.

## Credits

- Client: A regional hospital group
- Role: Product designer
- Clinical lead: Priya Raman
- Duration: 9 weeks
- Year: 2024
