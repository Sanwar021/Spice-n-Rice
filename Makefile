.PHONY: dev test build lint
dev:
	node scripts/local.mjs
test:
	cd backend && go test ./...
	cd frontend && npm test
	node scripts/integration.mjs
build:
	cd backend && go build ./cmd/server
	cd frontend && npm run build
lint:
	cd backend && go vet ./...
	cd backend && golangci-lint run
	cd frontend && npm run lint
