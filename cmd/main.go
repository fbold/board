package main

import (
	"fmt"
	"html/template"
	"io"
	"net/http"
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
	X      int
	Y      int
	Letter string
}

type Bulletin struct {
	X_      int
	Y_      int
	X       int
	Y       int
	Top     float64
	Left    float64
	Width   float64
	Height  float64
	Content string
}

type Board struct {
	Tiles     [10][10]Tile
	Bulletins []Bulletin
}

func newBoard() Board {
	var board [10][10]Tile

	for i := 0; i < 10; i++ {
		for j := 0; j < 10; j++ {
			board[i][j] = Tile{X: j, Y: i, Letter: strconv.Itoa(i*10 + j)}
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

	e.POST("/clear", func(c echo.Context) error {

		board.Bulletins = []Bulletin{}
		return c.Render(http.StatusOK, "board", board)
	})

	e.POST("/claim", func(c echo.Context) error {
		e.Logger.Print("====================")
		start := strings.Split(c.FormValue("start_pos"), ",")
		end := strings.Split(c.FormValue("end_pos"), ",")

		startX, err1 := strconv.Atoi(start[0])
		startY, err2 := strconv.Atoi(start[1])
		endX, err3 := strconv.Atoi(end[0])
		endY, err4 := strconv.Atoi(end[1])

		if err1 != nil || err2 != nil || err3 != nil || err4 != nil {
			fmt.Println("Error extracting ints from start or end pos")
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid numbers"})
		}

		newBulletin := Bulletin{
			X_:      startX,
			Y_:      startY,
			X:       endX,
			Y:       endY,
			Top:     float64(startY) * 55,
			Left:    float64(startX) * 55,
			Width:   float64(endX-startX+1) * 52.5,
			Height:  float64(endY-startY+1) * 52.5,
			Content: "",
		}

		board.Bulletins = append(board.Bulletins, newBulletin)

		return c.Render(200, "board", board)
	})

	e.Logger.Fatal(e.Start(":3000"))
}
