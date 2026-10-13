import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <h2>
          SURYA<span>MART</span>
        </h2>

        <p>
          Your destination for fashion and everyday essentials.
        </p>
      </div>

      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} SuryaMart.
          All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;