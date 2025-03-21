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

	"database"
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

type Flower struct {
	X       int
	Y       int
	Message string
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

const TPS = 100 // tiles per side
const TD = 10   // tiles dimensions

type Board struct {
	Tiles     [TPS][TPS]Tile
	Bulletins []Bulletin
}

func newBoard() Board {
	var board [TPS][TPS]Tile

	for i := 0; i < TPS; i++ {
		for j := 0; j < TPS; j++ {
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
		return c.Render(200, "index-board", board)
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
			Width:   float64(endX - startX),
			Height:  float64(endY - startY),
			Content: "",
		}

		c.Response().Header().Set("HX-Location", fmt.Sprint("/claim?from=", c.FormValue("start_pos"), "&to=", c.FormValue("end_pos")))
		return c.Render(200, "index-claim", newBulletin)
	})

	e.GET("/claim", func(c echo.Context) error {
		start := strings.Split(c.QueryParam("from"), ",")
		end := strings.Split(c.QueryParam("to"), ",")

		x_, err1 := strconv.Atoi(start[0])
		y_, err2 := strconv.Atoi(start[1])
		x, err3 := strconv.Atoi(end[0])
		y, err4 := strconv.Atoi(end[1])

		if err1 != nil || err2 != nil || err3 != nil || err4 != nil {
			fmt.Println("Error extracting ints from start or end pos")
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid numbers"})
		}

		bulletinToClaim := Bulletin{
			X_:     x_,
			Y_:     y_,
			X:      x,
			Y:      y,
			Width:  float64(x - x_),
			Height: float64(y - y_),
		}

		return c.Render(http.StatusOK, "index-claim", bulletinToClaim)
	})

	e.POST("/bulletin", func(c echo.Context) error {
		start := strings.Split(c.FormValue("start_pos"), ",")
		end := strings.Split(c.FormValue("end_pos"), ",")

		fmt.Println(start, end)

		startX, err1 := strconv.Atoi(start[0])
		startY, err2 := strconv.Atoi(start[1])
		endX, err3 := strconv.Atoi(end[0])
		endY, err4 := strconv.Atoi(end[1])
		fmt.Println(startX, startY, endX, endY)

		if err1 != nil || err2 != nil || err3 != nil || err4 != nil {
			fmt.Println("Error extracting ints from start or end pos")
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

		fmt.Println(startX, endX, startY, endY)

		newBulletin := Bulletin{
			X_:      startX,
			Y_:      startY,
			X:       endX,
			Y:       endY,
			Width:   float64(endX - startX),
			Height:  float64(endY - startY),
			Content: content,
		}
		board.Bulletins = append(board.Bulletins, newBulletin)

		c.Response().Header().Set("HX-Redirect", "/")
		return c.String(200, "redirect") //Render(200, "index-board", board)
	})

	e.POST("/flower", func(c echo.Context) error {
		pos := strings.Split(c.FormValue("position"), ",")
		message := c.FormValue("message")

		x, err1 := strconv.Atoi(pos[0])
		y, err2 := strconv.Atoi(pos[1])

		if err1 != nil || err2 != nil {
			fmt.Println("Error extracting ints from start or end pos")
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid numbers"})
		}

		flower := Flower{
			X:       x,
			Y:       y,
			Message: message,
		}

		return c.Render(http.StatusOK, "flower", flower)
	})

	e.Logger.Fatal(e.Start(":3000"))
}
