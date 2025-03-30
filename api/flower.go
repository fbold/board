package api

import (
	"context"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
)

type Flower struct {
	X       int
	Y       int
	Scale   float32
	Species int
	Message string
}

func HandleFlowers(e *echo.Echo, p *pgxpool.Pool) {
	//	e.GET("/flowers", func(c echo.Context) error {
	//
	//		flowers, err := GetFlowers(p)
	//		if err != nil {
	//			slog.Error("error retrieving flowers")
	//		}
	//
	//	})

	e.POST("/flower", func(c echo.Context) error {
		slog.Info(c.FormValue("species"))
		pos := strings.Split(c.FormValue("position"), ",")
		species, err := strconv.Atoi(c.FormValue("species"))
		if err != nil {
			slog.Error("couldn't parse scale")
		}
		scale64, err := strconv.ParseFloat(c.FormValue("scale"), 32)
		if err != nil {
			slog.Error("couldn't parse scale")
		}
		scale := float32(scale64)
		message := c.FormValue("message")

		x, err1 := strconv.Atoi(pos[0])
		y, err2 := strconv.Atoi(pos[1])

		if err1 != nil || err2 != nil {
			slog.Info("Error extracting ints from start or end pos")
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid numbers"})
		}

		flower := Flower{
			X:       x,
			Y:       y,
			Scale:   scale,
			Species: species,
			Message: message,
		}

		errFlower := CreateFlower(p, &flower)
		if errFlower != nil {
			slog.Error("Failed to create flower")
		}

		return c.Render(http.StatusOK, "flower", flower)
	})
}

func GetFlowers(pool *pgxpool.Pool) ([]Flower, error) {
	query := `SELECT x,y,scale,species,message FROM flowers`
	rows, err := pool.Query(context.Background(), query)

	if err != nil {
		slog.Error("Error Getting Bulletins")
		return nil, err
	}

	defer rows.Close()

	var flowers []Flower

	for rows.Next() {
		var f Flower
		if err := rows.Scan(&f.X, &f.Y, &f.Scale, &f.Species, &f.Message); err != nil {
			slog.Error("Error scanning row:", slog.Any("err", err))
			return nil, err
		}
		flowers = append(flowers, f)
	}

	if err := rows.Err(); err != nil {
		slog.Error("Error iterating over rows:", slog.Any("err", err))
		return nil, err
	}

	return flowers, nil
}

func CreateFlower(pool *pgxpool.Pool, flower *Flower) error {
	// need to find what bulletin it's on
	slog.Info("Create Flower", "X", flower.X, "Y", flower.Y)
	bulletinId, errB := GetBulletinAtPosition(pool, &flower.X, &flower.Y)
	if errB != nil {
		slog.Error("error getting bulletin at flower position")
	}

	query := `
        INSERT INTO flowers (id, x, y, scale, species, message, bulletinId)
				VALUES (@id, @x, @y, @scale, @species, @message, @bulletinId)
    `
	args := pgx.NamedArgs{
		"id":         uuid.NewString(),
		"x":          flower.X,
		"y":          flower.Y,
		"scale":      flower.Scale,
		"species":    flower.Species,
		"message":    flower.Message,
		"bulletinId": bulletinId,
	}

	_, err := pool.Exec(context.Background(), query, args)
	if err != nil {
		slog.Error("Error Inserting Flower Details")
		return err
	}

	return nil
}
