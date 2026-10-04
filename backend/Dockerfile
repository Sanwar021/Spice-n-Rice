FROM golang:1.26.6-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /server ./cmd/server
FROM alpine:3.22
RUN apk add --no-cache ca-certificates libwebp-tools tzdata && adduser -D -u 10001 app
WORKDIR /app
COPY --from=build /server /app/server
COPY migrations /app/migrations
RUN mkdir /app/uploads && chown app:app /app/uploads
USER app
EXPOSE 8087
CMD ["./server"]
