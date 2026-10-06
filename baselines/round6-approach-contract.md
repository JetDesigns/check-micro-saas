# Shift handover on a ward management system

Diagnosing why nurses photographed the Ward Board, then repairing handover as a layer over a patient record system that could not be touched.

- Client: A regional hospital group
- Role: Product designer
- Year: 2024
- Duration: 9 weeks
- Status: Shipped

## Overview

A ward management system used by charge nurses and bedside nurses across three shifts a day, at a regional hospital group. The engagement covered shift handover: what the incoming nurse sees at the change of shift, and how escalated patients are passed from one nurse to the next. I was the product designer, working with a clinical lead.

## Problem

Nurses photographed the Ward Board before every handover, because they had learned it might not be there afterwards. The screen cleared itself on session timeout, and the Patient Notes column reset with it.

The client's report, in their words:

> The handover screen looks cluttered and nurses find it confusing.

That is an accurate account of what the screen was like to use. It places the cause in how the screen looks, where the evidence places it in what the screen does. Nurses photographed the screen because it cleared itself. Escalated patients sat wherever their bed happened to be in a list ordered by room number, and escalations were passed on out loud and skipped whenever a shift ran late.

This was a failure of reliability and of priority, not of density: the screen could not be trusted to hold what it showed, and it left the order of urgency to chance and a spoken sentence.

I reached the diagnosis by going through the product myself. Handover ran fourteen minutes against a six-minute budget, three times a day, across eleven wards.

## Approach

The patient record system was off limits, so everything had to work as a layer on top of it. Each fix lives in the interface the nurses use, not in the record underneath.

The three fixes are not peers. Two change something that already existed: the note's behaviour at session timeout, and the order of the patient list. The third has no precedent, and it depends on the first. Of the two that changed existing behaviour, the list order is the one that breaks a convention, since every other view on the ward lists patients by room.

I owned the interface. The clinical lead had the final call on anything touching medication fields.

## Solution

### Patient Notes at session timeout

> Can you make the handover screen less cluttered?

That request explains why the work began, not what form the fix took. The note in the Patient Notes column cleared on session timeout with no warning, and nurses photographed the screen because it cleared itself.

The note now freezes at shift change, so nobody photographs the screen before handover any more. I weighed an autosave indicator and set it aside: a reassuring spinner does not earn trust back once it is gone, and nurses had already learned the screen might not be there afterwards.

### Patient list order

Every other view on the ward lists patients by room. This one does not, and that is a decision: the list sorts by escalation. Escalated patients sat wherever their bed happened to be in a list ordered by room number.

Consistency with room order would have meant every handover begins with a scan of the whole list for the deteriorating patients. Colour-coding the rows, which I considered, leaves that scan in place, because the eye still has to cover every row to find them. Deteriorating patients are now read first, without hunting for them.

### Escalated notes at handover

The incoming nurse cannot miss an escalation. This is new, and it depends on the first fix, the frozen note. Before it, escalations were passed on out loud and skipped when a shift ran late.

1. The outgoing nurse marks a patient escalated.
2. The note stays pinned to the top of the incoming nurse's list.
3. It holds until the incoming nurse taps Acknowledge.

The outgoing nurse no longer has to say it out loud twice. Escalations were the one thing handed over verbally, and the verbal version was the one that got skipped. I considered a push notification and dropped it, because nurses already silence them on the ward.

## Outcome

The client's starting request was a less cluttered handover screen. What changed is in what nurses do: the photographs stopped within two weeks, and nobody was asked to stop. The incoming nurse cannot miss an escalation, and the outgoing nurse no longer says it out loud twice.

The client reported afterwards:

> We stopped talking about the handover screen in the ops meeting.

## Credits

- Client: A regional hospital group
- Role: Product designer
- Clinical lead: Priya Raman
- Duration: 9 weeks
