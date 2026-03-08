document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('startBtn');
    const mirrorToggle = document.getElementById('mirrorToggle');
    const countdownEl = document.getElementById('countdown');
    const flashEl = document.getElementById('flash');
    const statusEl = document.getElementById('status');
    const resultArea = document.getElementById('resultArea');
    const finalImage = document.getElementById('finalImage');
    const downloadBtn = document.getElementById('downloadBtn');
    const dateEl = document.getElementById('currentDate');
    const filterBtns = document.querySelectorAll('.filter-btn');

    let isMirrored = true;
    let videoWidth = 0;
    let videoHeight = 0;
    let currentFilter = "none";

    // Datum setzen
    dateEl.innerText = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });

    // Filter Auswahl
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            let filterValue = btn.getAttribute('data-filter') || "none";
            // Handy-Safe: 100% zu 1 konvertieren
            currentFilter = filterValue.replace('100%', '1');

            video.style.filter = currentFilter === "none" ? "" : currentFilter;
        });
    });

    mirrorToggle.addEventListener('click', () => {
        isMirrored = !isMirrored;
        video.classList.toggle('mirrored', isMirrored);
    });

    // Kamera-Metadaten abgreifen
    video.addEventListener('loadedmetadata', () => {
        videoWidth = video.videoWidth;
        videoHeight = video.videoHeight;
        console.log("Kamera bereit:", videoWidth, "x", videoHeight);
    });

    async function init() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user"
                },
                audio: false
            });
            video.srcObject = stream;
        } catch (err) {
            statusEl.innerText = "Kamera-Zugriff verweigert oder nicht gefunden.";
            console.error("Kamera-Fehler:", err);
        }
    }

    async function takePhoto(index) {
        return new Promise(resolve => {
            let timer = 3;
            countdownEl.innerText = timer;
            countdownEl.classList.remove('hidden');

            const interval = setInterval(() => {
                timer--;
                if (timer === 0) {
                    clearInterval(interval);
                    countdownEl.classList.add('hidden');
                    flashEl.classList.add('flash-active');
                    setTimeout(() => flashEl.classList.remove('flash-active'), 400);

                    // --- MOBILE FILTER FIX ---
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = videoWidth;
                    tempCanvas.height = videoHeight;
                    const tempCtx = tempCanvas.getContext('2d');

                    // Filter auf den Zwischen-Canvas anwenden
                    tempCtx.filter = currentFilter;
                    tempCtx.drawImage(video, 0, 0, videoWidth, videoHeight);

                    // --- POSITIONIERUNG AUF DEM STREIFEN ---
                    const p = 40; // Padding
                    const targetWidth = canvas.width - (p * 2);
                    const targetHeight = (canvas.height - (p * 5)) / 4;
                    const x = p;
                    const y = p + (index * (targetHeight + p));

                    const videoAspectRatio = videoWidth / videoHeight;
                    const targetAspectRatio = targetWidth / targetHeight;

                    let sX, sY, sW, sH;

                    if (videoAspectRatio > targetAspectRatio) {
                        sW = videoHeight * targetAspectRatio;
                        sH = videoHeight;
                        sX = (videoWidth - sW) / 2;
                        sY = 0;
                    } else {
                        sW = videoWidth;
                        sH = videoWidth / targetAspectRatio;
                        sX = 0;
                        sY = (videoHeight - sH) / 2;
                    }

                    ctx.save();
                    ctx.filter = "none"; // Wichtig: Nicht doppelt filtern

                    if (isMirrored) {
                        ctx.translate(x + targetWidth, y);
                        ctx.scale(-1, 1);
                        ctx.drawImage(tempCanvas, sX, sY, sW, sH, 0, 0, targetWidth, targetHeight);
                    } else {
                        ctx.drawImage(tempCanvas, sX, sY, sW, sH, x, y, targetWidth, targetHeight);
                    }

                    ctx.restore();
                    tempCanvas.remove();
                    resolve();
                } else {
                    countdownEl.innerText = timer;
                }
            }, 1000);
        });
    }

    startBtn.addEventListener('click', async () => {
        if (videoWidth === 0) {
            statusEl.innerText = "Kamera lädt noch...";
            return;
        }

        startBtn.disabled = true;
        startBtn.innerText = "Shooting...";
        resultArea.classList.add('hidden');

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < 4; i++) {
            statusEl.innerText = `Pose ${i + 1} kommt gleich...`;
            await takePhoto(i);
        }

        statusEl.innerText = "Streifen wird generiert...";
        setTimeout(() => {
            const data = canvas.toDataURL('image/png');
            finalImage.src = data;
            downloadBtn.href = data;
            downloadBtn.download = `photostrip-${Date.now()}.png`;
            resultArea.classList.remove('hidden');
            statusEl.innerText = "Nimm dein Foto unten aus dem Schlitz!";
            startBtn.disabled = false;
            startBtn.innerText = "Start Shooting";
        }, 1000);
    });

    init();
});