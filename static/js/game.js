var socket = io("http://127.0.0.1:5000");

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

window.onload = (event) => {
    console.log("Get state.");
    res = get_cookie();
    game_id = res['game_id'];
    console.log(game_id)
    socket.emit("get_state", { game_id: game_id });
}

window.onbeforeunload = (event) => {
    res = get_cookie();
    game_id = res['game_id'];
    socket.emit('leave_room', { game_id: game_id });
}