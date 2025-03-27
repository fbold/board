package main

import "log/slog"

func CheckErr(err error) {
	if err != nil {
		slog.Error("ERROR:", err)
	}
}
