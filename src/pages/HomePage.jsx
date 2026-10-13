import "./Home.css";

function Home() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-content">
          <p className="home-subtitle">
            WELCOME TO SURYAMART
          </p>

          <h1>
            Discover Your
            <span> Perfect Style.</span>
          </h1>

          <p className="home-description">
            Explore fashion, footwear and everyday essentials
            at amazing prices.
          </p>

          <a href="/products" className="home-shop-button">
            Explore Products →
          </a>
        </div>
      </section>

      <section className="home-categories">
        <p className="home-subtitle">EXPLORE OUR STORE</p>

        <h2>Everything You Love, In One Place</h2>

        <div className="home-category-grid">
          <article className="home-category-card">
            <span>👕</span>
            <h3>Fashion</h3>
            <p>Discover your everyday style.</p>
          </article>

          <article className="home-category-card">
            <span>👟</span>
            <h3>Footwear</h3>
            <p>Find comfort in every step.</p>
          </article>

          <article className="home-category-card">
            <span>🎒</span>
            <h3>Accessories</h3>
            <p>Complete your perfect look.</p>
          </article>
        </div>
      </section>
    </main>
  );
}

export default Home;