import { useState } from "react";

const DECREES = [
  "Mondays are hereby cancelled. Effective never.",
  "I'm not lazy. I'm in royal energy-saving mode.",
  "I'm not ignoring you. I'm prioritizing my nap.",
  "Sarcasm is just one of the many services I offer.",
  "I'd agree with you, but then we'd both be wrong.",
  "Dress code: comfortable and slightly superior.",
  "Professional napper. Gifted amateur at everything else.",
  "The king does not run. The world waits.",
  "My schedule is wide open. My willingness is not.",
  "Royalty, but make it comfy.",
];

export default function Jokes() {
  const [i, setI] = useState(0);
  return (
    <section className="band band--decrees">
      <div className="wrap decrees">
        <span className="label">Royal decree no. {i + 1} of {DECREES.length}</span>
        <p className="decrees__text" aria-live="polite">{DECREES[i]}</p>
        <button type="button" className="btn btn--gold" onClick={() => setI((i + 1) % DECREES.length)}>
          Next decree
        </button>
      </div>
    </section>
  );
}
