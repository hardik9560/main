document.addEventListener('DOMContentLoaded', function() {
    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const toggleIcon = document.getElementById('toggle-icon');
    
    // Check for saved theme preference or use preferred color scheme
    const currentTheme = localStorage.getItem('theme') || 
                        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    // Apply the current theme
    if (currentTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.checked = true;
        toggleIcon.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        toggleIcon.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Theme toggle event
    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            toggleIcon.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            toggleIcon.innerHTML = '<i class="fas fa-sun"></i>';
        }
    });

    // Scroll Progress Bar
    window.onscroll = function() {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        document.getElementById("myBar").style.width = scrolled + "%";
    };

    // Initialize Particles.js
    if (document.getElementById('particles-js')) {
        particlesJS('particles-js', {
            "particles": {
                "number": {
                    "value": 80,
                    "density": {
                        "enable": true,
                        "value_area": 800
                    }
                },
                "color": {
                    "value": "#ffffff"
                },
                "shape": {
                    "type": "circle",
                    "stroke": {
                        "width": 0,
                        "color": "#000000"
                    }
                },
                "opacity": {
                    "value": 0.5,
                    "random": false
                },
                "size": {
                    "value": 3,
                    "random": true
                },
                "line_linked": {
                    "enable": true,
                    "distance": 150,
                    "color": "#ffffff",
                    "opacity": 0.4,
                    "width": 1
                },
                "move": {
                    "enable": true,
                    "speed": 2,
                    "direction": "none",
                    "random": false,
                    "straight": false,
                    "out_mode": "out"
                }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": {
                    "onhover": {
                        "enable": true,
                        "mode": "grab"
                    },
                    "onclick": {
                        "enable": true,
                        "mode": "push"
                    },
                    "resize": true
                },
                "modes": {
                    "grab": {
                        "distance": 140,
                        "line_linked": {
                            "opacity": 1
                        }
                    },
                    "push": {
                        "particles_nb": 4
                    }
                }
            },
            "retina_detect": true
        });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Close mobile menu if open
                const navbarCollapse = document.querySelector('.navbar-collapse.show');
                if (navbarCollapse) {
                    const bsCollapse = new bootstrap.Collapse(navbarCollapse);
                    bsCollapse.hide();
                }
                
                // Smooth scroll to target
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Navbar background change on scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Add navbar scrolled class if page is loaded with scroll position
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    }

    // Form submission handling
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;
            
            // Here you would typically send the form data to a server
            // For this example, we'll just show a success message
            Swal.fire({
                title: 'Thank you!',
                text: 'Your message has been sent successfully.',
                icon: 'success',
                confirmButtonColor: 'var(--primary-color)'
            });
            
            // Reset form
            this.reset();
        });
    }

    // Project modal handling
    const viewDetailsButtons = document.querySelectorAll('.view-details');
    const projectModal = new bootstrap.Modal(document.getElementById('projectModal'));
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const liveDemoBtn = document.getElementById('liveDemoBtn');

    // Project data
    const projects = {
        ecommerce: {
            title: "E-commerce Website",
            content: `
                <img src="images/ecom.png" class="img-fluid mb-4" alt="E-commerce Website">
                <h6>Project Details:</h6>
                <ul>
                    <li>Created and maintained a fully functional website using modern web technologies including HTML5, CSS3, JavaScript, and Bootstrap for responsive design and layout.</li>
                    <li>Implemented interactive features and dynamic user experiences through client-side scripting and DOM manipulation.</li>
                    <li>Integrated secure and reliable payment gateways using pre-built plugins, ensuring encrypted transactions and customer data protection.</li>
                    <li>Handled ₹10K/month in e-commerce transactions securely.</li>
                    <li>Managed and optimized digital advertising campaigns on Google Ads and Facebook Ads.</li>
                </ul>
                <h6 class="mt-4">Technologies Used:</h6>
                <div class="tech-tags">
                    <span class="badge bg-primary">HTML5</span>
                    <span class="badge bg-primary">CSS3</span>
                    <span class="badge bg-primary">JavaScript</span>
                    <span class="badge bg-primary">Bootstrap</span>
                </div>
            `,
            liveUrl: "new ecom/index.html"
        },
        wordpress: {
            title: "WordPress Movie Website",
            content: `
                <img src="images/hmovie.png" class="img-fluid mb-4" alt="WordPress Movie Website">
                <h6>Project Details:</h6>
                <ul>
                    <li>Constructed a multi-page movie website using the WordPress platform, leveraging free hosting services to keep costs minimal while delivering a professional user experience.</li>
                    <li>Designed a visually engaging landing page as the central entry point, guiding users to content-rich subpages focused on movie-related topics.</li>
                    <li>Integrated multiple linked pages to organize content effectively and improve site navigation.</li>
                    <li>Selected and implemented WordPress plugins to enhance functionality.</li>
                    <li>Increased website traffic by 40% using SEO strategies.</li>
                </ul>
                <h6 class="mt-4">Technologies Used:</h6>
                <div class="tech-tags">
                    <span class="badge bg-primary">WordPress</span>
                    <span class="badge bg-primary">CSS</span>
                    <span class="badge bg-primary">JavaScript</span>
                    <span class="badge bg-primary">SEO</span>
                </div>
            `,
            liveUrl: "Movie Website/index.html"
        },
        video: {
            title: "Video Calling Website",
            content: `
                <img src="images/vc.png" class="img-fluid mb-4" alt="Video Calling Website">
                <h6>Project Details:</h6>
                <ul>
                    <li>Built a video calling website using JavaScript for front-end interactivity and PHP to handle device connectivity and session management.</li>
                    <li>Implemented core video call features such as audio muting, speaker output control, and interactive pop-up windows to improve the user experience.</li>
                    <li>Designed an intuitive and responsive user interface (UI) using vanilla JavaScript and modern web design practices.</li>
                    <li>Reduced load time by 1.5s with performance tuning.</li>
                </ul>
                <h6 class="mt-4">Technologies Used:</h6>
                <div class="tech-tags">
                    <span class="badge bg-primary">JavaScript</span>
                    <span class="badge bg-primary">PHP</span>
                    <span class="badge bg-primary">WebRTC</span>
                </div>
            `,
            liveUrl: "video calling web/index.html"
        }
    };

    // Add click event to view details buttons
    viewDetailsButtons.forEach(button => {
        button.addEventListener('click', function() {
            const projectId = this.getAttribute('data-project');
            const project = projects[projectId];
            
            modalTitle.textContent = project.title;
            modalBody.innerHTML = project.content;
            liveDemoBtn.setAttribute('onclick', `window.open('${project.liveUrl}', '_blank')`);
            
            projectModal.show();
        });
    });

    // GSAP Animations
    gsap.registerPlugin(ScrollTrigger);

    // Animate sections on scroll
    gsap.utils.toArray('section').forEach(section => {
        gsap.from(section, {
            scrollTrigger: {
                trigger: section,
                start: "top 80%",
                toggleActions: "play none none none"
            },
            opacity: 0,
            y: 50,
            duration: 1
        });
    });

    // Animate skill bars
    gsap.utils.toArray('.progress-bar').forEach(bar => {
        const width = bar.getAttribute('data-width');
        ScrollTrigger.create({
            trigger: bar,
            start: "top 80%",
            onEnter: () => {
                gsap.to(bar, {
                    width: width + '%',
                    duration: 1.5,
                    ease: "power2.out"
                });
            }
        });
    });

    // Animate project cards
    gsap.utils.toArray('.project-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: "top 80%",
                toggleActions: "play none none none"
            },
            opacity: 0,
            y: 50,
            duration: 0.5,
            delay: i * 0.1
        });
    });
});