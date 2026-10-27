import "../scss/style.scss";

/**
 * Блочим скролл на странице, добавляем падинг, чтобы страница не дёргалась при исчезновении скроллбара
 * @param {boolean} needToLock
 */
function lockScroll(needToLock = true) {
  if (needToLock) {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.position = "fixed";
  } else {
    document.body.style.removeProperty("padding-right");
    document.body.style.removeProperty("position");
  }

  document.body.classList[needToLock ? "add" : "remove"]("scroll-lock");
}

/**
 * Функция для установления текста на главной четко по середине котла для мобильных экранов.
 * Заодно устанавливается высота для всей секции, чтобы у обёртки была зависимость от высоты котла,
 * который расположен абсолютом, вызывая @function setPromoMobileHeight
 */
function setCauldronTextPosition() {
  const text = document.querySelector(".promo__text");
  if (!text) return;
  if (window.matchMedia("(min-width: 766.98px)").matches) {
    text.style = "";
    setPromoMobileHeight(false);
    return;
  }
  const cauldron = document.querySelector(".cauldron-wrapper");
  const cRect = cauldron.getBoundingClientRect();
  const tRect = text.getBoundingClientRect();
  text.style.top =
    cRect.top + window.pageYOffset + cRect.height / 2 - tRect.height / 2 + "px";
  text.style.maxWidth = cRect.width - 80 + "px";
  text.classList.add("promo__text--visible");
  setPromoMobileHeight();
}

function setPromoMobileHeight(isMobile = true) {
  const cauldron = document.querySelector("#cauldron");
  const promo = document.querySelector(".promo__content");
  const {height} = cauldron.getBoundingClientRect();
  if (isMobile) {
    promo.style.height = height + 90 + "px";
    return;
  }
  promo.style.removeProperty("height");
}

/**
 * Обрабатываем логику открытия-закрытия мобильного меню в шапке
 */
function handleBurgerMenuLogic() {
  const $burger = document.querySelector("#burger-trigger");
  const $menu = document.querySelector("#mobile-menu");
  const $menuCloser = document.querySelector("#menu-closer");

  if ($burger && $menu) {
    $burger.addEventListener("click", function () {
      $menu.classList.toggle("active");
      $menuCloser.setAttribute("aria-hidden", "false");
      lockScroll();
    });

    const closeMenu = () => {
      $menuCloser.setAttribute("aria-hidden", "true");
      $burger.classList.remove("active");
      $menu.classList.remove("active");
      lockScroll(false);
    };

    $menuCloser.addEventListener("click", closeMenu);

    $menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });
  }
}

/**
 * Функция-наблюдатель. По достижении определённых HTML-элементов мы присваиваем им заданные классы или
 * класс по умолчанию reached, для анимирования элементов при скролле
 * @param {string} classToWatch
 * @param {IntersectionObserverInit} customSettings
 */
function animateItems(classToWatch, customSettings = null, lazyLoad = false) {
  let options = customSettings ?? {
    root: null,
    rootMargin: "30% 0% 30% 0%",
    threshold: 0,
  };

  const loadImage = (image) => {
    image.src = image.dataset.lazy; // Заменяем data-lazy на src
    image.removeAttribute('data-lazy');
  };

  const callback = (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const classToSet = el.dataset.class;

        if (lazyLoad && el.hasAttribute('data-lazy')) {
          loadImage(el);
        } else {
          el.classList.add(classToSet ?? 'reached');
        }

        el.classList.remove(classToWatch.substring(1));
        observer.unobserve(el);
      }
    });
  };

  let observer = new IntersectionObserver(callback, options);

  const toAnimateItems = document.querySelectorAll(classToWatch);

  if (toAnimateItems) {
    toAnimateItems.forEach((item) => {
      observer.observe(item);
    });
  }
}

window.onload = () => {
  document.body.classList.remove("transition-lock");
  animateItems(".observed");

  startSpiders(); // Пауки по фону секции с рецептами — на главной

  handleBurgerMenuLogic();
  setCauldronTextPosition();
  window.addEventListener("resize", setCauldronTextPosition);

};


// Гифка бегущего паука. На ней он смотрит вверх, а угол движения считается от направления «вправо»
const SPIDER_GIF = "./images/spider.gif";
const SPIDER_GIF_HEADING = -90;

// Скорость в длинах тела в секунду: так шаг лап на гифке совпадает с ходом при любом размере паука.
// Больше — бежит быстрее, лапы начинают «буксовать»; меньше — проскальзывает назад
const SPIDER_SPEED = 3.5;

/**
 * Пауки на фоне секции с рецептами: раз в 9-22 секунды один переползает секцию
 * и удаляется. Слой под карточками и с pointer-events: none, так что кликам не мешает
 */
function startSpiders() {
  const layer = document.querySelector("#spiders");
  if (!layer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const MAX_AT_ONCE = 2;
  const random = (min, max) => min + Math.random() * (max - min);
  new Image().src = SPIDER_GIF;
  let isVisible = false;

  // Секция высотой в несколько экранов: пока она за кадром, пауков не выпускаем
  new IntersectionObserver(
    ([entry]) => {
      const wasVisible = isVisible;
      isVisible = entry.isIntersecting;
      // Первый паук вскоре после того, как до секции долистали
      if (isVisible && !wasVisible) setTimeout(() => isVisible && releaseSpider(), random(1500, 4000));
    },
    {rootMargin: "10% 0px"}
  ).observe(layer);

  // Линейка для замеров кривой. Держим её в документе: вне его не все браузеры считают геометрию
  const SVG_NS = "http://www.w3.org/2000/svg";
  const ruler = document.createElementNS(SVG_NS, "svg");
  const rulerPath = document.createElementNS(SVG_NS, "path");
  ruler.setAttribute("aria-hidden", "true");
  ruler.style.cssText = "position: absolute; width: 0; height: 0; overflow: hidden;";
  ruler.append(rulerPath);
  layer.append(ruler);

  // Кривую раскладываем на точки и анимируем transform: такую анимацию браузер отдаёт видеокарте,
  // а offset-path и пересчёт позиции на каждом кадре — основному потоку
  const pathKeyframes = d => {
    rulerPath.setAttribute("d", d);
    const length = rulerPath.getTotalLength();
    const steps = Math.max(2, Math.ceil(length / 12));
    const frames = [];
    let previousAngle = 0;

    for (let i = 0; i <= steps; i++) {
      const at = (length * i) / steps;
      const point = rulerPath.getPointAtLength(at);
      // Направление движения по соседней точке; в самом конце пути смотрим назад
      const near = rulerPath.getPointAtLength(at < length ? Math.min(length, at + 1) : at - 1);
      const [dx, dy] = at < length ? [near.x - point.x, near.y - point.y] : [point.x - near.x, point.y - near.y];
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      // Без этого на переходе через ±180° паук делал бы полный оборот на месте
      if (i > 0) {
        while (angle - previousAngle > 180) angle -= 360;
        while (angle - previousAngle < -180) angle += 360;
      }
      previousAngle = angle;

      frames.push({
        transform: `translate(${point.x.toFixed(1)}px, ${point.y.toFixed(1)}px) translate(-50%, -50%) rotate(${(angle - SPIDER_GIF_HEADING).toFixed(1)}deg)`
      });
    }

    return {frames, length};
  };
  const pick = list => list[Math.floor(Math.random() * list.length)];

  // Точка входа/выхода за одной из четырёх границ видимой части секции
  const edgePoint = (edge, area, size) => {
    const margin = size * 2;
    switch (edge) {
      case "top":
        return {x: random(0, area.width), y: area.top - margin};
      case "bottom":
        return {x: random(0, area.width), y: area.bottom + margin};
      case "right":
        return {x: area.width + margin, y: random(area.top, area.bottom)};
      default:
        return {x: -margin, y: random(area.top, area.bottom)};
    }
  };

  // Блуждающая кривая: пара случайных точек по дороге и гладкие стыки через S-сегменты
  const wanderPath = (from, to, area) => {
    const steps = Math.round(random(2, 4));
    const waypoints = Array.from({length: steps}, () => ({
      x: random(area.width * 0.1, area.width * 0.9),
      y: random(area.top, area.bottom)
    }));
    const sway = () => random(-260, 260);
    const round = value => Math.round(value);

    const [first, ...rest] = [...waypoints, to];
    let d = `M ${round(from.x)} ${round(from.y)}`;
    d += ` C ${round(from.x + sway())} ${round(from.y + sway())},`;
    d += ` ${round(first.x + sway())} ${round(first.y + sway())},`;
    d += ` ${round(first.x)} ${round(first.y)}`;

    return rest.reduce(
      (path, point) =>
        `${path} S ${round(point.x + sway())} ${round(point.y + sway())}, ${round(point.x)} ${round(point.y)}`,
      d
    );
  };

  const releaseSpider = () => {
    const size = Math.round(random(26, 46));
    const width = layer.offsetWidth;

    // Ползаем в той полосе секции, которая сейчас на экране, иначе паука никто не увидит
    const {top, height} = layer.getBoundingClientRect();
    const area = {
      width,
      top: Math.max(size, -top + size),
      bottom: Math.max(Math.max(size, -top + size), Math.min(height - size, -top + window.innerHeight - size))
    };

    const edges = ["left", "right", "top", "bottom"];
    // Уйти может в любую сторону, хоть обратно туда, откуда пришёл
    const d = wanderPath(edgePoint(pick(edges), area, size), edgePoint(pick(edges), area, size), area);
    const {frames, length} = pathKeyframes(d);

    const spider = document.createElement("div");
    spider.className = "spider";
    spider.style.setProperty("--size", `${size}px`);
    spider.style.transform = frames[0].transform; // чтобы до первого кадра не мелькнул в углу
    spider.innerHTML = `<img class="spider__body" src="${SPIDER_GIF}" alt="">`;
    layer.append(spider);

    // Длительность по длине пути и размеру: скорость постоянная, шаг совпадает с гифкой
    const crawl = spider.animate(frames, {
      duration: (length / (size * SPIDER_SPEED)) * 1000,
      easing: "linear",
      fill: "forwards"
    });
    crawl.onfinish = () => spider.remove();
  };

  const scheduleNext = () => {
    setTimeout(() => {
      if (isVisible && layer.querySelectorAll(".spider").length < MAX_AT_ONCE) releaseSpider();
      scheduleNext();
    }, random(9000, 22000));
  };

  scheduleNext();
}
