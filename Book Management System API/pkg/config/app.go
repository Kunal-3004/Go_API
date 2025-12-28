package config

import (
	"fmt"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
)

var (
	db *gorm.DB
)

func Connect() {

	connStr := "host=localhost port=5432 user=postgres dbname=simplerest password=kunal.2580 sslmode=disable"

	d, err := gorm.Open("postgres", connStr)

	if err != nil {
		panic(err)
	}
	fmt.Println("✅ Database Connected Successfully!")
	db = d
}

func GetDB() *gorm.DB {
	return db
}
