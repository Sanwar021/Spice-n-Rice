package services

import "testing"

func TestAdjustPrice(t *testing.T) {
	for _, c := range []struct{ in, bp, want int }{{999, 500, 1049}, {149, -10000, 0}, {1, 5000, 2}, {1399, 0, 1399}} {
		got, err := AdjustPrice(c.in, c.bp)
		if err != nil || got != c.want {
			t.Fatalf("%+v: %d %v", c, got, err)
		}
	}
	if _, err := AdjustPrice(-1, 10); err == nil {
		t.Fatal("negative accepted")
	}
	if FormatPrice(149) != "$1.49" {
		t.Fatal("format")
	}
}
