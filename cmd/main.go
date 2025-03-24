package main

import (
	"context"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"fbold/board/cmd/handlers"
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

func main() {
	errEnv := godotenv.Load()
	if errEnv != nil {
	}

	e := echo.New()
	e.Use(middleware.Logger())

	e.Static("/static", "static")
	e.Renderer = newTemplateRenderer()

	dbpool := Connect()
	// defer defers the running of this to the end of the program, ie befor exit, as i understand
	defer dbpool.Close()

	var greeting string
	err := dbpool.QueryRow(context.Background(), "select 'Hello World!'").Scan(&greeting)
	if err != nil {
		fmt.Printf("nah bro %v", err)
		os.Exit(1)
	}
	fmt.Println(greeting)

	e.GET("/", func(c echo.Context) error {
		bulletins, err := bulletin.GetBulletins(dbpool)
		if err != nil {
			log.Println("Failed to retrieve bulletins")
			return c.NoContent(http.StatusInternalServerError)
		}

		return c.Render(200, "index-board", bulletins)
	})

	e.POST("/clear", func(c echo.Context) error {

		bulletins := []bulletin.Bulletin{}
		return c.Render(http.StatusOK, "board", bulletins)
	})

	e.POST("/claim", func(c echo.Context) error {
		log.Println("====================")
		start := c.FormValue("start_pos")
		end := c.FormValue("end_pos")

		c.Response().Header().Set("HX-Location", fmt.Sprint("/claim?from=", start, "&to=", end))
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
			fmt.Println("Error extracting ints from start or end pos")
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid numbers"})
		}

		if x_ > x {
			x_, x = x, x_
		}
		if y_ > y {
			y_, y = y, y_
		}

		bulletinToClaim := bulletin.Bulletin{
			X_:     x_,
			Y_:     y_,
			X:      x,
			Y:      y,
			Width:  x - x_,
			Height: y - y_,
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

		newBulletin := bulletin.Bulletin{
			X_:      startX,
			Y_:      startY,
			X:       endX,
			Y:       endY,
			Content: content,
		}

		err := bulletin.CreateBulletin(dbpool, newBulletin)
		if err != nil {
			log.Println("Failed to create Bulletin", err)
		}

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
