import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  LogOut,
  Plus,
  Upload,
  LayoutDashboard,
  Utensils,
  Settings,
  Mail,
  Image,
  History,
  Quote,
  Layers,
  ChefHat,
} from "lucide-react";
import { api, client, money, Row, save } from "./api";
const sections = [
  ["dashboard", "Overview", LayoutDashboard],
  ["items", "Menu items", Utensils],
  ["categories", "Categories", Layers],
  ["catering", "Catering", ChefHat],
  ["audit", "Price history", History],
  ["inquiries", "Inbox", Mail],
  ["media", "Media library", Image],
  ["testimonials", "Testimonials", Quote],
  ["settings", "Site settings", Settings],
] as const;
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
function Login({ done }: { done: () => void }) {
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });
  return (
    <main className="login">
      <Link to="/" className="wordmark">
        <img className="brand-logo" src="/images/spice-logo.webp" alt="Spice 'N' Rice" /><span>THE RESTAURANT STUDIO</span>
      </Link>
      <form
        className="panel"
        onSubmit={handleSubmit(async (data) => {
          try {
            await api("/auth/login", "POST", data);
            done();
          } catch (e) {
            setError((e as Error).message);
          }
        })}
      >
        <p className="eyebrow">WELCOME BACK</p>
        <h1>
          Your kitchen,
          <br />
          at a glance.
        </h1>
        <label>
          Email
          <input type="email" autoComplete="username" {...register("email")} />
        </label>
        {errors.email && <p role="alert">Enter a valid email.</p>}
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
        </label>
        <p role="alert" className="error">
          {error}
        </p>
        <button className="button" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
const fields: Record<string, string[]> = {
  items: [
    "name",
    "description",
    "category_id",
    "price_cents",
    "image",
    "veg",
    "spicy",
    "featured",
    "available",
    "sort_order",
  ],
  categories: ["name", "visible", "sort_order"],
  catering: [
    "name",
    "section",
    "price_cents",
    "half_price_cents",
    "per_piece",
    "available",
  ],
  testimonials: ["name", "quote", "visible", "sort_order"],
  settings: [
    "business_name",
    "logo",
    "hero_text",
    "hero_image",
    "catering_image",
    "address",
    "phones",
    "order_url",
    "facebook",
    "twitter",
    "lunch_text",
    "lunch_price_cents",
    "hours",
    "holiday_closures",
  ],
};
const labels: Record<string, string> = {
  price_cents: "Price (cents)",
  half_price_cents: "Half tray (cents)",
  category_id: "Category",
  sort_order: "Display order",
  lunch_price_cents: "Lunch price (cents; leave blank for call to ask)",
  hours: "Hours by weekday (Sunday first)",
  holiday_closures: "Holiday closures (YYYY-MM-DD)",
  hero_text: "Homepage headline",
  per_piece: "Sold per piece",
  veg: "Vegetarian",
  featured: "Featured on homepage",
};
const booleans = [
  "veg",
  "spicy",
  "featured",
  "available",
  "visible",
  "per_piece",
];
function Editor({
  resource,
  record,
  categories,
  media,
  close,
}: {
  resource: string;
  record: Row;
  categories: Row[];
  media: Row[];
  close: () => void;
}) {
  const [data, setData] = useState<Row>({ ...record });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const change = (key: string, value: unknown) =>
    setData((d) => ({ ...d, [key]: value }));
  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${resource}`}
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
        if (e.key === "Tab") {
          const els = Array.from(
            e.currentTarget.querySelectorAll<HTMLElement>(
              "button,input,select,textarea",
            ),
          ).filter((el) => !el.hasAttribute("disabled"));
          const first = els[0],
            last = els[els.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }}
    >
      <form
        className="panel editor"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await save(resource, data);
            close();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="section-heading">
          <h2>
            {record.id ? "Edit" : "Add"}{" "}
            {resource === "items" ? "menu item" : resource}
          </h2>
          <button type="button" onClick={close} autoFocus>
            Close
          </button>
        </div>
        {(fields[resource] || []).map((key) => (
          <label key={key}>
            {labels[key] || key.replaceAll("_", " ")}
            {booleans.includes(key) ? (
              <input
                type="checkbox"
                checked={
                  data[key] !== false &&
                  Boolean(data[key] ?? ["available", "visible"].includes(key))
                }
                onChange={(e) => change(key, e.target.checked)}
              />
            ) : key === "category_id" ? (
              <select
                required
                value={data[key] || ""}
                onChange={(e) => change(key, Number(e.target.value))}
              >
                <option value="">Choose category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : key === "section" ? (
              <select
                value={data[key] || "Biryani"}
                onChange={(e) => change(key, e.target.value)}
              >
                {["Biryani", "Non-Veg", "Veg", "Grilled", "Sides"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            ) : key === "hours" ? (
              <div className="hours-editor">
                {(data.hours || []).map((day: Row, i: number) => (
                  <div key={i}>
                    <span>
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i]}
                    </span>
                    <input
                      aria-label={`Open ${i}`}
                      type="time"
                      value={day.open}
                      onChange={(e) =>
                        change(
                          "hours",
                          data.hours.map((d: Row, k: number) =>
                            k === i ? { ...d, open: e.target.value } : d,
                          ),
                        )
                      }
                    />
                    <input
                      aria-label={`Close ${i}`}
                      type="time"
                      value={day.close}
                      onChange={(e) =>
                        change(
                          "hours",
                          data.hours.map((d: Row, k: number) =>
                            k === i ? { ...d, close: e.target.value } : d,
                          ),
                        )
                      }
                    />
                    <span>
                      Closed{" "}
                      <input
                        aria-label={`Closed ${i}`}
                        type="checkbox"
                        checked={day.closed}
                        onChange={(e) =>
                          change(
                            "hours",
                            data.hours.map((d: Row, k: number) =>
                              k === i ? { ...d, closed: e.target.checked } : d,
                            ),
                          )
                        }
                      />
                    </span>
                  </div>
                ))}
              </div>
            ) : ["phones", "holiday_closures"].includes(key) ? (
              <input
                value={(data[key] || []).join(", ")}
                onChange={(e) =>
                  change(
                    key,
                    e.target.value
                      .split(",")
                      .map((v) => v.trim())
                      .filter(Boolean),
                  )
                }
              />
            ) : ["description", "lunch_text", "quote"].includes(key) ? (
              <textarea
                rows={3}
                value={data[key] || ""}
                onChange={(e) => change(key, e.target.value)}
              />
            ) : ["image", "logo", "hero_image", "catering_image"].includes(
                key,
              ) ? (
              <>
                <select
                  value={data[key] || ""}
                  onChange={(e) => change(key, e.target.value)}
                >
                  <option value="">No image</option>
                  {data[key] && !media.some((m) => m.image === data[key]) && (
                    <option value={data[key]}>Current image</option>
                  )}
                  {media.map((m) => (
                    <option key={m.id} value={m.image}>
                      {m.name}
                    </option>
                  ))}
                </select>
                {resource === "items" && key === "image" && (
                  <>
                    <button
                      className="image-upload-button"
                      type="button"
                      disabled={uploading}
                      onClick={(event) => {
                        event.preventDefault();
                        fileInput.current?.click();
                      }}
                    >
                      <Upload size={17} />
                      {uploading ? "Uploading…" : "Upload from device"}
                    </button>
                    <input
                      ref={fileInput}
                      className="sr-only"
                      type="file"
                      accept="image/jpeg,image/png"
                      aria-label="Upload menu item image from device"
                      onClick={(event) => event.stopPropagation()}
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        setError("");
                        setUploading(true);
                        try {
                          const body = new FormData();
                          body.append("file", file);
                          const uploaded = await api<Row>(
                            "/admin/upload",
                            "POST",
                            body,
                          );
                          change("image", uploaded.image);
                          await client.invalidateQueries({
                            queryKey: ["admin", "media"],
                          });
                        } catch (error) {
                          setError((error as Error).message);
                        } finally {
                          setUploading(false);
                          event.target.value = "";
                        }
                      }}
                    />
                    <small>JPEG or PNG, up to 8 MB.</small>
                  </>
                )}
                {data[key] && (
                  <img
                    className="image-preview"
                    src={data[key]}
                    alt="Selected"
                  />
                )}
              </>
            ) : (
              <input
                required={["name", "price_cents", "half_price_cents"].includes(
                  key,
                )}
                type={
                  key.endsWith("cents") || key === "sort_order"
                    ? "number"
                    : "text"
                }
                min={0}
                step={1}
                value={data[key] ?? ""}
                onChange={(e) =>
                  change(
                    key,
                    key.endsWith("cents") || key === "sort_order"
                      ? e.target.value === ""
                        ? null
                        : Number(e.target.value)
                      : e.target.value,
                  )
                }
              />
            )}
          </label>
        ))}
        <p role="alert" className="error">
          {error}
        </p>
        <button disabled={busy || uploading} className="button">
          {busy ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
function InlinePrice({ row }: { row: Row }) {
  const [value, setValue] = useState(String(row.price_cents));
  const [status, setStatus] = useState("");
  useEffect(() => setValue(String(row.price_cents)), [row.price_cents]);
  return (
    <form
      className="inline-price"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await save("items", { ...row, price_cents: Number(value) });
          setStatus("Saved");
        } catch (e) {
          setStatus((e as Error).message);
        }
      }}
    >
      <input
        aria-label={`Price in cents for ${row.name}`}
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required
      />
      <button aria-label={`Save price for ${row.name}`}>Save</button>
      <span role="status">{status}</span>
    </form>
  );
}
export default function Admin() {
  const [section, setSection] = useState("dashboard");
  const [editing, setEditing] = useState<Row | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [drag, setDrag] = useState<number | null>(null);
  const [bulkCategory, setBulkCategory] = useState("0");
  const [bulkMode, setBulkMode] = useState("percent");
  const [bulkValue, setBulkValue] = useState("5");
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api<Row>("/auth/me"),
    retry: false,
    refetchInterval: false,
  });
  const query = useQuery({
    queryKey: ["admin", section],
    queryFn: () => api<any>("/admin/" + section),
    enabled: !!me.data,
  });
  const categories = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => api("/admin/categories"),
    enabled: !!me.data,
  });
  const media = useQuery({
    queryKey: ["admin", "media"],
    queryFn: () => api("/admin/media"),
    enabled: !!me.data,
  });
  if (me.isPending)
    return <main className="loading">Opening the restaurant studio…</main>;
  if (!me.data) return <Login done={() => void me.refetch()} />;
  const rows: Row[] = Array.isArray(query.data) ? query.data : [];
  const run = async (fn: () => Promise<unknown>) => {
    setError("");
    setNotice("");
    try {
      await fn();
      await client.invalidateQueries();
      setNotice("Changes saved.");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const reorder = async (from: number, to: number) => {
    const next = [...rows];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    await run(async () => {
      for (let i = 0; i < next.length; i++)
        await save("categories", { ...next[i], sort_order: i });
    });
  };
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/" className="wordmark">
          <img className="brand-logo" src="/images/spice-logo.webp" alt="Spice 'N' Rice" /><span>RESTAURANT STUDIO</span>
        </Link>
        <nav aria-label="Admin navigation">
          {sections.map(([key, label, Icon]) => (
            <button
              className={key === section ? "active" : ""}
              key={key}
              onClick={() => {
                setSection(key);
                setSearch("");
                setNotice("");
                setError("");
              }}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <button
          onClick={() =>
            void run(async () => {
              await api("/auth/logout", "POST");
              client.clear();
              await me.refetch();
            })
          }
        >
          <LogOut size={17} /> Sign out
        </button>
        <small>Signed in as {me.data.role}</small>
      </aside>
      <main className="admin-main">
        <header className="section-heading">
          <div>
            <p className="eyebrow">SPICE ’N’ RICE / YOUR RESTAURANT</p>
            <h1>{sections.find((s) => s[0] === section)?.[1]}</h1>
          </div>
          <Link to="/" className="button outline">
            View website
          </Link>
        </header>
        <div role="status">{notice}</div>
        <p role="alert" className="error">
          {error || query.error?.message}
        </p>
        {query.isPending ? (
          <p>Loading…</p>
        ) : section === "dashboard" ? (
          <>
            <div className="stats">
              {Object.entries(query.data || {}).map(([label, count]) => (
                <div className="panel" key={label}>
                  <p>{label}</p>
                  <strong>{String(count)}</strong>
                </div>
              ))}
            </div>
            <div className="panel">
              <h2>A little care. A lot of flavor.</h2>
              <p>
                Keep your menu fresh, update prices, and make room for the next
                gathering.
              </p>
              <button
                className="button"
                onClick={() => setSection("inquiries")}
              >
                Open inquiries
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="toolbar">
              {!["settings", "audit"].includes(section) && (
                <input
                  aria-label="Search records"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              )}{" "}
              {fields[section] && section !== "settings" && (
                <button
                  className="button"
                  onClick={() =>
                    setEditing({
                      available: true,
                      visible: true,
                      veg: false,
                      spicy: false,
                      featured: false,
                      sort_order: rows.length,
                      section: "Biryani",
                      price_cents: 0,
                      half_price_cents: 0,
                    })
                  }
                >
                  <Plus size={17} /> Add{" "}
                  {section === "items" ? "item" : section}
                </button>
              )}
              {section === "media" && (
                <label className="button">
                  <Upload size={18} /> Upload image
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file)
                        void run(async () => {
                          const body = new FormData();
                          body.append("file", file);
                          await api("/admin/upload", "POST", body);
                        });
                    }}
                  />
                </label>
              )}
            </div>
            {section === "items" && (
              <form
                className="panel bulk"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (
                    window.confirm(
                      `Apply ${bulkMode === "percent" ? bulkValue + "%" : money(Number(bulkValue))} to ${bulkCategory === "0" ? "all categories" : "the selected category"}? This records every change in price history.`,
                    )
                  )
                    void run(() =>
                      api("/admin/bulk-prices", "POST", {
                        category_id: Number(bulkCategory),
                        basis_points:
                          bulkMode === "percent"
                            ? Math.round(Number(bulkValue) * 100)
                            : 0,
                        set_cents:
                          bulkMode === "set" ? Number(bulkValue) : null,
                        confirm: true,
                      }),
                    );
                }}
              >
                <strong>Bulk pricing</strong>
                <select
                  aria-label="Bulk category"
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                >
                  <option value="0">All categories</option>
                  {categories.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Adjustment type"
                  value={bulkMode}
                  onChange={(e) => setBulkMode(e.target.value)}
                >
                  <option value="percent">Adjust percent</option>
                  <option value="set">Set cents</option>
                </select>
                <input
                  aria-label="Adjustment amount"
                  type="number"
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  step={bulkMode === "set" ? 1 : 0.01}
                  required
                />
                <button>Review update</button>
              </form>
            )}
            {section === "settings" ? (
              <div className="panel">
                <h2>{rows[0]?.business_name}</h2>
                <p>{rows[0]?.address}</p>
                <p>
                  Business details, imagery, ordering links, daily hours,
                  holidays, and homepage content.
                </p>
                {me.data.role === "owner" ? (
                  <button
                    className="button"
                    onClick={() => setEditing(rows[0])}
                  >
                    Edit site settings
                  </button>
                ) : (
                  <p>Site settings are managed by the owner.</p>
                )}
              </div>
            ) : section === "media" ? (
              <div className="media-grid">
                {rows
                  .filter((row) =>
                    String(row.name)
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .map((row) => (
                    <article className="panel" key={row.id}>
                      <img src={row.thumbnail} alt={row.name} />
                      <p>{row.name}</p>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              "Remove this image from the library? Existing image links will remain usable.",
                            )
                          )
                            void run(() =>
                              api("/admin/media/" + row.id, "DELETE"),
                            );
                        }}
                      >
                        Remove from library
                      </button>
                    </article>
                  ))}
              </div>
            ) : section === "inquiries" ? (
              <div className="inbox">
                {rows
                  .filter((row) =>
                    JSON.stringify(row)
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .map((row) => (
                    <article className="panel" key={row.id}>
                      <div className="section-heading">
                        <h2>{row.name}</h2>
                        <span className="badge">{row.kind}</span>
                      </div>
                      <p>{new Date(row.created_at).toLocaleString()}</p>
                      <a href={"mailto:" + row.email}>{row.email}</a>
                      <p>{row.phone}</p>
                      {row.date && (
                        <p>
                          {row.date} · {row.guests} guests
                        </p>
                      )}
                      <p className="message">{row.message}</p>
                      <label>
                        Status
                        <select
                          value={row.status}
                          onChange={(e) =>
                            void run(() =>
                              save("inquiries", {
                                ...row,
                                status: e.target.value,
                              }),
                            )
                          }
                        >
                          {["new", "read", "replied", "archived"].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </label>
                    </article>
                  ))}
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {section === "audit" ? (
                        <>
                          <th>When / who</th>
                          <th>Item / field</th>
                          <th>Before</th>
                          <th>After</th>
                        </>
                      ) : (
                        <>
                          <th>Name</th>
                          <th>
                            {section === "items"
                              ? "Price in cents"
                              : section === "catering"
                                ? "Full / half"
                                : "Details"}
                          </th>
                          <th>Status</th>
                          <th>Actions</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {rows
                      .filter((row) =>
                        JSON.stringify(row)
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                      )
                      .map((row, i) => (
                        <tr
                          key={row.id}
                          draggable={section === "categories" && !search}
                          onDragStart={() => setDrag(i)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (drag !== null && !search) void reorder(drag, i);
                            setDrag(null);
                          }}
                        >
                          {section === "audit" ? (
                            <>
                              <td>
                                {new Date(row.created_at).toLocaleString()}
                                <small>{row.email}</small>
                              </td>
                              <td>
                                {row.resource} #{row.item_id}
                                <small>{row.field}</small>
                              </td>
                              <td>{money(row.old_cents)}</td>
                              <td>{money(row.new_cents)}</td>
                            </>
                          ) : (
                            <>
                              <td>
                                <strong>{row.name}</strong>
                                <small>
                                  {section === "items"
                                    ? categories.data?.find(
                                        (c) => c.id === row.category_id,
                                      )?.name
                                    : row.section}
                                </small>
                              </td>
                              <td>
                                {section === "items" ? (
                                  <InlinePrice key={row.id} row={row} />
                                ) : section === "catering" ? (
                                  `${money(row.price_cents)} / ${row.per_piece ? "per piece" : money(row.half_price_cents)}`
                                ) : (
                                  row.quote || `Order ${row.sort_order}`
                                )}
                              </td>
                              <td>
                                {["items", "catering"].includes(section) ? (
                                  <button
                                    onClick={() =>
                                      void run(() =>
                                        save(section, {
                                          ...row,
                                          available: !row.available,
                                        }),
                                      )
                                    }
                                  >
                                    {row.available ? "Available" : "Sold out"}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      void run(() =>
                                        save(section, {
                                          ...row,
                                          visible: !row.visible,
                                        }),
                                      )
                                    }
                                  >
                                    {row.visible ? "Visible" : "Hidden"}
                                  </button>
                                )}
                              </td>
                              <td className="actions">
                                <button onClick={() => setEditing(row)}>
                                  Edit
                                </button>
                                {section === "categories" && (
                                  <>
                                    <button
                                      aria-label={`Move ${row.name} up`}
                                      disabled={!!search || i === 0}
                                      onClick={() => void reorder(i, i - 1)}
                                    >
                                      ↑
                                    </button>
                                    <button
                                      aria-label={`Move ${row.name} down`}
                                      disabled={
                                        !!search || i === rows.length - 1
                                      }
                                      onClick={() => void reorder(i, i + 1)}
                                    >
                                      ↓
                                    </button>
                                  </>
                                )}
                                {me.data.role === "owner" && (
                                  <button
                                    className="danger"
                                    onClick={() => {
                                      if (window.confirm(`Delete ${row.name}?`))
                                        void run(() =>
                                          api(
                                            `/admin/${section}/${row.id}`,
                                            "DELETE",
                                          ),
                                        );
                                    }}
                                  >
                                    Delete
                                  </button>
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
            {rows.length === 0 && (
              <div className="empty">
                {section === "testimonials"
                  ? "No testimonials yet. Add only genuine customer feedback."
                  : "Nothing here yet."}
              </div>
            )}
          </>
        )}
        {editing && (
          <Editor
            resource={section}
            record={editing}
            categories={categories.data || []}
            media={media.data || []}
            close={() => setEditing(null)}
          />
        )}
      </main>
    </div>
  );
}
