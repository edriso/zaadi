# Religious text and timing

Quran: unmodified Tanzil Uthmani 1.1 corpus, inherited from edriso/learn-tajweed via
true-muslim. SHA256 7f30c647331a61100ebf24a80507dc0fcdd9f2df97f1312b5b2dfcb982a7f326.
Keep the complete original file including its notice. The generator resolves references.
For whole short surahs the basmala prefixes need explicit handling: the original corpus
already includes them at the start of surahs 112–114. Do not prepend a second basmala.
Sources: https://tanzil.net/download/ and https://tanzil.net/docs/text_license.

Each source record stores exact text or Quran references, source URL, label, narrator,
grade and source inspection date. Each collection item defines a count only when its
contextual evidence supports it. Do not shorten a dhikr without marking it as an excerpt;
this app ordinarily displays the complete text to be recited.

Timing: default suggestions use the device clock and explicitly say they are approximate.
City selection enables local calculations using Adhan.js, with a selectable method and
Asr convention. Fajr–Dhuhr suggests morning, Asr–Isha suggests evening; other times
suggest general remembrance. These are product routing windows, not claims that reading
outside them is invalid. Never automatically choose after-prayer or bedtime based on
clock time alone. Manual selection is always available.

Ibn Baz describes flexibility in morning/evening remembrance timing:
https://binbaz.org.sa/fatwas/9949/وقت-اداء-اذكار-الصباح-والمساء
Calculation documentation: https://github.com/batoulapps/adhan-js/blob/master/METHODS.md

Locations are optional and stored on the device only. A chosen city supplies coordinates
and its IANA timezone; calculations use the city's calendar date, not an assumed device
calendar date. Invalid/high-latitude solar events trigger a labelled approximate fallback.
Counts are a reading aid, not a record of spiritual achievement or proof of recitation.
