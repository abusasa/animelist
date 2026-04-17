const canvas = document.getElementById("fluid");
const ctx = canvas.getContext("2d");

resize();
window.addEventListener("resize", resize);

let waves = [];

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

canvas.addEventListener("mousemove", (e) => {
    waves.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        alpha: 1
    });
});

function draw() {
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < waves.length; i++) {
        let w = waves[i];

        ctx.beginPath();
        ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,150,255,${w.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        w.radius += 2;
        w.alpha -= 0.01;

        if (w.alpha <= 0) {
            waves.splice(i, 1);
            i--;
        }
    }

    requestAnimationFrame(draw);
}

draw();