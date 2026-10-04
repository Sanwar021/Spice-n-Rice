// user creates a staff account or resets an existing user's password.
package main

import (
	"context"
	"fmt"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
	"os"
	"strings"
	"time"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
func run() error {
	email, password, role := strings.ToLower(os.Getenv("USER_EMAIL")), os.Getenv("USER_PASSWORD"), os.Getenv("USER_ROLE")
	if email == "" || len(password) < 12 || (role != "owner" && role != "staff") {
		return fmt.Errorf("set USER_EMAIL, USER_PASSWORD (12+ characters), and USER_ROLE (owner/staff)")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	db, err := pgxpool.New(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		return err
	}
	defer db.Close()
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return err
	}
	tx, err := db.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()
	var id int64
	err = tx.QueryRow(ctx, "INSERT INTO users(email,password_hash,role) VALUES($1,$2,$3) ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash,role=EXCLUDED.role RETURNING id", email, string(hash), role).Scan(&id)
	if err != nil {
		return err
	}
	if _, err = tx.Exec(ctx, "DELETE FROM sessions WHERE user_id=$1", id); err != nil {
		return err
	}
	if err = tx.Commit(ctx); err == nil {
		fmt.Println("Account saved; existing sessions revoked.")
	}
	return err
}
