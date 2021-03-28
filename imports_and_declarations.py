"""Imports And Declarations File."""

import pymongo


GAME_FILE = "game.html"
LOGIN_FILE = "login.html"
REGISTER_FILE = "register.html"
DASHBOARD_FILE = "dashboard.html"
PAGE_NOT_FOUND_FILE = "404_not_found.html"
USERS = dict()

client = pymongo.MongoClient(
    "mongodb+srv://<username>:<password>@cluster0.8f6vm.mongodb.net/ETTT?retryWrites=true&w=majority"
)
db = client.ETTT
player = db.Player
game = db.Game
async_mode = "eventlet"
