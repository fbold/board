package bulletin

import (
	"context"
	"log"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Bulletin struct {
	X_      int
	Y_      int
	X       int
	Y       int
	Width   int
	Height  int
	Content string
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
