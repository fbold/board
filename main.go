package main

import (
	"context"
	"html/template"
	"io"
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	//"github.com/labstack/echo/v4/middleware"

	"github.com/fbold/board/api"
)

type TemplateRenderer struct {
	templates *template.Template
}

func (t *TemplateRenderer) Render(w io.Writer, name string, data any, c echo.Context) error {
	return t.templates.ExecuteTemplate(w, name, data)
}

func newTemplateRenderer() *TemplateRenderer {
	return &TemplateRenderer{
		templates: template.Must(template.ParseGlob("web/*.html")),
	}
}

func main() {
	errEnv := godotenv.Load()
	if errEnv != nil {
		slog.Error("Failed to load ENV")
	}

	e := echo.New()
	//e.Use(middleware.slogger())

	// SET UP STATIC ROUTE
	e.Static("/static", "static")
	e.Renderer = newTemplateRenderer()

	// CONNECT TO DB
	dbpool := Connect()
	defer dbpool.Close()

	var greeting string
	err := dbpool.QueryRow(context.Background(), "select 'Hello World!'").Scan(&greeting)
	if err != nil {
		slog.Error("nah bro", slog.Any("err", err))
		os.Exit(1)
	}
	slog.Info(greeting)

	// HANDLERS
	e.GET("/", func(c echo.Context) error {
		bulletins, err := api.GetBulletins(dbpool)
		if err != nil {
			slog.Info("Failed to retrieve bulletins")
			return c.NoContent(http.StatusInternalServerError)
		}

		return c.Render(200, "index-board", bulletins)
	})

	api.HandleBulletins(e, dbpool)
	api.HandleFlowers(e, dbpool)

	//	e.POST("/clear", func(c echo.Context) error {
	//
	//		return c.Render(http.StatusOK, "board", bulletins)
	//	})

	e.POST("/claim", func(c echo.Context) error {
		slog.Info("====================")
		start := c.FormValue("start_pos")
		end := c.FormValue("end_pos")

		c.Response().Header().Set("HX-Location", "/claim?from="+start+"&to="+end)
		return c.NoContent(200)
	})

	e.GET("/claim", func(c echo.Context) error {
		start := strings.Split(c.QueryParam("from"), ",")
		end := strings.Split(c.QueryParam("to"), ",")

		x_, err1 := strconv.Atoi(start[0])
		y_, err2 := strconv.Atoi(start[1])
		x, err3 := strconv.Atoi(end[0])
		y, err4 := strconv.Atoi(end[1])

		if err1 != nil || err2 != nil || err3 != nil || err4 != nil {
			slog.Info("Error extracting ints from start or end pos")
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid numbers"})
		}

		if x_ > x {
			x_, x = x, x_
		}
		if y_ > y {
			y_, y = y, y_
		}

		bulletinToClaim := api.Bulletin{
			X_:     x_,
			Y_:     y_,
			X:      x,
			Y:      y,
			Width:  x - x_,
			Height: y - y_,
		}

		return c.Render(http.StatusOK, "index-claim", bulletinToClaim)
	})

	e.Logger.Fatal(e.Start(":3000"))
}
