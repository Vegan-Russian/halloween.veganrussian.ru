const path = require("path");
const pug = require("pug");
const seo = require("./seo");

/**
 * Pug → HTML. Своё вместо pug-html-loader: тому не передать данные под конкретную
 * страницу, а у нас одна страница на каждый рецепт — её slug приходит в query шаблона
 * (`templates/recipe.pug?recipe=<slug>`). Рецепты читаем на каждую сборку,
 * чтобы правки в JSON подхватывались дев-сервером без перезапуска
 */
module.exports = function pugLoader(source) {
  const {data = {}} = this.getOptions();
  const recipes = seo.readRecipes();
  this.addDependency(seo.RECIPES_PATH);

  const slug = new URLSearchParams(this.resourceQuery.slice(1)).get("recipe");
  const recipe = slug ? recipes.find(item => item.slug === slug) : null;
  if (slug && !recipe) throw new Error(`Нет рецепта со slug «${slug}»`);

  const template = pug.compile(source, {filename: this.resourcePath, basedir: path.resolve(__dirname, "../src/pug")});
  template.dependencies.forEach(file => this.addDependency(file));

  return template({...data, seo, recipes, recipesByYear: seo.groupByYear(recipes), recipe});
};
