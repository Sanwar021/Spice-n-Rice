package repositories

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"spicenrice/internal/models"
	"spicenrice/internal/services"
)

type Store struct{ DB *pgxpool.Pool }

var Tables = map[string]string{"categories": "categories", "items": "menu_items", "catering": "catering_items", "settings": "settings", "media": "media", "inquiries": "inquiries", "testimonials": "testimonials"}

func (s *Store) List(ctx context.Context, resource string) ([]models.Record, error) {
	table, ok := Tables[resource]
	if !ok {
		return nil, fmt.Errorf("unknown resource")
	}
	rows, err := s.DB.Query(ctx, "SELECT to_jsonb(t) FROM "+table+" t WHERE deleted_at IS NULL ORDER BY COALESCE((data->>'sort_order')::integer,0),id")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []models.Record{}
	for rows.Next() {
		var raw []byte
		if err = rows.Scan(&raw); err != nil {
			return nil, err
		}
		var row models.Record
		if err = json.Unmarshal(raw, &row); err != nil {
			return nil, err
		}
		data := row["data"].(map[string]any)
		delete(row, "data")
		for k, v := range data {
			row[k] = v
		}
		if p, ok := row["price_cents"].(float64); ok {
			row["price"] = services.FormatPrice(int(p))
		}
		if p, ok := row["half_price_cents"].(float64); ok {
			row["half_price"] = services.FormatPrice(int(p))
		}
		out = append(out, row)
	}
	return out, rows.Err()
}
func (s *Store) Save(ctx context.Context, resource string, id int64, data models.Record, user int64) (int64, error) {
	table, ok := Tables[resource]
	if !ok {
		return 0, fmt.Errorf("unknown resource")
	}
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer func() { _ = tx.Rollback(ctx) }()
	price, _ := data["price_cents"].(float64)
	half, _ := data["half_price_cents"].(float64)
	category, _ := data["category_id"].(float64)
	for _, k := range []string{"id", "price", "half_price", "price_cents", "half_price_cents", "category_id", "created_at", "updated_at", "deleted_at"} {
		delete(data, k)
	}
	raw, err := json.Marshal(data)
	if err != nil {
		return 0, err
	}
	if id == 0 {
		switch resource {
		case "items":
			err = tx.QueryRow(ctx, "INSERT INTO menu_items(data,price_cents,category_id) VALUES($1,$2,$3) RETURNING id", raw, int(price), int(category)).Scan(&id)
		case "catering":
			err = tx.QueryRow(ctx, "INSERT INTO catering_items(data,price_cents,half_price_cents) VALUES($1,$2,$3) RETURNING id", raw, int(price), int(half)).Scan(&id)
		default:
			err = tx.QueryRow(ctx, "INSERT INTO "+table+"(data) VALUES($1) RETURNING id", raw).Scan(&id)
		}
	} else {
		if resource == "items" || resource == "catering" {
			var old, oldHalf int
			query := "SELECT price_cents,0 FROM menu_items WHERE id=$1 AND deleted_at IS NULL FOR UPDATE"
			if resource == "catering" {
				query = "SELECT price_cents,half_price_cents FROM catering_items WHERE id=$1 AND deleted_at IS NULL FOR UPDATE"
			}
			err = tx.QueryRow(ctx, query, id).Scan(&old, &oldHalf)
			if err != nil {
				return 0, err
			}
			if err = audit(ctx, tx, resource, id, "price_cents", old, int(price), user); err != nil {
				return 0, err
			}
			if resource == "catering" {
				if err = audit(ctx, tx, resource, id, "half_price_cents", oldHalf, int(half), user); err != nil {
					return 0, err
				}
			}
		}
		query := "UPDATE " + table + " SET data=$1 WHERE id=$2 AND deleted_at IS NULL"
		args := []any{raw, id}
		if resource == "items" {
			query = "UPDATE menu_items SET data=$1,price_cents=$3,category_id=$4 WHERE id=$2 AND deleted_at IS NULL"
			args = append(args, int(price), int(category))
		}
		if resource == "catering" {
			query = "UPDATE catering_items SET data=$1,price_cents=$3,half_price_cents=$4 WHERE id=$2 AND deleted_at IS NULL"
			args = append(args, int(price), int(half))
		}
		var tag interface{ RowsAffected() int64 }
		tag, err = tx.Exec(ctx, query, args...)
		if err == nil && tag.RowsAffected() == 0 {
			err = pgx.ErrNoRows
		}
	}
	if err != nil {
		return 0, err
	}
	return id, tx.Commit(ctx)
}
func audit(ctx context.Context, tx pgx.Tx, resource string, id int64, field string, old, new int, user int64) error {
	if old == new {
		return nil
	}
	_, err := tx.Exec(ctx, "INSERT INTO price_history(resource,item_id,field,old_cents,new_cents,user_id) VALUES($1,$2,$3,$4,$5,$6)", resource, id, field, old, new, user)
	return err
}
func (s *Store) Bulk(ctx context.Context, category int64, bp int, set *int, user int64) error {
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()
	rows, err := tx.Query(ctx, "SELECT id,price_cents FROM menu_items WHERE deleted_at IS NULL AND ($1::bigint=0 OR category_id=$1) ORDER BY id FOR UPDATE", category)
	if err != nil {
		return err
	}
	type item struct {
		id    int64
		price int
	}
	items := []item{}
	for rows.Next() {
		var i item
		if err = rows.Scan(&i.id, &i.price); err != nil {
			rows.Close()
			return err
		}
		items = append(items, i)
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		return err
	}
	for _, i := range items {
		next, e := services.AdjustPrice(i.price, bp)
		if set != nil {
			next = *set
		}
		if e != nil {
			return e
		}
		if err = audit(ctx, tx, "items", i.id, "price_cents", i.price, next, user); err != nil {
			return err
		}
		if _, err = tx.Exec(ctx, "UPDATE menu_items SET price_cents=$1 WHERE id=$2", next, i.id); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}
