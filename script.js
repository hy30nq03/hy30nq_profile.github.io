document.addEventListener("DOMContentLoaded", function () {
  // 페이지 초기화: 기본값은 항상 영어로 설정
  document.documentElement.setAttribute("lang", "en");

  // 테마 토글 관리
  const themeToggle = document.querySelector(".theme-toggle");
  const body = document.body;

  // 항상 다크모드로 시작, 저장된 값이 있으면 사용
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    body.className = savedTheme;
  } else {
    // 저장된 테마가 없으면 다크모드를 기본값으로 설정
    body.classList.add("dark-mode");
    localStorage.setItem("theme", "dark-mode");
  }

  // 테마 전환 이벤트
  themeToggle.addEventListener("click", () => {
    if (body.classList.contains("dark-mode")) {
      body.classList.remove("dark-mode");
      localStorage.setItem("theme", "");
    } else {
      body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark-mode");
    }
  });

  // 언어 관리
  const langToggle = document.querySelector(".lang-toggle");
  if (langToggle) {
    // 로컬 스토리지에서 언어 설정 가져오기 (없을 경우 강제로 영어 설정)
    let savedLang = localStorage.getItem("language");

    // 강력 새로고침이나 캐시 삭제 후에도 영어를 기본값으로 사용하기 위해
    if (!savedLang || localStorage.getItem("forceEnglish") !== "done") {
      savedLang = "en";
      localStorage.setItem("language", "en");
      localStorage.setItem("forceEnglish", "done");
    }

    // 문서의 lang 속성 설정
    document.documentElement.setAttribute("lang", savedLang);

    // 언어에 맞는 콘텐츠로 업데이트
    applyLanguageContent(savedLang);

    // 언어 전환 버튼 클릭 이벤트
    langToggle.addEventListener("click", function () {
      const currentLang = document.documentElement.getAttribute("lang");
      const newLang = currentLang === "en" ? "ko" : "en";

      // 새 언어 값 저장 및 적용
      document.documentElement.setAttribute("lang", newLang);
      localStorage.setItem("language", newLang);

      // 내용물 업데이트
      applyLanguageContent(newLang);
    });
  }

  // 언어에 따른 콘텐츠 업데이트 함수
  function applyLanguageContent(lang) {
    const elements = document.querySelectorAll(
      "[data-lang-ko], [data-lang-en]"
    );

    // 모든 다국어 요소 업데이트
    elements.forEach((el) => {
      if (lang === "ko" && el.hasAttribute("data-lang-ko")) {
        el.textContent = el.getAttribute("data-lang-ko");
      } else if (lang === "en" && el.hasAttribute("data-lang-en")) {
        el.textContent = el.getAttribute("data-lang-en");
      }
    });

    // 언어 버튼 텍스트 업데이트
    if (langToggle) {
      langToggle.textContent = lang === "en" ? "KO" : "EN";
    }
  }

  // 네비게이션 변수 선언 (한 번만)
  const navItems = document.querySelectorAll(".nav-item");
  const mobileNavItems = document.querySelectorAll(".mobile-nav-item");
  const sections = document.querySelectorAll("section[id]");

  // 스크롤 탑 버튼
  const backToTop = document.getElementById("back-to-top");
  if (backToTop) {
    window.addEventListener("scroll", function () {
      if (window.scrollY > 300) {
        backToTop.style.display = "flex";
      } else {
        backToTop.style.display = "none";
      }
    });

    backToTop.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  // 스크롤 인디케이터 클릭 이벤트
  const scrollIndicator = document.querySelector(".scroll-indicator");
  if (scrollIndicator) {
    scrollIndicator.addEventListener("click", () => {
      const aboutSection = document.getElementById("about");
      if (aboutSection) {
        aboutSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // 모바일 네비게이션 관리 - 중복 코드 제거하고 단순화
  const moreMenuToggle = document.querySelector(".more-nav-toggle");
  const moreMenu = document.querySelector(".more-menu");
  const moreMenuClose = document.querySelector(".more-menu-close");

  // 더보기 메뉴 토글 기능
  if (moreMenuToggle && moreMenu) {
    moreMenuToggle.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("More menu toggle clicked"); // 디버깅용 로그
      moreMenu.classList.toggle("active");

      // 메뉴 열릴 때 배경 스크롤 방지
      if (moreMenu.classList.contains("active")) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    });

    // 닫기 버튼 기능
    if (moreMenuClose) {
      moreMenuClose.addEventListener("click", function () {
        console.log("More menu close clicked"); // 디버깅용 로그
        moreMenu.classList.remove("active");
        document.body.style.overflow = "";
      });
    }

    // 메뉴 항목 클릭 시 메뉴 닫기
    document.querySelectorAll(".more-menu-item").forEach((item) => {
      item.addEventListener("click", function () {
        moreMenu.classList.remove("active");
        document.body.style.overflow = "";
      });
    });
  }

  // 모바일 네비게이션 항목 클릭 처리
  mobileNavItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      if (this.classList.contains("more-nav-toggle")) {
        return; // 더보기 버튼은 별도 처리
      }

      e.preventDefault();

      // 모든 네비게이션 항목에서 active 클래스 제거
      mobileNavItems.forEach((i) => i.classList.remove("active"));

      // 클릭한 항목에 active 클래스 추가
      this.classList.add("active");

      // 해당 섹션으로 스크롤
      const href = this.getAttribute("href");
      if (href) {
        const targetId = href.substring(1);
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
          window.scrollTo({
            top: targetSection.offsetTop - 70,
            behavior: "smooth",
          });
        }
      }
    });
  });

  // 네비게이션 항목 동기화 (스크롤 시)
  function syncNavigationOnScroll() {
    const scrollY = window.scrollY;
    let currentSection = "";

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 100;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute("id");

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        currentSection = sectionId;
      }
    });

    if (currentSection) {
      // 모든 네비게이션 항목에서 active 클래스 제거
      navItems.forEach((i) => i.classList.remove("active"));
      mobileNavItems.forEach((i) => {
        // 더보기 버튼은 제외
        if (!i.classList.contains("more-nav-toggle")) {
          i.classList.remove("active");
        }
      });

      // 현재 섹션에 해당하는 항목 활성화
      const desktopItem = document.querySelector(
        `.nav-item[href="#${currentSection}"]`
      );
      const mobileItem = document.querySelector(
        `.mobile-nav-item[href="#${currentSection}"]`
      );

      if (desktopItem) desktopItem.classList.add("active");
      if (mobileItem) mobileItem.classList.add("active");
    }
  }

  // 스크롤 이벤트에 동기화 함수 연결
  window.addEventListener("scroll", syncNavigationOnScroll);

  // 초기 네비게이션 상태 설정
  syncNavigationOnScroll();
});
