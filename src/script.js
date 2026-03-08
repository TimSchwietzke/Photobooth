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

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter') || "none";
            video.style.filter = currentFilter === "none" ? "" : currentFilter;
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

    function cssFilterToSVGDefs(filter) {
        if (filter.includes('grayscale')) {
            return `<filter id="f"><feColorMatrix type="saturate" values="0"/></filter>`;
        }
        if (filter.includes('sepia')) {
            return `<filter id="f">
                <feColorMatrix type="matrix" values="
                    0.393 0.769 0.189 0 0
                    0.349 0.686 0.168 0 0
                    0.272 0.534 0.131 0 0
                    0     0     0     1 0"/>
                <feComponentTransfer>
                    <feFuncR type="linear" slope="1.1"/>
                    <feFuncG type="linear" slope="1.1"/>
                    <feFuncB type="linear" slope="1.1"/>
                </feComponentTransfer>
            </filter>`;
        }
        if (filter.includes('saturate')) {
            return `<filter id="f">
                <feComponentTransfer>
                    <feFuncR type="linear" slope="1.2" intercept="-0.1"/>
                    <feFuncG type="linear" slope="1.2" intercept="-0.1"/>
                    <feFuncB type="linear" slope="1.2" intercept="-0.1"/>
                </feComponentTransfer>
                <feColorMatrix type="saturate" values="1.3"/>
                <feComponentTransfer>
                    <feFuncR type="linear" slope="1.1"/>
                    <feFuncG type="linear" slope="1.1"/>
                    <feFuncB type="linear" slope="1.1"/>
                </feComponentTransfer>
            </filter>`;
        }
        return `<filter id="f"></filter>`;
    }

    function drawFrameWithFilter(sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight) {
        return new Promise((resolve) => {

            // Schritt 1: Video-Frame (+ Spiegelung) in Zwischen-Canvas
            const tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = destWidth;
            tmpCanvas.height = destHeight;
            const tmpCtx = tmpCanvas.getContext('2d');

            if (isMirrored) {
                tmpCtx.translate(destWidth, 0);
                tmpCtx.scale(-1, 1);
            }
            tmpCtx.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, destWidth, destHeight);

            if (!currentFilter || currentFilter === "none") {
                ctx.drawImage(tmpCanvas, destX, destY);
                resolve();
                return;
            }

            // Schritt 2: ctx.filter versuchen und per Pixel-Vergleich prüfen
            const testCanvas = document.createElement('canvas');
            testCanvas.width = destWidth;
            testCanvas.height = destHeight;
            const testCtx = testCanvas.getContext('2d');
            testCtx.filter = currentFilter;
            testCtx.drawImage(tmpCanvas, 0, 0);
            testCtx.filter = 'none';

            const cx = Math.floor(destWidth / 2);
            const cy = Math.floor(destHeight / 2);
            const orig = tmpCtx.getImageData(cx, cy, 1, 1).data;
            const filtered = testCtx.getImageData(cx, cy, 1, 1).data;
            const filterWorked = orig[0] !== filtered[0] || orig[1] !== filtered[1] || orig[2] !== filtered[2];

            if (filterWorked) {
                ctx.drawImage(testCanvas, destX, destY);
                resolve();
                return;
            }

            // Schritt 3: SVG-Filter Fallback (Mobile)
            const dataURL = tmpCanvas.toDataURL('image/png');
            const svgDefs = cssFilterToSVGDefs(currentFilter);
            const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${destWidth}" height="${destHeight}">
                <defs>${svgDefs}</defs>
                <image href="${dataURL}" width="${destWidth}" height="${destHeight}" filter="url(#f)"/>
            </svg>`;

            const blob = new Blob([svgString], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const img = new Image();

            img.onload = () => {
                ctx.drawImage(img, destX, destY);
                URL.revokeObjectURL(url);
                resolve();
            };
            img.onerror = () => {
                ctx.drawImage(tmpCanvas, destX, destY);
                URL.revokeObjectURL(url);
                resolve();
            };
            img.src = url;
        });
    }

    async function takePhoto(index) {
        return new Promise(resolve => {
            let timer = 3;
            countdownEl.innerText = timer;
            countdownEl.classList.remove('hidden');

            const interval = setInterval(async () => {
                timer--;
                if (timer === 0) {
                    clearInterval(interval);
                    countdownEl.classList.add('hidden');
                    flashEl.classList.add('flash-active');
                    setTimeout(() => flashEl.classList.remove('flash-active'), 400);

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

                    await drawFrameWithFilter(sourceX, sourceY, sourceWidth, sourceHeight, x, y, targetWidth, targetHeight);
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

    init();
});