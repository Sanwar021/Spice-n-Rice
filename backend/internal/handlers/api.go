package handlers

import (
	"encoding/json"
	"fmt"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"io"
	"log/slog"
	"math"
	"net"
	"net/http"
	"net/mail"
	"net/smtp"
	"os"
	"spicenrice/internal/models"
	"spicenrice/internal/repositories"
	"strconv"
	"strings"
	"sync"
	"time"
)

type API struct {
	Store                   *repositories.Store
	Secret, Origin, Uploads string
	Secure                  bool
	TrustLoopbackProxy      bool
}

func respond(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}
func fail(w http.ResponseWriter, status int, message string) {
	respond(w, status, map[string]any{"error": map[string]string{"message": message}})
}
func decode(w http.ResponseWriter, r *http.Request, dst any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	d := json.NewDecoder(r.Body)
	if err := d.Decode(dst); err != nil {
		fail(w, 400, "Invalid JSON body")
		return false
	}
	if d.Decode(&struct{}{}) != io.EOF {
		fail(w, 400, "Only one JSON object is allowed")
		return false
	}
	return true
}
func (a *API) clientIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		host = r.RemoteAddr
	}
	peer := net.ParseIP(host)
	if a.TrustLoopbackProxy && peer != nil && peer.IsLoopback() {
		if forwarded := net.ParseIP(r.Header.Get("X-Real-IP")); forwarded != nil {
			return forwarded.String()
		}
	}
	return host
}

func (a *API) limit(max int) func(http.Handler) http.Handler {
	type bucket struct {
		n  int
		at time.Time
	}
	var mu sync.Mutex
	seen := map[string]bucket{}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			host := a.clientIP(r)
			mu.Lock()
			now := time.Now()
			for k, v := range seen {
				if now.Sub(v.at) > time.Minute {
					delete(seen, k)
				}
			}
			b := seen[host]
			if b.at.IsZero() {
				b.at = now
			}
			b.n++
			seen[host] = b
			mu.Unlock()
			if b.n > max {
				w.Header().Set("Retry-After", "60")
				fail(w, 429, "Too many requests. Please try again in a minute.")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
func (a *API) Router() http.Handler {
	origins := make([]string, 0, 2)
	for _, origin := range strings.Split(a.Origin, ",") {
		if origin = strings.TrimSpace(origin); origin != "" {
			origins = append(origins, origin)
		}
	}
	originAllowed := func(origin string) bool {
		for _, allowed := range origins {
			if origin == allowed {
				return true
			}
		}
		return false
	}
	r := chi.NewRouter()
	r.Use(middleware.RequestID, middleware.Recoverer, middleware.Timeout(20*time.Second))
	r.Use(cors.Handler(cors.Options{AllowedOrigins: origins, AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}, AllowedHeaders: []string{"Content-Type"}, AllowCredentials: true}))
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("X-Content-Type-Options", "nosniff")
			if r.Method != "GET" && r.Method != "OPTIONS" && r.Header.Get("Origin") != "" && !originAllowed(r.Header.Get("Origin")) {
				fail(w, 403, "Origin not allowed")
				return
			}
			next.ServeHTTP(w, r)
		})
	})
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		if err := a.Store.DB.Ping(r.Context()); err != nil {
			fail(w, 503, "Database unavailable")
			return
		}
		respond(w, 200, map[string]string{"status": "ok"})
	})
	r.Handle("/uploads/*", http.StripPrefix("/uploads/", http.FileServer(http.Dir(a.Uploads))))
	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/menu", a.menu)
		for route, resource := range map[string]string{"settings": "settings", "catering-menu": "catering", "testimonials": "testimonials"} {
			res := resource
			r.Get("/"+route, func(w http.ResponseWriter, r *http.Request) { a.list(w, r, res) })
		}
		r.With(a.limit(5)).Post("/inquiries", a.inquiry)
		r.With(a.limit(10)).Post("/auth/login", a.login)
		r.With(a.limit(30)).Post("/auth/refresh", a.refresh)
		r.Post("/auth/logout", a.logout)
		r.Group(func(r chi.Router) {
			r.Use(a.auth)
			r.Get("/auth/me", func(w http.ResponseWriter, r *http.Request) {
				u := r.Context().Value(identityKey{}).(models.Identity)
				respond(w, 200, map[string]any{"id": u.ID, "role": u.Role})
			})
			r.Route("/admin", func(r chi.Router) {
				r.Get("/dashboard", a.dashboard)
				r.Get("/audit", a.history)
				r.Post("/bulk-prices", a.bulk)
				r.Post("/upload", a.upload)
				r.Get("/{resource}", func(w http.ResponseWriter, r *http.Request) { a.list(w, r, chi.URLParam(r, "resource")) })
				r.Post("/{resource}", a.save)
				r.Put("/{resource}/{id}", a.save)
				r.Delete("/{resource}/{id}", a.remove)
			})
		})
	})
	return r
}
func (a *API) list(w http.ResponseWriter, r *http.Request, res string) {
	rows, err := a.Store.List(r.Context(), res)
	if err != nil {
		slog.Error("list", "error", err)
		fail(w, 500, "Unable to load records")
		return
	}
	if !strings.Contains(r.URL.Path, "/admin/") {
		filtered := []models.Record{}
		for _, row := range rows {
			if row["available"] == false || row["visible"] == false {
				continue
			}
			filtered = append(filtered, row)
		}
		rows = filtered
	}
	respond(w, 200, rows)
}
func (a *API) menu(w http.ResponseWriter, r *http.Request) {
	cats, err := a.Store.List(r.Context(), "categories")
	if err != nil {
		fail(w, 500, "Unable to load menu")
		return
	}
	items, err := a.Store.List(r.Context(), "items")
	if err != nil {
		fail(w, 500, "Unable to load menu")
		return
	}
	out := []models.Record{}
	for _, cat := range cats {
		if cat["visible"] == false {
			continue
		}
		children := []models.Record{}
		for _, item := range items {
			if item["category_id"] == cat["id"] && item["available"] != false {
				children = append(children, item)
			}
		}
		cat["items"] = children
		out = append(out, cat)
	}
	respond(w, 200, out)
}
func validNumber(v any, max float64) bool {
	n, ok := v.(float64)
	return ok && n >= 0 && n <= max && n == math.Trunc(n)
}
func validate(res string, b models.Record) error {
	if b == nil {
		return fmt.Errorf("expected a JSON object")
	}
	if v, ok := b["sort_order"]; ok && !validNumber(v, 1000000) {
		return fmt.Errorf("display order must be a nonnegative integer")
	}
	for _, key := range []string{"available", "visible", "veg", "spicy", "featured", "per_piece"} {
		if v, ok := b[key]; ok {
			if _, ok = v.(bool); !ok {
				return fmt.Errorf("%s must be true or false", key)
			}
		}
	}
	for _, key := range []string{"name", "description", "quote", "hero_text", "business_name", "address", "lunch_text"} {
		if v, ok := b[key]; ok {
			s, ok := v.(string)
			if !ok || len(s) > 4000 {
				return fmt.Errorf("%s must be text under 4000 characters", key)
			}
		}
	}
	if res == "testimonials" {
		for _, key := range []string{"name", "quote"} {
			s, _ := b[key].(string)
			if strings.TrimSpace(s) == "" {
				return fmt.Errorf("name and quote are required")
			}
		}
	}
	if res == "inquiries" {
		status, _ := b["status"].(string)
		if status != "new" && status != "read" && status != "replied" && status != "archived" {
			return fmt.Errorf("invalid inquiry status")
		}
	}
	if res == "items" || res == "catering" || res == "categories" {
		name, _ := b["name"].(string)
		if len(strings.TrimSpace(name)) < 1 || len(name) > 150 {
			return fmt.Errorf("name must be 1–150 characters")
		}
	}
	if res == "items" || res == "catering" {
		if !validNumber(b["price_cents"], 10000000) {
			return fmt.Errorf("price must be integer cents between 0 and 10000000")
		}
	}
	if res == "items" && !validNumber(b["category_id"], 1e9) {
		return fmt.Errorf("choose a category")
	}
	if res == "catering" && !validNumber(b["half_price_cents"], 10000000) {
		return fmt.Errorf("half-tray price must be integer cents")
	}
	for _, key := range []string{"image", "logo", "hero_image", "catering_image"} {
		if s, ok := b[key].(string); ok && s != "" && !strings.HasPrefix(s, "/images/") && !strings.HasPrefix(s, "/uploads/") {
			return fmt.Errorf("use an uploaded image")
		}
	}
	if res == "settings" {
		for _, key := range []string{"business_name", "hero_text", "address"} {
			s, _ := b[key].(string)
			if strings.TrimSpace(s) == "" {
				return fmt.Errorf("%s is required", key)
			}
		}
		hours, ok := b["hours"].([]any)
		if !ok || len(hours) != 7 {
			return fmt.Errorf("provide seven daily opening hours")
		}
		for _, value := range hours {
			day, ok := value.(map[string]any)
			if !ok {
				return fmt.Errorf("invalid hours")
			}
			open, _ := day["open"].(string)
			close, _ := day["close"].(string)
			if _, err := time.Parse("15:04", open); err != nil {
				return fmt.Errorf("invalid opening time")
			}
			if _, err := time.Parse("15:04", close); err != nil || close <= open {
				return fmt.Errorf("closing time must be after opening time")
			}
		}
		phones, ok := b["phones"].([]any)
		if !ok || len(phones) == 0 || len(phones) > 5 {
			return fmt.Errorf("provide one to five phone numbers")
		}
		for _, p := range phones {
			if s, ok := p.(string); !ok || len(s) < 7 || len(s) > 30 {
				return fmt.Errorf("invalid phone")
			}
		}
		if closures, ok := b["holiday_closures"].([]any); ok {
			for _, v := range closures {
				date, ok := v.(string)
				if !ok {
					return fmt.Errorf("invalid holiday date")
				}
				if _, err := time.Parse("2006-01-02", date); err != nil {
					return fmt.Errorf("invalid holiday date")
				}
			}
		} else {
			return fmt.Errorf("holiday closures must be an array")
		}
		if v := b["lunch_price_cents"]; v != nil && !validNumber(v, 10000000) {
			return fmt.Errorf("lunch price must be integer cents")
		}
		for _, key := range []string{"order_url", "facebook", "twitter"} {
			if s, ok := b[key].(string); ok && s != "" && !strings.HasPrefix(s, "https://") && !strings.HasPrefix(s, "http://") {
				return fmt.Errorf("links must start with http:// or https://")
			}
		}
	}
	return nil
}
func (a *API) save(w http.ResponseWriter, r *http.Request) {
	res := chi.URLParam(r, "resource")
	if _, ok := repositories.Tables[res]; !ok || res == "media" {
		fail(w, 404, "Unknown resource")
		return
	}
	u := r.Context().Value(identityKey{}).(models.Identity)
	if res == "settings" && u.Role != "owner" {
		fail(w, 403, "Only the owner can change settings")
		return
	}
	var data models.Record
	if !decode(w, r, &data) {
		return
	}
	if err := validate(res, data); err != nil {
		fail(w, 422, err.Error())
		return
	}
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	id, err := a.Store.Save(r.Context(), res, id, data, u.ID)
	if err != nil {
		slog.Error("save", "error", err)
		fail(w, 422, "Could not save record. Check the category and required fields.")
		return
	}
	respond(w, 200, map[string]int64{"id": id})
}
func (a *API) remove(w http.ResponseWriter, r *http.Request) {
	u := r.Context().Value(identityKey{}).(models.Identity)
	if u.Role != "owner" {
		fail(w, 403, "Only the owner can delete records")
		return
	}
	res := chi.URLParam(r, "resource")
	table, ok := repositories.Tables[res]
	if !ok || res == "settings" {
		fail(w, 400, "Cannot delete this resource")
		return
	}
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		fail(w, 400, "Invalid ID")
		return
	}
	tag, err := a.Store.DB.Exec(r.Context(), "UPDATE "+table+" SET deleted_at=now() WHERE id=$1 AND deleted_at IS NULL", id)
	if err != nil {
		fail(w, 500, "Delete failed")
		return
	}
	if tag.RowsAffected() == 0 {
		fail(w, 404, "Record not found")
		return
	}
	respond(w, 200, map[string]bool{"ok": true})
}
func (a *API) bulk(w http.ResponseWriter, r *http.Request) {
	var b struct {
		CategoryID  int64 `json:"category_id"`
		BasisPoints int   `json:"basis_points"`
		SetCents    *int  `json:"set_cents"`
		Confirm     bool  `json:"confirm"`
	}
	if !decode(w, r, &b) {
		return
	}
	if !b.Confirm || b.BasisPoints < -10000 || b.BasisPoints > 100000 || b.SetCents != nil && (*b.SetCents < 0 || *b.SetCents > 10000000) {
		fail(w, 422, "Confirm a valid price adjustment")
		return
	}
	u := r.Context().Value(identityKey{}).(models.Identity)
	if err := a.Store.Bulk(r.Context(), b.CategoryID, b.BasisPoints, b.SetCents, u.ID); err != nil {
		fail(w, 422, err.Error())
		return
	}
	respond(w, 200, map[string]bool{"ok": true})
}
func (a *API) history(w http.ResponseWriter, r *http.Request) {
	rows, err := a.Store.DB.Query(r.Context(), "SELECT h.id,h.resource,h.item_id,h.field,h.old_cents,h.new_cents,u.email,h.created_at FROM price_history h LEFT JOIN users u ON u.id=h.user_id ORDER BY h.id DESC LIMIT 500")
	if err != nil {
		fail(w, 500, "Could not load history")
		return
	}
	defer rows.Close()
	out := []models.Record{}
	for rows.Next() {
		var id, item int64
		var res, field, email string
		var old, next int
		var at time.Time
		if err = rows.Scan(&id, &res, &item, &field, &old, &next, &email, &at); err != nil {
			fail(w, 500, "Could not read history")
			return
		}
		out = append(out, models.Record{"id": id, "resource": res, "item_id": item, "field": field, "old_cents": old, "new_cents": next, "email": email, "created_at": at})
	}
	respond(w, 200, out)
}
func (a *API) dashboard(w http.ResponseWriter, r *http.Request) {
	var items, inquiries, changes int
	err := a.Store.DB.QueryRow(r.Context(), "SELECT (SELECT count(*) FROM menu_items WHERE deleted_at IS NULL),(SELECT count(*) FROM inquiries WHERE deleted_at IS NULL AND data->>'status'='new'),(SELECT count(*) FROM price_history WHERE created_at>now()-interval '7 days')").Scan(&items, &inquiries, &changes)
	if err != nil {
		fail(w, 500, "Could not load dashboard")
		return
	}
	respond(w, 200, models.Record{"Menu items": items, "New inquiries": inquiries, "Price changes this week": changes})
}
func (a *API) inquiry(w http.ResponseWriter, r *http.Request) {
	var b models.Record
	if !decode(w, r, &b) {
		return
	}
	if s, _ := b["website"].(string); s != "" {
		respond(w, 200, map[string]bool{"ok": true})
		return
	}
	for _, key := range []string{"name", "email", "message", "phone"} {
		s, _ := b[key].(string)
		if len(strings.TrimSpace(s)) == 0 || len(s) > 4000 {
			fail(w, 422, "Please complete all contact fields")
			return
		}
	}
	if _, err := mail.ParseAddress(b["email"].(string)); err != nil {
		fail(w, 422, "Enter a valid email")
		return
	}
	if b["kind"] != "contact" && b["kind"] != "catering" {
		fail(w, 422, "Invalid inquiry type")
		return
	}
	if b["kind"] == "catering" {
		date, _ := b["date"].(string)
		if _, err := time.Parse("2006-01-02", date); err != nil || !validNumber(b["guests"], 100000) {
			fail(w, 422, "Enter a date and guest count")
			return
		}
	}
	b["status"] = "new"
	delete(b, "website")
	if _, err := a.Store.Save(r.Context(), "inquiries", 0, b, 0); err != nil {
		fail(w, 500, "Could not save your inquiry. Please call us.")
		return
	}
	if host := os.Getenv("SMTP_HOST"); host != "" {
		go func() {
			auth := smtp.PlainAuth("", os.Getenv("SMTP_USER"), os.Getenv("SMTP_PASSWORD"), host)
			message := []byte("Subject: New Spice N Rice inquiry\r\n\r\nA new inquiry is available in the admin inbox.")
			if err := smtp.SendMail(host+":"+os.Getenv("SMTP_PORT"), auth, os.Getenv("SMTP_FROM"), []string{os.Getenv("SMTP_TO")}, message); err != nil {
				slog.Error("SMTP notification", "error", err)
			}
		}()
	}
	respond(w, 201, map[string]bool{"ok": true})
}
