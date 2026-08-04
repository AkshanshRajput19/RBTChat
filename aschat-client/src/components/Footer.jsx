import "./Footer.css";
import {
  FaWhatsapp,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaXTwitter,
  FaEnvelope,
  FaPhoneAlt,
} from "react-icons/fa6";

function Footer() {
  return (
    <footer className="footer">

      <div className="footer-top-line"></div>

      <div className="footer-container">

        {/* Left */}

        <div className="footer-about">

          <div className="footer-logo">

            <div className="footer-logo-box">
              RB
            </div>

            <div>
              <h2>REALBELL Campaign</h2>
            </div>

          </div>

          <p>
            REALBELL Business Campaign AI Platform empowers businesses
            to automate customer engagement and scale seamlessly.
            From smart AI chatbots to campaign management,
            everything in one powerful dashboard.
          </p>

          <div className="footer-socials">

            <a href="#">
              <FaWhatsapp />
            </a>

            <a href="#">
              <FaXTwitter />
            </a>

            <a href="#">
              <FaInstagram />
            </a>

            <a href="#">
              <FaLinkedinIn />
            </a>

            <a href="#">
              <FaYoutube />
            </a>

          </div>

        </div>

        {/* Product */}

        <div className="footer-links">

          <h3>PRODUCT</h3>

          <a href="#">Features</a>

          <a href="#">Pricing</a>

          <a href="#">API Docs</a>

          <a href="#">Changelog</a>

          <a href="#">Roadmap</a>

          <a href="#">Status Page</a>

        </div>

        {/* Company */}

        <div className="footer-links">

          <h3>COMPANY</h3>

          <a href="#">About Us</a>

          <a href="#">Blog</a>

          <a href="#">Careers</a>

          <a href="#">Press Kit</a>

          <a href="#">Partners</a>

          <a href="#">Contact</a>

        </div>

        {/* Support */}

        <div className="footer-links">

          <h3>SUPPORT</h3>

          <a href="#">Help Center</a>

          <a href="#">Tutorials</a>

          <a href="#">Community</a>

          <a href="#">WhatsApp Support</a>

          <a href="#">Report a Bug</a>

        </div>

        {/* Contact */}

        <div className="footer-contact">

          <h3>CONTACT</h3>

          <div className="contact-item">
            <FaEnvelope />
            <span>realbelltechnologies@gmail.com</span>
          </div>

          <div className="contact-item">
            <FaPhoneAlt />
            <span>+91 63774 25973</span>
          </div>

        </div>

      </div>

      <div className="footer-bottom">

        <p>
          © 2026–2030 REALBELL TECHNOLOGIES. All Rights Reserved.
        </p>

        <div className="footer-bottom-links">

          <a href="#">Privacy Policy</a>

          <a href="#">Terms</a>

          <a href="#">Cookies</a>

        </div>

      </div>

    </footer>
  );
}

export default Footer;