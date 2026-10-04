package handlers

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"net/http"
	"spicenrice/internal/models"
	"strings"
	"time"
)

type identityKey struct{}

func (a *API) cookie(w http.ResponseWriter, name, value string, age int) {
	http.SetCookie(w, &http.Cookie{Name: name, Value: value, Path: "/api/v1", HttpOnly: true, Secure: a.Secure, SameSite: http.SameSiteStrictMode, MaxAge: age})
}
func digest(s string) string { b := sha256.Sum256([]byte(s)); return hex.EncodeToString(b[:]) }
func (a *API) issue(w http.ResponseWriter, r *http.Request, id int64, role string) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		fail(w, 500, "session creation failed")
		return
	}
	refresh := hex.EncodeToString(b)
	if _, err := a.Store.DB.Exec(r.Context(), "INSERT INTO sessions(id,user_id,expires_at) VALUES($1,$2,$3)", digest(refresh), id, time.Now().Add(7*24*time.Hour)); err != nil {
		fail(w, 500, "session creation failed")
		return
	}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{"sub": fmt.Sprint(id), "sid": digest(refresh), "role": role, "exp": time.Now().Add(15 * time.Minute).Unix(), "iss": "spicenrice"}).SignedString([]byte(a.Secret))
	if err != nil {
		fail(w, 500, "session creation failed")
		return
	}
	a.cookie(w, "access", token, 900)
	a.cookie(w, "refresh", refresh, 604800)
	respond(w, 200, map[string]any{"role": role, "id": id})
}
func (a *API) login(w http.ResponseWriter, r *http.Request) {
	var b struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !decode(w, r, &b) {
		return
	}
	var id int64
	var role, hash string
	err := a.Store.DB.QueryRow(r.Context(), "SELECT id,role,password_hash FROM users WHERE email=$1", strings.ToLower(strings.TrimSpace(b.Email))).Scan(&id, &role, &hash)
	if err != nil || bcrypt.CompareHashAndPassword([]byte(hash), []byte(b.Password)) != nil {
		fail(w, 401, "Invalid email or password")
		return
	}
	a.issue(w, r, id, role)
}
func (a *API) refresh(w http.ResponseWriter, r *http.Request) {
	c, err := r.Cookie("refresh")
	if err != nil {
		fail(w, 401, "Please sign in")
		return
	}
	var id int64
	err = a.Store.DB.QueryRow(r.Context(), "DELETE FROM sessions WHERE id=$1 AND expires_at>now() RETURNING user_id", digest(c.Value)).Scan(&id)
	if err != nil {
		fail(w, 401, "Session expired")
		return
	}
	var role string
	if err = a.Store.DB.QueryRow(r.Context(), "SELECT role FROM users WHERE id=$1", id).Scan(&role); err != nil {
		fail(w, 401, "Please sign in")
		return
	}
	a.issue(w, r, id, role)
}
func (a *API) logout(w http.ResponseWriter, r *http.Request) {
	if c, err := r.Cookie("refresh"); err == nil {
		_, _ = a.Store.DB.Exec(r.Context(), "DELETE FROM sessions WHERE id=$1", digest(c.Value))
	}
	a.cookie(w, "access", "", -1)
	a.cookie(w, "refresh", "", -1)
	respond(w, 200, map[string]bool{"ok": true})
}
func (a *API) auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		c, err := r.Cookie("access")
		if err != nil {
			fail(w, 401, "Please sign in")
			return
		}
		token, err := jwt.Parse(c.Value, func(t *jwt.Token) (any, error) { return []byte(a.Secret), nil }, jwt.WithValidMethods([]string{"HS256"}), jwt.WithIssuer("spicenrice"), jwt.WithExpirationRequired())
		if err != nil || !token.Valid {
			fail(w, 401, "Session expired")
			return
		}
		claims := token.Claims.(jwt.MapClaims)
		sub, _ := claims.GetSubject()
		var id int64
		if _, err = fmt.Sscan(sub, &id); err != nil {
			fail(w, 401, "Invalid session")
			return
		}
		var role string
		sid, _ := claims["sid"].(string)
		if err = a.Store.DB.QueryRow(r.Context(), "SELECT u.role FROM users u JOIN sessions s ON s.user_id=u.id WHERE u.id=$1 AND s.id=$2 AND s.expires_at>now()", id, sid).Scan(&role); err != nil {
			fail(w, 401, "Invalid session")
			return
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), identityKey{}, models.Identity{ID: id, Role: role})))
	})
}
