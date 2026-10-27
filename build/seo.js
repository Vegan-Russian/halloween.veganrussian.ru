// Всё про адреса, тексты для поисковиков и schema.org — общее для шаблонов и для генерации sitemap/robots/llms.txt
const fs = require("fs");
const path = require("path");

const RECIPES_PATH = path.resolve(__dirname, "../src/data/recipes.json");

// Единственное место, где читаем рецепты: снятые с публикации на сайт не попадают
const readRecipes = () => JSON.parse(fs.readFileSync(RECIPES_PATH, "utf-8")).filter(recipe => recipe.published !== false);

// Прод — свой домен. В форке на GitHub Pages сайт живёт по BASE_URL, тогда и ссылки строим от него
const SITE_URL = (process.env.BASE_URL || "https://halloween.veganrussian.ru").replace(/\/$/, "");
const SITE_NAME = "Vegan Halloween";
const SITE_TITLE = "Vegan Halloween — архив конкурса веганских рецептов на Хэллоуин";
const SITE_DESCRIPTION =
  "Жуткие веганские рецепты на Хэллоуин: выпечка, супы, закуски и десерты с конкурса Vegan Russian. " +
  "Рецепты-победители и все участники с 2020 года — с ингредиентами и пошаговым приготовлением.";
const CONTEST_URL = "https://t.me/+1IFVq_AYUN1mZTQ6";

const WEBSITE_ID = `${SITE_URL}/#website`;
const ORGANIZATION_ID = `${SITE_URL}/#organization`;

const absolute = pathname => `${SITE_URL}/${pathname.replace(/^\.?\//, "")}`;
const recipePath = recipe => `recipe-${recipe.slug}.html`;
const recipeURL = recipe => absolute(recipePath(recipe));
const recipeImage = (recipe, small = false) => `images/recipes/${recipe.slug}${small ? "-small" : ""}.webp`;

// Ингредиенты и шаги в данных с хвостовыми запятыми — для разметки они лишние
const cleanItem = text => String(text).trim().replace(/[\s,;.]+$/, "");
const collapse = text => String(text || "").replace(/\s+/g, " ").trim();
const paragraphs = text => String(text || "").split(/\n+/).map(item => item.trim()).filter(Boolean);

const truncate = (text, limit = 158) => {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:.—-]+$/, "")}…`;
};

const groupByYear = recipes => {
  const years = [...new Set(recipes.map(recipe => recipe.year))].sort((a, b) => b - a);
  return years.map(year => {
    const all = recipes.filter(recipe => recipe.year === year);
    return {
      year,
      winners: all.filter(recipe => recipe.place).sort((a, b) => a.place - b.place),
      others: all.filter(recipe => !recipe.place)
    };
  });
};

const recipeTitle = recipe => `${recipe.title} — веганский рецепт на Хэллоуин | ${SITE_NAME}`;

// Сначала что это за рецепт (то, что ищут), потом его «легенда»; без легенды — что внутри страницы
const recipeDescription = recipe => {
  const lead = `${recipe.title} — веганский рецепт на Хэллоуин (${recipe.category.toLowerCase()}, ${recipe.year}).`;
  const story = collapse(recipe.description);
  return truncate(story ? `${lead} ${story}` : `${lead} Ингредиенты, инвентарь и пошаговое приготовление.`);
};

const organization = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "Vegan Russian",
  url: "https://veganrussian.ru/",
  logo: {"@type": "ImageObject", url: absolute("images/vr-logo.png")},
  sameAs: ["https://veganrussian.ru/"]
};

const website = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: `${SITE_URL}/`,
  name: SITE_NAME,
  alternateName: "Веганский Хэллоуин",
  description: SITE_DESCRIPTION,
  inLanguage: "ru",
  publisher: {"@id": ORGANIZATION_ID}
};

const homeSchema = recipes => ({
  "@context": "https://schema.org",
  "@graph": [
    organization,
    website,
    {
      "@type": "CollectionPage",
      "@id": `${SITE_URL}/#page`,
      url: `${SITE_URL}/`,
      name: SITE_TITLE,
      description: SITE_DESCRIPTION,
      inLanguage: "ru",
      isPartOf: {"@id": WEBSITE_ID},
      about: {"@type": "Thing", name: "Веганские рецепты на Хэллоуин"},
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: recipes.length,
        itemListElement: recipes.map((recipe, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: recipeURL(recipe),
          name: recipe.title
        }))
      }
    }
  ]
});

const recipeSchema = recipe => {
  const url = recipeURL(recipe);
  const author = {"@type": "Person", name: recipe.author};
  if (recipe.author_link) author.url = recipe.author_link;

  const schema = {
    "@type": "Recipe",
    "@id": `${url}#recipe`,
    name: recipe.title,
    url,
    image: [absolute(recipeImage(recipe))],
    author,
    description: recipeDescription(recipe),
    recipeCategory: recipe.category,
    keywords: ["веганский рецепт", "Хэллоуин", recipe.category.toLowerCase(), `${SITE_NAME} ${recipe.year}`].join(", "),
    suitableForDiet: "https://schema.org/VeganDiet",
    recipeIngredient: recipe.ingredients.map(item => cleanItem(item.name)).filter(Boolean),
    recipeInstructions: recipe.steps.map((text, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      text: cleanItem(text)
    })),
    inLanguage: "ru",
    isPartOf: {"@id": WEBSITE_ID},
    publisher: {"@id": ORGANIZATION_ID}
  };
  if (recipe.tools && recipe.tools.length) schema.tool = recipe.tools.map(cleanItem).filter(Boolean);
  if (recipe.place) schema.award = `${recipe.place} место конкурса ${SITE_NAME} ${recipe.year}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      website,
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: recipeTitle(recipe),
        description: recipeDescription(recipe),
        inLanguage: "ru",
        isPartOf: {"@id": WEBSITE_ID},
        primaryImageOfPage: {"@type": "ImageObject", url: absolute(recipeImage(recipe))},
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            {"@type": "ListItem", position: 1, name: "Главная", item: `${SITE_URL}/`},
            {"@type": "ListItem", position: 2, name: `Рецепты ${recipe.year}`, item: `${SITE_URL}/#recipes-${recipe.year}`},
            {"@type": "ListItem", position: 3, name: recipe.title, item: url}
          ]
        },
        mainEntity: {"@id": `${url}#recipe`}
      },
      schema
    ]
  };
};

// JSON-LD внутри <script>: экранируем «<», чтобы текст рецепта не мог закрыть тег
const jsonLd = data => JSON.stringify(data).replace(/</g, "\\u003c");

const sitemap = recipes => {
  const entry = (loc, image) =>
    `  <url>\n    <loc>${loc}</loc>${image ? `\n    <image:image><image:loc>${image}</image:loc></image:image>` : ""}\n  </url>`;
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    entry(`${SITE_URL}/`),
    ...recipes.map(recipe => entry(recipeURL(recipe), absolute(recipeImage(recipe)))),
    entry(absolute("novella.html")),
    "</urlset>",
    ""
  ].join("\n");
};

// Пускаем всех, в том числе поисковые и AI-краулеры: сайт для того и сделан, чтобы рецепты находили
const robots = () => ["User-agent: *", "Allow: /", "", `Sitemap: ${SITE_URL}/sitemap.xml`, ""].join("\n");

// llms.txt (llmstxt.org): короткая карта сайта в Markdown для языковых моделей
const llms = recipes =>
  [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "Конкурс ежегодно проводит Vegan Russian (https://veganrussian.ru/). Все рецепты без продуктов животного происхождения.",
    `Конкурс 2026: ${CONTEST_URL}`,
    "",
    ...groupByYear(recipes).flatMap(({year, winners, others}) => [
      `## Рецепты ${year}`,
      "",
      ...[...winners, ...others].map(
        recipe =>
          `- [${recipe.title}](${recipeURL(recipe)}): ${recipe.category}` +
          `${recipe.place ? `, ${recipe.place} место` : ""}, автор — ${recipe.author}`
      ),
      ""
    ])
  ].join("\n");

module.exports = {
  RECIPES_PATH,
  readRecipes,
  SITE_URL,
  SITE_NAME,
  SITE_TITLE,
  SITE_DESCRIPTION,
  CONTEST_URL,
  absolute,
  recipePath,
  recipeURL,
  recipeImage,
  recipeTitle,
  recipeDescription,
  cleanItem,
  paragraphs,
  groupByYear,
  homeSchema,
  recipeSchema,
  jsonLd,
  sitemap,
  robots,
  llms
};
