const ws = new WebSocket('ws://localhost:2020');
var countDownDate = Date.now() + 3.6e+6;

ws.addEventListener('open', (_) => {
    ws.send('timer');
});

ws.addEventListener('message', (_) => {
    const data = JSON.parse(_.data);
    countDownDate += data.time;
});

let x = setInterval(() => {
    var now = Date.now();
    var distance = countDownDate - now;
    
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById('timer').innerHTML = `${days}:${hours}:${minutes}:${seconds}`;

    if(distance < 0) {
        clearInterval(x);
        document.getElementById('timer').innerHTML = 'DONE!!';
    }
}, 1000);