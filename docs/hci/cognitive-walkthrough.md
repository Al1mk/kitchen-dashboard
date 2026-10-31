# Cognitive walkthrough — T18 template, T23 answers

Course p.129, three questions per step: (1) Will the user know which action is right? (2) Can they find/recognize it? (3) Does the feedback show that it worked? Answers are **evaluator judgments**, not user results.

| Flow / step | Q1 right action clear? | Q2 action findable? | Q3 feedback sufficient? | Issue → finding ID |
| --- | --- | --- | --- | --- |
| U2/U3: Start → find K1-120 | Yes: "Karte" tile and "Räume auf dem Stockwerksplan finden" | Yes on start page; search field visible on map | Search for "K1-120" auto-selects the room, switches floor and fills the details panel | — |
| Map → "Termine in diesem Raum" | Probably: link sits in the details panel below the plan | At 540 px the details panel is below the plan (scroll needed) | Schedule header names the room; "Auf der Karte" returns | HE-03 |
| Schedule → booking | Unclear: the schedule page has no booking link; user must go back to the map or room list | Not directly | — | **CW-01** (severity 2): add "Diesen Raum reservieren" to the room header of `/schedule` when the room is reservable |
| Booking: room, date, duration, time | Numbered steps 1–4 guide order | Yes; disabled confirm button explains "Wähle zuerst einen Raum." | Selected time turns red; review step repeats room/date/time | HE-05 |
| Confirm → receipt | Yes: "Demo-Reservierung bestätigen" | Yes | Pending text, then green "Reservierung gespeichert"; countdown visible | HE-06 |
| U4: find cancellation later | Moderate: "Reservierung stornieren" at the end of the booking page; not on the start page | Requires going to Raumbuchung first | Success message; fields kept on error | — |
| U6 Katja: class conflicts with booking | Message names the demo booking and says it is not cancelled automatically | Link "Reservierungen … ansehen (neuer Tab)" | List shows "Storniert" after confirmation; retry saves | New tab may be unexpected → observe |
