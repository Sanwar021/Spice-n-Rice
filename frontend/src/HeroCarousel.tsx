import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import { photoDimensions, photoSet } from "./design-data";

export default function HeroCarousel({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [focused, setFocused] = useState(false);
  const [loadLater, setLoadLater] = useState(false);
  const active = index % images.length;
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPaused(preference.matches);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (paused || focused || images.length < 2) return;
    const timer = setInterval(() => {
      if (!document.hidden)
        setIndex((current) => (current + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [paused, focused, images.length]);
  return (
    <>
      <Link
        to="/menu"
        className="hero-plating"
        aria-label="Explore our freshly made menu"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        {images.map((src, i) => (
          <img
            key={src}
            className={`hero-food hero-slide${i === active ? " is-active" : ""}`}
            src={i === 0 || loadLater ? src : undefined}
            srcSet={i === 0 || loadLater ? photoSet(src) : undefined}
            sizes="(max-width: 600px) 310px, (max-width: 1150px) 40vw, 490px"
            alt={i === active ? "Food photography from our menu" : ""}
            aria-hidden={i !== active}
            {...{ fetchpriority: i === 0 ? "high" : "low" }}
            loading={i === 0 || loadLater ? "eager" : "lazy"}
            decoding="async"
            onLoad={i === 0 ? () => window.setTimeout(() => setLoadLater(true), 0) : undefined}
            width={photoDimensions(src)[0]}
            height={photoDimensions(src)[1]}
          />
        ))}
        <span className="hero-photo-glow" aria-hidden="true" />
        <span className="hero-photo-link" aria-hidden="true">
          Explore the menu <ArrowUpRight size={18} />
        </span>
      </Link>
      {images.length > 1 && (
        <button
          className="hero-carousel-toggle"
          type="button"
          aria-label={paused ? "Play food slideshow" : "Pause food slideshow"}
          onClick={() => setPaused((current) => !current)}
        >
          {paused ? <Play size={14} /> : <Pause size={14} />}
        </button>
      )}
    </>
  );
}
