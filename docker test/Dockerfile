
FROM golang:1.25.5-alpine


RUN mkdir /app

COPY . /app


WORKDIR /app


RUN go build -o main .

CMD ["/app/main"]