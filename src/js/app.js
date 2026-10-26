import "../scss/style.scss";

// Рецепты лежат статическим файлом рядом со страницами, бэкенд для них больше не нужен
const RECIPES_DATA_URL = "./data/recipes.json";
let recipesRequest = null;

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

function renderYearRecipesSection({year, winners, other}) {
  const HTMLRoot = document.querySelector("#recipes-by-year");

  const root = document.createElement("section");
  root.classList = "recipes-by-year";

  root.innerHTML = `<h2 class="recipes-by-year__title">Рецепты ${year}</h2>`;

  // Победителей может не быть — тогда у года просто одна сетка
  if (winners.length) {
    const winnerElements = winners
      .sort((a, b) => a.place - b.place) // Сортировка мест
      .map(getReceiptElement);

    const winnersSection = document.createElement("section");
    winnersSection.classList = "recipes-by-year__items recipes-by-year__items--winners";
    winnersSection.append(...winnerElements);

    root.insertAdjacentElement("beforeend", winnersSection);
  }

  const otherElements = other.map(getReceiptElement);
  const otherElementSection = document.createElement("section");
  otherElementSection.classList = "recipes-by-year__items";
  otherElementSection.append(...otherElements);

  root.insertAdjacentElement("beforeend", otherElementSection);
  HTMLRoot.insertAdjacentElement("beforeend", root);
}

function getFullUrl(relativeUrl) {
  const isStaging = window.location.hostname.includes('github.io');
  const baseURL = isStaging ? '/halloween.veganrussian.ru' : '';
  return `${baseURL}${relativeUrl}`;
}

function getReceiptElement({image_small_url, image_average_url, title, category, year, id, place}) {
  const root = document.createElement("article");
  root.classList = "recipe";
  root.innerHTML = `
    <a href="${getFullUrl(`/recipe.html#${id}`)}" class="recipe__link" title="Перейти на страницу рецепта: ${title}">
    </a>
    <div class="recipe__wrapper">
      <div class="recipe__image">
        <img class="lazy-img" data-lazy="${image_small_url ?? image_average_url}" alt="Фото рецепта: ${title}">
        ${place ? '<p class="recipe__badge"><span aria-hidden="true">★</span>Победитель</p>' : ""}
      </div>
      <div class="recipe__content ${place ? "recipe__content--winner" : ""}">
        <div>
          <p class="recipe__category">${category}</p>
          <p class="recipe__name">${title}</p>
        </div>
      </div>
    </div>
  `;
  return root;
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
 * Подставляем нужные данные на странице рецепта в соответствующие поля
 */
function setPageData(data) {
  const image = document.querySelector("#recipe-image");
  const title = document.querySelector("#recipe-title");
  const author = document.querySelector("#recipe-author");
  const ingredients = document.querySelector("#recipe-ingredients");
  const tools = document.querySelector("#recipe-tools");
  const steps = document.querySelector("#recipe-steps");
  const description = document.querySelector("#recipe-description");
  const year = document.querySelector("#recipe-year");
  const button = document.querySelector("#recipe-button");

  image.setAttribute("src", data.image_average_url);

  // Плашка победителя — та же, что на карточках. Чистим прошлую: хэш может смениться без перезагрузки
  const imageContainer = image.closest(".recipe-page__image-container");
  imageContainer?.querySelector(".recipe__badge")?.remove();
  if (data.place && imageContainer) {
    imageContainer.insertAdjacentHTML(
      "beforeend",
      '<p class="recipe__badge"><span aria-hidden="true">★</span>Победитель</p>'
    );
  }
  title.innerHTML = data.title;
  author.innerHTML = data.author;
  author.href = data.author_link; // Обновлено для соответствия новой структуре
  year.innerHTML = data.year;
  description.innerHTML = data.description;

  // Исправлено для соответствия структуре данных
  ingredients.innerHTML = data.ingredients.map(ingredient => {
    if (ingredient.url) {
      // Создаём элемент списка с гиперссылкой
      return `<li><a href="${ingredient.url}" target="_blank">${ingredient.name}</a></li>`;
    } else {
      return `<li>${ingredient.name}</li>`;
    }
  }).join('');

  tools.innerHTML = data.tools.map(tool =>
    `<li>${tool}</li>`
  ).join('');

  steps.innerHTML = data.steps.map(step =>
    `<li>${step}</li>`
  ).join('');

  const today = new Date();
  if (button) {
    button.classList[today.getFullYear() === data.year ? "remove" : "add"]("hidden");
  }
}

/**
 * Отрисовываем массив с рецептами на главной странице на основе данных из файла recipes.js с актуальными рецптами
 *
 */
function organizeAndRenderRecipesByYear(recipes) {
  const recipesByYear = recipes.reduce((acc, recipe) => {
    if (recipe.published) { // Проверяем, что рецепт опубликован
      const year = recipe.year;
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(recipe);
    }
    return acc;
  }, {});

  Object.entries(recipesByYear).sort((a, b) => b[0] - a[0]) // Сортировка по годам
    .forEach(([year, recipes]) => {
      const winners = recipes.filter(recipe => recipe.place && recipe.place <= 3);
      const other = recipes.filter(recipe => !recipe.place || recipe.place > 3);
      renderYearRecipesSection({year, winners, other});
    });
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

  const {hash, pathname} = window.location;

  if (pathname.includes("/recipe")) {
    const recipeId = hash.replace("#", "");
    fetchRecipeById(recipeId).catch(console.error);

    window.addEventListener("hashchange", (event) => {
      const {newURL} = event;
      const [, newHash] = newURL.split("#");
      fetchRecipeById(newHash.replace("#", "")).catch(console.error); // Адаптируйте обработчик для использования fetchRecipeById
    });
  } else {
    renderAllRecipes().catch(console.error); // Загружаем рецепты для главной страницы
  }

  handleBurgerMenuLogic();
  setCauldronTextPosition();
  window.addEventListener("resize", setCauldronTextPosition);

};


/**
 * Загружаем статический файл с рецептами. Запрос уходит один раз на страницу,
 * дальше переиспользуется уже полученный список.
 */
async function loadRecipes() {
  if (!recipesRequest) {
    recipesRequest = fetch(RECIPES_DATA_URL).then(response => {
      if (!response.ok) {
        throw new Error('Не удалось загрузить файл с рецептами');
      }
      return response.json();
    });
  }

  return recipesRequest;
}

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

/**
 * Браузер не может прыгнуть по якорю на секцию, которой ещё нет в DOM:
 * рецепты приезжают после загрузки данных, поэтому доводим скролл сами
 */
function scrollToHashTarget() {
  const id = window.location.hash.slice(1);
  if (!id) return;

  const target = document.getElementById(id);
  // Без плавности: это доводка обычного перехода по якорю, а не анимация,
  // к тому же плавный скролл сбивается подгрузкой картинок
  if (target) target.scrollIntoView({behavior: "instant", block: "start"});
}

async function renderAllRecipes() {
  try {
    const recipes = await loadRecipes();

    organizeAndRenderRecipesByYear(recipes);

    document.querySelector('.recipes').style.display = ''; // Показываем секцию с рецептами
    animateItems(".lazy-img", null, true); // Активируем ленивую загрузку для изображений
    scrollToHashTarget(); // Секции ещё не было в момент перехода по якорю — доскролливаем сами
    startSpiders(); // Пауки по фону секции
  } catch (error) {
    console.error("Ошибка при загрузке рецептов: ", error);
  }
}


async function fetchRecipeById(id) {
  // Элемент для отображения, если рецепт не найден
  const warnText = document.querySelector("#recipe-not-found");
  // Контейнер для деталей рецепта
  const receiptHTML = document.querySelector(".recipe-page__receipt");
  try {
    const recipes = await loadRecipes();
    // В ссылках используется id, но раньше рецепт открывался и по slug — оставляем оба варианта
    const recipe = recipes.find(item => String(item.id) === String(id) || item.slug === id);
    if (!recipe) {
      throw new Error(`Рецепт с ID ${id} не найден`);
    }

    // Поскольку рецепт успешно загружен, скрываем сообщение об ошибке и показываем контент
    if (warnText) warnText.classList.add("hidden");
    if (receiptHTML) receiptHTML.classList.remove("hidden");

    setPageData(recipe); // Отображение деталей рецепта
  } catch (error) {
    console.error("Ошибка при загрузке рецепта: ", error);
    // Показываем сообщение об ошибке и скрываем контент рецепта
    if (warnText) warnText.classList.remove("hidden");
    if (receiptHTML) receiptHTML.classList.add("hidden");
  }
}
