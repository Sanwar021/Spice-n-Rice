package services

import "fmt"

func AdjustPrice(cents, basisPoints int) (int, error) {
	if cents < 0 || cents > 10000000 || basisPoints < -10000 || basisPoints > 100000 {
		return 0, fmt.Errorf("price adjustment out of range")
	}
	result := (int64(cents)*int64(10000+basisPoints) + 5000) / 10000
	if result > 10000000 {
		return 0, fmt.Errorf("price exceeds limit")
	}
	return int(result), nil
}
func FormatPrice(cents int) string { return fmt.Sprintf("$%d.%02d", cents/100, cents%100) }
