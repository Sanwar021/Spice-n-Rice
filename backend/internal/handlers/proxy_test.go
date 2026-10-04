package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestClientIPTrustBoundary(t *testing.T) {
	for _, tc := range []struct {
		name, peer, header, want string
		trust                    bool
	}{
		{"disabled", "127.0.0.1:80", "198.51.100.2", "127.0.0.1", false},
		{"local nginx", "127.0.0.1:80", "198.51.100.2", "198.51.100.2", true},
		{"ipv6 nginx", "[::1]:80", "2001:db8::2", "2001:db8::2", true},
		{"external spoof", "198.51.100.3:80", "198.51.100.2", "198.51.100.3", true},
		{"invalid", "127.0.0.1:80", "198.51.100.2, 1.2.3.4", "127.0.0.1", true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r := httptest.NewRequest("GET", "/", nil)
			r.RemoteAddr = tc.peer
			r.Header.Set("X-Real-IP", tc.header)
			a := API{TrustLoopbackProxy: tc.trust}
			if got := a.clientIP(r); got != tc.want {
				t.Fatalf("got %s, want %s", got, tc.want)
			}
		})
	}
}

func TestProxyRateLimitsSeparateVisitors(t *testing.T) {
	a := API{TrustLoopbackProxy: true}
	handler := a.limit(1)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(204) }))
	for i, ip := range []string{"198.51.100.2", "198.51.100.2", "198.51.100.3"} {
		r := httptest.NewRequest("POST", "/", nil)
		r.RemoteAddr = "127.0.0.1:80"
		r.Header.Set("X-Real-IP", ip)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, r)
		want := 204
		if i == 1 {
			want = 429
		}
		if w.Code != want {
			t.Fatalf("request %d: got %d want %d", i, w.Code, want)
		}
	}
}
