import React from "react";
import { Container, Image } from "react-bootstrap";
import {
  BsInstagram,
  BsLinkedin,
  BsGeoAltFill,
  BsBookHalf,
  BsTv,
  BsChatDotsFill,
} from "react-icons/bs";

const faculties = [
  {
    label: "Fakultas Teknik",
    url: "https://mercubuana.ac.id/fakultas-teknik",
  },
  {
    label: "Fakultas Ekonomi dan Bisnis",
    url: "https://mercubuana.ac.id/fakultas-ekonomi-dan-bisnis",
  },
  {
    label: "Fakultas Ilmu Komunikasi",
    url: "https://mercubuana.ac.id/fakultas-ilmu-komunikasi",
  },
  {
    label: "Fakultas Ilmu Komputer",
    url: "https://mercubuana.ac.id/fakultas-ilmu-komputer",
  },
  {
    label: "Fakultas Psikologi",
    url: "https://mercubuana.ac.id/fakultas-psikologi",
  },
  {
    label: "Fakultas Desain & Seni Kreatif",
    url: "https://mercubuana.ac.id/fakultas-desain-dan-seni-kreatif",
  },
];

const campuses = [
  {
    label: "Kampus Meruya",
    url: "https://maps.app.goo.gl/L1TDd4GmSu2bvFcs8",
  },
  {
    label: "Kampus Menteng",
    url: "https://maps.app.goo.gl/m9CiYXH9fShhWDRr8",
  },
  {
    label: "Kampus Warung Buncit",
    url: "https://maps.app.goo.gl/Pc6w5wHqN88qsJCR7",
  },
];

const links = [
  {
    label: "Perpustakaan",
    url: "https://lib.mercubuana.ac.id/id",
  },
  {
    label: "Repositori Daring",
    url: "https://repository.mercubuana.ac.id/",
  },
  {
    label: "Jurnal UMB",
    url: "https://publikasi.mercubuana.ac.id/?target=_blank",
  },
];

const media = [
  {
    label: "Mercu TV",
    url: "https://www.youtube.com/@mercutvofficial",
  },
  {
    label: "Briton",
    url: "https://britonmercubuana.co.id/",
  },
  {
    label: "Dormitory",
    url: "http://mercubuana.ac.id/#",
  },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-accent footer-accent-green" />
      <div className="footer-accent footer-accent-blue" />

      <Container className="footer-content">
        <div className="footer-about">
          <div className="footer-logo-wrap">
            {/* <div className="footer-logo-mark">UMB</div>
            <div>
              <h3>Universitas Mercu Buana</h3>
              <span>Asisten Akademik</span>
            </div> */}
            <Image
              src="https://agv-api.mercubuana.ac.id//uploads/media/file-1767686801694-219405964.png"
              alt="Universitas Mercu Buana"
            />
          </div>

          <p>
            Universitas Mercu Buana adalah Perguruan Tinggi Swasta yang
            menyelenggarakan Tridharma Perguruan Tinggi yaitu pendidikan,
            penelitian, dan pengabdian kepada masyarakat.
          </p>

          <div className="footer-social">
            <strong>Follow Us</strong>
            <a
              href="https://instagram.com/univmercubuana"
              aria-label="Instagram"
            >
              <BsInstagram />
            </a>
            <a
              href="https://www.linkedin.com/school/universitas-mercu-buana"
              aria-label="LinkedIn"
            >
              <BsLinkedin />
            </a>
          </div>
        </div>

        <div className="footer-column">
          <h4>Fakultas</h4>
          {faculties.map((item) => (
            <a
              href={item.url}
              key={item.label}
              target="_blank"
              rel="noreferrer"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="footer-column">
          <h4>Lokasi Kampus</h4>
          {campuses.map((item) => (
            <a
              href={item.url}
              key={item.label}
              target="_blank"
              rel="noreferrer"
            >
              <BsGeoAltFill />
              {item.label}
            </a>
          ))}
        </div>

        <div className="footer-column">
          <h4>Tautan</h4>
          {links.map((item) => (
            <a
              href={item.url}
              key={item.label}
              target="_blank"
              rel="noreferrer"
            >
              <BsBookHalf />
              {item.label}
            </a>
          ))}
        </div>

        <div className="footer-column">
          <h4>Media</h4>
          {media.map((item) => (
            <a
              href={item.url}
              key={item.label}
              target="_blank"
              rel="noreferrer"
            >
              <BsTv />
              {item.label}
            </a>
          ))}
        </div>
      </Container>

      <Container className="footer-bottom">
        <span>© 2026 Asisten Akademik UMB. Semua hak dilindungi.</span>

        <div>
          <a href="https://mercubuana.ac.id/syarat-dan-ketentuan">
            Syarat dan Ketentuan
          </a>
          <a href="https://mercubuana.ac.id/kebijakan-privasi">
            Kebijakan Privasi
          </a>
        </div>
      </Container>

      <a
        className="floating-admin"
        href="https://wa.me/628119852020"
        aria-label="Tanya Admin"
      >
        <BsChatDotsFill />
        <span>Tanya Admin</span>
      </a>
    </footer>
  );
}
