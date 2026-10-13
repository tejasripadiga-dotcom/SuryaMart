import "./About.css";

function About() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <p className="about-label">ABOUT SURYAMART</p>

        <h1>
          Shopping Made
          <span> Simple & Stylish.</span>
        </h1>

        <p className="about-description">
          SuryaMart is your destination for fashion,
          footwear and everyday essentials.
          Our goal is to make online shopping simple,
          convenient and enjoyable.
        </p>
      </section>

      <section className="about-values">
        <article className="about-card">
          <span>🎯</span>
          <h2>Our Mission</h2>
          <p>
            Make shopping easy with products that
            suit everyday needs.
          </p>
        </article>

        <article className="about-card">
          <span>⭐</span>
          <h2>Our Values</h2>
          <p>
            Focus on quality, convenience and a
            friendly shopping experience.
          </p>
        </article>

        <article className="about-card">
          <span>🚀</span>
          <h2>Our Vision</h2>
          <p>
            Build a reliable online store that
            customers enjoy using.
          </p>
        </article>
      </section>
    </main>
  );
}

export default About;