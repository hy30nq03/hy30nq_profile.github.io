// DOM이 완전히 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
    // 테마 토글 관리
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.body;
    
    // 저장된 테마 확인
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.className = savedTheme;
    }
    
    // 테마 전환 이벤트
    themeToggle.addEventListener('click', () => {
        if (body.classList.contains('dark-mode')) {
            body.classList.remove('dark-mode');
            localStorage.setItem('theme', '');
        } else {
            body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark-mode');
        }
    });

    // 한영 전환 버튼 관리
    const langToggle = document.querySelector('.lang-toggle');
    if (langToggle) {
        // 저장된 언어 확인
        const savedLang = localStorage.getItem('language') || 'ko';
        document.documentElement.setAttribute('lang', savedLang);
        
        // 언어에 따른 콘텐츠 표시
        updateLanguageContent(savedLang);
        
        // 언어 전환 이벤트
        langToggle.addEventListener('click', function() {
            const currentLang = this.innerText;
            const newLang = currentLang === 'EN' ? 'KO' : 'EN';
            this.innerText = newLang;
            
            document.querySelectorAll('[data-lang-ko], [data-lang-en]').forEach(el => {
                if (newLang === 'KO') {
                    el.innerText = el.getAttribute('data-lang-ko');
                } else {
                    el.innerText = el.getAttribute('data-lang-en');
                }
            });
            
            // 언어 변경 후 레이아웃 업데이트를 위한 지연 설정
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 100);
        });
    }
    
    // 언어에 따른 콘텐츠 업데이트
    function updateLanguageContent(lang) {
        const elements = document.querySelectorAll('[data-lang-ko], [data-lang-en]');
        
        elements.forEach(el => {
            if (lang === 'ko' && el.hasAttribute('data-lang-ko')) {
                el.textContent = el.getAttribute('data-lang-ko');
            } else if (lang === 'en' && el.hasAttribute('data-lang-en')) {
                el.textContent = el.getAttribute('data-lang-en');
            }
        });
        
        // 한영 버튼 텍스트 업데이트
        if (langToggle) {
            langToggle.textContent = lang === 'ko' ? 'EN' : 'KO';
        }
    }

    // 네비게이션 활성화 관리
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-item');
    
    // 초기 활성 상태 설정
    setActiveNavItem();
    
    // 네비게이션 활성 항목 설정
    function setActiveNavItem() {
        let scrollY = window.scrollY;
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                currentSection = sectionId;
                
                // 모든 네비게이션 항목 비활성화
                navItems.forEach(item => {
                    item.classList.remove('active');
                });
                
                // 현재 섹션에 해당하는 네비게이션 항목 활성화
                const activeNavItem = document.querySelector(`.nav-item[href="#${currentSection}"]`);
                if (activeNavItem) {
                    activeNavItem.classList.add('active');
                }
            }
        });
        
        // 스크롤 위치가 맨 위인 경우 첫 번째 네비게이션 항목 활성화
        if (scrollY < 100 && navItems.length > 0) {
            navItems.forEach(item => {
                item.classList.remove('active');
            });
            navItems[0].classList.add('active');
        }
    }
    
    // 스크롤 이벤트
    window.addEventListener('scroll', setActiveNavItem);

    // "더 보기" 버튼 관리
    const seeMoreButtons = document.querySelectorAll('.see-more-button');
    
    seeMoreButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetContent = document.getElementById(targetId);
            
            if (targetContent.style.display === 'block' || targetContent.style.display === 'grid') {
                targetContent.style.display = 'none';
                this.classList.remove('active');
            } else {
                targetContent.style.display = 'grid';
                this.classList.add('active');
            }
        });
    });

    // 스크롤 탑 버튼
    const backToTop = document.getElementById('back-to-top');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTop.style.display = 'flex';
        } else {
            backToTop.style.display = 'none';
        }
    });
    
    backToTop.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // 스크롤 인디케이터 클릭 이벤트
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            const aboutSection = document.getElementById('about');
            if (aboutSection) {
                aboutSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // 네비게이션 클릭 이벤트 - 부드러운 스크롤 및 활성화
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            // 모든 네비게이션 항목 비활성화
            navItems.forEach(item => {
                item.classList.remove('active');
            });
            
            // 클릭한 네비게이션 항목 활성화
            link.classList.add('active');
            
            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 페이지 로드 시 hidden-content 초기 표시
    document.querySelectorAll('.hidden-content').forEach(content => {
        content.style.display = 'grid';
    });

    // see-more 버튼 active 상태로 설정
    document.querySelectorAll('.see-more-button').forEach(button => {
        button.classList.add('active');
    });
});
