document.addEventListener('DOMContentLoaded', () => {
    // Global state
    let stores = {};
    let tags = {};
    let evaluations = {};
    let currentUser = '';

    // DOM Elements
    const app = document.getElementById('app');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');

    // --- USER MANAGEMENT FROM URL ---
    function getUserFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const userParam = urlParams.get('user');
        if (userParam) {
            return userParam;
        }
        
        const hash = window.location.hash.replace('#', '');
        if (hash.startsWith('user:')) {
            return hash.replace('user:', '');
        }
        
        return 'Usuario';
    }

    function updateUserDisplay() {
        if (userAvatar && userName) {
            userAvatar.textContent = currentUser.charAt(0).toUpperCase();
            userName.textContent = currentUser;
        }
    }

    // --- DATA FETCHING ---
    async function loadInitialData() {
        try {
            const [storesRes, tagsRes] = await Promise.all([
                fetch('tiendas_catalogo_completo.json'),
                fetch('tags.json')
            ]);
            stores = await storesRes.json();
            tags = await tagsRes.json();
        } catch (error) {
            app.innerHTML = '<div class="loading"><p>Error al cargar el catálogo. Inténtalo de nuevo más tarde.</p></div>';
            console.error("Initial data load error:", error);
        }
    }

    async function loadEvaluationsForUser(user) {
        if (!user || user === 'Usuario') {
            evaluations[user] = {};
            return;
        }
        try {
            const response = await fetch(`/api/evaluations/${user}`);
            if (response.ok) {
                evaluations[user] = await response.json();
            } else {
                evaluations[user] = {};
            }
        } catch (error) {
            console.error(`Error loading evaluations for ${user}:`, error);
            evaluations[user] = {};
        }
    }

    // --- RENDERING ---
    function render() {
        let content = '';
        for (const storeId in stores) {
            content += renderStoreSection(stores[storeId], storeId);
        }
        app.innerHTML = content;
    }

    function renderStoreSection(store, storeId) {
        let categoryCarousels = '';
        for (const catName in store.categorias) {
            categoryCarousels += renderCarousel(store.categorias[catName], catName, storeId);
        }
        
        return `
            <section class="store-section fade-in">
                <div class="store-header">
                    <h2 class="store-title">${store.info.name}</h2>
                    <p class="store-description">${store.info.description || 'Colección exclusiva de moda femenina con diseños únicos y calidad premium.'}</p>
                </div>
                ${categoryCarousels}
            </section>
        `;
    }

    function renderCarousel(images, catName, storeId) {
        const cardHtml = images.map(imgPath => getCardHtml(imgPath, storeId, catName)).join('');
        return `
            <div class="carousel-container">
                <div class="carousel-header">
                    <h3 class="category-title">${catName}</h3>
                    <span class="category-count">${images.length} productos</span>
                </div>
                <div class="carousel-track">${cardHtml}</div>
            </div>
        `;
    }

    function getCardHtml(imgPath, storeId, catName) {
        const userEvals = (currentUser && evaluations[currentUser]) ? evaluations[currentUser] : {};
        const evaluation = userEvals[imgPath] || {};
        const starsValue = evaluation.stars || 0;
        const ratingHtml = `
            <div class="rating-section">
                <div class="rating-label">Calificación</div>
                <input type="range" min="0" max="5" value="${starsValue}" class="rating-slider" data-rating>
                <div class="rating-value">${starsValue}/5</div>
            </div>
        `;

        let tagsHtml = '';
        if (evaluation.like === true) {
            tagsHtml = renderTagsSection('like', evaluation.tags || []);
        } else if (evaluation.like === false) {
            tagsHtml = renderTagsSection('dislike', evaluation.tags || []);
        }

        const indicatorEmoji = evaluation.like === true ? '💖' : 
                             evaluation.like === false ? '👎' : '⭕';

        const imageUrl = `stores/${imgPath.replace(/\\/g, '/')}`;

        // Comentario existente
        const commentText = evaluation.comment || '';
        const commentHtml = `
            <div class="comment-section">
                <h4>Comentarios</h4>
                <textarea class="comment-text" placeholder="Escribe tus comentarios aquí...">${commentText}</textarea>
                <div class="comment-actions">
                    <button class="save-comment-btn">Guardar</button>
                    <span class="comment-status"></span>
                </div>
            </div>
        `;

        return `
            <div class="carousel-item" data-img-path="${imgPath}" data-store="${storeId}" data-category="${catName}">
                <div class="card">
                    <div class="image-container" data-image-url="${imageUrl}">
                        <img src="${imageUrl}" loading="lazy" alt="Producto">
                        <div class="evaluation-status">${indicatorEmoji}</div>
                        <div class="zoom-icon">🔍</div>
                    </div>
                    <div class="controls">
                        ${ratingHtml}
                        <div class="like-section">
                            <button class="like-btn ${evaluation.like === true ? 'active' : ''}" data-like="true">👍 Me gusta</button>
                            <button class="dislike-btn ${evaluation.like === false ? 'active' : ''}" data-like="false">👎 No me gusta</button>
                        </div>
                        ${tagsHtml}
                        ${commentHtml}
                    </div>
                </div>
            </div>
        `;
    }

    function renderTagsSection(tagType, selectedTags = []) {
        const title = tagType === 'like' ? '¿Qué te gusta?' : '¿Qué NO te gusta?';
        const tagList = tags[tagType] || [];
        
        return `
            <div class="tags-section">
                <h4>${title}</h4>
                <div class="tags">
                    ${tagList.map(tag => 
                        `<span class="tag ${selectedTags.includes(tag) ? 'active' : ''}" data-tag="${tag}">${tag}</span>`
                    ).join('')}
                </div>
            </div>
        `;
    }

    // FUNCIÓN CLAVE CORREGIDA: Escape de caracteres especiales en selectores
    function escapeCssSelector(string) {
        return string.replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, '\\$&');
    }

    function updateCard(imgPath) {
        // Escapar caracteres especiales en el selector
        const escapedImgPath = escapeCssSelector(imgPath);
        const selector = `[data-img-path="${escapedImgPath}"]`;
        
        const cardElement = document.querySelector(selector);
        if (!cardElement) {
            console.error(`No se encontró card para: ${imgPath}`, `Selector usado: ${selector}`);
            return;
        }

        const userEvals = (currentUser && evaluations[currentUser]) ? evaluations[currentUser] : {};
        const evaluation = userEvals[imgPath] || {};

        // Update like/dislike buttons
        const likeBtn = cardElement.querySelector('.like-btn');
        const dislikeBtn = cardElement.querySelector('.dislike-btn');
        if (likeBtn) likeBtn.classList.toggle('active', evaluation.like === true);
        if (dislikeBtn) dislikeBtn.classList.toggle('active', evaluation.like === false);

        // Update evaluation status emoji
        const statusIndicator = cardElement.querySelector('.evaluation-status');
        if (statusIndicator) {
            statusIndicator.textContent = evaluation.like === true ? '💖' : 
                                          evaluation.like === false ? '👎' : '⭕';
        }

        // Update rating slider and value
        const ratingSlider = cardElement.querySelector('.rating-slider');
        const ratingValue = cardElement.querySelector('.rating-value');
        if (ratingSlider && evaluation.stars !== undefined) {
            ratingSlider.value = evaluation.stars;
        }
        if (ratingValue) {
            ratingValue.textContent = `${evaluation.stars || 0}/5`;
        }

        // Update tags section
        const controlsDiv = cardElement.querySelector('.controls');
        if (!controlsDiv) return;

        // Remove existing tags section
        let tagsSection = controlsDiv.querySelector('.tags-section');
        if (tagsSection) {
            tagsSection.remove();
        }

        // Add new tags section if needed
        let tagsHtml = '';
        if (evaluation.like === true) {
            tagsHtml = renderTagsSection('like', evaluation.tags || []);
        } else if (evaluation.like === false) {
            tagsHtml = renderTagsSection('dislike', evaluation.tags || []);
        }

        if (tagsHtml) {
            // Insertar después de la sección de botones
            const likeSection = controlsDiv.querySelector('.like-section');
            if (likeSection) {
                likeSection.insertAdjacentHTML('afterend', tagsHtml);
            } else {
                // Fallback si no se encuentra la sección de botones
                controlsDiv.insertAdjacentHTML('beforeend', tagsHtml);
            }
        }

        // Actualizar comentario
        const commentTextarea = cardElement.querySelector('.comment-text');
        if (commentTextarea) {
            commentTextarea.value = evaluation.comment || '';
        }
        
        // Actualizar estado de guardado
        const commentStatus = cardElement.querySelector('.comment-status');
        if (commentStatus) {
            commentStatus.textContent = '';
        }
    }

    // --- EVENT HANDLING & LOGIC ---
    async function handleEvaluation(imgPath, data, storeId, categoryName) {
        if (!currentUser || currentUser === 'Usuario') {
            alert('No se pudo identificar el usuario. Asegúrate de que la URL incluya el parámetro ?user=TuNombre');
            return;
        }

        if (!evaluations[currentUser]) evaluations[currentUser] = {};
        
        const existingEval = evaluations[currentUser][imgPath] || {};
        const newEval = { 
            ...existingEval, 
            ...data, 
            store: storeId, 
            category: categoryName 
        };
        
        // Mantener tags existentes si no se están cambiando
        if (data.like !== undefined && data.tags === undefined) {
            newEval.tags = existingEval.tags || [];
        }

        // Agregar manejo de comentarios
        if (data.comment !== undefined) {
            newEval.comment = data.comment;
        }
        
        // Actualizar en memoria
        evaluations[currentUser][imgPath] = newEval;

        // Actualizar la UI
        updateCard(imgPath);

        // Guardar en el servidor
        try {
            await fetch('/api/evaluations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    ...newEval, 
                    user: currentUser, 
                    image: imgPath 
                })
            });
        } catch (error) {
            console.error("Save evaluation error:", error);
        }
    }

    // --- EVENT LISTENERS ---
    app.addEventListener('click', (e) => {
        const target = e.target;
        const card = target.closest('[data-img-path]');
        if (!card) return;

        const imgPath = card.dataset.imgPath;
        const storeId = card.dataset.store;
        const category = card.dataset.category;

        // Handle image zoom
        if (target.matches('.image-container, .image-container img, .zoom-icon')) {
            const imageContainer = target.closest('.image-container') || target;
            const imageUrl = imageContainer.dataset.imageUrl || target.src;
            openImageModal(imageUrl);
            return;
        }

        e.stopPropagation();

        const currentEval = (evaluations[currentUser] && evaluations[currentUser][imgPath]) ? 
            evaluations[currentUser][imgPath] : {};

        if (target.matches('.like-btn')) {
            const newLikeState = currentEval.like === true ? null : true;
            handleEvaluation(imgPath, { 
                like: newLikeState,
                tags: currentEval.tags || [] // Mantener tags existentes
            }, storeId, category);
        } else if (target.matches('.dislike-btn')) {
            const newLikeState = currentEval.like === false ? null : false;
            handleEvaluation(imgPath, { 
                like: newLikeState,
                tags: currentEval.tags || [] // Mantener tags existentes
            }, storeId, category);
        } else if (target.matches('.tag')) {
            const tag = target.dataset.tag;
            const currentTags = currentEval.tags || [];
            const newTags = currentTags.includes(tag) 
                ? currentTags.filter(t => t !== tag) 
                : [...currentTags, tag];
            handleEvaluation(imgPath, { tags: newTags }, storeId, category);
        }
        // Manejar botón de guardar comentario
        else if (target.matches('.save-comment-btn')) {
            const commentText = card.querySelector('.comment-text').value;
            const commentStatus = card.querySelector('.comment-status');
            if (commentStatus) {
                commentStatus.textContent = 'Guardando...';
                commentStatus.style.color = '#888';
            }
            setTimeout(() => {
                handleEvaluation(imgPath, { comment: commentText }, storeId, category);
                if (commentStatus) {
                    commentStatus.textContent = '✓ Guardado';
                    commentStatus.style.color = '#10b981';
                    setTimeout(() => {
                        commentStatus.textContent = '';
                    }, 2000);
                }
            }, 300);
        }
    });

    app.addEventListener('input', (e) => {
        if (e.target.matches('.rating-slider')) {
            const rating = parseInt(e.target.value);
            const ratingValue = e.target.parentElement.querySelector('.rating-value');
            if (ratingValue) ratingValue.textContent = `${rating}/5`;
            
            const card = e.target.closest('[data-img-path]');
            if (card) {
                const imgPath = card.dataset.imgPath;
                const storeId = card.dataset.store;
                const category = card.dataset.category;
                handleEvaluation(imgPath, { stars: rating }, storeId, category);
            }
        }
    });

    // --- IMAGE MODAL ---
    function createImageModal() {
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close">×</button>
                <img class="modal-image" src="" alt="Imagen ampliada">
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    function openImageModal(imageUrl) {
        let modal = document.querySelector('.image-modal');
        if (!modal) modal = createImageModal();

        const modalImage = modal.querySelector('.modal-image');
        modalImage.src = imageUrl;
        modal.classList.add('active');

        const closeModal = () => modal.classList.remove('active');
        modal.querySelector('.modal-close').onclick = closeModal;
        modal.onclick = (e) => e.target === modal && closeModal();
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        }, { once: true });
    }

    // --- INITIALIZATION ---
    async function init() {
        currentUser = getUserFromURL();
        updateUserDisplay();
        await loadInitialData();
        await loadEvaluationsForUser(currentUser);
        render();
    }

    init();
});
app.post('/api/evaluations', (req, res) => {
  console.log('BODY RECIBIDO:', req.body); // <-- Agrega esto

  const { user, store, category, image, like, stars, tags, trip, comment } = req.body;

  if (!user || !store || !image || !category) {
    return res.status(400).json({ error: 'Faltan datos requeridos (user, store, category, image).' });
  }

  const timestamp = new Date().toISOString();
  const tagsJson = JSON.stringify(tags || []);

  const sql = `INSERT OR REPLACE INTO evaluations (user, store_name, category, image_path, liked, score, tags, trip, timestamp, comment)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const params = [user, store, category, image, like, stars, tagsJson, trip, timestamp, comment];

  db.run(sql, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true, id: this.lastID });
  });
});