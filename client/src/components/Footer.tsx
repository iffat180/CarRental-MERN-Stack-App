import React from "react";
import { assets } from "../assets/assets";

const Footer = () => {
  return (
    <footer className="px-6 md:px-16 lg:px-24 xl:px-32 mt-60 text-sm text-gray-500" role="contentinfo">
      <div className="flex flex-wrap justify-between items-start gap-8 pb-6 border-borderColor border-b">
        <div>
          <img src={assets.logo} alt="Car Rental Logo" className="h-8 md:h-9" />
          <p className="max-w-80 mt-3">
            Premium car rental service with a wide selection of luxury and
            everyday vehicles for all your driving needs.
          </p>
          <nav aria-label="Social media links" className="mt-6">
            <div className="flex items-center gap-3">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Visit our Facebook page"
                className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                <img src={assets.facebook_logo} className="w-5 h-5" alt="" aria-hidden="true" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Visit our Instagram page"
                className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                <img
                  src={assets.instagram_logo}
                  className="w-5 h-5"
                  alt=""
                  aria-hidden="true"
                />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Visit our Twitter page"
                className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                <img src={assets.twitter_logo} className="w-5 h-5" alt="" aria-hidden="true" />
              </a>
              <a 
                href="mailto:info@example.com" 
                aria-label="Send us an email"
                className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                <img src={assets.gmail_logo} className="w-5 h-5" alt="" aria-hidden="true" />
              </a>
            </div>
          </nav>
        </div>
        <nav aria-label="Quick links">
          <h2 className="text-base font-medium text-gray-800 uppercase">
            Quick Links
          </h2>
          <ul className="mt-3 flex flex-col gap-1.5">
            <li>
              <a href="/" className="hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded">Home</a>
            </li>
            <li>
              <a href="/cars" className="hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded">Browse Cars</a>
            </li>
            <li>
              <a href="/owner/add-car" className="hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded">List Your Car</a>
            </li>
            <li>
              <a href="#about" className="hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded">About Us</a>
            </li>
          </ul>
        </nav>

        <nav aria-label="Resources">
          <h2 className='text-base font-medium text-gray-800 uppercase'>Resources</h2>
          <ul className='mt-3 flex flex-col gap-1.5'>
            <li><a href="#help" className="hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded">Help Center</a></li>
            <li><a href="#terms" className="hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded">Terms of Service</a></li>
            <li><a href="#privacy" className="hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded">Privacy Policy</a></li>
            <li><a href="#insurance" className="hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded">Insurance</a></li>
          </ul>
        </nav>

        <address className="not-italic">
          <h2 className='text-base font-medium text-gray-800 uppercase'>Contact</h2>
          <ul className='mt-3 flex flex-col gap-1.5'>
            <li>1234 Luxury Drive</li>
            <li>San Francisco, CA 94107</li>
            <li><a href="tel:+1234567890" className="hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded">+1 234 567890</a></li>
            <li><a href="mailto:info@example.com" className="hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded">info@example.com</a></li>
          </ul>
        </address>


        



      </div>
      <div className="flex flex-col md:flex-row gap-2 items-center justify-between py-5">
        <p>
          © {new Date().getFullYear()}{" "}
          <a 
            href="https://prebuiltui.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          >
            PrebuiltUI
          </a>. All rights reserved.
        </p>
        <nav aria-label="Footer links">
          <ul className="flex items-center gap-4">
            <li>
              <a href="#privacy" className="hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded">Privacy</a> 
            </li>
            <li>
              <a href="#terms" className="hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded">Terms</a>
            </li>
            <li>
              <a href="#sitemap" className="hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded">Sitemap</a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
