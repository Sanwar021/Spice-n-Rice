package handlers

import (
	"spicenrice/internal/models"
	"testing"
)

func TestValidation(t *testing.T) {
	tests := []struct {
		res  string
		data models.Record
		ok   bool
	}{{"items", models.Record{"name": "Butter Chicken", "price_cents": 1399.0, "category_id": 1.0}, true}, {"items", models.Record{"name": "Butter Chicken", "price_cents": 13.99, "category_id": 1.0}, false}, {"categories", models.Record{"name": "Test", "sort_order": "invalid"}, false}, {"items", models.Record{"name": "Test", "price_cents": 10.0, "category_id": 1.0, "image": "javascript:alert(1)"}, false}, {"testimonials", models.Record{"name": "Guest", "quote": "Good food", "visible": true}, true}, {"inquiries", models.Record{"status": "deleted"}, false}}
	for _, test := range tests {
		if err := validate(test.res, test.data); (err == nil) != test.ok {
			t.Fatalf("%+v: %v", test, err)
		}
	}
}
