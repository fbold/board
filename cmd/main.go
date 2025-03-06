package main

import (
	"html/template"
	"io"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

type TemplateRenderer struct {
	templates *template.Template
}

func (t *TemplateRenderer) Render(w io.Writer, name string, data any, c echo.Context) error {
	return t.templates.ExecuteTemplate(w, name, data)
}

func newTemplateRenderer() *TemplateRenderer {
	return &TemplateRenderer{
		templates: template.Must(template.ParseGlob("views/*.html")),
	}
}

type Tile struct {
	Letter string
}

type Board struct {
	Tiles [10][10]Tile
}

func newBoard() Board {
	var board [10][10]Tile

	for i := 0; i < 10; i++ {
		for j := 0; j < 10; j++ {
			board[i][j] = Tile{Letter: strconv.Itoa(i*10 + j)}
		}
	}

	return Board{Tiles: board}
}

func main() {
	e := echo.New()
	e.Use(middleware.Logger())

	e.Static("/static", "static")

	e.Renderer = newTemplateRenderer()

	board := newBoard()

	e.GET("/", func(c echo.Context) error {
		return c.Render(200, "index", board)
	})

	e.POST("/claim", func(c echo.Context) error {
		e.Logger.Print("====================")
		e.Logger.Print(strings.Split(c.FormValue("selected-tiles"), ""))
		e.Logger.Print("====================")
		return c.Render(200, "index", board)
	})

	e.Logger.Fatal(e.Start(":3000"))
}
