// DOM이 완전히 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
    // Preloader 설정
    const preloader = document.getElementById('preloader');
    const binaryContainer = document.getElementById('binary-container');
    
    // 바이너리 텍스트 생성 함수
    function createBinaryText() {
        const text = document.createElement('div');
        text.className = 'binary-text';
        text.style.left = Math.random() * 100 + 'vw';
        text.style.top = Math.random() * 100 + 'vh';
        text.textContent = Math.random().toString(2).substr(2, 8);
        text.style.opacity = Math.random();
        binaryContainer.appendChild(text);
        
        // 일정 시간 후 제거
        setTimeout(() => {
            text.remove();
        }, 2000);
    }

    // 바이너리 텍스트 애니메이션
    const binaryInterval = setInterval(() => {
        createBinaryText();
    }, 100);

    // 로딩 완료 처리
    if (document.readyState === 'complete') {
        setTimeout(() => {
            clearInterval(binaryInterval);
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }, 2000);
    } else {
        window.addEventListener('load', function() {
            setTimeout(() => {
                clearInterval(binaryInterval);
                preloader.style.opacity = '0';
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 500);
            }, 2000);
        });
    }

    // AOS 초기화
    AOS.init({
        duration: 400,
        once: false,
        offset: 10,
        delay: 0,
        disable: function() {
            return $('.card-inner').hasClass('flipped');
        }
    });

    // Tilt.js 최기화 (카드가 존재할 때만)
    if ($('.card').length) {
        $('.card').tilt({
            maxTilt: 0.5,
            glare: true,
            maxGlare: 0.2,
            scale: 1.02
        });
    }

    // Particles.js 초기화
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: {
                    value: 80,
                    density: {
                        enable: true,
                        value_area: 800
                    }
                },
                color: {
                    value: ['#8B1F41', '#FFD700'] // 고려대 크림슨과 골드 컬러
                },
                shape: {
                    type: 'circle'
                },
                opacity: {
                    value: 0.5,
                    random: true,
                    animation: {
                        enable: true,
                        speed: 1,
                        opacity_min: 0.1,
                        sync: false
                    }
                },
                size: {
                    value: 3,
                    random: true,
                    animation: {
                        enable: true,
                        speed: 2,
                        size_min: 0.1,
                        sync: false
                    }
                },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: '#8B1F41',
                    opacity: 0.3,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 1.5,
                    direction: 'none',
                    random: true,
                    straight: false,
                    out_mode: 'out',
                    bounce: false,
                    attract: {
                        enable: true,
                        rotateX: 600,
                        rotateY: 1200
                    }
                }
            },
            interactivity: {
                detect_on: 'canvas',
                events: {
                    onhover: {
                        enable: true,
                        mode: 'grab'
                    },
                    onclick: {
                        enable: true,
                        mode: 'push'
                    },
                    resize: true
                },
                modes: {
                    grab: {
                        distance: 140,
                        line_linked: {
                            opacity: 0.5
                        }
                    },
                    push: {
                        particles_nb: 4
                    }
                }
            },
            retina_detect: true
        });
    }

    // 카드 뒤집기 이벤트
    $('.flip-button, .close-button').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $('.card-inner').toggleClass('flipped');
        
        setTimeout(function() {
            AOS.refresh();
        }, 800);
    });

    // 스크롤 이벤트
    let scrollTimer;
    const backToTop = $('#back-to-top');
    
    $(window).on('scroll', function() {
        if (scrollTimer) {
            clearTimeout(scrollTimer);
        }
        
        scrollTimer = setTimeout(function() {
            if ($(window).scrollTop() > 100) {
                backToTop.fadeIn();
            } else {
                backToTop.fadeOut();
            }
        }, 150);
    });

    // 스크롤 탑 버튼
    backToTop.on('click', function(e) {
        e.preventDefault();
        $('html, body').animate({scrollTop: 0}, 800);
    });
});
