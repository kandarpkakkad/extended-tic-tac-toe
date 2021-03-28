r"""
Run Socket App File.

Name: Extended Tic-Tac-Toe
Version: 1.0.0
Description: This is main app containing the routes to different pages.
Authors: Himanshu Prajapati, Kandarp Kakkad
URL: http://localhost:3000/
"""

from imports_and_declarations import (
    player,
    game,
)
from flask_app_routes import (
    app,
    socketio,
    ObjectId,
)
import time
from flask_socketio import emit, join_room, leave_room


@socketio.on("update_event", namespace="/")
def update_event(message):
    r"""Handle Update.

    Args: \
        `message`: Game State
    """
    last_box = message["last_box"]
    game_id = message["game_id"]
    print(message)
    game.find_one_and_update(
        {"_id": ObjectId(game_id)},
        {
            "$set": {
                "state": message["data"],
                "last_box": last_box,
                "player1_win": message["games"]["player1"],
                "player2_win": message["games"]["player2"],
            }
        },
    )
    result = game.find_one({"_id": ObjectId(game_id)})
    player1_email = player.find_one({"_id": result["player1_id"]})["email"]
    player2_email = player.find_one({"_id": result["player2_id"]})["email"]
    message["player1_email"] = player1_email
    message["player2_email"] = player2_email
    emit("game_state", {"data": message}, broadcast=True)


@socketio.on("join", namespace="/")
def join(data):
    r"""Handle Update.

    Args: \
        `data`: Game State
    """
    join_room(data["channel"])


@socketio.on("get_state", namespace="/")
def get_state(data):
    """Get state."""
    game_id = data["game_id"]
    current_game = dict(game.find_one({"_id": ObjectId(game_id)}))
    state = current_game["state"]
    last_box = current_game["last_box"]
    games = dict()
    games["player1"] = current_game["player1_win"]
    games["player2"] = current_game["player2_win"]
    status = current_game["winner"] if current_game["winner"] is not None else -1
    player_turn = 0
    if last_box is not None and state[last_box] == "X":
        player_turn = 1
    player1_email = player.find_one({"_id": current_game["player1_id"]})["email"]
    if current_game["player2_id"] is not None:
        player2_email = player.find_one({"_id": current_game["player2_id"]})["email"]
    else:
        player2_email = ""
    data = {
        "data": state,
        "player": player_turn,
        "game_id": game_id,
        "last_box": last_box,
        "games": games,
        "status": status,
        "player1_email": player1_email,
        "player2_email": player2_email,
    }
    emit("game_state", {"data": data}, broadcast=True)


@socketio.on("game_status", namespace="/")
def game_status(data):
    """Game status."""
    game.find_one_and_update(
        {"_id": ObjectId(data["game_id"])},
        {"$set": {"end_time": time.time(), "winner": data["status"]}},
    )


@socketio.on("leave_room", namespace="/")
def leave_room_func(data):
    """Leave Room."""
    print("Left room.")
    leave_room(data["game_id"])


@socketio.on("replay_game", namespace="/")
def replay_game(data):
    """Replay Game."""
    game.find_one_and_update(
        {"_id": ObjectId(data["game_id"])},
        {
            "$set": {
                "start_time": time.time(),
                "end_time": None,
                "winner": None,
                "player1_win": {},
                "player2_win": {},
                "state": ["" for _ in range(81)],
                "last_box": None,
            }
        },
    )
    state = ["" for _ in range(81)]
    player_turn = 0
    game_id = data["game_id"]
    data = {"data": state, "player": player_turn, "game_id": game_id, "replay": True}
    emit("game_state", {"data": data}, broadcast=True)


if __name__ == "__main__":
    socketio.run(app, debug=True)
