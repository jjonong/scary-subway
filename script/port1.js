// 배경 음악 파일 경로 설정
const bgm = new Audio;
// const bgm = new Audio('./audio/Twin Lynches - Density & Time.mp3');
bgm.loop = true; // 반복 재생 설정
bgm.volume = 0.3; // 음량 조절 (선택 사항)

// 시작 화면 요소 가져오기
const startScreen = document.getElementById('start-screen');

startScreen.addEventListener('click', () => {
    // 배경 음악 재생
    bgm.play()
        .then(() => {
            console.log('음악이 재생되었습니다.');
        })
        .catch(error => {
            console.error('음악 재생 실패:', error);
        });
    
    // 시작 화면 숨기기
    gsap.to(startScreen, {
        duration: 0.5,
        opacity: 0,
        onComplete: () => {
            startScreen.style.display = 'none';
        }
    });
});


//세로줄

const canvas = document.getElementById('crt-scanlines');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// 세로 줄 생성
// const lines = [];
// for (let i = 0; i < canvas.width; i += 80) {
//   lines.push({
//     x: i,
//     baseX: i,             
//     offset: Math.random() * 1000,
//     speed: 0.002 + Math.random() * 0.01,
//     alpha: 0.03 + Math.random() * 0.15 // 투명도 랜덤
//   });
// }
const lines = [
  {
    x: window.innerWidth * 0.7,              // 시작 위치 (화면 중앙)
    baseX: window.innerWidth * 0.7,          // 기준 위치
    offset: Math.random() * 1000,     // 움직임 시작위치 랜덤
    speed: 0.01, // 움직임 속도
    alpha: 0.2   // 투명도 랜덤
  }
];

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  lines.forEach(line => {
    // 좌우 흔들림
    line.x = line.baseX + Math.sin(Date.now() * line.speed + line.offset) * 20;

    ctx.strokeStyle = `rgba(255,255,255,${line.alpha})`;
    ctx.beginPath();
    ctx.moveTo(line.x, 0);
    ctx.lineTo(line.x, canvas.height);
    ctx.stroke();
  });

  requestAnimationFrame(draw);
}

draw();


//timer

const timerEl = document.getElementById('timer');
let timerStarted = false;

// 시간 포맷 함수 (MM:SS:CS, CS = 1/100초)
function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(Math.floor(totalSeconds % 60)).padStart(2, '0');
  const centiseconds = String(Math.floor((totalSeconds % 1) * 100)).padStart(2, '0');
  return `${minutes}:${seconds}:${centiseconds}`;
}

// GSAP으로 부드러운 카운트업
function startTimer(durationMinutes = 1) {
  let elapsed = { t: 0 }; // 객체로 만들어 GSAP가 직접 tween 가능하게
  const durationSeconds = durationMinutes * 60;

  gsap.to(elapsed, {
    t: durationSeconds,
    duration: durationSeconds,
    ease: "none",
    onUpdate: () => {
      timerEl.textContent = formatTime(elapsed.t);
    }
  });
}

// 화면 진입 시 타이머 시작
const section = document.querySelector('.timer');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting && !timerStarted){
      timerStarted = true;
      gsap.to(section, { opacity:1, duration:1 });
      startTimer(1); // 1분 예시
    }
  });
}, { threshold: 0.5 });

observer.observe(section);


//scroll triger

gsap.registerPlugin(ScrollTrigger);

const sections = Array.from(document.querySelectorAll('section'));
const container = document.querySelector('.container');
const freeSection = document.querySelector('.free-scroll');
const freeInner = freeSection.querySelector('.free-inner');

let currentIndex = 0;
let isAnimating = false;
let freeScrollPos = 0;

// free-scroll maxScroll 계산
function getFreeMaxScroll() {
    return Math.max(freeInner.scrollHeight - freeSection.clientHeight, 0);
}

// 섹션 이동
function goToSection(index) {
  if (index < 0 || index >= sections.length) return;
  if (isAnimating) return;
  isAnimating = true;

  const targetSection = sections[index];
  const targetY = targetSection.offsetTop;

  gsap.to(container, {
    y: -targetY,
    duration: 0.9,
    ease: "power2.inOut",
    onComplete: () => {
      sections.forEach((s, i) => s.classList.toggle('active', i === index));
      currentIndex = index;
      isAnimating = false;

      if (targetSection.classList.contains('free-scroll')) {
        freeScrollPos = 0;
        gsap.set(freeInner, { y: 0 });
      }

      // 마지막 섹션에 도착하면 최종 애니메이션 시작
      if (targetSection.id === 'warning') {
        finalAnimation.play();
      }
    }
  });
}

// 페이지 단위 스크롤
window.addEventListener('wheel', e => {
    if (isAnimating) return;
    const cur = sections[currentIndex];
    if(cur.classList.contains('text')){
        document.getElementById('frame').classList.add('active');
    }else{ 
        document.getElementById('frame').classList.remove('active');
    }
    if (cur.classList.contains('free-scroll')) return; // 내부 스크롤 처리

    e.preventDefault();
    if (e.deltaY > 0) goToSection(currentIndex + 1);
    else goToSection(currentIndex - 1);
}, { passive: false });

// free-scroll 내부 스크롤 처리
freeSection.addEventListener('wheel', e => {
    e.preventDefault();
    if (isAnimating) return;

    const delta = e.deltaY;
    const maxScroll = getFreeMaxScroll();
    freeScrollPos = Math.min(Math.max(freeScrollPos + delta, 0), maxScroll);

    gsap.to(freeInner, { y: -freeScrollPos, duration: 0.5, ease: "power2.out" });

    if (freeScrollPos <= 0 && delta < 0) goToSection(currentIndex - 1);
    if (freeScrollPos >= maxScroll && delta > 0) goToSection(currentIndex + 1);
}, { passive: false });

// 키보드 지원
window.addEventListener('keydown', e => {
    if (isAnimating) return;
    const cur = sections[currentIndex];

    if (e.key === 'ArrowDown') {
        if (cur.classList.contains('free-scroll')) {
            if (freeScrollPos >= getFreeMaxScroll()) goToSection(currentIndex + 1);
        } else goToSection(currentIndex + 1);
    }
    if (e.key === 'ArrowUp') {
        if (cur.classList.contains('free-scroll')) {
            if (freeScrollPos <= 0) goToSection(currentIndex - 1);
        } else goToSection(currentIndex - 1);
    }
});

// 창 크기 변경 시 위치 보정
window.addEventListener('resize', () => {
    gsap.set(container, { y: sections[currentIndex].offsetTop });
});

// 모든 요소 로드 후 초기화
window.addEventListener('load', () => {
    freeScrollPos = 0;
    gsap.set(freeInner, { y: 0 });
});

const tvOverlay = document.querySelector('.tv-effect-overlay');
const warningText = document.querySelector('.warning_sub_text span');
// TV가 꺼지는 애니메이션 타임라인
const tvOffTimeline = gsap.timeline({ paused: true });

// 경고 텍스트 애니메이션과 TV 꺼짐 효과를 통합한 새로운 타임라인
const finalAnimation = gsap.timeline({ paused: true });

// 1. 경고 메시지 중 '3...2..' 텍스트를 순차적으로 보여줍니다.
finalAnimation
  .to(warningText, { duration: 0.5, opacity: 1, stagger: 0.5 })
  // 2. 텍스트가 모두 나타난 후 TV 꺼짐 애니메이션을 실행합니다.
  .add(tvOffTimeline.play(), "+=0.5");

// 노이즈가 나타나면서 스크린이 어두워지는 효과
tvOffTimeline
  .to( document.getElementById('main'), {
    duration: 0.5,
    opacity: 0,
    ease: "power2.easeOut"
  })
  .to(tvOverlay,{ 
    duration: 0.5, 
    opacity: 1, 
    ease: "power2.easeOut"
  })
  // 스크린이 선으로 축소되는 효과
  .to(tvOverlay, { 
    duration: 0.4, 
    scaleY: 0.05, 
    ease: "power2.easeOut" 
  })
  .to(canvas,{
    opacity: 0,
    ease: "power2.easeIn"
  })
  // 섬광 효과
  .to(tvOverlay, { 
    duration: 0.1, 
    backgroundColor: '#fff', 
    opacity: 1 
  }, "-=0.1")
  // 완전히 꺼지는 효과
  .to(tvOverlay, {
    duration: 0.3,
    scaleY: 0,
    opacity: 0,
    backgroundColor: '#000',
    ease: "power2.easeIn"
  });
