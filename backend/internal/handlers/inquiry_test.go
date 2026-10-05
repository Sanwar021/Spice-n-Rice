package handlers

import (
	"spicenrice/internal/models"
	"testing"
	"time"
)

func TestValidateInquiry(t *testing.T) {
	now := time.Date(2026, 10, 5, 12, 0, 0, 0, time.UTC)
	base := models.Record{"kind": "catering", "name": "Test Guest", "email": "guest@example.com", "phone": "(972) 555-0123", "message": "Please send details", "date": "2026-10-06", "guests": float64(25)}
	tests := []struct {
		name  string
		key   string
		value any
		valid bool
	}{
		{"valid", "", nil, true},
		{"past date", "date", "2026-10-04", false},
		{"impossible date", "date", "2026-02-30", false},
		{"zero guests", "guests", float64(0), false},
		{"too many guests", "guests", float64(1001), false},
		{"fractional guests", "guests", float64(1.5), false},
		{"short phone", "phone", "555-0123", false},
		{"letters in phone", "phone", "972-CALL-US", false},
		{"bad email", "email", "invalid", false},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			body := models.Record{}
			for key, value := range base {
				body[key] = value
			}
			if tc.key != "" {
				body[tc.key] = tc.value
			}
			err := validateInquiry(body, now)
			if (err == nil) != tc.valid {
				t.Fatalf("unexpected validation result: %v", err)
			}
			if tc.valid && body["phone"] != "9725550123" {
				t.Fatalf("phone was not normalized: %v", body["phone"])
			}
		})
	}
}
