import { useState } from "react";

const READINGS = [
  "Your moms face is so famous, mirrors ask it for an autograph.",
  "Your moms face is so bright, NASA uses it as a navigation landmark.",
  "Your moms face shows up on Google Maps in satellite view.",
  "Your moms face is so wide, it has two time zones and a red-eye between them.",
  "Your moms face is so legendary, Mount Rushmore asked for a fifth slot.",
  "Your moms face is so big, it has its own weather system.",
  "When your moms face smiles, the sun takes the day off.",
  "Your moms face is so memorable, the DMV kept a second photo for themselves.",
  "Your moms face is so iconic, emojis study it for reference.",
  "Your moms face is so warm, penguins migrate toward it in winter.",
];

export default function Jokes() {
  const [i, setI] = useState(0);
  return (
    <section className="band band--jokes">
      <div className="wrap jokes">
        <span className="mono">Field reading {String(i + 1).padStart(2, "0")} of {READINGS.length}</span>
        <p className="jokes__text" aria-live="polite">{READINGS[i]}</p>
        <button type="button" className="btn" onClick={() => setI((i + 1) % READINGS.length)}>
          Take another reading
        </button>
      </div>
    </section>
  );
}
