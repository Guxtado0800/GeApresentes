document.addEventListener('DOMContentLoaded', () => {
    const giftGrid = document.getElementById('gift-grid');

    // Função para carregar presentes
    async function loadGifts() {
        try {
            // No GitHub Pages, o caminho será relativo ao index.html
            // Adicionando timestamp para evitar cache durante o desenvolvimento
            const response = await fetch('gifts.json?t=' + new Date().getTime());
            if (!response.ok) throw new Error('Não foi possível carregar a lista de presentes.');
            
            const gifts = await response.json();
            renderGifts(gifts);
        } catch (error) {
            console.error('Erro:', error);
            if (giftGrid) {
                giftGrid.innerHTML = `<div class="error" style="text-align: center; padding: 50px; color: #d9534f;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px;"></i>
                    <p>Ops! Ocorreu um erro ao carregar os presentes.</p>
                    <p><small>${error.message}</small></p>
                </div>`;
            }
        }
    }

    // Função para renderizar os cards
    function renderGifts(gifts) {
        if (!giftGrid) return;
        
        if (gifts.length === 0) {
            giftGrid.innerHTML = '<div class="no-gifts" style="text-align: center; grid-column: 1/-1; padding: 50px;">Nenhum presente na lista ainda.</div>';
            return;
        }

        giftGrid.innerHTML = gifts.map(gift => `
            <div class="gift-card">
                <img src="${gift.image || 'https://via.placeholder.com/300x200?text=Sem+Imagem'}" alt="${gift.name}" class="gift-image" onerror="this.src='https://via.placeholder.com/300x200?text=Imagem+Indisponível'">
                <div class="gift-info">
                    <h3>${gift.name}</h3>
                    <p class="gift-price">${gift.price || 'Preço sob consulta'}</p>
                    <a href="${gift.url}" target="_blank" class="gift-link">Ver Presente <i class="fas fa-external-link-alt" style="font-size: 12px; margin-left: 5px;"></i></a>
                </div>
            </div>
        `).join('');
    }

    if (giftGrid) {
        loadGifts();
    }
});
