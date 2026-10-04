package main

import (
	"context"
	"errors"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"spicenrice/internal/handlers"
	"spicenrice/internal/repositories"
	"strings"
	"syscall"
	"time"
)

func env(key, fallback string) string {
	if s := os.Getenv(key); s != "" {
		return s
	}
	return fallback
}
func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))
	if err := run(); err != nil {
		slog.Error("server stopped", "error", err)
		os.Exit(1)
	}
}
func run() error {
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()
	database := os.Getenv("DATABASE_URL")
	secret := os.Getenv("JWT_SECRET")
	if database == "" || len(secret) < 32 {
		return errors.New("DATABASE_URL and JWT_SECRET (at least 32 characters) are required")
	}
	m, err := migrate.New("file://"+env("MIGRATIONS_DIR", "migrations"), database)
	if err != nil {
		return err
	}
	if err = m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return err
	}
	_, _ = m.Close()
	db, err := pgxpool.New(ctx, database)
	if err != nil {
		return err
	}
	defer db.Close()
	email, password := strings.ToLower(os.Getenv("OWNER_EMAIL")), os.Getenv("OWNER_PASSWORD")
	var count int
	if err = db.QueryRow(ctx, "SELECT count(*) FROM users").Scan(&count); err != nil {
		return err
	}
	if count == 0 {
		if email == "" || len(password) < 12 {
			return errors.New("initial OWNER_EMAIL and OWNER_PASSWORD (12+ characters) are required")
		}
		hash, e := bcrypt.GenerateFromPassword([]byte(password), 12)
		if e != nil {
			return e
		}
		if _, err = db.Exec(ctx, "INSERT INTO users(email,password_hash,role) VALUES($1,$2,'owner') ON CONFLICT(email) DO NOTHING", email, string(hash)); err != nil {
			return err
		}
	}
	uploads := env("UPLOAD_DIR", "uploads")
	if err = os.MkdirAll(uploads, 0750); err != nil {
		return err
	}
	api := &handlers.API{Store: &repositories.Store{DB: db}, Secret: secret, Origin: env("FRONTEND_ORIGIN", "http://localhost:5173"), Uploads: uploads, Secure: env("COOKIE_SECURE", "false") == "true"}
	api.TrustLoopbackProxy = env("TRUST_LOOPBACK_PROXY", "false") == "true"
	server := &http.Server{Addr: env("LISTEN_ADDR", ":8080"), Handler: api.Router(), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 30 * time.Second, WriteTimeout: 30 * time.Second, IdleTimeout: 60 * time.Second}
	done := make(chan error, 1)
	go func() { slog.Info("API listening", "address", server.Addr); done <- server.ListenAndServe() }()
	select {
	case err = <-done:
		if !errors.Is(err, http.ErrServerClosed) {
			return err
		}
	case <-ctx.Done():
		shutdown, c := context.WithTimeout(context.Background(), 10*time.Second)
		defer c()
		return server.Shutdown(shutdown)
	}
	return nil
}
