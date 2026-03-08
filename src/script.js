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
    let videoWidth, videoHeight;
    let currentFilter = "none";

    dateEl.innerText = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });

    // Filter Auswahl
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Wert aus dem data-filter Attribut holen
            currentFilter = btn.getAttribute('data-filter') || "none";

            // Auf Video-Vorschau anwenden (CSS)
            video.style.filter = currentFilter === "none" ? "" : currentFilter;
            console.log("Aktiver Filter:", currentFilter);
        });
    });

    mirrorToggle.addEventListener('click', () => {
        isMirrored = !isMirrored;
        video.classList.toggle('mirrored', isMirrored);
    });

    video.addEventListener('loadedmetadata', () => {
        videoWidth = video.videoWidth;
        videoHeight = video.videoHeight;
    });

    async function init() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
            });
            video.srcObject = stream;
        } catch (err) {
            statusEl.innerText = "Error: No Camera Found";
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

                    // --- MOBILE FIX START ---
                    // 1. Erstelle einen unsichtbaren Hilfs-Canvas in Videogröße
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = videoWidth;
                    tempCanvas.height = videoHeight;
                    const tempCtx = tempCanvas.getContext('2d');

                    // 2. Zeichne das rohe Video ohne Filter auf den Hilfs-Canvas
                    tempCtx.drawImage(video, 0, 0, videoWidth, videoHeight);

                    // --- BERECHNUNG FÜR DEN ZUSCHNITT ---
                    const p = 40;
                    const targetWidth = canvas.width - (p * 2);
                    const targetHeight = (canvas.height - (p * 5)) / 4;
                    const x = p;
                    const y = p + (index * (targetHeight + p));

                    const videoAspectRatio = videoWidth / videoHeight;
                    const targetAspectRatio = targetWidth / targetHeight;

                    let sourceX, sourceY, sourceWidth, sourceHeight;

                    if (videoAspectRatio > targetAspectRatio) {
                        sourceHeight = videoHeight;
                        sourceWidth = videoHeight * targetAspectRatio;
                        sourceX = (videoWidth - sourceWidth) / 2;
                        sourceY = 0;
                    } else {
                        sourceWidth = videoWidth;
                        sourceHeight = videoWidth / targetAspectRatio;
                        sourceX = 0;
                        sourceY = (videoHeight - sourceHeight) / 2;
                    }

                    // 3. Jetzt auf den Haupt-Canvas zeichnen
                    ctx.save();

                    // Filter VOR dem Zeichnen setzen
                    ctx.filter = currentFilter;

                    if (isMirrored) {
                        ctx.translate(x + targetWidth, y);
                        ctx.scale(-1, 1);
                        // WICHTIG: Wir zeichnen hier den tempCanvas, NICHT das Video!
                        ctx.drawImage(tempCanvas, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
                    } else {
                        ctx.drawImage(tempCanvas, sourceX, sourceY, sourceWidth, sourceHeight, x, y, targetWidth, targetHeight);
                    }

                    ctx.restore();
                    // Hilfs-Canvas löschen für Speicherplatz
                    tempCanvas.remove();

                    resolve();
                } else {
                    countdownEl.innerText = timer;
                }
            }, 1000);
        });
    }

    startBtn.addEventListener('click', async () => {
        startBtn.disabled = true;
        resultArea.classList.add('hidden');

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < 4; i++) {
            statusEl.innerText = `Bild ${i + 1} ...`;
            await takePhoto(i);
        }

        statusEl.innerText = "Deine Bilder kommen ...";
        setTimeout(() => {
            const data = canvas.toDataURL('image/png');
            finalImage.src = data;
            downloadBtn.href = data;
            downloadBtn.download = `booth-strip-${Date.now()}.png`;
            resultArea.classList.remove('hidden');
            statusEl.innerText = "Deine Bilder sind unten/ rechts!";
            startBtn.disabled = false;
        }, 1000);
    });

    init();
});