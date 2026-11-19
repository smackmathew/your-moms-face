import { useState } from "react";

const READINGS = [
  "A gentleman never rushes. Neither does a hippo.",
  "Sir Hippo does not swim. The river simply makes room.",
  "Always dress for the mud you want, not the mud you have.",
  "Sir Hippo weighs three tons, all of it manners.",
  "A good hat is like a good river: it should be wide and slightly damp.",
  "Sir Hippo has never lost an argument. He just sits on it.",
  "Tea at four. Wallow at five. Never the other way round.",
  "Sir Hippo yawns only to show off his excellent dental work.",
  "The crocodiles call him Sir. The crocodiles are not stupid.",
  "When Sir Hippo enters the pond, the pond rises to greet him.",
];

export default function Jokes() {
  const [i, setI] = useState(0);
  return (
    <section className="band band--jokes">
      <div className="wrap jokes">
        <span className="mono">Maxim {String(i + 1).padStart(2, "0")} of {READINGS.length}</span>
        <p className="jokes__text" aria-live="polite">{READINGS[i]}</p>
        <button type="button" className="btn" onClick={() => setI((i + 1) % READINGS.length)}>
          Another maxim, please
        </button>
      </div>
    </section>
  );
}
