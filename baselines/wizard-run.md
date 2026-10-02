# Shift handover, ward management system

Shift handover on a hospital ward management system: a clutter complaint traced to a screen that cleared itself, repaired in three decisions as a layer over a record system that was off limits.

- Client: A regional hospital group
- Role: Product designer
- Year: 2024
- Duration: 9 weeks
- Status: Shipped

## Overview

The product is a ward management system used by charge nurses and bedside nurses across three shifts a day. The client is a regional hospital group. The engagement covered the shift handover screen, and I worked on it as product designer alongside a clinical lead.

## Problem

Before every handover, nurses photographed the Ward Board. The screen cleared itself on session timeout, and the Patient Notes column reset with it. Escalated patients sat wherever their bed happened to be in the list, which was ordered by room. Escalations were passed on out loud, and skipped whenever a shift ran late.

I found this by going through the product myself. The client's report, in their words:

> The handover screen looks cluttered and nurses find it confusing.

That is an accurate account of an experience and an inaccurate account of its cause. The report points at layout. The evidence points at behaviour: a screen that discarded its notes without warning, a list that scattered the patients who mattered most, and an escalation step that lived only in speech.

All three say the same thing. The handover was being carried out around the screen, in photographs and out loud, rather than on it. It ran fourteen minutes against a six-minute budget, three times a day, across eleven wards, and the escalations were the part skipped whenever a shift ran late.

## Approach

The patient record system was off limits, so everything had to work as a layer on top of it. Each decision is therefore a change to what the handover screen shows, keeps and asks of the nurse, and none of them touches what the record stores.

I owned the interface. The clinical lead had the final call on anything touching medication fields. The third decision depends on the first.

## Solution

### Patient Notes column

The client's request was:

> "Can you make the handover screen less cluttered?"

The request explains why the work began. The evidence decided what to change. Before, the note cleared on session timeout, with no warning, and nurses had learned it might not be there afterwards. That is why they photographed the Ward Board before every handover. This is the photographing described in Problem.

I froze the note at shift change. Nobody photographs the screen before handover any more. I considered an autosave indicator and dropped it: a reassuring spinner does not earn trust back once it is gone.

### Patient list order

Every other view on the ward lists patients by room, and the handover view does not. I made that break on purpose. The list used to be ordered by room number, so deteriorating patients were scattered through it at whatever position their bed happened to occupy. This is the scattering of escalated patients described in Problem.

Escalated patients now lead the list, and deteriorating patients are read first, without hunting for them. Keeping room order would have meant keeping the hunt, with the incoming nurse scanning the whole list to find them. I considered colour-coding the rows instead, but the eye still has to scan the whole list.

### Escalated notes and Acknowledge

The incoming nurse cannot miss an escalation, and the outgoing nurse no longer has to say it out loud twice. Nothing like this existed before. Escalations were the one thing handed over verbally, and the verbal version was the one that got skipped when a shift ran late. This is the spoken escalation described in Problem, and it builds on the first fix.

1. The outgoing nurse marks a patient escalated.
2. The note stays pinned to the top of the incoming nurse's list.
3. It holds until the incoming nurse taps Acknowledge.

I considered a push notification and ruled it out: nurses already silence them on the ward.

## Outcome

The brief was a handover screen that looked cluttered and left nurses confused. The photographs stopped within two weeks. Nobody was asked to stop.

The client said afterwards:

> "We stopped talking about the handover screen in the ops meeting."

## Credits

- Client: A regional hospital group
- Role: Product designer
- Clinical lead: Priya Raman
- Duration: 9 weeks
- Status: Shipped
