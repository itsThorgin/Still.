const beatBackground = "EEG records electrical activity in the brain. This preset's band name refers to the frequency difference between the tones. It does not show your current brain activity.";
const beatEvidence = 'A 2023 review found mixed results when studies checked whether brain activity followed the chosen beat rate. A measured response does not by itself prove a useful effect on mood, sleep, or thinking. This preset has not been tested as a treatment.';
const beatSources = ['Research review: Ingendoh, Posny and Heine. Binaural beats to entrain the brain? PLOS ONE, 2023. DOI: 10.1371/journal.pone.0286023.'];
const pulseBackground = "The tone rises and falls in volume at a regular rate. This is called amplitude modulation.";
const pulseEvidence = 'Researchers can measure brain responses that repeat in time with pulsing sounds. This shows that the brain responds to the rhythm. It does not by itself prove better concentration, memory or sleep.';
const pulseSources = ['Mechanism study: Galambos, Makeig and Talmachoff. A 40-Hz auditory potential recorded from the human scalp. PNAS, 1981. DOI: 10.1073/pnas.78.4.2643.'];
const noiseBackground = "These presets use the same noise sound with different starting filter limits. The filters reduce frequencies gradually, so some sound remains outside the selected range.";
const noiseEvidence = 'Background sound can help some people cope with tinnitus. This does not establish benefits for this particular preset, or effects on sleep or concentration.';
const noiseSources = ['Clinical background: National Institute on Deafness and Other Communication Disorders. Tinnitus, sound therapies section.'];

export const GUIDES = {
  'low-gamma': {
    description: "Two low, steady tones with a 40 Hz difference.",
    purpose: "A background for focused listening, study or work.",
    background: `${beatBackground} Gamma is an EEG band associated with several attention and sensory processes.`,
    evidence: "The cited attention study used different tone settings. It does not establish the same result for this preset. Memory findings remain mixed.",
    references: [...beatSources, 'Parameter study: Melnichuk, Cooper and Hawk. Scientific Reports, 2025. DOI: 10.1038/s41598-025-88517-z.'],
  },
  alpha: {
    description: "Two low, steady tones with a 10 Hz difference.",
    purpose: "A background for quiet breaks or meditation.",
    background: `${beatBackground} Alpha activity is often associated with relaxed wakefulness, especially with closed eyes.`,
    evidence: beatEvidence,
    references: beatSources,
  },
  theta: {
    description: 'Two low tones with a slow 6 Hz difference.',
    purpose: "A slow background for meditation or winding down.",
    background: `${beatBackground} Theta activity occurs in drowsiness and several memory-related processes.`,
    evidence: beatEvidence,
    references: beatSources,
  },
  delta: {
    description: 'Two low tones with a very slow 2 Hz difference.',
    purpose: "A slow background for rest or bedtime listening.",
    background: `${beatBackground} Delta activity is associated with deep sleep.`,
    evidence: beatEvidence,
    references: beatSources,
  },
  beta: {
    description: 'Two steady tones with a 16 Hz difference.',
    purpose: "A background for reading, study or work.",
    background: `${beatBackground} Beta activity occurs during many active thinking tasks, and also in other states.`,
    evidence: beatEvidence,
    references: beatSources,
  },
  'delta-pulse': {
    description: "A tone pulses 2 times per second. Both ears receive the same sound.",
    purpose: "A slow rhythmic background for rest or bedtime listening.",
    background: `${pulseBackground} The default 2 Hz pulse rate is in the delta frequency band.`,
    evidence: pulseEvidence,
    references: pulseSources,
  },
  'alpha-pulse': {
    description: "A tone pulses 10 times per second. Both ears receive the same sound.",
    purpose: "A rhythmic background for quiet breaks or focused listening.",
    background: `${pulseBackground} The default 10 Hz pulse rate is in the alpha frequency band.`,
    evidence: pulseEvidence,
    references: pulseSources,
  },
  'theta-pulse': {
    description: "A tone pulses 6 times per second. Both ears receive the same sound.",
    purpose: "A slow rhythmic background for meditation or winding down.",
    background: `${pulseBackground} The default 6 Hz pulse rate is in the theta frequency band.`,
    evidence: pulseEvidence,
    references: pulseSources,
  },
  'gamma-pulse': {
    description: "A tone pulses 40 times per second. Both ears receive the same sound. At this speed, the pulses can sound like a buzz.",
    purpose: "A rhythmic background for focused listening, study or work.",
    background: `${pulseBackground} The default 40 Hz pulse rate is in the gamma frequency band.`,
    evidence: pulseEvidence,
    references: pulseSources,
  },
  'beta-pulse': {
    description: "A tone pulses 16 times per second. Both ears receive the same sound.",
    purpose: "A rhythmic background for reading, study or work.",
    background: `${pulseBackground} The default 16 Hz pulse rate is in the beta frequency band.`,
    evidence: pulseEvidence,
    references: pulseSources,
  },
  'solfeggio-pulse': {
    description: "Choose one of nine solfeggio pitches and a separate pulse rate. Both ears receive the same pulsed tone.",
    purpose: "A rhythmic background for meditation or reflection.",
    background: "Modern solfeggio practice links these frequencies with symbolic themes. These associations vary and are not proven health effects.",
    how: "Choose the tone pitch and set the pulse rate separately. Depth sets how quiet the sound becomes between pulses. Softness smooths each pulse. Rate motion slowly varies the pulse rate within the range shown in the player. Turning it off returns to your chosen rate over five seconds. Tone pitch and volume stay unchanged.",
    evidence: "These symbolic associations are not established health effects. The cited music study does not validate this pulsed tone or specific benefits for each frequency.",
    references: [...pulseSources, 'Symbolic associations: SomaEnergetics, The Solfeggio Frequencies.', 'Music study: Bozok et al. Acute Music-Frequency Exposure Modulates Salivary Stress and Neurotrophic Markers in Young Adults: A Randomized Controlled Trial, 2026. DOI: 10.1002/brb3.71452.'],
  },
  'chamber-soundscape': {
    description: "Changing music with soft background noise, glassy shimmer and a separate upper-frequency layer. An optional binaural layer adds a pair of low tones.",
    purpose: "A changing musical background for work or personal listening. Adjust the layers and volume to suit your comfort.",
    background: "Generated music inspired by Bach, Mozart, Vivaldi, Beethoven, Chopin, Smetana and Paganini. Each variation combines a main influence with a second influence. Bach adds answering phrases. Mozart adds balanced melodies. Vivaldi adds flowing note patterns. Beethoven develops short rhythmic ideas. Chopin adds rolling accompaniment. Smetana adds a three-beat rhythm. Paganini adds short, fast runs.",
    how: "Choose a musical influence and adjust the pace, brightness and layer levels. The upper layer adds high tones within your selected frequency range. Musical connection blends floating shimmer with a supporting melody. Hear upper layer alone temporarily mutes the other layers. The optional binaural layer uses your chosen frequency difference and requires stereo headphones. Rate motion slowly varies this difference. New variation creates a new arrangement while keeping your settings and timer.",
    evidence: "This soundscape has not been tested for effects on tinnitus, hearing, learning, concentration or sleep.",
    references: ['Generated by this app.', 'Sound-design background: Yukhnovich, Harrison, Wray, Alter and Sedley, Hearing Research, 2025. DOI: 10.1016/j.heares.2025.109335. This study tested a different sound.', 'Filter-design background: Jozwiak, Bujacz and Krolak. The Design of Digital Filter System used in Stimulation with Tomatis Method, 2018. DOI: 10.15439/2018F191.', 'Listening background: NIDCD, Tinnitus and Noise-Induced Hearing Loss.'],
  },
  'retro-daydream': {
    description: "Changing retro-style music with soft electronic melodies, warm chords, bass and optional percussion.",
    purpose: "Background music for relaxing, making things or simply listening. Choose a character and adjust its layers to suit your taste.",
    background: "Inspired by calm game music and lo-fi music. Peaceful village uses warm melodies. Dreamy exploration uses spacious sounds. Playful afternoon uses a light rhythm. Meadow quest uses an adventure-style melody and moving bass. Moonlit café uses relaxed chords and a gently swinging rhythm.",
    how: "Choose a musical character and adjust the pace and layer levels. Warmth softens the sound. Room and tape air adds soft echoes and background noise. Pitch drift adds small, slow changes in pitch. Character changes fade into a new arrangement. New variation creates new music while keeping your settings and timer.",
    evidence: "This preset has not been tested for effects on sleep, concentration, hearing or tinnitus.",
    references: ["Generated by this app."],
  },
  'warm-noise': {
    description: "Steady noise with softened low and high frequencies.",
    purpose: 'A background for rest, concentration, or reducing the contrast between tinnitus and a quiet room. Choose a comfortable level rather than trying to drown tinnitus out.',
    background: noiseBackground,
    evidence: 'Sound can make tinnitus less noticeable or easier to cope with for some people. Responses vary. This particular texture has not been tested as a tinnitus treatment.',
    references: noiseSources,
  },
  'gentle-sequence': {
    description: 'Soft bell-like tones form a changing musical sequence. The pitches use a small set of musical intervals.',
    purpose: 'A gentle point of attention for rest or quiet work. Choose this if a changing musical texture feels better than steady noise.',
    background: 'An original musical texture made with soft bell tones. The generator chooses notes from a five-note scale and varies their timing and stereo position.',
    how: 'Pitch limits set the main note range. Pace changes how often notes start. Note length sets how long new notes ring. New variation changes their order and timing.',
    evidence: "This preset has not been tested for effects on sleep, concentration or health.",
    references: ["Generated by this app."],
  },
  'soft-plucks': {
    description: 'Warm, rounded notes form short musical phrases. Soft starts and fading harmonics keep the sound gentle.',
    purpose: 'A quiet musical background for rest, reading, or a calm break. Choose this for a warmer sound with more space between phrases.',
    background: 'An original sound made with sine waves and quiet harmonics. Nearby notes are chosen from a five-note scale. Small timing changes give each phrase a loose rhythm.',
    how: 'Lowest and highest tone set the main pitch range. Pace changes how often notes start. Note length changes how long new notes ring. New variation changes the notes, timing, and stereo positions.',
    evidence: "This preset has not been tested for effects on sleep, concentration or health.",
    references: ["Generated by this app."],
  },
  'slow-drift': {
    description: 'Soft, sustained notes rise and fall slowly. Overlapping notes form a spacious, changing background.',
    purpose: 'A continuous musical background for quiet rest or winding down. Choose this if you prefer slow layers to separate bell or plucked notes.',
    background: 'An original sound made with smooth tones and quiet harmonics. Notes come from a simple three-note chord across the selected pitch range.',
    how: "Pitch limits apply to new notes. Pace sets how often notes can start. Note length sets how long new notes last. Higher overlap allows more notes to play at the same time. At 0%, notes stay separate and the pace may become slower. New variation changes the note order, timing and stereo positions.",
    evidence: "This preset has not been tested for effects on sleep, concentration or health.",
    references: ["Generated by this app."],
  },
  'warm-listening': {
    description: "Low, muffled noise with fewer high frequencies.",
    purpose: 'For listeners who want a darker, more muffled background while resting or winding down.',
    background: noiseBackground,
    evidence: noiseEvidence,
    references: noiseSources,
  },
  'bright-listening': {
    description: "Higher, thinner noise with fewer low frequencies.",
    purpose: 'For listeners who prefer a higher, thinner noise background while reading or doing quiet tasks.',
    background: noiseBackground,
    evidence: noiseEvidence,
    references: noiseSources,
  },
  'pure-tone': {
    description: "One pure tone, adjustable from 20 Hz to 20,000 Hz where supported by your audio output. Listen at a fixed frequency, sweep from low to high, or try a short glide. Both channels play the same sound.",
    purpose: "Explore how different pitches sound through your speakers or headphones. Stop the sweep at a pitch you want to hear again, then use that frequency for the glide.",
    background: 'A pure tone is made with a sine wave and has one frequency. Frequency is measured in hertz, written as Hz. A higher number means a higher pitch. Your hearing and audio equipment affect which frequencies you can hear.',
    how: "Sweep moves from 20 Hz to 20,000 Hz, or your audio output's limit. A full sweep takes 30 seconds. A lower output limit makes it shorter. Stop at any time to keep the last displayed frequency, which may be slightly behind the sound. Glide up and down starts 20% below your selected frequency, with a minimum of 20 Hz. It rises to your selected frequency over four seconds, holds for three seconds, then returns over four seconds. Including fades, one pass takes 12 seconds. Your selected top frequency stays selected. Changing the tone frequency during a sweep or glide switches to a steady tone. The listening timer may stop either pass early.",
    evidence: "These controls explore pitch. They do not measure hearing, and a hearing-training benefit has not been established.",
    references: ['Hearing range: The Audible Spectrum. Neuroscience, 2nd edition. Purves and colleagues, 2001. NCBI Bookshelf.', 'Listening safety: NIDCD. Noise-Induced Hearing Loss.', 'Assessment limits: Basics of Sound, the Ear, and Hearing. Hearing Loss. National Academies, 2004.'],
  },
};
