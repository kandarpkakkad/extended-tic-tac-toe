"""Flask App Routes File."""

from imports_and_declarations import (
    pymongo,
    GAME_FILE,
    LOGIN_FILE,
    REGISTER_FILE,
    DASHBOARD_FILE,
    PAGE_NOT_FOUND_FILE,
    player,
    game,
    async_mode,
)
import hashlib
import time
from pprint import pprint
from bson.objectid import ObjectId
from flask import (
    Flask,
    render_template,
    request,
    make_response,
    redirect,
)
from flask_socketio import SocketIO


app = Flask(__name__)
app.config["SECRET_KEY"] = "extended_tic_tac_toe"
socketio = SocketIO(app, async_mode=async_mode, cors_allowed_origins="*")


@app.route("/", methods=["GET"])
def login():
    r"""Login page.

    Returns: \
        HTML: Login HTML page
    """
    if "name" in request.cookies and "email" in request.cookies:
        return redirect("/dashboard")
    return render_template(LOGIN_FILE, data={"err_msg": ""})


@app.route("/", methods=["POST"])
def login_post():
    r"""Login post.

    Returns: \
        HTML: Login/Game page
    """
    if "name" in request.cookies and "email" in request.cookies:
        return redirect("/dashboard")
    password = hashlib.md5(request.form["password"].encode()).hexdigest()
    query = {"email": request.form["email"], "password": password}
    result = player.find_one(query)
    if result is None:
        return render_template(LOGIN_FILE, data={"err_msg": "Invalid email/password"})
    player_email = result["email"]
    player_name = result["name"]
    resp = make_response(redirect("/dashboard"))
    resp.set_cookie("email", player_email)
    resp.set_cookie("name", player_name)
    return resp


@app.route("/register", methods=["GET"])
def register_get():
    r"""Register user.

    Returns: \
        HTML: Register HTML page
    """
    if "name" in request.cookies and "email" in request.cookies:
        return redirect("/dashboard")
    return render_template(REGISTER_FILE, data={"err_msg": ""})


@app.route("/register", methods=["POST"])
def register_post():
    r"""Register user.

    Returns: \
        HTML: Register HTML page
    """
    if "name" in request.cookies and "email" in request.cookies:
        return redirect("/dashboard")
    email = str(request.form["email"])
    password = str(request.form["password"])
    repassword = str(request.form["repassword"])
    name = str(request.form["name"])
    if player.find_one({"email": email}) is not None:
        print("email", email)
        return render_template(REGISTER_FILE, data={"err_msg": "User already exists."})
    elif password != repassword:
        print("password", password, repassword)
        return render_template(
            REGISTER_FILE, data={"err_msg": "Passwords does not match."}
        )
    password = hashlib.md5(password.encode()).hexdigest()
    player_data = {
        "email": email,
        "password": password,
        "name": name,
        "games": [],
    }
    result = player.insert_one(player_data)
    result = dict(player.find_one({"_id": result.inserted_id}))
    pprint("New data added: {}".format(result))
    resp = make_response(redirect("/dashboard"))
    player_email = result["email"]
    player_name = result["name"]
    resp.set_cookie("email", player_email)
    resp.set_cookie("name", player_name)
    return resp


@app.route("/game", methods=["GET"])
def game_get():
    r"""Game page.

    Returns: \
        HTML: Game HTML page
    """
    if "name" in request.cookies and "email" in request.cookies:
        name = request.cookies.get("name")
        email = request.cookies.get("email")
        game_id = request.cookies.get("game_id")
    else:
        return redirect("/")
    return render_template(
        GAME_FILE, data={"name": name, "email": email, "game_id": game_id}
    )


@app.route("/dashboard", methods=["GET"])
def dashboard_get():
    """User dashboard."""
    if "name" in request.cookies and "email" in request.cookies:
        name = request.cookies.get("name")
        email = request.cookies.get("email")
    else:
        return redirect("/")
    game_list = []
    player_games_list = dict(player.find_one({"email": email}))["games"]
    public_games = game.find(
        {"public": True, "end_time": None, "player2_id": None},
        sort=[("start_time", pymongo.DESCENDING)],
    )
    player_games = game.find({"_id": {"$in": player_games_list}, "end_time": None})
    for public_game in public_games:
        game_list.append(dict(public_game))
    for player_game in player_games:
        player_game = dict(player_game)
        if player_game not in game_list:
            game_list.append(player_game)
    return render_template(
        DASHBOARD_FILE, data={"name": name, "email": email, "public_games": game_list}
    )


@app.route("/create_game", methods=["POST"])
def create_game_post():
    """Create game."""
    if "name" in request.cookies and "email" in request.cookies:
        name = request.cookies.get("name")
        email = request.cookies.get("email")
    else:
        return redirect("/")
    game_type = request.form["game_type"]
    player_1 = dict(player.find_one({"email": email}))
    game_data = {
        "player1_id": ObjectId(player_1["_id"]),
        "player1_name": name,
        "player2_id": None,
        "public": True if game_type == "public" else False,
        "start_time": time.time(),
        "end_time": None,
        "winner": None,
        "player1_win": {},
        "player2_win": {},
        "state": ["" for _ in range(81)],
        "last_box": None,
    }
    result = game.insert_one(game_data)
    player1_games = player_1["games"]
    player1_games.append(result.inserted_id)
    player.find_one_and_update(
        {"_id": ObjectId(player_1["_id"])}, {"$set": {"games": player1_games}}
    )
    socketio.emit("join", {"channel": str(result.inserted_id)})
    resp = make_response(redirect("/game"))
    resp.set_cookie("game_id", str(result.inserted_id))
    return resp


@app.route("/join_game", methods=["POST"])
def join_game_post():
    """Join game."""
    if "email" in request.cookies:
        email = request.cookies.get("email")
    else:
        return redirect("/")
    game_id = ObjectId(request.form["game_id"])
    player_2 = dict(player.find_one({"email": email}))
    game_data = game.find_one({"_id": game_id})
    if game_data is None:
        return render_template(DASHBOARD_FILE, data={"err_msg": "Invalid Game Id"})
    game_data = dict(game_data)
    if game_data["player2_id"] == player_2["_id"]:
        resp = make_response(redirect("/game"))
        resp.set_cookie("game_id", str(game_id))
        return resp
    if (
        game_data["player2_id"] is not None
        and game_data["player1_id"] != player_2["_id"]
    ):
        return redirect("/dashboard")
    if game_data["player1_id"] != player_2["_id"]:
        player2_games = player_2["games"]
        player2_games.append(ObjectId(game_data["_id"]))
        player.find_one_and_update(
            {"_id": ObjectId(player_2["_id"])}, {"$set": {"games": player2_games}}
        )
        game.find_one_and_update(
            {"_id": ObjectId(game_data["_id"])},
            {"$set": {"player2_id": ObjectId(player_2["_id"])}},
        )
    resp = make_response(redirect("/game"))
    resp.set_cookie("game_id", str(game_id))
    return resp


@app.route("/logout", methods=["GET"])
def logout_get():
    """Logout from site."""
    resp = make_response(redirect("/"))
    resp.delete_cookie("name")
    resp.delete_cookie("email")
    return resp


@app.errorhandler(404)
def page_not_found(e):
    """Page not found."""
    return render_template(PAGE_NOT_FOUND_FILE)
