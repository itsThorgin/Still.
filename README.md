# Still

A cozy space to listen.

Still is a small browser app that generates continuous tones, noise and music on your device. Choose a sound, adjust it and let it play. There are 20 presets, precise volume controls, listening timers, sound palettes and optional automatic music changes.

No account. No subscription. Somehow, it still makes sound.

Use stereo headphones for binaural beats. Other sounds work with speakers or headphones.

## Binaural beats and isochronic tones

**Binaural beats** send a slightly different steady tone to each ear. For example, 200 Hz in the left ear and 210 Hz in the right ear can create the perception of a 10 Hz beat. Frequency difference sets this beat rate. Use stereo headphones with mono audio turned off so each ear receives its own tone.

**Isochronic tones** use one tone that rises and falls in volume at a regular rate. A pulse rate of 10 Hz means 10 pulses per second. Both channels play the same sound, so speakers also work. Tone frequency sets the pitch. Pulse depth sets how quiet the sound becomes between pulses. Pulse softness smooths each pulse.

Both groups have five starting presets:

| Band | Binaural preset | Pulse preset | Default beat or pulse rate |
| --- | --- | --- | --- |
| Delta | Deep delta | Deep delta pulse | 2 Hz |
| Theta | Slow theta | Slow theta pulse | 6 Hz |
| Alpha | Open alpha | Soft alpha pulse | 10 Hz |
| Beta | Clear beta | Clear beta pulse | 16 Hz |
| Gamma | Low gamma | Gamma pulse | 40 Hz |

Hz means cycles per second. The band names describe rates. They do not measure your brain activity or guarantee sleep, focus or another mental state.

**Solfeggio pulse** adds nine tone pitches: 174, 285, 396, 417, 528, 639, 741, 852 and 963 Hz. Pulse rate is set separately. The themes shown beside these pitches are symbolic associations, not established health effects.

## Noise and musical sequences

| Preset | Sound | Main controls |
| --- | --- | --- |
| Warm noise | Steady noise with softened low and high frequencies | Lower and upper filter limits |
| Deep noise | Low, muffled noise | Lower and upper filter limits |
| Bright noise | Higher, thinner noise | Lower and upper filter limits |
| Gentle sequence | Soft bell-like notes | Pitch range, pace and note length |
| Soft plucks | Warm notes in short phrases | Pitch range, pace and note length |
| Slow drift | Long, overlapping notes | Pitch range, pace, note length and overlap |

The noise presets use the same generator with different starting filters. Filters reduce frequencies gradually, so some sound remains outside the selected limits.

For the sequences, pace sets how often notes start. Note length sets how long new notes last. Existing notes finish with their original pitch and length. Slow drift's overlap control allows more notes to play at the same time. At 0%, notes stay separate and the actual pace may be slower.

Each sequence also has a **Sound palette** picker:

| Preset | Familiar sound | Additional sound |
| --- | --- | --- |
| Gentle sequence | Soft bells: rounded bell tones | Crystal bells: brighter, fading overtones |
| Soft plucks | Rounded plucks: soft, simple tones | Harp plucks: richer plucked harmonics |
| Slow drift | Smooth drift: soft, steady tones | Airy drift: fuller harmonics and slow tone changes |

Choose either sound or leave **Automatic with each variation** selected. Automatic uses the seed to choose one palette for that variation. Its name appears above the controls, so you can select it yourself later. Changing the palette blends over 0.4 seconds while keeping the notes, settings and listening timer. Both sounds remain available. They use synthesis without recordings or added background noise.

## Harmonic garden

Harmonic garden generates changing music with sustained notes, plucked phrases, answering melodies, soft noise and glassy shimmer. Adjust musical pace, brightness, stereo width and the level of each layer.

**Arrangement choices** controls which arrangements the seed can select:

| Arrangement | What it uses |
| --- | --- |
| Original | The familiar score, instrument roles and levels |
| Resonant | The familiar score and roles with the resonant instrument sounds |
| Seeded ensembles | A lead and supporting instruments chosen by the seed |

Choose one arrangement, any pair, or all three. Seeded ensembles can use cello and violin registers, flute, piano, plucks, mellow brass, harp, clarinet, celesta, marimba, glass and church organ. These are synthesized instrument approximations.

**String sounds** lets the seed choose from four sounds, or lets you select one yourself:

| String sound | Character |
| --- | --- |
| Original strings | The original string tone |
| Resonant strings | The resonant string tone |
| Lyrical solo | A solo-style bowed voice |
| Soft section | A layered string-section sound |

Pairs and **All four string sounds** are also available. Each string part and register keeps its choice for the variation. **Follow arrangement** uses the familiar strings for Original and Resonant, and the earlier bowed models in Seeded ensembles. To reproduce a familiar full arrangement, choose Original or Resonant and Follow arrangement. All arrangements and all four strings are enabled by default.

During playback, the line beneath the musical influences shows the actual arrangement and string choices. Show instruments expands the lead, bass, accompaniment, answering voice and shimmer, including each part's instrument and sound colour. Mixed strings means parts or registers use different string sounds. These choices describe the whole variation; parts may enter, rest or alternate. The display follows the audio engine's handover when an arrangement changes. After stopping it shows Last played. Keep this variation reuses the current seed with your settings; New variation skips to another choice.

The church organ combines a deep 16-foot foundation, 8-foot principal and quiet 4-foot octave, with a longer damped room. It can play the lead, bass or accompaniment in Seeded ensembles. It is a small synthesis model, not a recording of a church organ.

**Automatic new variation** can change to a fresh seed after a randomized interval. It starts off. The next variation uses your selected arrangement and string choices, fading out for 12 seconds and in for 8 seconds. See **Automatic music changes** below for the interval ranges and shared controls.

Music blend controls the melody and supporting parts, including a glass lead. Shimmer blend controls only decorative glass accents. New variation changes the ensemble as well as the musical choices; Keep this variation repeats them with the same settings.

Each variation combines two musical influences. Choose the main influence or let each variation choose both:

| Influence | Musical character |
| --- | --- |
| Bach | Answering phrases |
| Mozart | Balanced melodies |
| Vivaldi | Flowing note patterns |
| Beethoven | Short rhythmic ideas that develop over time |
| Chopin | Rolling accompaniment |
| Smetana | A three-beat rhythm |
| Paganini | Short, fast runs |

Changing the influence fades into a new arrangement while the listening timer continues.

### Very high tones

The separate **Upper frequencies** layer adds very high tones. It starts at **12,000 to 20,000 Hz**, with **Upper layer blend at 3%**. Its adjustable range can cover 8,000 to 20,000 Hz, within your audio output's limits.

This layer supports high-frequency listening experiments, including personal attempts to retrain ears. **Still has not been shown to retrain hearing, restore hearing or treat tinnitus.** It is not a hearing test or a validated training programme.

**If you do not want high-pitched sounds, set Upper layer blend to 0% before selecting Start listening.** This silences the separate upper layer while the music can still play. Reset preset, or switching away and back to Harmonic garden, restores the default 3% level. Check it again before playback. If music is already playing, stop it first before switching to this preset when you want to avoid the upper layer.

Musical connection blends floating shimmer at 0% with a supporting melody at 100%. At 50%, both play. A narrow frequency range may leave fewer melody notes or silence.

Hear upper layer alone temporarily fades out the other layers without making the upper layer louder. This switch resets when the page reloads. Glassy shimmer in the Texture group has its own control and is separate from the upper layer.

Hearing and equipment affect which high tones are audible. Keep the volume low. Do not raise it to find a tone you cannot hear.

### Optional binaural layer

This layer starts off. Binaural blend controls its level. It sends 180 Hz to the left ear and 180 Hz plus your selected frequency difference to the right ear. Use stereo headphones. Rate motion can slowly vary the difference.

## Retro daydream

Retro daydream generates soft retro-style music with electronic melodies, chords, bass and optional percussion. Themes return and develop as it plays.

| Musical character | Sound |
| --- | --- |
| Peaceful village | Warm melodies |
| Dreamy exploration | Spacious sounds |
| Playful afternoon | A light rhythm |
| Meadow quest | An adventure-style melody and moving bass |
| Moonlit café | Relaxed chords and a gently swinging rhythm |
| Lantern village | Warm village phrases, answering melody and spaced chords |
| Starlight exploration | Brighter open harmony, long chords and floating replies |
| Sunny afternoon | Bouncy melody, offbeat plucks and shorter notes |
| Emerald quest | Rising adventure theme, moving bass and a quieter bridge |
| Midnight café | Warmer sixth chords, a different tune and lighter swing |

The first five characters keep their original music and sounds. The next five offer related but different melodies, rhythms, chords and arrangement sections, together with revised instruments. Their harmony and phrasing aim for a slightly lighter mood. They stay inspired by classic adventure games, with original generated melodies.

The additional instruments include revised chip-style leads, plucked and keyboard tones, soft pads, rounded bass and filtered percussion. Their music adds answering phrases, melodic turns and changes to accompaniment while keeping a clear link to the familiar character.

**Musical character** lets you choose any of the ten. **Automatic with each variation** lets the seed choose a theme family and either its familiar or companion character. The current character's name appears above the controls.

**Automatic character change**, below Musical character, can move between all ten at randomized intervals. It avoids choosing the current character again immediately and creates a fresh seed for each change. The picker and displayed name update when the new music begins. Leave it **Off** to keep the current character developing. Themes can still return as it plays.

Melody, accompaniment, bass and percussion have separate levels. Warmth softens the sound. Room and tape air adds echoes and faint noise. Pitch drift adds small, slow changes in pitch. Set these effects to 0% to remove them.

Character changes fade into a new arrangement without resetting the listening timer. This preset has no separate upper-frequency or binaural layer.

## Pure tone

Pure tone plays one steady sine tone in both channels. Set its frequency from 20 Hz to 20,000 Hz where your audio output supports it.

- **Sweep** moves from low to high. A full sweep takes 30 seconds including fades. A lower output limit makes it shorter. Stop to keep the last displayed frequency, which may be slightly behind the sound.
- **Glide up and down** starts 20% below your selected frequency, with a minimum of 20 Hz. It rises over four seconds, holds at the selected frequency for three seconds, then returns over four seconds. Including fades, one pass takes 12 seconds.

Changing the tone frequency during either pass switches to a steady tone. The listening timer may stop a pass early. These controls explore pitch; they do not measure hearing or establish a hearing-training benefit.

## Variations

Noise, sequences, Harmonic garden and Retro daydream use a seed, a number that controls their generated choices. A variation can continue until stopped, with repeating musical ideas and changing details. Harmonic garden can optionally move to new seeds at randomized intervals. Retro daydream can also change its musical character automatically.

- **New variation** chooses a new seed while keeping the current controls, volume and timer. It also works when Keep this variation is checked.
- **Keep this variation** reuses the current seed next time. Checking it does not restart or interrupt playback. Stopping and starting begins that variation again. The same seed and sound settings reproduce the same generated sequence. Automatic changes in Harmonic garden and Retro daydream continue when checked, saving each new seed as the current variation. Turn automatic changes off to stay with one seed.
- When Keep this variation is off, starting playback again or selecting another variation-based preset chooses a new seed.

The variation number is a session counter, not a track number. Keeping a variation does not freeze the music or save a position to resume later. There is no library of saved variations.

### Automatic music changes

Harmonic garden's **Automatic new variation** and Retro daydream's **Automatic character change** both start off. Choose an interval to enable them:

| Picker setting | Time before a change |
| --- | --- |
| Off | Keep the current variation or character playing |
| About 5 minutes | 3-7 minutes |
| About 10 minutes | 8-12 minutes |
| About 15 minutes | 12-18 minutes |
| About 30 minutes | 25-35 minutes |
| About 60 minutes | 50-70 minutes |

Each change fades the full mix linearly to silence over **12 seconds**, starts the new music at its opening, then fades in linearly over **8 seconds**. There is no added silent pause. A fresh randomized countdown begins when the new music starts. Your master volume, mute, layer levels and listening timer stay in place.

Changing the interval restarts its countdown. Manually choosing a Retro character also restarts it. Level edits keep it. Turning automatic changes off during a fade lets that transition finish once, then keeps playing the resulting music. New variation or restarting playback begins a fresh countdown. Manual Retro character changes use their shorter fades; a choice made during an automatic fade-out becomes that fade's destination.

These options also work with **Keep this variation** checked. The current seed is saved at each change. The automatic interval controls music changes; the separate listening timer still decides when playback stops.

## Slow changes

Both motion options start off and leave master volume unchanged.

**Gentle motion** slowly varies the noise filter limits or a sequence's pace and note length. It can also vary Slow drift's overlap. Strength sets the movement range. Sliders show current values; markers show your chosen settings. Note pitches stay unchanged.

**Rate motion** slowly varies a binaural frequency difference or pulse rate. It also works with Harmonic garden's optional binaural layer. The selected rate chooses its range: Delta 0.5 to 4 Hz, Theta 4 to 8 Hz, Alpha 8 to 13 Hz, Beta 13 to 30 Hz, or Gamma 30 to 40 Hz. Tone pitch stays unchanged.

For both options, Slow takes 90 seconds per change, Medium takes 45 seconds and Fast takes 20 seconds. Turning motion off returns to your chosen settings over five seconds.

## Volume, timers and settings

- Volume starts at 1% for new settings. It supports 0.01% to 100% in steps of 0.01 percentage points. Mute keeps your chosen level.
- Volume is a digital control. It does not measure sound level at your ears or guarantee a safe listening level.
- Choose continuous playback, 1, 3, 5, 10, 15 or 30 minutes, or any whole hour from 6 to 12 hours.
- Short timers fade during their last 10 seconds. Overnight timers fade during their last minute. The fade is inside the selected duration.
- Changing the timer during playback starts a new countdown. New variation keeps the current countdown.
- Browser or computer sleep can interrupt playback. Keep the computer awake for long sessions. Interrupted sessions do not automatically restart.
- Settings stay in the current browser when local storage is available. They do not sync between devices or sites.
- Reset preset restores that preset's sound controls. Selecting another preset loads its starting controls. Forget settings clears saved preferences and restores the app defaults.

## Listening and evidence

Start quietly. Stop if a sound causes discomfort. Do not increase volume to find an inaudible tone. Loud sound and long exposure can damage hearing. See [NIDCD's hearing safety information](https://www.nidcd.nih.gov/health/noise-induced-hearing-loss).

The app is for personal listening and sound exploration. Its presets are not medical treatments. Their names and symbolic themes do not promise benefits for sleep, concentration, tinnitus or hearing. About this sound separates intended use from research findings and lists references. General information about sound therapies is available from [NIDCD](https://www.nidcd.nih.gov/health/tinnitus).

## Browser support

Use browser with JavaScript, Web Audio and AudioWorklet support. There is nothing to install. Sound generation runs on your device.

## Privacy and limits

All audio is generated in your browser. There are no external recordings, runtime audio downloads, analytics, accounts or audio uploads. GitHub Pages delivers the app files; sound generation stays on your device.

Long playback does not need a track-length recording in memory. 

The app generates sound as it goes. There is no audio export, saved custom preset library.

So simply try to enjoy it in the moment as captured brilliance can lose its spark.

Made with not so much ❤️ by Thorgin © 2026
