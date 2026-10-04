import { useState } from "react";
import { ChefHat, Clock, Pause, Play, Utensils, Wheat } from "lucide-react";

const highlights = [
  [ChefHat, "Made to Order", "Fresh from our kitchen"],
  [Utensils, "Generous Portions", "Good food. Plenty of it."],
  [Wheat, "Best Naans in Town", "Warm, fluffy, unforgettable"],
  [Clock, "Since 2009", "Your neighborhood favorite"],
] as const;

export default function HighlightsCarousel() {
  const [paused, setPaused] = useState(false);
  return (
    <section
      className={`highlights highlights-carousel${paused ? " is-paused" : ""}`}
      aria-label="Why guests choose Spice 'N' Rice"
    >
      <div
        className="highlights-viewport"
        tabIndex={0}
        aria-label="Restaurant highlights carousel"
      >
        <div className="highlights-track">
          {[0, 1].map((copy) => (
            <div className="highlights-set" key={copy} aria-hidden={copy === 1}>
              {highlights.map(([Icon, title, description]) => (
                <article className="highlight" key={title}>
                  <span className="highlight-icon">
                    <Icon size={28} strokeWidth={1.7} />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <span>{description}</span>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>
      <button
        className="highlights-toggle"
        type="button"
        aria-label={paused ? "Play highlights carousel" : "Pause highlights carousel"}
        onClick={() => setPaused((current) => !current)}
      >
        {paused ? <Play size={14} /> : <Pause size={14} />}
      </button>
    </section>
  );
}
