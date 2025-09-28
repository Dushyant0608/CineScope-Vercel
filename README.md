CineScope: A Movie Review & Rating Platform
Welcome to CineScope! This is a modern, interactive web application for discovering, rating, and tracking movies. It was built from the ground up with fundamental web technologies to provide a fast, clean, and fully responsive user experience. All movie data is sourced in real-time from The Movie Database (TMDB).

Live Demo: https://cine-scope-vercel.vercel.app/



About This Project
Movie enthusiasts often struggle with cluttered platforms that are slow and difficult to use on mobile devices. CineScope was created to solve this problem by offering a lightweight, visually engaging, and highly intuitive hub for a user's movie journey. Whether you're looking for the latest blockbusters or trying to keep track of films you want to watch, CineScope provides all the necessary tools in one simple interface.

Major Features
Real-time Search & Discovery: Instantly search for any movie or browse the most popular and top-rated films.

Advanced Sorting & Filtering: Organize movies by popularity, rating, and release date, and filter the results by one or more genres.

Detailed Movie Information: Click on any film to open a detailed modal view with its poster, synopsis, cast, crew, official trailer, and similar movie recommendations.

Personal Watchlist: Add or remove movies from a personal watchlist. Your list is saved directly in your browser using Local Storage, so it's there when you come back.

Ratings and Reviews: Leave a star rating and a written review for any movie, which is also saved locally.

Responsive & Themed: The interface is designed to work beautifully on any device, from a large desktop monitor to a small smartphone. You can also switch between a light and dark theme.

How to Run This Project on Your PC
Follow these simple steps to get the project running on your own machine. The easiest way is using the Live Server extension in Visual Studio Code.

Step 1: Clone the Project
First, clone this repository to your local machine using Git.

git clone [https://github.com/Dushyant0608/CineScope-Vercel.git](https://github.com/Dushyant0608/CineScope-Vercel.git)

Step 2: Get a TMDB API Key
This project requires a free API key from The Movie Database (TMDB) to fetch movie data.

Create an account on themoviedb.org.

Go to your account Settings → API.

Copy your API Key (v3 auth). It's a 32-character string.

Step 3: Configure the Code
You need to add your API key to the project so it can make requests.

Navigate into the project folder:

cd CineScope-Vercel/MovieReview

Open the modules/config.js file.

Paste your API key into the API_KEY variable and ensure the TMDB_BASE is set to the direct URL.

// In modules/config.js
export const API_KEY = 'PASTE_YOUR_32_CHARACTER_API_KEY_HERE';
export const TMDB_BASE = '[https://api.themoviedb.org/3](https://api.themoviedb.org/3)';

Open the modules/api.js file.

Find the fetchJson function and make sure the line that adds the API key is active (not commented out).

// In modules/api.js
url.searchParams.set('api_key', API_KEY);

Step 4: Run the Application
Open the MovieReview folder in Visual Studio Code.

If you don't have it, install the Live Server extension from the VS Code Marketplace.

Right-click the index.html file and select "Open with Live Server".

Your browser will automatically open a new tab with the CineScope application running. Enjoy!
