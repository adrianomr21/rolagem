document.addEventListener('DOMContentLoaded', () => {
    // Importa o jsPDF do objeto window, já que foi carregado via CDN
    const { jsPDF } = window.jspdf;

    // Elementos da UI
    const startButton = document.getElementById('start-capture');
    const captureButton = document.getElementById('capture-frame');
    const generatePdfButton = document.getElementById('generate-pdf');
    const videoElement = document.getElementById('video');
    const previewContainer = document.getElementById('preview-container');

    let capturedFrames = [];
    let mediaStream = null;

    // --- 1. Iniciar a Captura de Tela ---
    startButton.addEventListener('click', async () => {
        try {
            // Pede ao usuário para selecionar uma tela/janela/aba para capturar
            mediaStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always' // Mostra o cursor do mouse na captura
                },
                audio: false
            });

            // Associa o stream de vídeo ao elemento <video> oculto
            videoElement.srcObject = mediaStream;
            videoElement.play();

            // Habilita/desabilita os botões apropriados
            startButton.disabled = true;
            captureButton.disabled = false;
            generatePdfButton.disabled = true; // Desabilita até que o primeiro frame seja capturado

        } catch (err) {
            console.error("Erro ao iniciar a captura de tela:", err);
            alert("Você precisa permitir a captura de tela para usar a ferramenta.");
        }
    });

    // --- 2. Capturar um Frame ---
    captureButton.addEventListener('click', () => {
        if (!mediaStream || !videoElement.srcObject) {
            alert("A captura não foi iniciada. Clique em 'Iniciar Captura' primeiro.");
            return;
        }

        // Cria um canvas temporário para desenhar o frame atual do vídeo
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // Converte o conteúdo do canvas para uma imagem em formato Data URL (JPEG)
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95); // Qualidade 95%

        // Adiciona o frame ao nosso array
        capturedFrames.push(imageDataUrl);

        // Cria uma miniatura para feedback visual do usuário
        const img = document.createElement('img');
        img.src = imageDataUrl;
        img.title = `Frame ${capturedFrames.length}`;
        previewContainer.appendChild(img);

        // Habilita o botão de gerar PDF agora que temos pelo menos um frame
        generatePdfButton.disabled = false;
    });

    // --- 3. Gerar o PDF ---
    generatePdfButton.addEventListener('click', () => {
        if (capturedFrames.length === 0) {
            alert("Nenhum frame foi capturado. Clique em 'Capturar Frame' para adicionar imagens.");
            return;
        }

        // Pega as dimensões do primeiro frame para definir o tamanho do PDF
        const firstImage = new Image();
        firstImage.src = capturedFrames[0];
        
        firstImage.onload = () => {
            const imgWidth = firstImage.width;
            const imgHeight = firstImage.height;
            const orientation = imgWidth > imgHeight ? 'l' : 'p'; // 'l' para paisagem, 'p' para retrato

            // Cria o PDF com as dimensões da imagem
            const pdf = new jsPDF({
                orientation: orientation,
                unit: 'px', // Usa pixels como unidade
                format: [imgWidth, imgHeight]
            });

            // Adiciona cada frame ao PDF
            capturedFrames.forEach((frameDataUrl, index) => {
                if (index > 0) {
                    pdf.addPage([imgWidth, imgHeight], orientation);
                }
                pdf.addImage(frameDataUrl, 'JPEG', 0, 0, imgWidth, imgHeight);
            });

            // Salva o arquivo
            pdf.save('captura_de_rolagem.pdf');

            // Limpa o estado para uma nova captura
            resetCapture();
        };
    });

    function resetCapture() {
        // Para o stream de mídia
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
        mediaStream = null;
        videoElement.srcObject = null;

        // Limpa os frames e as miniaturas
        capturedFrames = [];
        previewContainer.innerHTML = '';

        // Reseta os botões para o estado inicial
        startButton.disabled = false;
        captureButton.disabled = true;
        generatePdfButton.disabled = true;
    }
});
