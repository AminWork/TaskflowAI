package logger

import (
    "os"

    "go.uber.org/zap"
)

var Log *zap.SugaredLogger

// Init configures the global structured logger. If APP_ENV=prod|production, use
// production settings; otherwise use development.
func Init() {
    env := os.Getenv("APP_ENV")

    var (
        l   *zap.Logger
        err error
    )
    if env == "prod" || env == "production" {
        l, err = zap.NewProduction()
    } else {
        l, err = zap.NewDevelopment()
    }
    if err != nil {
        panic(err)
    }
    Log = l.Sugar()
}

// Sync flushes any buffered log entries.
func Sync() {
    if Log != nil {
        _ = Log.Sync()
    }
} 