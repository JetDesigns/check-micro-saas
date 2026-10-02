# Ward management system: shift handover

Rebuilding shift handover for a hospital ward system: one complaint about clutter, three changes to how the handover list holds, orders and escalates notes.

- Client: A regional hospital group
- Role: Product designer
- Year: 2024
- Duration: 9 weeks
- Status: Shipped

## Overview

The product is a ward management system. Charge nurses and bedside nurses use it across three shifts a day, and it belongs to a regional hospital group. I was the product designer for shift handover, the moment one shift's nurses pass a ward's patients to the next.

## Problem

Before every handover, nurses photographed the Ward Board. The screen cleared itself on session timeout, and the Patient Notes column reset with it. Nurses had learned that if they did not photograph it, nothing might be there afterwards.

The client described the problem like this:

> The handover screen looks cluttered and nurses find it confusing.

That is an accurate account of the experience and a wrong account of the cause. Clutter is a fault of layout. The evidence points at behaviour: what the screen kept, in what order it listed patients, and whether an escalation reached the next nurse.

I reached this diagnosis by going through the product myself. Escalated patients sat wherever their bed happened to be in the list, mixed in with everyone else. Escalations were passed on out loud, and skipped whenever a shift ran late. Nothing on the screen could be relied on at the point of handover, so nurses made their own backup and the most important information travelled by voice.

Handover ran fourteen minutes against a six-minute budget, three times a day, across eleven wards. That is nurse time over budget at every shift change in every ward.

## Approach

The patient record system was off limits, so everything had to work as a layer on top of it.

The three changes are different in kind, not just in number. One repairs behaviour that already existed, the note that cleared itself. One breaks a convention that every other view on the ward follows. One has no earlier version at all. The third cannot be understood without the first.

I owned the interface. The clinical lead had the final call on anything touching medication fields.

## Solution

### Patient Notes column

The client asked for this fix in these words:

> "Can you make the handover screen less cluttered?"

The request was about clutter. The pain point behind it was that nurses photographed the screen because it cleared itself. The note used to clear on session timeout, with no warning, and the Patient Notes column went with it. I made it freeze at shift change, so the note is still there when the next shift reads it.

I did not add an autosave indicator. A reassuring spinner does not earn trust back once it is gone. Nurses no longer have to photograph the screen before handover.

### Handover list

Every other view on the ward lists patients by room. The handover list does not: it sorts by escalation. That is a decision, not an accident.

The list used to be ordered by room number, which left deteriorating patients scattered through it, each wherever their bed happened to be. Colour-coding the rows was the alternative, and it leaves the eye scanning the whole list to find them. Following the room-order rule would have cost the list its ability to put deteriorating patients first. They are now read first, without hunting for them.

### Escalated notes

The incoming nurse cannot miss an escalation, and the outgoing nurse no longer has to say it out loud twice. This behaviour is new, with no earlier version to compare it to, and it builds on the frozen note above:

1. The outgoing nurse marks a patient escalated.
2. The note stays pinned to the top of the incoming nurse's list.
3. It holds until the incoming nurse taps Acknowledge.

Escalations were the one thing handed over verbally, and the verbal version was the one that got skipped when a shift ran late. That is the gap this closes. I did not use a push notification, because nurses already silence them on the ward.

## Outcome

The brief, as the client put it, was a handover screen that looked less cluttered. What changed is how the team works: the photographs stopped within two weeks. Nobody was asked to stop.

Afterwards the client said:

> "We stopped talking about the handover screen in the ops meeting."

## Credits

- Client: A regional hospital group
- Role: Product designer
- Clinical lead: Priya Raman
- Duration: 9 weeks
- Status: Shipped
