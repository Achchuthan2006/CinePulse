/* -------------------------
    Base API Service
--------------------------- */
class ApiService {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async fetchJson(endpoint) {
        const res = await fetch(this.baseUrl + endpoint);
        if (!res.ok) throw new Error("API error: " + res.status);
        return await res.json();
    }
}

/* -------------------------
    Movie Service
    (Studio Ghibli API)
--------------------------- */
class MovieService extends ApiService {
    constructor() {
        super("https://ghibliapi.vercel.app");
        this.fallbackMovies = [
            {
                title: "Spirited Away",
                description: "A young girl enters a spirit world to save her parents and find her way home.",
                year: "2001",
                score: "97",
                poster: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&q=80",
                trailer: "https://www.youtube.com/watch?v=ByXuk9QqQkk"
            },
            {
                title: "My Neighbor Totoro",
                description: "Two sisters meet magical forest spirits while adapting to life in the countryside.",
                year: "1988",
                score: "93",
                poster: "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=800&q=80",
                trailer: "https://www.youtube.com/watch?v=92a7Hj0ijLs"
            },
            {
                title: "Princess Mononoke",
                description: "A prince caught between humans and forest gods seeks balance and peace.",
                year: "1997",
                score: "94",
                poster: "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=800&q=80",
                trailer: "https://www.youtube.com/watch?v=4OiMOHRDs14"
            }
        ];
    }

    async getMovie() {
        try {
            const movies = await this.fetchJson("/films");
            const randomMovie = movies[Math.floor(Math.random() * movies.length)];

            return {
                title: randomMovie.title,
                description: randomMovie.description,
                year: randomMovie.release_date,
                score: randomMovie.rt_score,
                poster: randomMovie.image,
                trailer: randomMovie.movie_banner
            };
        } catch (err) {
            console.warn("Falling back to local movie data", err);
            const randomMovie = this.fallbackMovies[Math.floor(Math.random() * this.fallbackMovies.length)];
            return randomMovie;
        }
    }
}

/* -------------------------
    Quote Service
--------------------------- */
class QuoteService extends ApiService {
    constructor() {
        super("https://dummyjson.com");
        this.fallbackQuotes = [
            { quote: "Do or do not. There is no try.", author: "Yoda" },
            { quote: "It's not who I am underneath, but what I do that defines me.", author: "Batman" },
            { quote: "In every job that must be done, there is an element of fun.", author: "Mary Poppins" },
            { quote: "Fear is the mind-killer.", author: "Frank Herbert" },
            { quote: "With great power comes great responsibility.", author: "Uncle Ben" }
        ];
    }

    async getQuote() {
        try {
            const data = await this.fetchJson("/quotes/random");
            return `"${data.quote}" - ${data.author}`;
        } catch (err) {
            console.warn("Falling back to local quote", err);
            const random = this.fallbackQuotes[Math.floor(Math.random() * this.fallbackQuotes.length)];
            return `"${random.quote}" - ${random.author}`;
        }
    }
}

/* -------------------------
    MovieCard Object Class
--------------------------- */
class MovieCard {
    constructor(data) {
        Object.assign(this, data);
        this.id = Date.now();
    }
}

/* -------------------------
    Main App Class
--------------------------- */
class CinePulseApp {
    constructor() {
        this.movieService = new MovieService();
        this.quoteService = new QuoteService();

        this.history = [];

        this.loadHistory();
        this.cacheDom();
        this.bindEvents();
        this.renderHistory();
    }

    cacheDom() {
        this.genreSelect = document.getElementById("genreSelect");
        this.genreLabel = document.getElementById("genreLabel");

        this.generateBtn = document.getElementById("generateBtn");
        this.clearBtn = document.getElementById("clearBtn");
        this.exportBtn = document.getElementById("exportBtn");

        this.statusMessage = document.getElementById("statusMessage");

        this.posterImg = document.getElementById("posterImage");
        this.posterPlaceholder = document.getElementById("posterPlaceholder");

        this.titleText = document.getElementById("titleText");
        this.descriptionText = document.getElementById("descriptionText");
        this.yearText = document.getElementById("yearText");
        this.scoreText = document.getElementById("scoreText");

        this.quoteText = document.getElementById("quoteText");
        this.trailerBtn = document.getElementById("trailerBtn");

        this.historyList = document.getElementById("historyList");
        this.exportArea = document.getElementById("exportArea");
    }

    bindEvents() {
        this.genreSelect.addEventListener("change", () => {
            this.genreLabel.textContent = "Selected: " + this.genreSelect.value;
        });

        this.generateBtn.addEventListener("click", () => this.generateProfile());
        this.clearBtn.addEventListener("click", () => this.clearHistory());
        this.exportBtn.addEventListener("click", () => this.exportJSON());
    }

    loadHistory() {
        const saved = localStorage.getItem("cinepulse_history");
        if (saved) this.history = JSON.parse(saved);
    }

    saveHistory() {
        localStorage.setItem("cinepulse_history", JSON.stringify(this.history));
    }

    async generateProfile() {
        this.statusMessage.textContent = "Loading...";

        try {
            const [movie, quote] = await Promise.all([
                this.movieService.getMovie(),
                this.quoteService.getQuote()
            ]);

            const profile = new MovieCard({
                ...movie,
                quote,
                genre: this.genreSelect.value
            });

            this.history.push(profile);
            this.saveHistory();

            this.displayProfile(profile);
            this.renderHistory();

            this.statusMessage.textContent = "Profile generated!";
        } catch (err) {
            console.error(err);
            this.statusMessage.textContent = "Error generating profile.";
        }
    }

    displayProfile(p) {
        this.posterPlaceholder.classList.add("hidden");
        this.posterImg.classList.remove("hidden");
        this.posterImg.src = p.poster;

        this.titleText.textContent = p.title;
        this.descriptionText.textContent = p.description;
        this.yearText.textContent = p.year;
        this.scoreText.textContent = p.score;

        this.quoteText.textContent = p.quote;

        this.trailerBtn.disabled = false;
        this.trailerBtn.onclick = () => window.open(p.trailer, "_blank");
    }

    renderHistory() {
        this.historyList.innerHTML = "";

        if (this.history.length === 0) {
            this.historyList.innerHTML = "<li>No history yet.</li>";
            return;
        }

        this.history.forEach(p => {
            const li = document.createElement("li");
            li.textContent = `${p.title} (${p.year}) - Score: ${p.score}`;
            this.historyList.appendChild(li);
        });
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
        this.renderHistory();
    }

    exportJSON() {
        this.exportArea.value = JSON.stringify(this.history, null, 2);
    }
}

window.addEventListener("DOMContentLoaded", () => new CinePulseApp());
