package api

import (
	"context"
	"log"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
)

type Bulletin struct {
	ID      string
	X_      int
	Y_      int
	X       int
	Y       int
	Width   int
	Height  int
	Content string
}

func HandleBulletins(e *echo.Echo, p *pgxpool.Pool) {
	e.GET("/bulletins", func(c echo.Context) error {
		bulletins, err := GetBulletins(p)
		if err != nil {

		}
		return c.Render(http.StatusOK, "board", bulletins)
	})

	e.POST("/bulletin", func(c echo.Context) error {
		start := strings.Split(c.FormValue("start_pos"), ",")
		end := strings.Split(c.FormValue("end_pos"), ",")

		startX, err1 := strconv.Atoi(start[0])
		startY, err2 := strconv.Atoi(start[1])
		endX, err3 := strconv.Atoi(end[0])
		endY, err4 := strconv.Atoi(end[1])

		if err1 != nil || err2 != nil || err3 != nil || err4 != nil {
			slog.Info("Error extracting ints from start or end pos")
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid numbers"})
		}

		content := c.FormValue("content")
		//TODO make sure content doesn't exceed bulletin bounds

		if startX > endX {
			startX, endX = endX, startX
		}
		if startY > endY {
			startY, endY = endY, startY
		}

		newBulletin := Bulletin{
			X_:      startX,
			Y_:      startY,
			X:       endX,
			Y:       endY,
			Content: content,
		}

		err := CreateBulletin(p, newBulletin)
		if err != nil {
			slog.Error("Failed to create Bulletin", slog.Any("err:", err))
		}

		c.Response().Header().Set("HX-Redirect", "/")
		return c.String(200, "redirect") //Render(200, "index-board", board)

	})
}

func GetBulletinAtPosition(pool *pgxpool.Pool, x *int, y *int) (string, error) {
	query := `
		SELECT id FROM bulletins WHERE 
		xStart <= $1 AND
		xEnd > $1 AND
		yStart <= $2 
		AND yEnd > $2 
	`

	var bulletinId string
	err := pool.QueryRow(context.Background(), query, x, y).Scan(&bulletinId)

	if err != nil {
		slog.Error("Error scanning row:")
		return "", err
	}

	return bulletinId, nil
}

func GetBulletins(pool *pgxpool.Pool) ([]Bulletin, error) {
	query := `SELECT xStart,yStart,xEnd,yEnd,width,height,content FROM bulletins`
	rows, err := pool.Query(context.Background(), query)

	if err != nil {
		log.Println("Error Getting Bulletins")
		return nil, err
	}

	defer rows.Close()

	var bulletins []Bulletin

	for rows.Next() {
		var b Bulletin
		if err := rows.Scan(&b.X_, &b.Y_, &b.X, &b.Y, &b.Width, &b.Height, &b.Content); err != nil {
			log.Println("Error scanning row:", err)
			return nil, err
		}
		bulletins = append(bulletins, b)
	}

	if err := rows.Err(); err != nil {
		log.Println("Error iterating over rows:", err)
		return nil, err
	}

	return bulletins, nil
}

func CreateBulletin(pool *pgxpool.Pool, bulletin Bulletin) error {
	//inser bulleting into database
	query := `
        INSERT INTO bulletins (id, xStart, yStart, xEnd, yEnd, width, height, content) VALUES (@id, @xStart, @yStart, @xEnd, @yEnd, @width, @height, @content)
    `
	args := pgx.NamedArgs{
		"id":      uuid.NewString(),
		"xStart":  bulletin.X_,
		"yStart":  bulletin.Y_,
		"xEnd":    bulletin.X,
		"yEnd":    bulletin.Y,
		"width":   bulletin.X - bulletin.X_,
		"height":  bulletin.Y - bulletin.Y_,
		"content": bulletin.Content,
	}

	_, err := pool.Exec(context.Background(), query, args)
	if err != nil {
		log.Println("Error Inserting Bulletin Details")
		return err
	}

	return nil
}
