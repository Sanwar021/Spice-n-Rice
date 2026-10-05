import {
  createContext,
  useContext,
  useEffect,
  useState,
  lazy,
  Suspense,
  useRef,
} from "react";
import {
  Routes,
  Route,
  Link,
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  Phone,
  Menu as MenuIcon,
  X,
  Sun,
  Moon,
  MapPin,
  Clock,
  Leaf,
  Flame,
  ChefHat,
  Wheat,
  Search,
  LayoutGrid,
  List,
  Check,
} from "lucide-react";
import { photo, photoSet, type Item } from "./design-data";
import HeroCarousel from "./HeroCarousel";
import HighlightsCarousel from "./HighlightsCarousel";
import { api, Row, money } from "./api";
import { useQuery } from "@tanstack/react-query";
import { isOpen, Hours, SEO } from "./business";
export { isOpen } from "./business";
const LiveForm = lazy(() => import("./InquiryForm"));
const Admin = lazy(() => import("./Admin"));
import "./admin-styles.css";

interface SiteStore {
  items: Item[];
  categories: Record<string, Row>;
  settings: Row;
  testimonials: Row[];
  catering: Row[];
  campaigns: Row[];
}
export const Store = createContext<SiteStore>({
  items: [],
  categories: {},
  settings: {},
  testimonials: [],
  catering: [],
  campaigns: [],
});
const links = ["Home", "Menu", "Catering", "About", "Contact"];
const imageList = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((url): url is string => typeof url === "string" && url.length > 0)
    : [];
const itemImage = (item: { image?: string; images?: unknown }, fallback: string) =>
  imageList(item.images)[0] || item.image || fallback;
const activeCampaigns = (rows: Row[]) => {
  const today = new Date().toISOString().slice(0, 10);
  return rows
    .filter((row) => row.visible !== false)
    .filter((row) => !row.starts_at || row.starts_at <= today)
    .filter((row) => !row.ends_at || row.ends_at >= today)
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
};
export function Logo() {
  const { settings } = useContext(Store);
  const logoSrc = !settings.logo || ["/images/logo.svg", "/images/original-logo.png", "/images/spice-logo.webp"].includes(settings.logo)
    ? "/images/yummy-spice-logo.png"
    : settings.logo;
  return (
    <Link to="/" className="logo">
      {logoSrc ? (
        <img className="brand-logo" src={logoSrc} alt={settings.business_name || "Yummy Spice 'N' Rice"} width="1760" height="880" />
      ) : (
        <>
          {settings.business_name &&
          settings.business_name !== "Spice 'N' Rice" ? (
            settings.business_name
          ) : (
            <>
              Spice <span>’N’</span> Rice
            </>
          )}
          <i>INDIAN CUISINE</i>
        </>
      )}
    </Link>
  );
}
export function Button({
  children,
  to,
  className = "",
}: {
  children: React.ReactNode;
  to: string;
  className?: string;
}) {
  return to.startsWith("/") ? (
    <Link className={`button ${className}`} to={to}>
      {children}
    </Link>
  ) : (
    <a className={`button ${className}`} href={to}>
      {children}
    </a>
  );
}
export function Order({ children = "Order Online" }: { children?: React.ReactNode }) {
  const { settings } = useContext(Store);
  return (
    <a
      className="button"
      href={settings.order_url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children} <ArrowUpRight size={17} />
    </a>
  );
}
function Shell() {
  const { settings } = useContext(Store);
  const [mobile, setMobile] = useState(false);
  const [dark, setDark] = useState(
    () =>
      localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") &&
        matchMedia("(prefers-color-scheme: dark)").matches),
  );
  useEffect(() => {
    localStorage.setItem("theme", dark ? "dark" : "light");
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  const location = useLocation();
  useEffect(() => {
    setMobile(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <div className={dark ? "site dark" : "site"}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="header">
        <div className="nav-wrap">
          <Logo />
          <nav aria-label="Main navigation">
            {links.map((label) => (
              <NavLink
                key={label}
                to={label === "Home" ? "/" : `/${label.toLowerCase()}`}
                end
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-actions">
            <a className="nav-phone" href={"tel:" + settings.phones?.[0]}>
              <Phone size={14} /> {settings.phones?.[0]}
            </a>
            <button
              className="icon-button"
              aria-label="Toggle color theme"
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="nav-order">
              <Order />
            </div>
            <button
              className="mobile-trigger icon-button"
              aria-label="Toggle menu"
              aria-expanded={mobile}
              aria-controls="mobile-navigation"
              onClick={() => setMobile(!mobile)}
            >
              {mobile ? <X /> : <MenuIcon />}
            </button>
          </div>
        </div>
        {mobile && (
          <nav
            className="mobile-nav"
            id="mobile-navigation"
            aria-label="Mobile navigation"
          >
            {links.map((label) => (
              <Link
                key={label}
                to={label === "Home" ? "/" : `/${label.toLowerCase()}`}
              >
                {label}
                <ArrowUpRight size={20} />
              </Link>
            ))}
            <Order>{settings.hero_primary_label || "Order Online"}</Order>
            <a href={"tel:" + settings.phones?.[0]}>
              Call {settings.phones?.[0]}
            </a>
          </nav>
        )}
      </header>
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
function Footer() {
  const { settings } = useContext(Store);
  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <Logo />
          <p>
            A little spice. A lot of soul.
            <br />
            Made to order in Richardson since 2009.
          </p>
          <span className="tiny">
            Illustrative food photography, not actual restaurant dishes.
          </span>
        </div>
        <div>
          <h3 className="footer-heading">Make yourself at home</h3>
          {links.slice(1).map((label) => (
            <Link key={label} to={`/${label.toLowerCase()}`}>
              {label}
            </Link>
          ))}
        </div>
        <div>
          <h3 className="footer-heading">Come hungry</h3>
          <p>{settings.address}</p>
          <a
            href={directions(settings.address)}
            target="_blank"
            rel="noreferrer"
          >
            Get directions ↗
          </a>
        </div>
        <div>
          <h3 className="footer-heading">We’re here every day</h3>
          <p>
            <Hours settings={settings} />
          </p>
          <a href={"tel:" + settings.phones?.[0]}>{settings.phones?.[0]}</a>
          <a href={"tel:" + settings.phones?.[1]}>{settings.phones?.[1]}</a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} {settings.business_name}
        </span>
        <span>Casual attire · Private parking · Wheelchair accessible</span>
        {settings.facebook && (
          <a href={settings.facebook} target="_blank" rel="noreferrer">
            Facebook
          </a>
        )}
        {settings.twitter && (
          <a href={settings.twitter} target="_blank" rel="noreferrer">
            X / Twitter
          </a>
        )}
        <Link to="/admin">Staff login ↗</Link>
      </div>
    </footer>
  );
}
const directions = (address: string) =>
  "https://www.google.com/maps/dir/?api=1&destination=" +
  encodeURIComponent(address);
function OpenBadge() {
  const { settings } = useContext(Store);
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  const open = isOpen(settings, now);
  return (
    <span className={"open-badge " + (open ? "" : "closed")}>
      <span />
      {open ? "Open now" : "Currently closed"}
    </span>
  );
}
function Home() {
  const { settings, items, categories, testimonials, campaigns } = useContext(Store);
  const activePromo = activeCampaigns(campaigns)[0];
  const heroImages = Array.from(
    new Set([
      settings.hero_image || photo(0),
      ...items.map(
        (item) =>
          itemImage(item, photo(Object.keys(categories).indexOf(item.category))),
      ),
    ]),
  );
  const hero = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = hero.current;
    if (!node) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      node.style.setProperty("--hero-x", "0");
      node.style.setProperty("--hero-y", "0");
    };
    const move = (event: PointerEvent) => {
      if (motion.matches || event.pointerType !== "mouse") return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = node.getBoundingClientRect();
        node.style.setProperty(
          "--hero-x",
          String(((event.clientX - box.left) / box.width) * 2 - 1),
        );
        node.style.setProperty(
          "--hero-y",
          String(((event.clientY - box.top) / box.height) * 2 - 1),
        );
      });
    };
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerleave", reset);
    motion.addEventListener("change", reset);
    return () => {
      cancelAnimationFrame(frame);
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerleave", reset);
      motion.removeEventListener("change", reset);
    };
  }, []);
  return (
    <>
      <section className="hero hero-premium container" ref={hero}>
        <div className="hero-aura" aria-hidden="true" />
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="little-line" /> {settings.hero_eyebrow || "BIG FLAVORS. NO FUSS."}
          </div>
          <h1>
            {settings.hero_text
              ?.split(/(?<=\.)\s+/)
              .map((line: string, i: number) => (
                <span className="hero-line" key={i}>
                  {i === 0 ? (
                    <>{line}</>
                  ) : (
                    <>
                      {line.split(" ").slice(0, -1).join(" ")}{" "}
                      <em>{line.split(" ").at(-1)}</em>
                    </>
                  )}
                </span>
              ))}
          </h1>
          <p>{settings.hero_subtext || "Your neighborhood Indian canteen. Slow-crafted flavors, generous portions, and the best naans in town."}</p>
          <div className="hero-buttons">
            <Order />
            <Button to="/menu" className="outline">
              {settings.hero_secondary_label || "Explore the Menu"} <ArrowRight size={17} />
            </Button>
          </div>
          <div className="hero-meta">
            <span>{settings.hero_meta || "Richardson, TX · Since 2009"}</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-orbit" aria-hidden="true" />
          <span className="hero-script">{settings.hero_script || "a bowl full of happiness"}</span>
          <HeroCarousel images={heroImages} />
          <div className="hero-seal" aria-label="Made to order, since 2009">
            <span>{settings.hero_seal_top || "MADE TO ORDER"}</span>
            <Wheat size={28} strokeWidth={1.2} aria-hidden="true" />
            <span>{settings.hero_seal_bottom || "SINCE 2009"}</span>
          </div>
          <div className="floating-note">
            <span className="note-icon">
              <Flame size={23} />
            </span>
            <div>
              <strong>{settings.hero_note_title || "Fresh. Every single time."}</strong>
              <span>{settings.hero_note_text || "No shortcuts. Just good food."}</span>
            </div>
          </div>
          <span className="hero-botanical" aria-hidden="true">
            <Wheat size={68} strokeWidth={0.7} />
          </span>
        </div>
        <a className="scroll-note" href="#favorites">
          <ArrowDown size={14} /> A little more to savor
        </a>
      </section>
      <HighlightsCarousel />
      {activePromo && (
        <section className="container campaign-strip">
          <img src={activePromo.image || settings.lunch_image || photo(2)} alt={activePromo.title} width="1000" height="700" loading="lazy" />
          <div>
            <div className="eyebrow">TODAY'S PROMOTION</div>
            <h2>{activePromo.title}</h2>
            <p>{activePromo.description}</p>
            {activePromo.link_label && activePromo.link_url && (
              <Button to={activePromo.link_url === "tel:" ? "tel:" + settings.phones?.[0] : activePromo.link_url} className="dark-button">
                {activePromo.link_label} <ArrowUpRight size={17} />
              </Button>
            )}
          </div>
        </section>
      )}
      <section className="section container" id="favorites">
        <div className="section-heading">
          <div>
            <div className="eyebrow">THE GOOD STUFF</div>
            <h2>Come hungry. Leave happy.</h2>
            <p>A few favorites to get your appetite going.</p>
          </div>
          <Button to="/menu" className="text-button">
            View Full Menu <ArrowUpRight size={18} />
          </Button>
        </div>
        <div className="featured-grid">
          {items
            .filter((item) => item.featured)
            .slice(0, 3)
            .map((item, index) => (
              <Link
                to={`/menu?dish=${encodeURIComponent(item.name)}`}
                className="dish-card"
                key={item.name}
              >
                <div className="dish-photo">
                  <img
                    src={itemImage(item, photo(index))}
                    srcSet={photoSet(itemImage(item, photo(index)))}
                    sizes="(max-width: 600px) 285px, (max-width: 1440px) 30vw, 450px"
                    alt={imageList(item.images)[0] || item.image ? item.name : `Illustrative ${item.name}`}
                    loading="lazy"
                    width="1000"
                    height="700"
                  />
                  <span className="dish-badge">
                    {index === 2 ? <Leaf size={12} /> : <Flame size={12} />}{" "}
                    {item.veg ? "VEGETARIAN" : "HOUSE FAVORITE"}
                  </span>
                  <span className="dish-arrow">
                    <ArrowUpRight size={20} />
                  </span>
                </div>
                <div className="dish-content">
                  <h3>
                    {item.name}
                    <span>${item.price.toFixed(2)}</span>
                  </h3>
                  <p>{item.description}</p>
                </div>
              </Link>
            ))}
        </div>
      </section>
      <section className="category-section container">
        <div className="center-heading">
          <div className="eyebrow">FOLLOW YOUR CRAVINGS</div>
          <h2>A whole world of flavor.</h2>
        </div>
        <div className="category-grid">
          {Object.keys(categories)
            .filter((name) => !name.startsWith("Children"))
            .map((name, index) => (
              <Link
                to={`/menu?category=${encodeURIComponent(name)}`}
                key={name}
              >
                <span className="category-emoji">
                  {
                    ["🍚", "🍗", "🔥", "🌯", "🥬", "🐟", "🥟", "🫓", "🥭"][
                      index
                    ]
                  }
                </span>
                <strong>{name}</strong>
                <ArrowUpRight size={14} />
              </Link>
            ))}
        </div>
      </section>
      <section className="container lunch">
        <div>
          <div className="eyebrow">YOUR LUNCH BREAK, UPGRADED</div>
          <h2>
            A little of everything.
            <br />A whole lot to love.
          </h2>
          <p>
            {settings.lunch_text}
            {settings.lunch_price_cents != null && (
              <strong className="lunch-price">
                {money(settings.lunch_price_cents)}
              </strong>
            )}
          </p>
          <Button to={"tel:" + settings.phones?.[0]} className="dark-button">
            Call for Today’s Selection <ArrowUpRight size={17} />
          </Button>
        </div>
        <div className="lunch-image">
          <img src={settings.lunch_image || photo(2)} srcSet={photoSet(settings.lunch_image || photo(2))} sizes="(max-width: 600px) 272px, 380px" alt="Indian curry lunch" width="1000" height="1500" loading="lazy" />
          <span>
            Made fresh.
            <br />
            <em>Made for you.</em>
          </span>
        </div>
      </section>
      <section className="section container catering-teaser">
        <img
          src={settings.catering_image}
          loading="lazy"
          alt="Spice N Rice dining room"
          width="250"
          height="175"
        />
        <div>
          <div className="eyebrow">GOOD FOOD BRINGS PEOPLE TOGETHER</div>
          <h2>
            Big gathering?
            <br />
            We’ve got the flavor.
          </h2>
          <p>
            From office lunches to your biggest celebrations, bring everyone to
            the table with our full and half catering trays.
          </p>
          <Button to="/catering">
            Let’s Talk Catering <ArrowUpRight size={17} />
          </Button>
        </div>
      </section>
      {!!testimonials.length && (
        <section className="sample-section">
          <div className="container">
            <div className="eyebrow">AT YOUR TABLE</div>
            <h2>Good food. Good company.</h2>
            <div className="quotes">
              {testimonials.map((t) => (
                <blockquote key={t.id}>
                  “{t.quote}”<span>{t.name}</span>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}
      <Location />
      <section className="final-cta">
        <div className="container">
          <div>
            <div className="eyebrow">THERE’S ALWAYS A SEAT FOR YOU</div>
            <h2>Your next good meal starts here.</h2>
          </div>
          <div>
            <Order />
            <Button to={"tel:" + settings.phones?.[0]} className="outline">
              <Phone size={17} /> Call Now
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
function Location({ embedded = false }: { embedded?: boolean }) {
  const { settings } = useContext(Store);
  return (
    <section className="section container location">
      <div>
        <div className="eyebrow">RIGHT HERE IN RICHARDSON</div>
        <h2>
          Around the corner.
          <br />
          Worth the trip.
        </h2>
        <p>
          <MapPin size={18} /> {settings.address}
        </p>
        <p>
          <Clock size={18} /> <Hours settings={settings} />
        </p>
        <Button to={directions(settings.address)} className="outline">
          Get Directions <ArrowUpRight size={17} />
        </Button>
      </div>
      {embedded ? (
        <iframe
          className="map-art"
          title="Restaurant location on Google Maps"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={
            "https://maps.google.com/maps?q=" +
            encodeURIComponent(settings.address || "") +
            "&output=embed"
          }
        />
      ) : (
        <a
          className="map-art"
          href={directions(settings.address)}
          target="_blank"
          rel="noreferrer"
        >
          <div className="map-road road-one" />
          <div className="map-road road-two" />
          <span className="map-label">E. TERRACE DRIVE</span>
          <span className="map-pin">
            <MapPin /> Spice ’N’ Rice
          </span>
          <span className="map-caption">
            Schematic location preview · Open Google Maps ↗
          </span>
        </a>
      )}
    </section>
  );
}
function MenuPage() {
  const { items, categories, settings } = useContext(Store);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [category, setCategory] = useState(params.get("category") || "All");
  const [search, setSearch] = useState("");
  const [list, setList] = useState(false);
  const [veg, setVeg] = useState(false);
  const requestedDish = params.get("dish");
  const [detailName, setDetailName] = useState<string | null>(requestedDish);
  const detail = items.find((item) => item.name === detailName) || null;
  const modal = useRef<HTMLElement>(null);
  useEffect(() => {
    setDetailName(requestedDish);
  }, [requestedDish]);
  const detailId = detail?.id;
  useEffect(() => {
    if (!detailId) return;
    const previous = document.activeElement as HTMLElement;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modal.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      document.body.style.overflow = before;
      previous?.focus();
    };
  }, [detailId]);
  const filtered = items.filter(
    (item) =>
      (category === "All" || item.category === category) &&
      (!veg || item.veg) &&
      (item.name + " " + item.description)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageTitle
        eyebrow="FRESH FROM OUR KITCHEN"
        title="Find your next favorite."
        desc="A little spice, a lot of choice. Everything made to order."
      />
      <section className="container menu-section">
        <div className="menu-tools">
          <label className="search">
            <Search size={19} />
            <input
              type="search"
              aria-label="Search menu"
              placeholder="Search dishes…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <button
            className={`chip ${veg ? "selected" : ""}`}
            aria-pressed={veg}
            onClick={() => setVeg(!veg)}
          >
            <Leaf size={15} /> Vegetarian
          </button>
          <div className="view-switch">
            <button
              aria-label="Grid view"
              className={!list ? "selected" : ""}
              aria-pressed={!list}
              onClick={() => setList(false)}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              aria-label="List view"
              className={list ? "selected" : ""}
              aria-pressed={list}
              onClick={() => setList(true)}
            >
              <List size={18} />
            </button>
          </div>
        </div>
        <div className="category-tabs">
          {["All", ...Object.keys(categories)].map((name) => (
            <button
              className={name === category ? "active" : ""}
              key={name}
              onClick={() => setCategory(name)}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="menu-result-heading">
          <h3>
            {category === "All" ? "Something for every craving" : category}
          </h3>
          <span>{filtered.length} dishes</span>
        </div>
        <div className={list ? "menu-list" : "menu-grid"}>
          {filtered.map((item) => (
            <button
              className={`menu-item ${!item.available ? "unavailable" : ""}`}
              key={item.id}
              onClick={() => setDetailName(item.name)}
            >
              {!list && (
                <img
                  src={
                    itemImage(item, photo(Object.keys(categories).indexOf(item.category)))
                  }
                  loading="lazy"
                  width="1000"
                  height="700"
                  alt={imageList(item.images)[0] || item.image ? item.name : `Illustrative ${item.category} dish`}
                />
              )}
              <div>
                <span className="eyebrow">{item.category}</span>
                <h3>{item.name}</h3>
                <p>
                  {item.available
                    ? "Made to order · View details"
                    : "Currently unavailable"}
                </p>
              </div>
              <strong>${item.price.toFixed(2)}</strong>
              <ArrowUpRight size={17} />
            </button>
          ))}
        </div>
        {!filtered.length && (
          <div className="empty">
            <Search size={35} />
            <h3>No dishes found.</h3>
            <p>Try another search or clear your filters.</p>
            <button
              className="button"
              onClick={() => {
                setSearch("");
                setCategory("All");
                setVeg(false);
              }}
            >
              Clear filters
            </button>
          </div>
        )}
        <p className="tiny menu-disclaimer">
          Photos are illustrative. Please call to discuss ingredients, dietary
          requirements, or current availability.
        </p>
      </section>
      {detail && (
        <div className="overlay" onClick={() => setDetailName(null)}>
          <section
            className="modal item-modal"
            ref={modal}
            role="dialog"
            aria-modal="true"
            aria-label={detail.name}
            onKeyDown={(event) => {
              if (event.key === "Escape") setDetailName(null);
              if (event.key === "Tab") {
                const els = Array.from(
                  event.currentTarget.querySelectorAll<HTMLElement>(
                    "button,a[href],input",
                  ),
                );
                const first = els[0],
                  last = els[els.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault();
                  last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault();
                  first.focus();
                }
              }
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close icon-button"
              aria-label="Close item"
              onClick={() => setDetailName(null)}
            >
              <X />
            </button>
            <img
              src={
                itemImage(detail, photo(Object.keys(categories).indexOf(detail.category)))
              }
              alt={imageList(detail.images)[0] || detail.image ? detail.name : `Illustrative ${detail.name}`}
              width="1000"
              height="700"
            />
            <div className="modal-body">
              <div className="eyebrow">{detail.category}</div>
              <h2>{detail.name}</h2>
              <h3>${detail.price.toFixed(2)}</h3>
              <p>
                {detail.description ||
                  "Made to order at our Richardson canteen. Please call us to discuss ingredients or dietary requirements."}
              </p>
              <div className="hero-buttons">
                {detail.available ? (
                  <Order />
                ) : (
                  <span className="chip">Currently unavailable</span>
                )}
                <Button to={"tel:" + settings.phones?.[0]} className="outline">
                  Call Now
                </Button>
              </div>
              <p className="tiny">
                {detail.image?.startsWith("/images/menu-printed/")
                  ? "Image enhanced from our printed menu. Presentation may vary."
                  : "Illustrative image, not actual dish photography."}
              </p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
function PageTitle({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc: string;
}) {
  return (
    <section className="page-title container">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <p>{desc}</p>
    </section>
  );
}
function InquiryForm({ catering = false }: { catering?: boolean }) {
  return (
    <Suspense
      fallback={<div className="form-panel loading">Loading form…</div>}
    >
      <LiveForm kind={catering ? "catering" : "contact"} />
    </Suspense>
  );
}
function Catering() {
  const [tab, setTab] = useState("Biriyani");
  const { settings, catering } = useContext(Store);
  const rows = Object.fromEntries(
    ["Biriyani", "Non-Veg", "Veg", "Grilled", "Sides"].map((section) => [
      section,
      catering.filter((i) => i.section === section),
    ]),
  );
  return (
    <>
      <section className="container catering-hero">
        <div>
          <div className="eyebrow">BRING EVERYONE TO THE TABLE</div>
          <h1>
            Big gatherings.
            <br />
            <em>Generous food.</em>
          </h1>
          <p>
            Weddings, birthdays, office lunches, or just because.
            <br />
            We’ll bring the flavor. You bring the people.
          </p>
          <a className="button" href="#quote">
            Request a Quote <ArrowUpRight size={17} />
          </a>
        </div>
        <img
          src={settings.catering_image}
          loading="lazy"
          alt="Spice 'N' Rice catering"
          width="250"
          height="175"
        />
      </section>
      <section className="container occasions">
        {["Weddings", "Birthdays", "Corporate", "Parties"].map(
          (name, index) => (
            <div key={name}>
              <span>{["💐", "🎂", "💼", "🎉"][index]}</span>
              <h3>{name}</h3>
            </div>
          ),
        )}
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <div className="eyebrow">A TRAY FOR EVERY TABLE</div>
            <h2>Small gathering or full house?</h2>
          </div>
          <p>Good food, generously served.</p>
        </div>
        <div className="tray-grid">
          {["Full Tray", "Half Tray"].map((name, index) => (
            <div key={name}>
              <div className={`tray ${index ? "half" : ""}`}>
                <img src={index ? settings.tray_half_image || photo(0) : settings.tray_full_image || photo(0)} alt={`${name} catering tray`} width="1000" height="653" loading="lazy" />
              </div>
              <h3>{name}</h3>
              <p>Serves {index ? "7–10" : "15–20"} people</p>
            </div>
          ))}
        </div>
        <h2 className="table-heading">Catering menu</h2>
        <div className="category-tabs">
          {Object.keys(rows).map((name) => (
            <button
              key={name}
              className={tab === name ? "active" : ""}
              onClick={() => setTab(name)}
            >
              {name}
            </button>
          ))}
        </div>
        <table>
          <thead>
            <tr>
              <th>Dish</th>
              <th>Full Tray</th>
              <th>Half Tray</th>
            </tr>
          </thead>
          <tbody>
            {(rows[tab] || []).map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>
                  {money(item.price_cents)}
                  {item.per_piece ? " / piece" : ""}
                </td>
                <td>{item.per_piece ? "—" : money(item.half_price_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows[tab].length && (
          <p className="empty">
            Call us for {tab.toLowerCase()} catering options and pricing.
          </p>
        )}
      </section>
      <section id="quote" className="section container contact-layout">
        <div>
          <div className="eyebrow">YOUR EVENT, OUR KITCHEN</div>
          <h2>
            Let’s make it
            <br />a delicious one.
          </h2>
          <p>
            Contact Harun Miyai to discuss your occasion, tray sizes, and menu.
          </p>
          <Button to={"tel:" + settings.phones?.[0]} className="outline">
            <Phone size={17} />
            {settings.phones?.[0]}
          </Button>
        </div>
        <InquiryForm catering />
      </section>
    </>
  );
}
function About() {
  const { settings } = useContext(Store);
  return (
    <>
      <PageTitle
        eyebrow="OUR LITTLE CORNER OF RICHARDSON"
        title="A canteen with a little more soul."
        desc="Good food. Big portions. No fuss. That’s been our story since 2009."
      />
      <section className="container about-story">
        <img src={settings.about_image || "/images/restaurant-interior.webp"} alt="Inside Spice 'N' Rice in Richardson, with our menu boards and service counter" width="1448" height="1086" loading="lazy" />
        <div>
          <div className="eyebrow">THE WAY WE SEE IT</div>
          <h2>
            Fresh food shouldn’t
            <br />
            be a special occasion.
          </h2>
          <p>
            Spice ’N’ Rice began with a simple idea: an alternative to boring
            buffets and pricey, tasteless dinners.
          </p>
          <p>
            Here, everything is made to order. The portions are generous, the
            atmosphere is casual, and there’s always room for another warm naan.
          </p>
          <p>
            We’re an Indian sub-continental canteen, proudly serving our
            Richardson neighbors since 2009.
          </p>
        </div>
      </section>
      <section className="container manager">
        <span className="manager-icon">
          <ChefHat size={65} />
        </span>
        <div>
          <div className="eyebrow">MEET THE MANAGER</div>
          <h2>Harun M.</h2>
          <p>
            15+ years of Indian sub-continental cooking experience.
            <br />A love of honest flavors and food made fresh.
          </p>
        </div>
      </section>
      <section className="container amenities">
        {[
          "Come as you are · Casual attire",
          "All major credit cards accepted",
          "Wheelchair accessible",
          "Private parking",
        ].map((text) => (
          <div key={text}>
            <Check size={19} />
            {text}
          </div>
        ))}
      </section>
      <section className="section container">
        <div className="eyebrow">A TASTE OF THE TABLE</div>
        <h2>Made for good company.</h2>
        <p className="tiny">Photos enhanced from our printed menu.</p>
        <div className="gallery">
          {(imageList(settings.gallery_images).length ? imageList(settings.gallery_images) : ["/images/menu-printed/biryani.webp", "/images/menu-printed/fish.webp", "/images/menu-printed/samosa.webp", "/images/menu-printed/chicken-wrap.webp"]).map((image) => (
            <img
              key={image}
              src={image}
              alt="Spice 'N' Rice food gallery"
              width="1000"
              height="700"
              loading="lazy"
            />
          ))}
        </div>
      </section>
    </>
  );
}
function Contact() {
  const { settings } = useContext(Store);
  return (
    <>
      <PageTitle
        eyebrow="WE’D LOVE TO SEE YOU"
        title="Come hungry. Find us here."
        desc="A neighborhood canteen, right here in Richardson."
      />
      <section className="container contact-layout">
        <div className="contact-details">
          <h2>Make yourself at home.</h2>
          <div>
            <MapPin />
            <p>{settings.address}</p>
          </div>
          <div>
            <Clock />
            <p>
              <Hours settings={settings} />
            </p>
          </div>
          <div>
            <Phone />
            <p>
              <a href={"tel:" + settings.phones?.[0]}>{settings.phones?.[0]}</a>
              <br />
              <a href={"tel:" + settings.phones?.[1]}>{settings.phones?.[1]}</a>
            </p>
          </div>
          <OpenBadge />
          <p>
            Private parking · Wheelchair accessible
            <br />
            Casual attire · All major credit cards accepted
          </p>
        </div>
        <iframe
          className="map-art contact-map"
          title="Restaurant location on Google Maps"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={
            "https://maps.google.com/maps?q=" +
            encodeURIComponent(settings.address || "") +
            "&output=embed"
          }
        />
      </section>
    </>
  );
}
function NotFound() {
  return (
    <section className="container not-found">
      <span>🍚</span>
      <div className="eyebrow">404 · AN EMPTY PLATE</div>
      <h1>This page has wandered off.</h1>
      <p>Let’s get you back to something delicious.</p>
      <div className="hero-buttons">
        <Button to="/">Back to Home</Button>
        <Button to="/menu" className="outline">
          View Menu
        </Button>
      </div>
    </section>
  );
}
export default function App() {
  const location = useLocation();
  const admin = location.pathname.startsWith("/admin");
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: () => api("/settings"),
  });
  const menu = useQuery({
    queryKey: ["menu"],
    queryFn: () => api("/menu"),
    enabled: !admin,
  });
  const catering = useQuery({
    queryKey: ["catering"],
    queryFn: () => api("/catering-menu"),
    enabled: !admin,
  });
  const testimonials = useQuery({
    queryKey: ["testimonials"],
    queryFn: () => api("/testimonials"),
    enabled: !admin,
  });
  const campaigns = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => api("/campaigns"),
    enabled: !admin,
  });
  if (admin)
    return (
      <div
        className="admin-route"
        data-theme={localStorage.getItem("theme") || "light"}
      >
        <Suspense
          fallback={<p className="loading">Opening the restaurant studio…</p>}
        >
          <Admin />
        </Suspense>
      </div>
    );
  if (
    settings.isPending ||
    (location.pathname !== "/" && menu.isPending) ||
    (location.pathname === "/catering" && catering.isPending)
  )
    return (
      <main className="loading" role="status">
        Setting the table…
      </main>
    );
  if (
    settings.error ||
    menu.error ||
    (location.pathname === "/catering" && catering.error)
  )
    return (
      <main className="loading" role="alert">
        <h1>We couldn’t load the restaurant.</h1>
        <p>Please try again or call 972.479.0633.</p>
        <button
          className="button"
          onClick={() => {
            void settings.refetch();
            void menu.refetch();
            void catering.refetch();
            void campaigns.refetch();
          }}
        >
          Try again
        </button>
      </main>
    );
  const cats = menu.data || [];
  const items: Item[] = cats.flatMap((c) =>
    (c.items as Row[]).map((i) => ({
      ...i,
      id: i.id,
      name:
        c.name === "Biriyanis" && !/biriyani/i.test(i.name)
          ? i.name + " Biriyani"
          : i.name,
      price: i.price_cents / 100,
      category: c.name,
      available: i.available,
      description: i.description,
      featured: i.featured,
      spicy: i.spicy,
      veg: i.veg,
      image: i.image,
      images: i.images,
    })),
  );
  return (
    <Store.Provider
      value={{
        settings: settings.data?.[0] || {},
        items,
        categories: Object.fromEntries(cats.map((c) => [c.name, c])),
        catering: catering.data || [],
        testimonials: testimonials.data || [],
        campaigns: campaigns.data || [],
      }}
    >
      <SEO />
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Home />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="catering" element={<Catering />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Store.Provider>
  );
}
