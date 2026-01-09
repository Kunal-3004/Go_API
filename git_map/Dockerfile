
FROM golang:1.25.5-alpine AS builder

WORKDIR /app

COPY go.mod ./

RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o gitmap ./cmd/main.go

FROM alpine:latest

WORKDIR /root/

COPY --from=builder /app/gitmap .

COPY --from=builder /app/static ./static
COPY --from=builder /app/templates ./templates

EXPOSE 8080

CMD ["./gitmap"]