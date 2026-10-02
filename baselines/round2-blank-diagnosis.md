# Shift handover for a hospital ward

Repairing the handover screen in a ward management system: three fixes to a screen reported as cluttered, built as a layer over a patient record system that could not be touched.

- Client: A regional hospital group
- Role: Product designer
- Year: 2024
- Duration: 9 weeks
- Status: Shipped

## Overview

The product is a ward management system. Charge nurses and bedside nurses use it across three shifts a day, and it belongs to a regional hospital group. The engagement covered the handover screen, where one shift passes its patients to the next. I was the product designer, working with a clinical lead, Priya Raman.

## Problem

Before every handover, nurses photographed the screen. They did it because they had learned the note might not be there afterwards.

The client's account of the trouble was this:

> The handover screen looks cluttered and nurses find it confusing.

Nurses did find it confusing, and the report describes that experience accurately. The cause was somewhere other than density. I found three places where the screen could not be relied on. The note cleared on session timeout, with no warning. The list was ordered by room number, so escalated patients sat wherever their bed happened to be. Escalations were passed on out loud and skipped when a shift ran late.

The screen did not fail by showing too much. It failed by being something nurses could not rely on, so the work of handover moved off it, into photographs, into searching the list and into speech. The diagnosis comes from going through the product myself.

The cost to the client: handover ran fourteen minutes against a six-minute budget, three times a day, across eleven wards.

## Approach

The patient record system was off limits, so everything had to work as a layer on top of it. Each fix had to be solved in the interface.

The three fixes differ in kind. Two repair behaviour the screen already had, the note that cleared itself and the list ordered by room. The third, holding escalated notes, had no prior version to start from. The third also depends on the first. The second is the one fix that departs from a convention the rest of the ward follows.

I owned the interface. Priya Raman, the clinical lead, had the final call on anything touching medication fields.

## Solution

### Handover note

Before, the note cleared on session timeout, with no warning. Now it freezes at shift change. Nurses photographed the screen before every handover because it cleared itself.

The client's request that prompted this fix:

> "Can you make the handover screen less cluttered?"

I considered an autosave indicator and rejected it. A reassuring spinner does not earn trust back once it is gone. With a note that holds, a nurse no longer has to photograph the screen before handover.

### Patient list order

Every other view on the ward lists patients by room, and the handover list does not. It sorts by escalation. The list used to be ordered by room number like the rest. Escalated patients sat wherever their bed happened to be.

Keeping room order would have meant keeping the search, because a nurse could find a deteriorating patient only by reading down the whole list. Colour-coding the rows was the alternative, and it leaves the eye the same scan to do. Sorted by escalation, deteriorating patients are read first, without hunting for them.

### Escalated notes

The incoming nurse cannot miss an escalation, and the outgoing nurse no longer has to say it out loud twice. Nothing like this existed before. Escalations were passed on out loud, and skipped when a shift ran late.

1. The outgoing nurse marks a patient escalated.
2. The note stays pinned to the top of the incoming nurse's list.
3. It holds until the incoming nurse taps Acknowledge.

This fix depends on the first and should be read after it. I considered a push notification and dropped it, because nurses already silence them on the ward.

## Outcome

The client's goal at the outset was a handover screen that was less cluttered and less confusing for nurses.

What changed is where the work of handover happens. The photographs stopped within two weeks, and nobody was asked to stop. An incoming nurse can no longer miss an escalation, and the outgoing nurse no longer says it out loud twice.

The client's account afterwards:

> "We stopped talking about the handover screen in the ops meeting."

## Credits

- Client: A regional hospital group
- Role: Product designer
- Collaborator: Priya Raman, clinical lead
- Duration: 9 weeks
- Status: Shipped
