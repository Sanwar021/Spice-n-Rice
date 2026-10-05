import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, Row } from "./api";
function useSettings() {
  return useQuery({ queryKey: ["settings"], queryFn: () => api("/settings") });
}
export function isOpen(settings: Row, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (name: string) =>
    parts.find((p) => p.type === name)?.value || "";
  const date = `${part("year")}-${part("month")}-${part("day")}`;
  if (settings.holiday_closures?.includes(date)) return false;
  const day =
    settings.hours?.[
      ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(part("weekday"))
    ];
  const clock = part("hour") + ":" + part("minute");
  return !!day && !day.closed && clock >= day.open && clock < day.close;
}
export function Hours({ settings }: { settings: Row }) {
  const hours = settings.hours || [];
  const same =
    hours.length === 7 &&
    hours.every((h: Row) => JSON.stringify(h) === JSON.stringify(hours[0]));
  const format = (v: string) => {
    const [h, m] = v.split(":").map(Number);
    return `${h % 12 || 12}${m ? ":" + String(m).padStart(2, "0") : ""}${h < 12 ? "am" : "pm"}`;
  };
  return same ? (
    <span>
      {hours[0].closed
        ? "Currently closed"
        : `Every day · ${format(hours[0].open)}–${format(hours[0].close)}`}
    </span>
  ) : (
    <span className="hours-lines">
      {hours.map((h: Row, i: number) => (
        <span style={{ display: "block" }} key={i}>
          {
            [
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ][i]
          }
          : {h.closed ? "Closed" : `${format(h.open)}–${format(h.close)}`}
        </span>
      ))}
    </span>
  );
}
export function SEO() {
  const location = useLocation();
  const { data } = useSettings();
  useEffect(() => {
    const route = location.pathname.split("/")[1];
    const page = ({ menu: "Menu", catering: "Catering", about: "About", contact: "Contact" } as Record<string, string>)[route];
    document.title = `${page ? page + " · " : ""}Spice 'N' Rice · Indian Cuisine in Richardson`;
    window.scrollTo(0, 0);
  }, [location.pathname]);
  const s = data?.[0];
  return s ? (
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Restaurant",
        name: s.business_name,
        url: "https://spicenriceharun.com/",
        image: "https://spicenriceharun.com/images/design/food-0.webp",
        priceRange: "$–$$",
        sameAs: [s.facebook, s.twitter].filter((url: unknown) => typeof url === "string" && url.startsWith("https://")),
        servesCuisine: "Indian",
        telephone: s.phones?.[0],
        address: {
          "@type": "PostalAddress",
          streetAddress: s.address,
          addressLocality: "Richardson",
          addressRegion: "TX",
          postalCode: "75081",
          addressCountry: "US",
        },
        openingHoursSpecification: s.hours
          ?.map((h: Row, i: number) =>
            h.closed
              ? null
              : {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: [
                    "Sunday",
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                  ][i],
                  opens: h.open,
                  closes: h.close,
                },
          )
          .filter(Boolean),
      }).replaceAll("<", "\u003c")}
    </script>
  ) : null;
}
