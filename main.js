document.addEventListener('DOMContentLoaded', () => {
  const moviesContainer = document.getElementById('movies-container');
  const movieDetails = document.getElementById('movie-details');
  const detailContent = document.getElementById('detail-content');
  const commentsContainer = document.getElementById('comments-container');
  const backButton = document.getElementById('back-button');
  const loadingElement = document.getElementById('loading');
  const errorElement = document.getElementById('error');
  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');
  const addMovieButton = document.getElementById("add-movie-button");
  const addMovieForm = document.getElementById("add-movie-form");
  const homeButton = document.getElementById("home-button");
  const submitButton = document.getElementById("submit-movie");

  let currentPage = 1;
  const moviesPerPage = 25;
  let currentSearch = "";

  const paginationControls = document.createElement('div');
  paginationControls.id = 'pagination-controls';
  paginationControls.style.textAlign = 'center';
  paginationControls.style.marginTop = '20px';
  moviesContainer.after(paginationControls);

  async function fetchMovies(query = "", page = 1) {
    try {
      loadingElement.classList.remove('hidden');
      errorElement.textContent = '';
      moviesContainer.innerHTML = '';
      paginationControls.innerHTML = '';

      let url = `/.netlify/functions/getMovies?page=${page}&limit=${moviesPerPage}`;
      if (query) url += `&search=${encodeURIComponent(query)}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.movies && data.movies.length) {
        renderMovies(data.movies);
        renderPagination(data.total);
      } else {
        errorElement.textContent = 'Nenhum filme encontrado.';
      }
    } catch (error) {
      errorElement.textContent = `Erro: ${error.message}`;
    } finally {
      loadingElement.classList.add('hidden');
    }
  }

  function renderMovies(movies) {
    movies.forEach(movie => {
      const movieCard = document.createElement('div');
      movieCard.className = 'movie-card';
      movieCard.setAttribute('data-id', movie._id);

      const posterUrl = movie.poster?.trim() ? movie.poster : 'not.jpg';
      movieCard.innerHTML = `
        <img src="${posterUrl}" alt="${movie.title}">
        <div class="movie-info">
          <h3>${movie.title}</h3>
          <p>${String(movie.year).match(/\d{4}/)?.[0]}</p>
        </div>
      `;

      movieCard.addEventListener('click', () => {
        fetchMovieDetails(movie._id);
      });

      moviesContainer.appendChild(movieCard);
    });
  }

  function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / moviesPerPage);

    const prevButton = document.createElement('button');
    prevButton.textContent = '← Anterior';
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => {
      currentPage--;
      fetchMovies(currentSearch, currentPage);
    };

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Próxima →';
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => {
      currentPage++;
      fetchMovies(currentSearch, currentPage);
    };

    const pageInfo = document.createElement('span');
    pageInfo.textContent = ` Página ${currentPage} de ${totalPages} `;
    pageInfo.style.margin = "0 10px";

    paginationControls.appendChild(prevButton);
    paginationControls.appendChild(pageInfo);
    paginationControls.appendChild(nextButton);
  }

  async function fetchMovieDetails(id) {
    try {
      const response = await fetch(`/.netlify/functions/getMovie?id=${id}`);
      const data = await response.json();
      renderMovieDetails(data.movie);
      renderComments(data.comments);
      movieDetails.classList.remove('hidden');
      moviesContainer.classList.add('hidden');
      paginationControls.classList.add('hidden');
    } catch (error) {
      errorElement.textContent = `Erro: ${error.message}`;
    }
  }

  function renderMovieDetails(movie) {
    detailContent.innerHTML = `
      <div class="details-header">
      <h2>${movie.title}</h2>
      <button id="edit-movie">Editar</button>
      </div>
      <p><strong>Ano:</strong> ${String(movie.year).match(/\d{4}/)?.[0]}</p>
      <p><strong>Género:</strong> ${movie.genres?.join(', ') || 'N/A'}</p>
      <p><strong>Elenco:</strong> ${movie.cast?.join(', ') || 'N/A'}</p>
      <img src="${movie.poster?.trim() ? movie.poster : 'not.jpg'}" alt="${movie.title}" />
    `;
    detailContent.setAttribute("data-id", movie._id);
  }

  function renderComments(comments) {
    commentsContainer.innerHTML = comments.map(c => {
      const date = new Date(c.date).toLocaleDateString("pt-PT");
      return `
        <div class="comment">
          <p><strong>${c.name}</strong> (${c.email}) <em>${date}</em></p>
          <p>${c.text}</p>
          <button onclick="deleteComment('${c._id}')">Remover</button>
        </div>
      `;
    }).join('');
  }

  backButton.addEventListener('click', () => {
    movieDetails.classList.add('hidden');
    moviesContainer.classList.remove('hidden');
    paginationControls.classList.remove('hidden');
  });

  searchButton.addEventListener('click', () => {
    currentSearch = searchInput.value.trim();
    currentPage = 1;
    fetchMovies(currentSearch, currentPage);
  });

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      currentSearch = searchInput.value.trim();
      currentPage = 1;
      fetchMovies(currentSearch, currentPage);
    }
  });

  addMovieButton.addEventListener("click", () => {
    addMovieForm.classList.remove("hidden");
    movieDetails.classList.add("hidden");
    moviesContainer.classList.add("hidden");
    paginationControls.classList.add("hidden");

    submitButton.textContent = "Guardar";
    delete submitButton.dataset.editing;

    document.getElementById("title").value = "";
    document.getElementById("year").value = "";
    document.getElementById("genres").value = "";
    document.getElementById("cast").value = "";
    document.getElementById("poster").value = "";
  });

  document.getElementById("cancel-add").addEventListener("click", () => {
    addMovieForm.classList.add("hidden");
    moviesContainer.classList.remove("hidden");
    paginationControls.classList.remove("hidden");
  });

  submitButton.addEventListener("click", async () => {
    const title = document.getElementById("title").value.trim();
    const year = document.getElementById("year").value.trim();
    const genres = document.getElementById("genres").value.trim();
    const cast = document.getElementById("cast").value.trim();
    const poster = document.getElementById("poster").value.trim();
    const editingId = submitButton.dataset.editing;
  
    if (!title || !year) return alert("Preenche pelo menos título e ano!");
  
    const movie = { title, year, genres, cast, poster };
  
    if (editingId) {
      movie._id = editingId;
  
      const res = await fetch("/.netlify/functions/updateMovie", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movie),
      });
  
      const result = await res.json();
      if (result.modifiedCount > 0) {
        alert("Filme atualizado com sucesso!");
      } else {
        alert("Nenhuma alteração feita ou erro ao atualizar.");
      }
    } else {
      const res = await fetch("/.netlify/functions/addMovie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movie),
      });
  
      const result = await res.json();
      alert("Filme adicionado com ID: " + result.insertedId);
    }
  
    location.reload();
  });

  homeButton.addEventListener("click", () => {
    currentSearch = "";
    searchInput.value = "";
    currentPage = 1;
    fetchMovies();
    moviesContainer.classList.remove("hidden");
    movieDetails.classList.add("hidden");
    addMovieForm.classList.add("hidden");
    paginationControls.classList.remove("hidden");
  });

  document.getElementById("submit-comment").addEventListener("click", async () => {
    const name = document.getElementById("comment-name").value.trim();
    const email = document.getElementById("comment-email").value.trim();
    const text = document.getElementById("comment-text").value.trim();
    const movieId = detailContent.getAttribute("data-id");

    if (!text || !email) return alert("Preenche todos os campos!");

    const res = await fetch("/.netlify/functions/addComment", {
      method: "POST",
      body: JSON.stringify({ name, email, text, movie_id: movieId })
    });

    const result = await res.json();
    alert("Comentário adicionado!");
    fetchMovieDetails(movieId);
  });

  document.addEventListener("click", (e) => {
    if (e.target.id === "edit-movie") {
      const id = detailContent.getAttribute("data-id");
      const title = detailContent.querySelector("h2").textContent;
      const year = detailContent.querySelector("p:nth-of-type(1)").textContent.replace(/\D/g, '');
      const genres = detailContent.querySelector("p:nth-of-type(2)").textContent.replace("Género:", "").trim();
      const cast = detailContent.querySelector("p:nth-of-type(3)").textContent.replace("Elenco:", "").trim();
      const poster = detailContent.querySelector("img").getAttribute("src");

      document.getElementById("title").value = title;
      document.getElementById("year").value = year;
      document.getElementById("genres").value = genres;
      document.getElementById("cast").value = cast;
      document.getElementById("poster").value = poster;

      submitButton.textContent = "Guardar Alterações";
      submitButton.dataset.editing = id;

      addMovieForm.classList.remove("hidden");
      movieDetails.classList.add("hidden");
      moviesContainer.classList.add("hidden");
    }
  });

  fetchMovies();
});

async function deleteComment(id) {
  const confirmDelete = confirm("Remover este comentário?");
  if (!confirmDelete) return;

  const res = await fetch("/.netlify/functions/deleteComment", {
    method: "DELETE",
    body: JSON.stringify({ id })
  });

  const result = await res.json();
  if (result.deletedCount) {
    const movieId = document.getElementById("detail-content").getAttribute("data-id");
    fetchMovieDetails(movieId);
  }
}
