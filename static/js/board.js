let player = 0;
let game_over = false;
let games = {};
games["player1"] = {};
games["player2"] = {};
let games_completed = {};
const unique = (value, index, self) => {
    return self.indexOf(value) === index
}
var turn_span = document.getElementsByName("turn");
var socket = io('http://127.0.0.1:5000');

box_list = []
game_state = []
for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++) {
        for (var k = 0; k < 3; k++) {
            for (var l = 0; l < 3; l++) {
                game_state.push('');
                box_list.push((i + 1).toString() + (j + 1).toString() + (k + 1).toString() + (l + 1).toString());
            }
        }
    }
}

function selectWinnerBoxes(b1, b2, b3, i, j) {
    if (Object.keys(games['player1']).length >= 5) {
        status = 0;
        res = get_cookie();
        game_id = res['game_id']
        if (!game_over) {
            socket.emit('game_status', { status: status, data: game_state, player: player, game_id: game_id, games: games });
        }
        game_over = true;
        return true;
    }
    else if (Object.keys(games['player2']).length >= 5) {
        status = 1;
        res = get_cookie();
        game_id = res['game_id']
        if (!game_over) {
            socket.emit('game_status', { status: status, data: game_state, player: player, game_id: game_id, games: games });
        }
        game_over = true;
        return true;
    }
    game_number = i * 3 + j + 1;
    for (var i = 0; i < Object.keys(games_completed).length; i++) {
        if (game_number == Object.keys(games_completed)[i]) {
            return false;
        }
    }
    if (b1.innerHTML == "X" && b2.innerHTML == "X" && b3.innerHTML == "X") {
        b1.classList.add("win1");
        b2.classList.add("win1");
        b3.classList.add("win1");
        status = 0;
        games["player1"][game_number.toString()] = 1;
        turn_span[0].innerHTML = "Player 1 is the winner";
    }
    else if (b1.innerHTML == "O" && b2.innerHTML == "O" && b3.innerHTML == "O") {
        b1.classList.add("win2");
        b2.classList.add("win2");
        b3.classList.add("win2");
        status = 1;
        games["player2"][game_number.toString()] = 1;
        turn_span[0].innerHTML = "Player 2 is the winner";
    }
    games_completed[game_number.toString()] = 1;
    turn_span[0].style.fontSize = "25px";
    return false;
}

function getWinner() {
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
            var box1 = document.getElementById((i + 1).toString() + (j + 1).toString() + "11"),
                box2 = document.getElementById((i + 1).toString() + (j + 1).toString() + "12"),
                box3 = document.getElementById((i + 1).toString() + (j + 1).toString() + "13"),
                box4 = document.getElementById((i + 1).toString() + (j + 1).toString() + "21"),
                box5 = document.getElementById((i + 1).toString() + (j + 1).toString() + "22"),
                box6 = document.getElementById((i + 1).toString() + (j + 1).toString() + "23"),
                box7 = document.getElementById((i + 1).toString() + (j + 1).toString() + "31"),
                box8 = document.getElementById((i + 1).toString() + (j + 1).toString() + "32"),
                box9 = document.getElementById((i + 1).toString() + (j + 1).toString() + "33");
            if (box1.innerHTML.replace("\n", '').trim() !== "" && box1.innerHTML === box2.innerHTML && box1.innerHTML === box3.innerHTML) {
                if (selectWinnerBoxes(box1, box2, box3, i, j)) {
                    return true;
                }
            }

            if (box4.innerHTML.replace("\n", '').trim() !== "" && box4.innerHTML === box5.innerHTML && box4.innerHTML === box6.innerHTML) {
                if (selectWinnerBoxes(box4, box5, box6, i, j)) {
                    return true;
                }
            }

            if (box7.innerHTML.replace("\n", '').trim() !== "" && box7.innerHTML === box8.innerHTML && box7.innerHTML === box9.innerHTML) {
                if (selectWinnerBoxes(box7, box8, box9, i, j)) {
                    return true;
                }
            }

            if (box1.innerHTML.replace("\n", '').trim() !== "" && box1.innerHTML === box4.innerHTML && box1.innerHTML === box7.innerHTML) {
                if (selectWinnerBoxes(box1, box4, box7, i, j)) {
                    return true;
                }
            }

            if (box2.innerHTML.replace("\n", '').trim() !== "" && box2.innerHTML === box5.innerHTML && box2.innerHTML === box8.innerHTML) {
                if (selectWinnerBoxes(box2, box5, box8, i, j)) {
                    return true;
                }
            }

            if (box3.innerHTML.replace("\n", '').trim() !== "" && box3.innerHTML === box6.innerHTML && box3.innerHTML === box9.innerHTML) {
                if (selectWinnerBoxes(box3, box6, box9, i, j)) {
                    return true;
                }
            }

            if (box1.innerHTML.replace("\n", '').trim() !== "" && box1.innerHTML === box5.innerHTML && box1.innerHTML === box9.innerHTML) {
                if (selectWinnerBoxes(box1, box5, box9, i, j)) {
                    return true;
                }
            }

            if (box3.innerHTML.replace("\n", '').trim() !== "" && box3.innerHTML === box5.innerHTML && box3.innerHTML === box7.innerHTML) {
                if (selectWinnerBoxes(box3, box5, box7, i, j)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function clickEventHandler(obj) {
    if (game_over) {
        return;
    }
    var objid = obj.id;
    objid = objid.slice(-4);
    var index = ((parseInt(objid[0]) - 1) * 3 + (parseInt(objid[1]) - 1)) * 9 + (parseInt(objid[2]) - 1) * 3 + (parseInt(objid[3]) - 1);
    var game_number = objid[2] + objid[3];
    if (obj.innerHTML !== "X" && obj.innerHTML !== "O") {
        if (player === 0) {
            obj.innerHTML = "X";
            game_state[index] = 'X'
            turn = 1;

        } else {
            obj.innerHTML = "O";
            game_state[index] = 'O'
            turn = 0;
        }
        if (!getWinner() && draw() && Object.keys(games["player1"]).length == Object.keys(games["player2"]).length) {
            res = get_cookie();
            game_id = res['game_id']
            turn_span[0].innerHTML = "Match draw";
            socket.emit('game_status', { status: 2, data: game_state, player: player, game_id: game_id, games: games })
            for (var i = 0; i < 81; i++) {
                box = document.getElementById(box_list[i]);
                box.classList.add("disabled");
            }
            return;
        }
        for (var i = 0; i < 81; i++) {
            box = document.getElementById(box_list[i]);
            box.classList.add("disabled");
        }
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                box = document.getElementById(game_number + (i + 1).toString() + (j + 1).toString());
                box.classList.remove("disabled");
            }
        }
        player = 1 - player;
        res = get_cookie();
        game_id = res['game_id']
        console.log(games);
        socket.emit('update_event', { data: game_state, player: player, last_box: index, game_id: game_id, games: games });
    }
};

function replay() {
    player = 0;
    game_id = get_cookie()['game_id']
    socket.emit('replay_game', { data: game_state, player: player, game_id: game_id })
}

function draw() {
    for (var i = 0; i < 81; i++) {
        box = document.getElementById(box_list[i]);
        if (box.innerHTML.replace("\n", '').trim() === "") {
            return false;
        }
    }
    return true;
}

function joinGameHandler(obj) {
    document.getElementById('join_game').submit();
    socket.emit('join', { channel: obj.id });
}

function publicGameHandler(obj) {
    document.forms[obj.id].submit()
    socket.emit('join', { channel: obj.id });
}

function get_cookie() {
    return document.cookie.split(';').map(function (c) {
        return c.trim().split('=').map(decodeURIComponent);
    }).reduce(function (a, b) {
        try {
            a[b[0]] = JSON.parse(b[1]);
        } catch (e) {
            a[b[0]] = b[1];
        }
        return a;
    }, {});
}


socket.on('game_state', function (msg) {
    console.log("Reached game_state.")
    result = get_cookie()
    if (result['game_id'] == msg.data.game_id) {
        console.log("Received state.");
        if ("replay" in msg.data) {
            for (var i = 0; i < 81; i++) {
                box = document.getElementById(box_list[i]);
                box.classList.remove("win1");
                box.classList.remove("win2");
                box.classList.remove("disabled");
                box.innerHTML = "";
                game_state[i] = "";
            }
        }
        else if ("status" in msg.data && msg.data.status != "-1") {
            console.log(msg.data)
            status = msg.data.status;
            game_state = msg.data.data;
            games = msg.data.games;
            console.log(games);
            player = parseInt(msg.data.player);
            turn_span[0].innerHTML = "Player " + String(player) + " is the winner";
            if (!getWinner() && draw() && Object.keys(games['player1']).length == Object.keys(games['player2']).length) {
                res = get_cookie();
                game_id = res['game_id']
                turn_span[0].innerHTML = "Match draw";
                game_over = true
            }
            for (var i = 0; i < 81; i++) {
                box = document.getElementById(box_list[i]);
                box.innerHTML = game_state[i];
                box.classList.add("disabled");
            }
        }
        else {
            game_state = msg.data.data
            last_box = (parseInt(msg.data.last_box) % 9);
            i = parseInt(last_box / 3);
            j = last_box - (i * 3);
            i++;
            j++;
            games = msg.data.games;
            console.log(games);
            game_number = i.toString() + j.toString();
            player = parseInt(msg.data.player);
            if (msg.data.player2_email == '') {
                for (var i = 0; i < 81; i++) {
                    box = document.getElementById(box_list[i]);
                    box.innerHTML = game_state[i];
                    box.classList.add("disabled");
                }
                turn_span[0].innerHTML = "Player 2 is not present.";
            }
            else {
                if (player == 0) {
                    res = get_cookie()
                    if (res['email'] == msg.data.player2_email) {
                        for (var i = 0; i < 81; i++) {
                            box = document.getElementById(box_list[i]);
                            box.innerHTML = game_state[i];
                            box.classList.add("disabled");
                        }
                        if (!getWinner() && draw() && Object.keys(games['player1']).length == Object.keys(games['player2']).length) {
                            res = get_cookie();
                            game_id = res['game_id']
                            turn_span[0].innerHTML = "Match draw";
                            socket.emit('game_status', { status: 2, data: game_state, player: player, game_id: game_id, games: games })
                        }
                    }
                    else {
                        if (!isNaN(last_box)) {
                            for (var i = 0; i < 81; i++) {
                                box = document.getElementById(box_list[i]);
                                box.innerHTML = game_state[i];
                                box.classList.add("disabled");
                            }
                            for (var i = 0; i < 3; i++) {
                                for (var j = 0; j < 3; j++) {
                                    box = document.getElementById(game_number + (i + 1).toString() + (j + 1).toString());
                                    box.classList.remove("disabled");
                                }
                            }
                        }
                        if (!getWinner() && draw() && Object.keys(games['player1']).length == Object.keys(games['player2']).length) {
                            res = get_cookie();
                            game_id = res['game_id']
                            turn_span[0].innerHTML = "Match draw";
                            socket.emit('game_status', { status: 2, data: game_state, player: player, game_id: game_id, games: games })
                        }
                    }
                }
                else {
                    res = get_cookie()
                    if (res['email'] == msg.data.player1_email) {
                        for (var i = 0; i < 81; i++) {
                            box = document.getElementById(box_list[i]);
                            box.innerHTML = game_state[i];
                            box.classList.add("disabled");
                        }
                        if (!getWinner() && draw() && Object.keys(games['player1']).length == Object.keys(games['player2']).length) {
                            res = get_cookie();
                            game_id = res['game_id']
                            turn_span[0].innerHTML = "Match draw";
                            socket.emit('game_status', { status: 2, data: game_state, player: player, game_id: game_id, games: games })
                        }
                    }
                    else {
                        if (!isNaN(last_box)) {
                            for (var i = 0; i < 81; i++) {
                                box = document.getElementById(box_list[i]);
                                box.innerHTML = game_state[i];
                                box.classList.add("disabled");
                            }
                            for (var i = 0; i < 3; i++) {
                                for (var j = 0; j < 3; j++) {
                                    box = document.getElementById(game_number + (i + 1).toString() + (j + 1).toString());
                                    box.classList.remove("disabled");
                                }
                            }
                        }
                        if (!getWinner() && draw() && Object.keys(games['player1']).length == Object.keys(games['player2']).length) {
                            res = get_cookie();
                            game_id = res['game_id']
                            turn_span[0].innerHTML = "Match draw";
                            socket.emit('game_status', { status: 2, data: game_state, player: player, game_id: game_id, games: games })
                        }
                    }
                }
            }
        }
    }
});