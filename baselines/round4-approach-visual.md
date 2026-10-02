# Ward handover

A handover screen that nurses photographed before every shift change, repaired with three changes layered over a patient record system that was off limits.

- Client: A regional hospital group
- Role: Product designer
- Year: 2024
- Duration: 9 weeks
- Status: Shipped

## Overview

The product is a ward management system. Charge nurses and bedside nurses use it across three shifts a day, and the handover screen is where one shift passes the ward to the next. The client is a regional hospital group, and the engagement covered that screen and what nurses did around it. I was the product designer, working with Priya Raman, the clinical lead.

## Problem

Before every handover, nurses photographed the Ward Board. The screen cleared itself on session timeout and the Patient Notes column reset with it, so a photograph was the one copy nurses could count on keeping. Escalated patients sat wherever their bed happened to be in a list ordered by room number. Escalations were passed on out loud, and skipped whenever a shift ran late.

The client described it differently:

> The handover screen looks cluttered and nurses find it confusing.

That is an accurate account of what a nurse experienced and the wrong account of the cause. It pointed at how the screen looked; the evidence points at how it behaved — a screen that could not be trusted to still be there, a list that scattered deteriorating patients through it, and an escalation step that lived outside the product. A screen that has to be photographed before it is used is one its users no longer trust to hold. I reached this by going through the product myself.

Handover ran fourteen minutes against a six-minute budget, three times a day, across eleven wards.

## Approach

Everything had to work as a layer on top of the patient record system, which was off limits. I owned the interface. Priya Raman, the clinical lead, had the final call on anything touching medication fields.

The three changes are not equals. Two of them repair behaviour the screen already had: what happened on a timeout, and how the list was ordered. The third has no earlier version to repair, and it depends on the first, because a note pinned to a screen that clears itself would hold nothing. The ordering change is the one that departs from how the rest of the ward lists patients.

## Solution

### Handover note

> Can you make the handover screen less cluttered?

The note cleared on session timeout with no warning, so nobody could tell when it would be gone. Nurses photographed the screen because it cleared itself.

The note now freezes at shift change. A nurse no longer has to photograph the Ward Board before handover to be sure of having it.

An autosave indicator was the other option, and I set it aside. A reassuring spinner does not earn trust back once it is gone, and the trust had already gone: nurses had learned the screen might not be there afterwards.

### Patient list order

Every other view on the ward lists patients by room. This one sorts by escalation instead. Escalated patients sat wherever their bed happened to be, which is what a room-ordered list does to them.

Keeping room order here would have kept the answer the handover most needs, which patients are deteriorating, behind a scan of the whole list. Deteriorating patients are now read first, without hunting for them. I also considered colour-coding the rows, but the eye still has to travel the full list to find them.

### Escalated notes

The incoming nurse cannot miss an escalation, and the outgoing nurse no longer has to say it out loud twice. Escalations were passed on out loud and skipped when a shift ran late.

1. The outgoing nurse marks a patient escalated.
2. The note stays pinned to the top of the incoming nurse's list.
3. It holds until the incoming nurse taps Acknowledge.

Escalations were the one thing handed over verbally, and the verbal version was the one that got skipped. This change rests on the frozen note above. I set a push notification aside, because nurses already silence them on the ward. The pinned note leaves only when the incoming nurse acknowledges it.

## Outcome

The client began with a request for a less cluttered handover screen. The photographs stopped within two weeks, and nobody was asked to stop.

Afterwards the client said:

> We stopped talking about the handover screen in the ops meeting.

## Credits

- Client: A regional hospital group
- Role: Product designer
- Collaborator: Priya Raman, Clinical lead
- Duration: 9 weeks
- Status: Shipped
