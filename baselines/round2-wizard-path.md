# Ward management system: shift handover

Repairing shift handover in a ward management system: a clutter complaint traced to how the screen behaved, and three changes to how notes persist, sort and are acknowledged.

- Client: A regional hospital group
- Role: Product designer
- Year: 2024
- Duration: 9 weeks
- Status: Shipped

## Overview

The product is a ward management system used by charge nurses and bedside nurses across three shifts a day, at a regional hospital group. The engagement covered shift handover: the handover screen and the Patient Notes column on it. I was the product designer, working with Priya Raman, the clinical lead.

## Problem

Before every handover, nurses photographed the Ward Board. I found that by going through the product myself, and it explained more about the screen than its appearance did.

The client's account of the problem was this:

> The handover screen looks cluttered and nurses find it confusing.

That is an accurate report of what a nurse experienced and the wrong account of its cause. The screen was not failing on layout. It cleared itself on session timeout, and the Patient Notes column reset with it, so nurses photographed the Ward Board to keep what the screen might not hold. The list was ordered by room number, which left escalated patients wherever their bed happened to be. Escalations were passed on out loud, and skipped whenever a shift ran late.

A screen that cannot be trusted to hold a handover pushes the handover onto phones and voices. What it was costing the client: handover ran fourteen minutes against a six-minute budget, three times a day, across eleven wards.

## Approach

The patient record system was off limits, so everything had to work as a layer on top of it. I owned the interface. Priya Raman, the clinical lead, had the final call on anything touching medication fields.

The three changes differ in kind, not in size. The first repairs how an existing note behaves. The second reorders an existing list and breaks the ward's habit of listing patients by room. The third has no precedent in the product and cannot be understood without the first.

## Solution

### Handover note

> Can you make the handover screen less cluttered?

That was the client's request for this screen. The note in the Patient Notes column cleared on session timeout, with no warning, and nurses had learned it might not be there afterwards. It now freezes at shift change.

I considered an autosave indicator and rejected it, because a reassuring spinner does not earn trust back once it is gone. Nobody photographs the screen before handover any more. Nurses photographed the screen because it cleared itself, and a note that holds removes the reason to.

### Patient list order

Every other view on the ward lists patients by room, and the handover list no longer does. That is a decision, not an oversight. The list used to be ordered by room number, so deteriorating patients were scattered through it by where their bed happened to be. It now sorts by escalation.

Colour-coding the rows would have kept the rule and lost the answer: the eye still has to scan the whole list to find the patients who matter. Breaking the rule costs the handover list its resemblance to every other view. A nurse no longer hunts for deteriorating patients, because they are read first. Escalated patients sat wherever their bed happened to be in the list; they now lead it.

### Escalated notes

An incoming nurse cannot now miss an escalation, and the outgoing nurse no longer has to say it out loud twice. This did not exist before, and it builds on the frozen note.

1. The outgoing nurse marks a patient escalated.
2. The note stays pinned to the top of the incoming nurse's list.
3. It holds until the incoming nurse taps Acknowledge.

Escalations were the one thing handed over verbally, and that was the version that got skipped. I considered a push notification and dropped it, because nurses already silence them on the ward. Escalations passed on out loud were skipped whenever a shift ran late; the hold takes them off the spoken handover.

## Outcome

The brief was a handover screen that looked less cluttered and that nurses found less confusing. What changed is in what nurses do. The photographs stopped within two weeks, and nobody was asked to stop.

The client said afterwards:

> We stopped talking about the handover screen in the ops meeting.

## Credits

- Client: A regional hospital group
- Role: Product designer
- Clinical lead: Priya Raman
- Duration: 9 weeks
