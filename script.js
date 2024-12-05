// 페이지가 이미 로드되었는지 확인
if (document.readyState === 'complete') {
    $('#preloader').fadeOut('slow');
} else {
    $(window).on('load', function() {
        setTimeout(function() {
            $('#preloader').fadeOut('slow');
        }, 500);
    });
}

$(document).ready(function() {
    // AOS 애니메이션 설정 수정
    AOS.init({
        duration: 400,
        once: false,
        offset: 10,
        delay: 0,
        disable: function() {
            return $('.card-inner').hasClass('flipped');
        }
    });

    // Tilt.js 최적화
    $('.card').tilt({
        maxTilt: 0.5,
        glare: true,
        maxGlare: 0.2,
        scale: 1.02
    });

    // 파티클 JS 최적화
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
                value: ['#e74c3c', '#ffffff']
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
                random: true
            },
            line_linked: {
                enable: true,
                distance: 150,
                color: '#e74c3c',
                opacity: 0.2,
                width: 1
            },
            move: {
                enable: true,
                speed: 2,
                direction: 'none',
                random: true,
                straight: false,
                out_mode: 'out',
                bounce: false,
            }
        },
        interactivity: {
            detect_on: 'canvas',
            events: {
                onhover: {
                    enable: true,
                    mode: 'repulse'
                },
                onclick: {
                    enable: true,
                    mode: 'push'
                },
                resize: true
            },
            modes: {
                repulse: {
                    distance: 100,
                    duration: 0.4
                },
                push: {
                    particles_nb: 4
                }
            }
        },
        retina_detect: true
    });

    // 카드 뒤집기 시 AOS 리프레시
    $('.flip-button, .close-button').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $('.card-inner').toggleClass('flipped');
        
        // 카드가 뒤집힌 후 AOS 리프레시
        setTimeout(function() {
            AOS.refresh();
        }, 800); // 카드 뒤집기 애니메이션 시간과 동일하게 설정
    });

    // 스크롤 이벤트 최적화
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

    // 부드러운 스크롤
    backToTop.on('click', function(e) {
        e.preventDefault();
        $('html, body').animate({scrollTop: 0}, 800);
    });
});
